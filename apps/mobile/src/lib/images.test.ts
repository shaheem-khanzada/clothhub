import { sizedImageUrl } from './images';

describe('sizedImageUrl', () => {
  it('asks the Shopify CDN for a resized copy', () => {
    expect(sizedImageUrl('https://cdn.shopify.com/s/files/1/a.jpg?v=17', 600.4)).toBe(
      'https://cdn.shopify.com/s/files/1/a.jpg?v=17&width=600',
    );
    expect(sizedImageUrl('https://saya.pk/cdn/shop/files/a.jpg', 300)).toBe(
      'https://saya.pk/cdn/shop/files/a.jpg?width=300',
    );
  });

  it('leaves other hosts alone', () => {
    expect(sizedImageUrl('https://images.example.com/a.jpg', 600)).toBe('https://images.example.com/a.jpg');
  });
});
