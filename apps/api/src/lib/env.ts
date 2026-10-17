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

  /**
   * Sign in with Apple, from the key made under developer.apple.com → Keys.
   * Off until all three are set. The Team ID and Key ID are 10 characters.
   */
  APPLE_TEAM_ID: optional(z.string().length(10)),
  APPLE_KEY_ID: optional(z.string().length(10)),
  /**
   * The key's .p8 file, BEGIN and END lines included. Multi-line in double
   * quotes, or on one line with `\n` where the line breaks are.
   */
  APPLE_PRIVATE_KEY: optional(z.string().min(1).transform((key) => key.replaceAll('\\n', '\n').trim())),
  /** The iOS app's bundle id: what Apple addresses the app's identity tokens to. */
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
