import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { FontFamilies, FontSizes } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { feedback } from '@/lib/feedback';

import { BRAND_VIEWBOX, BrandMark } from './BrandMark';
import {
  GLINT_COLOR,
  HOOK_LENGTH,
  HOOK_PATH,
  LEFT_SHOULDER_PATH,
  MARK_HEIGHT,
  RIGHT_SHOULDER_PATH,
  SHOULDER_LENGTH,
  SPLASH_BOX,
  STROKE_WIDTH,
  SWING_PIVOT,
} from './logoGeometry';

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The mark's square in points. Must equal `imageWidth` of expo-splash-screen in app.json. */
export const LAUNCH_MARK_SIZE = 200;

/** When each beat starts, in ms from the moment the animated screen takes over. */
export const LAUNCH_TIMELINE = {
  swing: 60,
  hookLight: 140,
  shoulderLight: 500,
  wordmark: 520,
  exit: 1750,
  exitDuration: 460,
} as const;

/** With Reduce Motion: no movement, just the name and a short fade. */
export const REDUCED_TIMELINE = { exit: 700, exitDuration: 300 } as const;

const WORDMARK_LETTER_STAGGER = 38;
/** Length of the light that runs along the hanger, in mark units. */
const GLINT_LENGTH = 110;
/** Space between the hanger's shoulders and the name. */
const NAME_GAP = 28;
/** How far mark and name rise together, so the pair ends up centred. */
const LIFT = 34;

/** Where the mark's lowest point and the swing pivot sit inside LAUNCH_MARK_SIZE. */
const toBox = (value: number, origin: number) => (value - origin) / SPLASH_BOX.size;
const MARK_BOTTOM = LAUNCH_MARK_SIZE * (toBox(MARK_HEIGHT, SPLASH_BOX.y) - 0.5);
const PIVOT_ORIGIN = `${toBox(SWING_PIVOT.x, SPLASH_BOX.x) * 100}% ${toBox(SWING_PIVOT.y, SPLASH_BOX.y) * 100}%`;

type LaunchSplashProps = {
  /** Called once the screen has faded out; unmount it then. */
  onFinish: () => void;
};

/**
 * The first second and a half of the app.
 *
 * Takes over from the native launch screen on an identical frame (the same
 * mark, size and place), then: the hanger swings as if just hung on a rail,
 * light runs down its silk — hook first, then out along both shoulders —
 * and the name rises in beneath it. It all lifts away into the app, which
 * has been loading underneath the whole time.
 *
 * A tap skips to the end. Reduce Motion keeps only the name and a fade.
 */
