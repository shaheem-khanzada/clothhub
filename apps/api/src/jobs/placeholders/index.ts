import { createDatabase } from '../../db/client.js';
import { loadEnv } from '../../lib/env.js';
import { createLogger } from '../../lib/logger.js';
import { Placeholders } from '../../modules/placeholders/run.js';

/**
 * Placeholders job: a ThumbHash for every listed product's cover photo.
 *
 *   node dist/jobs/placeholders.js               every cover still missing one
 *   node dist/jobs/placeholders.js --limit 5000  at most this many this run
 *
 * Runs right after the ingest job, in the same scheduled task. The first run
 * works through the whole catalogue (roughly 40 minutes); later runs only
 * hash what the import added. See src/modules/placeholders/run.ts.
 */

const env = loadEnv();
const logger = createLogger(env.LOG_LEVEL);

const limitFlag = process.argv.indexOf('--limit');
const limit = limitFlag === -1 ? undefined : Number(process.argv[limitFlag + 1]);

if (limit !== undefined && !(Number.isInteger(limit) && limit > 0)) {
  logger.fatal('--limit needs a positive whole number.');
  process.exit(1);
}

const target = createDatabase(env.DATABASE_URL, { connectionLimit: 3 });

try {
  const stats = await new Placeholders(target, { limit, logger }).run();
  logger.info(stats, 'Done');
} catch (error) {
  logger.fatal({ err: error }, 'Placeholders failed');
  process.exitCode = 1;
} finally {
  await target.pool.end();
}
