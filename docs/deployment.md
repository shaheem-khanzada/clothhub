# Deploying ClothHub (Coolify)

Two environments, both on the Coolify server that already runs the scraper:

| | Development | Production |
| --- | --- | --- |
| Purpose | Try changes on a phone before release | What shoppers use |
| Database | `clothhub_dev` | `clothhub_prod` |
| API app | `clothhub-api-dev` | `clothhub-api-prod` |
| Deploys | Automatically on every push to `main` | By hand (a release), from `main` |
| Mobile build | `EXPO_PUBLIC_API_URL` → dev domain | `EXPO_PUBLIC_API_URL` → prod domain |

Both read the same scraper database (`clothhub-prod-db`), read-only.

```
MySQL server (Coolify resource a8w08w44…)
  clothhub-prod-db   ← scraper writes; ClothHub reads (clothhub_reader, SELECT only)
  clothhub_dev       ← clothhub-api-dev reads and writes (clothhub_dev user)
  clothhub_prod      ← clothhub-api-prod reads and writes (clothhub_prod user)
```

Each environment gets its own MySQL user, so development can never touch
production data.

---

## 1. Databases and users (once)

In Coolify, open the MySQL resource → **Terminal**, then `mysql -uroot -p` (root password from the resource's
General page). Pick three strong passwords — they go only into Coolify, never into git or chat:

```sql
CREATE DATABASE clothhub_dev  CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE DATABASE clothhub_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

CREATE USER 'clothhub_dev'@'%'  IDENTIFIED BY '<dev password>';
CREATE USER 'clothhub_prod'@'%' IDENTIFIED BY '<prod password>';
GRANT ALL PRIVILEGES ON clothhub_dev.*  TO 'clothhub_dev'@'%';
GRANT ALL PRIVILEGES ON clothhub_prod.* TO 'clothhub_prod'@'%';

-- The ingest job's read-only access to the scraper.
CREATE USER 'clothhub_reader'@'%' IDENTIFIED BY '<reader password>';
GRANT SELECT ON `clothhub-prod-db`.* TO 'clothhub_reader'@'%';
```

Connection URLs use the resource's **internal** host (both apps run on the same server, on Coolify's
network — nothing needs a public port). Percent-encode special characters in passwords (`@` → `%40`,
`!` → `%21`, `#` → `%23`):

```
mysql://clothhub_dev:<dev password>@a8w08w44sccs84c4wgc8k404:3306/clothhub_dev
mysql://clothhub_prod:<prod password>@a8w08w44sccs84c4wgc8k404:3306/clothhub_prod
mysql://clothhub_reader:<reader password>@a8w08w44sccs84c4wgc8k404:3306/clothhub-prod-db
```

> The server has `max_execution_time = 30000` (30 s) for SELECTs. ClothHub's queries take milliseconds and
> the ingest job reads in small batches, so this needs no change.

## 2. The API apps (once per environment)

**+ New resource → Public/Private repository** → `shaheem-khanzada/clothhub`, branch `main`:

| Setting | Value |
| --- | --- |
| Build pack | Dockerfile |
| Base directory | `/` |
| Dockerfile location | `/apps/api/Dockerfile` |
| Port | `3000` |
| Health check | path `/health` |
| Pre-deployment command | `node dist/migrate.js` |
| Domain | e.g. `https://api-dev.<domain>` / `https://api.<domain>` |
| Auto deploy | on for dev, off for prod |

**Environment variables** (mark the URLs as secrets):

```
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
DATABASE_URL=<that environment's URL from step 1>
SCRAPER_DATABASE_URL=<the clothhub_reader URL>
```

## 3. The ingest job (once per environment)

In each app → **Scheduled tasks** → add:

| Field | Value |
| --- | --- |
| Command | `node dist/jobs/ingest.js` |
| Frequency | `0 */6 * * *` (every 6 hours) — or right after the scraper's own sync |

The first run imports everything (about 4 minutes for 290k products); later runs only read what the
scraper changed and take seconds. Runs cannot overlap, and dev and prod never block each other. Force a
full re-normalisation after changing ingest rules with `node dist/jobs/ingest.js --full` (bump
`INGEST_VERSION` in `apps/api/src/modules/ingest/transform.ts` so unchanged rows are re-processed too).

## 4. Check it

```bash
curl https://api-dev.<domain>/health                 # {"status":"ok"}
curl https://api-dev.<domain>/v1/brands | head -c 300
open https://api-dev.<domain>/openapi.json
```

## 5. Point the app at it

`apps/mobile/.env.local` → `EXPO_PUBLIC_API_URL=https://api-dev.<domain>`, then `npx expo start -c`.
(EAS build profiles with one URL per environment come with the first TestFlight build.)

## Releasing to production

1. Merge to `main` → dev deploys and migrates automatically; check the app against dev.
2. In Coolify, **Deploy** `clothhub-api-prod`. Its pre-deployment step applies the same migrations to
   `clothhub_prod` before the new version starts.
3. Migrations are additive and backwards-compatible (see `docs/data-model.md`), so the old version keeps
   working during the deploy.
