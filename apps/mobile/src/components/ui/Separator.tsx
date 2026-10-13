import {
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useTheme } from '@/hooks/useTheme';

type SeparatorProps = {
  style?: StyleProp<ViewStyle>;
};

export function Separator({ style }: SeparatorProps) {
  const { border } = useTheme();

  return (
    <View
      style={[
        styles.separator,
        { backgroundColor: border },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  separator: {
    height: StyleSheet.hairlineWidth,
  },
});
