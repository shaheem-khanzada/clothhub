import { serve } from '@hono/node-server';

import { createApp } from './app.js';
import { createDatabase } from './db/client.js';
import { loadEnv } from './lib/env.js';
import { createLogger } from './lib/logger.js';
import { createAuth } from './modules/auth/auth.js';
import { authConfig } from './modules/auth/config.js';

const env = loadEnv();
const logger = createLogger(env.LOG_LEVEL);
const { db, pool } = createDatabase(env.DATABASE_URL);
const config = authConfig(env);
const auth = createAuth({ db, config, logger });
const app = createApp({ db, logger, auth });

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
