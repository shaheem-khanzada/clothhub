import { like, or, type SQL, sql } from 'drizzle-orm';

import { products } from '../../db/schema/index.js';

/*
 * Product search on MySQL's FULLTEXT index (name, title, search_text).
 *
 * InnoDB ignores words shorter than 3 characters and a list of stopwords, so
 * those are matched with LIKE on the name instead; everything else becomes a
 * required prefix term ("lawn kurta" → "+lawn* +kurta*").
 */

const MIN_FULLTEXT_LENGTH = 3;

/** InnoDB's default full-text stopword list. */
const STOPWORDS = new Set([
  'a', 'about', 'an', 'are', 'as', 'at', 'be', 'by', 'com', 'de', 'en', 'for', 'from', 'how', 'i', 'in',
  'is', 'it', 'la', 'of', 'on', 'or', 'that', 'the', 'this', 'to', 'was', 'what', 'when', 'where', 'who',
  'will', 'with', 'und', 'www',
]);

export type SearchTerms = {
  /** Boolean-mode expression for MATCH … AGAINST, or null when no word qualifies. */
  fulltext: string | null;
  /** Short words, matched with LIKE. */
  short: string[];
};

export function parseSearch(query: string): SearchTerms {
  const words = query
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
    .slice(0, 8);

  const long = words.filter((word) => word.length >= MIN_FULLTEXT_LENGTH && !STOPWORDS.has(word));
  const short = words.filter((word) => word.length < MIN_FULLTEXT_LENGTH && !STOPWORDS.has(word));

  return {
    fulltext: long.length > 0 ? long.map((word) => `+${word}*`).join(' ') : null,
    short,
  };
}

const MATCH_COLUMNS = sql`${products.name}, ${products.title}, ${products.searchText}`;

/** The WHERE condition for a search, or null when the query has no usable words. */
export function searchCondition(terms: SearchTerms): SQL | null {
  const conditions: SQL[] = [];

  if (terms.fulltext) {
    conditions.push(sql`match(${MATCH_COLUMNS}) against (${terms.fulltext} in boolean mode)`);
  }

  for (const word of terms.short) {
    conditions.push(or(like(products.name, `%${word}%`), like(products.sku, `%${word}%`))!);
  }

  if (conditions.length === 0) return null;

  return sql.join(conditions, sql` and `);
}

/** Relevance score for ordering search results; null when there is no full-text part. */
export function searchRelevance(terms: SearchTerms): SQL | null {
  return terms.fulltext ? sql`match(${MATCH_COLUMNS}) against (${terms.fulltext} in boolean mode)` : null;
}
