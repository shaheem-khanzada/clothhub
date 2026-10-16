import { expo } from '@better-auth/expo';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

import type { Database } from '../../db/client.js';
import { accounts, sessions, users, verifications } from '../../db/schema/auth.js';
import { uuidv7 } from '../../lib/ids.js';
import type { Logger } from '../../lib/logger.js';
import type { AuthConfig } from './config.js';

/** Where Better Auth's own endpoints live: sign-up, sign-in, sign-out, session, social callbacks. */
export const AUTH_BASE_PATH = '/api/auth';

/** The app's URL scheme (app.json `scheme`): the origin the app's requests carry. */
const APP_SCHEME = 'clothhub://';

const DAY = 60 * 60 * 24;

export type AuthDependencies = {
  db: Database;
  config: AuthConfig;
  logger?: Logger;
};

/**
 * Sign-in for the app, with Better Auth.
 *
 * - Email and password today; Apple and Google switch on when their
 *   credentials are set (see `config.ts`). The app signs in with Apple and
 *   Google natively and sends the identity token here, so no browser redirect
 *   is involved.
 * - The session lives in a cookie. The app keeps it in the iOS Keychain /
 *   Android Keystore (Better Auth's Expo plugin) and sends it with every API
 *   request; `sessionMiddleware` turns it into `c.get('user')`.
 * - Accounts are deleted by `DELETE /v1/me` (modules/me), which also removes
 *   everything keyed to the user.
 */
export function createAuth({ db, config, logger }: AuthDependencies) {
  return betterAuth({
    appName: 'ClothHub',
    baseURL: config.baseUrl,
    basePath: AUTH_BASE_PATH,
    secret: config.secret,

    database: drizzleAdapter(db, {
      provider: 'mysql',
      usePlural: true,
      schema: { users, sessions, accounts, verifications },
    }),

    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      // Signed in straight after sign-up. Email verification comes with an email service.
      autoSignIn: true,
      requireEmailVerification: false,
    },

    socialProviders: {
      ...(config.google && {
        google: {
          clientId: config.google.clientId,
          clientSecret: config.google.clientSecret,
        },
      }),
      ...(config.apple && {
        apple: {
          clientId: config.apple.clientId,
          clientSecret: config.apple.clientSecret,
          appBundleIdentifier: config.apple.appBundleId,
        },
      }),
    },

    session: {
      // A phone stays signed in: two months, extended whenever the app is used.
      expiresIn: 60 * DAY,
      updateAge: DAY,
    },

    account: {
      // Signing in with Apple or Google on an email that already has an account joins them.
      accountLinking: { enabled: true, trustedProviders: ['apple', 'google'] },
    },

    trustedOrigins: [APP_SCHEME, 'https://appleid.apple.com', ...(config.devOrigins ? ['exp://'] : [])],

    advanced: {
      database: { generateId: () => uuidv7() },
      cookiePrefix: 'clothhub',
      // Better Auth skips its origin (CSRF) check under test runners; keep it on so tests see production's behaviour.
      disableOriginCheck: false,
      // Coolify's proxy passes the client's address on; rate limits count per address.
      ipAddress: { ipAddressHeaders: ['x-forwarded-for', 'x-real-ip'] },
    },

    telemetry: { enabled: false },

    logger: {
      disabled: !logger,
      log: (level, message, ...args) => {
        const fields = args.length > 0 ? { args } : {};
        if (level === 'error') logger?.error(fields, `auth: ${message}`);
        else if (level === 'warn') logger?.warn(fields, `auth: ${message}`);
        else logger?.debug(fields, `auth: ${message}`);
      },
    },

    plugins: [expo()],
  });
}

export type Auth = ReturnType<typeof createAuth>;
