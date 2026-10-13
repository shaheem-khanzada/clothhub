# AGENTS.md — @clothhub/api

Hono REST API on Node 22, Zod for validation and OpenAPI, Drizzle on Postgres.
One Docker image with three commands: `index` (server), `migrate`, and `jobs/ingest`.

## Layout

```
src/
  index.ts            starts the server (the only file that listens)
  app.ts              builds the Hono app — no side effects, used by tests
  lib/                env (validated), logger, errors
  db/
    client.ts         Drizzle + postgres.js pool
    migrate.ts        applies drizzle/ migrations
    schema/           one file per domain; namespaces.ts declares Postgres schemas
  modules/<name>/     routes.ts (HTTP + OpenAPI) · service.ts (queries) · *.test.ts
  jobs/ingest/        scraper → catalog sync
drizzle/              generated SQL migrations (committed)
test/                 cross-module tests
```

## Conventions

- **Routes:** versioned under `/v1`, defined with `createRoute` from
  `@hono/zod-openapi`, using schemas from `@clothhub/shared`. Every route
  appears in `/openapi.json`.
- **Errors:** always `{ error: { code, message } }`, with machine-readable
  `code`s in snake_case.
- **Database:**
  - Tables go in the namespace for their domain (`docs/data-model.md`).
  - Columns are snake_case (Drizzle `casing: 'snake_case'`).
  - Ids are UUIDv7, money is integer minor units, and timestamps are `timestamptz`.
- **Migrations:**
  - Edit the schema, then run `npm run db:generate` and commit the SQL.
  - Migrations are forward-only and additive. Never edit an applied migration.
- **Config:** read through `loadEnv()` only. A new variable goes in the schema
  there and in the root `.env.example`.
- **Sign-in seam (until phase 6):** routes get the user from the session
  middleware, which currently always yields no user. Don't parse tokens
  anywhere else.

## Checks

```bash
npm run typecheck -w @clothhub/api
npm test -w @clothhub/api
```
