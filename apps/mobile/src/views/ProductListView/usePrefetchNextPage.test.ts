import { renderHook } from '@testing-library/react-native';
import { PixelRatio } from 'react-native';

import { mapProduct } from '@/domain/catalog/mapper';
import type { Product } from '@/domain/catalog/types';
import { usePrefetchBudget } from '@/hooks/usePrefetchBudget';
import { prefetchPhotos } from '@/lib/images';
import { aProduct } from '@/test-utils/fixtures';

import { usePrefetchNextPage } from './usePrefetchNextPage';

jest.mock('@/hooks/usePrefetchBudget');
jest.mock('@/lib/images', () => ({
  ...jest.requireActual('@/lib/images'),
  prefetchPhotos: jest.fn(),
}));

const budget = jest.mocked(usePrefetchBudget);
const prefetch = jest.mocked(prefetchPhotos);

type Props = { products: Product[]; listKey?: string };

const page = (count: number): Product[] =>
  Array.from({ length: count }, (_, index) =>
    mapProduct(aProduct({ images: [{ url: `https://cdn.shopify.com/p${index}.jpg`, width: 800, height: 1200, thumbhash: null }] })),
  );

describe('usePrefetchNextPage', () => {
  beforeEach(() => {
    jest.spyOn(PixelRatio, 'get').mockReturnValue(3);
    budget.mockReturnValue({ productsAhead: 3, photosPerProduct: 3, nextPageCovers: true });
    prefetch.mockClear();
  });

  it('downloads the covers of each page that arrives after the first, at card size', async () => {
    const first = page(2);
    const { rerender } = await renderHook(({ products }: Props) => usePrefetchNextPage(products, 180, 'saya'), {
      initialProps: { products: [] as Product[] },
    });

    await rerender({ products: first });
    expect(prefetch).not.toHaveBeenCalled();

    const second = [...first, ...page(4).slice(2)];
    await rerender({ products: second });

    expect(prefetch).toHaveBeenCalledWith([
      'https://cdn.shopify.com/p2.jpg?width=360',
      'https://cdn.shopify.com/p3.jpg?width=360',
    ]);
  });

  it('starts over for a new list', async () => {
    const { rerender } = await renderHook(({ products, listKey = '' }: Props) => usePrefetchNextPage(products, 180, listKey), {
      initialProps: { products: page(2), listKey: 'saya:featured' },
    });

    await rerender({ products: page(4), listKey: 'saya:newest' });

    expect(prefetch).not.toHaveBeenCalled();
  });

  it('waits for Wi-Fi', async () => {
    budget.mockReturnValue({ productsAhead: 1, photosPerProduct: 2, nextPageCovers: false });
    const { rerender } = await renderHook(({ products }: Props) => usePrefetchNextPage(products, 180, 'saya'), {
      initialProps: { products: page(2) },
    });

    await rerender({ products: page(4) });

    expect(prefetch).not.toHaveBeenCalled();
  });
});
