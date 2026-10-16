import type { Env } from '../../lib/env.js';

export type AuthConfig = {
  /** The API's public address (Better Auth's `baseURL`). */
  baseUrl: string;
  secret: string;
  google: { clientId: string; clientSecret: string } | null;
  apple: { clientId: string; clientSecret: string; appBundleId: string } | null;
  /** Accept requests from Expo Go / dev clients (`exp://`) outside production. */
  devOrigins: boolean;
};

/**
 * Reads sign-in settings for the server. The secret and the public URL are
 * required; Apple and Google are each on only when both of their values are
 * set, so the API runs with email sign-in until their credentials exist.
 */
export function authConfig(env: Env): AuthConfig {
  const missing = [
    !env.BETTER_AUTH_SECRET && 'BETTER_AUTH_SECRET',
    !env.BETTER_AUTH_URL && 'BETTER_AUTH_URL',
  ].filter(Boolean);

  if (!env.BETTER_AUTH_SECRET || !env.BETTER_AUTH_URL) {
    throw new Error(`Sign-in is not configured: set ${missing.join(' and ')} (see .env.example).`);
  }

  return {
    baseUrl: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    google:
      env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
        ? { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET }
        : null,
    apple:
      env.APPLE_CLIENT_ID && env.APPLE_CLIENT_SECRET
        ? {
            clientId: env.APPLE_CLIENT_ID,
            clientSecret: env.APPLE_CLIENT_SECRET,
            appBundleId: env.APPLE_APP_BUNDLE_ID,
          }
        : null,
    devOrigins: env.NODE_ENV !== 'production',
  };
}
