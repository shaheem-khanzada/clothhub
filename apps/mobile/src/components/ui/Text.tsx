import {
  StyleSheet,
  Text as RNText,
  type TextProps as RNTextProps,
} from 'react-native';

import { FontFamilies } from '@/constants/typography';
import { useTheme } from '@/hooks/useTheme';

export type TextProps = RNTextProps;

/**
 * App text. Defaults to the primary text colour so a dark-only app never
 * renders the platform's black default on a black page; screens still pass a
 * typography preset and, where needed, a secondary colour.
 */
export function Text({
  style,
  ...props
}: TextProps) {
  const theme = useTheme();

  return (
    <RNText
      {...props}
      style={[
        styles.text,
        { color: theme.text },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  text: {
    // The app face even where a screen sets no typography preset.
    fontFamily: FontFamilies.regular,
    textAlign: 'left',
  },
});
