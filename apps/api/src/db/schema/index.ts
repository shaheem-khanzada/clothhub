/**
 * Drizzle schema — one file per domain, re-exported here.
 *
 * Postgres schemas (namespaces) keep domains apart as the product grows:
 *   catalog.*   brands, products, images, sizes, price history (ingested)
 *   ingest.*    sync runs and source cursors
 *   auth.*      Better Auth tables (last phase)
 *   social.*    favourites, collections, follows, posts (later)
 *   signals.*   views, saves, shares, votes → trending / "most loved" (later)
 *
 * See docs/data-model.md for the design. Tables are added module by module.
 */

export * from './namespaces.js';
