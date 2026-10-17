import { decodeProtectedHeader, exportPKCS8, generateKeyPair, jwtVerify, SignJWT } from 'jose';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { AppleRequestError, AppleSignIn } from './apple.js';

let privateKey: string;
let publicKey: CryptoKey;

beforeAll(async () => {
  const pair = await generateKeyPair('ES256', { extractable: true });
  privateKey = await exportPKCS8(pair.privateKey);
  publicKey = pair.publicKey;
});

function appleSignIn(fetchFn: typeof fetch = vi.fn()) {
  return new AppleSignIn(
    { teamId: 'TEAM123456', keyId: 'KEY1234567', privateKey, bundleId: 'com.clothhub.digital' },
    fetchFn,
  );
}

/** An identity token as Apple's token endpoint returns it (the signature isn't checked there). */
async function idToken(subject: string) {
  const { privateKey: key } = await generateKeyPair('RS256');
  return new SignJWT({}).setProtectedHeader({ alg: 'RS256' }).setSubject(subject).sign(key);
}

function reply(status: number, body: unknown = {}) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

describe('AppleSignIn', () => {
  it('signs the client secret Apple expects with our key', async () => {
    const secret = await appleSignIn().clientSecret();
    const { payload } = await jwtVerify(secret, publicKey, {
      issuer: 'TEAM123456',
      audience: 'https://appleid.apple.com',
      subject: 'com.clothhub.digital',
    });

    expect(decodeProtectedHeader(secret)).toEqual({ alg: 'ES256', kid: 'KEY1234567' });
    expect(payload.exp! - payload.iat!).toBe(3600);
  });

  it('reuses the client secret while it is fresh', async () => {
    const apple = appleSignIn();

    expect(await apple.clientSecret()).toBe(await apple.clientSecret());
  });

  it('exchanges an authorization code for a refresh token', async () => {
    const fetchFn = vi.fn<typeof fetch>(async () =>
      reply(200, { refresh_token: 'refresh-1', id_token: await idToken('apple-user-1') }),
    );

    const result = await appleSignIn(fetchFn).exchangeCode('code-1');

    expect(result).toEqual({ subject: 'apple-user-1', refreshToken: 'refresh-1' });
    const [url, init] = fetchFn.mock.calls[0]!;
    const form = init!.body as URLSearchParams;
    expect(url).toBe('https://appleid.apple.com/auth/token');
    expect(form.get('client_id')).toBe('com.clothhub.digital');
    expect(form.get('grant_type')).toBe('authorization_code');
    expect(form.get('code')).toBe('code-1');
    expect(form.get('client_secret')).toBeTruthy();
  });

  it('says so when Apple refuses the code', async () => {
    const apple = appleSignIn(vi.fn<typeof fetch>(async () => reply(400, { error: 'invalid_grant' })));

    await expect(apple.exchangeCode('used')).rejects.toThrow(AppleRequestError);
    await expect(apple.exchangeCode('used')).rejects.toThrow('invalid_grant');
  });

  it('checks whether Apple accepts our credentials', async () => {
    const answers = [reply(400, { error: 'invalid_grant' }), reply(400, { error: 'invalid_client' })];
    const apple = appleSignIn(vi.fn<typeof fetch>(async () => answers.shift()!));

    expect(await apple.checkCredentials()).toBe('accepted');
    expect(await apple.checkCredentials()).toBe('rejected');
    expect(await appleSignIn(vi.fn<typeof fetch>(async () => Promise.reject(new Error('offline')))).checkCredentials()).toBe(
      'unreachable',
    );
  });

  it('revokes a refresh token', async () => {
    const fetchFn = vi.fn<typeof fetch>(async () => reply(200));

    await appleSignIn(fetchFn).revoke('refresh-1');

    const [url, init] = fetchFn.mock.calls[0]!;
    const form = init!.body as URLSearchParams;
    expect(url).toBe('https://appleid.apple.com/auth/revoke');
    expect(form.get('token')).toBe('refresh-1');
    expect(form.get('token_type_hint')).toBe('refresh_token');
  });

  it('fails when the key is not a valid .p8 key', async () => {
    const apple = new AppleSignIn({
      teamId: 'TEAM123456',
      keyId: 'KEY1234567',
      privateKey: 'not a key',
      bundleId: 'com.clothhub.digital',
    });

    await expect(apple.clientSecret()).rejects.toThrow();
  });
});
