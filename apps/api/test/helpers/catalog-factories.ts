import type { Database } from '../../src/db/client.js';
import { brands, productImages, products, productVariants } from '../../src/db/schema/index.js';
import { uuidv7 } from '../../src/lib/ids.js';
import { refreshListed } from '../../src/modules/catalog/scope.js';

/*
 * Catalogue rows for API tests, with sensible defaults: an active women's
 * brand, and an in-stock women's lawn suit. Override only what a test is
 * about. Like the ingest job, inserting a product re-evaluates which
 * products the app lists.
 */

type BrandInsert = typeof brands.$inferInsert;
type ProductInsert = typeof products.$inferInsert;

let sequence = 0;
const next = () => (sequence += 1);

export async function insertBrand(db: Database, overrides: Partial<BrandInsert> = {}) {
  const n = next();
  const brand: BrandInsert = {
    id: uuidv7(),
    sourceRef: 10_000 + n,
    slug: `brand-${n}`,
    name: `Brand ${n}`,
    website: `https://brand-${n}.pk`,
    status: 'active',
    audience: 'women',
    currency: 'PKR',
    productCount: 1,
    inStockCount: 1,
    coverImageUrl: `https://cdn.shopify.com/brand-${n}.jpg`,
    ...overrides,
  };

  await db.insert(brands).values(brand);

  return brand as Required<Pick<BrandInsert, 'id' | 'slug' | 'name'>> & BrandInsert;
}

export type ProductFixture = Partial<ProductInsert> & {
  images?: number;
  sizes?: { size: string | null; available: boolean }[];
};

export async function insertProduct(db: Database, brandId: string, fixture: ProductFixture = {}) {
  const n = next();
  const { images = 3, sizes = [{ size: 'S', available: true }, { size: 'M', available: false }], ...overrides } = fixture;
  const firstSeenAt = overrides.firstSeenAt ?? new Date(Date.UTC(2026, 9, 1, 0, 0, n));

  const product: ProductInsert = {
    id: uuidv7(),
    brandId,
    sourceProductId: `${brandId.slice(0, 8)}_${n}`,
    sku: `SKU-${n}`,
    name: `Printed Lawn Suit ${n}`,
    shortName: `Printed Lawn Suit ${n}`,
    title: `Printed Lawn Suit ${n}`,
    description: 'A breathable printed lawn suit for everyday summer wear, with a matching dupatta.',
    components: [{ label: 'Shirt', lines: ['Printed lawn shirt'] }],
    highlights: ['Machine washable'],
    audience: 'women',
    category: 'unstitched',
    pieceType: 'threePiece',
    pieceCount: 3,
    stitching: 'unstitched',
    fabric: 'Lawn',
    color: 'Green',
    colorFamilies: ['green'],
    priceMinor: 500_000,
    priceMaxMinor: 500_000,
    compareAtMinor: null,
    currency: 'PKR',
    inStock: true,
    sourceUrl: `https://brand.pk/products/suit-${n}`,
    sourceType: 'Unstitched',
    sourceTags: ['Women', 'Lawn'],
    searchText: 'Unstitched Women Lawn Green',
    lastSeenAt: firstSeenAt,
    retiredAt: null,
    contentHash: 'x'.repeat(64),
    ...overrides,
    firstSeenAt,
  };

  await db.insert(products).values(product);

  if (images > 0) {
    await db.insert(productImages).values(
      Array.from({ length: images }, (_, position) => ({
        productId: product.id!,
        position,
        url: `https://cdn.shopify.com/p/${n}-${position}.jpg`,
        width: 800,
        height: 1200,
      })),
    );
  }

  if (sizes.length > 0) {
    await db.insert(productVariants).values(
      sizes.map((variant, position) => ({
        productId: product.id!,
        position,
        sourceVariantId: `${n}-${position}`,
        sku: `SKU-${n}-${variant.size ?? 'one'}`,
        size: variant.size,
        sizeLabel: variant.size,
        color: 'Green',
        colorFamily: 'green',
        priceMinor: product.priceMinor,
        compareAtMinor: product.compareAtMinor ?? null,
        available: variant.available,
      })),
    );
  }

  await refreshListed(db);

  return product as ProductInsert & { id: string };
}
