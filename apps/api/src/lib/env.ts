import { z } from 'zod';

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
  SCRAPER_DATABASE_URL: z.url().optional(),
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
