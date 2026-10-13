import mysql from 'mysql2/promise';

import { createDatabase } from '../../db/client.js';
import { loadEnv } from '../../lib/env.js';
import { createLogger } from '../../lib/logger.js';
import { Ingest, type IngestMode } from '../../modules/ingest/run.js';
import { ScraperReader } from '../../modules/ingest/scraper.js';

/**
 * Ingest job: the scraper's published products → ClothHub's catalogue.
 *
 *   node dist/jobs/ingest.js                 incremental (full on the first run)
 *   node dist/jobs/ingest.js --full          re-read and re-normalise everything
 *
 * Runs as a Coolify scheduled task, after the scraper's own sync. See
 * src/modules/ingest/run.ts for what a run does.
 */

const env = loadEnv();
const logger = createLogger(env.LOG_LEVEL);

if (!env.SCRAPER_DATABASE_URL) {
  logger.fatal('SCRAPER_DATABASE_URL is not set; the ingest job needs read access to the scraper database.');
  process.exit(1);
}

const mode: IngestMode = process.argv.includes('--full')
  ? 'full'
  : process.argv.includes('--incremental')
    ? 'incremental'
    : 'auto';

const target = createDatabase(env.DATABASE_URL, { connectionLimit: 3 });
const scraperPool = mysql.createPool({ uri: env.SCRAPER_DATABASE_URL, connectionLimit: 2, timezone: 'Z' });

try {
  const result = await new Ingest(target, new ScraperReader(scraperPool), { logger }).run(mode);
  logger.info({ ...result.stats, invalid: result.invalid.length }, 'Done');
} catch (error) {
  logger.fatal({ err: error }, 'Ingest failed');
  process.exitCode = 1;
} finally {
  await Promise.all([target.pool.end(), scraperPool.end()]);
}
