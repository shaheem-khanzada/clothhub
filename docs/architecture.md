# ClothHub — Backend & Platform Plan (V1)

Status: agreed direction, not built yet. Sign-in is the **last** phase, but everything before it is shaped so adding it is a small, contained change.

---

## 1. Decisions

| Area | Decision |
| --- | --- |
| Repo | One GitHub repo (monorepo): mobile app + API + shared contracts |
| API | Node + **Hono**, REST, request/response validated with **Zod**, OpenAPI generated from the same schemas |
| Database | **ClothHub's own Postgres**, separate from the scraper's database |
| ORM / migrations | **Drizzle ORM** + Drizzle Kit migrations |
| Search | Postgres full-text search + `pg_trgm` (fuzzy matching). No separate search engine in V1 |
| Auth (last phase) | **Better Auth** inside the API, on the same Postgres: Sign in with Apple, Google, email one-time code |
| Runtime | Everything runs from **Docker**. One image for the API, deployed on **Coolify** (Hostinger) |
| Tests | Vitest against a real Postgres started with Docker Compose |
| Mobile delivery | Development build on the phone + EAS Update for over-the-air JS changes |

---

## 2. Repository layout

```
clothhub/
  apps/
    mobile/              ← the current Expo app, moved as-is
    api/
      src/
        index.ts         ← HTTP server (Hono)
        modules/
          catalog/       ← brands, products, facets, search
          health/
          auth/          ← (last phase) Better Auth mount + session middleware
          me/            ← (last phase) favourites, collections
        db/
          schema/        ← Drizzle tables, one file per module
          migrations/
        jobs/
          ingest/        ← scraper DB → ClothHub DB sync
        lib/             ← config (env, validated with Zod), logger, errors
      Dockerfile
  packages/
    shared/              ← Zod schemas + TS types for every API request/response
  docker-compose.yml     ← local: postgres + api
  .github/workflows/     ← typecheck, test, build image; EAS Update for mobile
```

npm workspaces. `packages/shared` is the contract: the API validates against it and the mobile app parses responses with it, so a breaking change fails the typecheck on both sides in the same pull request.

---

## 3. Data architecture

```
Scraper MySQL  ──(read-only user)──▶  ingest job  ──▶  ClothHub Postgres  ──▶  API  ──▶  mobile
(scraper owns it)                  (normalise,          (catalog + app data)
                                    upsert, retire)
```

- **The API never queries the scraper database.** The scraper can change its tables without breaking the app, and later sources (brand APIs, CSV imports, brand dashboard) plug into the same ingest step. This matches the product doc's rule that the catalogue must not depend directly on scraping.
- **Ingest job** (same Docker image, different command, run on a schedule by Coolify):
  - reads new/changed rows since its last run;
  - normalises them — the cleanup that lives in the app's `mapper.ts` today moves here: prices, display names, piece count, fabric, stock, details parsing;
  - upserts by `(brand, source_product_id)`, so re-runs are safe;
  - products that disappear from the source are **retired** (hidden, kept for saved lists and share links), not deleted;
  - records price changes for later "price dropped" features.
- **ClothHub tables (V1 catalog):** `brands`, `products`, `product_images`, `product_sizes`, `product_components` (shirt / dupatta / trouser details), `ingest_runs`. Exact columns are decided after scanning the real scraper data (step 6).
- **Indexes:** brand + sort keys for the list, a `tsvector` column for search, a trigram index on names.

---

## 4. API (V1)

| Endpoint | Purpose |
| --- | --- |
| `GET /health` | Coolify health check |
| `GET /v1/brands` | Brand list with product count and cover image |
| `GET /v1/brands/:brandId/products` | Sort, filters (price range, type, in stock, on sale), search, pagination, facets for the filter sheet |
| `GET /v1/products/:productId` | One product, for share links and deep links |
| `GET /docs` | OpenAPI reference generated from the Zod schemas |

These match what the app's mock server returns today, so connecting the app means rewriting `src/domain/catalog/api.ts` and nothing else.

Conventions: versioned paths (`/v1`), one JSON error shape (`{ error: { code, message } }`), response caching headers on catalogue reads, request logging, rate limiting.

