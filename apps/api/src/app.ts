import { OpenAPIHono } from '@hono/zod-openapi';

import { healthRoutes } from './modules/health/routes.js';

/**
 * Builds the HTTP app. Kept free of side effects (no listening, no database
 * connection) so tests can call `app.request()` directly.
 *
 * Modules mount here as they are built: `/v1/catalog`, then `/v1/me` and
 * `/api/auth` in the sign-in phase.
 */
export function createApp() {
  const app = new OpenAPIHono();

  app.route('/', healthRoutes);

  app.doc31('/openapi.json', {
    openapi: '3.1.0',
    info: { title: 'ClothHub API', version: '0.0.0' },
  });

  app.notFound((c) => c.json({ error: { code: 'not_found', message: 'Not found' } }, 404));

  return app;
}
