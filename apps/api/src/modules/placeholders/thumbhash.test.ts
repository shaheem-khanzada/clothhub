import sharp from 'sharp';
import { thumbHashToAverageRGBA } from 'thumbhash';
import { describe, expect, it } from 'vitest';

import { thumbHashOf } from './thumbhash.js';

/** A solid-colour photo, the shape of a product shot. */
function photo(colour: { r: number; g: number; b: number }, format: 'jpeg' | 'png' | 'webp') {
  return sharp({ create: { width: 300, height: 400, channels: 3, background: colour } })
    .toFormat(format)
    .toBuffer();
}

describe('thumbHashOf', () => {
  it('encodes a photo as a short base64 ThumbHash', async () => {
    const hash = await thumbHashOf(await photo({ r: 120, g: 40, b: 60 }, 'jpeg'));

    expect(hash).toMatch(/^[A-Za-z0-9+/]+=*$/);
    expect(hash.length).toBeLessThanOrEqual(64);
  });

  it('keeps the colour of the outfit', async () => {
    const hash = await thumbHashOf(await photo({ r: 120, g: 40, b: 60 }, 'png'));
    const average = thumbHashToAverageRGBA(Buffer.from(hash, 'base64'));

    expect(average.r * 255).toBeCloseTo(120, -1);
    expect(average.g * 255).toBeCloseTo(40, -1);
    expect(average.b * 255).toBeCloseTo(60, -1);
  });

  it('reads the formats the CDN may answer with', async () => {
    await expect(thumbHashOf(await photo({ r: 10, g: 200, b: 90 }, 'webp'))).resolves.toBeTruthy();
  });

  it('rejects something that is not an image', async () => {
    await expect(thumbHashOf(new TextEncoder().encode('<html>Not found</html>'))).rejects.toThrow();
  });
});
