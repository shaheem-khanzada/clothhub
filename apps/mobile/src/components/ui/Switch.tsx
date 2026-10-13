import { forwardRef } from 'react';
import {
  Switch as RNSwitch,
  type Switch as RNSwitchInstance,
  type SwitchProps as RNSwitchProps,
} from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { feedback } from '@/lib/feedback';

export type SwitchProps = Omit<
  RNSwitchProps,
  'trackColor' | 'thumbColor' | 'ios_backgroundColor'
>;

// Thin themed wrapper so every toggle in the app shares the same on/off colours.
export const Switch = forwardRef<RNSwitchInstance, SwitchProps>(function Switch(
  { value, disabled, style, onValueChange, ...props },
  ref,
) {
  const theme = useTheme();

  const handleValueChange = (next: boolean) => {
    feedback.toggle();
    onValueChange?.(next);
  };

  return (
    <RNSwitch
      ref={ref}
      value={value}
      disabled={disabled}
      trackColor={{ false: theme.surfaceRaised, true: theme.success }}
      thumbColor={theme.text}
      ios_backgroundColor={theme.surfaceRaised}
      {...props}
      onValueChange={handleValueChange}
      style={[{ opacity: disabled ? 0.6 : 1 }, style]}
    />
  );
});
