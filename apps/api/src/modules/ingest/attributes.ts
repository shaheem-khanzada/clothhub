import { toSearchable, toTitleCase } from './text.js';

/*
 * Product attributes derived from text: piece count, stitching, fabric,
 * colour family, normalised sizes and display names. Pure functions, so every
 * rule is unit-tested with real titles from the scraper.
 */

/* ------------------------------------------------------------------------ */
/*  Pieces                                                                  */
/* ------------------------------------------------------------------------ */

const PIECE_WORDS: Record<string, number> = { one: 1, two: 2, three: 3, four: 4 };

/** "3 Pc", "3PCS", "2-Piece", "Four Piece", "01 Piece" — however a brand spells it. */
const PIECE_PHRASE = /\b0?([1-4]|one|two|three|four)\s*-?\s*(pcs|pc|pieces|piece)\b/i;

export function pieceCountFrom(...texts: (string | null | undefined)[]): number | null {
  for (const text of texts) {
    if (!text) continue;

    const match = PIECE_PHRASE.exec(text);
    if (match) {
      const raw = match[1]!.toLowerCase();
      return PIECE_WORDS[raw] ?? Number(raw);
    }
  }

  return null;
}

export type PieceType = 'threePiece' | 'twoPiece' | 'single';

export function pieceTypeOf(pieceCount: number | null): PieceType {
  if (pieceCount !== null && pieceCount >= 3) return 'threePiece';
  if (pieceCount === 2) return 'twoPiece';

  return 'single';
}

/* ------------------------------------------------------------------------ */
/*  Stitching                                                               */
/* ------------------------------------------------------------------------ */

export function stitchingFrom(text: string): 'stitched' | 'unstitched' | null {
  const searchable = toSearchable(text);

  if (/\b(?:unstitched|un stitched)\b/.test(searchable)) return 'unstitched';
  if (/\b(?:stitched|pret|ready to wear|rtw)\b/.test(searchable)) return 'stitched';

  return null;
}

/* ------------------------------------------------------------------------ */
/*  Fabric                                                                  */
/* ------------------------------------------------------------------------ */

/** Ordered so compound fabrics win over their parts ("raw silk" before "silk"). */
const FABRICS = [
  'raw silk',
  'khaddar',
  'karandi',
  'cambric',
  'chiffon',
  'organza',
  'jacquard',
  'velvet',
  'linen',
  'lawn',
  'silk',
  'cotton',
  'dobby',
  'marina',
  'viscose',
  'georgette',
  'crepe',
  'denim',
  'slub',
  'poplin',
  'voile',
  'net',
  'wool',
  'banarsi',
  'cottel',
  'grip',
  'leather',
] as const;

export function fabricFrom(...texts: (string | null | undefined)[]): string | null {
  for (const text of texts) {
    if (!text) continue;

    const searchable = toSearchable(text);
    const match = FABRICS.find((fabric) => new RegExp(`\\b${fabric}\\b`).test(searchable));

    if (match) return toTitleCase(match);
  }

  return null;
}

/* ------------------------------------------------------------------------ */
/*  Colour families                                                         */
/* ------------------------------------------------------------------------ */

/**
 * About 3,400 distinct colour names reduce to these families for filtering.
 * First match wins, so specific names come before the generic ones they
 * contain ("off white" before "white", "rose gold" before "gold").
 */
const COLOR_FAMILIES: [string, RegExp][] = [
  ['multi', /\b(?:multi|multicolou?r|assorted|printed)\b/],
  ['beige', /\b(?:off ?white|beige|cream|ivory|nude|skin|fawn|sand|ecru|khaki|champagne|bone|stone)\b/],
  ['white', /\bwhite\b/],
  ['black', /\b(?:black|jet)\b/],
  ['grey', /\b(?:grey|gray|charcoal|ash|silver grey|slate)\b/],
  ['brown', /\b(?:brown|camel|tan|coffee|chocolate|mocha|rust|copper|bronze|caramel|taupe)\b/],
  ['red', /\b(?:red|maroon|burgundy|wine|crimson|cherry|scarlet)\b/],
  ['pink', /\b(?:pink|peach|rose|fuchsia|magenta|blush|coral|salmon|tea pink)\b/],
  ['orange', /\b(?:orange|tangerine|apricot)\b/],
  ['yellow', /\b(?:yellow|mustard|lemon|ochre|haldi)\b/],
  ['green', /\b(?:green|olive|mint|sage|emerald|bottle|pista|pistachio|lime|teal green|sea green|moss)\b/],
  ['blue', /\b(?:blue|navy|sky|teal|turquoise|aqua|ferozi|firozi|royal|indigo|cyan|denim|cobalt|powder)\b/],
  ['purple', /\b(?:purple|lilac|lavender|plum|mauve|violet|grape|orchid)\b/],
  ['gold', /\b(?:gold|golden)\b/],
  ['silver', /\bsilver\b/],
];

