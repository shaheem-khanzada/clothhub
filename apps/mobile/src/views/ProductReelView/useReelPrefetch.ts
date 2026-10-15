import { useEffect } from 'react';

import type { Product } from '@/domain/catalog/types';
import { usePrefetchBudget } from '@/hooks/usePrefetchBudget';
import { PhotoDensity, photoUrl, prefetchPhotos } from '@/lib/images';

/**
 * Warms the photos a swipe is about to need, at the reel's full-screen size:
 * the active product's next photos (a swipe sideways) and the next products'
 * covers (a swipe up). How far ahead depends on the connection.
 */
export function useReelPrefetch(products: Product[], activeIndex: number, width: number) {
  const { productsAhead, photosPerProduct } = usePrefetchBudget();
  const active = products[activeIndex];

  useEffect(() => {
    const sideways = active?.images.slice(1, photosPerProduct) ?? [];
    const upcoming = products
      .slice(activeIndex + 1, activeIndex + 1 + productsAhead)
      .flatMap((product) => (product.images[0] ? [product.images[0]] : []));

    prefetchPhotos([...sideways, ...upcoming].map((uri) => photoUrl(uri, width, PhotoDensity.full)));
  }, [active, products, activeIndex, width, productsAhead, photosPerProduct]);
}
