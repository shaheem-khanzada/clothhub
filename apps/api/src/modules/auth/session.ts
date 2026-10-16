import type { SessionLookup } from '../../lib/session.js';
import type { Auth } from './auth.js';

/** The session lookup `sessionMiddleware` uses: Better Auth reads the session cookie and checks it. */
export function betterAuthSessionLookup(auth: Auth): SessionLookup {
  return async (headers) => {
    const session = await auth.api.getSession({ headers });

    if (!session) return null;

    const { id, name, email, image } = session.user;

    return { id, name, email, imageUrl: image ?? null };
  };
}
