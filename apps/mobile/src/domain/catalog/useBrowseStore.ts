import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

import { DEFAULT_FILTERS, DEFAULT_SORT } from './filters';
import type { ProductFilters, ProductListParams, ProductSort } from './types';

type BrowseState = {
  sort: ProductSort;
  filters: ProductFilters;
  search: string;
};

type BrowseStore = {
  /** Keyed by brand id: each brand remembers its own sort and filters. */
  byBrand: Record<string, BrowseState>;

  setSort: (brandId: string, sort: ProductSort) => void;
  setFilters: (brandId: string, filters: ProductFilters) => void;
  setSearch: (brandId: string, search: string) => void;
};

const initialBrowseState: BrowseState = {
  sort: DEFAULT_SORT,
  filters: DEFAULT_FILTERS,
  search: '',
};

function update(
  state: BrowseStore,
  brandId: string,
  patch: Partial<BrowseState>,
): Pick<BrowseStore, 'byBrand'> {
  return {
    byBrand: {
      ...state.byBrand,
      [brandId]: {
        ...(state.byBrand[brandId] ?? initialBrowseState),
        ...patch,
      },
    },
  };
}

/**
 * How the user is currently looking at a brand's products: sort, filters and
 * search.
 *
 * Client state shared by two screens — the product list sets it, and the reel
 * must page through exactly the same list. The products themselves stay in
 * React Query; this only holds the parameters that pick them.
 *
 * In memory only. A fresh launch starts from the brand's default view, which
 * is what a shopper expects.
 */
export const useBrowseStore = create<BrowseStore>((set) => ({
  byBrand: {},

  setSort: (brandId, sort) => set((state) => update(state, brandId, { sort })),

  setFilters: (brandId, filters) => set((state) => update(state, brandId, { filters })),

  setSearch: (brandId, search) => set((state) => update(state, brandId, { search })),
}));

/** The list params for a brand, falling back to the defaults before anything is set. */
export function useBrowseParams(brandId: string): ProductListParams {
  return useBrowseStore(
    useShallow((state) => {
      const browse = state.byBrand[brandId] ?? initialBrowseState;

      return {
        brandId,
        sort: browse.sort,
        filters: browse.filters,
        search: browse.search,
      };
    }),
  );
}
