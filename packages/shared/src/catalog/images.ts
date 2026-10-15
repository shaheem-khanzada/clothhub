/**
 * Asks Shopify's CDN for a resized copy of a product photo.
 *
 * Every brand in the catalog serves images from Shopify — `cdn.shopify.com`
 * or the shop's own `/cdn/shop/` path — and both resize on the fly from a
 * `width` query param. Other hosts are returned untouched.
 *
 * Shared because both sides ask for sizes: the app for what it shows, the
 * API for the tiny copy it turns into a ThumbHash.
 */
export function sizedImageUrl(url: string, width: number): string {
  if (!url.includes('cdn.shopify.com/') && !url.includes('/cdn/shop/')) {
    return url;
  }

  const separator = url.includes('?') ? '&' : '?';

  return `${url}${separator}width=${Math.round(width)}`;
}
