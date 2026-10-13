import { createHash } from 'node:crypto';

import type { Pool } from 'mysql2/promise';

/*
 * Rows for the fake scraper database, shaped exactly like the scraper's
 * `brands` and `liveProducts` tables (test/fixtures/scraper-schema.sql).
 */

export type ScraperBrandFixture = {
  id: number;
  name?: string;
  sourceUrl: string;
  verificationState?: 'verified' | 'failed' | 'unverified';
};

export async function insertScraperBrand(pool: Pool, brand: ScraperBrandFixture) {
  await pool.query(
    'INSERT INTO brands (id, name, sourceUrl, verificationState) VALUES (?, ?, ?, ?)',
    [brand.id, brand.name ?? 'Brand', brand.sourceUrl, brand.verificationState ?? 'verified'],
  );
}

export type ScraperVariant = {
  sku?: string | null;
  size?: string | null;
  label?: string | null;
  price?: string;
  colour?: string | null;
  available?: boolean;
  compareAtPrice?: string | null;
  sourceVariantId?: string;
};

export type ScraperProductFixture = {
  id: string;
  brandId: number;
  title?: string;
  description?: string | null;
  type?: string | null;
  tags?: string[];
  price?: number;
  priceMax?: number;
  compareAtPrice?: number | null;
  inStock?: boolean;
  variants?: ScraperVariant[];
  images?: { src: string; width: number; height: number }[];
  handle?: string;
  sourcePublishedAt?: string | null;
  updatedAt?: string;
  isActive?: boolean;
  removedAt?: string | null;
  /** Changes the content hash, like a real edit on the brand's shop. */
  revision?: number;
};

export async function insertScraperProduct(pool: Pool, fixture: ScraperProductFixture) {
  const handle = fixture.handle ?? `product-${fixture.id}`;
  const price = fixture.price ?? 4990;
  const variants = (
    fixture.variants ?? [
      { size: 'S', available: true },
      { size: 'M', available: false },
    ]
  ).map((variant, index) => ({
    sku: variant.sku ?? `SKU-${fixture.id}-${variant.size ?? index}`,
    size: variant.size ?? null,
    label: variant.label ?? variant.size ?? 'Default Title',
    price: variant.price ?? price.toFixed(2),
    colour: variant.colour ?? null,
    available: variant.available ?? true,
    compareAtPrice: variant.compareAtPrice ?? null,
    sourceVariantId: variant.sourceVariantId ?? `${fixture.id}${index}`,
  }));
  const images = fixture.images ?? [
    { src: `https://cdn.shopify.com/${fixture.id}-0.jpg`, width: 800, height: 1160 },
    { src: `https://cdn.shopify.com/${fixture.id}-1.jpg`, width: 800, height: 1160 },
    { src: `https://cdn.shopify.com/${fixture.id}-2.jpg`, width: 800, height: 1160 },
  ];
  const tags = fixture.tags ?? ['Women', 'Lawn'];
  const hash = createHash('sha256').update(`${fixture.id}:${fixture.revision ?? 0}`).digest('hex');
  const updatedAt = fixture.updatedAt ?? '2026-10-08 06:30:00.000';

  await pool.query(
    `INSERT INTO liveProducts (id, brandId, productUrl, title, description, type, tags, price, priceMax,
       compareAtPrice, inStock, onSale, sizesInStock, variants, images, primaryImage, imageCount,
       sourcePublishedAt, sourceCreatedAt, sourceUpdatedAt, scrapedAt, createdAt, updatedAt, contentHash,
       tagsText, removedAt, isActive, isEdited)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
     ON DUPLICATE KEY UPDATE title = VALUES(title), description = VALUES(description), type = VALUES(type),
       tags = VALUES(tags), price = VALUES(price), priceMax = VALUES(priceMax),
       compareAtPrice = VALUES(compareAtPrice), inStock = VALUES(inStock), variants = VALUES(variants),
       images = VALUES(images), updatedAt = VALUES(updatedAt), contentHash = VALUES(contentHash),
       removedAt = VALUES(removedAt), isActive = VALUES(isActive)`,
    [
      fixture.id,
      fixture.brandId,
      `https://shop.pk/products/${handle}`,
      fixture.title ?? 'Printed Lawn Suit 3 Piece',
      fixture.description === undefined ? 'Color: Green\nFabric: Lawn' : fixture.description,
      fixture.type === undefined ? 'Unstitched' : fixture.type,
      JSON.stringify(tags),
      price.toFixed(2),
      (fixture.priceMax ?? price).toFixed(2),
      fixture.compareAtPrice == null ? null : fixture.compareAtPrice.toFixed(2),
      fixture.inStock ?? true,
      fixture.compareAtPrice != null && (fixture.inStock ?? true),
      JSON.stringify(variants.filter((variant) => variant.available).map((variant) => variant.size)),
      JSON.stringify(variants),
      JSON.stringify(images),
      images[0]?.src ?? '',
      images.length,
      fixture.sourcePublishedAt === undefined ? '2026-09-01 10:00:00' : fixture.sourcePublishedAt,
      '2026-09-01 10:00:00',
      '2026-10-08 06:30:00',
      '2026-10-08 06:30:00.000',
      '2026-10-08 06:30:00.000',
      updatedAt,
      hash,
      tags.join(' '),
      fixture.removedAt ?? null,
      fixture.isActive ?? true,
    ],
  );
}

export async function deleteScraperProduct(pool: Pool, id: string) {
  await pool.query('DELETE FROM liveProducts WHERE id = ?', [id]);
}
