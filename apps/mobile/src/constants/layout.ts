/**
 * Shared shapes. Cards and photos repeat across the brand list, the product
 * grid and the reel, so their radii live here rather than on each screen.
 */
export const Radii = {
  /** Product photos in the grid, thumbnails. */
  image: 14,
  /** Brand cards, grouped sections in sheets. */
  card: 24,
  /** Pills, chips, circular buttons. */
  pill: 999,
} as const;

/** Apple's minimum hit target. */
export const MinTouchTarget = 44;

/** Horizontal page gutter used by every screen. */
export const PageGutter = 16;
