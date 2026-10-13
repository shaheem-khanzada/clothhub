import { StyleSheet } from 'react-native';

import { Skeleton } from '@/components/ui/Skeleton';
import { Radii } from '@/constants/theme';

import { BRAND_CARD_HEIGHT } from './BrandCard';

export function BrandCardSkeleton() {
  return <Skeleton style={styles.card} />;
}

const styles = StyleSheet.create({
  card: {
    height: BRAND_CARD_HEIGHT,
    borderRadius: Radii.card,
  },
});
