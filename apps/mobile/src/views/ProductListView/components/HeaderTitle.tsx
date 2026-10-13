import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';

import { Text } from '@/components/ui/Text';
import { VStack } from '@/components/ui/VStack';
import { Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

type HeaderTitleProps = {
  name: string;
  total: number | null;
};

/** Brand name over its product count, in the native navigation bar. */
export function HeaderTitle({ name, total }: HeaderTitleProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <VStack alignItems="center" style={styles.container}>
      <Text numberOfLines={1} accessibilityRole="header" style={Typography.body_17_semibold}>
        {name}
      </Text>

      {total !== null ? (
        <Text style={[Typography.caption_12_regular, { color: theme.textSecondary }]}>
          {t('catalog.common.productCount', { count: total })}
        </Text>
      ) : null}
    </VStack>
  );
}

const styles = StyleSheet.create({
  container: {
    maxWidth: 220,
  },
});
