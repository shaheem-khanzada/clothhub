import React from 'react';
import {
  StyleSheet,
  View,
  type ViewProps,
  type ViewStyle,
} from 'react-native';

import { Spacing } from '@/constants/theme';

type StackSpace =
  | 'half'
  | 'one'
  | 'two'
  | 'three'
  | 'four';

type HStackProps = ViewProps & {
  space?: StackSpace;
  gap?: ViewStyle['gap'];
  reversed?: boolean;
  alignItems?: ViewStyle['alignItems'];
  justifyContent?: ViewStyle['justifyContent'];
};

const spaces: Record<StackSpace, number> = {
  half: Spacing.half,
  one: Spacing.one,
  two: Spacing.two,
  three: Spacing.three,
  four: Spacing.four,
};

export const HStack = React.forwardRef<View, HStackProps>(
  function HStack(
    {
      space,
      gap,
      reversed = false,
      alignItems,
      justifyContent,
      style,
      ...props
    },
    ref,
  ) {
    return (
      <View
        ref={ref}
        {...props}
        style={[
          styles.container,
          reversed && styles.reversed,
          {
            gap: gap ?? (space ? spaces[space] : undefined),
            alignItems,
            justifyContent,
          },
          style,
        ]}
      />
    );
  },
);

HStack.displayName = 'HStack';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },

  reversed: {
    flexDirection: 'row-reverse',
  },
});