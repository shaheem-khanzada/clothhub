import { Image, type ImageContentFit, type ImageContentPosition, type ImageSource } from 'expo-image';
import { useState } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { PHOTO_HEADERS, PhotoDensity, type PhotoDensityLimit, photoUrl, sizedImageUrl } from '@/lib/images';
import { usePhotoMetrics } from '@/lib/photoMetrics';

import { Glint, SilkSheen } from './SilkSheen';

/** The blurred preview, used when there is no ThumbHash: a photo this wide is about 1 KB. */
const PREVIEW_WIDTH = 32;
const PREVIEW_BLUR = 14;

/** The full photo dissolves in over whatever was showing. */
const FULL_TRANSITION = { duration: 420, effect: 'cross-dissolve', timing: 'ease-out' } as const;

type ProductImageProps = {
  /** The photo's URL as the API sends it; null shows only the tinted surface. */
  uri: string | null | undefined;
  /** Rendered width in points; the CDN is asked for a copy this wide. */
  width: number;
  /** How sharp the copy is: `compact` (2×) for cards and thumbnails, `full` for full-screen photos. */
  density?: PhotoDensityLimit;
  /** Colour-family swatch from `toneOf(product.colors)` — tints the surface while loading. */
  tone?: string | null;
  /** The photo's ThumbHash from the API: shows the outfit at once, with no download. */
  thumbhash?: string | null;
  /**
   * A copy of this photo the app has already shown — the grid card's, when
   * the reel opens on it. Shown at once from the cache, then sharpened.
   */
  placeholderUri?: string | null;
  /**
   * Without a ThumbHash, show a blurred 1 KB copy while the full photo
   * downloads. Worth it for cards and the reel; small thumbnails load as
   * fast as the preview would.
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
 * What shows before the full photo:
 *   copy       a smaller copy already in the cache (the grid card's)
 *   thumbhash  decoded on the device from the API's ~25 bytes
 *   preview    a blurred 32px download, when there is no ThumbHash yet
 */
type Early = { kind: 'copy' | 'thumbhash' | 'preview'; source: ImageSource };

/**
 * Every product photo in the app. Loading reads as the photo developing
 * rather than a grey box:
 *
 *   1. at once — the outfit itself, as soft as a sketch: the copy the grid
 *      already showed, or its ThumbHash; failing both, the garment's colour
 *      as a dyed surface;
 *   2. light sweeps slowly across it while the photo is on its way;
 *   3. the full photo dissolves in.
 *
 * A photo already in the cache skips all of it: the light waits a moment
 * before appearing, so cached photos never flash.
 */
export function ProductImage({
  uri,
  width,
  density = PhotoDensity.compact,
  tone = null,
  thumbhash = null,
  placeholderUri = null,
  preview = true,
  contentFit = 'cover',
  contentPosition = 'top',
  priority = 'normal',
  recyclingKey,
  accessibilityLabel,
  style,
}: ProductImageProps) {
  const metrics = usePhotoMetrics();

  const fullUri = uri ? photoUrl(uri, width, density) : null;

  // Keyed by URL, so a recycled cell showing a new photo starts loading again.
  const [shownUri, setShownUri] = useState<string | null>(null);
  const [failedUri, setFailedUri] = useState<string | null>(null);

  const shown = fullUri !== null && shownUri === fullUri;
  const failed = fullUri !== null && failedUri === fullUri;
  const developing = fullUri !== null && !shown && !failed;

  const early = earlyLayer({ uri, fullUri, placeholderUri, thumbhash, preview });
  // Copies and ThumbHashes need no network, so a failed photo keeps them.
  const earlyIsLocal = early !== null && early.kind !== 'preview';
  const showEarly = early !== null && !shown && (!failed || earlyIsLocal);

  // The dyed surface sits under a blurred preview, and stands in for the
  // photo when there is nothing else to show.
  const showSurface = (developing || failed || !fullUri) && (!showEarly || early.kind === 'preview');

  return (
    <View
      accessible={accessibilityLabel !== undefined}
      accessibilityRole={accessibilityLabel ? 'image' : undefined}
      accessibilityLabel={accessibilityLabel}
      style={[styles.frame, style]}
    >
      {showSurface ? <SilkSheen tone={tone} still={!developing} /> : null}

      {showEarly ? (
        <Image
          testID="product-image-preview"
          source={early.source}
          blurRadius={early.kind === 'preview' ? PREVIEW_BLUR : undefined}
          contentFit={contentFit}
          contentPosition={contentPosition}
          transition={earlyIsLocal ? null : 200}
          priority="high"
          recyclingKey={recyclingKey}
          style={StyleSheet.absoluteFill}
        />
      ) : null}

      {/* A ThumbHash is the outfit already sketched in; the light says the rest is coming. */}
      {showEarly && developing && early.kind === 'thumbhash' ? <Glint /> : null}

      {fullUri ? (
        <Image
          testID="product-image"
          source={{ uri: fullUri, headers: PHOTO_HEADERS }}
          contentFit={contentFit}
          contentPosition={contentPosition}
          transition={FULL_TRANSITION}
          priority={priority}
          recyclingKey={recyclingKey}
          {...metrics}
          onDisplay={() => setShownUri(fullUri)}
          onError={() => setFailedUri(fullUri)}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
    </View>
  );
}

/** What shows before the full photo: the best of what is at hand, or nothing. */
function earlyLayer({
  uri,
  fullUri,
  placeholderUri,
  thumbhash,
  preview,
}: {
  uri: string | null | undefined;
  fullUri: string | null;
  placeholderUri: string | null;
  thumbhash: string | null;
  preview: boolean;
}): Early | null {
  if (placeholderUri && placeholderUri !== fullUri) {
    return { kind: 'copy', source: { uri: placeholderUri, headers: PHOTO_HEADERS } };
  }

  if (thumbhash) {
    return { kind: 'thumbhash', source: { thumbhash } };
  }

  if (uri && preview) {
    return { kind: 'preview', source: { uri: sizedImageUrl(uri, PREVIEW_WIDTH), headers: PHOTO_HEADERS } };
  }

  return null;
}

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
  },
});
