import type { Audience, BrandAudience, Category } from '../../db/schema/index.js';
import { toSearchable } from './text.js';

/*
 * Who a product is for and what kind of product it is. The scraper has
 * neither field: brands put it in `type`, tags, titles or the URL, each in
 * their own words (3,000+ distinct `type` values). See docs/scraper-data.md.
 *
 * Structured fields (type, tags) are trusted before free text (title, URL
 * handle), because titles mention other audiences in passing ("for her
 * daughter", "Mommy & Me").
 */

export type ProductText = {
  type: string | null;
  tags: readonly string[];
  title: string;
  /** The product URL's last segment, e.g. "ajmrw-19-premium-blended-stitched-2pc". */
  handle: string;
};

/* ------------------------------------------------------------------------ */
/*  Audience                                                                */
/* ------------------------------------------------------------------------ */

// Age ranges arrive as "5-6Y", "5 - 6 years", "9 to 12 months"; `toSearchable` has turned dashes into spaces.
const KIDS =
  /\b(?:kids?|boys?|girls?|baby|babies|infants?|toddlers?|juniors?|teens?|newborns?|\d+\s+(?:to\s+)?\d+\s*(?:y|yrs?|years?|months?))\b/;
const MEN = /\b(?:men|mens|men's|man|male|gents?|menswear|him)\b/;
const WOMEN = /\b(?:women|womens|women's|woman|ladies|lady|female|womenswear|her)\b/;
const UNISEX = /\bunisex\b/;

/** Garments sold almost only to women in Pakistan; used when nothing says otherwise. */
const WOMEN_GARMENTS =
  /\b(?:dupatta|kurti|lawn|saree|sari|lehenga|lehnga|abaya|hijab|pret|maxi|gown|frock|peshwas|gharara|sharara|palazzo|culottes?|chiffon|organza|bridal|blouse|kaftan|capri|tights?|dress(?:es)?(?!\s+(?:shirts?|pants?|trousers?|shoes?)))\b/;

function audienceSignals(text: string): Set<Exclude<Audience, 'unknown'>> {
  const found = new Set<Exclude<Audience, 'unknown'>>();

  if (UNISEX.test(text)) found.add('unisex');
  if (WOMEN.test(text)) found.add('women');
  if (MEN.test(text)) found.add('men');
  if (KIDS.test(text)) found.add('kids');

  return found;
}

function resolve(signals: Set<Exclude<Audience, 'unknown'>>): Audience | null {
  if (signals.has('unisex')) return 'unisex';
  if (signals.size === 1) return [...signals][0]!;
  if (signals.size === 2 && signals.has('women') && signals.has('men')) return 'unisex';

  // Kids plus an adult audience ("Mommy & Me", "girls' and women's"): undecided here.
  return null;
}

/**
 * The product's own audience, or `unknown` when nothing in its text says.
 * Callers fall back to the brand's audience for `unknown`.
 *
 * A garment word alone ("dress", "lawn") only implies women when the brand
 * is not a menswear or kidswear brand.
 */
export function classifyAudience(product: ProductText, brandAudience: BrandAudience = 'mixed'): Audience {
  const structured = toSearchable(product.type, product.tags.join(' | '));
  const free = toSearchable(product.title, product.handle);

  const fromStructured = resolve(audienceSignals(structured));
  if (fromStructured) return fromStructured;

  const fromFree = resolve(audienceSignals(free));
  if (fromFree) return fromFree;

  const all = audienceSignals(`${structured} | ${free}`);
  if (all.has('kids')) return 'kids';

  if (brandAudience !== 'men' && brandAudience !== 'kids' && WOMEN_GARMENTS.test(`${structured} | ${free}`)) {
    return 'women';
  }

  return 'unknown';
}

/** The audience the app uses: the product's own, or the brand's when the product says nothing. */
export function effectiveAudience(product: Audience, brand: BrandAudience): Audience {
  if (product !== 'unknown') return product;

  return brand === 'mixed' ? 'unknown' : brand;
}

/* ------------------------------------------------------------------------ */
/*  Category                                                                */
/* ------------------------------------------------------------------------ */

/**
 * First match wins, most specific first. Patterns avoid words that are also
 * clothing details or colours: "cream", "tie-dye", "cap sleeves", "belted".
 */
const CATEGORY_RULES: [Category, RegExp][] = [
  ['fragrance', /\b(?:perfumes?|fragrances?|attars?|body mists?|edp|edt|eau de)\b/],
  ['beauty', /\b(?:make ?up|lipsticks?|skin ?care|cosmetics?|nail polish|serums?|lotions?)\b/],
  [
    'home',
    /\b(?:bed ?sheets?|cushions?|towels?|curtains?|duvets?|quilts?|comforters?|home d[eé]cor|kitchen|bedding|ideas home|home)\b/,
  ],
  [
    'footwear',
    /\b(?:shoes?|sandals?|slippers?|heels|khussas?|kolhapuris?|sneakers?|chappals?|pumps|loafers?|mules|flats|footwear|slides)\b/,
  ],
  ['bags', /\b(?:bags?|clutch(?:es)?|wallets?|purses?|totes?|backpacks?|pouch(?:es)?|cross body)\b/],
  [
    'jewelry',
    /\b(?:jewell?(?:er)?y|earrings?|necklaces?|bangles?|bracelets?|rings?|anklets?|pendants?|chokers?|jhumkas?)\b/,
  ],
  ['accessories', /\b(?:accessor(?:y|ies)|belts?|scarf|scarves|stoles?|socks|sunglasses|watch(?:es)?|hair (?:bands?|clips?|accessories))\b/],
  ['unstitched', /\b(?:unstitched|un stitched)\b/],
];

function categoryOf(text: string): Category | null {
  for (const [category, pattern] of CATEGORY_RULES) {
    if (pattern.test(text)) return category;
  }

  return null;
}

export function classifyCategory(product: ProductText): Category {
  return (
    categoryOf(toSearchable(product.type, product.tags.join(' | '))) ??
    categoryOf(toSearchable(product.title, product.handle)) ??
    'clothing'
  );
}

/* ------------------------------------------------------------------------ */
/*  Brand audience                                                          */
/* ------------------------------------------------------------------------ */

/**
 * A brand's audience from its products' own signals: at least 90% of the
 * products that say who they are for, and enough of them to trust.
 */
export function brandAudienceFromCounts(
  counts: Partial<Record<Audience, number>>,
  minimumLabelled = 20,
): BrandAudience {
  const women = counts.women ?? 0;
  const men = counts.men ?? 0;
  const kids = counts.kids ?? 0;
  const labelled = women + men + kids + (counts.unisex ?? 0);

  if (labelled < minimumLabelled) return 'mixed';
  if (women / labelled >= 0.9) return 'women';
  if (men / labelled >= 0.9) return 'men';
  if (kids / labelled >= 0.9) return 'kids';

  return 'mixed';
}
