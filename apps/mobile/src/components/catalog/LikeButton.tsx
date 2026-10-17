import {
  Button as SwiftUIButton,
  Host,
  Image as SwiftUIImage,
  useNativeState,
} from '@expo/ui/swift-ui';
import {
  accessibilityLabel as swiftUIAccessibilityLabel,
  buttonBorderShape,
  buttonStyle,
  frame,
  symbolEffect,
} from '@expo/ui/swift-ui/modifiers';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { Icon } from '@/components/ui/Icon';
import { useTheme } from '@/hooks/useTheme';
import { hasLiquidGlass } from '@/lib/deviceInfo';
import { feedback } from '@/lib/feedback';

/** Lets the symbol fill the host, so the glass circle is exactly `size`. */
const FILL = 10_000;

/*
 * The like, choreographed (ms from the tap):
 *
 *   0    the button presses in
 *   90   it springs back past full size; the heart turns rose and bounces
 *   90   a soft rose glow blooms behind it and a thin ring races outwards
 *   110  ten particles — tiny hearts and sparks — fly out on two staggered
 *        orbits, spin a little, drift up, shrink and fade
 *   760  everything has settled
 *
 * One shared clock drives the whole burst; every piece reads its own window
 * of it, so the moment costs a single animation on the UI thread.
 */
const BURST_MS = 760;
const BURST_START_MS = 90;

const easeOutCubic = Easing.out(Easing.cubic);
const easeOutQuad = Easing.out(Easing.quad);

type ParticleSpec = {
  /** Direction, radians from the top. */
  angle: number;
  /** How far it flies, as a fraction of the button size. */
  reach: number;
  /** As a fraction of the button size. */
  scale: number;
  kind: 'heart' | 'spark';
  tone: 0 | 1 | 2 | 3;
  /** Start, ms after the burst begins. */
  delay: number;
  /** Degrees of turn over its flight (hearts only). */
  spin: number;
};

const PARTICLES: readonly ParticleSpec[] = Array.from({ length: 10 }, (_, i) => {
  const outer = i % 2 === 0;

  return {
    angle: (i / 10) * Math.PI * 2 + (outer ? 0 : 0.2),
    reach: outer ? 0.62 : 0.46,
    scale: i % 3 === 0 ? 0.24 : outer ? 0.12 : 0.09,
    kind: i % 3 === 0 ? 'heart' : 'spark',
    tone: (i % 4) as ParticleSpec['tone'],
    delay: (outer ? 20 : 0) + (i % 3) * 18,
    spin: i % 2 === 0 ? 22 : -18,
  };
});

type LikeButtonProps = {
  liked: boolean;
  onToggle: () => void;
  /** Diameter of the glass circle. */
  size?: number;
  iconSize?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * The heart. Saving plays a burst around the button; un-saving just settles.
 *
 * On iOS 26 the circle and symbol are native SwiftUI Liquid Glass, so the
 * unsaved heart still turns dark over bright photos; the burst is drawn by
 * Reanimated around it. Elsewhere the circle is the app's frosted disc.
 */
export function LikeButton({ liked, onToggle, size = 52, iconSize = 22, style }: LikeButtonProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  const press = useSharedValue(1);
  const clock = useSharedValue(1);
  const bounce = useNativeState(0);

  const label = liked ? t('catalog.favorites.remove') : t('catalog.favorites.save');

  const handlePress = () => {
    const willLike = !liked;

    if (willLike) {
      feedback.like();

      press.value = withSequence(
        withTiming(0.8, { duration: BURST_START_MS, easing: Easing.out(Easing.quad) }),
        withSpring(1, { damping: 7, stiffness: 320, mass: 0.6 }),
      );

      clock.value = withSequence(
        withTiming(0, { duration: 0 }),
        withTiming(1, { duration: BURST_MS, easing: Easing.linear }),
      );

      bounce.set(bounce.get() + 1);
    } else {
      feedback.unlike();

      press.value = withSequence(
        withTiming(0.88, { duration: 80, easing: Easing.out(Easing.quad) }),
        withSpring(1, { damping: 14, stiffness: 260 }),
      );
    }

    onToggle();
  };

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: press.value }],
  }));

  const box = { width: size, height: size };

  return (
    <View style={[box, style]}>
      <Burst clock={clock} size={size} />

      <Animated.View style={[box, pressStyle]}>
        {hasLiquidGlass ? (
          // Ignore safe areas: otherwise SwiftUI shifts the button as the
          // host scrolls near the screen edges (it did in the product grid).
          <Host style={box} ignoreSafeArea="all">
            <SwiftUIButton
              onPress={handlePress}
              modifiers={[
                buttonStyle('glass'),
                buttonBorderShape('circle'),
                swiftUIAccessibilityLabel(label),
              ]}
            >
              <SwiftUIImage
                systemName="heart.fill"
                size={iconSize}
                // Unsaved: no colour, so Liquid Glass picks light or dark.
                color={liked ? theme.like : undefined}
                modifiers={[
                  frame({ maxWidth: FILL, maxHeight: FILL }),
                  symbolEffect({ effect: 'bounce', direction: 'up' }, { value: bounce }),
                ]}
              />
            </SwiftUIButton>
          </Host>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ selected: liked }}
            hitSlop={Math.max(0, (44 - size) / 2)}
            onPress={handlePress}
            style={[
              styles.disc,
              box,
              {
                borderRadius: size / 2,
                backgroundColor: theme.glassFallback,
                borderColor: theme.glassBorder,
              },
            ]}
          >
            <Icon name="heart.fill" size={iconSize} color={liked ? theme.like : theme.text} />
          </Pressable>
        )}
      </Animated.View>
    </View>
  );
}

