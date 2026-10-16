import { z } from 'zod';

/** An optional variable; an empty value (`KEY=` in .env) counts as unset. */
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((value) => (value === '' ? undefined : value), schema.optional());

/**
 * Every environment variable the API reads, validated once at start-up.
 * A missing or malformed value stops the process with a clear message
 * instead of failing later on the first request that needs it.
 *
 * Values come from Coolify's environment settings in staging/production and
 * from `apps/api/.env` locally (see the root `.env.example`).
 */
const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  /** ClothHub's own database. */
  DATABASE_URL: z.url(),

  /** Read-only connection to the scraper's MySQL database (mysql://…). Only the ingest job needs it. */
  SCRAPER_DATABASE_URL: optional(z.url()),

  /*
   * Sign-in (Better Auth). Only the server needs these; `authConfig()` checks
   * them when it starts, so the jobs run without them.
   */

  /** Signs session cookies. 32+ random characters: `openssl rand -base64 32`. */
  BETTER_AUTH_SECRET: optional(z.string().min(32)),
  /** The API's public address, e.g. https://api.clothhub.digital. */
  BETTER_AUTH_URL: optional(z.url()),

  /** Google sign-in. Off until both are set. */
  GOOGLE_CLIENT_ID: optional(z.string().min(1)),
  GOOGLE_CLIENT_SECRET: optional(z.string().min(1)),

  /** Sign in with Apple: the Services ID and its signed client secret (a JWT). Off until both are set. */
  APPLE_CLIENT_ID: optional(z.string().min(1)),
  APPLE_CLIENT_SECRET: optional(z.string().min(1)),
  /** The iOS app's bundle id, which Apple puts in the identity token of a native sign-in. */
  APPLE_APP_BUNDLE_ID: z.string().min(1).default('com.clothhub.digital'),
});

export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = EnvSchema.safeParse(source);

  if (!parsed.success) {
    const problems = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    throw new Error(`Invalid environment:\n${problems}`);
  }

  return parsed.data;
}
