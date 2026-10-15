import { sizedImageUrl } from '@clothhub/shared';
import { Image } from 'expo-image';
import { PixelRatio } from 'react-native';

export { sizedImageUrl };

/**
 * How sharp a photo has to be. On a 3× screen a card or thumbnail looks the
 * same at 2× and costs about half the bytes; a full-screen photo uses the
 * screen's own density.
 */
export const PhotoDensity = {
  compact: 2,
  full: Number.POSITIVE_INFINITY,
} as const;

export type PhotoDensityLimit = (typeof PhotoDensity)[keyof typeof PhotoDensity];

/**
 * Widths are rounded up to a multiple of this, so views of about the same
 * size ask for — and share — the same cached file.
 */
const WIDTH_STEP = 120;
const MAX_WIDTH = 2_040;

/**
 * Sent with every photo request. Shopify picks the format from the request,
 * and WebP is usually a quarter to a third smaller than the JPEG.
 */
export const PHOTO_HEADERS = { Accept: 'image/webp,image/*;q=0.8' } as const;

/**
 * The URL to load a product photo shown `points` wide. The only place photo
 * sizes are decided: components and prefetching both call this, so a
 * prefetched photo is exactly the file a view asks for later.
 */
export function photoUrl(url: string, points: number, density: PhotoDensityLimit = PhotoDensity.compact): string {
  const pixels = points * Math.min(PixelRatio.get(), density);
  const width = Math.min(MAX_WIDTH, Math.ceil(pixels / WIDTH_STEP) * WIDTH_STEP);

  return sizedImageUrl(url, width);
}

/**
 * Downloads photos into the disk cache ahead of time. Best effort: a photo
 * that fails here simply loads when it is shown. Disk only, so photos that
 * are not on screen yet never take memory.
 */
export function prefetchPhotos(urls: string[]): void {
  if (urls.length === 0) {
    return;
  }

  Image.prefetch(urls, { cachePolicy: 'disk', headers: PHOTO_HEADERS }).catch(() => {
    // Nothing to do: the view loads the photo itself.
  });
}
