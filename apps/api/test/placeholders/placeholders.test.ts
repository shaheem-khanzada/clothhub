import { ProductSchema } from '@clothhub/shared';
import { and, eq } from 'drizzle-orm';
import sharp from 'sharp';
import { beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../../src/app.js';
import { productImages } from '../../src/db/schema/index.js';
import { LockBusyError } from '../../src/lib/advisoryLock.js';
import { type FetchImage, Placeholders } from '../../src/modules/placeholders/run.js';
import { insertBrand, insertProduct } from '../helpers/catalog-factories.js';
import { resetCatalog, useTestDatabase } from '../helpers/db.js';

const target = useTestDatabase();
const { db } = target;

const NOW = new Date('2026-10-14T00:00:00.000Z');
const WEEK = 7 * 24 * 60 * 60 * 1000;

const photo = await sharp({ create: { width: 100, height: 133, channels: 3, background: { r: 120, g: 40, b: 60 } } })
  .jpeg()
  .toBuffer();

/** A CDN that serves every photo, except the ones listed as broken. */
function fakeCdn(broken: string[] = []) {
  const requested: string[] = [];
  const fetchImage: FetchImage = async (url) => {
    requested.push(url);
    if (broken.some((prefix) => url.startsWith(prefix))) throw new Error('HTTP 404');
    return photo;
  };

  return { requested, fetchImage };
}

async function cover(productId: string) {
  const [row] = await db
    .select({ thumbhash: productImages.thumbhash, failedAt: productImages.thumbhashFailedAt })
    .from(productImages)
    .where(and(eq(productImages.productId, productId), eq(productImages.position, 0)));
  return row;
}

beforeEach(async () => {
  await resetCatalog(target.pool);
});

describe('the placeholders job', () => {
  it('hashes the cover of every listed product from a 100px copy', async () => {
    const brand = await insertBrand(db);
    const product = await insertProduct(db, brand.id, { images: 3 });
    const cdn = fakeCdn();

    const stats = await new Placeholders(target, { fetchImage: cdn.fetchImage, now: () => NOW }).run();

    expect(stats).toEqual({ hashed: 1, failed: 0 });
    expect(cdn.requested).toEqual([expect.stringMatching(/\.jpg\?width=100$/)]);
    expect((await cover(product.id))?.thumbhash).toMatch(/^[A-Za-z0-9+/]+=*$/);

    const others = await db.select().from(productImages).where(eq(productImages.position, 1));
    expect(others.every((image) => image.thumbhash === null)).toBe(true);
  });

  it('leaves products the app does not list', async () => {
    const brand = await insertBrand(db);
    const retired = await insertProduct(db, brand.id, { retiredAt: NOW });

    const stats = await new Placeholders(target, { fetchImage: fakeCdn().fetchImage }).run();

    expect(stats).toEqual({ hashed: 0, failed: 0 });
    expect((await cover(retired.id))?.thumbhash).toBeNull();
  });

  it('starts with what the app shows first: in stock, newest', async () => {
    const brand = await insertBrand(db);
    const soldOut = await insertProduct(db, brand.id, { inStock: false, firstSeenAt: new Date('2026-10-10') });
    const older = await insertProduct(db, brand.id, { firstSeenAt: new Date('2026-10-01') });
    const newest = await insertProduct(db, brand.id, { firstSeenAt: new Date('2026-10-05') });

    await new Placeholders(target, { fetchImage: fakeCdn().fetchImage, limit: 2, batchSize: 1 }).run();

    expect((await cover(newest.id))?.thumbhash).not.toBeNull();
    expect((await cover(older.id))?.thumbhash).not.toBeNull();
    expect((await cover(soldOut.id))?.thumbhash).toBeNull();
  });

  it('marks photos it cannot fetch and tries them again a week later', async () => {
    const brand = await insertBrand(db);
    const product = await insertProduct(db, brand.id);
    const broken = fakeCdn(['https://cdn.shopify.com/p/']);

    expect(await new Placeholders(target, { fetchImage: broken.fetchImage, now: () => NOW }).run()).toEqual({
      hashed: 0,
      failed: 1,
    });
    expect((await cover(product.id))?.failedAt).toEqual(NOW);

    // The next run does not ask again…
    const soon = new Date(NOW.getTime() + WEEK / 2);
    expect(await new Placeholders(target, { fetchImage: fakeCdn().fetchImage, now: () => soon }).run()).toEqual({
      hashed: 0,
      failed: 0,
    });

    // …until a week has passed.
    const later = new Date(NOW.getTime() + WEEK + 1);
    expect(await new Placeholders(target, { fetchImage: fakeCdn().fetchImage, now: () => later }).run()).toEqual({
      hashed: 1,
      failed: 0,
    });
    expect(await cover(product.id)).toMatchObject({ failedAt: null, thumbhash: expect.any(String) });
  });

  it('does not run twice at the same time', async () => {
    const brand = await insertBrand(db);
    await insertProduct(db, brand.id);

    let release: () => void = () => {};
    const slowCdn: FetchImage = () => new Promise((resolve) => (release = () => resolve(photo)));

    const first = new Placeholders(target, { fetchImage: slowCdn }).run();
    await new Promise((resolve) => setTimeout(resolve, 50));

    await expect(new Placeholders(target, { fetchImage: fakeCdn().fetchImage }).run()).rejects.toBeInstanceOf(
      LockBusyError,
    );

    release();
    await first;
  });
});

describe('the product API', () => {
  it('serves the cover\'s placeholder with its images', async () => {
    const brand = await insertBrand(db);
    const product = await insertProduct(db, brand.id, { images: 2 });
    await new Placeholders(target, { fetchImage: fakeCdn().fetchImage }).run();

    const response = await createApp({ db }).request(`/v1/products/${product.id}`);
    const body = ProductSchema.parse(await response.json());

    expect(body.images[0]?.thumbhash).toBe((await cover(product.id))?.thumbhash);
    expect(body.images[1]?.thumbhash).toBeNull();
  });
});
