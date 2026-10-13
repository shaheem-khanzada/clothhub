/**
 * Drizzle schema — one file per domain, re-exported here.
 *
 * ClothHub's tables live in their own MySQL database (`clothhub_dev`,
 * `clothhub_prod`) on the same server as the scraper's database:
 *   catalog.ts   brands, products, images, variants (written by ingest)
 *   ingest.ts    ingest run history and cursor
 *   later:       auth (sign-in), social (saves, collections, follows, posts),
 *                signals (views, saves, shares → trending / "most loved")
 *
 * See docs/data-model.md for the design.
 */

export * from './catalog.js';
export * from './ingest.js';
