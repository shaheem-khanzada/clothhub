import { OpenAPIHono } from '@hono/zod-openapi';
import { compress } from 'hono/compress';
import { etag } from 'hono/etag';
import { requestId } from 'hono/request-id';

import type { Database } from './db/client.js';
import { ApiError, errorBody, sendError } from './lib/errors.js';
import type { AppEnv } from './lib/hono.js';
import type { Logger } from './lib/logger.js';
import { sessionMiddleware } from './lib/session.js';
import type { AppleSignIn } from './modules/auth/apple.js';
import { type Auth, AUTH_BASE_PATH } from './modules/auth/auth.js';
import { betterAuthSessionLookup } from './modules/auth/session.js';
import { catalogRoutes } from './modules/catalog/routes.js';
import { CatalogService } from './modules/catalog/service.js';
import { healthRoutes } from './modules/health/routes.js';
import { meRoutes } from './modules/me/routes.js';
import { MeService } from './modules/me/service.js';

export type AppDependencies = {
  db: Database;
  logger?: Logger;
  /**
   * Sign-in (modules/auth). The server always passes it; tests that don't
   * involve accounts leave it out, and then nobody is ever signed in.
   */
  auth?: Auth;
  /** Sign in with Apple's token exchange and revoke; null or left out when Apple isn't configured. */
  apple?: AppleSignIn | null;
};

/**
 * Builds the HTTP app. Kept free of side effects (no listening, no
 * connections of its own) so tests call `app.request()` with a test database.
 *
 * Modules mount here as they are built.
 */
export function createApp({ db, logger, auth, apple = null }: AppDependencies) {
  const app = new OpenAPIHono<AppEnv>();

  app.use(requestId());

  if (logger) {
    app.use(async (c, next) => {
      const started = performance.now();
      await next();
      logger.info(
        {
          requestId: c.get('requestId'),
          method: c.req.method,
          path: c.req.path,
          status: c.res.status,
          ms: Math.round(performance.now() - started),
        },
        'request',
      );
    });
  }

  // Product pages are JSON full of long CDN URLs: gzip makes them about 9×
  // smaller, which on a phone network is most of the wait. The ETag is taken
  // from the uncompressed body, so a refresh with nothing new is a bodiless 304.
  app.use(compress());
  // Not on sign-in's endpoints: a cached "who am I" answer must never come back as a 304.
  const withEtag = etag();
  app.use((c, next) => (c.req.path.startsWith(`${AUTH_BASE_PATH}/`) ? next() : withEtag(c, next)));

  app.use(sessionMiddleware(auth ? betterAuthSessionLookup(auth) : async () => null));

  if (auth) {
    // Better Auth answers its own endpoints: sign-up, sign-in, sign-out, session, social sign-in.
    app.on(['GET', 'POST'], `${AUTH_BASE_PATH}/*`, async (c) => {
      const response = await auth.handler(c.req.raw);
      response.headers.set('Cache-Control', 'no-store');
      return response;
    });
  }

  app.route('/', healthRoutes);
  app.route('/', catalogRoutes(new CatalogService(db)));
  app.route('/', meRoutes(new MeService(db, apple, logger)));

  app.doc31('/openapi.json', {
    openapi: '3.1.0',
    info: {
      title: 'ClothHub API',
      version: '1.0.0',
      description: 'Fashion discovery for Pakistan: brands and products from many shops in one place.',
    },
  });

  app.notFound((c) => c.json(errorBody('not_found', 'Not found'), 404));

  app.onError((error, c) => {
    if (error instanceof ApiError) return sendError(c, error);

    logger?.error({ requestId: c.get('requestId'), err: error }, 'Unhandled error');
    return c.json(errorBody('internal_error', 'Something went wrong'), 500);
  });

  return app;
}

export type App = ReturnType<typeof createApp>;
