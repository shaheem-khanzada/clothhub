import { sql } from 'drizzle-orm';
import { char, datetime, index, json, mysqlEnum, mysqlTable, text, varchar } from 'drizzle-orm/mysql-core';

export type IngestStats = {
  brands: number;
  read: number;
  created: number;
  updated: number;
  unchanged: number;
  retired: number;
  restored: number;
  skippedUnknownBrand: number;
};

/**
 * One row per ingest run. The newest successful run's `sourceCursor` (the
 * scraper's `updatedAt` it reached) is where the next run starts.
 */
export const ingestRuns = mysqlTable(
  'ingest_runs',
  {
    id: char({ length: 36 }).primaryKey(),
    source: varchar({ length: 40 }).notNull(),
    mode: mysqlEnum(['full', 'incremental']).notNull(),
    status: mysqlEnum(['running', 'succeeded', 'failed']).notNull(),
    startedAt: datetime({ fsp: 3 })
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP(3))`),
    finishedAt: datetime({ fsp: 3 }),
    sourceCursor: datetime({ fsp: 3 }),
    stats: json().$type<IngestStats>(),
    error: text(),
  },
  (table) => [index('ix_ingest_runs_source').on(table.source, table.status, table.startedAt)],
);
