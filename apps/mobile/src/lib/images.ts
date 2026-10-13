/**
 * Asks a Shopify CDN for a resized copy of a product photo.
 *
 * Every brand in the catalog today serves images from Shopify (`/cdn/shop/`),
 * which resizes on the fly from a `width` query param. A grid cell does not
 * need the 2000px original, and on a phone network that difference is the
 * whole scroll experience. Other hosts are returned untouched.
 */
export function sizedImageUrl(url: string, width: number): string {
  if (!url.includes('/cdn/shop/')) {
    return url;
  }

  const separator = url.includes('?') ? '&' : '?';

  return `${url}${separator}width=${Math.round(width)}`;
}
