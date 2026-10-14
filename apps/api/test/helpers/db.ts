import mysql from 'mysql2/promise';
import { afterAll } from 'vitest';

import { createDatabase } from '../../src/db/client.js';
import { databaseUrl, TEST_DATABASE, TEST_SCRAPER_DATABASE } from '../setup/databases.js';

/**
 * Connections for one test file, closed after the file's tests. Call at
 * module level: `const { db, pool } = useTestDatabase();`
 */
export function useTestDatabase() {
  const database = createDatabase(databaseUrl(TEST_DATABASE), { connectionLimit: 4 });

  afterAll(async () => {
    await database.pool.end();
  });

  return database;
}

export function useScraperDatabase() {
  const pool = mysql.createPool({
    uri: databaseUrl(TEST_SCRAPER_DATABASE),
    connectionLimit: 2,
    timezone: 'Z',
  });

  afterAll(async () => {
    await pool.end();
  });

  return pool;
}

async function truncate(pool: mysql.Pool, tables: string[]) {
  const connection = await pool.getConnection();
  try {
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    for (const table of tables) await connection.query(`TRUNCATE TABLE \`${table}\``);
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
  } finally {
    connection.release();
  }
}

export function resetCatalog(pool: mysql.Pool) {
  return truncate(pool, ['product_variants', 'product_images', 'products', 'brands', 'ingest_runs']);
}

export function resetScraper(pool: mysql.Pool) {
  return truncate(pool, ['liveProducts', 'brands']);
}
