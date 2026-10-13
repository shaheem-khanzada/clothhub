import type { ProductListParams } from './types';

/**
 * Query keys for the catalog. Everything starts with 'catalog' so the whole
 * area can be invalidated at once when real data arrives.
 */
export const catalogKeys = {
  all: ['catalog'] as const,

  brands: () => [...catalogKeys.all, 'brands'] as const,

  products: (params: ProductListParams) =>
    [
      ...catalogKeys.all,
      'products',
      params.brandId,
      params.sort,
      params.filters,
      params.search,
    ] as const,

  product: (productId: string) =>
    [...catalogKeys.all, 'product', productId] as const,
};
