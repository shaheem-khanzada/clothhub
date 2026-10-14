import { asc, eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';

import { brands, ingestRuns, productImages, products, productVariants } from '../../src/db/schema/index.js';
import { Ingest } from '../../src/modules/ingest/run.js';
import { ScraperReader } from '../../src/modules/ingest/scraper.js';
import { resetCatalog, resetScraper, useScraperDatabase, useTestDatabase } from '../helpers/db.js';
import {
  deleteScraperProduct,
  insertScraperBrand,
  insertScraperProduct,
} from '../helpers/scraper-factories.js';

const target = useTestDatabase();
const scraperPool = useScraperDatabase();
const { db } = target;

const NOW = new Date('2026-10-14T00:00:00.000Z');

function ingest() {
  return new Ingest(target, new ScraperReader(scraperPool), { now: () => NOW, batchSize: 2 });
}

async function productBySource(sourceProductId: string) {
  const [row] = await db.select().from(products).where(eq(products.sourceProductId, sourceProductId));
  return row;
}

beforeEach(async () => {
  await Promise.all([resetCatalog(target.pool), resetScraper(scraperPool)]);
  await insertScraperBrand(scraperPool, { id: 20, name: 'Saya', sourceUrl: 'https://saya.pk' });
});

describe('brands', () => {
  it('uses ClothHub names and hides brands priced in another currency', async () => {
    await insertScraperBrand(scraperPool, { id: 8, name: 'Junaidjamshed', sourceUrl: 'https://www.junaidjamshed.com' });
    await insertScraperBrand(scraperPool, { id: 60, name: 'Saniamaskatiya', sourceUrl: 'https://saniamaskatiya.com' });
    await insertScraperBrand(scraperPool, { id: 99, name: 'newbrand', sourceUrl: 'https://newbrand.pk' });

    await ingest().run();

    const rows = await db.select().from(brands).orderBy(asc(brands.sourceRef));
    expect(rows.map(({ sourceRef, name, slug, status, currency, website }) => ({
      sourceRef, name, slug, status, currency, website,
    }))).toEqual([
      { sourceRef: 8, name: 'J.', slug: 'j', status: 'active', currency: 'PKR', website: 'https://junaidjamshed.com' },
      { sourceRef: 20, name: 'Saya', slug: 'saya', status: 'active', currency: 'PKR', website: 'https://saya.pk' },
      { sourceRef: 60, name: 'Sania Maskatiya', slug: 'sania-maskatiya', status: 'hidden', currency: 'USD', website: 'https://saniamaskatiya.com' },
      { sourceRef: 99, name: 'Newbrand', slug: 'newbrand', status: 'active', currency: 'PKR', website: 'https://newbrand.pk' },
    ]);
  });

  it('keeps brand ids and slugs stable across runs', async () => {
    await ingest().run();
    const [before] = await db.select().from(brands);

    await ingest().run('full');
    const [after] = await db.select().from(brands);

    expect(after?.id).toBe(before?.id);
    expect(after?.slug).toBe(before?.slug);
  });
});

describe('a first (full) run', () => {
  it('normalises products with their images and variants', async () => {
    await insertScraperProduct(scraperPool, {
      id: '20_1',
      brandId: 20,
      title: 'Printed Lawn Stitched 2 Piece (Shirt/Trouser)',
      type: 'Women RTW',
      tags: ['Lawn', 'Summer'],
      price: 4490,
      priceMax: 4990,
      compareAtPrice: 8990,
      description: 'Color: Green\nFabric: Lawn\n\nShirt\nReady To Wear Lawn Stitched Shirt.',
      variants: [
        { size: 'Small', colour: 'Green', available: false, sku: 'SP-1-S' },
        { size: 'Medium', colour: 'Green', available: true, sku: 'SP-1-M' },
      ],
      handle: 'sp-12875',
    });

    const result = await ingest().run();

    expect(result.mode).toBe('full');
    expect(result.stats).toMatchObject({ brands: 1, read: 1, created: 1, updated: 0 });

    const product = await productBySource('20_1');
    expect(product).toMatchObject({
      name: 'Printed Lawn Stitched 2 Piece (Shirt/Trouser)',
      shortName: 'Printed Lawn Stitched (Shirt/Trouser)',
      sku: 'SP-1',
      audience: 'women',
      category: 'clothing',
      pieceType: 'twoPiece',
      pieceCount: 2,
      stitching: 'stitched',
      fabric: 'Lawn',
      color: 'Green',
      colorFamilies: ['green'],
      priceMinor: 449_000,
      priceMaxMinor: 499_000,
      compareAtMinor: 899_000,
      discountPercent: 50,
      currency: 'PKR',
      inStock: true,
      components: [{ label: 'Shirt', lines: ['Ready To Wear Lawn Stitched Shirt.'] }],
      retiredAt: null,
      // New products date from when the brand published them, not from the import.
      firstSeenAt: new Date('2026-09-01T10:00:00.000Z'),
    });

    const images = await db.select().from(productImages).where(eq(productImages.productId, product!.id));
    const variants = await db.select().from(productVariants).where(eq(productVariants.productId, product!.id));
    expect(images.map((image) => image.position)).toEqual([0, 1, 2]);
    expect(variants.map(({ size, sizeLabel, available }) => ({ size, sizeLabel, available }))).toEqual([
      { size: 'S', sizeLabel: 'Small', available: false },
      { size: 'M', sizeLabel: 'Medium', available: true },
    ]);
  });

  it('counts in-scope products per brand and picks a cover', async () => {
    await insertScraperProduct(scraperPool, { id: '20_1', brandId: 20, tags: ['Women'] });
    await insertScraperProduct(scraperPool, { id: '20_2', brandId: 20, tags: ['Women'], inStock: false });
    await insertScraperProduct(scraperPool, { id: '20_3', brandId: 20, tags: ['Men'], title: 'Kurta' });

    await ingest().run();

    const [brand] = await db.select().from(brands);
    expect(brand).toMatchObject({ productCount: 2, inStockCount: 1 });
    expect(brand?.coverImageUrl).toBe('https://cdn.shopify.com/20_1-0.jpg');
  });

  it('skips rows that no longer fit the expected shape and reports them', async () => {
    await insertScraperProduct(scraperPool, { id: '20_1', brandId: 20 });
    await insertScraperProduct(scraperPool, { id: '20_2', brandId: 20, images: [] });

    const result = await ingest().run();

    expect(result.stats.created).toBe(1);
    expect(result.invalid).toEqual([{ id: '20_2', problem: expect.stringContaining('images') }]);
  });
});

describe('later (incremental) runs', () => {
  it('only reads what changed since the last run', async () => {
    await insertScraperProduct(scraperPool, { id: '20_1', brandId: 20 });
    await insertScraperProduct(scraperPool, { id: '20_2', brandId: 20 });
    await ingest().run();

    await insertScraperProduct(scraperPool, {
      id: '20_2',
      brandId: 20,
      price: 3990,
      revision: 1,
      updatedAt: '2026-10-09 06:30:00.000',
    });

    const result = await ingest().run();

    expect(result.mode).toBe('incremental');
    expect(result.stats).toMatchObject({ read: 1, updated: 1, created: 0 });
    expect((await productBySource('20_2'))?.priceMinor).toBe(399_000);
  });

  it('keeps the id and first-seen date when a product changes', async () => {
    await insertScraperProduct(scraperPool, { id: '20_1', brandId: 20 });
    await ingest().run();
    const before = await productBySource('20_1');

    await insertScraperProduct(scraperPool, {
      id: '20_1',
      brandId: 20,
      title: 'Renamed Suit',
      revision: 1,
      updatedAt: '2026-10-09 06:30:00.000',
    });
    await ingest().run();
    const after = await productBySource('20_1');

    expect(after).toMatchObject({ id: before?.id, firstSeenAt: before?.firstSeenAt, name: 'Renamed Suit' });
  });

  it('skips products whose content has not changed, even on a full run', async () => {
    await insertScraperProduct(scraperPool, { id: '20_1', brandId: 20 });
    await ingest().run();

    const result = await ingest().run('full');

    expect(result.stats).toMatchObject({ read: 1, unchanged: 1, updated: 0 });
  });

  it('retires products the scraper removed or deleted, and restores them if they return', async () => {
    await insertScraperProduct(scraperPool, { id: '20_1', brandId: 20 });
    await insertScraperProduct(scraperPool, { id: '20_2', brandId: 20 });
    await insertScraperProduct(scraperPool, { id: '20_3', brandId: 20 });
    await ingest().run();

    await insertScraperProduct(scraperPool, {
      id: '20_1',
      brandId: 20,
      isActive: false,
      removedAt: '2026-10-09 06:30:00.000',
      updatedAt: '2026-10-09 06:30:00.000',
    });
    await deleteScraperProduct(scraperPool, '20_2');

    const removal = await ingest().run();

    expect(removal.stats.retired).toBe(2);
    expect((await productBySource('20_1'))?.retiredAt).toEqual(new Date('2026-10-09T06:30:00.000Z'));
    expect((await productBySource('20_2'))?.retiredAt).toEqual(NOW);
    expect((await productBySource('20_3'))?.retiredAt).toBeNull();

    await insertScraperProduct(scraperPool, { id: '20_1', brandId: 20, revision: 2, updatedAt: '2026-10-10 06:30:00.000' });

    const comeback = await ingest().run();

    expect(comeback.stats.restored).toBe(1);
    expect((await productBySource('20_1'))?.retiredAt).toBeNull();
  });
});

describe('run bookkeeping', () => {
  it('records each run with its stats and the scraper position it reached', async () => {
    await insertScraperProduct(scraperPool, { id: '20_1', brandId: 20, updatedAt: '2026-10-08 07:00:00.000' });

    const result = await ingest().run();

    const [run] = await db.select().from(ingestRuns).where(eq(ingestRuns.id, result.runId));
    expect(run).toMatchObject({
      source: 'scraper',
      mode: 'full',
      status: 'succeeded',
      sourceCursor: new Date('2026-10-08T07:00:00.000Z'),
      stats: expect.objectContaining({ created: 1 }),
    });
  });

  it('refuses to start while another run holds the lock', async () => {
    const holder = await target.pool.getConnection();
    await holder.query("SELECT GET_LOCK(concat('clothhub_ingest:', database()), 0)");

    try {
      await expect(ingest().run()).rejects.toThrow('Another ingest run is in progress.');
    } finally {
      await holder.query("SELECT RELEASE_LOCK(concat('clothhub_ingest:', database()))");
      holder.release();
    }
  });
});
