import { forwardRef, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { TextInput, type TextInputProps, type TextInputRef } from '@/components/ui/TextInput';
import { Radii, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

type FieldProps = TextInputProps & {
  label: string;
  /** Shown under the field, in the danger colour. */
  error?: string | null;
  /** A control at the end of the field (show/hide password). */
  accessory?: ReactNode;
};

/** A labelled text field for forms: label above, a rounded input, an error below. */
export const Field = forwardRef<TextInputRef, FieldProps>(({ label, error, accessory, style, ...props }, ref) => {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[Typography.footnote_13_medium, { color: theme.textSecondary }]}>{label}</Text>

      <View
        style={[
          styles.box,
          { backgroundColor: theme.sheetFill, borderColor: error ? theme.danger : theme.border },
        ]}
      >
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          placeholderTextColor={theme.textTertiary}
          selectionColor={theme.text}
          {...props}
          style={[Typography.body_17_regular, styles.input, { color: theme.text }, style]}
        />
        {accessory}
      </View>

      {error ? (
        <Text accessibilityLiveRegion="polite" style={[Typography.footnote_13_regular, { color: theme.danger }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
});

Field.displayName = 'Field';

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one + Spacing.half,
  },

  box: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radii.image,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
  },

  input: {
    flex: 1,
    paddingVertical: Spacing.twoAndOne,
  },
});
