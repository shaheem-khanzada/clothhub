import { StyleSheet, View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

type ImageProgressProps = {
  count: number;
  index: number;
};

const DOT = 6;
const ACTIVE_DOT = 18;

/**
 * Which photo of the product is showing: small page dots that sit just above
 * the product card, out of the way of the photo itself.
 */
export function ImageProgress({ count, index }: ImageProgressProps) {
  const theme = useTheme();

  if (count < 2) {
    return null;
  }

  return (
    <View style={styles.row} pointerEvents="none">
      {Array.from({ length: count }).map((_, dot) => (
        <Animated.View
          key={dot}
          layout={LinearTransition.duration(180)}
          style={[
            styles.dot,
            { backgroundColor: theme.text },
            dot === index ? styles.active : styles.inactive,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + 2,
  },

  dot: {
    height: DOT,
    borderRadius: DOT / 2,
    // Keeps the dots readable on white studio backdrops.
    boxShadow: '0 0 3px rgba(0, 0, 0, 0.45)',
  },

  active: {
    width: ACTIVE_DOT,
  },

  inactive: {
    width: DOT,
    opacity: 0.55,
  },
});
