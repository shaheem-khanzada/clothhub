import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { PixelRatio } from 'react-native';

import { PHOTO_HEADERS, PhotoDensity } from '@/lib/images';

import { ProductImage } from './ProductImage';

const PHOTO = 'https://cdn.shopify.com/s/files/a.jpg';
const THUMBHASH = '1QcSHQRnh493V4dIh4eXh1h4kJUI';

/** What expo-image was asked to load (it normalises `source` to a list). */
function sourceOf(testID: string) {
  const { source } = screen.getByTestId(testID).props;

  return Array.isArray(source) ? source[0] : source;
}

async function display() {
  await act(async () => {
    fireEvent(screen.getByTestId('product-image'), 'display');
  });
}

async function fail() {
  await act(async () => {
    fireEvent(screen.getByTestId('product-image'), 'error', { nativeEvent: { error: 'offline' } });
  });
}

describe('ProductImage', () => {
  beforeEach(() => {
    jest.spyOn(PixelRatio, 'get').mockReturnValue(3);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('sizes', () => {
    it('asks for small views at 2×, asking Shopify for WebP', async () => {
      await render(<ProductImage uri={PHOTO} width={180} />);

      expect(sourceOf('product-image')).toMatchObject({ uri: `${PHOTO}?width=360`, headers: PHOTO_HEADERS });
    });

    it('asks for full-screen photos at the screen density', async () => {
      await render(<ProductImage uri={PHOTO} width={390} density={PhotoDensity.full} />);

      expect(sourceOf('product-image').uri).toBe(`${PHOTO}?width=1200`);
    });
  });

  describe('without a ThumbHash', () => {
    it('shows the silk surface and a tiny blurred preview while the photo loads', async () => {
      await render(<ProductImage uri={PHOTO} width={180} tone="#5E7A5B" />);

      expect(screen.getByTestId('silk-sheen')).toBeOnTheScreen();
      expect(sourceOf('product-image-preview').uri).toBe(`${PHOTO}?width=32`);
      expect(screen.getByTestId('product-image-preview').props.blurRadius).toBeGreaterThan(0);
    });

    it('skips the preview for small thumbnails', async () => {
      await render(<ProductImage uri={PHOTO} width={56} preview={false} />);

      expect(screen.queryByTestId('product-image-preview')).not.toBeOnTheScreen();
      expect(screen.getByTestId('silk-sheen')).toBeOnTheScreen();
    });

    it('keeps the tinted surface, without the preview, when the photo fails', async () => {
      await render(<ProductImage uri={PHOTO} width={180} tone="#8E2F3D" />);

      await fail();

      expect(screen.getByTestId('silk-sheen')).toBeOnTheScreen();
      expect(screen.queryByTestId('product-image-preview')).not.toBeOnTheScreen();
    });
  });

  describe('with a ThumbHash', () => {
    it('shows the outfit at once, with light moving over it, and no download', async () => {
      await render(<ProductImage uri={PHOTO} width={180} thumbhash={THUMBHASH} />);

      // expo-image decodes it on the device from its own `thumbhash:` URI.
      expect(sourceOf('product-image-preview').uri).toBe(`thumbhash:/${THUMBHASH}`);
      expect(screen.getByTestId('glint')).toBeOnTheScreen();
      expect(screen.queryByTestId('silk-sheen')).not.toBeOnTheScreen();
    });

    it('keeps the ThumbHash when the photo fails', async () => {
      await render(<ProductImage uri={PHOTO} width={180} thumbhash={THUMBHASH} />);

      await fail();

      expect(screen.getByTestId('product-image-preview')).toBeOnTheScreen();
      expect(screen.queryByTestId('glint')).not.toBeOnTheScreen();
    });
  });

  describe('with a copy already shown elsewhere', () => {
    it('starts from the cached copy instead of anything blurred', async () => {
      await render(
        <ProductImage
          uri={PHOTO}
          width={390}
          density={PhotoDensity.full}
          thumbhash={THUMBHASH}
          placeholderUri={`${PHOTO}?width=360`}
        />,
      );

      expect(sourceOf('product-image-preview').uri).toBe(`${PHOTO}?width=360`);
      expect(screen.getByTestId('product-image-preview').props.blurRadius).toBeUndefined();
      expect(screen.queryByTestId('glint')).not.toBeOnTheScreen();
    });
  });

  it('lets everything go once the photo is on screen', async () => {
    await render(<ProductImage uri={PHOTO} width={180} thumbhash={THUMBHASH} />);

    await display();

    expect(screen.queryByTestId('product-image-preview')).not.toBeOnTheScreen();
    expect(screen.queryByTestId('glint')).not.toBeOnTheScreen();
    expect(screen.queryByTestId('silk-sheen')).not.toBeOnTheScreen();
    expect(screen.getByTestId('product-image')).toBeOnTheScreen();
  });

  it('starts loading again when a recycled cell gets a new photo', async () => {
    const { rerender } = await render(<ProductImage uri={PHOTO} width={180} />);

    await display();
    expect(screen.queryByTestId('silk-sheen')).not.toBeOnTheScreen();

    await rerender(<ProductImage uri="https://cdn.shopify.com/s/files/b.jpg" width={180} />);

    expect(screen.getByTestId('silk-sheen')).toBeOnTheScreen();
  });

  it('shows only the surface when there is no photo', async () => {
    await render(<ProductImage uri={null} width={180} tone="#4A6489" />);

    expect(screen.getByTestId('silk-sheen')).toBeOnTheScreen();
    expect(screen.queryByTestId('product-image')).not.toBeOnTheScreen();
    expect(screen.queryByTestId('product-image-preview')).not.toBeOnTheScreen();
  });
});
