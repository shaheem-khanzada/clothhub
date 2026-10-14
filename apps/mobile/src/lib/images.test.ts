import { Image } from 'expo-image';
import { PixelRatio } from 'react-native';

import { PHOTO_HEADERS, PhotoDensity, photoUrl, prefetchPhotos, sizedImageUrl } from './images';

const PHOTO = 'https://cdn.shopify.com/s/files/1/a.jpg?v=17';

describe('sizedImageUrl', () => {
  it('asks the Shopify CDN for a resized copy', () => {
    expect(sizedImageUrl(PHOTO, 600.4)).toBe(`${PHOTO}&width=600`);
    expect(sizedImageUrl('https://saya.pk/cdn/shop/files/a.jpg', 300)).toBe(
      'https://saya.pk/cdn/shop/files/a.jpg?width=300',
    );
  });

  it('leaves other hosts alone', () => {
    expect(sizedImageUrl('https://images.example.com/a.jpg', 600)).toBe('https://images.example.com/a.jpg');
  });
});

describe('photoUrl', () => {
  beforeEach(() => {
    jest.spyOn(PixelRatio, 'get').mockReturnValue(3);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('asks for small views at 2×, even on a 3× screen', () => {
    expect(photoUrl(PHOTO, 180)).toBe(`${PHOTO}&width=360`);
  });

  it('asks for full-screen photos at the screen density', () => {
    expect(photoUrl(PHOTO, 390, PhotoDensity.full)).toBe(`${PHOTO}&width=1200`);
  });

  it('rounds widths up to shared sizes, so similar views share cached files', () => {
    expect(photoUrl(PHOTO, 171)).toBe(`${PHOTO}&width=360`);
    expect(photoUrl(PHOTO, 190)).toBe(`${PHOTO}&width=480`);
  });

  it('never asks for more than the largest size', () => {
    expect(photoUrl(PHOTO, 1366, PhotoDensity.full)).toBe(`${PHOTO}&width=2040`);
  });

  it('uses the screen density when it is lower than the limit', () => {
    jest.spyOn(PixelRatio, 'get').mockReturnValue(1.5);

    expect(photoUrl(PHOTO, 180)).toBe(`${PHOTO}&width=360`);
    expect(photoUrl(PHOTO, 160)).toBe(`${PHOTO}&width=240`);
  });
});

describe('prefetchPhotos', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('warms the disk cache with the same request a view makes', () => {
    const prefetch = jest.spyOn(Image, 'prefetch').mockResolvedValue(true);

    prefetchPhotos(['https://cdn.shopify.com/a.jpg?width=360']);

    expect(prefetch).toHaveBeenCalledWith(['https://cdn.shopify.com/a.jpg?width=360'], {
      cachePolicy: 'disk',
      headers: PHOTO_HEADERS,
    });
  });

  it('does nothing without photos', () => {
    const prefetch = jest.spyOn(Image, 'prefetch');

    prefetchPhotos([]);

    expect(prefetch).not.toHaveBeenCalled();
  });
});
