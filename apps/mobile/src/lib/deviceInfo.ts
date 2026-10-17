import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { Platform } from 'react-native';

export const isIos = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';

/**
 * iOS 26's Liquid Glass. Sheets and floating buttons leave their background
 * unset there so the system draws glass; everywhere else they draw their own.
 * Fixed for the life of the process.
 */
export const hasLiquidGlass = isIos && isLiquidGlassAvailable();
