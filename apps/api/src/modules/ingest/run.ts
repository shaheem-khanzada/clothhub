import { and, desc, eq, inArray, isNull, sql } from 'drizzle-orm';
import type { Pool, PoolConnection } from 'mysql2/promise';

import type { Database } from '../../db/client.js';
import {
  type Audience,
  type BrandAudience,
  brands,
  ingestRuns,
  type IngestStats,
  productImages,
  products,
  productVariants,
} from '../../db/schema/index.js';
import { uuidv7 } from '../../lib/ids.js';
import type { Logger } from '../../lib/logger.js';
import { isListed, refreshListed } from '../catalog/scope.js';
import { BRAND_CURATION, fallbackName, hostOf, slugify } from './brands.js';
import { brandAudienceFromCounts } from './classify.js';
import type { ScraperBrand, ScraperProduct, ScraperReader } from './scraper.js';
import { type BrandContext, contentHashOf, transformProduct } from './transform.js';

/*
 * Ingest: the scraper's published products → ClothHub's catalogue.
 *
 *   1. Brands: upsert every scraper brand with ClothHub's curated name,
 *      currency and audience.
 *   2. Products: a full run reads every product; an incremental run only
 *      those the scraper changed since the last successful run. Unchanged
 *      rows (same content hash) are skipped; changed ones are upserted with
 *      their images and variants replaced.
 *   3. Retire products the scraper removed or deleted. They stay in the
 *      catalogue for saved lists and shared links.
 *   4. Recompute each brand's audience, counts and cover image.
 *
 * Safe to re-run at any time, and only one run can be active: a MySQL
 * advisory lock guards it.
 */

export const INGEST_SOURCE = 'scraper';

export type IngestMode = 'auto' | 'full' | 'incremental';

export type IngestOptions = {
  mode?: IngestMode;
  batchSize?: number;
  now?: () => Date;
  logger?: Logger;
};

export type IngestResult = {
  runId: string;
  mode: 'full' | 'incremental';
  stats: IngestStats;
  invalid: { id: string; problem: string }[];
};

type Target = {
  db: Database;
  pool: Pool;
};

type ExistingProduct = {
  id: string;
  sourceProductId: string;
  contentHash: string;
  firstSeenAt: Date;
  retiredAt: Date | null;
};

function emptyStats(): IngestStats {
  return {
    brands: 0,
    read: 0,
    created: 0,
    updated: 0,
    unchanged: 0,
    retired: 0,
    restored: 0,
    skippedUnknownBrand: 0,
  };
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

/** Columns refreshed when a product changes — everything except identity and first-seen. */
const UPDATED_PRODUCT_COLUMNS = [
  'sku',
  'name',
  'shortName',
  'title',
  'description',
  'components',
  'highlights',
  'audience',
  'category',
  'pieceType',
  'pieceCount',
  'stitching',
  'fabric',
  'color',
  'colorFamilies',
  'priceMinor',
  'priceMaxMinor',
  'compareAtMinor',
  'currency',
  'inStock',
  'sourceUrl',
  'sourceType',
  'sourceTags',
  'searchText',
  'sourcePublishedAt',
  'sourceCreatedAt',
  'lastSeenAt',
  'retiredAt',
  'contentHash',
] as const satisfies readonly (keyof typeof products.$inferInsert)[];

const toSnakeCase = (key: string) => key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);

/** `ON DUPLICATE KEY UPDATE column = VALUES(column)` for a multi-row upsert. */
const onDuplicateProduct = Object.fromEntries(
  UPDATED_PRODUCT_COLUMNS.map((key) => [key, sql.raw(`values(\`${toSnakeCase(key)}\`)`)]),
);

export class Ingest {
  private readonly batchSize: number;
  private readonly now: () => Date;
  private readonly logger: Logger | undefined;

  constructor(
    private readonly target: Target,
    private readonly scraper: ScraperReader,
    options: Omit<IngestOptions, 'mode'> = {},
  ) {
    this.batchSize = options.batchSize ?? 500;
    this.now = options.now ?? (() => new Date());
    this.logger = options.logger;
  }

