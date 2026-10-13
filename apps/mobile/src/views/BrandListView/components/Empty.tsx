import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { ErrorState } from '@/components/ErrorState';
import { SkeletonList } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

import { BrandCardSkeleton } from './BrandCardSkeleton';

type EmptyProps =
  | { state: 'loading' }
  | { state: 'error'; retrying: boolean; onRetry: () => void }
  | { state: 'noMatches'; query: string };

const SKELETON_COUNT = 3;

export function Empty(props: EmptyProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  if (props.state === 'loading') {
    return (
      <View style={styles.skeletons}>
        <SkeletonList count={SKELETON_COUNT}>
          <BrandCardSkeleton />
        </SkeletonList>
      </View>
    );
  }

  if (props.state === 'error') {
    return <ErrorState onRetry={props.onRetry} retrying={props.retrying} />;
  }

  return (
    <Text
      style={[
        Typography.subhead_15_regular,
        styles.noMatches,
        { color: theme.textSecondary },
      ]}
    >
      {t('catalog.brands.empty', { query: props.query })}
    </Text>
  );
}

const styles = StyleSheet.create({
  skeletons: {
    gap: Spacing.three,
  },

  noMatches: {
    textAlign: 'center',
    paddingVertical: Spacing.five,
  },
});
