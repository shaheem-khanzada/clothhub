import { describe, expect, it } from 'vitest';

import { loadEnv } from '../../lib/env.js';
import { authConfig } from './config.js';

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

  it('switches a provider on only when all of its values are set', () => {
    const halfGoogle = authConfig(loadEnv({ ...base, GOOGLE_CLIENT_ID: 'id' }));
    const fullGoogle = authConfig(loadEnv({ ...base, GOOGLE_CLIENT_ID: 'id', GOOGLE_CLIENT_SECRET: 'secret' }));
    const apple = authConfig(loadEnv({ ...base, APPLE_CLIENT_ID: 'svc', APPLE_CLIENT_SECRET: 'jwt' }));

    expect(halfGoogle.google).toBeNull();
    expect(fullGoogle.google).toEqual({ clientId: 'id', clientSecret: 'secret' });
    expect(apple.apple).toEqual({ clientId: 'svc', clientSecret: 'jwt', appBundleId: 'com.clothhub.digital' });
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