  /**
   * Runs one import. A MySQL advisory lock named after the database keeps
   * runs from overlapping, while dev and production imports on the same
   * server never block each other.
   */
  async run(mode: IngestMode = 'auto'): Promise<IngestResult> {
    const lock = await this.target.pool.getConnection();

    try {
      const [[acquired]] = (await lock.query(
        "SELECT GET_LOCK(concat('clothhub_ingest:', database()), 0) AS ok",
      )) as unknown as [{ ok: number }[]];
      if (!acquired || acquired.ok !== 1) {
        throw new Error('Another ingest run is in progress.');
      }

      return await this.runLocked(mode);
    } finally {
      await this.releaseLock(lock);
    }
  }

  private async releaseLock(lock: PoolConnection) {
    try {
      await lock.query("SELECT RELEASE_LOCK(concat('clothhub_ingest:', database()))");
    } finally {
      lock.release();
    }
  }

  private async runLocked(requestedMode: IngestMode): Promise<IngestResult> {
    const { db } = this.target;
    const startedAt = this.now();
    const previous = await this.lastSuccessfulRun();
    const mode = requestedMode === 'auto' ? (previous ? 'incremental' : 'full') : requestedMode;
    const runId = uuidv7();

    await db.insert(ingestRuns).values({ id: runId, source: INGEST_SOURCE, mode, status: 'running', startedAt });
    this.logger?.info({ runId, mode, cursor: previous?.sourceCursor }, 'Ingest started');

    const stats = emptyStats();
    const invalid: IngestResult['invalid'] = [];

    try {
      const brandMap = await this.syncBrands(stats);
      const states = await this.scraper.productStates();
      const cursor = mode === 'incremental' ? (previous?.sourceCursor ?? null) : null;

      const handle = async (batch: { products: ScraperProduct[]; invalid: IngestResult['invalid'] }) => {
        invalid.push(...batch.invalid);
        stats.read += batch.products.length + batch.invalid.length;
        await this.upsertBatch(batch.products, brandMap, stats);
      };

      if (mode === 'full') {
        let afterId = '';
        for (;;) {
          const page = await this.scraper.productsAfter(afterId, this.batchSize);
          if (page.lastId === null) break;
          await handle(page);
          afterId = page.lastId;
          this.logger?.debug({ read: stats.read }, 'Ingest progress');
        }
      } else {
        const changed = [...states]
          .filter(([, state]) => cursor === null || state.updatedAt > cursor)
          .map(([id]) => id);

        for (const ids of chunk(changed, this.batchSize)) {
          await handle(await this.scraper.productsByIds(ids));
        }
      }

      stats.retired += await this.retireMissing(states);
      await this.refreshBrands();

      const sourceCursor = maxDate([...states.values()].map((state) => state.updatedAt)) ?? cursor;

      await db
        .update(ingestRuns)
        .set({ status: 'succeeded', finishedAt: this.now(), stats, sourceCursor })
        .where(eq(ingestRuns.id, runId));

      if (invalid.length > 0) {
        this.logger?.warn({ count: invalid.length, sample: invalid.slice(0, 5) }, 'Skipped invalid scraper rows');
      }
      this.logger?.info({ runId, mode, stats }, 'Ingest finished');

      return { runId, mode, stats, invalid };
    } catch (error) {
      await db
        .update(ingestRuns)
        .set({ status: 'failed', finishedAt: this.now(), stats, error: describeError(error) })
        .where(eq(ingestRuns.id, runId));
      this.logger?.error({ runId, err: error }, 'Ingest failed');
      throw error;
    }
  }

  private async lastSuccessfulRun() {
    const [run] = await this.target.db
      .select()
      .from(ingestRuns)
      .where(and(eq(ingestRuns.source, INGEST_SOURCE), eq(ingestRuns.status, 'succeeded')))
      .orderBy(desc(ingestRuns.startedAt))
      .limit(1);

    return run ?? null;
  }

  /* ---------------------------------------------------------------------- */
  /*  Brands                                                                */
  /* ---------------------------------------------------------------------- */

