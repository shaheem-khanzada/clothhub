import { AppleAuthorizationRequestSchema, ErrorResponseSchema, MeResponseSchema } from '@clothhub/shared';
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

const saveAppleAuthorization = createRoute({
  method: 'post',
  path: '/v1/me/apple-authorization',
  tags: ['Me'],
  summary: 'Keep the Apple sign-in revocable',
  description:
    'Sent by the app right after Sign in with Apple, with that sign-in\'s one-time authorization code. ' +
    'The API exchanges it for a refresh token, so deleting the account can revoke the app\'s access to the Apple ID.',
  request: { body: { required: true, content: json(AppleAuthorizationRequestSchema) } },
  responses: {
    204: { description: 'Saved' },
    400: { description: 'Apple refused the code (expired or already used)', content: json(ErrorResponseSchema) },
    401: unauthorized,
    403: { description: 'The code is for a different Apple ID', content: json(ErrorResponseSchema) },
    404: { description: 'This account has no Apple sign-in', content: json(ErrorResponseSchema) },
  },
});

export function meRoutes(service: MeService) {
  const app = new OpenAPIHono<AppEnv>({ defaultHook: validationHook });

  app.openapi(getMe, (c) => {
    const { id, name, email, imageUrl } = requireUser(c);

    c.header('Cache-Control', PRIVATE);
    return c.json({ account: { id, name, email, imageUrl } }, 200);
  });

  app.openapi(saveAppleAuthorization, async (c) => {
    const user = requireUser(c);
    const { authorizationCode } = c.req.valid('json');

    await service.saveAppleAuthorization(user.id, authorizationCode);

    c.header('Cache-Control', PRIVATE);
    return c.body(null, 204);
  });

  app.openapi(deleteMe, async (c) => {
    const user = requireUser(c);

    await service.deleteAccount(user.id);

    c.header('Cache-Control', PRIVATE);
    return c.body(null, 204);
  });

  return app;
}
