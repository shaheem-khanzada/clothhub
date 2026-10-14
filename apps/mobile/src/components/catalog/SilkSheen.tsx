import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/hooks/useTheme';

/** One sweep plus the pause before the next, in ms. */
const PERIOD = 2_400;
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
 *
 * Every sheen on screen follows one shared clock, so a grid of loading
 * photos ripples together instead of flickering out of step. Reduce Motion
 * keeps the tint and drops the movement.
 */
export function SilkSheen({ tone, still = false }: SilkSheenProps) {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const moving = !reducedMotion && !still;

  const progress = useSharedValue(0);
  const width = useSharedValue(0);

  useEffect(() => {
    if (!moving) {
      return;
    }

    // Join the shared clock mid-sweep rather than starting a private one.
    const phase = (Date.now() % PERIOD) / PERIOD;
    progress.value = phase;
    progress.value = withSequence(
      withTiming(1, { duration: (1 - phase) * PERIOD, easing: Easing.linear }),
      withRepeat(
        withSequence(
          withTiming(0, { duration: 0 }),
          withTiming(1, { duration: PERIOD, easing: Easing.linear }),
        ),
        -1,
      ),
    );

    return () => cancelAnimation(progress);
  }, [progress, moving]);

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

  const handleLayout = (event: LayoutChangeEvent) => {
    width.value = event.nativeEvent.layout.width;
  };

  return (
    <Animated.View
      entering={FadeIn.delay(APPEAR_DELAY_MS).duration(260)}
      exiting={FadeOut.duration(320)}
      testID="silk-sheen"
      pointerEvents="none"
      onLayout={handleLayout}
      style={[StyleSheet.absoluteFill, styles.clip, { backgroundColor: theme.surface }]}
    >
      {tone ? <View style={[StyleSheet.absoluteFill, styles.dye, { backgroundColor: tone }]} /> : null}

      {/* Drape: a little lighter where the fabric faces the light, deeper at the hem. */}
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.05)', 'transparent', 'rgba(0, 0, 0, 0.28)']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />

      {moving ? (
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
      ) : null}
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
