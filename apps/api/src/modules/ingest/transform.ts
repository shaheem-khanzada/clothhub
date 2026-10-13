import { createHash } from 'node:crypto';

import type { BrandAudience, productImages, products, productVariants } from '../../db/schema/index.js';
import {
  colorFamilyOf,
  displayNameFrom,
  fabricFrom,
  normalizeSize,
  pieceCountFrom,
  pieceTypeOf,
  shortNameFrom,
  skuFrom,
  stitchingFrom,
} from './attributes.js';
import { classifyAudience, classifyCategory } from './classify.js';
import { parseDescription } from './describe.js';
import type { ScraperProduct } from './scraper.js';
import { repairReplacementChars, squash } from './text.js';

/**
 * Bump when the normalisation rules change: every product's stored hash then
 * differs from the new one, so the next run re-normalises the whole catalogue.
 */
export const INGEST_VERSION = 1;

type ProductRow = typeof products.$inferInsert;
type ImageRow = typeof productImages.$inferInsert;
type VariantRow = typeof productVariants.$inferInsert;

export type TransformedProduct = {
  product: Omit<ProductRow, 'id' | 'firstSeenAt' | 'createdAt' | 'updatedAt'>;
  images: Omit<ImageRow, 'productId'>[];
  variants: Omit<VariantRow, 'productId'>[];
  /** When the brand first published it; the first-seen date of a product new to ClothHub. */
  publishedAt: Date | null;
};

export type BrandContext = {
  id: string;
  name: string;
  currency: string;
  /** Curated, or measured on the previous run; `mixed` for a new brand. */
  audience: BrandAudience;
};

export function contentHashOf(product: ScraperProduct): string {
  return createHash('sha256').update(`${product.contentHash}:${INGEST_VERSION}`).digest('hex');
}

/** Whole currency units → minor units (paisa), never a float in the database. */
export function toMinor(value: number): number {
  return Math.round(value * 100);
}

function handleOf(productUrl: string): string {
  const match = /\/products\/([^/?#]+)/.exec(productUrl);

  return match ? decodeURIComponent(match[1]!).toLowerCase() : '';
}

function truncate(value: string, length: number): string {
  return value.length > length ? `${value.slice(0, length - 1)}…` : value;
}

function truncateOrNull(value: string | null | undefined, length: number): string | null {
  return value ? truncate(value, length) : null;
}

export function transformProduct(
  source: ScraperProduct,
  brand: BrandContext,
  now: Date,
): TransformedProduct {
  const handle = handleOf(source.productUrl);
  const title = squash(repairReplacementChars(source.title));
  const text = { type: source.type, tags: source.tags, title, handle };

  const audience = classifyAudience(text, brand.audience);
  const category = classifyCategory(text);
  const details = parseDescription(source.description, title);

  const name = displayNameFrom(title);
  const pieceCount = pieceCountFrom(title, source.type, source.tags.join(' '), handle);
  const stitching =
    category === 'unstitched'
      ? 'unstitched'
      : stitchingFrom([source.type, source.tags.join(' '), title, handle].join(' | '));

  const variants: TransformedProduct['variants'] = source.variants.map((variant, position) => {
    const price = variant.price ?? source.price;
    const compareAt = variant.compareAtPrice ?? null;

    return {
      position,
      sourceVariantId: truncate(variant.sourceVariantId, 64),
      sku: variant.sku ? truncate(variant.sku, 120) : null,
      size: normalizeSize(variant.size ?? variant.label),
      sizeLabel: truncateOrNull(variant.size ?? variant.label, 120),
      color: variant.colour ? truncate(variant.colour, 80) : null,
      colorFamily: colorFamilyOf(variant.colour),
      priceMinor: toMinor(price),
      compareAtMinor: compareAt !== null && compareAt > price ? toMinor(compareAt) : null,
      available: variant.available,
    };
  });

  const color = details.color ?? source.variants.find((variant) => variant.colour)?.colour ?? null;
  const colorFamilies = [
    ...new Set(
      [colorFamilyOf(color), ...variants.map((variant) => variant.colorFamily)].filter(
        (family): family is string => family !== null,
      ),
    ),
  ];

  const fabric =
    (details.fabric && details.fabric.length <= 40 ? details.fabric : null) ??
    fabricFrom(title, source.type, source.tags.join(' '));

  const sku = skuFrom(handle, source.variants[0]?.sku);
  const compareAt = source.compareAtPrice;

  return {
    product: {
      brandId: brand.id,
      sourceProductId: source.id,
      sku: sku ? truncate(sku, 120) : null,

      name: truncate(name, 255),
      shortName: truncate(shortNameFrom(name), 255),
      title: truncate(title, 255),
      description: details.description,
      components: details.components,
      highlights: details.highlights,

      audience,
      category,
      pieceType: pieceTypeOf(pieceCount),
      pieceCount,
      stitching,
      fabric,
      color: color ? truncate(color, 80) : null,
      colorFamilies,

      priceMinor: toMinor(source.price),
      priceMaxMinor: toMinor(Math.max(source.priceMax, source.price)),
      compareAtMinor: compareAt !== null && compareAt > source.price ? toMinor(compareAt) : null,
      currency: brand.currency,

      inStock: source.inStock,
      sourceUrl: source.productUrl,
      sourceType: source.type ? truncate(source.type, 100) : null,
      sourceTags: source.tags,
      searchText: [brand.name, source.type, ...source.tags, sku, fabric, color, ...colorFamilies]
        .filter(Boolean)
        .join(' '),

      sourcePublishedAt: source.sourcePublishedAt,
      sourceCreatedAt: source.sourceCreatedAt,
      lastSeenAt: now,
      retiredAt: source.isActive && source.removedAt === null ? null : (source.removedAt ?? now),
      contentHash: contentHashOf(source),
    },
    images: source.images.map((image, position) => ({
      position,
      url: image.src,
      width: image.width ?? null,
      height: image.height ?? null,
    })),
    variants,
    publishedAt: source.sourcePublishedAt ?? source.sourceCreatedAt,
  };
}
