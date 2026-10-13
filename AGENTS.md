# AGENTS.md — ClothHub monorepo

Read this first, then the AGENTS.md of the workspace you are changing:

- `apps/mobile/AGENTS.md` — app architecture, UI and translation rules
- `apps/api/AGENTS.md` — API conventions
- `docs/architecture.md` — phases and deployment
- `docs/data-model.md` — the Postgres design; new tables follow it

## Workspaces

| Path | Package | What |
| --- | --- | --- |
| `apps/mobile` | `@clothhub/mobile` | Expo app |
| `apps/api` | `@clothhub/api` | Hono REST API + ingest job, one Docker image |
| `packages/shared` | `@clothhub/shared` | Zod schemas and types for every API request/response |

npm workspaces; install once from the root with `npm install`. Never run
`npm install` inside a workspace, and never add a second lockfile.

## Rules that span workspaces

- **The contract lives in `@clothhub/shared`.** An endpoint's request and
  response schemas are defined there first. The API validates with them and
  generates OpenAPI from them; the app parses responses with them. Don't
  re-declare those types in either app.
- **One TypeScript version** across the repo (the one Expo supports).
- **Secrets never enter git or chat.**
  - Local values go in `apps/api/.env` (git-ignored); deployed values go in Coolify.
  - Database URLs, OAuth keys and email keys are all secrets.
- **The API never queries the scraper's database.** Only the ingest job reads
  it (MySQL, via `mysql2`), through a read-only user.
- **Sign-in is planned for a later phase.** Keep the seams described in
  `docs/architecture.md` §7: session middleware, the `requireAccount()` gate,
  and user-keyed tables.

## Before handing work back

```bash
npm run typecheck
npm test
```

For API changes that touch the database, run them against Postgres
(`npm run db:up`, `npm run db:migrate`), not only unit tests.
