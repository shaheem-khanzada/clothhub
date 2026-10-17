import { MeResponseSchema } from '@clothhub/shared';
import { beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../../src/app.js';
import { createAuth } from '../../src/modules/auth/auth.js';
import { resetAccounts, useTestDatabase } from '../helpers/db.js';

const { db, pool } = useTestDatabase();

const auth = createAuth({
  db,
  config: {
    baseUrl: 'http://localhost:3000',
    secret: 'test-secret-that-is-at-least-32-characters',
    google: null,
    apple: null,
    devOrigins: true,
  },
});
const app = createApp({ db, auth });

/** What the app sends: Better Auth's Expo client marks requests with the app's scheme. */
const FROM_APP = { 'Content-Type': 'application/json', 'expo-origin': 'clothhub://' };

const ADA = { name: 'Ada Lovelace', email: 'ada@example.com', password: 'analytical-engine' };

function post(path: string, body: unknown, cookie?: string) {
  return app.request(path, {
    method: 'POST',
    headers: { ...FROM_APP, ...(cookie && { Cookie: cookie }) },
    body: JSON.stringify(body),
  });
}

/** The session cookie from a sign-up/sign-in response, ready to send back. */
function sessionCookie(response: Response): string {
  const cookie = response.headers
    .getSetCookie()
    .find((value) => value.startsWith('clothhub.session_token='));

  expect(cookie).toBeTruthy();
  return cookie!.split(';')[0]!;
}

async function signUp(person = ADA) {
  const response = await post('/api/auth/sign-up/email', person);
  expect(response.status).toBe(200);
  return sessionCookie(response);
}

function me(cookie?: string) {
  return app.request('/v1/me', { headers: cookie ? { Cookie: cookie } : {} });
}

beforeEach(async () => {
  await resetAccounts(pool);
});

describe('sign-up with email and password', () => {
  it('creates the account and signs straight in', async () => {
    const cookie = await signUp();
    const response = await me(cookie);

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');

    const { account } = MeResponseSchema.parse(await response.json());
    expect(account).toMatchObject({ name: 'Ada Lovelace', email: 'ada@example.com', imageUrl: null });
    // UUIDv7, like every other id.
    expect(account.id[14]).toBe('7');
  });

  it('stores only a hash of the password', async () => {
    await signUp();
    const [rows] = await pool.query<import('mysql2').RowDataPacket[]>(
      "SELECT password FROM accounts WHERE provider_id = 'credential'",
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]!.password).not.toContain(ADA.password);
  });

  it('refuses a second account on the same email', async () => {
    await signUp();
    const response = await post('/api/auth/sign-up/email', { ...ADA, name: 'Someone else' });

    expect(response.status).toBe(422);
  });

  it('refuses passwords shorter than 8 characters', async () => {
    const response = await post('/api/auth/sign-up/email', { ...ADA, password: 'short' });

    expect(response.status).toBe(400);
  });
});

describe('sign-in', () => {
  it('signs in with the right password', async () => {
    await signUp();
    const response = await post('/api/auth/sign-in/email', { email: ADA.email, password: ADA.password });

    expect(response.status).toBe(200);
    expect((await me(sessionCookie(response))).status).toBe(200);
  });

  it('refuses a wrong password without saying whether the email exists', async () => {
    await signUp();
    const wrongPassword = await post('/api/auth/sign-in/email', { email: ADA.email, password: 'not-my-password' });
    const unknownEmail = await post('/api/auth/sign-in/email', { email: 'nobody@example.com', password: 'whatever1' });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(await wrongPassword.json()).toEqual(await unknownEmail.json());
  });
});

describe('the session', () => {
  it('is required for /v1/me', async () => {
    const response = await me();

    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ error: { code: 'unauthorized' } });
  });

  it('ignores a made-up cookie', async () => {
    expect((await me('clothhub.session_token=forged.value')).status).toBe(401);
  });

  it('ends on sign-out', async () => {
    const cookie = await signUp();
    const response = await post('/api/auth/sign-out', {}, cookie);

    expect(response.status).toBe(200);
    expect((await me(cookie)).status).toBe(401);
  });

  it('refuses sign-in requests from an untrusted website', async () => {
    const cookie = await signUp();
    const response = await app.request('/api/auth/sign-out', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'https://evil.example', Cookie: cookie },
      body: '{}',
    });

    expect(response.status).toBe(403);
    expect((await me(cookie)).status).toBe(200);
  });

  it('is never answered from a cache', async () => {
    const cookie = await signUp();
    const response = await app.request('/api/auth/get-session', { headers: { Cookie: cookie } });

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(response.headers.get('ETag')).toBeNull();
  });
});

describe('DELETE /v1/me', () => {
  it('deletes the account, its sign-in methods and its sessions', async () => {
    const cookie = await signUp();
    const response = await app.request('/v1/me', { method: 'DELETE', headers: { Cookie: cookie } });

    expect(response.status).toBe(204);
    expect((await me(cookie)).status).toBe(401);

    const [[counts]] = await pool.query<import('mysql2').RowDataPacket[]>(
      `SELECT (SELECT COUNT(*) FROM users) AS users,
              (SELECT COUNT(*) FROM accounts) AS accounts,
              (SELECT COUNT(*) FROM sessions) AS sessions`,
    );
    expect(counts).toEqual({ users: 0, accounts: 0, sessions: 0 });
  });

  it('frees the email for a new account', async () => {
    const cookie = await signUp();
    await app.request('/v1/me', { method: 'DELETE', headers: { Cookie: cookie } });

    expect((await post('/api/auth/sign-in/email', { email: ADA.email, password: ADA.password })).status).toBe(401);
    await signUp();
  });

  it('needs a session', async () => {
    expect((await app.request('/v1/me', { method: 'DELETE' })).status).toBe(401);
  });

  it('lets the app sign out afterwards, which clears its stored cookie', async () => {
    const cookie = await signUp();
    await app.request('/v1/me', { method: 'DELETE', headers: { Cookie: cookie } });

    const response = await post('/api/auth/sign-out', {}, cookie);

    expect(response.status).toBe(200);
    expect(response.headers.getSetCookie().some((value) => /clothhub\.session_token=;/.test(value))).toBe(true);
  });

  it("deletes only the signed-in person's account", async () => {
    const adaCookie = await signUp();
    const graceCookie = await signUp({ name: 'Grace Hopper', email: 'grace@example.com', password: 'compiler-1952' });

    await app.request('/v1/me', { method: 'DELETE', headers: { Cookie: adaCookie } });

    expect((await me(graceCookie)).status).toBe(200);
  });
});
