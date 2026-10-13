import { repairReplacementChars, squash } from './text.js';

/*
 * Brands write product descriptions as a mix of marketing copy, "Key: value"
 * facts, "Shirt / Trouser / Dupatta" sections and a legal disclaimer. This
 * splits one into what the product sheet shows.
 *
 * Example (Saya):
 *   Design: SP-12875 (P16-25189-05BA 2Pcs) S+T     → dropped (the SKU is shown already)
 *   Color: Green                                   → color
 *   Fabric: Lawn                                   → fabric
 *   Product Detail                                 → marker, dropped
 *   Elevate Your Daily Summer Wardrobe …           → description
 *   Shirt / Ready To Wear Lawn Stitched Shirt.     → component "Shirt"
 *   Disclaimer: These Images Are …                 → dropped, with everything after it
 */

export type ParsedDescription = {
  description: string | null;
  components: { label: string; lines: string[] }[];
  highlights: string[];
  color: string | null;
  fabric: string | null;
};

const MAX_HIGHLIGHTS = 12;
const MAX_COMPONENT_LINES = 8;

const MARKER =
  /^(?:product\s+(?:details?|description|info(?:rmation)?)|description|details|design details|key features|features?|this design includes|specifications?)\s*:?$/i;

const COMPONENT =
  /^(shirt|dupatta|trousers?|pants?|shalwar|kameez|tops?|bottoms?|sleeves?|front|back|lining|cape|jacket|shawl|kurta|inner|slip|stole|scarf|palazzo|gharara|sharara|lehenga|blouse|skirt)\s*:{0,2}$/i;

const KEY_VALUE = /^([A-Za-z][A-Za-z ]{0,24}?)\s*:\s*(.+)$/;

const DROPPED_KEYS = new Set([
  'design',
  'design no',
  'design code',
  'article',
  'article no',
  'article code',
  'code',
  'sku',
  'product code',
]);

const PROSE_MIN_LENGTH = 60;

function wordsOf(value: string): string[] {
  return value.toLowerCase().split(/\W+/).filter(Boolean);
}

/** Every word of `line` already appears in the title — it adds nothing. */
function repeatsTitle(line: string, title: string): boolean {
  const titleWords = new Set(wordsOf(title));
  const words = wordsOf(line);

  return words.length > 0 && words.every((word) => titleWords.has(word));
}

function capitalise(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function parseDescription(raw: string | null | undefined, title: string): ParsedDescription {
  const result: ParsedDescription = {
    description: null,
    components: [],
    highlights: [],
    color: null,
    fabric: null,
  };

  if (!raw || !raw.trim()) return result;

  const lines = repairReplacementChars(raw)
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map(squash)
    .filter(Boolean);

  const disclaimer = lines.findIndex((line) => /^disclaimer\b/i.test(line));
  const meaningful = disclaimer === -1 ? lines : lines.slice(0, disclaimer);

  // One line of copy is the description, however short.
  if (meaningful.length === 1 && !KEY_VALUE.test(meaningful[0]!)) {
    result.description = meaningful[0]!;
    return result;
  }

  const prose: string[] = [];
  let component: ParsedDescription['components'][number] | null = null;

  for (const line of meaningful) {
    if (MARKER.test(line)) {
      component = null;
      continue;
    }

    const section = COMPONENT.exec(line);
    if (section) {
      component = { label: capitalise(section[1]!.toLowerCase()), lines: [] };
      result.components.push(component);
      continue;
    }

    const pair = KEY_VALUE.exec(line);
    if (pair && !/^https?$/i.test(pair[1]!)) {
      const key = pair[1]!.trim().toLowerCase();
      const value = pair[2]!.trim();

      if (key === 'color' || key === 'colour') {
        result.color ??= value;
        continue;
      }

      if (key === 'fabric') {
        result.fabric ??= value;
        if (!component) continue;
      }

      if (DROPPED_KEYS.has(key)) continue;

      const fact = `${capitalise(pair[1]!.trim())}: ${value}`;

      if (component) {
        component.lines.push(fact);
      } else {
        result.highlights.push(fact);
      }

      continue;
    }

    if (component) {
      component.lines.push(line);
      continue;
    }

    if (line.length >= PROSE_MIN_LENGTH) {
      prose.push(line);
    } else if (!repeatsTitle(line, title)) {
      result.highlights.push(line);
    }
  }

  result.description = prose.length > 0 ? prose.join('\n\n') : null;
  result.highlights = [...new Set(result.highlights)].slice(0, MAX_HIGHLIGHTS);
  result.components = result.components
    .map((part) => ({ ...part, lines: part.lines.slice(0, MAX_COMPONENT_LINES) }))
    .filter((part) => part.lines.length > 0);

  return result;
}
