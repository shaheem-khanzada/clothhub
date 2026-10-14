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

/**
 * The two-column product grid. The reel needs the card size too: it opens on
 * the photo the card already showed, so it asks for the same cached file.
 */
export const ProductGrid = {
  columns: 2,
  columnGap: 12,
  rowGap: 20,
  /** Product photos are portrait, 3:4. */
  imageAspectRatio: 3 / 4,
} as const;

/** Width of one product card in points, for a window this wide. */
export function productCardWidth(windowWidth: number): number {
  return (windowWidth - PageGutter * 2 - ProductGrid.columnGap * (ProductGrid.columns - 1)) / ProductGrid.columns;
}
