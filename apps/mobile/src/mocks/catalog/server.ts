import { mapBrand, mapProduct } from '@/domain/catalog/mapper';
import type {
  Brand,
  PieceType,
  Product,
  ProductDto,
  ProductListParams,
  ProductPage,
} from '@/domain/catalog/types';

import fixtures from './products.json';

/*
 * A stand-in for the catalog backend, fed by a real scrape (Alkaram Studio and
 * Asim Jofa). It behaves like the endpoint we want: filtering, sorting and
 * pagination happen "server side", responses take a moment, and the filter
 * facets describe the brand's whole range rather than the current page.
 *
 * Delete this folder once the API exists; nothing outside
 * `src/domain/catalog/api.ts` imports it.
 */

const dtos = fixtures as ProductDto[];

let cache: { products: Product[]; brands: Brand[] } | null = null;

function database() {
  if (cache) {
    return cache;
  }

  const products = dtos.map(mapProduct).filter((product) => product.images.length > 0);

  const byBrand = new Map<string, { dto: ProductDto['brand']; products: Product[] }>();

  dtos.forEach((dto) => {
    const id = String(dto.brand.brandId);
    if (!byBrand.has(id)) {
      byBrand.set(id, { dto: dto.brand, products: [] });
    }
  });

  products.forEach((product) => byBrand.get(product.brandId)?.products.push(product));

  const brands = [...byBrand.values()]
    .map(({ dto, products: brandProducts }) => {
      // A photographed, in-stock outfit makes the best cover.
      const cover =
        brandProducts.find((product) => product.inStock && product.images.length >= 3) ??
        brandProducts[0];

      return mapBrand(dto, {
        productCount: brandProducts.length,
        coverImage: cover?.images[0] ?? null,
      });
    })
    .sort((a, b) => b.productCount - a.productCount);

  cache = { products, brands };

  return cache;
}

function latency(): Promise<void> {
  const ms = 350 + Math.random() * 350;

  return new Promise((resolve) => setTimeout(resolve, ms));
}

function matchesSearch(product: Product, search: string): boolean {
  if (!search) {
    return true;
  }

  const query = search.toLowerCase();

  return [product.name, product.title, product.sku, product.fabric ?? '', product.color ?? '']
    .some((field) => field.toLowerCase().includes(query));
}

export async function getBrands(): Promise<Brand[]> {
  await latency();

  return database().brands;
}

export async function getProducts(
  params: ProductListParams,
  page: number,
  limit: number,
): Promise<ProductPage> {
  await latency();

  const { brandId, sort, filters, search } = params;
  const brandProducts = database().products.filter((product) => product.brandId === brandId);

  if (brandProducts.length === 0) {
    throw new Error(`Unknown brand ${brandId}`);
  }

  const prices = brandProducts.map((product) => product.price);
  const pieceTypes = [...new Set(brandProducts.map((product) => product.pieceType))] as PieceType[];

  const filtered = brandProducts.filter((product) => {
    if (!matchesSearch(product, search.trim())) return false;
    if (filters.inStockOnly && !product.inStock) return false;
    if (filters.onSaleOnly && product.compareAtPrice === null) return false;
    if (filters.pieceType && product.pieceType !== filters.pieceType) return false;

    if (filters.priceRange) {
      const [low, high] = filters.priceRange;
      if (product.price < low || product.price > high) return false;
    }

    return true;
  });

  const sorted = [...filtered];

  switch (sort) {
    case 'priceAsc':
      sorted.sort((a, b) => a.price - b.price);
      break;
    case 'priceDesc':
      sorted.sort((a, b) => b.price - a.price);
      break;
    case 'newest':
      sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      break;
    case 'oldest':
      sorted.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      break;
    case 'featured':
      // The brand's own order, with what can actually be bought first.
      sorted.sort((a, b) => Number(b.inStock) - Number(a.inStock));
      break;
  }

  const start = (page - 1) * limit;

  return {
    products: sorted.slice(start, start + limit),
    page,
    limit,
    total: sorted.length,
    facets: {
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
      pieceTypes,
    },
  };
}

export async function getProduct(productId: string): Promise<Product> {
  await latency();

  const product = database().products.find((candidate) => candidate.id === productId);

  if (!product) {
    throw new Error(`Unknown product ${productId}`);
  }

  return product;
}
