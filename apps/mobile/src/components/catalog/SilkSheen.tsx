import { LinearGradient } from 'expo-linear-gradient';
import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
} from 'react-native-reanimated';

import { useTheme } from '@/hooks/useTheme';

import { useSheenClock } from './sheenClock';

/** The share of the period the light spends crossing; the rest is a held breath. */
const SWEEP = 0.6;
/** Band width as a share of the frame, and its tilt — light falling across a fold. */
const BAND = 0.75;
const TILT = '18deg';
/** Cached photos appear within this; the sheen only fades in for real waits. */
const APPEAR_DELAY_MS = 140;

type SilkSheenProps = {
  /** A swatch from `ToneSwatches`, or null for a neutral sheen. */
  tone: string | null;
  /** Keep the tinted surface but stop the light — e.g. when a photo failed to load. */
  still?: boolean;
};

/**
 * The surface a photo grows out of: the garment's colour as a soft dyed
 * haze, with light slowly sweeping across it like silk catching a lamp.
 * Reduce Motion keeps the tint and drops the movement.
 */
export function SilkSheen({ tone, still = false }: SilkSheenProps) {
  const theme = useTheme();

  return (
    <Animated.View
      entering={FadeIn.delay(APPEAR_DELAY_MS).duration(260)}
      exiting={FadeOut.duration(320)}
      testID="silk-sheen"
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, styles.clip, { backgroundColor: theme.surface }]}
    >
      {tone ? <View style={[StyleSheet.absoluteFill, styles.dye, { backgroundColor: tone }]} /> : null}

      {/* Drape: a little lighter where the fabric faces the light, deeper at the hem. */}
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.05)', 'transparent', 'rgba(0, 0, 0, 0.28)']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />

      {still ? null : <Glint />}
    </Animated.View>
  );
}

/**
 * Just the moving light, with no surface of its own — laid over a ThumbHash
 * or blurred preview so a photo that is already sketched in still reads as
 * on its way.
 */
export function Glint() {
  const reducedMotion = useReducedMotion();
  const progress = useSheenClock(!reducedMotion);
  const width = useSharedValue(0);

  const bandStyle = useAnimatedStyle(() => {
    const sweep = Math.min(progress.value / SWEEP, 1);
    const eased = Easing.inOut(Easing.cubic)(sweep);
    const bandWidth = width.value * BAND;
    const from = -bandWidth * 1.4;
    const to = width.value + bandWidth * 0.4;

    return {
      width: bandWidth,
      transform: [{ translateX: from + (to - from) * eased }, { rotate: TILT }],
    };
  });

  if (reducedMotion) {
    return null;
  }

  const handleLayout = (event: LayoutChangeEvent) => {
    width.value = event.nativeEvent.layout.width;
  };

  return (
    <Animated.View
      entering={FadeIn.delay(APPEAR_DELAY_MS).duration(260)}
      exiting={FadeOut.duration(320)}
      testID="glint"
      pointerEvents="none"
      onLayout={handleLayout}
      style={[StyleSheet.absoluteFill, styles.clip]}
    >
      <Animated.View style={[styles.band, bandStyle]}>
        <LinearGradient
          colors={[
            'transparent',
            'rgba(255, 255, 255, 0.07)',
            'rgba(255, 255, 255, 0.16)',
            'rgba(255, 255, 255, 0.07)',
            'transparent',
          ]}
          locations={[0, 0.3, 0.5, 0.7, 1]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  clip: {
    overflow: 'hidden',
  },

  dye: {
    opacity: 0.32,
  },

  band: {
    position: 'absolute',
    // Taller than the frame so the tilted band never shows its ends.
    top: '-25%',
    bottom: '-25%',
  },
});
