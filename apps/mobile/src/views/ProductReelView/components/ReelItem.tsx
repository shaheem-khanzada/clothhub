import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
  Pressable,
  StyleSheet,
  View,
  type GestureResponderEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Spacing } from '@/constants/theme';
import type { Product } from '@/domain/catalog/types';
import { feedback } from '@/lib/feedback';
import { sizedImageUrl } from '@/lib/images';

import { ImageProgress } from './ImageProgress';
import { ThumbnailStrip, THUMBNAIL_STRIP_HEIGHT } from './ThumbnailStrip';

/** How long the thumbnail strip lingers after the last image swipe or tap. */
const STRIP_LINGER_MS = 2500;

type ReelItemProps = {
  product: Product;
  width: number;
  height: number;
  pixelRatio: number;
  /** Status bar height — the top shade only needs to cover this. */
  topInset: number;
  /** Distance from the bottom of the screen to the top of the collapsed sheet. */
  sheetHeight: number | null;
};

/**
 * One product in the reel: its photos page horizontally, a tap on either side
 * steps through them like stories, and the strip of thumbnails appears while
 * the user is moving between photos.
 */
export function ReelItem({
  product,
  width,
  height,
  pixelRatio,
  topInset,
  sheetHeight,
}: ReelItemProps) {
  const { t } = useTranslation();
  const listRef = useRef<FlatList<string>>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [imageIndex, setImageIndex] = useState(0);
  const [stripVisible, setStripVisible] = useState(false);

  const images = product.images;

  useEffect(() => {
    return () => {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
      }
    };
  }, []);

  const revealStrip = () => {
    if (images.length < 2) {
      return;
    }

    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
    }

    setStripVisible(true);
    hideTimer.current = setTimeout(() => setStripVisible(false), STRIP_LINGER_MS);
  };

  const goToImage = (next: number) => {
    const clamped = Math.max(0, Math.min(images.length - 1, next));

    if (clamped === imageIndex) {
      return;
    }

    feedback.select();
    setImageIndex(clamped);
    listRef.current?.scrollToIndex({ index: clamped, animated: true });
    revealStrip();
  };

  // A tap on the left third goes back, anywhere else goes forward.
  const handleTap = (event: GestureResponderEvent) => {
    const goingBack = event.nativeEvent.locationX < width / 3;
    goToImage(goingBack ? imageIndex - 1 : imageIndex + 1);
  };

  const handleMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(event.nativeEvent.contentOffset.x / width);

    if (next !== imageIndex) {
      feedback.select();
      setImageIndex(next);
    }

    revealStrip();
  };

  return (
    <View style={{ width, height }}>
      <FlatList
        ref={listRef}
        data={images}
        keyExtractor={(uri) => uri}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
        onScrollBeginDrag={revealStrip}
        onMomentumScrollEnd={handleMomentumEnd}
        renderItem={({ item, index }) => (
          <Pressable
            accessibilityLabel={t('catalog.reel.imageOf', {
              index: index + 1,
              count: images.length,
            })}
            onPress={handleTap}
            style={{ width, height }}
          >
            <Image
              source={{ uri: sizedImageUrl(item, width * pixelRatio) }}
              contentFit="cover"
              transition={150}
              priority={index === 0 ? 'high' : 'normal'}
              style={StyleSheet.absoluteFill}
            />
          </Pressable>
        )}
      />

      {/* Just enough to keep the white status bar readable on studio-white
          backdrops; the glass buttons look after themselves. */}
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(0, 0, 0, 0.3)', 'transparent']}
        style={[styles.topShade, { height: topInset + 32 }]}
      />

      <LinearGradient
        pointerEvents="none"
        colors={['transparent', 'rgba(0, 0, 0, 0.5)']}
        style={styles.bottomShade}
      />

      {/* Above the card: the strip while the user is moving between photos,
          quiet page dots the rest of the time. */}
      {sheetHeight !== null && stripVisible ? (
        <Animated.View
          entering={FadeIn.duration(180)}
          exiting={FadeOut.duration(220)}
          style={[styles.strip, { bottom: sheetHeight + Spacing.twoAndOne }]}
        >
          <ThumbnailStrip images={images} index={imageIndex} onSelect={goToImage} />
        </Animated.View>
      ) : null}

      {sheetHeight !== null && !stripVisible ? (
        <Animated.View
          entering={FadeIn.duration(220)}
          exiting={FadeOut.duration(120)}
          pointerEvents="none"
          style={[styles.dots, { bottom: sheetHeight + Spacing.three }]}
        >
          <ImageProgress count={images.length} index={imageIndex} />
        </Animated.View>
      ) : null}
    </View>
  );
}

export const STRIP_SPACE = THUMBNAIL_STRIP_HEIGHT + Spacing.twoAndOne * 2;

const styles = StyleSheet.create({
  topShade: {
    position: 'absolute',
    top: 0,
    start: 0,
    end: 0,
  },

  bottomShade: {
    position: 'absolute',
    bottom: 0,
    start: 0,
    end: 0,
    height: 260,
  },

  dots: {
    position: 'absolute',
    start: 0,
    end: 0,
    alignItems: 'center',
  },

  strip: {
    position: 'absolute',
    start: 0,
    end: 0,
  },
});
