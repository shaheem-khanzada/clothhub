# ClothHub

Fashion discovery for Pakistan: browse women's clothing from many brands in
one place, save what you love, and — later — follow people, post outfits and
let the community surface what's worth buying.

## Repository

```
apps/
  mobile/          Expo + React Native app (iOS, Android)
  api/             REST API — Hono, Zod, Drizzle, MySQL — plus the scraper import job
  landing/         marketing site and waitlist — Next.js, Tailwind CSS
packages/
  shared/          Zod schemas + types: the contract between api and mobile
docs/
  architecture.md  how the pieces fit, phases, environments
  data-model.md    database design, now and for the social features
  scraper-data.md  what the scraper's data looks like, and the decisions it led to
  deployment.md    Coolify: development and production, step by step
  release-ios.md   TestFlight builds with EAS
scripts/
  load-scraper-dump.sh   load a scraper database dump into local MySQL
  scan-scraper-db.mjs    export the scraper DB's structure + sample rows (read-only)
docker-compose.yml       local MySQL 8.4 (+ the API image, optional)
```

## Getting started

Requirements: Node 22 (`.nvmrc`), Homebrew or Docker, Xcode / Android Studio for the app.

**Everything in one command (Mac)** — MySQL, the catalogue from a scraper
dump in `~/Downloads`, the API, and the app in the iOS simulator:

```bash
bash scripts/dev.sh            # --android, --no-app, --reimport, --dump <file>, --stop
```

It is safe to re-run: each step checks what is already done. The steps it
runs, by hand:

```bash
npm install                      # once, from the repo root (all workspaces)
```

**API with real data**

```bash
cp .env.example apps/api/.env    # local settings
npm run db:up                    # MySQL 8.4 in Docker
npm run db:migrate               # create ClothHub's tables
npm run scraper:load ~/Downloads/mysql-dump-clothhub-prod-db.dmp   # a scraper dump (Coolify → Backups)
npm run ingest                   # import it: ~4 minutes the first time
npm run api                      # http://localhost:3000/v1/brands, /openapi.json
```

Or run the production image locally: `docker compose --profile api up --build`.

**Mobile**

```bash
cp apps/mobile/.env.example apps/mobile/.env.local   # EXPO_PUBLIC_API_URL
cd apps/mobile
npx expo prebuild --clean        # after native changes
npx expo run:ios                 # or: npx expo run:android
```

The app needs a development build (native modules), not Expo Go.

**Landing site**

```bash
npm run landing                  # http://localhost:3001
```

## Everyday commands (repo root)

| Command | Does |
| --- | --- |
| `npm run typecheck` | Type-checks every workspace |
| `npm test` | Runs every workspace's tests (API integration tests need `npm run db:up`) |
| `npm run mobile` | Starts Metro for the app |
| `npm run api` | Starts the API with reload |
| `npm run landing` | Starts the landing site on port 3001 |
| `npm run ingest` | Imports from the scraper (`-- --full` to re-normalise everything) |
| `npm run db:generate` | Creates a migration from schema changes |
| `npm run db:migrate` | Applies migrations |
| `npm run scraper:load <file>` | Loads a scraper dump into local MySQL |

## Deployment

Development and production run on Coolify, next to the scraper: the API from
`apps/api/Dockerfile`, the landing site from `apps/landing/Dockerfile`. See
`docs/deployment.md`.
