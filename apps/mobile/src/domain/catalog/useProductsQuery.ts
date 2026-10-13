import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';

import { fetchProductPage } from './api';
import { catalogKeys } from './queryKeys';
import type { ProductListParams } from './types';

/**
 * A brand's products for the current sort, filters and search, page by page.
 *
 * The product list and the reel call this with the same params, so they share
 * one cache entry: opening the reel is instant, and swiping past the last
 * loaded product fetches the next page for both.
 */
export function useProductsQuery(params: ProductListParams) {
  return useInfiniteQuery({
    queryKey: catalogKeys.products(params),
    initialPageParam: 1,
    // Changing sort or filters keeps the current grid on screen until the new
    // results land, instead of flashing back to skeletons.
    placeholderData: keepPreviousData,
    queryFn: ({ pageParam }) => fetchProductPage(params, pageParam),
    getNextPageParam: (lastPage) => {
      const loaded = lastPage.page * lastPage.limit;

      return loaded < lastPage.total ? lastPage.page + 1 : undefined;
    },
    select: (data) => ({
      ...data,
      products: data.pages.flatMap((page) => page.products),
      total: data.pages[0]?.total ?? 0,
      facets: data.pages[0]?.facets ?? null,
    }),
  });
}
