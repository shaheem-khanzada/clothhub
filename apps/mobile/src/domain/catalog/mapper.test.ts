import { aBrand, aProduct } from '@/test-utils/fixtures';

import { DEFAULT_FILTERS } from './filters';
import { mapBrand, mapProduct, toProductListQuery } from './mapper';
import type { ProductListParams } from './types';

describe('mapBrand', () => {
  it('renames API fields to what the brand card uses', () => {
    const brand = aBrand({ logoUrl: 'https://saya.pk/logo.png' });

    expect(mapBrand(brand)).toEqual({
      id: brand.id,
      slug: 'saya',
      name: 'Saya',
      website: 'https://saya.pk',
      logo: 'https://saya.pk/logo.png',
      productCount: 120,
      inStockCount: 80,
      coverImage: 'https://cdn.shopify.com/s/files/cover.jpg',
    });
  });
});

describe('mapProduct', () => {
  it('flattens the brand and image URLs', () => {
    const product = mapProduct(aProduct());

    expect(product.brandName).toBe('Saya');
    expect(product.images).toEqual([
      'https://cdn.shopify.com/s/files/a.jpg',
      'https://cdn.shopify.com/s/files/b.jpg',
    ]);
    expect(product.link).toBe('https://saya.pk/products/sp-12875');
  });

  it('keeps the colour families for tinting and filters', () => {
    expect(mapProduct(aProduct({ colors: ['red', 'gold'] })).colors).toEqual(['red', 'gold']);
  });

  it('keeps only the sizes that can be bought', () => {
    const product = mapProduct(
      aProduct({
        sizes: [
          { label: 'S', inStock: false },
          { label: 'M', inStock: true },
          { label: 'L', inStock: true },
        ],
      }),
    );

    expect(product.sizes).toEqual(['M', 'L']);
  });

  it('carries sale prices and the retired flag through', () => {
    const product = mapProduct(aProduct({ price: 4490, compareAtPrice: 8990, discountPercent: 50, isRetired: true }));

    expect(product).toMatchObject({ price: 4490, compareAtPrice: 8990, discountPercent: 50, isRetired: true });
  });
});

describe('toProductListQuery', () => {
  const params: ProductListParams = {
    brandId: 'brand-1',
    sort: 'featured',
    filters: DEFAULT_FILTERS,
    search: '',
  };

  it('sends only the brand, sort and page when nothing is filtered', () => {
    expect(toProductListQuery(params, 2, 20)).toEqual({
      brandId: 'brand-1',
      sort: 'featured',
      page: 2,
      limit: 20,
    });
  });

  it('sends each active filter and a trimmed search', () => {
    expect(
      toProductListQuery(
        {
          ...params,
          sort: 'priceAsc',
          search: '  lawn  ',
          filters: { priceRange: [2000, 8000], pieceType: 'twoPiece', inStockOnly: true, onSaleOnly: true },
        },
        1,
        20,
      ),
    ).toEqual({
      brandId: 'brand-1',
      sort: 'priceAsc',
      page: 1,
      limit: 20,
      q: 'lawn',
      inStock: true,
      onSale: true,
      pieceType: 'twoPiece',
      minPrice: 2000,
      maxPrice: 8000,
    });
  });
});
