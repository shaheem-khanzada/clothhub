# ClothHub — Backend & Platform Plan (V1)

Status: phases 0–4 built (catalogue API, ingest, app on the API). Next: deploy dev and production on
Coolify (phase 5). Sign-in is the **last** phase, and everything before it is shaped so adding it is a
small, contained change.

---

## 1. Decisions

| Area | Decision |
| --- | --- |
| Repo | One GitHub repo (monorepo): mobile app + API + shared contracts |
| API | Node + **Hono**, REST, request/response validated with **Zod**, OpenAPI generated from the same schemas |
| Database | **MySQL 8.4 on the scraper's server**, in ClothHub's own databases (`clothhub_dev`, `clothhub_prod`). The scraper's database is never written to |
| ORM / migrations | **Drizzle ORM** (mysql2) + Drizzle Kit migrations |
| Search | MySQL FULLTEXT (name, title, brand/type/tags/fabric/colour text) + LIKE for short words and codes. No separate search engine in V1 |
| Auth (last phase) | **Better Auth** inside the API, on the same database: Sign in with Apple, Google, email one-time code |
| Runtime | Everything runs from **Docker**. One image for the API, deployed on **Coolify** (Hostinger) |
| Environments | **Development** (auto-deploys from `main`) and **production** (deployed by hand) — see `docs/deployment.md` |
| Tests | API: Vitest, unit + integration against a real MySQL. Mobile: Jest (jest-expo) + React Native Testing Library. CI runs both |
| Mobile data | **React Query** for server data, **Zustand** for client state, MMKV for what must survive restarts |
| Mobile delivery | Development build on the phone + EAS Update for over-the-air JS changes |

---

## 2. Repository layout

```
clothhub/
  apps/
    mobile/                  Expo app
      src/domain/catalog/    api.ts (HTTP + schema parsing), mapper.ts, query hooks, browse store
      src/domain/auth/       sign-in seam: useSession(), useRequireAccount()
    api/
      src/
        index.ts             HTTP server
        app.ts               routes, error handling, session middleware
        modules/
          catalog/           routes, service (queries), scope, search
          ingest/            scraper reader, normalisation rules, run orchestration
          health/
        db/schema/           Drizzle tables (catalog, ingest)
        jobs/ingest/         the scheduled job's entry point
        lib/                 env, logger, errors, ids (UUIDv7), session
      drizzle/               SQL migrations (committed)
      test/                  integration tests (MySQL) and fixtures
      Dockerfile
  packages/
    shared/                  Zod schemas + TS types for every API request/response
  docker/mysql/init/         local MySQL grants
  scripts/                   scan-scraper-db.mjs, load-scraper-dump.sh
  docker-compose.yml         local MySQL (+ API container)
  .github/workflows/ci.yml   typecheck, API tests against MySQL, mobile tests, build
```

npm workspaces. `packages/shared` is the contract: the API validates against it and the mobile app parses
responses with it, so a breaking change fails the typecheck on both sides in the same pull request.

---

## 3. Data architecture

```
clothhub-prod-db (scraper)  ──read-only──▶  ingest job  ──▶  clothhub_dev / clothhub_prod  ──▶  API  ──▶  app
  brands, liveProducts                    (validate,         brands, products, images,
                                           normalise,        variants, ingest_runs
                                           upsert, retire)
```

- **The API never queries the scraper database.** The scraper can change its tables (it is being reworked)
  without breaking the app, and later sources (brand APIs, CSV, brand dashboard) plug into the same ingest
  step.
- **Ingest job** (same Docker image, different command, a Coolify scheduled task):
  - reads the scraper's `liveProducts` (validated, published) — never `syncedProducts`;
  - validates every row with Zod; rows that no longer fit are reported and skipped;
  - first run: everything (~4 min for 290k products); later runs: only rows whose `updatedAt` moved,
    and unchanged content (hash) is skipped;
  - normalises: audience, category, piece count, stitching, fabric, colours, sizes, display names,
    description → description / Shirt-Dupatta-Trouser parts / highlights;
  - upserts by `(brand, source_product_id)` with stable UUIDv7 ids, so re-runs are safe;
  - **retires** products the scraper removed or deleted (kept for saved lists and share links), and
    restores them if they come back;
  - recomputes brand audiences, the app's scope (`products.listed`), brand counts and cover images;
  - one run at a time per database (MySQL advisory lock), so dev and prod never block each other.
- **Scope** (what the app shows): women's clothing and unstitched, from active brands, not retired.
  Defined once in `apps/api/src/modules/catalog/scope.ts`; stored per product by ingest so every list
  query is one indexed filter. USD-priced brands are hidden until the app can show other currencies.
