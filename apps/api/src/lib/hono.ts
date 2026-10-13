/** The signed-in user, as routes see it. Filled by `sessionMiddleware` (src/lib/session.ts). */
export type SessionUser = {
  id: string;
};

/** Hono context typing shared by every module. */
export type AppEnv = {
  Variables: {
    requestId: string;
    /** Always null until sign-in exists. */
    user: SessionUser | null;
  };
};