  private async syncBrands(stats: IngestStats): Promise<Map<number, BrandContext>> {
    const { db } = this.target;
    const source = await this.scraper.brands();
    const existing = await db.select().from(brands);
    const bySourceRef = new Map(existing.map((brand) => [brand.sourceRef, brand]));

    const slugs = assignSlugs(source, existing);
    const contexts = new Map<number, BrandContext>();

    for (const scraperBrand of source) {
      const host = hostOf(scraperBrand.sourceUrl);
      const curation = BRAND_CURATION[host];
      const currency = curation?.currency ?? 'PKR';
      const values = {
        name: curation?.name ?? fallbackName(scraperBrand.name, host),
        slug: slugs.get(scraperBrand.id)!,
        website: `https://${host}`,
        currency,
        // Prices in another currency would read as rupees: keep those brands out until supported.
        status: currency === 'PKR' ? ('active' as const) : ('hidden' as const),
        ...(curation?.audience ? { audience: curation.audience } : {}),
      };

      const current = bySourceRef.get(scraperBrand.id);
      let id: string;

      if (current) {
        id = current.id;
        await db.update(brands).set(values).where(eq(brands.id, id));
      } else {
        id = uuidv7();
        await db.insert(brands).values({ id, sourceRef: scraperBrand.id, ...values });
      }

      contexts.set(scraperBrand.id, {
        id,
        name: values.name,
        currency,
        audience: curation?.audience ?? current?.audience ?? 'mixed',
      });
    }

    stats.brands = source.length;

    return contexts;
  }

  /** After products change: each brand's audience (unless curated), counts and cover. */
  private async refreshBrands() {
    const { db } = this.target;
    const all = await db.select({ id: brands.id, sourceRef: brands.sourceRef, website: brands.website }).from(brands);

    const audienceRows = await db
      .select({ brandId: products.brandId, audience: products.audience, count: sql<number>`count(*)` })
      .from(products)
      .where(isNull(products.retiredAt))
      .groupBy(products.brandId, products.audience);

    const countsByBrand = new Map<string, Partial<Record<Audience, number>>>();
    for (const row of audienceRows) {
      const counts = countsByBrand.get(row.brandId) ?? {};
      counts[row.audience] = Number(row.count);
      countsByBrand.set(row.brandId, counts);
    }

    for (const brand of all) {
      const curated = BRAND_CURATION[hostOf(brand.website)]?.audience;
      const audience: BrandAudience = curated ?? brandAudienceFromCounts(countsByBrand.get(brand.id) ?? {});
      await db.update(brands).set({ audience }).where(eq(brands.id, brand.id));
    }

    // Re-evaluate the app's scope for every product now that brand audiences are current.
    await refreshListed(db);

    // Counts read the same flag as the API, so a brand card's number matches its list.
    const counts = await db
      .select({
        brandId: products.brandId,
        productCount: sql<number>`count(*)`,
        inStockCount: sql<number>`coalesce(sum(${products.inStock}), 0)`,
      })
      .from(products)
      .where(isListed)
      .groupBy(products.brandId);

    const countMap = new Map(counts.map((row) => [row.brandId, row]));

    for (const brand of all) {
      const row = countMap.get(brand.id);
      const coverImageUrl = row ? await this.coverImage(brand.id) : null;

      await db
        .update(brands)
        .set({
          productCount: Number(row?.productCount ?? 0),
          inStockCount: Number(row?.inStockCount ?? 0),
          coverImageUrl,
        })
        .where(eq(brands.id, brand.id));
    }
  }

  /** The newest in-stock product with at least three photos makes the best brand cover. */
  private async coverImage(brandId: string): Promise<string | null> {
    const third = sql`exists (select 1 from ${productImages} pi3 where pi3.product_id = ${products.id} and pi3.position = 2)`;

    const [row] = await this.target.db
      .select({ url: productImages.url })
      .from(products)
      .innerJoin(productImages, and(eq(productImages.productId, products.id), eq(productImages.position, 0)))
      .where(and(isListed, eq(products.brandId, brandId), eq(products.inStock, true), third))
      .orderBy(desc(products.firstSeenAt))
      .limit(1);

    return row?.url ?? null;
  }

  /* ---------------------------------------------------------------------- */
  /*  Products                                                              */
  /* ---------------------------------------------------------------------- */

