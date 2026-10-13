const priceFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
});

/** "Rs 5,620" — the way Pakistani brand sites print prices. */
export function formatPrice(value: number): string {
  return `Rs ${priceFormatter.format(value)}`;
}
