import { serve } from '@hono/node-server';

import { createApp } from './app.js';
import { loadEnv } from './lib/env.js';
import { createLogger } from './lib/logger.js';

const env = loadEnv();
const logger = createLogger(env.LOG_LEVEL);
const app = createApp();

const server = serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  logger.info({ port: info.port }, 'ClothHub API listening');
});

// Coolify stops containers with SIGTERM: finish in-flight requests, then exit.
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    logger.info({ signal }, 'Shutting down');
    server.close(() => process.exit(0));
  });
}
