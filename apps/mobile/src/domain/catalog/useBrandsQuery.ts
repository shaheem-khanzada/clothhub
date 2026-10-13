import { useQuery } from '@tanstack/react-query';

import { fetchBrands } from './api';
import { catalogKeys } from './queryKeys';

export function useBrandsQuery() {
  return useQuery({
    queryKey: catalogKeys.brands(),
    queryFn: fetchBrands,
  });
}

/** One brand from the cached list — the product screens read the name from here. */
export function useBrandQuery(brandId: string) {
  return useQuery({
    queryKey: catalogKeys.brands(),
    queryFn: fetchBrands,
    select: (brands) => brands.find((brand) => brand.id === brandId) ?? null,
  });
}