export function LaunchSplash({ onFinish }: LaunchSplashProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();

  const [started, setStarted] = useState(false);
  const [showName, setShowName] = useState(false);
  const exiting = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const swing = useSharedValue(0);
  const lift = useSharedValue(0);
  const hookLight = useSharedValue(0);
  const shoulderLight = useSharedValue(0);
  const content = useSharedValue(1);
  const backdrop = useSharedValue(1);

  const later = (ms: number, run: () => void) => {
    timers.current.push(setTimeout(run, ms));
  };

  const exit = () => {
    if (exiting.current) {
      return;
    }
    exiting.current = true;
    timers.current.forEach(clearTimeout);

    const duration = reducedMotion ? REDUCED_TIMELINE.exitDuration : LAUNCH_TIMELINE.exitDuration;

    feedback.tap();
    content.value = withTiming(0, { duration: duration * 0.8, easing: Easing.inOut(Easing.cubic) });
    backdrop.value = withDelay(duration * 0.2, withTiming(0, { duration: duration * 0.8, easing: Easing.out(Easing.quad) }));
    timers.current = [setTimeout(onFinish, duration)];
  };

  // The animated screen is on screen and identical to the native one: swap them.
  const handleLayout = () => {
    if (started) {
      return;
    }
    SplashScreen.hide();
    setStarted(true);
  };

  useEffect(() => {
    if (!started) {
      return;
    }

    if (reducedMotion) {
      setShowName(true);
      later(REDUCED_TIMELINE.exit, exit);
    } else {
      // Hung on the rail: a nudge, then a slow settle.
      swing.value = withDelay(
        LAUNCH_TIMELINE.swing,
        withSequence(
          withTiming(-7, { duration: 260, easing: Easing.out(Easing.quad) }),
          withSpring(0, { damping: 4.5, stiffness: 110, mass: 0.7 }),
        ),
      );
      hookLight.value = withDelay(
        LAUNCH_TIMELINE.hookLight,
        withTiming(1, { duration: 460, easing: Easing.in(Easing.quad) }),
      );
      shoulderLight.value = withDelay(
        LAUNCH_TIMELINE.shoulderLight,
        withTiming(1, { duration: 620, easing: Easing.out(Easing.cubic) }),
      );
      lift.value = withDelay(
        LAUNCH_TIMELINE.wordmark,
        withTiming(-LIFT, { duration: 700, easing: Easing.out(Easing.cubic) }),
      );
      later(LAUNCH_TIMELINE.wordmark, () => setShowName(true));
      later(LAUNCH_TIMELINE.exit, exit);
    }

    return () => timers.current.forEach(clearTimeout);
    // Runs once, when the screen takes over; `exit` reads refs and shared values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdrop.value }));
  const contentStyle = useAnimatedStyle(() => ({
    opacity: content.value,
    transform: [{ translateY: lift.value }, { scale: interpolate(content.value, [0, 1], [1.12, 1]) }],
  }));
  const swingStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${swing.value}deg` }] }));

  const name = t('brand.name');

  return (
    <Animated.View
      testID="launch-splash"
      onLayout={handleLayout}
      style={[StyleSheet.absoluteFill, styles.backdrop, { backgroundColor: theme.background }, backdropStyle]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('brand.launchLabel')}
        onPress={exit}
        style={StyleSheet.absoluteFill}
      >
        <Animated.View style={[StyleSheet.absoluteFill, styles.center, contentStyle]}>
          <Animated.View style={[styles.mark, { transformOrigin: PIVOT_ORIGIN }, swingStyle]}>
            <BrandMark size={LAUNCH_MARK_SIZE} />

            {reducedMotion ? null : (
              <Svg width={LAUNCH_MARK_SIZE} height={LAUNCH_MARK_SIZE} viewBox={BRAND_VIEWBOX} style={StyleSheet.absoluteFill}>
                <Glint d={HOOK_PATH} length={HOOK_LENGTH} progress={hookLight} />
                <Glint d={LEFT_SHOULDER_PATH} length={SHOULDER_LENGTH} progress={shoulderLight} />
                <Glint d={RIGHT_SHOULDER_PATH} length={SHOULDER_LENGTH} progress={shoulderLight} />
              </Svg>
            )}
          </Animated.View>

          {showName ? (
            <View pointerEvents="none" style={[styles.name, { marginTop: MARK_BOTTOM + NAME_GAP }]}>
              {name.split('').map((letter, index) => (
                <Animated.Text
                  key={`${letter}${index}`}
                  entering={FadeInDown.delay(index * WORDMARK_LETTER_STAGGER).duration(420)}
                  style={[styles.letter, { color: theme.primary }]}
                >
                  {letter}
                </Animated.Text>
              ))}
            </View>
          ) : null}
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

type GlintProps = {
  d: string;
  length: number;
  progress: SharedValue<number>;
};

/** A short bead of light that travels the length of one path as `progress` goes 0 → 1. */
function Glint({ d, length, progress }: GlintProps) {
  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: GLINT_LENGTH - progress.value * (length + GLINT_LENGTH),
    strokeOpacity: interpolate(progress.value, [0, 0.08, 0.85, 1], [0, 0.9, 0.9, 0]),
  }));

  return (
    <AnimatedPath
      d={d}
      fill="none"
      stroke={GLINT_COLOR}
      strokeWidth={STROKE_WIDTH * 0.42}
      strokeLinecap="round"
      strokeDasharray={[GLINT_LENGTH, length + GLINT_LENGTH]}
      animatedProps={animatedProps}
    />
  );
}

const styles = StyleSheet.create({
  // Above the navigator and its native headers.
  backdrop: {
    zIndex: 1000,
    elevation: 1000,
  },

  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  mark: {
    width: LAUNCH_MARK_SIZE,
    height: LAUNCH_MARK_SIZE,
  },

  name: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
  },

  letter: {
    fontFamily: FontFamilies.displaySemibold,
    fontSize: FontSizes.largeTitle,
    letterSpacing: 0.4,
  },
});
