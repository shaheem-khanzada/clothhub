import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { PixelRatio } from 'react-native';

import { ProductImage } from './ProductImage';

const PHOTO = 'https://cdn.shopify.com/s/files/a.jpg';

/** The URL expo-image was asked to load (it normalises `source` to a list). */
function sourceOf(testID: string): string {
  const { source } = screen.getByTestId(testID).props;

  return Array.isArray(source) ? source[0].uri : source.uri;
}

describe('ProductImage', () => {
  beforeEach(() => {
    jest.spyOn(PixelRatio, 'get').mockReturnValue(3);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows the silk surface while the photo loads', async () => {
    await render(<ProductImage uri={PHOTO} width={180} tone="#5E7A5B" />);

    expect(screen.getByTestId('silk-sheen')).toBeOnTheScreen();
    expect(screen.getByTestId('product-image')).toBeOnTheScreen();
  });

  it('asks the CDN for a full copy at screen density and a tiny blurred preview', async () => {
    await render(<ProductImage uri={PHOTO} width={180} />);

    expect(sourceOf('product-image')).toBe(`${PHOTO}?width=540`);
    expect(sourceOf('product-image-preview')).toBe(`${PHOTO}?width=32`);
    expect(screen.getByTestId('product-image-preview').props.blurRadius).toBeGreaterThan(0);
  });

  it('skips the preview for small thumbnails', async () => {
    await render(<ProductImage uri={PHOTO} width={56} preview={false} />);

    expect(screen.queryByTestId('product-image-preview')).not.toBeOnTheScreen();
    expect(screen.getByTestId('silk-sheen')).toBeOnTheScreen();
  });

  it('lets the surface go once the photo is on screen', async () => {
    await render(<ProductImage uri={PHOTO} width={180} />);

    await act(async () => {
      fireEvent(screen.getByTestId('product-image'), 'display');
    });

    expect(screen.queryByTestId('silk-sheen')).not.toBeOnTheScreen();
    expect(screen.getByTestId('product-image')).toBeOnTheScreen();
  });

  it('keeps the tinted surface, without the preview, when the photo fails', async () => {
    await render(<ProductImage uri={PHOTO} width={180} tone="#8E2F3D" />);

    await act(async () => {
      fireEvent(screen.getByTestId('product-image'), 'error', { nativeEvent: { error: 'offline' } });
    });

    expect(screen.getByTestId('silk-sheen')).toBeOnTheScreen();
    expect(screen.queryByTestId('product-image-preview')).not.toBeOnTheScreen();
  });

  it('starts loading again when a recycled cell gets a new photo', async () => {
    const { rerender } = await render(<ProductImage uri={PHOTO} width={180} />);

    await act(async () => {
      fireEvent(screen.getByTestId('product-image'), 'display');
    });
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
