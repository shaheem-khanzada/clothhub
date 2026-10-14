import {
  BrandListResponseSchema,
  ProductPageResponseSchema,
  ProductSchema,
} from '@clothhub/shared';

import { apiClient } from '@/axios';

import { mapBrand, mapProduct, mapProductPage, toProductListQuery } from './mapper';
import type { Brand, Product, ProductListParams, ProductPage } from './types';

/*
 * The catalog's request functions. Hooks call these, never the transport.
 *
 * Every response is parsed with the API's own schemas from @clothhub/shared,
 * so a contract mismatch fails loudly here instead of rendering half-empty
 * cards.
 */

export const PRODUCTS_PAGE_SIZE = 20;

export async function fetchBrands(): Promise<Brand[]> {
  const { data } = await apiClient.get('/v1/brands');

  return BrandListResponseSchema.parse(data).brands.map(mapBrand);
}

export async function fetchProductPage(
  params: ProductListParams,
  page: number,
): Promise<ProductPage> {
  const { data } = await apiClient.get('/v1/products', {
    params: toProductListQuery(params, page, PRODUCTS_PAGE_SIZE),
  });

  return mapProductPage(ProductPageResponseSchema.parse(data));
}

export async function fetchProduct(productId: string): Promise<Product> {
  const { data } = await apiClient.get(`/v1/products/${encodeURIComponent(productId)}`);

  return mapProduct(ProductSchema.parse(data));
}
