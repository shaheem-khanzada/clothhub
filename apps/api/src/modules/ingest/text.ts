/**
 * Small text helpers shared by the normalisation rules.
 */

/** Collapses runs of whitespace and trims. */
export function squash(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function toTitleCase(value: string): string {
  return value.toLowerCase().replace(/\b([a-z])/g, (letter) => letter.toUpperCase());
}

/**
 * Some brands' text reaches the scraper with broken characters (U+FFFD) where
 * an apostrophe or a dash was. Between letters it was almost always an
 * apostrophe ("Child�s"); elsewhere a dash ("Tee � Soft Sand").
 */
export function repairReplacementChars(value: string): string {
  return value
    .replace(/(\p{L})�(\p{L})/gu, '$1’$2')
    .replace(/\s?�\s?/g, ' – ');
}

/** Lower-case words joined by single spaces, punctuation removed — for keyword matching. */
export function toSearchable(...parts: (string | null | undefined)[]): string {
  return parts
    .filter((part): part is string => Boolean(part))
    .join(' | ')
    // "WomenUnstitched", "KidsClothes" → separate words before matching.
    .replace(/(\p{Ll})(\p{Lu})/gu, '$1 $2')
    .toLowerCase()
    .replace(/[_/]+/g, ' ')
    .replace(/-/g, ' ');
}
