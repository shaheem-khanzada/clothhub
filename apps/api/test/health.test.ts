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
      '/v1/me',
      '/v1/products',
      '/v1/products/{productId}',
    ]);
    expect(Object.keys(doc.components.schemas)).toEqual(
      expect.arrayContaining(['Brand', 'BrandList', 'Product', 'ProductPage', 'Me', 'Account', 'ErrorResponse']),
    );
  });
});

describe('transport', () => {
  it('gzips responses for clients that accept it', async () => {
    const response = await app.request('/openapi.json', { headers: { 'Accept-Encoding': 'gzip' } });

    expect(response.headers.get('Content-Encoding')).toBe('gzip');
    const body = response.body?.pipeThrough(new DecompressionStream('gzip'));
    expect(await new Response(body).json()).toMatchObject({ openapi: '3.1.0' });
  });

  it('answers 304 without a body when the client already has this version', async () => {
    const first = await app.request('/v1/brands');
    const tag = first.headers.get('ETag');

    expect(tag).toBeTruthy();

    const second = await app.request('/v1/brands', { headers: { 'If-None-Match': tag ?? '' } });

    expect(second.status).toBe(304);
    expect(await second.text()).toBe('');
  });
});

describe('unknown routes', () => {
  it('answer 404 in the standard error shape', async () => {
    const response = await app.request('/nope');

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: { code: 'not_found', message: 'Not found' } });
  });
});
