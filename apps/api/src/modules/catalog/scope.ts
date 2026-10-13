import { and, eq, inArray, isNull, or, type SQL, sql } from 'drizzle-orm';

import type { Database } from '../../db/client.js';
import { brands, type Category, products } from '../../db/schema/index.js';

/*
 * What the app shows today: women's clothing (stitched and unstitched) from
 * active brands, not retired.
 *
 * The rule lives here once. The ingest job evaluates it after every run and
 * stores the result in `products.listed`; every catalogue query and every
 * cached brand count filters on that column. So a count on a brand card
 * always matches the list behind it, and lists stay fast across brands.
 *
 * Widening the scope (accessories, kids) is a change here plus one ingest
 * run, not a re-import: the catalogue keeps every product with its audience
 * and category.
 */

export const SCOPE_CATEGORIES: Category[] = ['clothing', 'unstitched'];

/** A product's own audience is women, or it has none and its brand is a women's brand. */
const isForWomen: SQL = or(
  eq(products.audience, 'women'),
  and(eq(products.audience, 'unknown'), eq(brands.audience, 'women')),
)!;

/** The scope rule. Needs `brands` joined on `products.brandId`; used by the ingest job. */
export const scopeRule: SQL = and(
  eq(brands.status, 'active'),
  isNull(products.retiredAt),
  inArray(products.category, SCOPE_CATEGORIES),
  isForWomen,
)!;

/** What list queries filter on: the stored result of `scopeRule`. */
export const isListed: SQL = eq(products.listed, true);

/** Stores `scopeRule` in `products.listed` for every product. Run after brands or products change. */
export async function refreshListed(db: Database): Promise<void> {
  await db.execute(
    sql`update ${products} inner join ${brands} on ${brands.id} = ${products.brandId}
        set ${products.listed} = (${scopeRule})`,
  );
}
