import { describe, expect, it } from 'vitest';

import {
  colorFamilyOf,
  displayNameFrom,
  fabricFrom,
  normalizeSize,
  pieceCountFrom,
  pieceTypeOf,
  shortNameFrom,
  skuFrom,
  stitchingFrom,
} from './attributes.js';

describe('pieceCountFrom', () => {
  it.each([
    ['Unstitched Printed Lawn 3 Piece', 3],
    ['AJMRW-19 Premium Blended Stitched 2PC', 2],
    ['Embroidered - 3 Pc Slub Karandi Suit', 3],
    ['Four Piece Bridal Set', 4],
    ['01 Piece Ready to wear Fancy Dupatta', 1],
    ['2-Piece Jacquard Suit', 2],
  ])('reads "%s" as %i', (title, count) => {
    expect(pieceCountFrom(title)).toBe(count);
  });

  it('falls back to later texts (type, tags) when the title has no count', () => {
    expect(pieceCountFrom('Rose', '3 Piece', null)).toBe(3);
  });

  it('returns null when nothing has a count', () => {
    expect(pieceCountFrom('Embroidered Kurta', null)).toBeNull();
  });
});

describe('pieceTypeOf', () => {
  it('groups counts into the filter types', () => {
    expect(pieceTypeOf(4)).toBe('threePiece');
    expect(pieceTypeOf(3)).toBe('threePiece');
    expect(pieceTypeOf(2)).toBe('twoPiece');
    expect(pieceTypeOf(1)).toBe('single');
    expect(pieceTypeOf(null)).toBe('single');
  });
});

describe('stitchingFrom', () => {
  it.each([
    ['2 Piece Khaddar Paste Suit (Unstitched)', 'unstitched'],
    ['Woman Un-Stitched Lawn', 'unstitched'],
    ['Luxury Pret', 'stitched'],
    ['Ready to Wear Kurta', 'stitched'],
    ['Premium Blended Stitched 2PC', 'stitched'],
    ['Cotton Kurta', null],
  ])('reads "%s" as %s', (text, expected) => {
    expect(stitchingFrom(text)).toBe(expected);
  });
});

describe('fabricFrom', () => {
  it('finds the fabric in the first text that names one', () => {
    expect(fabricFrom('Embroidered Chiffon 3 Pcs')).toBe('Chiffon');
    expect(fabricFrom('Rose', 'Unstitched | Khaddar')).toBe('Khaddar');
  });

  it('prefers compound fabrics', () => {
    expect(fabricFrom('Raw Silk Kurta')).toBe('Raw Silk');
  });

  it('does not match a fabric inside another word', () => {
    expect(fabricFrom('Planet Print Kurta')).toBeNull();
  });
});

describe('colorFamilyOf', () => {
  it.each([
    ['Navy Blue', 'blue'],
    ['Off White', 'beige'],
    ['Tea Pink', 'pink'],
    ['Maroon', 'red'],
    ['Mustard', 'yellow'],
    ['Bottle Green', 'green'],
    ['Black', 'black'],
    ['Multi', 'multi'],
    ['Zarqoon', null],
  ])('maps %s to %s', (color, family) => {
    expect(colorFamilyOf(color)).toBe(family);
  });
});

describe('normalizeSize', () => {
  it.each([
    ['Medium', 'M'],
    ['Small', 'S'],
    ['X-Small', 'XS'],
    ['X-Large', 'XL'],
    ['XXL', 'XXL'],
    ['ML', 'M/L'],
    ['5-6Y', '5-6Y'],
    ['5-6 Y', '5-6Y'],
    ['09-10Y', '9-10Y'],
    ['6-12 Months', '6-12M'],
    ['36', '36'],
    ['30ml', '30ml'],
  ])('normalises %s to %s', (label, size) => {
    expect(normalizeSize(label)).toBe(size);
  });

  it.each(['UNSTITCHED', 'Default Title', '', null])('treats %s as no size', (label) => {
    expect(normalizeSize(label)).toBeNull();
  });
});

describe('displayNameFrom and shortNameFrom', () => {
  it('moves a leading article code to the end and title-cases the name', () => {
    expect(displayNameFrom('AJCR-04 EMBROIDERED CHIFFON 3 PCS')).toBe('Embroidered Chiffon 3 Pcs (AJCR-04)');
  });

  it('title-cases shouting titles', () => {
    expect(displayNameFrom('CANDY COLOR')).toBe('Candy Color');
  });

  it('keeps ordinary titles as written', () => {
    expect(displayNameFrom('2 Piece Jacquard Suit- Embroidered (Pret)')).toBe(
      '2 Piece Jacquard Suit- Embroidered (Pret)',
    );
  });

  it('drops the piece count from the short name', () => {
    expect(shortNameFrom('Embroidered Chiffon 3 Pcs (AJCR-04)')).toBe('Embroidered Chiffon (AJCR-04)');
    expect(shortNameFrom('Unstitched Printed Lawn 3 Piece')).toBe('Unstitched Printed Lawn');
  });

  it('keeps a name that is only a count', () => {
    expect(shortNameFrom('3 Pcs')).toBe('3 Pcs');
  });
});

describe('skuFrom', () => {
  it('takes the product code from a variant SKU without its size', () => {
    expect(skuFrom('ajmrw-19-premium', 'AJMRW-19-XS')).toBe('AJMRW-19');
    expect(skuFrom('kurta', 'KT-2201-5-6Y')).toBe('KT-2201');
  });

  it('falls back to a handle that looks like a code', () => {
    expect(skuFrom('u4807st-2pc-419', null)).toBe('u4807st-2pc-419');
    expect(skuFrom('lavender', null)).toBeNull();
  });
});