export function colorFamilyOf(color: string | null | undefined): string | null {
  if (!color) return null;

  const searchable = toSearchable(color);
  const match = COLOR_FAMILIES.find(([, pattern]) => pattern.test(searchable));

  return match ? match[0] : null;
}

/* ------------------------------------------------------------------------ */
/*  Sizes                                                                   */
/* ------------------------------------------------------------------------ */

const NAMED_SIZES: Record<string, string> = {
  'xx small': 'XXS',
  xxs: 'XXS',
  'extra small': 'XS',
  'x small': 'XS',
  xsmall: 'XS',
  xs: 'XS',
  small: 'S',
  s: 'S',
  medium: 'M',
  m: 'M',
  ml: 'M/L',
  'm l': 'M/L',
  large: 'L',
  l: 'L',
  'extra large': 'XL',
  'x large': 'XL',
  xlarge: 'XL',
  xl: 'XL',
  'xx large': 'XXL',
  xxl: 'XXL',
  '2xl': 'XXL',
  'xxx large': '3XL',
  xxxl: '3XL',
  '3xl': '3XL',
  'free size': 'Free size',
  'one size': 'Free size',
};

/**
 * "Medium" → "M", "05-06Y" / "5-6 Y" / "5-6 years" → "5-6Y", "36" → "36".
 * Returns null for labels that are not sizes ("UNSTITCHED", "Default Title").
 */
export function normalizeSize(label: string | null | undefined): string | null {
  if (!label) return null;

  const raw = label.trim();
  const key = raw.toLowerCase().replace(/[-_.]+/g, ' ').replace(/\s+/g, ' ').trim();

  if (!key || /^(?:unstitched|un stitched|default title|default|n\/?a)$/.test(key)) return null;

  const named = NAMED_SIZES[key];
  if (named) return named;

  const ageRange = /^0?(\d{1,2})\s*(?:to|\s)\s*0?(\d{1,2})\s*(y|yrs?|years?|m|months?)$/.exec(key);
  if (ageRange) {
    const unit = ageRange[3]!.startsWith('m') ? 'M' : 'Y';
    return `${Number(ageRange[1])}-${Number(ageRange[2])}${unit}`;
  }

  const singleAge = /^0?(\d{1,2})\s*(y|yrs?|years?)$/.exec(key);
  if (singleAge) return `${Number(singleAge[1])}Y`;

  if (/^\d{1,3}$/.test(key)) return key;

  // Anything else (shoe sizes like "EU 38", "30ml") is kept as the brand wrote it.
  return raw.length <= 40 ? raw : null;
}

/* ------------------------------------------------------------------------ */
/*  Names                                                                   */
/* ------------------------------------------------------------------------ */

/**
 * Brands that title products with an article code ("AJCR-04 EMBROIDERED
 * CHIFFON 3 PCS") read better as "Embroidered Chiffon 3 Pcs (AJCR-04)".
 * Shouting titles are title-cased.
 */
export function displayNameFrom(title: string): string {
  const cleaned = title
    .replace(/^asimjofa-/i, '')
    .replace(/^stitched\s*-\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  const coded = /^([A-Z]{2,}[A-Z0-9]*-[A-Z0-9.]+)\s+(.+)$/.exec(cleaned);

  if (coded && coded[2] === coded[2]!.toUpperCase()) {
    return `${toTitleCase(coded[2]!)} (${coded[1]})`;
  }

  if (cleaned === cleaned.toUpperCase() && /[A-Z]{3,}/.test(cleaned)) {
    return toTitleCase(cleaned);
  }

  return cleaned;
}

/** The display name without its piece count; a name that was only a count keeps it. */
export function shortNameFrom(displayName: string): string {
  const stripped = displayName
    .replace(PIECE_PHRASE, '')
    .replace(/\(\s*\)/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[\s\-–|]+|[\s\-–|]+$/g, '')
    .trim();

  return stripped.length > 0 ? stripped : displayName;
}

/**
 * The brand's article code: the product URL handle when it looks like a code
 * ("u4807st-2pc-419", "gwt2102"), otherwise the first variant SKU.
 */
export function skuFrom(handle: string, variantSku: string | null | undefined): string | null {
  const sku = variantSku?.trim();
  if (sku) {
    // Variant SKUs end with the size ("AJMRW-19-XS"); the product code is the rest.
    return sku.replace(/[-_](?:xxs|xs|s|m|l|xl|xxl|\d{1,2}(?:-\d{1,2})?y?)$/i, '') || sku;
  }

  return /\d/.test(handle) && handle.length <= 40 ? handle : null;
}
