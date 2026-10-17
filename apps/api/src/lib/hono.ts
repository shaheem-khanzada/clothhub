/** The signed-in user, as routes see it. Filled by `sessionMiddleware` (src/lib/session.ts). */
export type SessionUser = {
  id: string;
  name: string;
  email: string;
  imageUrl: string | null;
};

/** Hono context typing shared by every module. */
export type AppEnv = {
  Variables: {
    requestId: string;
    /** The signed-in user, or null for someone browsing signed out. */
    user: SessionUser | null;
  };
};