---

## 5. Docker & Coolify

- **One Dockerfile** (multi-stage, small production image). The same image runs three commands:
  - `api` — the HTTP server
  - `migrate` — applies database migrations (Coolify runs it before each deploy)
  - `ingest` — the sync job (Coolify scheduled task, e.g. every 6 hours)
- **Local and cloud sessions:** `docker compose up` starts Postgres + API with seed data (the 100 sample products), so Claude can run and test the API in a cloud session without touching staging or the scraper.
- **Coolify resources:** a Postgres database (ClothHub's own), the API app from the Dockerfile with environment secrets, and the scheduled ingest task. Staging deploys automatically from `main`.
- **Secrets** (scraper read-only URL, database URL, later Apple/Google/Resend keys) live only in Coolify's environment settings and local `.env` files that git ignores — never in the repo or in chat.

---

## 6. Phases

| # | Phase | Done when |
| --- | --- | --- |
| 0 | **Repo** — git, move the app into `apps/mobile`, workspaces, CI (typecheck + tests) | Repo on GitHub, CI green, cloud sessions can open it |
| 1 | **Scan the scraper data** — schema, row counts, field quality per brand | A short data report + the final catalogue schema |
| 2 | **Database + ingest** — Drizzle schema, migrations, ingest job, seed data | Local Docker DB filled from a scraper sample; re-runs are safe |
| 3 | **Catalogue API** — the four endpoints, OpenAPI, tests | Tests pass against Docker Postgres |
| 4 | **Mobile on the API** — real `api.ts`, environment URL per build, mock server kept only for tests | App browses real data locally |
| 5 | **Staging on Coolify** — Postgres, API, scheduled ingest, auto-deploy; EAS Update channel pointing at staging | Phone shows live staging data |
| 6 | **Sign-in** — Better Auth: Apple, Google, email code; sign-in sheet; delete account | Can sign up / in / out / delete on both platforms |
| 7 | **Synced saves** — favourites and collections stored per account; local hearts merged on first sign-in | Saves follow the user across devices |

---

## 7. Built now so sign-in is easy later

- **API:** a session middleware is in place from phase 3. Until phase 6 it always resolves "no user". Phase 6 swaps in Better Auth's session lookup; no route changes.
- **Database:** Better Auth's tables (`user`, `session`, `account`, `verification`) are their own Drizzle schema file. App data that belongs to a user (`favorites`, `collections`, `collection_items`) is keyed by `user_id` from the start.
- **Mobile:**
  - an `auth` domain exists from phase 4 with `useSession()` (always signed out for now) and a `requireAccount()` gate that every save/collect action goes through. Today the gate lets the action through locally; in phase 6 it opens the sign-in sheet.
  - the favourites store is already shaped as a local cache with a `toggle`; in phase 7 it gains a sync step, and screens keep calling the same hooks.

---

## 8. Needed from Furqan

- **Phase 0:** an empty private GitHub repo, and the Claude GitHub App installed on it.
- **Phase 1:** a scraper data snapshot (see "Scraper data access").
- **Phase 5:** Coolify access to create the Postgres, the API app and the scheduled task, or follow the step list.
- **Phase 6:** Apple Developer (Sign in with Apple key), Google Cloud (OAuth client IDs for iOS, Android, web), Resend account and a sending domain.

## Scraper data access

- The scraper's database is **MySQL** (on Coolify). ClothHub's own database stays Postgres; the ingest job reads MySQL with `mysql2` and writes Postgres.
- Create a **read-only** MySQL user for ClothHub (`GRANT SELECT` on the scraper database only). The ingest job uses it in production; its password goes straight into Coolify. On Coolify the ingest job can use the database's internal host, so the scraper database does not need a public port in production.
- For the phase 1 scan, the database password never needs to leave Furqan's machine: he runs `npm run scan:scraper` locally (hidden prompt, read-only session), and it writes the schema, row estimates and a sample of rows into `.data-scan/` for Claude to read. From a laptop this needs the database's **public** URL; the internal Coolify host only resolves inside the server.
