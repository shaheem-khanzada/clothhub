import { z } from 'zod';

/* ------------------------------------------------------------------------ */
/*  Vocabulary                                                              */
/* ------------------------------------------------------------------------ */

/** How many pieces an outfit comes in; drives the "Type" filter. */
export const PieceTypeSchema = z.enum(['threePiece', 'twoPiece', 'single']);
export type PieceType = z.infer<typeof PieceTypeSchema>;

export const StitchingSchema = z.enum(['stitched', 'unstitched']);
export type Stitching = z.infer<typeof StitchingSchema>;

export const ProductCategorySchema = z.enum([
  'clothing',
  'unstitched',
  'accessories',
  'jewelry',
  'bags',
  'footwear',
  'home',
  'beauty',
  'fragrance',
]);
export type ProductCategory = z.infer<typeof ProductCategorySchema>;

export const ProductSortSchema = z.enum(['featured', 'priceAsc', 'priceDesc', 'newest', 'oldest']);
export type ProductSort = z.infer<typeof ProductSortSchema>;

/* ------------------------------------------------------------------------ */
/*  Product                                                                 */
/* ------------------------------------------------------------------------ */

export const ProductImageSchema = z
  .object({
    url: z.url(),
    width: z.int().positive().nullable(),
    height: z.int().positive().nullable(),
    /**
     * ThumbHash (base64) of the photo: a ~25-byte blurred preview the app
     * decodes on the device, so a card shows the outfit before any download.
     * Generated for covers (the first image) after import; null until then.
     */
    thumbhash: z.string().nullable(),
  })
  .meta({ id: 'ProductImage' });

export type ProductImage = z.infer<typeof ProductImageSchema>;

export const ProductSizeSchema = z
  .object({
    /** Normalised label: "S", "M", "5-6Y", "38". */
    label: z.string(),
    inStock: z.boolean(),
  })
  .meta({ id: 'ProductSize' });

export type ProductSize = z.infer<typeof ProductSizeSchema>;

/** One part of an outfit — "Shirt", with the lines the brand wrote about it. */
export const ProductComponentSchema = z
  .object({
    label: z.string(),
    lines: z.array(z.string()),
  })
  .meta({ id: 'ProductComponent' });

export type ProductComponent = z.infer<typeof ProductComponentSchema>;

export const ProductSchema = z
  .object({
    id: z.uuid(),
    brand: z.object({
      id: z.uuid(),
      slug: z.string(),
      name: z.string(),
    }),

    /** Display name, e.g. "Embroidered Chiffon 3 Pcs (AJCR-04)". */
    name: z.string(),
    /** The display name without its piece count, for places that show the count separately. */
    shortName: z.string(),
    /** The brand's own title, unchanged. */
    title: z.string(),
    /** The brand's article code, when it has one. */
    sku: z.string().nullable(),

    images: z.array(ProductImageSchema),

    /** Whole rupees. */
    price: z.int().nonnegative(),
    /** Highest variant price, when variants differ. */
    priceMax: z.int().nonnegative(),
    /** Pre-sale price; only set when it is higher than `price`. */
    compareAtPrice: z.int().positive().nullable(),
    /** Whole-number percent, only set with `compareAtPrice`. */
    discountPercent: z.int().min(1).max(99).nullable(),
    currency: z.string().length(3),

    inStock: z.boolean(),
    /** No longer sold by the brand; kept so saved items and shared links still open. */
    isRetired: z.boolean(),
    /** The product page on the brand's website. */
    url: z.url(),

    category: ProductCategorySchema,
    pieceType: PieceTypeSchema,
    pieceCount: z.int().min(1).max(4).nullable(),
    stitching: StitchingSchema.nullable(),
    fabric: z.string().nullable(),
    color: z.string().nullable(),
    /** Colour families ("red", "beige", "multi"…) — for filters and for tinting a photo while it loads. */
    colors: z.array(z.string()),
    sizes: z.array(ProductSizeSchema),

    description: z.string().nullable(),
    components: z.array(ProductComponentSchema),
    highlights: z.array(z.string()),

    /** When ClothHub first saw the product — what "newest" sorts by. */
    firstSeenAt: z.iso.datetime(),
  })
  .meta({ id: 'Product' });

export type ProductResponse = z.infer<typeof ProductSchema>;

export const ProductParamsSchema = z.object({
  productId: z.uuid().meta({ description: 'Product id' }),
});

/* ------------------------------------------------------------------------ */
/*  Listing                                                                 */
/* ------------------------------------------------------------------------ */

export const PRODUCT_PAGE_SIZE_DEFAULT = 20;
export const PRODUCT_PAGE_SIZE_MAX = 50;

/** Query string of `GET /v1/products`. Every value arrives as a string. */
export const ProductListQuerySchema = z.object({
  brandId: z.uuid().optional().meta({ description: 'Only this brand' }),
  sort: ProductSortSchema.default('featured'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(PRODUCT_PAGE_SIZE_MAX)
    .default(PRODUCT_PAGE_SIZE_DEFAULT),
  q: z.string().trim().max(100).optional().meta({ description: 'Search text' }),
  minPrice: z.coerce.number().int().min(0).optional().meta({ description: 'Whole rupees' }),
  maxPrice: z.coerce.number().int().min(0).optional().meta({ description: 'Whole rupees' }),
  pieceType: PieceTypeSchema.optional(),
  inStock: z.stringbool().optional().meta({ description: 'Only products in stock' }),
  onSale: z.stringbool().optional().meta({ description: 'Only discounted products' }),
});

export type ProductListQuery = z.output<typeof ProductListQuerySchema>;

/** What the filter sheet can offer, independent of the filters currently applied. */
export const ProductFacetsSchema = z
  .object({
    minPrice: z.int().nonnegative(),
    maxPrice: z.int().nonnegative(),
    pieceTypes: z.array(PieceTypeSchema),
  })
  .meta({ id: 'ProductFacets' });

export type ProductFacets = z.infer<typeof ProductFacetsSchema>;

export const ProductPageResponseSchema = z
  .object({
    products: z.array(ProductSchema),
    page: z.int().min(1),
    limit: z.int().min(1),
    total: z.int().nonnegative(),
    facets: ProductFacetsSchema,
  })
  .meta({ id: 'ProductPage' });

export type ProductPageResponse = z.infer<typeof ProductPageResponseSchema>;
