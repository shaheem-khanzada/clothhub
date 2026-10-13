import {
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Text } from '@/components/ui/Text';
import { Radii, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { feedback } from '@/lib/feedback';

type ChipProps = {
  label: string;
  selected?: boolean;
  /** Omit for a read-only chip (a size or fabric label). */
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

/** A pill label — selectable in filters, read-only in product details. */
export function Chip({
  label,
  selected = false,
  onPress,
  style,
}: ChipProps) {
  const theme = useTheme();

  const handlePress = () => {
    feedback.select();
    onPress?.();
  };

  return (
    <Pressable
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityState={onPress ? { selected } : undefined}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? theme.text : theme.sheetFillStrong,
          opacity: pressed ? 0.75 : 1,
        },
        style,
      ]}
    >
      <Text
        numberOfLines={1}
        style={[
          styles.label,
          { color: selected ? theme.background : theme.text },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 36,
    paddingHorizontal: Spacing.three,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },

  label: {
    ...Typography.subhead_15_medium,
  },
});
