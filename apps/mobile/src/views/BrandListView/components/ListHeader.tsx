import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';

import { HStack } from '@/components/ui/HStack';
import { SearchInput } from '@/components/ui/SearchInput';
import { Text } from '@/components/ui/Text';
import { VStack } from '@/components/ui/VStack';
import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

import { AccountButton } from './AccountButton';

type ListHeaderProps = {
  query: string;
  onQueryChange: (query: string) => void;
};

export function ListHeader({ query, onQueryChange }: ListHeaderProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <VStack style={styles.container}>
      <HStack alignItems="center" justifyContent="space-between">
        <Text accessibilityRole="header" style={Typography.largeTitle_34_bold}>
          {t('catalog.brands.title')}
        </Text>

        <AccountButton />
      </HStack>

      <Text style={[Typography.subhead_15_regular, { color: theme.textSecondary }]}>
        {t('catalog.brands.subtitle')}
      </Text>

      <SearchInput
        value={query}
        onChangeText={onQueryChange}
        onClear={() => onQueryChange('')}
        clearAccessibilityLabel={t('common.actions.clear')}
        placeholder={t('catalog.brands.searchPlaceholder')}
        containerStyle={styles.search}
      />
    </VStack>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: Spacing.two,
    paddingBottom: Spacing.twenty,
    gap: Spacing.half,
  },

  search: {
    marginTop: Spacing.three,
  },
});
