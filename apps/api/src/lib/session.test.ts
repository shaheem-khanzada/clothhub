import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';

import { ApiError, sendError } from './errors.js';
import type { AppEnv } from './hono.js';
import { requireUser, sessionMiddleware } from './session.js';

function appWithRoutes() {
  const app = new Hono<AppEnv>();
  app.use(sessionMiddleware);
  app.get('/whoami', (c) => c.json({ user: c.get('user') }));
  app.get('/mine', (c) => c.json({ id: requireUser(c).id }));
  app.onError((error, c) => (error instanceof ApiError ? sendError(c, error) : c.text('boom', 500)));
  return app;
}

describe('session (before sign-in exists)', () => {
  it('gives every request no user', async () => {
    const response = await appWithRoutes().request('/whoami');

    expect(await response.json()).toEqual({ user: null });
  });

  it('answers 401 on routes that need an account', async () => {
    const response = await appWithRoutes().request('/mine');

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: { code: 'unauthorized', message: 'Sign in to do this' } });
  });
});
