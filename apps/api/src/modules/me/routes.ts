import { ErrorResponseSchema, MeResponseSchema } from '@clothhub/shared';
import { createRoute, OpenAPIHono } from '@hono/zod-openapi';

import type { AppEnv } from '../../lib/hono.js';
import { requireUser } from '../../lib/session.js';
import { validationHook } from '../../lib/validation.js';
import type { MeService } from './service.js';

/*
 * The signed-in person: their account now; their saves, collections and
 * profile as those arrive. Every route here needs a session (401 otherwise).
 */

const json = <T>(schema: T) => ({ 'application/json': { schema } });

const unauthorized = { description: 'Not signed in', content: json(ErrorResponseSchema) };

/** Personal data: never stored by a shared cache. */
const PRIVATE = 'private, no-store';

const getMe = createRoute({
  method: 'get',
  path: '/v1/me',
  tags: ['Me'],
  summary: 'The signed-in account',
  responses: {
    200: { description: 'The account', content: json(MeResponseSchema) },
    401: unauthorized,
  },
});

const deleteMe = createRoute({
  method: 'delete',
  path: '/v1/me',
  tags: ['Me'],
  summary: 'Delete the account and everything saved to it',
  responses: {
    204: { description: 'Deleted; the session no longer works' },
    401: unauthorized,
  },
});

export function meRoutes(service: MeService) {
  const app = new OpenAPIHono<AppEnv>({ defaultHook: validationHook });

  app.openapi(getMe, (c) => {
    const { id, name, email, imageUrl } = requireUser(c);

    c.header('Cache-Control', PRIVATE);
    return c.json({ account: { id, name, email, imageUrl } }, 200);
  });

  app.openapi(deleteMe, async (c) => {
    const user = requireUser(c);

    await service.deleteAccount(user.id);

    c.header('Cache-Control', PRIVATE);
    return c.body(null, 204);
  });

  return app;
}
