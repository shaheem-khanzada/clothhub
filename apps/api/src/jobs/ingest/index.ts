/**
 * Ingest job: scraper MySQL database → ClothHub's `catalog.*` tables (Postgres).
 *
 * Runs as a Coolify scheduled task (`node dist/jobs/ingest.js`). To be built
 * after the scraper data scan (docs/architecture.md, phase 2):
 *   1. read rows changed since the last successful run (read-only MySQL user, via mysql2);
 *   2. normalise them — prices, names, piece count, fabric, stock, details;
 *   3. upsert by (brand, source product id), so re-runs are safe;
 *   4. retire products that disappeared from the source;
 *   5. record the run in `ingest.runs`.
 */

console.log('Ingest is not implemented yet.');
