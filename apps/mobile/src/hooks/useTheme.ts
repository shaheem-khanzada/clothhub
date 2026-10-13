import { Colors, type ThemeColors } from '@/constants/theme';

/**
 * The active scheme's semantic colours.
 *
 * ClothHub is dark-only, so this always returns the dark palette. Screens still
 * go through the hook so a second scheme is a change here and nowhere else.
 */
export function useTheme(): ThemeColors {
  return Colors.dark;
}
