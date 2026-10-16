import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { Radii, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

/** Up to two initials from a name: "Ada Lovelace" → "AL", "ada" → "A". */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const letters = words.length > 1 ? [words[0], words[words.length - 1]] : words.slice(0, 1);

  return letters.map((word) => Array.from(word ?? '')[0]?.toUpperCase() ?? '').join('');
}

type AvatarProps = {
  name: string;
  size: number;
};

/** The person's initials on a cream disc; photos come with Apple/Google sign-in. */
export function Avatar({ name, size }: AvatarProps) {
  const theme = useTheme();

  return (
    <View
      accessible={false}
      style={[styles.disc, { width: size, height: size, backgroundColor: theme.primary }]}
    >
      <Text
        style={[
          size >= 56 ? Typography.title_28_bold : Typography.footnote_13_semibold,
          { color: theme.onPrimary },
        ]}
      >
        {initials(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  disc: {
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
