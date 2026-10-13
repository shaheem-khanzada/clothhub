import type {
  PieceType,
  PriceRange,
  ProductFacets,
  ProductFilters,
  ProductSort,
} from './types';

export const DEFAULT_SORT: ProductSort = 'featured';

export const DEFAULT_FILTERS: ProductFilters = {
  priceRange: null,
  pieceType: null,
  inStockOnly: false,
  onSaleOnly: false,
};

export const PRODUCT_SORTS: ProductSort[] = [
  'featured',
  'priceAsc',
  'priceDesc',
  'newest',
  'oldest',
];

/** Display order of the Type chips; only types the brand actually has are shown. */
export const PIECE_TYPES: PieceType[] = ['threePiece', 'twoPiece', 'single'];

/** Slider granularity, in rupees. */
export const PRICE_STEP = 500;

/** The "Apply (3)" count — one per filter that narrows the list. */
export function countActiveFilters(filters: ProductFilters): number {
  return [
    filters.priceRange !== null,
    filters.pieceType !== null,
    filters.inStockOnly,
    filters.onSaleOnly,
  ].filter(Boolean).length;
}

/** Facet bounds snapped outwards to whole slider steps. */
export function priceBounds(facets: ProductFacets): PriceRange {
  return [
    Math.floor(facets.minPrice / PRICE_STEP) * PRICE_STEP,
    Math.ceil(facets.maxPrice / PRICE_STEP) * PRICE_STEP,
  ];
}

/**
 * A range that spans the whole brand is no filter at all — store `null` so the
 * active-filter count and the query key stay honest.
 */
export function normalizePriceRange(
  range: PriceRange,
  bounds: PriceRange,
): PriceRange | null {
  return range[0] <= bounds[0] && range[1] >= bounds[1] ? null : range;
}
