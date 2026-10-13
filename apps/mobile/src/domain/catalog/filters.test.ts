import { countActiveFilters, DEFAULT_FILTERS, normalizePriceRange, priceBounds } from './filters';

describe('countActiveFilters', () => {
  it('counts each filter that narrows the list', () => {
    expect(countActiveFilters(DEFAULT_FILTERS)).toBe(0);
    expect(
      countActiveFilters({ priceRange: [1000, 5000], pieceType: 'single', inStockOnly: true, onSaleOnly: false }),
    ).toBe(3);
  });
});

describe('priceBounds', () => {
  it('snaps the facet range outwards to whole slider steps', () => {
    expect(priceBounds({ minPrice: 1990, maxPrice: 12_990, pieceTypes: [] })).toEqual([1500, 13_000]);
  });
});

describe('normalizePriceRange', () => {
  it('treats a range covering the whole brand as no filter', () => {
    expect(normalizePriceRange([1500, 13_000], [1500, 13_000])).toBeNull();
    expect(normalizePriceRange([1000, 14_000], [1500, 13_000])).toBeNull();
  });

  it('keeps a range that narrows the list', () => {
    expect(normalizePriceRange([2000, 8000], [1500, 13_000])).toEqual([2000, 8000]);
  });
});
