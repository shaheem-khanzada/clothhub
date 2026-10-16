const numberFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

/** "Rs 45,900" — the same format as the app (apps/mobile/src/lib/formatters.ts). */
export function formatPrice(value: number): string {
  return `Rs ${numberFormatter.format(value)}`;
}

/** "1,941 products" */
export function formatProductCount(count: number): string {
  return `${numberFormatter.format(count)} ${count === 1 ? 'product' : 'products'}`;
}

/**
 * 123,836 → "120k+", 41,341 → "41k+". Rounded down, so the claim stays true as
 * the catalogue moves.
 */
export function formatApproxCount(value: number): string {
  if (value < 1_000) {
    return String(value);
  }

  const step = value >= 100_000 ? 10_000 : 1_000;
  return `${(Math.floor(value / step) * step) / 1_000}k+`;
}

/** "https://hussainrehar.com/products/rin" → "hussainrehar.com/products/rin" */
export function displayUrl(url: string): string {
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
}
