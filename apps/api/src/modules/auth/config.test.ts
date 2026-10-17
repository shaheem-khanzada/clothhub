import { describe, expect, it } from 'vitest';

import { loadEnv } from '../../lib/env.js';
import { authConfig } from './config.js';

const KEY = '-----BEGIN PRIVATE KEY-----\nMIGTAgEAMBMG\n-----END PRIVATE KEY-----';

const base = {
  DATABASE_URL: 'mysql://u:p@localhost:3306/clothhub_dev',
  BETTER_AUTH_SECRET: 'x'.repeat(32),
  BETTER_AUTH_URL: 'https://api.clothhub.digital',
};

describe('authConfig', () => {
  it('runs with email sign-in only until Apple and Google are configured', () => {
    const config = authConfig(loadEnv(base));

    expect(config).toMatchObject({ baseUrl: 'https://api.clothhub.digital', google: null, apple: null });
  });

  it('switches Google on with the Web client ID; the secret is optional', () => {
    const idOnly = authConfig(loadEnv({ ...base, GOOGLE_CLIENT_ID: 'id' }));
    const withSecret = authConfig(loadEnv({ ...base, GOOGLE_CLIENT_ID: 'id', GOOGLE_CLIENT_SECRET: 'secret' }));

    expect(idOnly.google).toEqual({ clientId: 'id', clientSecret: null });
    expect(withSecret.google).toEqual({ clientId: 'id', clientSecret: 'secret' });
  });

  it('switches Apple on with the Team ID, Key ID and key, for the app\'s bundle id', () => {
    const config = authConfig(
      loadEnv({ ...base, APPLE_TEAM_ID: 'TEAM123456', APPLE_KEY_ID: 'KEY1234567', APPLE_PRIVATE_KEY: KEY }),
    );

    expect(config.apple).toEqual({
      teamId: 'TEAM123456',
      keyId: 'KEY1234567',
      privateKey: KEY,
      bundleId: 'com.clothhub.digital',
    });
  });

  it('reads a key written on one line with \\n for the line breaks', () => {
    const config = authConfig(
      loadEnv({
        ...base,
        APPLE_TEAM_ID: 'TEAM123456',
        APPLE_KEY_ID: 'KEY1234567',
        APPLE_PRIVATE_KEY: KEY.replaceAll('\n', '\\n'),
      }),
    );

    expect(config.apple?.privateKey).toBe(KEY);
  });

  it('says how to fix a key that lost its lines (no quotes around it in .env)', () => {
    expect(() =>
      authConfig(
        loadEnv({
          ...base,
          APPLE_TEAM_ID: 'TEAM123456',
          APPLE_KEY_ID: 'KEY1234567',
          APPLE_PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----',
        }),
      ),
    ).toThrow('wrap the value in double quotes');
  });

  it('refuses to start with only some of Apple\'s values', () => {
    expect(() => authConfig(loadEnv({ ...base, APPLE_TEAM_ID: 'TEAM123456' }))).toThrow(
      'also set APPLE_KEY_ID and APPLE_PRIVATE_KEY',
    );
  });

  it('refuses to start the server without a secret and public URL', () => {
    expect(() => authConfig(loadEnv({ DATABASE_URL: base.DATABASE_URL }))).toThrow(
      'set BETTER_AUTH_SECRET and BETTER_AUTH_URL',
    );
  });

  it('treats empty values in .env as unset', () => {
    const config = authConfig(loadEnv({ ...base, GOOGLE_CLIENT_ID: '', GOOGLE_CLIENT_SECRET: '', SCRAPER_DATABASE_URL: '' }));

    expect(config.google).toBeNull();
  });

  it('accepts Expo dev clients outside production only', () => {
    expect(authConfig(loadEnv({ ...base, NODE_ENV: 'development' })).devOrigins).toBe(true);
    expect(authConfig(loadEnv({ ...base, NODE_ENV: 'production' })).devOrigins).toBe(false);
  });
});
