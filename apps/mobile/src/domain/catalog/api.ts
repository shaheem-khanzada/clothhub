import * as mockServer from '@/mocks/catalog/server';

import type {
  Brand,
  Product,
  ProductListParams,
  ProductPage,
} from './types';

/*
 * The catalog's request functions. Screens and hooks call these, never the
 * transport.
 *
 * There is no ClothHub API yet, so each function is served by the bundled mock
 * server. When endpoints exist, replace each body with an `apiClient` call
 * (`@/axios`) and map the response with `./mapper` — the signatures, and
 * therefore every screen, stay the same.
 */

export const PRODUCTS_PAGE_SIZE = 20;

export function fetchBrands(): Promise<Brand[]> {
  return mockServer.getBrands();
}

export function fetchProductPage(
  params: ProductListParams,
  page: number,
): Promise<ProductPage> {
  return mockServer.getProducts(params, page, PRODUCTS_PAGE_SIZE);
}

export function fetchProduct(productId: string): Promise<Product> {
  return mockServer.getProduct(productId);
}