  private async upsertBatch(batch: ScraperProduct[], brandMap: Map<number, BrandContext>, stats: IngestStats) {
    if (batch.length === 0) return;

    const { db } = this.target;
    const now = this.now();

    const existingRows = await db
      .select({
        id: products.id,
        sourceProductId: products.sourceProductId,
        contentHash: products.contentHash,
        firstSeenAt: products.firstSeenAt,
        retiredAt: products.retiredAt,
      })
      .from(products)
      .where(
        inArray(
          products.sourceProductId,
          batch.map((product) => product.id),
        ),
      );
    const existing = new Map<string, ExistingProduct>(existingRows.map((row) => [row.sourceProductId, row]));

    const productRows: (typeof products.$inferInsert)[] = [];
    const imageRows: (typeof productImages.$inferInsert)[] = [];
    const variantRows: (typeof productVariants.$inferInsert)[] = [];
    const changedIds: string[] = [];
    const unchangedIds: string[] = [];

    for (const source of batch) {
      const brand = brandMap.get(source.brandId);
      if (!brand) {
        stats.skippedUnknownBrand += 1;
        continue;
      }

      const current = existing.get(source.id);
      const retired = !source.isActive || source.removedAt !== null;

      if (current && current.contentHash === contentHashOf(source) && (current.retiredAt !== null) === retired) {
        unchangedIds.push(current.id);
        stats.unchanged += 1;
        continue;
      }

      const transformed = transformProduct(source, brand, now);
      const id = current?.id ?? uuidv7();
      const firstSeenAt =
        current?.firstSeenAt ?? (transformed.publishedAt && transformed.publishedAt < now ? transformed.publishedAt : now);

      productRows.push({ ...transformed.product, id, firstSeenAt });
      imageRows.push(...transformed.images.map((image) => ({ ...image, productId: id })));
      variantRows.push(...transformed.variants.map((variant) => ({ ...variant, productId: id })));
      changedIds.push(id);

      if (!current) stats.created += 1;
      else stats.updated += 1;

      if (current && current.retiredAt !== null && !retired) stats.restored += 1;
      if (retired && (!current || current.retiredAt === null)) stats.retired += 1;
    }

    await db.transaction(async (tx) => {
      if (productRows.length > 0) {
        await tx.insert(products).values(productRows).onDuplicateKeyUpdate({ set: onDuplicateProduct });

        for (const ids of chunk(changedIds, 1000)) {
          await tx.delete(productImages).where(inArray(productImages.productId, ids));
          await tx.delete(productVariants).where(inArray(productVariants.productId, ids));
        }
        for (const rows of chunk(imageRows, 2000)) await tx.insert(productImages).values(rows);
        for (const rows of chunk(variantRows, 2000)) await tx.insert(productVariants).values(rows);
      }

      for (const ids of chunk(unchangedIds, 1000)) {
        await tx.update(products).set({ lastSeenAt: now }).where(inArray(products.id, ids));
      }
    });
  }

  /** Products the scraper no longer lists as live (removed, deactivated or deleted). */
  private async retireMissing(states: Map<string, { active: boolean }>): Promise<number> {
    const { db } = this.target;
    const live = await db
      .select({ id: products.id, sourceProductId: products.sourceProductId })
      .from(products)
      .where(isNull(products.retiredAt));

    const gone = live
      .filter((product) => !states.get(product.sourceProductId)?.active)
      .map((product) => product.id);

    const now = this.now();
    for (const ids of chunk(gone, 1000)) {
      await db.update(products).set({ retiredAt: now }).where(inArray(products.id, ids));
    }

    return gone.length;
  }
}

/** Unique slugs, stable across runs: an existing brand keeps its slug; clashes get the scraper id. */
function assignSlugs(
  source: ScraperBrand[],
  existing: { sourceRef: number | null; slug: string }[],
): Map<number, string> {
  const slugs = new Map<number, string>();
  const taken = new Set<string>();

  for (const brand of existing) {
    if (brand.sourceRef !== null) {
      slugs.set(brand.sourceRef, brand.slug);
      taken.add(brand.slug);
    }
  }

  for (const brand of [...source].sort((a, b) => a.id - b.id)) {
    if (slugs.has(brand.id)) continue;

    const host = hostOf(brand.sourceUrl);
    const base = slugify(BRAND_CURATION[host]?.name ?? fallbackName(brand.name, host)) || `brand-${brand.id}`;
    const slug = taken.has(base) ? `${base}-${brand.id}` : base;

    slugs.set(brand.id, slug);
    taken.add(slug);
  }

  return slugs;
}

/** The root cause in a line or two — Drizzle wraps driver errors with the full SQL text. */
function describeError(error: unknown): string {
  let current: unknown = error;
  while (current instanceof Error && current.cause instanceof Error) current = current.cause;

  const message = current instanceof Error ? current.message : String(current);
  return message.slice(0, 2000);
}

function maxDate(dates: Date[]): Date | null {
  let max: Date | null = null;
  for (const date of dates) if (!max || date > max) max = date;
  return max;
}
