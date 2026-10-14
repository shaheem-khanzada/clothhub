import type {
  BrandResponse,
  ProductListQuery,
  ProductPageResponse,
  ProductResponse,
} from '@clothhub/shared';

import type { Brand, Product, ProductListParams, ProductPage } from './types';

/*
 * API responses → domain models, and domain list params → the API's query
 * string. The brand-by-brand clean-up of scraped text now happens in the
 * API's ingest job, so this only reshapes.
 */

export function mapBrand(brand: BrandResponse): Brand {
  return {
    id: brand.id,
    slug: brand.slug,
    name: brand.name,
    website: brand.website,
    logo: brand.logoUrl,
    productCount: brand.productCount,
    inStockCount: brand.inStockCount,
    coverImage: brand.coverImageUrl,
  };
}

export function mapProduct(product: ProductResponse): Product {
  return {
    id: product.id,
    brandId: product.brand.id,
    brandName: product.brand.name,

    name: product.name,
    shortName: product.shortName,
    title: product.title,

    images: product.images.map((image) => image.url),

    price: product.price,
    compareAtPrice: product.compareAtPrice,
    discountPercent: product.discountPercent,

    inStock: product.inStock,
    isRetired: product.isRetired,
    link: product.url,
    sku: product.sku,

    pieceType: product.pieceType,
    pieceCount: product.pieceCount,
    stitching: product.stitching,
    color: product.color,
    colors: product.colors,
    fabric: product.fabric,
    sizes: product.sizes.filter((size) => size.inStock).map((size) => size.label),

    description: product.description,
    components: product.components,
    highlights: product.highlights,

    firstSeenAt: product.firstSeenAt,
  };
}

export function mapProductPage(page: ProductPageResponse): ProductPage {
  return {
    products: page.products.map(mapProduct),
    page: page.page,
    limit: page.limit,
    total: page.total,
    facets: page.facets,
  };
}

/** Query string for `GET /v1/products`. Only set filters are sent. */
export function toProductListQuery(
  params: ProductListParams,
  page: number,
  limit: number,
): Partial<Record<keyof ProductListQuery, string | number | boolean>> {
  const { brandId, sort, filters, search } = params;
  const query: Partial<Record<keyof ProductListQuery, string | number | boolean>> = {
    brandId,
    sort,
    page,
    limit,
  };

  const q = search.trim();
  if (q) query.q = q;
  if (filters.inStockOnly) query.inStock = true;
  if (filters.onSaleOnly) query.onSale = true;
  if (filters.pieceType) query.pieceType = filters.pieceType;
  if (filters.priceRange) {
    query.minPrice = filters.priceRange[0];
    query.maxPrice = filters.priceRange[1];
  }

  return query;
}
