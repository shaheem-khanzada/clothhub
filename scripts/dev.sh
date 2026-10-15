#!/usr/bin/env bash
#
# Runs ClothHub locally on a Mac: MySQL, the catalogue data, the API and the
# app. Every step checks what is already done, so it is safe to re-run.
#
#   bash scripts/dev.sh                  set up whatever is missing, then run everything (iOS)
#   bash scripts/dev.sh --android        same, but open the Android emulator
#   bash scripts/dev.sh --no-app         database, data and API only
#   bash scripts/dev.sh --reimport       reload the scraper dump and re-run the import
#   bash scripts/dev.sh --dump <file>    use this scraper dump (default: newest
#                                        ~/Downloads/mysql-dump-clothhub-prod-db-*.dmp)
#   bash scripts/dev.sh --stop           stop the API (and photo placeholders) started by this script
#
# MySQL comes from, in order: a server already listening on 127.0.0.1:3306,
# Docker (docker compose), or Homebrew (installs mysql@8.4).

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

STATE_DIR="$ROOT/.dev"
API_LOG="$STATE_DIR/api.log"
API_PID="$STATE_DIR/api.pid"
PLACEHOLDERS_LOG="$STATE_DIR/placeholders.log"
PLACEHOLDERS_PID="$STATE_DIR/placeholders.pid"
mkdir -p "$STATE_DIR"

# Stops a process and everything it started (tsx runs the code in a child).
kill_tree() {
  local child
  for child in $(pgrep -P "$1" 2>/dev/null); do kill_tree "$child"; done
  kill "$1" 2>/dev/null
}

# Stops a background process recorded in a pid file. Succeeds if it was running.
stop_recorded() {
  local stopped=1
  if [[ -f "$1" ]] && kill -0 "$(cat "$1")" 2>/dev/null; then
    kill_tree "$(cat "$1")" && stopped=0
  fi
  rm -f "$1"
  return "$stopped"
}

# Stops this repo's API: the one this script started, and anything else
# serving the API ports from src/index.ts. Succeeds if something was stopped.
stop_api() {
  local stopped=1
  stop_recorded "$API_PID" && stopped=0
  for port in 3000 3100; do
    for pid in $(lsof -ti "tcp:$port" -sTCP:LISTEN 2>/dev/null); do
      if ps -o command= -p "$pid" | grep -q 'src/index.ts'; then kill_tree "$pid" && stopped=0; fi
    done
  done
  return "$stopped"
}

PLATFORM=ios
RUN_APP=1
REIMPORT=0
DUMP=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --android) PLATFORM=android ;;
    --no-app) RUN_APP=0 ;;
    --reimport) REIMPORT=1 ;;
    --dump) DUMP="${2:-}"; shift ;;
    --stop)
      stop_api && echo "API stopped." || echo "No API started by this script is running."
      if stop_recorded "$PLACEHOLDERS_PID"; then
        echo "Photo placeholders stopped (the next run carries on where this one stopped)."
      fi
      exit 0
      ;;
    *) echo "Unknown option: $1 (see the top of scripts/dev.sh)" >&2; exit 1 ;;
  esac
  shift
done

bold() { printf '\n\033[1m▸ %s\033[0m\n' "$*"; }
note() { printf '  %s\n' "$*"; }
fail() { printf '\n\033[31m✗ %b\033[0m\n' "$*" >&2; exit 1; }

port_open() { (exec 3<>"/dev/tcp/127.0.0.1/$1") 2>/dev/null; }

DB_NAME=clothhub_dev
DB_USER=clothhub
DB_PASS=clothhub

# ---------------------------------------------------------------------------
bold "Checking tools"
command -v node >/dev/null || fail "Node.js is not installed. Install Node 22 (e.g. 'brew install node@22') and run this again."
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
[[ "$NODE_MAJOR" -ge 22 ]] || fail "Node $NODE_MAJOR found; ClothHub needs Node 22 or newer."
note "Node $(node -v)"

# ---------------------------------------------------------------------------
bold "Installing dependencies"
if [[ ! -f node_modules/.package-lock.json || package-lock.json -nt node_modules/.package-lock.json ]]; then
  npm install --no-fund --no-audit
else
  note "Up to date."
fi

# ---------------------------------------------------------------------------
bold "Starting MySQL"

# How to run SQL as an administrator on whichever MySQL we use.
ADMIN_SQL=()
MYSQL_CLIENT=()

