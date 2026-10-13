import { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { useTheme } from '@/hooks/useTheme';
import { feedback } from '@/lib/feedback';

export type Range = readonly [number, number];

type RangeSliderProps = {
  min: number;
  max: number;
  step: number;
  value: Range;
  /** Fires on every step while dragging, so labels can follow the thumbs. */
  onChange: (next: Range) => void;
  accessibilityLabel: string;
};

const THUMB = 28;
const TRACK = 4;

/**
 * Two-thumb slider for a min/max range. React Native has no native range
 * control, so this is built on Gesture Handler + Reanimated: the thumbs move on
 * the UI thread and only report back to JS when the value crosses a step.
 */
export function RangeSlider({
  min,
  max,
  step,
  value,
  onChange,
  accessibilityLabel,
}: RangeSliderProps) {
  const theme = useTheme();
  const [trackWidth, setTrackWidth] = useState(0);

  const span = Math.max(max - min, step);
  const usable = Math.max(trackWidth - THUMB, 1);

  const lowX = useSharedValue(0);
  const highX = useSharedValue(0);
  const lowStart = useSharedValue(0);
  const highStart = useSharedValue(0);
  const lastLow = useSharedValue(value[0]);
  const lastHigh = useSharedValue(value[1]);
  const dragging = useSharedValue(false);

  const [low, high] = value;

  // Place the thumbs from the value whenever it changes from outside (the
  // sheet opening, Reset) or the track is measured. While a thumb is held the
  // gesture owns its position, so the echo of our own onChange is ignored.
  useEffect(() => {
    if (trackWidth === 0 || dragging.value) {
      return;
    }

    const nextUsable = Math.max(trackWidth - THUMB, 1);

    lowX.value = ((low - min) / span) * nextUsable;
    highX.value = ((high - min) / span) * nextUsable;
    lastLow.value = low;
    lastHigh.value = high;
  }, [low, high, min, span, trackWidth, dragging, lowX, highX, lastLow, lastHigh]);

  const handleLayout = (event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width);
  };

  const report = (nextLow: number, nextHigh: number) => {
    feedback.select();
    onChange([nextLow, nextHigh]);
  };

  const snap = (x: number) => {
    'worklet';
    const raw = min + (x / usable) * span;
    const snapped = Math.round((raw - min) / step) * step + min;

    return Math.min(max, Math.max(min, snapped));
  };

  const lowGesture = Gesture.Pan()
    .hitSlop(12)
    .onBegin(() => {
      dragging.value = true;
      lowStart.value = lowX.value;
    })
    .onFinalize(() => {
      dragging.value = false;
    })
    .onUpdate((event) => {
      const next = Math.min(
        Math.max(0, lowStart.value + event.translationX),
        highX.value,
      );
      lowX.value = next;

      const v = snap(next);
      if (v !== lastLow.value) {
        lastLow.value = v;
        scheduleOnRN(report, v, lastHigh.value);
      }
    });

  const highGesture = Gesture.Pan()
    .hitSlop(12)
    .onBegin(() => {
      dragging.value = true;
      highStart.value = highX.value;
    })
    .onFinalize(() => {
      dragging.value = false;
    })
    .onUpdate((event) => {
      const next = Math.max(
        Math.min(usable, highStart.value + event.translationX),
        lowX.value,
      );
      highX.value = next;

      const v = snap(next);
      if (v !== lastHigh.value) {
        lastHigh.value = v;
        scheduleOnRN(report, lastLow.value, v);
      }
    });

  const lowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: lowX.value }],
  }));

  const highStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: highX.value }],
  }));

  const fillStyle = useAnimatedStyle(() => ({
    left: lowX.value + THUMB / 2,
    width: Math.max(0, highX.value - lowX.value),
  }));

  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      onLayout={handleLayout}
      style={styles.container}
    >
      <View
        style={[
          styles.track,
          { backgroundColor: theme.sheetFillStrong },
        ]}
      />

      <Animated.View
        style={[
          styles.fill,
          { backgroundColor: theme.text },
          fillStyle,
        ]}
      />

      <GestureDetector gesture={lowGesture}>
        <Animated.View
          style={[
            styles.thumb,
            { backgroundColor: theme.text },
            lowStyle,
          ]}
        />
      </GestureDetector>

      <GestureDetector gesture={highGesture}>
        <Animated.View
          style={[
            styles.thumb,
            { backgroundColor: theme.text },
            highStyle,
          ]}
        />
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: THUMB + 8,
    justifyContent: 'center',
  },

  track: {
    position: 'absolute',
    left: THUMB / 2,
    right: THUMB / 2,
    height: TRACK,
    borderRadius: TRACK / 2,
  },

  fill: {
    position: 'absolute',
    height: TRACK,
    borderRadius: TRACK / 2,
  },

  thumb: {
    position: 'absolute',
    left: 0,
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.35)',
  },
});
