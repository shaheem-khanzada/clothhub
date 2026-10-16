/**
 * Catalogue size: the brand count and the sums of productCount / inStockCount
 * from the API's /v1/brands (16 Oct 2026). The page rounds these down
 * ("120k+"), so refresh them before launch and now and then after.
 */
export const catalogue = {
  brandCount: 78,
  productCount: 123_836,
  inStockCount: 41_341,
};

export type Link = {
  label: string;
  href: string;
};

export const navLinks: Link[] = [
  { label: 'How it works', href: '#reel' },
  { label: 'Brands', href: '#brands' },
  { label: 'What’s next', href: '#next' },
];

// TODO: point these at the real pages once they exist.
export const footerLinks: Link[] = [
  { label: 'Privacy policy', href: '#' },
  { label: 'Help & feedback', href: '#' },
  { label: 'Contact', href: '#' },
];
