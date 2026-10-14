import MockAdapter from 'axios-mock-adapter';
import { ZodError } from 'zod';

import { ApiError, apiClient } from '@/axios';
import { aBrand, aProduct, aProductPage } from '@/test-utils/fixtures';

import { fetchBrands, fetchProduct, fetchProductPage, PRODUCTS_PAGE_SIZE } from './api';
import { DEFAULT_FILTERS } from './filters';

const server = new MockAdapter(apiClient);

afterEach(() => {
  server.reset();
});

describe('fetchBrands', () => {
  it('returns mapped brands', async () => {
    const brand = aBrand({ name: 'Limelight' });
    server.onGet('/v1/brands').reply(200, { brands: [brand] });

    await expect(fetchBrands()).resolves.toEqual([expect.objectContaining({ id: brand.id, name: 'Limelight' })]);
  });

  it('rejects a response that does not match the contract', async () => {
    server.onGet('/v1/brands').reply(200, { brands: [{ id: 'not-a-uuid' }] });

    await expect(fetchBrands()).rejects.toBeInstanceOf(ZodError);
  });
});

describe('fetchProductPage', () => {
  it('asks for one page with the current filters and maps the result', async () => {
    const page = aProductPage({ page: 2, total: 41 });
    server.onGet('/v1/products').reply((config) => {
      expect(config.params).toEqual({
        brandId: 'brand-1',
        sort: 'newest',
        page: 2,
        limit: PRODUCTS_PAGE_SIZE,
        onSale: true,
      });
      return [200, page];
    });

    const result = await fetchProductPage(
      {
        brandId: 'brand-1',
        sort: 'newest',
        search: '',
        filters: { ...DEFAULT_FILTERS, onSaleOnly: true },
      },
      2,
    );

    expect(result).toMatchObject({ page: 2, total: 41, facets: page.facets });
    expect(result.products[0]?.id).toBe(page.products[0]?.id);
  });
});

describe('fetchProduct', () => {
  it('returns one mapped product', async () => {
    const product = aProduct();
    server.onGet(`/v1/products/${product.id}`).reply(200, product);

    await expect(fetchProduct(product.id)).resolves.toMatchObject({ id: product.id, sizes: ['M'] });
  });

  it("surfaces the API's error code", async () => {
    server.onGet('/v1/products/missing').reply(404, { error: { code: 'not_found', message: 'Product not found' } });

    const error = await fetchProduct('missing').catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ code: 'not_found', status: 404, isNotFound: true });
  });
});
