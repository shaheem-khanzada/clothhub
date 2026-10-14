import { describe, expect, it } from 'vitest';

import { parseDescription } from './describe.js';

describe('parseDescription', () => {
  it('splits a Saya-style description into facts, copy and parts', () => {
    const raw = [
      'Design: SP-12875 (P16-25189-05BA 2Pcs) S+T',
      'Color: Green',
      'Fabric: Lawn',
      '',
      'Product Detail',
      '',
      'Elevate Your Daily Summer Wardrobe With This SAYA Printed Lawn Stitched 2 Piece Shirt Trouser. The Breathable Lawn Fabric Features Vibrant Prints.',
      '',
      'Shirt',
      'Ready To Wear Lawn Stitched Shirt.',
      '',
      'Trouser',
      'Ready To Wear Stitched Trouser.',
      '',
      'Disclaimer: These Images Are For Illustrative Purpose, Actual Color Of Product May Slight Vary.',
    ].join('\n');

    expect(parseDescription(raw, 'Printed Lawn Stitched 2 Piece (Shirt/Trouser)')).toEqual({
      description:
        'Elevate Your Daily Summer Wardrobe With This SAYA Printed Lawn Stitched 2 Piece Shirt Trouser. The Breathable Lawn Fabric Features Vibrant Prints.',
      components: [
        { label: 'Shirt', lines: ['Ready To Wear Lawn Stitched Shirt.'] },
        { label: 'Trouser', lines: ['Ready To Wear Stitched Trouser.'] },
      ],
      highlights: [],
      color: 'Green',
      fabric: 'Lawn',
    });
  });

  it('keeps a one-line description as the description, however short', () => {
    expect(parseDescription('Digitally Printed Lawn Shirt Digitally Printed Lawn Dupatta', 'Shirt Dupatta')).toMatchObject({
      description: 'Digitally Printed Lawn Shirt Digitally Printed Lawn Dupatta',
      highlights: [],
    });
  });

  it('turns short lines after a features marker into highlights', () => {
    const raw = [
      'Stay effortlessly cool in the boxy crewneck tee, a versatile wardrobe essential with a relaxed fit.',
      'Feature',
      'Boxy Fit With Clean Crewneck Styling',
      'Soft, Breathable Fabric For Everyday Comfort',
    ].join('\n');

    expect(parseDescription(raw, 'Boxy Crewneck Tee Shirt').highlights).toEqual([
      'Boxy Fit With Clean Crewneck Styling',
      'Soft, Breathable Fabric For Everyday Comfort',
    ]);
  });

  it('keeps other key-value facts as highlights', () => {
    const parsed = parseDescription('Fragrance Family: Citrus\n\nType: Perfume\n\nIntensity: Mild', 'Aries');

    expect(parsed.highlights).toEqual(['Fragrance Family: Citrus', 'Type: Perfume', 'Intensity: Mild']);
  });

  it('drops lines that only repeat the title', () => {
    expect(parseDescription('Embroidered Lawn Kurta\nShort fact', 'Embroidered Lawn Kurta').highlights).toEqual([
      'Short fact',
    ]);
  });

  it('repairs broken apostrophes and dashes', () => {
    expect(parseDescription('Add sophistication to your child�s look � crafted from cotton.', 'x').description).toBe(
      'Add sophistication to your child’s look – crafted from cotton.',
    );
  });

  it('returns nothing for an empty description', () => {
    expect(parseDescription(null, 'x')).toEqual({
      description: null,
      components: [],
      highlights: [],
      color: null,
      fabric: null,
    });
  });
});
