/**
 * Asks Shopify's CDN for a resized copy of a product photo.
 *
 * Every brand in the catalog serves images from Shopify — `cdn.shopify.com`
 * or the shop's own `/cdn/shop/` path — and both resize on the fly from a
 * `width` query param. A grid cell does not need the 2000px original, and on
 * a phone network that difference is the whole scroll experience. Other
 * hosts are returned untouched.
 */
export function sizedImageUrl(url: string, width: number): string {
  if (!url.includes('cdn.shopify.com/') && !url.includes('/cdn/shop/')) {
    return url;
  }

  const separator = url.includes('?') ? '&' : '?';

  return `${url}${separator}width=${Math.round(width)}`;
}
