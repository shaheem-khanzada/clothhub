import { randomFillSync } from 'node:crypto';

/**
 * UUIDv7: a 48-bit millisecond timestamp followed by random bits. Ids sort by
 * creation time, so new rows append to the end of the primary-key index
 * instead of landing at random pages (unlike UUIDv4).
 */
export function uuidv7(now: number = Date.now()): string {
  const bytes = randomFillSync(new Uint8Array(16));

  // 48-bit big-endian timestamp.
  let time = now;
  for (let i = 5; i >= 0; i -= 1) {
    bytes[i] = time % 256;
    time = Math.floor(time / 256);
  }

  bytes[6] = (bytes[6]! & 0x0f) | 0x70; // version 7
  bytes[8] = (bytes[8]! & 0x3f) | 0x80; // RFC 4122 variant

  const hex = Buffer.from(bytes).toString('hex');

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