- Details: `docs/scraper-data.md` (what the data looks like), `docs/data-model.md` (tables).

---

## 4. API (V1)

| Endpoint | Purpose |
| --- | --- |
| `GET /health` | Coolify health check |
| `GET /v1/brands` | Brands with products to show, most in-stock first, with counts and a cover image |
| `GET /v1/brands/{brandId}` | One brand |
| `GET /v1/products` | Products across brands or for one (`brandId`): sort (`featured`, `priceAsc`, `priceDesc`, `newest`, `oldest`), filters (`inStock`, `onSale`, `pieceType`, `minPrice`, `maxPrice`), search (`q`), paging (`page`, `limit` ≤ 50), and facets for the filter sheet |
| `GET /v1/products/{productId}` | One product, for share links and deep links — also when retired |
| `GET /openapi.json` | OpenAPI 3.1, generated from the shared Zod schemas |

Conventions: versioned paths (`/v1`), one JSON error shape (`{ error: { code, message, details? } }`),
`Cache-Control` on catalogue reads, request logging with request ids. Responses take 15–130 ms on the
full catalogue (124k listed products).

---

## 5. Docker & Coolify

- **One Dockerfile** (multi-stage, small production image). The same image runs three commands:
  - `node dist/index.js` — the HTTP server
  - `node dist/migrate.js` — applies migrations (Coolify pre-deployment command)
  - `node dist/jobs/ingest.js` — the import (Coolify scheduled task)
- **Local:** `npm run db:up` starts MySQL 8.4; `npm run scraper:load <dump>` loads a scraper dump; `npm run
  ingest` fills the catalogue; `npm run api` serves it.
- **Coolify:** two API apps (dev, prod) on the scraper's MySQL server, each with its own database and user,
  plus a read-only user for the scraper. Step by step: `docs/deployment.md`.
- **Secrets** (database URLs, later Apple/Google/Resend keys) live only in Coolify's environment settings
  and local `.env` files that git ignores — never in the repo or in chat.

---

## 6. Phases

| # | Phase | Status |
| --- | --- | --- |
| 0 | **Repo** — monorepo, workspaces, CI | ✅ |
| 1 | **Scan the scraper data** | ✅ `docs/scraper-data.md` (snapshot of 8 Oct 2026) |
| 2 | **Database + ingest** — schema, migrations, ingest job | ✅ full snapshot imports in ~4 min; re-runs are safe |
| 3 | **Catalogue API** — endpoints, OpenAPI, tests | ✅ 138 API tests (unit + MySQL integration) |
| 4 | **Mobile on the API** — real `api.ts`, env URL, React Query + Zustand, tests | ✅ 37 mobile tests |
| 5 | **Dev + production on Coolify** — databases, two API apps, scheduled ingest; app pointed at dev | Next — `docs/deployment.md` |
| 6 | **Sign-in** — Better Auth: Apple, Google, email code; sign-in sheet; delete account | |
| 7 | **Synced saves** — favourites and collections per account; local hearts merged on first sign-in | |

---

## 7. Built now so sign-in is easy later

- **API:** `sessionMiddleware` runs on every request and sets `c.get('user')` — always `null` until phase
  6, which swaps in Better Auth's session lookup. Routes that need an account call `requireUser(c)`
  (401 `unauthorized`). No route changes in phase 6.
- **Database:** Better Auth's tables get their own schema file. App data that belongs to a user
  (`favorites`, `collections`, `collection_items`) is keyed by `user_id` from the start.
- **Mobile:** `useSession()` (always signed out for now) and `useRequireAccount()`, which every
  save/collect action goes through (`useToggleFavorite`). Today the gate runs the action on the device;
  in phase 6 it opens the sign-in sheet first. The favourites store is already a local cache with a
  `toggle`; phase 7 adds a sync step and screens keep the same hooks.

---

## 8. Needed from Furqan

- **Phase 5:** run the SQL in `docs/deployment.md` §1 on the MySQL server (or give Coolify access), choose
  the two API domains, and create the two Coolify apps (or let Claude walk through it).
- **Phase 6:** Apple Developer (Sign in with Apple key), Google Cloud (OAuth client IDs for iOS, Android,
  web), Resend account and a sending domain.

## Scraper data access

- The scraper's database is MySQL on Coolify; ClothHub's databases live on the same server.
- Production reads it with a **read-only** user (`clothhub_reader`, `GRANT SELECT` on `clothhub-prod-db`
  only), over the internal host — no public port.
- Locally, load a dump (Coolify → database → Backups → download) with `npm run scraper:load <file>`;
  the scraper's admin accounts are skipped. `npm run scan:scraper` still exports structure and samples
  over a direct connection, read-only.
