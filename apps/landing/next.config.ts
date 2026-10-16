import path from 'node:path';

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // A self-contained Node server for the Docker image (see Dockerfile).
  output: 'standalone',
  // The repository root: npm workspaces hoist dependencies there, so the
  // standalone build has to trace files from it.
  outputFileTracingRoot: path.join(__dirname, '../../'),
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  poweredByHeader: false,
};

export default nextConfig;
