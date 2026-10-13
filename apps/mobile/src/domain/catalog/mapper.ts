import type {
  Brand,
  BrandDto,
  PieceType,
  Product,
  ProductComponent,
  ProductDto,
  Stitching,
} from './types';

/*
 * Scraped data arrives in each brand's own dialect. Everything that knows
 * about those dialects lives in this file, so screens only ever see clean
 * `Product` values and a new brand means new rules here, nowhere else.
 */

const KNOWN_FABRICS = [
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
  'net',
] as const;

/** "Rs. 5,440" → 5440, "4890" → 4890, "" / null → null. */
export function parsePrice(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }

  // Drop any currency prefix ("Rs.") first, so its dot is not read as a
  // decimal point, then the thousands separators.
  const digits = value.replace(/^[^\d]+/, '').replace(/,/g, '');
  const parsed = Number.parseFloat(digits);

  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : null;
}

function isInStock(availability: string[]): boolean {
  const status = (availability[0] ?? '').trim().toLowerCase();

  return status.length > 0 && !status.includes('out');
}

function toTitleCase(value: string): string {
  return value
    .toLowerCase()
    .replace(/\b([a-z])/g, (letter) => letter.toUpperCase());
}

/**
 * Brands that title products with an article code ("AJCR-04 EMBROIDERED
 * CHIFFON 3 PCS") read better as "Embroidered Chiffon 3 Pcs (AJCR-04)" — the
 * same "Name (CODE)" shape as the design. Some Asim Jofa rows also carry the
 * scraper's "asimjofa-" id prefix in the title.
 */
export function toDisplayName(title: string): string {
  const cleaned = title
    .replace(/^asimjofa-/i, '')
    .replace(/^stitched\s*-\s*/i, '')
    .trim();

  const coded = /^([A-Z]{2,}[A-Z0-9]*-[A-Z0-9.]+)\s+(.+)$/.exec(cleaned);

  if (coded && coded[2] === coded[2].toUpperCase()) {
    return `${toTitleCase(coded[2])} (${coded[1]})`;
  }

  return cleaned;
}

const PIECE_WORDS: Record<string, number> = { one: 1, two: 2, three: 3, four: 4 };

/** "3 Pc", "3 PCS", "2 Piece", "Four Piece" — however a brand spells the count. */
const PIECE_PHRASE = /\b([1-4]|one|two|three|four)\s*-?\s*(pcs|pc|pieces|piece)\b/i;

export function toPieceCount(title: string): number | null {
  const match = PIECE_PHRASE.exec(title);

  if (!match) {
    return null;
  }

  const raw = match[1].toLowerCase();

  return PIECE_WORDS[raw] ?? Number(raw);
}

/** The display name with the piece count taken out — the card shows it on its own line. */
export function toShortName(displayName: string): string {
  const stripped = displayName
    .replace(PIECE_PHRASE, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[\s\-–]+|[\s\-–]+$/g, '')
    .trim();

  // A title that was only a count ("3 Pcs") keeps it rather than going blank.
  return stripped.length > 0 ? stripped : displayName;
}

export function toPieceType(text: string): PieceType {
  if (/\b[3-4]\s*-?\s*(pc|pcs|piece)\b|\b(three|four)\s+piece\b/i.test(text)) {
    return 'threePiece';
  }

  if (/\b2\s*-?\s*(pc|pcs|piece)\b|\btwo\s+piece\b/i.test(text)) {
    return 'twoPiece';
  }

  return 'single';
}

function toStitching(dto: ProductDto): Stitching | null {
  const haystack = [dto.title, dto.details[0] ?? '', dto.link].join(' ');

  if (/un-?stitched/i.test(haystack)) {
    return 'unstitched';
  }

  if (/\bstitched\b/i.test(haystack)) {
    return 'stitched';
  }

  return null;
}

function fabricFromText(text: string): string | null {
  const lower = text.toLowerCase();
  const match = KNOWN_FABRICS.find((fabric) =>
    new RegExp(`\\b${fabric}\\b`).test(lower),
  );

  return match ? toTitleCase(match) : null;
}

type ParsedDetails = {
  description: string | null;
  components: ProductComponent[];
  highlights: string[];
  color: string | null;
  fabric: string | null;
};

const SECTION_MARKER = /^([A-Za-z][A-Za-z &]*?)\s*:\s*:\s*$/;
const KEY_VALUE = /^([A-Za-z][A-Za-z ]*?)\s*:\s*(.+)$/;
const STITCHING_LINE = /^(un-?)?stitched\b/i;
const PROSE_MARKER = /^(design details|this design includes)\s*:?$/i;

/** Every word of `line` already appears in `title` — it adds nothing. */
function repeatsTitle(line: string, title: string): boolean {
  const titleWords = new Set(title.toLowerCase().split(/\W+/));

  return line
    .toLowerCase()
    .split(/\W+/)
    .filter(Boolean)
    .every((word) => titleWords.has(word));
}

