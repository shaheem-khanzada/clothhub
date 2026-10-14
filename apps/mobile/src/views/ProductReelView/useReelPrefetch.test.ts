import { renderHook } from '@testing-library/react-native';
import { PixelRatio } from 'react-native';

import { mapProduct } from '@/domain/catalog/mapper';
import { usePrefetchBudget } from '@/hooks/usePrefetchBudget';
import { prefetchPhotos } from '@/lib/images';
import { aProduct } from '@/test-utils/fixtures';

import { useReelPrefetch } from './useReelPrefetch';

jest.mock('@/hooks/usePrefetchBudget');
jest.mock('@/lib/images', () => ({
  ...jest.requireActual('@/lib/images'),
  prefetchPhotos: jest.fn(),
}));

const budget = jest.mocked(usePrefetchBudget);
const prefetch = jest.mocked(prefetchPhotos);

const product = (name: string, photos: number) =>
  mapProduct(
    aProduct({
      images: Array.from({ length: photos }, (_, index) => ({
        url: `https://cdn.shopify.com/${name}-${index}.jpg`,
        width: 800,
        height: 1200,
        thumbhash: null,
      })),
    }),
  );

const products = [product('a', 4), product('b', 3), product('c', 3), product('d', 3)];

describe('useReelPrefetch', () => {
  beforeEach(() => {
    jest.spyOn(PixelRatio, 'get').mockReturnValue(3);
    prefetch.mockClear();
  });

  it('on mobile data, warms the next photo and the next product, full-screen size', async () => {
    budget.mockReturnValue({ productsAhead: 1, photosPerProduct: 2, nextPageCovers: false });

    await renderHook(() => useReelPrefetch(products, 0, 390));

    expect(prefetch).toHaveBeenCalledWith([
      'https://cdn.shopify.com/a-1.jpg?width=1200',
      'https://cdn.shopify.com/b-0.jpg?width=1200',
    ]);
  });

  it('on Wi-Fi, reaches further ahead', async () => {
    budget.mockReturnValue({ productsAhead: 3, photosPerProduct: 3, nextPageCovers: true });

    await renderHook(() => useReelPrefetch(products, 0, 390));

    expect(prefetch).toHaveBeenCalledWith([
      'https://cdn.shopify.com/a-1.jpg?width=1200',
      'https://cdn.shopify.com/a-2.jpg?width=1200',
      'https://cdn.shopify.com/b-0.jpg?width=1200',
      'https://cdn.shopify.com/c-0.jpg?width=1200',
      'https://cdn.shopify.com/d-0.jpg?width=1200',
    ]);
  });

  it('offline, fetches nothing', async () => {
    budget.mockReturnValue({ productsAhead: 0, photosPerProduct: 0, nextPageCovers: false });

    await renderHook(() => useReelPrefetch(products, 1, 390));

    expect(prefetch).toHaveBeenCalledWith([]);
  });
});
