import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { drizzle } from 'drizzle-orm/mysql2';
import { migrate } from 'drizzle-orm/mysql2/migrator';
import mysql from 'mysql2/promise';

import { databaseUrl, serverOnlyUrl, TEST_DATABASE, TEST_SCRAPER_DATABASE } from './databases.js';

const migrationsFolder = fileURLToPath(new URL('../../drizzle', import.meta.url));
const scraperSchema = fileURLToPath(new URL('../fixtures/scraper-schema.sql', import.meta.url));

/** Recreates both test databases once per `vitest run`. */
export default async function setup() {
  let server: mysql.Connection;

  try {
    server = await mysql.createConnection({ uri: serverOnlyUrl(), multipleStatements: true });
  } catch (error) {
    throw new Error(
      `Integration tests need MySQL at ${serverOnlyUrl().replace(/:[^:@/]*@/, ':***@')}. ` +
        `Start it with \`npm run db:up\` (or set TEST_DATABASE_URL). Cause: ${String(error)}`,
    );
  }

  try {
    for (const name of [TEST_DATABASE, TEST_SCRAPER_DATABASE]) {
      await server.query(`DROP DATABASE IF EXISTS \`${name}\``);
      await server.query(`CREATE DATABASE \`${name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`);
    }

    await server.query(`USE \`${TEST_SCRAPER_DATABASE}\``);
    await server.query(await readFile(scraperSchema, 'utf8'));
  } finally {
    await server.end();
  }

  const pool = mysql.createPool({ uri: databaseUrl(TEST_DATABASE), connectionLimit: 1 });
  try {
    await migrate(drizzle({ client: pool }), { migrationsFolder });
  } finally {
    await pool.end();
  }
}
