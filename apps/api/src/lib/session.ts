import type { Context } from 'hono';
import { createMiddleware } from 'hono/factory';

import { ApiError } from './errors.js';
import type { AppEnv, SessionUser } from './hono.js';

/*
 * The sign-in seam. Every request passes through `sessionMiddleware`, and
 * routes read the user only through `c.get('user')` or `requireUser(c)`.
 *
 * The middleware asks a `SessionLookup` who the request belongs to — Better
 * Auth's, built in modules/auth/session.ts. Never parse tokens anywhere else.
 */

/** Finds the signed-in user from a request's headers (its session cookie), or null. */
export type SessionLookup = (headers: Headers) => Promise<SessionUser | null>;

/** Requests that never carry a user: sign-in's own endpoints and the open docs. */
const SKIPPED_PREFIXES = ['/api/auth/', '/health', '/openapi.json'];

export function sessionMiddleware(lookup: SessionLookup) {
  return createMiddleware<AppEnv>(async (c, next) => {
    const skip = SKIPPED_PREFIXES.some((prefix) => c.req.path.startsWith(prefix));

    // Most requests are someone browsing signed out: no cookie, no database work.
    const user = skip || !c.req.header('cookie') ? null : await lookup(c.req.raw.headers);

    c.set('user', user);
    await next();
  });
}

/** The signed-in user, or a 401 `unauthorized` error for routes that need an account. */
export function requireUser(c: Context<AppEnv>): SessionUser {
  const user = c.get('user');

  if (!user) {
    throw new ApiError(401, 'unauthorized', 'Sign in to do this');
  }

  return user;
}
