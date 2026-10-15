# ClothHub API — one image, four commands:
#   node dist/index.js              HTTP server (default; applies migrations first)
#   node dist/migrate.js            apply database migrations on their own
#   node dist/jobs/ingest.js        scraper → catalog sync (Coolify scheduled task)
#   node dist/jobs/placeholders.js  ThumbHash previews for cover photos (after ingest)
#
# Build from the repository root:
#   docker build -f apps/api/Dockerfile -t clothhub-api .

ARG NODE_VERSION=22-alpine

# --- dependencies (cached until a package.json or the lockfile changes) ---
FROM node:${NODE_VERSION} AS deps
WORKDIR /repo
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
# --include=dev: the build tools (tsup, TypeScript) are dev dependencies, and a
# host that passes NODE_ENV=production at build time would otherwise skip them.
RUN npm ci --workspace @clothhub/api --include-workspace-root=false --include=dev

# --- build ---
FROM deps AS build
COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN npm run build --workspace @clothhub/api

# --- production dependencies only ---
FROM node:${NODE_VERSION} AS prod-deps
WORKDIR /repo
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
RUN npm ci --workspace @clothhub/api --include-workspace-root=false --omit=dev

# --- runtime ---
FROM node:${NODE_VERSION} AS runtime
ENV NODE_ENV=production
WORKDIR /app

COPY --from=prod-deps /repo/node_modules ./node_modules
COPY --from=build /repo/apps/api/dist ./dist
COPY --from=build /repo/apps/api/drizzle ./drizzle
COPY apps/api/package.json ./package.json

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT:-3000}/health" || exit 1

# Migrations run on every start, before the server listens: the database is
# always at the code's schema, whatever the host does around a deploy. They
# are additive (see docs/data-model.md), so the old container keeps serving
# while the new one migrates. `exec` hands signals straight to the server.
CMD ["sh", "-c", "node dist/migrate.js && exec node dist/index.js"]
