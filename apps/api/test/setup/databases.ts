/**
 * Test database locations. Integration tests run against a real MySQL
 * (`npm run db:up` locally, a service container in CI):
 *   clothhub_test           ClothHub's schema, migrated fresh each run
 *   clothhub_test_scraper   a fake scraper database for the ingest tests
 *
 * Override the server with TEST_DATABASE_URL (any database name in it is
 * ignored; the two names above are always used).
 */

const DEFAULT_SERVER = 'mysql://clothhub:clothhub@127.0.0.1:3306';

function serverUrl(): URL {
  const url = new URL(process.env.TEST_DATABASE_URL ?? DEFAULT_SERVER);
  url.pathname = '';
  return url;
}

export function databaseUrl(name: string): string {
  const url = serverUrl();
  url.pathname = `/${name}`;
  return url.toString();
}

export const TEST_DATABASE = 'clothhub_test';
export const TEST_SCRAPER_DATABASE = 'clothhub_test_scraper';

export const serverOnlyUrl = (): string => serverUrl().toString();
