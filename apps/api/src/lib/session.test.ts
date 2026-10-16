import { Hono } from 'hono';
import { describe, expect, it, vi } from 'vitest';

import { ApiError, sendError } from './errors.js';
import type { AppEnv, SessionUser } from './hono.js';
import { requireUser, sessionMiddleware, type SessionLookup } from './session.js';

const ADA: SessionUser = { id: 'user-1', name: 'Ada', email: 'ada@example.com', imageUrl: null };

function appWith(lookup: SessionLookup) {
  const app = new Hono<AppEnv>();
  app.use(sessionMiddleware(lookup));
  app.get('/whoami', (c) => c.json({ user: c.get('user') }));
  app.get('/mine', (c) => c.json({ id: requireUser(c).id }));
  app.get('/api/auth/get-session', (c) => c.json({ user: c.get('user') }));
  app.onError((error, c) => (error instanceof ApiError ? sendError(c, error) : c.text('boom', 500)));
  return app;
}

const withCookie = { headers: { Cookie: 'clothhub.session_token=abc' } };

describe('sessionMiddleware', () => {
  it('gives the request the user its session cookie belongs to', async () => {
    const lookup = vi.fn<SessionLookup>(async () => ADA);
    const response = await appWith(lookup).request('/whoami', withCookie);

    expect(await response.json()).toEqual({ user: ADA });
    expect(lookup).toHaveBeenCalledTimes(1);
  });

  it('skips the lookup for requests without cookies (browsing signed out)', async () => {
    const lookup = vi.fn<SessionLookup>(async () => ADA);
    const response = await appWith(lookup).request('/whoami');

    expect(await response.json()).toEqual({ user: null });
    expect(lookup).not.toHaveBeenCalled();
  });

  it("leaves sign-in's own endpoints to Better Auth", async () => {
    const lookup = vi.fn<SessionLookup>(async () => ADA);
    await appWith(lookup).request('/api/auth/get-session', withCookie);

    expect(lookup).not.toHaveBeenCalled();
  });

  it('treats an unknown or expired session as signed out', async () => {
    const response = await appWith(async () => null).request('/whoami', withCookie);

    expect(await response.json()).toEqual({ user: null });
  });
});

describe('requireUser', () => {
  it('passes the signed-in user through', async () => {
    const response = await appWith(async () => ADA).request('/mine', withCookie);

    expect(await response.json()).toEqual({ id: 'user-1' });
  });

  it('answers 401 when nobody is signed in', async () => {
    const response = await appWith(async () => null).request('/mine');

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: { code: 'unauthorized', message: 'Sign in to do this' } });
  });
});
