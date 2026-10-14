import type { Context } from 'hono';
import { createMiddleware } from 'hono/factory';

import { ApiError } from './errors.js';
import type { AppEnv, SessionUser } from './hono.js';

/*
 * The sign-in seam. Every request passes through `sessionMiddleware`, and
 * routes read the user only through `c.get('user')` or `requireUser(c)`.
 *
 * Until sign-in exists (phase 6) nobody is signed in. Phase 6 replaces the
 * body of the middleware with Better Auth's session lookup; routes do not
 * change. Never parse tokens anywhere else.
 */

export const sessionMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  c.set('user', null);
  await next();
});

/** The signed-in user, or a 401 `unauthorized` error for routes that need an account. */
export function requireUser(c: Context<AppEnv>): SessionUser {
  const user = c.get('user');

  if (!user) {
    throw new ApiError(401, 'unauthorized', 'Sign in to do this');
  }

  return user;
}
