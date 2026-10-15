# AGENTS.md — @clothhub/api

Hono REST API on Node 22, Zod for validation and OpenAPI, Drizzle on MySQL 8.4.
One Docker image with four commands: `index` (server), `migrate`, `jobs/ingest` and `jobs/placeholders`.

## Layout

```
src/
  index.ts            starts the server (the only file that listens)
  app.ts              builds the Hono app from its dependencies — no side effects, used by tests
  lib/                env (validated), logger, errors, ids (UUIDv7), session seam, validation hook, advisory lock
  db/
    client.ts         Drizzle + mysql2 pool
    migrate.ts        applies drizzle/ migrations
    schema/           one file per domain (catalog, ingest)
  modules/<name>/     routes.ts (HTTP + OpenAPI) · service.ts (queries) · *.test.ts (unit)
    catalog/          brands and products; scope.ts defines what the app shows
    ingest/           scraper reader, normalisation rules (pure, unit-tested), run.ts
    placeholders/     ThumbHash for every listed cover photo (thumbhash.ts, run.ts)
  jobs/<name>/        each scheduled job's entry point (ingest, placeholders)
drizzle/              generated SQL migrations (committed)
test/                 integration tests against MySQL; helpers/ has factories
  fixtures/           the scraper's table definitions, for the fake scraper database
```

## Conventions

- **Routes:** versioned under `/v1`, defined with `createRoute` from
  `@hono/zod-openapi`, using schemas from `@clothhub/shared`. Every route
  appears in `/openapi.json`. Validation failures go through
  `lib/validation.ts` (400 `invalid_request`).
- **Errors:** throw `ApiError` (`lib/errors.ts`); the body is always
  `{ error: { code, message, details? } }` with snake_case codes.
- **Database:**
  - Columns are snake_case (Drizzle `casing: 'snake_case'`); ids are UUIDv7
    (`lib/ids.ts`), money is `BIGINT` minor units, timestamps `DATETIME(3)` UTC.
  - Catalogue lists filter on `products.listed` (`isListed`). Change what the
    app shows in `modules/catalog/scope.ts`, never with ad-hoc conditions.
  - Pick a page's ids from an index first, then load those rows (see
    `CatalogService.listProducts`); add an index for every new sort.
- **Migrations:**
  - Edit the schema, then `npm run db:generate` and commit the SQL. For SQL
    Drizzle cannot express (FULLTEXT), `npx drizzle-kit generate --custom`.
  - Forward-only and additive. Never edit an applied migration.
- **Ingest:**
  - Read only `brands` and `liveProducts` from the scraper, through
    `ScraperReader`, which validates each row.
  - Normalisation rules are pure functions with unit tests using real titles.
    When rules change, bump `INGEST_VERSION` (`modules/ingest/transform.ts`).
  - Brand names, audiences and currencies are curated in `modules/ingest/brands.ts`.
- **Jobs:** guard a scheduled job with `withAdvisoryLock` (`lib/advisoryLock.ts`) so runs never
  overlap, and make every run safe to repeat.
- **Responses** are gzipped and carry an ETag (`app.ts`); keep list endpoints cacheable with
  `Cache-Control` so a refresh with nothing new is a bodiless 304.
- **Config:** read through `loadEnv()` only. A new variable goes in the schema
  there and in the root `.env.example`.
- **Sign-in seam (until phase 6):** `sessionMiddleware` sets `c.get('user')`
  (always null); routes that need an account call `requireUser(c)`. Don't
  parse tokens anywhere else.

## Checks

```bash
npm run typecheck -w @clothhub/api
npm run test:unit -w @clothhub/api          # no database
npm test -w @clothhub/api                   # unit + integration (needs `npm run db:up`)
```

Integration tests create and drop `clothhub_test` and `clothhub_test_scraper`
on the server in `TEST_DATABASE_URL` (default: the docker compose MySQL).
