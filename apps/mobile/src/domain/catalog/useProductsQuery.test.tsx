import { act, renderHook, waitFor } from '@testing-library/react-native';
import MockAdapter from 'axios-mock-adapter';

import { apiClient } from '@/axios';
import { aBrand, aProduct, aProductPage } from '@/test-utils/fixtures';
import { createQueryWrapper } from '@/test-utils/queryClient';

import { DEFAULT_FILTERS } from './filters';
import type { ProductListParams } from './types';
import { useBrandQuery, useBrandsQuery } from './useBrandsQuery';
import { useProductQuery } from './useProductQuery';
import { useProductsQuery } from './useProductsQuery';

const server = new MockAdapter(apiClient);

const params: ProductListParams = { brandId: 'brand-1', sort: 'featured', filters: DEFAULT_FILTERS, search: '' };

afterEach(() => {
  server.reset();
});

describe('useProductsQuery', () => {
  it('loads page by page and flattens the products', async () => {
    const pageOne = aProductPage({ products: [aProduct(), aProduct()], page: 1, limit: 2, total: 3 });
    const pageTwo = aProductPage({ products: [aProduct()], page: 2, limit: 2, total: 3 });
    server.onGet('/v1/products').reply((config) => [200, config.params.page === 1 ? pageOne : pageTwo]);

    const { result } = await renderHook(() => useProductsQuery(params), { wrapper: createQueryWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.products).toHaveLength(2);
    expect(result.current.data?.total).toBe(3);
    expect(result.current.data?.facets).toEqual(pageOne.facets);
    expect(result.current.hasNextPage).toBe(true);

    await act(async () => {
      await result.current.fetchNextPage();
    });

    await waitFor(() =>
      expect(result.current.data?.products.map((product) => product.id)).toEqual([
        ...pageOne.products.map((product) => product.id),
        ...pageTwo.products.map((product) => product.id),
      ]),
    );
    expect(result.current.hasNextPage).toBe(false);
  });

  it('reports a failed load', async () => {
    server.onGet('/v1/products').reply(500, { error: { code: 'internal_error', message: 'Something went wrong' } });

    const { result } = await renderHook(() => useProductsQuery(params), { wrapper: createQueryWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toMatchObject({ code: 'internal_error', status: 500 });
  });
});

describe('useBrandsQuery and useBrandQuery', () => {
  it('share one request, and pick a brand out of the list', async () => {
    const brand = aBrand({ name: 'Zeen' });
    server.onGet('/v1/brands').reply(200, { brands: [aBrand(), brand] });
    const wrapper = createQueryWrapper();

    const { result: list } = await renderHook(() => useBrandsQuery(), { wrapper });
    const { result: one } = await renderHook(() => useBrandQuery(brand.id), { wrapper });

    await waitFor(() => expect(one.current.data?.name).toBe('Zeen'));
    expect(list.current.data).toHaveLength(2);
    expect(server.history.get).toHaveLength(1);
  });
});

describe('useProductQuery', () => {
  it('only fetches when enabled', async () => {
    const product = aProduct();
    server.onGet(`/v1/products/${product.id}`).reply(200, product);
    const wrapper = createQueryWrapper();

    const { result: disabled } = await renderHook(() => useProductQuery(product.id, false), { wrapper });
    expect(disabled.current.fetchStatus).toBe('idle');

    const { result } = await renderHook(() => useProductQuery(product.id, true), { wrapper });
    await waitFor(() => expect(result.current.data?.id).toBe(product.id));
  });
});
