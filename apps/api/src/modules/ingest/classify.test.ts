import { describe, expect, it } from 'vitest';

import {
  brandAudienceFromCounts,
  classifyAudience,
  classifyCategory,
  effectiveAudience,
  type ProductText,
} from './classify.js';

function product(overrides: Partial<ProductText>): ProductText {
  return { type: null, tags: [], title: '', handle: '', ...overrides };
}

describe('classifyAudience', () => {
  it.each([
    [{ tags: ['2 Pcs', 'Men', 'Stitched'], title: 'AJMRW-19 Premium Blended Stitched 2PC' }, 'men'],
    [{ type: 'Women Unstitched', title: 'Printed Lawn 3 Piece' }, 'women'],
    [{ type: 'Woman Un Stitched Allure Lawn', title: 'Allure Lawn' }, 'women'],
    [{ type: 'Boys', title: 'Boys T Shirt' }, 'kids'],
    [{ type: 'KidsClothes', title: 'Frock' }, 'kids'],
    [{ type: 'WomenUnstitched', title: 'Rose' }, 'women'],
    [{ type: 'WomensClothing', title: 'Rose' }, 'women'],
    [{ title: 'Stitched Cotton Jacquard Shirt/trouser For Kids' }, 'kids'],
    [{ title: 'Printed Shirt', handle: 'girls-printed-shirt-5-6y' }, 'kids'],
    [{ tags: ['Perfumes'], title: 'Aries WATER For Unisex' }, 'unisex'],
    [{ tags: ['Men', 'Women'], title: 'Cotton Socks' }, 'unisex'],
  ] as const)('reads %o as %s', (input, expected) => {
    expect(classifyAudience(product(input))).toBe(expected);
  });

  it('trusts tags over a title that mentions another audience', () => {
    expect(
      classifyAudience(product({ tags: ['Women'], title: 'Mother & Daughter Lawn Kurta for girls' })),
    ).toBe('women');
  });

  it('treats garments sold to women as women when nothing else says', () => {
    expect(classifyAudience(product({ title: 'Embroidered Chiffon Dupatta' }))).toBe('women');
    expect(classifyAudience(product({ type: 'Kurti', title: 'Rose' }))).toBe('women');
    expect(classifyAudience(product({ type: 'Dresses', title: 'Midnight' }))).toBe('women');
  });

  it("lets a menswear or kidswear brand outrank a garment word", () => {
    expect(classifyAudience(product({ title: 'Lawn Kurta' }), 'men')).toBe('unknown');
    expect(classifyAudience(product({ title: 'Party Dress' }), 'kids')).toBe('unknown');
    expect(classifyAudience(product({ title: 'Party Dress' }), 'women')).toBe('women');
  });

  it('does not read dress shirts and dress pants as women\'s', () => {
    expect(classifyAudience(product({ type: 'dress shirts', title: 'DRESS SHIRT BLUE' }))).toBe('unknown');
    expect(classifyAudience(product({ title: 'Expandable Dress Pant' }))).toBe('unknown');
  });

  it('does not read "women" as "men"', () => {
    expect(classifyAudience(product({ type: "Women's RTW", title: 'Kurta' }))).toBe('women');
  });

  it('returns unknown when nothing in the text says', () => {
    expect(classifyAudience(product({ type: 'Printed', title: 'Shirt Trouser' }))).toBe('unknown');
  });
});

describe('effectiveAudience', () => {
  it('keeps a product audience the product states', () => {
    expect(effectiveAudience('men', 'women')).toBe('men');
  });

  it('inherits the brand audience when the product says nothing', () => {
    expect(effectiveAudience('unknown', 'women')).toBe('women');
    expect(effectiveAudience('unknown', 'mixed')).toBe('unknown');
  });
});

describe('classifyCategory', () => {
  it.each([
    [{ type: 'Fragrances', tags: ['Perfumes'], title: 'Aries WATER For Unisex' }, 'fragrance'],
    [{ type: 'Cross-Body Bags', title: 'Cross-Body Bags - E407' }, 'bags'],
    [{ type: 'Jewelry', title: 'Kundan Earrings' }, 'jewelry'],
    [{ title: 'Embellished Khussa', handle: 'embellished-khussa' }, 'footwear'],
    [{ type: 'Ideas Home', title: 'Cushion Cover' }, 'home'],
    [{ type: 'Unstitched', title: '2 Piece Khaddar Paste Suit (Unstitched)' }, 'unstitched'],
    [{ type: 'Woman Un Stitched', title: 'Allure Lawn' }, 'unstitched'],
    [{ type: 'Kurta', title: 'Embroidered Kurta' }, 'clothing'],
  ] as const)('reads %o as %s', (input, expected) => {
    expect(classifyCategory(product(input))).toBe(expected);
  });

  it.each([
    'Cream Embroidered Kurta',
    'Tie Dye Kurti',
    'Cap Sleeve Maxi',
    'Belted Shirt Dress',
  ])('keeps "%s" as clothing — colour and detail words are not categories', (title) => {
    expect(classifyCategory(product({ title }))).toBe('clothing');
  });
});

describe('brandAudienceFromCounts', () => {
  it('is women when nine in ten labelled products are for women', () => {
    expect(brandAudienceFromCounts({ women: 95, kids: 5, unknown: 400 })).toBe('women');
  });

  it('is mixed when a brand sells to several audiences', () => {
    expect(brandAudienceFromCounts({ women: 47, men: 29, kids: 24 })).toBe('mixed');
  });

  it('detects menswear and kidswear brands', () => {
    expect(brandAudienceFromCounts({ men: 200 })).toBe('men');
    expect(brandAudienceFromCounts({ kids: 120, women: 2 })).toBe('kids');
  });

  it('stays mixed until enough products say who they are for', () => {
    expect(brandAudienceFromCounts({ women: 5 })).toBe('mixed');
  });
});
