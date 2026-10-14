import type { PieceType, ProductComponent, ProductSort, Stitching } from '@clothhub/shared';

/*
 * Domain models — what screens render. The API's response shapes live in
 * @clothhub/shared; `mapper.ts` turns them into these, so screens never
 * depend on the wire format.
 */

export type { PieceType, ProductComponent, ProductSort, Stitching };

export type Brand = {
  id: string;
  slug: string;
  name: string;
  website: string;
  logo: string | null;
  /** Products the app shows for this brand. */
  productCount: number;
  inStockCount: number;
  /** A representative product photo for the brand card. */
  coverImage: string | null;
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

  /** Whole rupees. */
  price: number;
  /** The pre-sale price when the item is discounted. */
  compareAtPrice: number | null;
  /** Whole-number percent, only when `compareAtPrice` is set. */
  discountPercent: number | null;

  inStock: boolean;
  /** The brand no longer sells it; still shown for saved items and shared links. */
  isRetired: boolean;
  /** The product page on the brand's website. */
  link: string;
  sku: string | null;

  pieceType: PieceType;
  /** "3 Pc" / "Four Piece" / "3 PCS" in the title, as a number; `null` when the title gives none. */
  pieceCount: number | null;
  stitching: Stitching | null;
  color: string | null;
  /** Colour families ("red", "beige"…); the first tints the photo while it loads. */
  colors: string[];
  fabric: string | null;
  /** Sizes that can be bought right now. */
  sizes: string[];

  /** Marketing copy, when the brand writes any. */
  description: string | null;
  /** Shirt / Dupatta / Trouser breakdown, when the brand provides one. */
  components: ProductComponent[];
  /** Loose detail lines that do not belong to a component. */
  highlights: string[];

  /** When ClothHub first saw the product (ISO date). */
  firstSeenAt: string;
};

/* ------------------------------------------------------------------------ */
/*  Listing                                                                 */
/* ------------------------------------------------------------------------ */

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
