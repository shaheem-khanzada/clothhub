# ClothHub landing site — the Next.js standalone server.
#
# Build from the repository root:
#   docker build -f apps/landing/Dockerfile -t clothhub-landing .

ARG NODE_VERSION=22-alpine

# --- dependencies (cached until a package.json or the lockfile changes) ---
FROM node:${NODE_VERSION} AS deps
WORKDIR /repo
COPY package.json package-lock.json ./
COPY apps/landing/package.json apps/landing/
RUN npm ci --workspace @clothhub/landing --include-workspace-root=false

# --- build ---
FROM deps AS build
ENV NEXT_TELEMETRY_DISABLED=1
# NEXT_PUBLIC_ variables are written into the page at build time, so the
# waitlist endpoint is a build argument (a "build variable" in Coolify).
ARG NEXT_PUBLIC_WAITLIST_URL
COPY tsconfig.base.json ./
COPY apps/landing apps/landing
RUN npm run build --workspace @clothhub/landing

# --- runtime: the standalone output holds the server and only the files it uses ---
FROM node:${NODE_VERSION} AS runtime
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
WORKDIR /app

COPY --from=build --chown=node:node /repo/apps/landing/.next/standalone ./
COPY --from=build --chown=node:node /repo/apps/landing/.next/static ./apps/landing/.next/static
# Images and fonts are imported from src/, so there is no public/ folder. If you
# add one, copy it too:
# COPY --from=build --chown=node:node /repo/apps/landing/public ./apps/landing/public

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT:-3000}/" > /dev/null || exit 1

CMD ["node", "apps/landing/server.js"]
