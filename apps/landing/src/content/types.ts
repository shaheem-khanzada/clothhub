import type { StaticImageData } from 'next/image';

export type Size = {
  label: string;
  inStock: boolean;
};

/** A product as the page shows it — a small slice of the API's ProductResponse. */
export type Product = {
  name: string;
  brand: string;
  /** In rupees. */
  price: number;
  image: StaticImageData;
  /** The product page on the brand's own site. */
  url: string;
  colour: string;
  // Only the product shown with its detail card needs these.
  fabric?: string;
  sizes?: Size[];
  description?: string;
};

export type Brand = {
  name: string;
  productCount: number;
  cover: StaticImageData;
  /** CSS object-position for the cover; defaults to keeping the top of the photo. */
  coverPosition?: string;
};
