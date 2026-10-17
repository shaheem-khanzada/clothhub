import { MeResponseSchema } from '@clothhub/shared';
import { exportJWK, generateKeyPair, SignJWT } from 'jose';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { createApp } from '../../src/app.js';
import { createAuth } from '../../src/modules/auth/auth.js';
import { resetAccounts, useTestDatabase } from '../helpers/db.js';

/*
 * Sign in with Google, end to end, with Google played by this file: its
 * public keys, which Better Auth fetches to check identity tokens.
 */

const { db, pool } = useTestDatabase();

const WEB_CLIENT_ID = 'web-client.apps.googleusercontent.com';
const FROM_APP = { 'Content-Type': 'application/json', 'expo-origin': 'clothhub://' };

let googleKey: CryptoKey;
let googleJwks: { keys: unknown[] };

const app = createApp({
  db,
  auth: createAuth({
    db,
    config: {
      baseUrl: 'http://localhost:3000',
      secret: 'test-secret-that-is-at-least-32-characters',
      google: { clientId: WEB_CLIENT_ID, clientSecret: null },
      apple: null,
      devOrigins: true,
    },
  }),
});

beforeAll(async () => {
  const signing = await generateKeyPair('RS256', { extractable: true });
  googleKey = signing.privateKey;
  googleJwks = { keys: [{ ...(await exportJWK(signing.publicKey)), kid: 'google-key-1', alg: 'RS256', use: 'sig' }] };

  const realFetch = globalThis.fetch;
  vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = input instanceof Request ? input.url : String(input);
    return url === 'https://www.googleapis.com/oauth2/v3/certs'
      ? new Response(JSON.stringify(googleJwks), { headers: { 'Content-Type': 'application/json' } })
      : realFetch(input, init);
  });
});

afterAll(() => {
  vi.unstubAllGlobals();
});

beforeEach(async () => {
  await resetAccounts(pool);
});

/** An identity token as native Google Sign-In hands it to the app (with `webClientId` set). */
function identityToken({ audience = WEB_CLIENT_ID, subject = 'google-user-1' } = {}) {
  return new SignJWT({
    email: 'ada@gmail.com',
    email_verified: true,
    name: 'Ada Lovelace',
    picture: 'https://lh3.googleusercontent.com/a/ada',
  })
    .setProtectedHeader({ alg: 'RS256', kid: 'google-key-1' })
    .setIssuer('https://accounts.google.com')
    .setAudience(audience)
    .setSubject(subject)
    .setIssuedAt()
    .setExpirationTime('10m')
    .sign(googleKey);
}

function signInWithGoogle(token: string) {
  return app.request('/api/auth/sign-in/social', {
    method: 'POST',
    headers: FROM_APP,
    body: JSON.stringify({ provider: 'google', idToken: { token } }),
  });
}

function sessionCookie(response: Response): string {
  const cookie = response.headers.getSetCookie().find((value) => value.startsWith('clothhub.session_token='));
  expect(cookie).toBeTruthy();
  return cookie!.split(';')[0]!;
}

describe('Sign in with Google', () => {
  it('creates the account with the name, email and photo from the identity token', async () => {
    const response = await signInWithGoogle(await identityToken());
    expect(response.status).toBe(200);

    const me = await app.request('/v1/me', { headers: { Cookie: sessionCookie(response) } });
    const { account } = MeResponseSchema.parse(await me.json());

    expect(account).toMatchObject({
      name: 'Ada Lovelace',
      email: 'ada@gmail.com',
      imageUrl: 'https://lh3.googleusercontent.com/a/ada',
    });
  });

  it('refuses an identity token addressed to another app', async () => {
    const response = await signInWithGoogle(await identityToken({ audience: 'someone-else.apps.googleusercontent.com' }));

    expect(response.status).toBe(401);
  });

  it('joins a verified Google sign-in to the same account each time', async () => {
    const first = sessionCookie(await signInWithGoogle(await identityToken()));
    const again = sessionCookie(await signInWithGoogle(await identityToken()));

    const ids = await Promise.all(
      [first, again].map(async (cookie) => {
        const me = await app.request('/v1/me', { headers: { Cookie: cookie } });
        return MeResponseSchema.parse(await me.json()).account.id;
      }),
    );

    expect(ids[0]).toBe(ids[1]);
  });
});
