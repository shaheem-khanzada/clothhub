import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ProductImage } from '@/components/catalog/ProductImage';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export const THUMBNAIL_STRIP_HEIGHT = 68;

const THUMB_WIDTH = 51; // 3:4, the shape of the product photos
const RING_WIDTH = 2;

type ThumbnailStripProps = {
  images: string[];
  /** The product's colour swatch, tinting tiles while they load. */
  tone: string | null;
  /** Shows the first tile at once. */
  coverThumbhash: string | null;
  index: number;
  onSelect: (index: number) => void;
};

/** Jump straight to any photo of the current product. */
export function ThumbnailStrip({ images, tone, coverThumbhash, index, onSelect }: ThumbnailStripProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      {images.map((uri, imageIndex) => {
        const selected = imageIndex === index;

        return (
          <Pressable
            key={uri}
            accessibilityRole="button"
            accessibilityLabel={t('catalog.reel.imageOf', {
              index: imageIndex + 1,
              count: images.length,
            })}
            accessibilityState={{ selected }}
            onPress={() => onSelect(imageIndex)}
            style={styles.thumb}
          >
            {/* The photo fills the whole tile; nothing dark shows around it. */}
            <ProductImage
              uri={uri}
              width={THUMB_WIDTH}
              tone={tone}
              thumbhash={imageIndex === 0 ? coverThumbhash : null}
              preview={false}
              style={[StyleSheet.absoluteFill, !selected && styles.unselected]}
            />

            {/* Drawn over the photo rather than as the tile's border, so the
                ring never leaves a gap between itself and the image. */}
            {selected ? (
              <View
                pointerEvents="none"
                style={[styles.ring, { borderColor: theme.text }]}
              />
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
  },

  thumb: {
    width: THUMB_WIDTH,
    height: THUMBNAIL_STRIP_HEIGHT,
    borderRadius: Radii.image - 4,
    overflow: 'hidden',
  },

  unselected: {
    opacity: 0.7,
  },

  ring: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    start: 0,
    end: 0,
    borderRadius: Radii.image - 4,
    borderWidth: RING_WIDTH,
  },
});
