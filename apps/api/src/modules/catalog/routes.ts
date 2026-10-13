import {
  BrandListResponseSchema,
  BrandParamsSchema,
  BrandSchema,
  ErrorResponseSchema,
  ProductListQuerySchema,
  ProductPageResponseSchema,
  ProductParamsSchema,
  ProductSchema,
} from '@clothhub/shared';
import { createRoute, OpenAPIHono } from '@hono/zod-openapi';

import { ApiError } from '../../lib/errors.js';
import type { AppEnv } from '../../lib/hono.js';
import { validationHook } from '../../lib/validation.js';
import type { CatalogService } from './service.js';

/*
 * Catalogue endpoints. Request and response shapes come from
 * @clothhub/shared, so the OpenAPI document, the validation and the mobile
 * app's parsing all use the same schemas.
 */

const json = <T>(schema: T) => ({ 'application/json': { schema } });

const notFound = { description: 'Not found', content: json(ErrorResponseSchema) };
const invalid = { description: 'Invalid request', content: json(ErrorResponseSchema) };

/** Catalogue data changes when the ingest job runs (hours, not seconds). */
const CACHE_BRANDS = 'public, max-age=300';
const CACHE_PRODUCTS = 'public, max-age=60';

const listBrands = createRoute({
  method: 'get',
  path: '/v1/brands',
  tags: ['Catalog'],
  summary: 'Brands with products to show, most in-stock products first',
  responses: {
    200: { description: 'Brands', content: json(BrandListResponseSchema) },
  },
});

const getBrand = createRoute({
  method: 'get',
  path: '/v1/brands/{brandId}',
  tags: ['Catalog'],
  summary: 'One brand',
  request: { params: BrandParamsSchema },
  responses: {
    200: { description: 'The brand', content: json(BrandSchema) },
    400: invalid,
    404: notFound,
  },
});

const listProducts = createRoute({
  method: 'get',
  path: '/v1/products',
  tags: ['Catalog'],
  summary: 'Products, filtered, sorted and paged — across brands or for one brand',
  description:
    'Facets describe the whole brand (or catalogue) regardless of the filters applied, so the filter sheet can always offer the full range.',
  request: { query: ProductListQuerySchema },
  responses: {
    200: { description: 'A page of products', content: json(ProductPageResponseSchema) },
    400: invalid,
    404: notFound,
  },
});

const getProduct = createRoute({
  method: 'get',
  path: '/v1/products/{productId}',
  tags: ['Catalog'],
  summary: 'One product, for share links and deep links (also when retired)',
  request: { params: ProductParamsSchema },
  responses: {
    200: { description: 'The product', content: json(ProductSchema) },
    400: invalid,
    404: notFound,
  },
});

export function catalogRoutes(catalog: CatalogService) {
  return new OpenAPIHono<AppEnv>({ defaultHook: validationHook })
    .openapi(listBrands, async (c) => {
      c.header('Cache-Control', CACHE_BRANDS);
      return c.json({ brands: await catalog.listBrands() }, 200);
    })
    .openapi(getBrand, async (c) => {
      const brand = await catalog.getBrand(c.req.valid('param').brandId);
      if (!brand) throw ApiError.notFound('Brand');

      c.header('Cache-Control', CACHE_BRANDS);
      return c.json(brand, 200);
    })
    .openapi(listProducts, async (c) => {
      const query = c.req.valid('query');

      if (query.brandId && !(await catalog.getBrand(query.brandId))) {
        throw ApiError.notFound('Brand');
      }
      if (query.minPrice !== undefined && query.maxPrice !== undefined && query.minPrice > query.maxPrice) {
        throw new ApiError(400, 'invalid_request', 'minPrice must not be greater than maxPrice');
      }

      c.header('Cache-Control', CACHE_PRODUCTS);
      return c.json(await catalog.listProducts(query), 200);
    })
    .openapi(getProduct, async (c) => {
      const product = await catalog.getProduct(c.req.valid('param').productId);
      if (!product) throw ApiError.notFound('Product');

      c.header('Cache-Control', CACHE_PRODUCTS);
      return c.json(product, 200);
    });
}
