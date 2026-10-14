import type { Pool, RowDataPacket } from 'mysql2/promise';
import { z } from 'zod';

/*
 * Read access to the scraper's MySQL database. Only `brands` and
 * `liveProducts` (validated, published products) are read — never
 * `syncedProducts` or anything else. Every row is validated, because the
 * scraper's tables change independently of ClothHub: a row that no longer
 * fits is reported and skipped instead of corrupting the catalogue.
 */

const decimal = z.union([z.string(), z.number()]).transform((value) => Number(value));
const nullableDecimal = decimal.nullable();
const flag = z.union([z.number(), z.boolean()]).transform(Boolean);
const date = z.coerce.date();

export const ScraperBrandSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  sourceUrl: z.string(),
  verificationState: z.string(),
});

export type ScraperBrand = z.infer<typeof ScraperBrandSchema>;

export const ScraperVariantSchema = z.object({
  sku: z.string().nullish(),
  size: z.string().nullish(),
  label: z.string().nullish(),
  price: nullableDecimal.optional(),
  colour: z.string().nullish(),
  available: z.boolean(),
  compareAtPrice: nullableDecimal.optional(),
  sourceVariantId: z.union([z.string(), z.number()]).transform(String),
});

export const ScraperImageSchema = z.object({
  src: z.string().min(1),
  width: z.number().int().positive().nullish(),
  height: z.number().int().positive().nullish(),
});

export const ScraperProductSchema = z.object({
  id: z.string(),
  brandId: z.number().int(),
  productUrl: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  type: z.string().nullable(),
  tags: z.array(z.string()),
  price: decimal,
  priceMax: decimal,
  compareAtPrice: nullableDecimal,
  inStock: flag,
  variants: z.array(ScraperVariantSchema),
  images: z.array(ScraperImageSchema).min(1),
  sourcePublishedAt: date.nullable(),
  sourceCreatedAt: date.nullable(),
  updatedAt: date,
  contentHash: z.string(),
  removedAt: date.nullable(),
  isActive: flag,
});

export type ScraperProduct = z.infer<typeof ScraperProductSchema>;

const PRODUCT_COLUMNS = `id, brandId, productUrl, title, description, type, tags, price, priceMax,
  compareAtPrice, inStock, variants, images, sourcePublishedAt, sourceCreatedAt, updatedAt,
  contentHash, removedAt, isActive`;

export type ParsedRows = {
  products: ScraperProduct[];
  invalid: { id: string; problem: string }[];
};

function parseRows(rows: RowDataPacket[]): ParsedRows {
  const products: ScraperProduct[] = [];
  const invalid: ParsedRows['invalid'] = [];

  for (const row of rows) {
    const parsed = ScraperProductSchema.safeParse(row);

    if (parsed.success) {
      products.push(parsed.data);
    } else {
      const issue = parsed.error.issues[0];
      invalid.push({
        id: String(row.id),
        problem: issue ? `${issue.path.join('.')}: ${issue.message}` : 'invalid row',
      });
    }
  }

  return { products, invalid };
}

export class ScraperReader {
  constructor(private readonly pool: Pool) {}

  async brands(): Promise<ScraperBrand[]> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      'SELECT id, name, sourceUrl, verificationState FROM brands ORDER BY id',
    );

    return rows.map((row) => ScraperBrandSchema.parse(row));
  }

  /** Every product id with its state — cheap enough to read in full on each run. */
  async productStates(): Promise<Map<string, { active: boolean; updatedAt: Date }>> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      'SELECT id, isActive, removedAt, updatedAt FROM liveProducts',
    );

    return new Map(
      rows.map((row) => [
        String(row.id),
        { active: Boolean(row.isActive) && row.removedAt === null, updatedAt: new Date(row.updatedAt) },
      ]),
    );
  }

  /** Full mode: the next page of products after `afterId`, in primary-key order. */
  async productsAfter(afterId: string, limit: number): Promise<ParsedRows & { lastId: string | null }> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT ${PRODUCT_COLUMNS} FROM liveProducts WHERE id > ? ORDER BY id LIMIT ?`,
      [afterId, limit],
    );

    return { ...parseRows(rows), lastId: rows.length > 0 ? String(rows[rows.length - 1]!.id) : null };
  }

  /** Incremental mode: specific products by id. */
  async productsByIds(ids: string[]): Promise<ParsedRows> {
    if (ids.length === 0) return { products: [], invalid: [] };

    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT ${PRODUCT_COLUMNS} FROM liveProducts WHERE id IN (?)`,
      [ids],
    );

    return parseRows(rows);
  }
}
