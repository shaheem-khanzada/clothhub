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

type VStackProps = ViewProps & {
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

export const VStack = React.forwardRef<View, VStackProps>(
  function VStack(
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

VStack.displayName = 'VStack';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
  },

  reversed: {
    flexDirection: 'column-reverse',
  },
});