type BurstProps = {
  clock: SharedValue<number>;
  size: number;
};

/** Glow, ring and particles. Purely decorative; never takes a touch. */
function Burst({ clock, size }: BurstProps) {
  const theme = useTheme();

  const tones = [theme.like, theme.likeSoft, theme.likeFaint, theme.text] as const;
  const stroke = Math.max(1.5, size * 0.04);

  const glowStyle = useAnimatedStyle(() => {
    const p = phase(clock.value, BURST_START_MS, 420);
    const eased = easeOutCubic(p);

    return {
      opacity: p <= 0 || p >= 1 ? 0 : 0.34 * (1 - eased),
      transform: [{ scale: 0.7 + 0.65 * eased }],
    };
  });

  const ringStyle = useAnimatedStyle(() => {
    const p = phase(clock.value, BURST_START_MS, 520);
    const eased = easeOutCubic(p);

    return {
      opacity: p <= 0 || p >= 1 ? 0 : 0.9 * (1 - eased),
      transform: [{ scale: 0.55 + 1.05 * eased }],
    };
  });

  const circle = { width: size, height: size, borderRadius: size / 2 };

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.center]}>
      <Animated.View style={[styles.layer, circle, { backgroundColor: theme.like }, glowStyle]} />

      <Animated.View
        style={[styles.layer, circle, { borderWidth: stroke, borderColor: theme.like }, ringStyle]}
      />

      {PARTICLES.map((spec, index) => (
        <Particle
          key={index}
          spec={spec}
          clock={clock}
          size={size}
          color={tones[spec.tone]}
        />
      ))}
    </View>
  );
}

type ParticleProps = {
  spec: ParticleSpec;
  clock: SharedValue<number>;
  size: number;
  color: string;
};

function Particle({ spec, clock, size, color }: ParticleProps) {
  const dimension = Math.max(3, size * spec.scale);
  const start = size * 0.4;
  const travel = size * spec.reach;

  const style = useAnimatedStyle(() => {
    const p = phase(clock.value, BURST_START_MS + 20 + spec.delay, 560);
    const flight = easeOutQuad(p);
    const distance = start + travel * flight;

    // Pops in fast, holds, then shrinks away in the last stretch.
    const grow = Math.min(1, p / 0.18);
    const shrink = p > 0.55 ? 1 - (p - 0.55) / 0.45 : 1;
    const visible = p > 0 && p < 1;

    return {
      opacity: visible ? shrink : 0,
      transform: [
        { translateX: Math.sin(spec.angle) * distance },
        // Up is negative; hearts also float up a touch as they go.
        {
          translateY:
            -Math.cos(spec.angle) * distance - (spec.kind === 'heart' ? size * 0.12 * flight : 0),
        },
        { rotate: `${spec.spin * flight}deg` },
        { scale: grow * (0.4 + 0.6 * shrink) },
      ],
    };
  });

  return (
    <Animated.View style={[styles.layer, style]}>
      {spec.kind === 'heart' ? (
        <Icon name="heart.fill" size={dimension} color={color} />
      ) : (
        <View
          style={{
            width: dimension,
            height: dimension,
            borderRadius: dimension / 2,
            backgroundColor: color,
          }}
        />
      )}
    </Animated.View>
  );
}

/** The 0→1 progress of a piece that starts `delayMs` into the burst and lasts `durationMs`. */
function phase(clock: number, delayMs: number, durationMs: number): number {
  'worklet';
  const elapsed = clock * BURST_MS - delayMs;

  return Math.min(1, Math.max(0, elapsed / durationMs));
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  layer: {
    position: 'absolute',
  },

  disc: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
});
