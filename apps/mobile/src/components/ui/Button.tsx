import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { Icon, type IconName } from '@/components/ui/Icon';
import { Text } from '@/components/ui/Text';
import { Radii, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { feedback } from '@/lib/feedback';

export type ButtonVariant =
  /** The single prominent action on a screen — cream fill, dark label. */
  | 'primary'
  /** A filled secondary control: toolbar buttons, sheet actions. */
  | 'surface'
  /** Plain inline text action — no fill, no box. */
  | 'link';

/**
 * lg is the full-width CTA (Visit Brand), md a toolbar or sheet button,
 * sm a compact inline pill.
 */
export type ButtonSize = 'lg' | 'md' | 'sm';

type ButtonProps = Omit<PressableProps, 'style' | 'children'> & {
  title?: string;
  children?: ReactNode;

  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;

  leftIcon?: IconName;
  rightIcon?: IconName;
  iconSize?: number;

  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export function Button({
  title,
  children,
  variant = 'primary',
  size = 'lg',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  iconSize = 18,
  style,
  textStyle,
  onPress,
  ...props
}: ButtonProps) {
  const theme = useTheme();

  const variants = {
    primary: {
      backgroundColor: theme.primary,
      contentColor: theme.onPrimary,
    },

    surface: {
      backgroundColor: theme.surface,
      contentColor: theme.text,
    },

    link: {
      backgroundColor: 'transparent',
      contentColor: theme.text,
    },
  } satisfies Record<
    ButtonVariant,
    {
      backgroundColor: string;
      contentColor: string;
    }
  >;

  const colors = variants[variant];
  const isLink = variant === 'link';

  const contentColor = disabled
    ? theme.textTertiary
    : colors.contentColor;

  const backgroundColor = disabled && !isLink
    ? theme.surface
    : colors.backgroundColor;

  const handlePress: PressableProps['onPress'] = (event) => {
    if (!isLink) {
      feedback.tap();
    }

    onPress?.(event);
  };

  const sizes = {
    lg: {
      height: 54,
      width: '100%' as const,
      paddingHorizontal: Spacing.three,
    },

    md: {
      height: 44,
      paddingHorizontal: Spacing.three,
    },

    sm: {
      height: 34,
      paddingHorizontal: Spacing.twoAndOne,
    },
  } satisfies Record<ButtonSize, ViewStyle>;

  const titleStyle = size === 'lg'
    ? Typography.body_17_semibold
    : Typography.subhead_15_semibold;

  return (
    <Pressable
      accessibilityRole="button"
      {...props}
      onPress={handlePress}
      disabled={disabled || loading}
      hitSlop={isLink ? Spacing.two : undefined}
      style={({ pressed }) => [
        styles.container,
        !isLink && styles.pill,
        !isLink && sizes[size],
        { backgroundColor },
        { opacity: pressed ? 0.75 : 1 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={contentColor} />
      ) : children ? (
        children
      ) : (
        <>
          {leftIcon ? (
            <Icon
              name={leftIcon}
              size={iconSize}
              color={contentColor}
            />
          ) : null}

          {title ? (
            <Text
              numberOfLines={1}
              style={[
                titleStyle,
                { color: contentColor },
                textStyle,
              ]}
            >
              {title}
            </Text>
          ) : null}

          {rightIcon ? (
            <Icon
              name={rightIcon}
              size={iconSize}
              color={contentColor}
            />
          ) : null}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },

  pill: {
    borderRadius: Radii.pill,
  },
});
