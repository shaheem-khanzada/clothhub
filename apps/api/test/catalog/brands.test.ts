import { BrandListResponseSchema, BrandSchema, ErrorResponseSchema } from '@clothhub/shared';
import { beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../../src/app.js';
import { insertBrand } from '../helpers/catalog-factories.js';
import { resetCatalog, useTestDatabase } from '../helpers/db.js';

const { db, pool } = useTestDatabase();
const app = createApp({ db });

beforeEach(async () => {
  await resetCatalog(pool);
});

describe('GET /v1/brands', () => {
  it('lists active brands with products, most in-stock products first', async () => {
    const small = await insertBrand(db, { name: 'Small', productCount: 10, inStockCount: 2 });
    const big = await insertBrand(db, { name: 'Big', productCount: 500, inStockCount: 300 });

    const response = await app.request('/v1/brands');
    const body = BrandListResponseSchema.parse(await response.json());

    expect(response.status).toBe(200);
    expect(body.brands.map((brand) => brand.id)).toEqual([big.id, small.id]);
    expect(body.brands[0]).toEqual({
      id: big.id,
      slug: big.slug,
      name: 'Big',
      website: big.website,
      logoUrl: null,
      productCount: 500,
      inStockCount: 300,
      coverImageUrl: big.coverImageUrl,
    });
  });

  it('leaves out hidden brands and brands with nothing to show', async () => {
    await insertBrand(db, { status: 'hidden', currency: 'USD' });
    await insertBrand(db, { productCount: 0, inStockCount: 0 });
    const shown = await insertBrand(db);

    const body = BrandListResponseSchema.parse(await (await app.request('/v1/brands')).json());

    expect(body.brands.map((brand) => brand.id)).toEqual([shown.id]);
  });

  it('lets clients cache the list for a few minutes', async () => {
    const response = await app.request('/v1/brands');

    expect(response.headers.get('cache-control')).toBe('public, max-age=300');
  });
});

describe('GET /v1/brands/:brandId', () => {
  it('returns one brand', async () => {
    const brand = await insertBrand(db, { name: 'Sana Safinaz' });

    const response = await app.request(`/v1/brands/${brand.id}`);

    expect(response.status).toBe(200);
    expect(BrandSchema.parse(await response.json()).name).toBe('Sana Safinaz');
  });

  it('answers 404 for unknown and hidden brands', async () => {
    const hidden = await insertBrand(db, { status: 'hidden' });

    for (const id of [hidden.id, '01a13757-c2db-7750-9c83-4d1016231ca5']) {
      const response = await app.request(`/v1/brands/${id}`);

      expect(response.status).toBe(404);
      expect(ErrorResponseSchema.parse(await response.json()).error.code).toBe('not_found');
    }
  });

  it('answers 400 for an id that is not a UUID', async () => {
    const response = await app.request('/v1/brands/sana-safinaz');

    expect(response.status).toBe(400);
    expect(ErrorResponseSchema.parse(await response.json()).error.code).toBe('invalid_request');
  });
});
