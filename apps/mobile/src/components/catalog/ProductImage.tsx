import { Image, type ImageContentFit, type ImageContentPosition } from 'expo-image';
import { useState } from 'react';
import { PixelRatio, type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { sizedImageUrl } from '@/lib/images';

import { SilkSheen } from './SilkSheen';

/** The blurred preview: a photo this many pixels wide is about 1 KB. */
const PREVIEW_WIDTH = 32;
const PREVIEW_BLUR = 14;

/** The full photo dissolves in over the preview. */
const FULL_TRANSITION = { duration: 420, effect: 'cross-dissolve', timing: 'ease-out' } as const;

type ProductImageProps = {
  /** The photo's URL as the API sends it; null shows only the tinted surface. */
  uri: string | null | undefined;
  /** Rendered width in points; the CDN is asked for a copy this wide (× pixel ratio). */
  width: number;
  /** Colour-family swatch from `toneOf(product.colors)` — tints the surface while loading. */
  tone?: string | null;
  /**
   * Show a blurred 1 KB copy while the full photo downloads. Worth it for
   * cards and the reel; small thumbnails load as fast as the preview would.
   */
  preview?: boolean;
  contentFit?: ImageContentFit;
  contentPosition?: ImageContentPosition;
  priority?: 'low' | 'normal' | 'high';
  /** Set in recycled lists, so a reused cell never flashes the previous product's photo. */
  recyclingKey?: string;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * Every product photo in the app. Loading reads as the photo developing
 * rather than a grey box:
 *
 *   1. at once — the garment's colour as a dyed surface with a slow silk sheen;
 *   2. ~1 KB later — a blurred thumbnail with the outfit's shape and colours;
 *   3. then — the full photo dissolves in and the sheen fades away.
 *
 * A photo already in the cache skips all of it: the sheen waits a moment
 * before appearing, so cached photos never flash.
 */
export function ProductImage({
  uri,
  width,
  tone = null,
  preview = true,
  contentFit = 'cover',
  contentPosition = 'top',
  priority = 'normal',
  recyclingKey,
  accessibilityLabel,
  style,
}: ProductImageProps) {
  const fullUri = uri ? sizedImageUrl(uri, width * PixelRatio.get()) : null;
  const previewUri = uri && preview ? sizedImageUrl(uri, PREVIEW_WIDTH) : null;

  // Keyed by URL, so a recycled cell showing a new photo starts loading again.
  const [shownUri, setShownUri] = useState<string | null>(null);
  const [failedUri, setFailedUri] = useState<string | null>(null);

  const shown = fullUri !== null && shownUri === fullUri;
  const failed = fullUri !== null && failedUri === fullUri;
  const developing = fullUri !== null && !shown && !failed;

  return (
    <View
      accessible={accessibilityLabel !== undefined}
      accessibilityRole={accessibilityLabel ? 'image' : undefined}
      accessibilityLabel={accessibilityLabel}
      style={[styles.frame, style]}
    >
      {developing || failed || !fullUri ? <SilkSheen tone={tone} still={!developing} /> : null}

      {previewUri && !failed ? (
        <Image
          testID="product-image-preview"
          source={{ uri: previewUri }}
          blurRadius={PREVIEW_BLUR}
          contentFit={contentFit}
          contentPosition={contentPosition}
          transition={200}
          priority="high"
          recyclingKey={recyclingKey}
          style={StyleSheet.absoluteFill}
        />
      ) : null}

      {fullUri ? (
        <Image
          testID="product-image"
          source={{ uri: fullUri }}
          contentFit={contentFit}
          contentPosition={contentPosition}
          transition={FULL_TRANSITION}
          priority={priority}
          recyclingKey={recyclingKey}
          onDisplay={() => setShownUri(fullUri)}
          onError={() => setFailedUri(fullUri)}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
  },
});
