import { StyleSheet, View } from 'react-native';

import { SilkSheen } from '@/components/catalog/SilkSheen';
import { Radii } from '@/constants/theme';

import { BRAND_CARD_HEIGHT } from './BrandCard';

/** The same silk surface photos load on, so the list and its photos read as one. */
export function BrandCardSkeleton() {
  return (
    <View style={styles.card}>
      <SilkSheen tone={null} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: BRAND_CARD_HEIGHT,
    borderRadius: Radii.card,
    overflow: 'hidden',
  },
});
