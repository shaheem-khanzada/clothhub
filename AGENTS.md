# AGENTS.md — ClothHub monorepo

Read this first, then the AGENTS.md of the workspace you are changing:

- `apps/mobile/AGENTS.md` — app architecture, UI and translation rules
- `apps/api/AGENTS.md` — API conventions
- `apps/landing/AGENTS.md` — the marketing site: structure, design and content rules
- `docs/architecture.md` — phases and deployment
- `docs/data-model.md` — the database design; new tables follow it
- `docs/deployment.md` — development and production on Coolify

## Workspaces

| Path | Package | What |
| --- | --- | --- |
| `apps/mobile` | `@clothhub/mobile` | Expo app |
| `apps/api` | `@clothhub/api` | Hono REST API + ingest job, one Docker image |
| `apps/landing` | `@clothhub/landing` | Next.js marketing site + waitlist, one Docker image |
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
  it (MySQL, via `mysql2`), through a read-only user. ClothHub's own tables
  live in their own databases (`clothhub_dev`, `clothhub_prod`) on the same
  server.
- **Shared code is plain TypeScript with extensionless imports** in
  `packages/shared`, so Metro, tsx and tsup all resolve it.
- **Sign-in is planned for a later phase.** Keep the seams described in
  `docs/architecture.md` §7: the API's `sessionMiddleware` / `requireUser`,
  the app's `useSession()` / `useRequireAccount()`, and user-keyed tables.

## Before handing work back

```bash
npm run typecheck
npm test
```

The API's integration tests run against a real MySQL (`npm run db:up`); CI
runs everything above on each pull request. For catalogue or ingest changes,
also run an import against a scraper dump (`npm run scraper:load`,
`npm run ingest`) and check the numbers.
