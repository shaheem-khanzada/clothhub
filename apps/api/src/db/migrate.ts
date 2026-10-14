import { migrate } from 'drizzle-orm/mysql2/migrator';

import { loadEnv } from '../lib/env.js';
import { createDatabase } from './client.js';

/**
 * Applies pending migrations from `drizzle/`, then exits.
 * Coolify runs this before each deploy (`node dist/migrate.js`).
 */
const env = loadEnv();
const { db, pool } = createDatabase(env.DATABASE_URL, { connectionLimit: 1 });

try {
  await migrate(db, { migrationsFolder: process.env.MIGRATIONS_DIR ?? 'drizzle' });
  console.log('Migrations applied.');
} finally {
  await pool.end();
}
