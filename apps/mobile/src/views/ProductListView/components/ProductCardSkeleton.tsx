import { StyleSheet, View } from 'react-native';

import { Skeleton } from '@/components/ui/Skeleton';
import { Radii, Spacing } from '@/constants/theme';

import { PRODUCT_IMAGE_ASPECT_RATIO } from './ProductCard';

type ProductCardSkeletonProps = {
  width: number;
};

export function ProductCardSkeleton({ width }: ProductCardSkeletonProps) {
  return (
    <View style={{ width }}>
      <Skeleton style={styles.image} />
      <Skeleton style={styles.name} />
      <Skeleton style={styles.price} />
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    aspectRatio: PRODUCT_IMAGE_ASPECT_RATIO,
    borderRadius: Radii.image,
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
