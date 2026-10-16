import Image, { type StaticImageData } from 'next/image';

import { cx } from '@/lib/cx';

type PhotoProps = {
  src: StaticImageData;
  /** The rendered width, for the browser to pick a file: "282px". */
  sizes: string;
  /** CSS object-position. The default keeps the face and neckline of a model shot in frame. */
  position?: string;
  /** For photos visible on first paint. */
  eager?: boolean;
  className?: string;
};

/**
 * A product or brand photo that fills its parent (which must be positioned and
 * give it a size), cropped like the app does.
 */
export function Photo({ src, sizes, position = '50% 12%', eager = false, className }: PhotoProps) {
  return (
    <Image
      src={src}
      alt=""
      fill
      sizes={sizes}
      placeholder="blur"
      loading={eager ? 'eager' : 'lazy'}
      className={cx('object-cover', className)}
      style={{ objectPosition: position }}
    />
  );
}
