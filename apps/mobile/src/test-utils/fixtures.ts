import type {
  BrandResponse,
  ProductPageResponse,
  ProductResponse,
} from '@clothhub/shared';

/*
 * API responses for tests, valid against the shared schemas. Override only
 * the fields a test is about.
 */

let sequence = 0;

/** A valid v7-looking UUID that is unique per call. */
export function testId(): string {
  sequence += 1;
  return `01a13757-c2db-7750-9c83-${String(sequence).padStart(12, '0')}`;
}

export function aBrand(overrides: Partial<BrandResponse> = {}): BrandResponse {
  return {
    id: testId(),
    slug: 'saya',
    name: 'Saya',
    website: 'https://saya.pk',
    logoUrl: null,
    productCount: 120,
    inStockCount: 80,
    coverImageUrl: 'https://cdn.shopify.com/s/files/cover.jpg',
    ...overrides,
  };
}

export function aProduct(overrides: Partial<ProductResponse> = {}): ProductResponse {
  return {
    id: testId(),
    brand: { id: '01a13757-c2db-7750-9c83-000000000999', slug: 'saya', name: 'Saya' },
    name: 'Printed Lawn Suit 3 Piece',
    shortName: 'Printed Lawn Suit',
    title: 'Printed Lawn Suit 3 Piece',
    sku: 'SP-12875',
    images: [
      { url: 'https://cdn.shopify.com/s/files/a.jpg', width: 800, height: 1160, thumbhash: '1QcSHQRnh493V4dIh4eXh1h4kJUI' },
      { url: 'https://cdn.shopify.com/s/files/b.jpg', width: 800, height: 1160, thumbhash: null },
    ],
    price: 4490,
    priceMax: 4490,
    compareAtPrice: 8990,
    discountPercent: 50,
    currency: 'PKR',
    inStock: true,
    isRetired: false,
    url: 'https://saya.pk/products/sp-12875',
    category: 'unstitched',
    pieceType: 'threePiece',
    pieceCount: 3,
    stitching: 'unstitched',
    fabric: 'Lawn',
    color: 'Green',
    colors: ['green'],
    sizes: [
      { label: 'S', inStock: false },
      { label: 'M', inStock: true },
    ],
    description: 'A breathable printed lawn suit.',
    components: [{ label: 'Shirt', lines: ['Printed lawn shirt'] }],
    highlights: ['Machine washable'],
    firstSeenAt: '2026-10-01T00:00:00.000Z',
    ...overrides,
  };
}

export function aProductPage(overrides: Partial<ProductPageResponse> = {}): ProductPageResponse {
  return {
    products: [aProduct()],
    page: 1,
    limit: 20,
    total: 1,
    facets: { minPrice: 1990, maxPrice: 12990, pieceTypes: ['threePiece', 'twoPiece'] },
    ...overrides,
  };
}
