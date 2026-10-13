#!/usr/bin/env bash
#
# Loads a scraper database dump into the local MySQL (docker compose) as the
# `scraper` database, so the ingest job can run locally:
#
#   npm run db:up
#   bash scripts/load-scraper-dump.sh ~/Downloads/mysql-dump-clothhub-prod-db.dmp
#   npm run ingest            # with SCRAPER_DATABASE_URL from .env.example
#
# Accepts a plain .sql/.dmp file or a .gz/.zst-compressed one. The scraper's
# admin accounts are skipped. Nothing is sent anywhere: the dump goes straight
# into the local container.

set -euo pipefail

dump="${1:-}"
if [[ -z "$dump" || ! -f "$dump" ]]; then
  echo "Usage: bash scripts/load-scraper-dump.sh <dump.sql|.dmp|.gz|.zst>" >&2
  exit 1
fi

case "$dump" in
  *.gz) reader=(gunzip -c "$dump") ;;
  *.zst) reader=(zstd -dc "$dump") ;;
  *) reader=(cat "$dump") ;;
esac

cd "$(dirname "$0")/.."

echo "Recreating the local 'scraper' database…"
docker compose exec -T mysql mysql -uroot -proot -e \
  'DROP DATABASE IF EXISTS scraper; CREATE DATABASE scraper CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;'

echo "Loading $(basename "$dump") (a 1.5 GB dump takes a few minutes)…"
"${reader[@]}" \
  | sed -e '/^INSERT INTO `admins`/d' \
  | docker compose exec -T mysql mysql -uroot -proot --max-allowed-packet=1G scraper

docker compose exec -T mysql mysql -uroot -proot -N -e \
  'SELECT CONCAT(COUNT(*), " live products loaded.") FROM scraper.liveProducts;'
