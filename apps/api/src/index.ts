import { serve } from '@hono/node-server';

import { createApp } from './app.js';
import { createDatabase } from './db/client.js';
import { loadEnv } from './lib/env.js';
import { createLogger } from './lib/logger.js';
import { AppleSignIn } from './modules/auth/apple.js';
import { createAuth } from './modules/auth/auth.js';
import { authConfig } from './modules/auth/config.js';

const env = loadEnv();
const logger = createLogger(env.LOG_LEVEL);
const { db, pool } = createDatabase(env.DATABASE_URL);
const config = authConfig(env);
const auth = createAuth({ db, config, logger });
const apple = config.apple ? new AppleSignIn(config.apple) : null;

// A key that doesn't load should stop the server here, not fail the first account deletion.
if (apple) {
  await apple.clientSecret();

  // Whether Apple accepts the Team ID, Key ID and key, so a wrong one shows up now rather than on a sign-in.
  apple.checkCredentials().then((result) => {
    if (result === 'accepted') {
      logger.info('Sign in with Apple: Apple accepts our credentials');
    } else if (result === 'rejected') {
      logger.warn(
        'Sign in with Apple: Apple rejects our credentials (invalid_client). Check APPLE_TEAM_ID and APPLE_KEY_ID ' +
          "match the key, and that the key's primary App ID is APPLE_APP_BUNDLE_ID. A key made minutes ago can take a while to work.",
      );
    } else {
      logger.warn('Sign in with Apple: could not reach Apple to check our credentials');
    }
  });
}

const app = createApp({ db, logger, auth, apple });

logger.info(
  { email: true, apple: Boolean(config.apple), google: Boolean(config.google) },
  'Sign-in methods',
);

const server = serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  logger.info({ port: info.port, env: env.NODE_ENV }, 'ClothHub API listening');
});

// Coolify stops containers with SIGTERM: finish in-flight requests, close the pool, exit.
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    logger.info({ signal }, 'Shutting down');
    server.close(() => {
      pool.end().finally(() => process.exit(0));
    });
  });
}
