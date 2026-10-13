import { pgSchema } from 'drizzle-orm/pg-core';

/**
 * Postgres schemas (namespaces) — one per domain, so tables, permissions and
 * future moves (e.g. signals to a separate database) stay clean.
 * Others (`auth`, `social`, `signals`) are added when their phase starts.
 */

/** Brands, products and everything ingested from sources. */
export const catalog = pgSchema('catalog');

/** Sync bookkeeping: runs, per-source cursors, errors. */
export const ingest = pgSchema('ingest');
