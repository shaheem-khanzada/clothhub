import { sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  char,
  datetime,
  foreignKey,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  primaryKey,
  smallint,
  text,
  tinyint,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/mysql-core';

/*
 * Catalogue: what the app shows. Written only by the ingest job; the API
 * reads it. Column names are snake_case in MySQL (Drizzle `casing`).
 *
 * See docs/data-model.md for the reasoning behind each column.
 */

const timestamps = {
  createdAt: datetime({ fsp: 3 })
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP(3))`),
  updatedAt: datetime({ fsp: 3 })
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP(3))`)
    .$onUpdate(() => new Date()),
};

export const AUDIENCES = ['women', 'men', 'kids', 'unisex', 'unknown'] as const;
export const BRAND_AUDIENCES = ['women', 'mixed', 'men', 'kids'] as const;
export const CATEGORIES = [
  'clothing',
  'unstitched',
  'accessories',
  'jewelry',
  'bags',
  'footwear',
  'home',
  'beauty',
  'fragrance',
] as const;
export const PIECE_TYPES = ['threePiece', 'twoPiece', 'single'] as const;
export const STITCHINGS = ['stitched', 'unstitched'] as const;

export type Audience = (typeof AUDIENCES)[number];
export type BrandAudience = (typeof BRAND_AUDIENCES)[number];
export type Category = (typeof CATEGORIES)[number];

export const brands = mysqlTable(
  'brands',
  {
    id: char({ length: 36 }).primaryKey(),
    /** The scraper's brand id; null for brands that come from other sources later. */
    sourceRef: int({ unsigned: true }),
    slug: varchar({ length: 80 }).notNull(),
    name: varchar({ length: 150 }).notNull(),
    website: varchar({ length: 512 }).notNull(),
    logoUrl: varchar({ length: 1024 }),
    /** `hidden` keeps a brand out of the app (e.g. prices in a currency we cannot show yet). */
    status: mysqlEnum(['active', 'hidden']).notNull().default('active'),
    /** Who the brand mainly sells to. Products with no audience signal inherit `women` from a women's brand. */
    audience: mysqlEnum(BRAND_AUDIENCES).notNull().default('mixed'),
    currency: char({ length: 3 }).notNull().default('PKR'),

    /** Cached by the ingest job: products in the app's scope, and how many are in stock. */
    productCount: int({ unsigned: true }).notNull().default(0),
    inStockCount: int({ unsigned: true }).notNull().default(0),
    coverImageUrl: varchar({ length: 1024 }),

    ...timestamps,
  },
  (table) => [
    uniqueIndex('uq_brands_slug').on(table.slug),
    uniqueIndex('uq_brands_source_ref').on(table.sourceRef),
  ],
);

