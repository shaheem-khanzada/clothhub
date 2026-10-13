import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { ErrorState } from '@/components/ErrorState';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { VStack } from '@/components/ui/VStack';
import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

import { ProductCardSkeleton } from './ProductCardSkeleton';

type EmptyProps =
  | { state: 'loading'; cardWidth: number; gap: number }
  | { state: 'error'; retrying: boolean; onRetry: () => void }
  | { state: 'noResults'; canClear: boolean; onClear: () => void };

const SKELETON_COUNT = 6;

export function Empty(props: EmptyProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  if (props.state === 'loading') {
    return (
      <View style={[styles.grid, { gap: props.gap }]}>
        {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
          <ProductCardSkeleton key={index} width={props.cardWidth} />
        ))}
      </View>
    );
  }

  if (props.state === 'error') {
    return <ErrorState onRetry={props.onRetry} retrying={props.retrying} />;
  }

  return (
    <VStack alignItems="center" space="two" style={styles.noResults}>
      <Text style={Typography.body_17_semibold}>
        {t('catalog.products.empty.title')}
      </Text>

      <Text
        style={[
          Typography.subhead_15_regular,
          styles.centered,
          { color: theme.textSecondary },
        ]}
      >
        {t('catalog.products.empty.description')}
      </Text>

      {props.canClear ? (
        <Button
          title={t('catalog.products.empty.clearFilters')}
          variant="surface"
          size="md"
          onPress={props.onClear}
          style={styles.clear}
        />
      ) : null}
    </VStack>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  noResults: {
    paddingVertical: Spacing.five,
    paddingHorizontal: Spacing.four,
  },

  centered: {
    textAlign: 'center',
  },

  clear: {
    marginTop: Spacing.two,
  },
});
