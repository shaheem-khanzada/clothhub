import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema/index.js';

/**
 * One pool per process. `max` stays modest: Coolify runs a single API
 * container per environment and Postgres connections are not free.
 */
export function createDatabase(url: string, options: { max?: number } = {}) {
  const sql = postgres(url, { max: options.max ?? 10 });
  const db = drizzle(sql, { schema, casing: 'snake_case' });

  return { db, sql };
}

export type Database = ReturnType<typeof createDatabase>['db'];
