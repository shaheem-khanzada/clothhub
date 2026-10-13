import { defineConfig } from 'tsup';

/**
 * Bundles the three entry points the Docker image runs. Workspace packages
 * (@clothhub/shared) are compiled in; npm dependencies stay external and are
 * installed in the image.
 */
export default defineConfig({
  entry: {
    index: 'src/index.ts',
    migrate: 'src/db/migrate.ts',
    'jobs/ingest': 'src/jobs/ingest/index.ts',
  },
  format: ['esm'],
  target: 'node22',
  platform: 'node',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  noExternal: [/^@clothhub\//],
});
