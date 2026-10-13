/* ------------------------------------------------------------------------ */
/*  DTOs — the shape the scraper writes to Postgres today.                  */
/*  Kept exactly as delivered, loose fields and all; the mapper is the only */
/*  place that is allowed to know about their quirks.                       */
/* ------------------------------------------------------------------------ */

export type BrandDto = {
  brandId: number;
  name: string;
  website: string;
  logo: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProductDto = {
  productId: string;
  images: string[];
  title: string;
  subTitle: string;
  link: string;
  /** "4890" or "Rs. 5,440" depending on the brand. */
  price: string;
  /** Same formats as `price`; `null` or `""` when not on sale. */
  oldPrice: string | null;
  /** One entry, in whatever casing the brand uses: "In Stock", "IN STOCK", "OUT OF STOCK". */
  availability: string[];
  sku: string;
  isActive: boolean;
  colors: string[] | null;
  size: string[] | null;
  /**
   * Free text. Alkaram sends one line per entry with "Shirt::"-style section
   * markers; Asim Jofa sends a paragraph the scraper split on commas.
   */
  details: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
  brand: BrandDto;
};

/* ------------------------------------------------------------------------ */
/*  Domain models — what screens render.                                    */
/* ------------------------------------------------------------------------ */

export type Brand = {
  id: string;
  name: string;
  website: string;
  logo: string | null;
  productCount: number;
  /** A representative product photo for the brand card. */
  coverImage: string | null;
};

/**
 * How many pieces the outfit comes in. Derived from the title because no brand
 * sends it as a field; it drives the "Type" filter.
 */
export type PieceType = 'threePiece' | 'twoPiece' | 'single';

export type Stitching = 'stitched' | 'unstitched';

/** One part of an outfit — "Shirt: Printed khaddar shirt · 1.75 m". */
export type ProductComponent = {
  /** The brand's own label, e.g. "Shirt", "Dupatta", "Trouser". */
  label: string;
  lines: string[];
};

export type Product = {
  id: string;
  brandId: string;
  brandName: string;

  /** Short display name: "Embroidered Chiffon 3 Pcs (AJCR-04)". */
  name: string;
  /**
   * The name without its piece count — "Printed Khaddar Suit With Lace
   * Dupatta" — for places that show the count separately.
   */
  shortName: string;
  /** The brand's full title, for sharing and accessibility. */
  title: string;

  images: string[];

  price: number;
  /** The pre-sale price when the item is discounted. */
  compareAtPrice: number | null;
  /** Whole-number percent, only when `compareAtPrice` is set. */
  discountPercent: number | null;

  inStock: boolean;
  link: string;
  sku: string;

  pieceType: PieceType;
  /** "3 Pc" / "Four Piece" / "3 PCS" in the title, as a number; `null` when the title gives none. */
  pieceCount: number | null;
  stitching: Stitching | null;
  color: string | null;
  fabric: string | null;
  sizes: string[];

  /** Marketing copy, when the brand writes any. */
  description: string | null;
  /** Shirt / Dupatta / Trouser breakdown, when the brand provides one. */
  components: ProductComponent[];
  /** Loose detail lines that do not belong to a component. */
  highlights: string[];

  createdAt: string;
};

/* ------------------------------------------------------------------------ */
/*  Listing                                                                 */
/* ------------------------------------------------------------------------ */

export type ProductSort =
  | 'featured'
  | 'priceAsc'
  | 'priceDesc'
  | 'newest'
  | 'oldest';

export type PriceRange = readonly [number, number];

export type ProductFilters = {
  /** `null` means the full range the brand offers. */
  priceRange: PriceRange | null;
  /** `null` means all types. */
  pieceType: PieceType | null;
  inStockOnly: boolean;
  onSaleOnly: boolean;
};

export type ProductListParams = {
  brandId: string;
  sort: ProductSort;
  filters: ProductFilters;
  search: string;
};

/** What the filter sheet can offer for a brand, independent of current filters. */
export type ProductFacets = {
  minPrice: number;
  maxPrice: number;
  pieceTypes: PieceType[];
};

export type ProductPage = {
  products: Product[];
  page: number;
  limit: number;
  total: number;
  facets: ProductFacets;
};
