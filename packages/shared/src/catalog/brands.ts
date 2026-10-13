import { z } from 'zod';

export const BrandSchema = z
  .object({
    id: z.uuid(),
    slug: z.string(),
    name: z.string(),
    /** The brand's own shop, opened from the brand screen. */
    website: z.url(),
    logoUrl: z.url().nullable(),
    /** Products the app can show for this brand (current scope: women's clothing). */
    productCount: z.int().nonnegative(),
    /** How many of those are in stock right now. */
    inStockCount: z.int().nonnegative(),
    /** A recent, well-photographed product image for the brand card. */
    coverImageUrl: z.url().nullable(),
  })
  .meta({ id: 'Brand' });

export type BrandResponse = z.infer<typeof BrandSchema>;

export const BrandListResponseSchema = z
  .object({
    brands: z.array(BrandSchema),
  })
  .meta({ id: 'BrandList' });

export type BrandListResponse = z.infer<typeof BrandListResponseSchema>;

export const BrandParamsSchema = z.object({
  brandId: z.uuid().meta({ description: 'Brand id' }),
});
