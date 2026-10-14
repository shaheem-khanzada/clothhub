import { defineConfig } from 'vitest/config';

/**
 * Two projects:
 *   unit         pure functions next to the code (src/**), no database
 *   integration  HTTP routes and the ingest job against a real MySQL (test/**)
 *
 * `npm test` runs both; `npm run test:unit` needs no database.
 */
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          include: ['src/**/*.test.ts'],
          environment: 'node',
        },
      },
      {
        test: {
          name: 'integration',
          include: ['test/**/*.test.ts'],
          environment: 'node',
          globalSetup: ['test/setup/global-setup.ts'],
          // Test files share one database; run them one at a time.
          fileParallelism: false,
          testTimeout: 30_000,
          hookTimeout: 60_000,
        },
      },
    ],
  },
});
