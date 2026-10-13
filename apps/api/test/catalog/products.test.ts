import { ErrorResponseSchema, ProductPageResponseSchema, ProductSchema } from '@clothhub/shared';
import { beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../../src/app.js';
import { insertBrand, insertProduct } from '../helpers/catalog-factories.js';
import { resetCatalog, useTestDatabase } from '../helpers/db.js';

const { db, pool } = useTestDatabase();
const app = createApp({ db });

async function listProducts(query: Record<string, string | number | boolean> = {}) {
  const search = new URLSearchParams(
    Object.entries(query).map(([key, value]): [string, string] => [key, String(value)]),
  );
  const response = await app.request(`/v1/products?${search}`);

  return { response, body: response.ok ? ProductPageResponseSchema.parse(await response.json()) : null };
}

const ids = (body: { products: { id: string }[] } | null) => body?.products.map((product) => product.id);

beforeEach(async () => {
  await resetCatalog(pool);
});

describe('GET /v1/products — what is in scope', () => {
  it("shows women's clothing and unstitched from active brands only", async () => {
    const brand = await insertBrand(db, { audience: 'mixed' });
    const hiddenBrand = await insertBrand(db, { status: 'hidden' });

    const suit = await insertProduct(db, brand.id, { category: 'unstitched' });
    const kurta = await insertProduct(db, brand.id, { category: 'clothing' });
    await insertProduct(db, brand.id, { audience: 'men' });
    await insertProduct(db, brand.id, { audience: 'kids' });
    await insertProduct(db, brand.id, { category: 'bags' });
    await insertProduct(db, brand.id, { retiredAt: new Date() });
    await insertProduct(db, hiddenBrand.id);

    const { body } = await listProducts({ brandId: brand.id });

    expect(ids(body)?.sort()).toEqual([suit.id, kurta.id].sort());
    expect(body?.total).toBe(2);
  });

  it("includes products that do not say who they are for when the brand is a women's brand", async () => {
    const womens = await insertBrand(db, { audience: 'women' });
    const mixed = await insertBrand(db, { audience: 'mixed' });
    const fromWomens = await insertProduct(db, womens.id, { audience: 'unknown' });
    await insertProduct(db, mixed.id, { audience: 'unknown' });

    const { body } = await listProducts();

    expect(ids(body)).toEqual([fromWomens.id]);
  });
});

describe('GET /v1/products — filters', () => {
  it('filters by stock, sale, piece type and price, and combines them', async () => {
    const brand = await insertBrand(db);
    const cheap = await insertProduct(db, brand.id, { priceMinor: 300_000, pieceType: 'twoPiece', pieceCount: 2 });
    const onSale = await insertProduct(db, brand.id, { priceMinor: 600_000, compareAtMinor: 1_000_000 });
    const soldOut = await insertProduct(db, brand.id, { priceMinor: 900_000, inStock: false });

    expect(ids((await listProducts({ brandId: brand.id, inStock: true })).body)?.sort()).toEqual(
      [cheap.id, onSale.id].sort(),
    );
    expect(ids((await listProducts({ brandId: brand.id, onSale: true })).body)).toEqual([onSale.id]);
    expect(ids((await listProducts({ brandId: brand.id, pieceType: 'twoPiece' })).body)).toEqual([cheap.id]);
    expect(ids((await listProducts({ brandId: brand.id, minPrice: 5000, maxPrice: 9000 })).body)?.sort()).toEqual(
      [onSale.id, soldOut.id].sort(),
    );
    expect(ids((await listProducts({ brandId: brand.id, minPrice: 5000, inStock: true })).body)).toEqual([
      onSale.id,
    ]);
  });

  it('describes the whole brand in its facets, whatever filters are applied', async () => {
    const brand = await insertBrand(db);
    await insertProduct(db, brand.id, { priceMinor: 299_950, pieceType: 'twoPiece', pieceCount: 2 });
    await insertProduct(db, brand.id, { priceMinor: 1_250_000, pieceType: 'threePiece' });

    const { body } = await listProducts({ brandId: brand.id, pieceType: 'twoPiece', maxPrice: 3000 });

    expect(body?.total).toBe(1);
    expect(body?.facets).toEqual({ minPrice: 2999, maxPrice: 12500, pieceTypes: ['threePiece', 'twoPiece'] });
  });

  it('returns empty facets for a brand with nothing in scope', async () => {
    const brand = await insertBrand(db);

    const { body } = await listProducts({ brandId: brand.id });

    expect(body).toMatchObject({ products: [], total: 0, facets: { minPrice: 0, maxPrice: 0, pieceTypes: [] } });
  });
});

describe('GET /v1/products — sorting and paging', () => {
  it('puts in-stock products first, newest first, by default', async () => {
    const brand = await insertBrand(db);
    const oldInStock = await insertProduct(db, brand.id, { firstSeenAt: new Date('2026-01-01') });
    const newSoldOut = await insertProduct(db, brand.id, { firstSeenAt: new Date('2026-10-01'), inStock: false });
    const newInStock = await insertProduct(db, brand.id, { firstSeenAt: new Date('2026-09-01') });

    expect(ids((await listProducts({ brandId: brand.id })).body)).toEqual([newInStock.id, oldInStock.id, newSoldOut.id]);
  });

  it('sorts by price and by date', async () => {
    const brand = await insertBrand(db);
    const a = await insertProduct(db, brand.id, { priceMinor: 300_000, firstSeenAt: new Date('2026-03-01') });
    const b = await insertProduct(db, brand.id, { priceMinor: 100_000, firstSeenAt: new Date('2026-01-01') });
    const c = await insertProduct(db, brand.id, { priceMinor: 200_000, firstSeenAt: new Date('2026-02-01') });

    expect(ids((await listProducts({ brandId: brand.id, sort: 'priceAsc' })).body)).toEqual([b.id, c.id, a.id]);
    expect(ids((await listProducts({ brandId: brand.id, sort: 'priceDesc' })).body)).toEqual([a.id, c.id, b.id]);
    expect(ids((await listProducts({ brandId: brand.id, sort: 'newest' })).body)).toEqual([a.id, c.id, b.id]);
    expect(ids((await listProducts({ brandId: brand.id, sort: 'oldest' })).body)).toEqual([b.id, c.id, a.id]);
  });

  it('pages through results without repeating or skipping any', async () => {
    const brand = await insertBrand(db);
    for (let i = 0; i < 5; i += 1) await insertProduct(db, brand.id);

    const first = (await listProducts({ brandId: brand.id, limit: 2, page: 1 })).body!;
    const second = (await listProducts({ brandId: brand.id, limit: 2, page: 2 })).body!;
    const third = (await listProducts({ brandId: brand.id, limit: 2, page: 3 })).body!;

    expect(first.total).toBe(5);
    expect([first, second, third].map((page) => page.products.length)).toEqual([2, 2, 1]);
    expect(new Set([...ids(first)!, ...ids(second)!, ...ids(third)!]).size).toBe(5);
  });
});

describe('GET /v1/products — search', () => {
  it('finds products by name, brand text, fabric and colour, word prefixes included', async () => {
    const brand = await insertBrand(db);
    const chiffon = await insertProduct(db, brand.id, {
      name: 'Embroidered Chiffon Suit',
      title: 'Embroidered Chiffon Suit',
      searchText: 'Gulaal Luxury Pret Chiffon Maroon red',
    });
    await insertProduct(db, brand.id, { name: 'Printed Lawn Kurta', title: 'Printed Lawn Kurta' });

    expect(ids((await listProducts({ q: 'chiffon' })).body)).toEqual([chiffon.id]);
    expect(ids((await listProducts({ q: 'embroid maroon' })).body)).toEqual([chiffon.id]);
    expect(ids((await listProducts({ q: 'gulaal' })).body)).toEqual([chiffon.id]);
    expect((await listProducts({ q: 'velvet' })).body?.total).toBe(0);
  });

  it('matches short words and codes the full-text index skips', async () => {
    const brand = await insertBrand(db);
    const coded = await insertProduct(db, brand.id, { name: 'Lawn Suit (AJ-04)', sku: 'AJ-04' });
    await insertProduct(db, brand.id, { name: 'Lawn Suit' });

    expect(ids((await listProducts({ q: 'aj' })).body)).toEqual([coded.id]);
  });

  it('ignores a search with no usable words', async () => {
    const brand = await insertBrand(db);
    await insertProduct(db, brand.id);

    expect((await listProducts({ q: ' - ' })).body?.total).toBe(1);
  });
});

describe('GET /v1/products — requests', () => {
  it('answers 404 for an unknown brand', async () => {
    const { response } = await listProducts({ brandId: '01a13757-c2db-7750-9c83-4d1016231ca5' });

    expect(response.status).toBe(404);
  });

  it.each([
    [{ limit: 51 }, 'limit'],
    [{ page: 0 }, 'page'],
    [{ sort: 'cheapest' }, 'sort'],
    [{ inStock: 'maybe' }, 'inStock'],
    [{ brandId: 'saya' }, 'brandId'],
  ])('answers 400 for %o', async (query, field) => {
    const { response } = await listProducts(query);
    const body = ErrorResponseSchema.parse(await response.json());

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('invalid_request');
    expect(JSON.stringify(body.error.details)).toContain(field);
  });

  it('answers 400 when the price range is reversed', async () => {
    const { response } = await listProducts({ minPrice: 9000, maxPrice: 1000 });

    expect(response.status).toBe(400);
  });
});

describe('GET /v1/products/:productId', () => {
  it('returns the product with ordered images, merged sizes and prices in rupees', async () => {
    const brand = await insertBrand(db, { name: 'Saya', slug: 'saya' });
    const product = await insertProduct(db, brand.id, {
      priceMinor: 449_000,
      priceMaxMinor: 499_000,
      compareAtMinor: 899_000,
      images: 2,
      sizes: [
        { size: 'S', available: false },
        { size: 'M', available: true },
        { size: 'S', available: true },
        { size: null, available: true },
      ],
    });

    const response = await app.request(`/v1/products/${product.id}`);
    const body = ProductSchema.parse(await response.json());

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      id: product.id,
      brand: { id: brand.id, slug: 'saya', name: 'Saya' },
      price: 4490,
      priceMax: 4990,
      compareAtPrice: 8990,
      discountPercent: 50,
      currency: 'PKR',
      isRetired: false,
      sizes: [
        { label: 'S', inStock: true },
        { label: 'M', inStock: true },
      ],
      components: [{ label: 'Shirt', lines: ['Printed lawn shirt'] }],
    });
    expect(body.images.map((image) => image.url)).toEqual([
      expect.stringMatching(/-0\.jpg$/),
      expect.stringMatching(/-1\.jpg$/),
    ]);
  });

  it('still opens a retired product, marked as retired', async () => {
    const brand = await insertBrand(db);
    const product = await insertProduct(db, brand.id, { retiredAt: new Date('2026-10-01') });

    const response = await app.request(`/v1/products/${product.id}`);

    expect(response.status).toBe(200);
    expect(ProductSchema.parse(await response.json()).isRetired).toBe(true);
  });

  it('answers 404 for an unknown product or a hidden brand', async () => {
    const hidden = await insertBrand(db, { status: 'hidden' });
    const product = await insertProduct(db, hidden.id);

    expect((await app.request(`/v1/products/${product.id}`)).status).toBe(404);
    expect((await app.request('/v1/products/01a13757-c2db-7750-9c83-4d1016231ca5')).status).toBe(404);
  });
});
