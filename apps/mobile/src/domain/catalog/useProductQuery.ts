import { useQuery } from '@tanstack/react-query';

import { fetchProduct } from './api';
import { catalogKeys } from './queryKeys';

/**
 * A single product by id. The reel only needs this when it is opened on a
 * product that is not in the brand's loaded list — a shared or deep link.
 */
export function useProductQuery(productId: string, enabled: boolean) {
  return useQuery({
    queryKey: catalogKeys.product(productId),
    queryFn: () => fetchProduct(productId),
    enabled,
  });
}
