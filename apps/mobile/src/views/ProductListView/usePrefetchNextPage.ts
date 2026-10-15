import { useEffect, useRef } from 'react';

import type { Product } from '@/domain/catalog/types';
import { usePrefetchBudget } from '@/hooks/usePrefetchBudget';
import { photoUrl, prefetchPhotos } from '@/lib/images';

/**
 * When the next page of the grid arrives, downloads its card photos straight
 * away — on Wi-Fi only — so a fast scroll lands on photos, not on loading
 * cards. The first page of a list is skipped: it is on screen already.
 *
 * `listKey` identifies the list (brand, sort, filters, search); a new list
 * starts over. Pass no products while the grid shows the previous list's
 * results as a placeholder.
 */
export function usePrefetchNextPage(products: Product[], cardWidth: number, listKey: string) {
  const { nextPageCovers } = usePrefetchBudget();
  const seen = useRef({ listKey, count: products.length });

  useEffect(() => {
    // A new list, or its first page: nothing to fetch ahead of yet.
    if (seen.current.listKey !== listKey || seen.current.count === 0) {
      seen.current = { listKey, count: products.length };
      return;
    }

    const arrived = products.slice(seen.current.count);
    seen.current.count = products.length;

    if (nextPageCovers && arrived.length > 0) {
      prefetchPhotos(arrived.flatMap((product) => (product.images[0] ? [photoUrl(product.images[0], cardWidth)] : [])));
    }
  }, [products, cardWidth, listKey, nextPageCovers]);
}
