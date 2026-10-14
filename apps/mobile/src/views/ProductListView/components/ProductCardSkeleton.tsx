import { StyleSheet, View } from 'react-native';

import { SilkSheen } from '@/components/catalog/SilkSheen';
import { Skeleton } from '@/components/ui/Skeleton';
import { ProductGrid, Radii, Spacing } from '@/constants/theme';

type ProductCardSkeletonProps = {
  width: number;
};

export function ProductCardSkeleton({ width }: ProductCardSkeletonProps) {
  return (
    <View style={{ width }}>
      {/* The photo area uses the silk surface photos load on; text lines stay plain. */}
      <View style={styles.image}>
        <SilkSheen tone={null} />
      </View>
      <Skeleton style={styles.name} />
      <Skeleton style={styles.price} />
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    aspectRatio: ProductGrid.imageAspectRatio,
    borderRadius: Radii.image,
    overflow: 'hidden',
  },

  name: {
    height: 13,
    width: '80%',
    marginTop: Spacing.twoAndOne,
  },

  price: {
    height: 13,
    width: '45%',
    marginTop: Spacing.two,
  },
});
