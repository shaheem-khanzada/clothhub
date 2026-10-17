import { MeResponseSchema } from '@clothhub/shared';
import { exportJWK, exportPKCS8, generateKeyPair, SignJWT } from 'jose';
import type { RowDataPacket } from 'mysql2';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { createApp } from '../../src/app.js';
import { AppleSignIn } from '../../src/modules/auth/apple.js';
import { createAuth } from '../../src/modules/auth/auth.js';
import type { AuthConfig } from '../../src/modules/auth/config.js';
import { resetAccounts, useTestDatabase } from '../helpers/db.js';

/*
 * Sign in with Apple, end to end, with Apple played by this file: its public
 * keys (which Better Auth fetches to check identity tokens) and its token and
 * revoke endpoints (which AppleSignIn calls).
 */

const { db, pool } = useTestDatabase();

const BUNDLE_ID = 'com.clothhub.digital';
const FROM_APP = { 'Content-Type': 'application/json', 'expo-origin': 'clothhub://' };

/** Apple's identity-token signing key, and the JWKS Better Auth fetches. */
let appleKey: CryptoKey;
let appleJwks: { keys: unknown[] };

/** Apple's token and revoke endpoints. */
const appleApi = vi.fn<typeof fetch>();

let app: ReturnType<typeof createApp>;

beforeAll(async () => {
  const signing = await generateKeyPair('RS256', { extractable: true });
  appleKey = signing.privateKey;
  appleJwks = { keys: [{ ...(await exportJWK(signing.publicKey)), kid: 'apple-key-1', alg: 'RS256', use: 'sig' }] };

  const ours = await generateKeyPair('ES256', { extractable: true });
  const apple: NonNullable<AuthConfig['apple']> = {
    teamId: 'TEAM123456',
    keyId: 'KEY1234567',
    privateKey: await exportPKCS8(ours.privateKey),
    bundleId: BUNDLE_ID,
  };

  const auth = createAuth({
    db,
    config: {
      baseUrl: 'http://localhost:3000',
      secret: 'test-secret-that-is-at-least-32-characters',
      google: null,
      apple,
      devOrigins: true,
    },
  });
  app = createApp({ db, auth, apple: new AppleSignIn(apple, appleApi) });

  // Better Auth fetches Apple's public keys itself.
  const realFetch = globalThis.fetch;
  vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = input instanceof Request ? input.url : String(input);
    return url === 'https://appleid.apple.com/auth/keys'
      ? new Response(JSON.stringify(appleJwks), { headers: { 'Content-Type': 'application/json' } })
      : realFetch(input, init);
  });
});

afterAll(() => {
  vi.unstubAllGlobals();
});

beforeEach(async () => {
  await resetAccounts(pool);
  appleApi.mockReset();
});

/** An identity token as a native Sign in with Apple hands it to the app. */
function identityToken({ subject = 'apple-user-1', email = 'ada@privaterelay.appleid.com', audience = BUNDLE_ID } = {}) {
  return new SignJWT({ email, email_verified: true })
    .setProtectedHeader({ alg: 'RS256', kid: 'apple-key-1' })
    .setIssuer('https://appleid.apple.com')
    .setAudience(audience)
    .setSubject(subject)
    .setIssuedAt()
    .setExpirationTime('10m')
    .sign(appleKey);
}

function json(status: number, body: unknown = {}) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

async function signInWithApple(token: string, user?: { name: { firstName: string; lastName: string } }) {
  return app.request('/api/auth/sign-in/social', {
    method: 'POST',
    headers: FROM_APP,
    body: JSON.stringify({ provider: 'apple', idToken: { token, user } }),
  });
}

function sessionCookie(response: Response): string {
  const cookie = response.headers.getSetCookie().find((value) => value.startsWith('clothhub.session_token='));
  expect(cookie).toBeTruthy();
  return cookie!.split(';')[0]!;
}

async function signedInWithApple() {
  const response = await signInWithApple(await identityToken(), { name: { firstName: 'Ada', lastName: 'Lovelace' } });
  expect(response.status).toBe(200);
  return sessionCookie(response);
}

