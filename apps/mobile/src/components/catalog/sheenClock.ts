import { useEffect } from 'react';
import {
  cancelAnimation,
  Easing,
  makeMutable,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

/** One sweep of light plus the pause before the next, in ms. */
export const SHEEN_PERIOD_MS = 2_400;

/**
 * 0 → 1 once per period, shared by every sheen on screen: one animation on
 * the UI thread however many photos are loading, and a grid that ripples
 * together instead of flickering out of step.
 */
const progress = makeMutable(0);
let running = 0;

function start() {
  progress.value = 0;
  progress.value = withRepeat(withTiming(1, { duration: SHEEN_PERIOD_MS, easing: Easing.linear }), -1);
}

/**
 * Subscribes a sheen to the shared clock while `active`. The clock runs only
 * while at least one sheen is on screen.
 */
export function useSheenClock(active: boolean): SharedValue<number> {
  useEffect(() => {
    if (!active) {
      return;
    }

    running += 1;
    if (running === 1) {
      start();
    }

    return () => {
      running -= 1;
      if (running === 0) {
        cancelAnimation(progress);
      }
    };
  }, [active]);

  return progress;
}
