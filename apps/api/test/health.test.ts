import { describe, expect, it } from 'vitest';

import { createApp } from '../src/app.js';
import { useTestDatabase } from './helpers/db.js';

const { db } = useTestDatabase();
const app = createApp({ db });

describe('GET /health', () => {
  it('reports the API is up', async () => {
    const response = await app.request('/health');

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'ok' });
  });
});

describe('GET /openapi.json', () => {
  it('documents every endpoint with named schemas', async () => {
    const doc = (await (await app.request('/openapi.json')).json()) as {
      paths: Record<string, unknown>;
      components: { schemas: Record<string, unknown> };
    };

    expect(Object.keys(doc.paths).sort()).toEqual([
      '/health',
      '/v1/brands',
      '/v1/brands/{brandId}',
      '/v1/products',
      '/v1/products/{productId}',
    ]);
    expect(Object.keys(doc.components.schemas)).toEqual(
      expect.arrayContaining(['Brand', 'BrandList', 'Product', 'ProductPage', 'ErrorResponse']),
    );
  });
});

describe('unknown routes', () => {
  it('answer 404 in the standard error shape', async () => {
    const response = await app.request('/nope');

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: { code: 'not_found', message: 'Not found' } });
  });
});
