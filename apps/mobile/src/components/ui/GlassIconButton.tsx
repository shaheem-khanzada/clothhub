import { Button as SwiftUIButton, Host, Image as SwiftUIImage } from '@expo/ui/swift-ui';
import {
  accessibilityLabel as swiftUIAccessibilityLabel,
  buttonBorderShape,
  buttonStyle,
  frame,
} from '@expo/ui/swift-ui/modifiers';
import type { ComponentProps } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type GestureResponderEvent,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Icon, type IconName } from '@/components/ui/Icon';
import { useTheme } from '@/hooks/useTheme';
import { hasLiquidGlass } from '@/lib/deviceInfo';
import { feedback } from '@/lib/feedback';

export type SFSymbol = NonNullable<ComponentProps<typeof SwiftUIImage>['systemName']>;

type GlassIconButtonProps = Omit<PressableProps, 'style' | 'children'> & {
  /** Drawn icon, for Android and iOS before 26. */
  icon: IconName;
  /** SF Symbol for the native Liquid Glass button on iOS 26. */
  symbol: SFSymbol;
  /** Read by VoiceOver — icon-only buttons have no visible label. */
  accessibilityLabel: string;
  size?: number;
  iconSize?: number;
  style?: StyleProp<ViewStyle>;
};


/** Lets the symbol fill whatever the host proposes, so the glass circle is exactly `size`. */
const FILL = 10_000;

/**
 * A circular control that floats over photography — the product card's heart,
 * the brand card's chevron, Android's reel buttons.
 *
 * On iOS 26 it is a native SwiftUI button with the `.glass` style and an SF
 * Symbol. No colour is set on purpose: Liquid Glass turns light over a bright
 * photo, and only a system symbol switches to dark with it — a drawn icon in a
 * fixed colour would vanish (white on white).
 *
 * Everywhere else it is a translucent dark disc with a hairline edge and the
 * drawn icon, which reads the same on any photo.
 */
export function GlassIconButton({
  icon,
  symbol,
  size = 44,
  iconSize = 20,
  disabled,
  onPress,
  style,
  accessibilityLabel,
  ...props
}: GlassIconButtonProps) {
  const theme = useTheme();

  const shape = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  const handlePress = (event?: GestureResponderEvent) => {
    feedback.tap();
    onPress?.(event as GestureResponderEvent);
  };

  if (hasLiquidGlass) {
    return (
      <Host style={[shape, style]} pointerEvents={props.pointerEvents}>
        <SwiftUIButton
          onPress={disabled ? undefined : () => handlePress()}
          modifiers={[
            buttonStyle('glass'),
            buttonBorderShape('circle'),
            ...(accessibilityLabel ? [swiftUIAccessibilityLabel(accessibilityLabel)] : []),
          ]}
        >
          <SwiftUIImage
            systemName={symbol}
            size={iconSize}
            modifiers={[frame({ maxWidth: FILL, maxHeight: FILL })]}
          />
        </SwiftUIButton>
      </Host>
    );
  }

  const content = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={Math.max(0, (44 - size) / 2)}
      {...props}
      disabled={disabled}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.pressable,
        shape,
        { opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <Icon name={icon} size={iconSize} color={theme.text} />
    </Pressable>
  );

  return (
    <View
      style={[
        styles.fallback,
        shape,
        {
          backgroundColor: theme.glassFallback,
          borderColor: theme.glassBorder,
        },
        style,
      ]}
    >
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  pressable: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  fallback: {
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
});
