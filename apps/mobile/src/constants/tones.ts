/**
 * A muted swatch for each colour family the API reports. Used only to tint a
 * photo's frame while the photo loads, so a maroon suit arrives out of a
 * maroon haze rather than a grey box.
 *
 * Dyed-fabric shades rather than pure hues: they sit quietly on the dark UI
 * and never compete with the photo that replaces them.
 */
export const ToneSwatches: Record<string, string> = {
  black: '#2B2B30',
  white: '#E9E4DA',
  beige: '#CDB99B',
  grey: '#8D8D94',
  brown: '#7B5A45',
  red: '#8E2F3D',
  pink: '#D48C9C',
  orange: '#C9784A',
  yellow: '#D0AE55',
  green: '#5E7A5B',
  blue: '#4A6489',
  purple: '#7B5F8F',
  gold: '#B9964F',
  silver: '#A8AAAF',
  multi: '#9A7E8C',
};

/** The tint for a product: its first colour family the app has a swatch for, or none. */
export function toneOf(colors: readonly string[] | null | undefined): string | null {
  for (const family of colors ?? []) {
    const swatch = ToneSwatches[family];

    if (swatch) {
      return swatch;
    }
  }

  return null;
}