function saveAuthorization(cookie: string, authorizationCode: string) {
  return app.request('/v1/me/apple-authorization', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ authorizationCode }),
  });
}

async function refreshTokens() {
  const [rows] = await pool.query<RowDataPacket[]>("SELECT refresh_token FROM accounts WHERE provider_id = 'apple'");
  return rows.map((row) => row.refresh_token as string | null);
}

describe('Sign in with Apple', () => {
  it('creates the account from the identity token, with the name Apple gives on first sign-in', async () => {
    const cookie = await signedInWithApple();

    const response = await app.request('/v1/me', { headers: { Cookie: cookie } });
    const { account } = MeResponseSchema.parse(await response.json());

    expect(account).toMatchObject({ name: 'Ada Lovelace', email: 'ada@privaterelay.appleid.com' });
  });

  it('signs the same Apple ID back into the same account', async () => {
    const first = await signedInWithApple();
    // Apple sends the name only the first time.
    const again = await signInWithApple(await identityToken());

    const ids = await Promise.all(
      [first, sessionCookie(again)].map(async (cookie) => {
        const response = await app.request('/v1/me', { headers: { Cookie: cookie } });
        return MeResponseSchema.parse(await response.json()).account.id;
      }),
    );

    expect(ids[0]).toBe(ids[1]);
  });

  it('refuses an identity token addressed to another app', async () => {
    const response = await signInWithApple(await identityToken({ audience: 'com.someone.else' }));

    expect(response.status).toBe(401);
  });

  it('keeps the refresh token from the authorization code, and revokes it when the account is deleted', async () => {
    const cookie = await signedInWithApple();
    appleApi.mockResolvedValueOnce(
      json(200, { refresh_token: 'refresh-1', id_token: await identityToken() }),
    );

    expect((await saveAuthorization(cookie, 'code-1')).status).toBe(204);
    expect(await refreshTokens()).toEqual(['refresh-1']);

    appleApi.mockResolvedValueOnce(json(200));
    const deleted = await app.request('/v1/me', { method: 'DELETE', headers: { Cookie: cookie } });

    expect(deleted.status).toBe(204);
    const [url, init] = appleApi.mock.calls[1]!;
    expect(url).toBe('https://appleid.apple.com/auth/revoke');
    expect((init!.body as URLSearchParams).get('token')).toBe('refresh-1');
    expect(await refreshTokens()).toEqual([]);
  });

  it('refuses a code that belongs to a different Apple ID', async () => {
    const cookie = await signedInWithApple();
    appleApi.mockResolvedValueOnce(
      json(200, { refresh_token: 'theirs', id_token: await identityToken({ subject: 'someone-else' }) }),
    );

    const response = await saveAuthorization(cookie, 'code-1');

    expect(response.status).toBe(403);
    expect(await refreshTokens()).toEqual([null]);
  });

  it('says so when Apple refuses the code', async () => {
    const cookie = await signedInWithApple();
    appleApi.mockResolvedValueOnce(json(400, { error: 'invalid_grant' }));

    const response = await saveAuthorization(cookie, 'expired');

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: { code: 'apple_code_rejected' } });
  });

  it('still deletes the account when Apple cannot be reached to revoke', async () => {
    const cookie = await signedInWithApple();
    appleApi.mockResolvedValueOnce(json(200, { refresh_token: 'refresh-1', id_token: await identityToken() }));
    await saveAuthorization(cookie, 'code-1');
    appleApi.mockRejectedValueOnce(new Error('network down'));

    const deleted = await app.request('/v1/me', { method: 'DELETE', headers: { Cookie: cookie } });

    expect(deleted.status).toBe(204);
    expect(await refreshTokens()).toEqual([]);
  });

  it('needs a session to save a code', async () => {
    const response = await app.request('/v1/me/apple-authorization', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authorizationCode: 'code-1' }),
    });

    expect(response.status).toBe(401);
  });
});
