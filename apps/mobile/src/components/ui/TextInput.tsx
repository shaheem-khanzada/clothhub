import { forwardRef } from 'react';
import {
  I18nManager,
  TextInput as RNTextInput,
  StyleSheet,
  type TextInput as RNTextInputInstance,
  type TextInputProps as RNTextInputProps,
} from 'react-native';

import { FontFamilies } from '@/constants/typography';

export type TextInputProps = RNTextInputProps;
export type TextInputRef = RNTextInputInstance;

export const TextInput = forwardRef<TextInputRef, TextInputProps>(
  ({ style, ...props }, ref) => {
    return (
      <RNTextInput
        ref={ref}
        keyboardAppearance="dark"
        {...props}
        style={[styles.input, style]}
      />
    );
  },
);

TextInput.displayName = 'TextInput';

const styles = StyleSheet.create({
  input: {
    fontFamily: FontFamilies.regular,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
    writingDirection: I18nManager.isRTL ? 'rtl' : 'auto',
  },
});
