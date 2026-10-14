import sharp from 'sharp';
import { rgbaToThumbHash } from 'thumbhash';

/** ThumbHash encodes images of at most this many pixels on each side. */
export const THUMBHASH_MAX_SIZE = 100;

/**
 * A photo → its ThumbHash, base64-encoded: ~25 bytes the app decodes into a
 * soft, correctly coloured preview of the outfit (expo-image `placeholder`).
 *
 * Accepts any format sharp reads (JPEG, PNG, WebP, AVIF); the input should
 * already be small — the job asks the CDN for a 100px copy.
 */
export async function thumbHashOf(image: Uint8Array): Promise<string> {
  const { data, info } = await sharp(image)
    .resize(THUMBHASH_MAX_SIZE, THUMBHASH_MAX_SIZE, { fit: 'inside' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  return Buffer.from(rgbaToThumbHash(info.width, info.height, data)).toString('base64');
}