export const products = mysqlTable(
  'products',
  {
    id: char({ length: 36 }).primaryKey(),
    brandId: char({ length: 36 }).notNull(),
    /** The scraper's product id, e.g. "12_10086505480489". */
    sourceProductId: varchar({ length: 80 }).notNull(),
    sku: varchar({ length: 120 }),

    name: varchar({ length: 255 }).notNull(),
    shortName: varchar({ length: 255 }).notNull(),
    title: varchar({ length: 255 }).notNull(),
    description: text(),
    /** Shirt / Dupatta / Trouser breakdown and loose facts parsed from the description. */
    components: json().$type<{ label: string; lines: string[] }[]>().notNull(),
    highlights: json().$type<string[]>().notNull(),

    /** From the product's own signals only; `unknown` falls back to the brand's audience. */
    audience: mysqlEnum(AUDIENCES).notNull(),
    category: mysqlEnum(CATEGORIES).notNull(),
    pieceType: mysqlEnum(PIECE_TYPES).notNull(),
    pieceCount: tinyint({ unsigned: true }),
    stitching: mysqlEnum(STITCHINGS),
    fabric: varchar({ length: 40 }),
    color: varchar({ length: 80 }),
    colorFamilies: json().$type<string[]>().notNull(),

    /** Money in the smallest unit (paisa). BIGINT: bridal couture runs past INT's 42.9M rupees. */
    priceMinor: bigint({ mode: 'number', unsigned: true }).notNull(),
    priceMaxMinor: bigint({ mode: 'number', unsigned: true }).notNull(),
    compareAtMinor: bigint({ mode: 'number', unsigned: true }),
    currency: char({ length: 3 }).notNull(),
    discountPercent: tinyint({ unsigned: true }).generatedAlwaysAs(
      sql`(case when compare_at_minor > price_minor then least(99, greatest(1, round((compare_at_minor - price_minor) * 100 / compare_at_minor))) end)`,
      { mode: 'stored' },
    ),

    inStock: boolean().notNull(),
    sourceUrl: varchar({ length: 1024 }).notNull(),
    sourceType: varchar({ length: 100 }),
    sourceTags: json().$type<string[]>().notNull(),
    /** Brand name, type, tags, SKU, fabric and colours — feeds the full-text index. */
    searchText: text().notNull(),

    sourcePublishedAt: datetime({ fsp: 0 }),
    sourceCreatedAt: datetime({ fsp: 0 }),
    firstSeenAt: datetime({ fsp: 3 }).notNull(),
    lastSeenAt: datetime({ fsp: 3 }).notNull(),
    /** Set when the brand stops selling it. Retired products stay for saves and shared links. */
    retiredAt: datetime({ fsp: 3 }),
    /**
     * In the app's current scope (src/modules/catalog/scope.ts). Recomputed by
     * every ingest run, so list queries filter on one indexed column instead
     * of re-evaluating the scope with a join.
     */
    listed: boolean().notNull().default(false),
    /** Scraper content hash + ingest version: unchanged rows are skipped. */
    contentHash: char({ length: 64 }).notNull(),

    ...timestamps,
  },
  (table) => [
    uniqueIndex('uq_products_source').on(table.brandId, table.sourceProductId),
    foreignKey({ name: 'fk_products_brand', columns: [table.brandId], foreignColumns: [brands.id] }),
    // Listing indexes: each serves one sort, across brands and for one brand.
    index('ix_products_listed_featured').on(table.listed, table.inStock, table.firstSeenAt),
    index('ix_products_listed_brand_featured').on(table.listed, table.brandId, table.inStock, table.firstSeenAt),
    index('ix_products_listed_date').on(table.listed, table.firstSeenAt),
    index('ix_products_listed_brand_date').on(table.listed, table.brandId, table.firstSeenAt),
    index('ix_products_listed_price').on(table.listed, table.priceMinor),
    index('ix_products_listed_brand_price').on(table.listed, table.brandId, table.priceMinor),
    index('ix_products_listed_type').on(table.listed, table.pieceType),
    index('ix_products_listed_brand_type').on(table.listed, table.brandId, table.pieceType),
    index('ix_products_listed_sale').on(table.listed, table.discountPercent),
    // FULLTEXT (name, title, search_text) is created in a hand-written
    // migration: Drizzle's MySQL builder cannot declare full-text indexes.
  ],
);

export const productImages = mysqlTable(
  'product_images',
  {
    productId: char({ length: 36 }).notNull(),
    position: smallint({ unsigned: true }).notNull(),
    url: varchar({ length: 1024 }).notNull(),
    width: smallint({ unsigned: true }),
    height: smallint({ unsigned: true }),
    /** Base64 ThumbHash of the photo, filled by the placeholders job (covers only). */
    thumbhash: varchar({ length: 64 }),
    /** The last time the placeholders job could not fetch or decode this photo; retried later. */
    thumbhashFailedAt: datetime({ fsp: 3 }),
  },
  (table) => [
    primaryKey({ name: 'pk_product_images', columns: [table.productId, table.position] }),
    foreignKey({
      name: 'fk_product_images_product',
      columns: [table.productId],
      foreignColumns: [products.id],
    }).onDelete('cascade'),
  ],
);

export const productVariants = mysqlTable(
  'product_variants',
  {
    productId: char({ length: 36 }).notNull(),
    position: smallint({ unsigned: true }).notNull(),
    sourceVariantId: varchar({ length: 64 }).notNull(),
    sku: varchar({ length: 120 }),
    /** Normalised: "S", "M", "5-6Y", "38". Null for one-size and unstitched. */
    size: varchar({ length: 40 }),
    /** The brand's own label. */
    sizeLabel: varchar({ length: 120 }),
    color: varchar({ length: 80 }),
    colorFamily: varchar({ length: 20 }),
    priceMinor: bigint({ mode: 'number', unsigned: true }).notNull(),
    compareAtMinor: bigint({ mode: 'number', unsigned: true }),
    available: boolean().notNull(),
  },
  (table) => [
    primaryKey({ name: 'pk_product_variants', columns: [table.productId, table.position] }),
    foreignKey({
      name: 'fk_product_variants_product',
      columns: [table.productId],
      foreignColumns: [products.id],
    }).onDelete('cascade'),
  ],
);