if port_open 3306; then
  note "A MySQL server is already running on port 3306."
  if command -v mysql >/dev/null; then
    MYSQL_CLIENT=(mysql)
  elif command -v brew >/dev/null && [[ -x "$(brew --prefix mysql@8.4 2>/dev/null)/bin/mysql" ]]; then
    MYSQL_CLIENT=("$(brew --prefix mysql@8.4)/bin/mysql")
  fi
  if [[ ${#MYSQL_CLIENT[@]} -gt 0 ]] && "${MYSQL_CLIENT[@]}" -h127.0.0.1 -uroot -e 'SELECT 1' >/dev/null 2>&1; then
    ADMIN_SQL=("${MYSQL_CLIENT[@]}" -h127.0.0.1 -uroot)
  elif command -v docker >/dev/null && docker compose ps --status running mysql 2>/dev/null | grep -q mysql; then
    ADMIN_SQL=(docker compose exec -T mysql mysql -uroot -proot)
    MYSQL_CLIENT=(docker compose exec -T mysql mysql)
  fi
elif command -v docker >/dev/null && docker info >/dev/null 2>&1; then
  note "Using Docker."
  docker compose up -d --wait mysql
  ADMIN_SQL=(docker compose exec -T mysql mysql -uroot -proot)
  MYSQL_CLIENT=(docker compose exec -T mysql mysql)
elif command -v brew >/dev/null; then
  if ! brew list mysql@8.4 >/dev/null 2>&1; then
    note "Installing MySQL 8.4 with Homebrew (one time, a minute or two)…"
    brew install mysql@8.4
  fi
  note "Starting MySQL 8.4 (Homebrew service)."
  brew services start mysql@8.4 >/dev/null
  MYSQL_CLIENT=("$(brew --prefix mysql@8.4)/bin/mysql")
  for _ in $(seq 1 60); do port_open 3306 && break; sleep 1; done
  port_open 3306 || fail "MySQL did not start. Check: brew services info mysql@8.4"
  ADMIN_SQL=("${MYSQL_CLIENT[@]}" -h127.0.0.1 -uroot)
else
  fail "No MySQL found. Install Homebrew (https://brew.sh) or Docker, then run this again."
fi

if [[ ${#ADMIN_SQL[@]} -gt 0 ]]; then
  "${ADMIN_SQL[@]}" <<SQL
CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE USER IF NOT EXISTS '$DB_USER'@'%' IDENTIFIED BY '$DB_PASS';
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';
GRANT ALL PRIVILEGES ON \`clothhub\\_%\`.* TO '$DB_USER'@'%';
GRANT ALL PRIVILEGES ON \`clothhub\\_%\`.* TO '$DB_USER'@'localhost';
CREATE USER IF NOT EXISTS 'clothhub_reader'@'%' IDENTIFIED BY 'reader';
CREATE USER IF NOT EXISTS 'clothhub_reader'@'localhost' IDENTIFIED BY 'reader';
GRANT SELECT ON \`scraper\`.* TO 'clothhub_reader'@'%';
GRANT SELECT ON \`scraper\`.* TO 'clothhub_reader'@'localhost';
FLUSH PRIVILEGES;
SQL
  note "Databases and users are ready."
else
  note "Could not log in as MySQL root; assuming the '$DB_USER' user and '$DB_NAME' database already exist."
fi

[[ ${#MYSQL_CLIENT[@]} -gt 0 ]] || fail "No mysql command-line client found (needed to load the scraper dump). Run: brew install mysql-client"

app_sql() { "${MYSQL_CLIENT[@]}" -h127.0.0.1 -u"$DB_USER" -p"$DB_PASS" "$@" 2>/dev/null; }

# ---------------------------------------------------------------------------
bold "Configuring"
if [[ ! -f apps/api/.env ]]; then
  cp .env.example apps/api/.env
  note "Created apps/api/.env"
else
  note "apps/api/.env exists — kept."
fi

# ---------------------------------------------------------------------------
bold "Updating the database schema"
npm run db:migrate --silent

# ---------------------------------------------------------------------------
PRODUCTS="$(app_sql -N -e "SELECT COUNT(*) FROM \`$DB_NAME\`.products" || echo 0)"

if [[ "$REIMPORT" -eq 1 || "$PRODUCTS" -eq 0 ]]; then
  bold "Loading the scraper's data"

  if [[ -z "$DUMP" ]]; then
    DUMP="$(ls -t "$HOME"/Downloads/mysql-dump-clothhub-prod-db-*.dmp 2>/dev/null | head -1 || true)"
  fi
  [[ -n "$DUMP" && -f "$DUMP" ]] || fail "No scraper dump found. Download one (Coolify → database → Backups) into ~/Downloads, or pass --dump <file>."

  [[ ${#ADMIN_SQL[@]} -gt 0 ]] || fail "Loading the dump needs MySQL's root user without a password (Homebrew's default)."
  note "From $(basename "$DUMP") — a 1.6 GB dump takes a few minutes."
  case "$DUMP" in
    *.gz) READ=(gunzip -c "$DUMP") ;;
    *.zst) READ=(zstd -dc "$DUMP") ;;
    *) READ=(cat "$DUMP") ;;
  esac

  "${ADMIN_SQL[@]}" -e 'DROP DATABASE IF EXISTS scraper; CREATE DATABASE scraper CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;'
  # The scraper's admin accounts are never loaded.
  "${READ[@]}" | sed -e '/^INSERT INTO `admins`/d' | "${ADMIN_SQL[@]}" --max-allowed-packet=1G scraper

  bold "Importing into ClothHub (about 4 minutes the first time)"
  npm run ingest -w @clothhub/api --silent -- --full
else
  bold "Catalogue"
  note "$PRODUCTS products already imported (use --reimport to reload)."
fi

LISTED="$(app_sql -N -e "SELECT COUNT(*) FROM \`$DB_NAME\`.products WHERE listed")"
note "$LISTED products in the app."

# ---------------------------------------------------------------------------
# ThumbHash previews for product photos. The first run downloads a tiny copy
# of every cover (about 40 minutes), so it runs in the background; photos
# without one simply load with the blurred preview meanwhile.
MISSING="$(app_sql -N -e "SELECT COUNT(*) FROM \`$DB_NAME\`.products p JOIN \`$DB_NAME\`.product_images i ON i.product_id = p.id AND i.position = 0 WHERE p.listed AND i.thumbhash IS NULL")"
if [[ "$MISSING" -gt 0 ]] && ! { [[ -f "$PLACEHOLDERS_PID" ]] && kill -0 "$(cat "$PLACEHOLDERS_PID")" 2>/dev/null; }; then
  bold "Photo placeholders"
  note "$MISSING covers without a ThumbHash; making them in the background (log: .dev/placeholders.log)."
  (cd apps/api && nohup "$ROOT/node_modules/.bin/tsx" --env-file-if-exists=.env src/jobs/placeholders/index.ts \
    </dev/null >"$PLACEHOLDERS_LOG" 2>&1 & echo $! >"$PLACEHOLDERS_PID")
fi

# ---------------------------------------------------------------------------
bold "Starting the API"

API_PORT=3000
# Always serve the code that is checked out: an API left running from an
# earlier run (or an earlier branch) answers with old response shapes.
if stop_api; then
  note "Stopped the API from an earlier run."
  for _ in $(seq 1 20); do port_open "$API_PORT" || break; sleep 0.5; done
fi
if port_open "$API_PORT"; then
  API_PORT=3100
  note "Port 3000 is in use by something else; using $API_PORT."
fi
# tsx watch: reloads by itself when the code changes (a git pull, an edit).
# Detached from this terminal, so --stop can end it cleanly.
(cd apps/api && PORT="$API_PORT" nohup "$ROOT/node_modules/.bin/tsx" watch --env-file-if-exists=.env src/index.ts \
  </dev/null >"$API_LOG" 2>&1 & echo $! >"$API_PID")
for _ in $(seq 1 60); do
  curl -fsS "http://127.0.0.1:$API_PORT/health" >/dev/null 2>&1 && break
  sleep 1
done
curl -fsS "http://127.0.0.1:$API_PORT/health" >/dev/null 2>&1 || fail "The API did not start. Last lines of $API_LOG:\n$(tail -20 "$API_LOG")"
note "Running on http://localhost:$API_PORT, reloading on code changes  (log: .dev/api.log, stop: bash scripts/dev.sh --stop)"

# The app's API address: the simulator reaches the Mac as localhost, the Android emulator as 10.0.2.2.
API_HOST=localhost
[[ "$PLATFORM" == android ]] && API_HOST=10.0.2.2
ENV_LOCAL=apps/mobile/.env.local
if [[ ! -f "$ENV_LOCAL" ]] || grep -q 'managed by scripts/dev.sh' "$ENV_LOCAL"; then
  printf '# managed by scripts/dev.sh — delete this line to keep your own value\nEXPO_PUBLIC_API_URL=http://%s:%s\n' \
    "$API_HOST" "$API_PORT" >"$ENV_LOCAL"
fi
note "App → $(grep EXPO_PUBLIC_API_URL "$ENV_LOCAL")"

[[ "$RUN_APP" -eq 1 ]] || { bold "Done. API: http://localhost:$API_PORT/v1/brands"; exit 0; }

# ---------------------------------------------------------------------------
bold "Building and opening the app ($PLATFORM)"
cd apps/mobile
if [[ ! -d "$PLATFORM" ]]; then
  note "Generating the native project (one time)."
  npx expo prebuild --platform "$PLATFORM"
fi
note "The first build takes several minutes. Metro stays running here; press Ctrl+C to stop it (the API keeps running)."
exec npx expo "run:$PLATFORM"
