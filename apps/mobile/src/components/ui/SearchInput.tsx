import {
  Platform,
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { HStack } from '@/components/ui/HStack';
import { Icon } from '@/components/ui/Icon';
import { TextInput, type TextInputProps } from '@/components/ui/TextInput';
import { Radii, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

type SearchInputProps = TextInputProps & {
  containerStyle?: StyleProp<ViewStyle>;
  /**
   * Shows a clear (×) button while there is text. iOS draws its own through
   * `clearButtonMode`; Android has none, so this adds one there.
   */
  onClear?: () => void;
  /** Read by TalkBack for the clear button. */
  clearAccessibilityLabel?: string;
};

export function SearchInput({
  containerStyle,
  style,
  onClear,
  clearAccessibilityLabel,
  ...props
}: SearchInputProps) {
  const theme = useTheme();

  return (
    <HStack
      alignItems="center"
      space="two"
      style={[
        styles.container,
        { backgroundColor: theme.surface },
        containerStyle,
      ]}
    >
      <Icon
        name="search.outline"
        size={18}
        color={theme.textSecondary}
      />

      <TextInput
        returnKeyType="search"
        clearButtonMode="while-editing"
        autoCorrect={false}
        {...props}
        placeholderTextColor={props.placeholderTextColor ?? theme.textSecondary}
        selectionColor={theme.primary}
        style={[
          styles.input,
          { color: theme.text },
          style,
        ]}
      />

      {Platform.OS === 'android' && onClear && props.value ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={clearAccessibilityLabel}
          hitSlop={Spacing.twoAndOne}
          onPress={onClear}
        >
          <Icon name="close.outline" size={18} color={theme.textSecondary} />
        </Pressable>
      ) : null}
    </HStack>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 40,
    borderRadius: Radii.pill,
    paddingHorizontal: Spacing.twoAndOne,
  },

  input: {
    flex: 1,
    padding: 0,
    ...Typography.body_17_regular,
  },
});