/**
 * Asim Jofa style: one paragraph that the scraper split on commas, with
 * newlines separating the story from the itemised "DESIGN DETAILS".
 */
function parseProseDetails(details: string[]): ParsedDetails {
  const lines = details
    .join(',')
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  const markerIndex = lines.findIndex((line) => PROSE_MARKER.test(line));
  const story = markerIndex === -1 ? lines : lines.slice(0, markerIndex);
  const items = markerIndex === -1 ? [] : lines.slice(markerIndex + 1);

  return {
    description: story.length > 0 ? story.join(' ') : null,
    components: [],
    highlights: items.map((item) => item.charAt(0).toUpperCase() + item.slice(1)),
    color: null,
    fabric: null,
  };
}

/**
 * Alkaram style: one fact per line, with "Shirt::" markers opening a section
 * and a trailing legal disclaimer.
 */
function parseLineDetails(details: string[], title: string): ParsedDetails {
  // A leading space means the scraper split a sentence on a comma.
  const lines: string[] = [];

  for (const raw of details) {
    if (/^\s/.test(raw) && lines.length > 0) {
      lines[lines.length - 1] += `,${raw}`;
    } else {
      lines.push(raw.trim());
    }
  }

  const disclaimerIndex = lines.findIndex((line) => /^disclaimer\b/i.test(line));
  const meaningful = disclaimerIndex === -1 ? lines : lines.slice(0, disclaimerIndex);

  const components: ProductComponent[] = [];
  const highlights: string[] = [];
  let description: string | null = null;
  let color: string | null = null;
  let fabric: string | null = null;
  let current: ProductComponent | null = null;

  for (const line of meaningful) {
    if (!line) {
      continue;
    }

    const section = SECTION_MARKER.exec(line);

    if (section) {
      current = { label: section[1].trim(), lines: [] };
      components.push(current);
      continue;
    }

    const pair = KEY_VALUE.exec(line);

    if (pair) {
      const key = pair[1].trim().toLowerCase();
      const value = pair[2].trim();

      if (key === 'color' || key === 'colour') {
        color = value;
        continue;
      }

      if (key === 'fabric' && !fabric) {
        fabric = value;
      }

      if (current) {
        current.lines.push(`${pair[1].trim()}: ${value}`);
      } else {
        highlights.push(`${pair[1].trim()}: ${value}`);
      }

      continue;
    }

    if (current) {
      current.lines.push(line);
      continue;
    }

    if (STITCHING_LINE.test(line) || repeatsTitle(line, title)) {
      continue;
    }

    // Sentences are marketing copy; short phrases are facts.
    if (line.length > 60 && !description) {
      description = line;
    } else {
      highlights.push(line);
    }
  }

  return {
    description,
    components: components.filter((component) => component.lines.length > 0),
    highlights,
    color,
    fabric,
  };
}

function parseDetails(dto: ProductDto): ParsedDetails {
  const isProse = dto.details.some((detail) => detail.includes('\n'));

  return isProse
    ? parseProseDetails(dto.details)
    : parseLineDetails(dto.details, dto.title);
}

export function mapProduct(dto: ProductDto): Product {
  const price = parsePrice(dto.price) ?? 0;
  const oldPrice = parsePrice(dto.oldPrice);
  const compareAtPrice = oldPrice !== null && oldPrice > price ? oldPrice : null;

  const details = parseDetails(dto);

  return {
    id: dto.productId,
    brandId: String(dto.brand.brandId),
    brandName: dto.brand.name,

    name: toDisplayName(dto.title),
    shortName: toShortName(toDisplayName(dto.title)),
    title: dto.title.replace(/^asimjofa-/i, '').trim(),

    images: dto.images.filter(Boolean),

    price,
    compareAtPrice,
    discountPercent: compareAtPrice
      ? Math.round((1 - price / compareAtPrice) * 100)
      : null,

    inStock: isInStock(dto.availability),
    link: dto.link,
    sku: dto.sku,

    pieceType: toPieceType(`${dto.title} ${dto.details[0] ?? ''}`),
    pieceCount: toPieceCount(dto.title),
    stitching: toStitching(dto),
    color: details.color ?? dto.colors?.[0] ?? null,
    fabric: details.fabric ?? fabricFromText(dto.title),
    sizes: (dto.size ?? []).filter(Boolean),

    description: details.description,
    components: details.components,
    highlights: details.highlights,

    createdAt: dto.createdAt,
  };
}

/**
 * No endpoint returns brand summaries yet, so the count and cover photo are
 * passed in by whoever has the brand's products (today, the mock server).
 */
export function mapBrand(
  dto: BrandDto,
  summary: { productCount: number; coverImage: string | null },
): Brand {
  return {
    id: String(dto.brandId),
    name: dto.name.trim(),
    website: dto.website,
    logo: dto.logo,
    productCount: summary.productCount,
    coverImage: summary.coverImage,
  };
}
