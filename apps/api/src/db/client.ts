import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

import * as schema from './schema/index.js';

/**
 * One pool per process. `connectionLimit` stays modest: Coolify runs a single
 * API container per environment, and the MySQL server is shared with the
 * scraper.
 */
export function createDatabase(url: string, options: { connectionLimit?: number } = {}) {
  const pool = mysql.createPool({
    uri: url,
    connectionLimit: options.connectionLimit ?? 10,
    // Timestamps are stored in UTC and read back as UTC.
    timezone: 'Z',
    dateStrings: false,
    supportBigNumbers: true,
    bigNumberStrings: false,
  });

  const db = drizzle({ client: pool, schema, mode: 'default', casing: 'snake_case' });

  return { db, pool };
}

export type Database = ReturnType<typeof createDatabase>['db'];
