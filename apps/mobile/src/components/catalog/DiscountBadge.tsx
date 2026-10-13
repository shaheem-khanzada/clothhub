import { useTranslation } from 'react-i18next';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Text } from '@/components/ui/Text';
import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

type DiscountBadgeProps = {
  percent: number;
  style?: StyleProp<ViewStyle>;
};

/** "25% OFF" — shown wherever a sale price is. */
export function DiscountBadge({ percent, style }: DiscountBadgeProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <View style={[styles.badge, { backgroundColor: theme.successSoft }, style]}>
      <Text style={[styles.label, { color: theme.success }]}>
        {t('catalog.common.discount', { percent })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: 6,
  },

  label: {
    ...Typography.caption_11_bold,
  },
});
