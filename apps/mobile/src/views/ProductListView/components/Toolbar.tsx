import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';

import { Button } from '@/components/ui/Button';
import { HStack } from '@/components/ui/HStack';
import { Spacing } from '@/constants/theme';

type ToolbarProps = {
  activeFilterCount: number;
  filtersAvailable: boolean;
  onSortPress: () => void;
  onFiltersPress: () => void;
};

export function Toolbar({
  activeFilterCount,
  filtersAvailable,
  onSortPress,
  onFiltersPress,
}: ToolbarProps) {
  const { t } = useTranslation();

  return (
    <HStack space="two" style={styles.container}>
      <Button
        title={t('catalog.products.sort')}
        variant="surface"
        size="md"
        leftIcon="sort.outline"
        onPress={onSortPress}
        style={styles.button}
      />

      <Button
        title={
          activeFilterCount > 0
            ? t('catalog.products.filtersCount', { count: activeFilterCount })
            : t('catalog.products.filters')
        }
        variant="surface"
        size="md"
        leftIcon="filter.outline"
        disabled={!filtersAvailable}
        onPress={onFiltersPress}
        style={styles.button}
      />
    </HStack>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: Spacing.three,
  },

  button: {
    flex: 1,
  },
});
