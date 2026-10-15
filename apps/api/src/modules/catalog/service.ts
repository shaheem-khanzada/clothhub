import type {
  BrandResponse,
  PieceType,
  ProductListQuery,
  ProductPageResponse,
  ProductResponse,
  ProductSort,
} from '@clothhub/shared';
import { and, asc, desc, eq, gt, inArray, isNotNull, lte, gte, type SQL, sql } from 'drizzle-orm';

import type { Database } from '../../db/client.js';
import { brands, productImages, products, productVariants } from '../../db/schema/index.js';
import { isListed } from './scope.js';
import { parseSearch, searchCondition, searchRelevance } from './search.js';

/*
 * Catalogue reads. Every list query filters on `isListed` (the app's scope,
 * stored by the ingest job), so counts, facets and pages always describe the
 * same set of products, and each sort is served by an index.
 */

const productColumns = {
  id: products.id,
  name: products.name,
  shortName: products.shortName,
  title: products.title,
  sku: products.sku,
  description: products.description,
  components: products.components,
  highlights: products.highlights,
  category: products.category,
  pieceType: products.pieceType,
  pieceCount: products.pieceCount,
  stitching: products.stitching,
  fabric: products.fabric,
  color: products.color,
  colorFamilies: products.colorFamilies,
  priceMinor: products.priceMinor,
  priceMaxMinor: products.priceMaxMinor,
  compareAtMinor: products.compareAtMinor,
  discountPercent: products.discountPercent,
  currency: products.currency,
  inStock: products.inStock,
  retiredAt: products.retiredAt,
  sourceUrl: products.sourceUrl,
  firstSeenAt: products.firstSeenAt,
  brandId: brands.id,
  brandSlug: brands.slug,
  brandName: brands.name,
};

function selectProducts(db: Database) {
  return db.select(productColumns).from(products).innerJoin(brands, eq(brands.id, products.brandId));
}

type ProductRow = Awaited<ReturnType<typeof selectProducts>>[number];

function groupBy<T, K>(items: T[], key: (item: T) => K): Map<K, T[]> {
  const groups = new Map<K, T[]>();
  for (const item of items) {
    const k = key(item);
    const group = groups.get(k);
    if (group) group.push(item);
    else groups.set(k, [item]);
  }
  return groups;
}

/** Minor units → whole rupees. */
function toMajor(minor: number): number {
  return Math.round(minor / 100);
}

function orderFor(sort: ProductSort, relevance: SQL | null): SQL[] {
  switch (sort) {
    // Tie-breakers run the same direction as the sort, so one index serves both.
    case 'priceAsc':
      return [asc(products.priceMinor), asc(products.id)];
    case 'priceDesc':
      return [desc(products.priceMinor), desc(products.id)];
    case 'newest':
      return [desc(products.firstSeenAt), desc(products.id)];
    case 'oldest':
      return [asc(products.firstSeenAt), asc(products.id)];
    case 'featured':
      // What can be bought first; with a search, the best matches lead.
      return [
        ...(relevance ? [sql`${relevance} desc`] : []),
        desc(products.inStock),
        desc(products.firstSeenAt),
        desc(products.id),
      ];
  }
}

export class CatalogService {
  constructor(private readonly db: Database) {}

  /* ---------------------------------------------------------------------- */
  /*  Brands                                                                */
  /* ---------------------------------------------------------------------- */

  private readonly brandColumns = {
    id: brands.id,
    slug: brands.slug,
    name: brands.name,
    website: brands.website,
    logoUrl: brands.logoUrl,
    productCount: brands.productCount,
    inStockCount: brands.inStockCount,
    coverImageUrl: brands.coverImageUrl,
  };

  /** Brands with something to show, most in-stock products first. */
  async listBrands(): Promise<BrandResponse[]> {
    return this.db
      .select(this.brandColumns)
      .from(brands)
      .where(and(eq(brands.status, 'active'), gt(brands.productCount, 0)))
      .orderBy(desc(brands.inStockCount), desc(brands.productCount), asc(brands.name));
  }

  async getBrand(brandId: string): Promise<BrandResponse | null> {
    const [brand] = await this.db
      .select(this.brandColumns)
      .from(brands)
      .where(and(eq(brands.id, brandId), eq(brands.status, 'active')))
      .limit(1);

    return brand ?? null;
  }

  /* ---------------------------------------------------------------------- */
  /*  Products                                                              */
  /* ---------------------------------------------------------------------- */

