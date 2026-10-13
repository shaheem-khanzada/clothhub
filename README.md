# ClothHub

Fashion discovery for Pakistan: browse women's clothing from many brands in
one place, save what you love, and — later — follow people, post outfits and
let the community surface what's worth buying.

## Repository

```
apps/
  mobile/          Expo + React Native app (iOS, Android)
  api/             REST API — Hono, Zod, Drizzle, Postgres
packages/
  shared/          Zod schemas + types: the contract between api and mobile
docs/
  architecture.md  how the pieces fit, phases, deployment
  data-model.md    Postgres design, now and for the social features
scripts/
  scan-scraper-db.mjs  export the scraper DB's (MySQL) structure + sample rows locally
docker-compose.yml     local Postgres (+ the API image, optional)
```

## Getting started

Requirements: Node 22 (`.nvmrc`), Docker, Xcode / Android Studio for the app.

```bash
npm install                      # once, from the repo root (all workspaces)
```

**API**

```bash
cp .env.example apps/api/.env    # local settings
npm run db:up                    # Postgres in Docker
npm run db:migrate               # apply migrations
npm run api                      # http://localhost:3000/health, /openapi.json
```

Or run the production image locally: `docker compose --profile api up --build`.

**Mobile**

```bash
cd apps/mobile
npx expo prebuild --clean        # after moving into the monorepo, and after native changes
npx expo run:ios                 # or: npx expo run:android
```

The app needs a development build (native modules), not Expo Go.

## Everyday commands (repo root)

| Command | Does |
| --- | --- |
| `npm run typecheck` | Type-checks every workspace |
| `npm test` | Runs every workspace's tests |
| `npm run mobile` | Starts Metro for the app |
| `npm run api` | Starts the API with reload |
| `npm run db:generate` | Creates a migration from schema changes |
| `npm run db:migrate` | Applies migrations |
| `npm run scan:scraper` | Exports scraper data for analysis (asks for the URL, keeps it local) |

## Deployment

The API ships as one Docker image (`apps/api/Dockerfile`) on Coolify. See
`docs/architecture.md` → Docker & Coolify.
