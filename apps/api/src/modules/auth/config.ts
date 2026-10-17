import type { Env } from '../../lib/env.js';
import type { AppleConfig } from './apple.js';

export type AuthConfig = {
  /** The API's public address (Better Auth's `baseURL`). */
  baseUrl: string;
  secret: string;
  google: { clientId: string; clientSecret: string | null } | null;
  apple: AppleConfig | null;
  /** Accept requests from Expo Go / dev clients (`exp://`) outside production. */
  devOrigins: boolean;
};

/**
 * Reads sign-in settings for the server. The secret and the public URL are
 * required; Apple and Google are each on only when all of their values are
 * set, so the API runs with email sign-in until their credentials exist. Half
 * of Apple's values is a mistake, so that stops the server.
 */
export function authConfig(env: Env): AuthConfig {
  const missing = [
    !env.BETTER_AUTH_SECRET && 'BETTER_AUTH_SECRET',
    !env.BETTER_AUTH_URL && 'BETTER_AUTH_URL',
  ].filter(Boolean);

  if (!env.BETTER_AUTH_SECRET || !env.BETTER_AUTH_URL) {
    throw new Error(`Sign-in is not configured: set ${missing.join(' and ')} (see .env.example).`);
  }

  const appleValues = { APPLE_TEAM_ID: env.APPLE_TEAM_ID, APPLE_KEY_ID: env.APPLE_KEY_ID, APPLE_PRIVATE_KEY: env.APPLE_PRIVATE_KEY };
  const appleMissing = Object.entries(appleValues).filter(([, value]) => !value).map(([name]) => name);

  if (appleMissing.length > 0 && appleMissing.length < 3) {
    throw new Error(`Sign in with Apple is half configured: also set ${appleMissing.join(' and ')}.`);
  }

  const key = env.APPLE_PRIVATE_KEY;

  if (key && !(key.startsWith('-----BEGIN PRIVATE KEY-----') && key.endsWith('-----END PRIVATE KEY-----'))) {
    // Usually a multi-line value without quotes in .env, which ends the value after the first line.
    throw new Error(
      'APPLE_PRIVATE_KEY is not a whole .p8 key: include its BEGIN and END lines, and in .env wrap the value in double quotes.',
    );
  }

  return {
    baseUrl: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    google: env.GOOGLE_CLIENT_ID
      ? { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET ?? null }
      : null,
    apple:
      env.APPLE_TEAM_ID && env.APPLE_KEY_ID && env.APPLE_PRIVATE_KEY
        ? {
            teamId: env.APPLE_TEAM_ID,
            keyId: env.APPLE_KEY_ID,
            privateKey: env.APPLE_PRIVATE_KEY,
            bundleId: env.APPLE_APP_BUNDLE_ID,
          }
        : null,
    devOrigins: env.NODE_ENV !== 'production',
  };
}