  async listProducts(query: ProductListQuery): Promise<ProductPageResponse> {
    const scope: SQL[] = [isListed];
    if (query.brandId) scope.push(eq(products.brandId, query.brandId));

    const filters: SQL[] = [];
    if (query.inStock) filters.push(eq(products.inStock, true));
    if (query.onSale) filters.push(isNotNull(products.compareAtMinor));
    if (query.pieceType) filters.push(eq(products.pieceType, query.pieceType));
    if (query.minPrice !== undefined) filters.push(gte(products.priceMinor, query.minPrice * 100));
    if (query.maxPrice !== undefined) filters.push(lte(products.priceMinor, query.maxPrice * 100));

    const terms = query.q ? parseSearch(query.q) : null;
    const search = terms ? searchCondition(terms) : null;
    if (search) filters.push(search);

    const where = and(...scope, ...filters);
    const offset = (query.page - 1) * query.limit;

    // The page is picked from the index alone, then only its rows are loaded:
    // sorting full rows (descriptions, JSON) across the catalogue is what is slow.
    const [facets, [{ total } = { total: 0 }], page] = await Promise.all([
      this.facets(and(...scope)!),
      this.db.select({ total: sql<number>`count(*)` }).from(products).where(where),
      this.db
        .select({ id: products.id })
        .from(products)
        .where(where)
        .orderBy(...orderFor(query.sort, terms ? searchRelevance(terms) : null))
        .limit(query.limit)
        .offset(offset),
    ]);

    const ids = page.map((row) => row.id);
    const rows = ids.length > 0 ? await selectProducts(this.db).where(inArray(products.id, ids)) : [];
    const position = new Map(ids.map((id, index) => [id, index]));
    rows.sort((a, b) => position.get(a.id)! - position.get(b.id)!);

    return {
      products: await this.hydrate(rows),
      page: query.page,
      limit: query.limit,
      total: Number(total),
      facets,
    };
  }

  async getProduct(productId: string): Promise<ProductResponse | null> {
    const [row] = await selectProducts(this.db)
      .where(and(eq(products.id, productId), eq(brands.status, 'active')))
      .limit(1);

    if (!row) return null;

    const [product] = await this.hydrate([row]);

    return product ?? null;
  }

  /** Price range and piece types across the scope, independent of the filters applied. */
  private async facets(scope: SQL): Promise<ProductPageResponse['facets']> {
    const [[range], types] = await Promise.all([
      this.db
        .select({
          min: sql<number | null>`min(${products.priceMinor})`,
          max: sql<number | null>`max(${products.priceMinor})`,
        })
        .from(products)
        .where(scope),
      this.db.selectDistinct({ pieceType: products.pieceType }).from(products).where(scope),
    ]);

    const order: PieceType[] = ['threePiece', 'twoPiece', 'single'];
    const present = new Set(types.map((row) => row.pieceType));

    return {
      minPrice: range?.min === null || range?.min === undefined ? 0 : Math.floor(Number(range.min) / 100),
      maxPrice: range?.max === null || range?.max === undefined ? 0 : Math.ceil(Number(range.max) / 100),
      pieceTypes: order.filter((type) => present.has(type)),
    };
  }

  /** Adds images and sizes to product rows, keeping the rows' order. */
  private async hydrate(rows: ProductRow[]): Promise<ProductResponse[]> {
    if (rows.length === 0) return [];

    const ids = rows.map((row) => row.id);

    const [images, variants] = await Promise.all([
      this.db
        .select({
          productId: productImages.productId,
          url: productImages.url,
          width: productImages.width,
          height: productImages.height,
          thumbhash: productImages.thumbhash,
        })
        .from(productImages)
        .where(inArray(productImages.productId, ids))
        .orderBy(asc(productImages.productId), asc(productImages.position)),
      this.db
        .select({
          productId: productVariants.productId,
          size: productVariants.size,
          available: productVariants.available,
        })
        .from(productVariants)
        .where(inArray(productVariants.productId, ids))
        .orderBy(asc(productVariants.productId), asc(productVariants.position)),
    ]);

    const imagesByProduct = groupBy(images, (image) => image.productId);
    const variantsByProduct = groupBy(variants, (variant) => variant.productId);

    return rows.map((row) => {
      const sizes = new Map<string, boolean>();
      for (const variant of variantsByProduct.get(row.id) ?? []) {
        if (variant.size) sizes.set(variant.size, (sizes.get(variant.size) ?? false) || variant.available);
      }

      const price = toMajor(row.priceMinor);
      const compareAt = row.compareAtMinor === null ? null : toMajor(row.compareAtMinor);

      return {
        id: row.id,
        brand: { id: row.brandId, slug: row.brandSlug, name: row.brandName },
        name: row.name,
        shortName: row.shortName,
        title: row.title,
        sku: row.sku,
        images: (imagesByProduct.get(row.id) ?? []).map((image) => ({
          url: image.url,
          width: image.width,
          height: image.height,
          thumbhash: image.thumbhash,
        })),
        price,
        priceMax: Math.max(price, toMajor(row.priceMaxMinor)),
        compareAtPrice: compareAt !== null && compareAt > price ? compareAt : null,
        discountPercent: compareAt !== null && compareAt > price ? row.discountPercent : null,
        currency: row.currency,
        inStock: row.inStock,
        isRetired: row.retiredAt !== null,
        url: row.sourceUrl,
        category: row.category,
        pieceType: row.pieceType,
        pieceCount: row.pieceCount,
        stitching: row.stitching,
        fabric: row.fabric,
        color: row.color,
        colors: row.colorFamilies,
        sizes: [...sizes].map(([label, inStock]) => ({ label, inStock })),
        description: row.description,
        components: row.components,
        highlights: row.highlights,
        firstSeenAt: row.firstSeenAt.toISOString(),
      };
    });
  }
}
