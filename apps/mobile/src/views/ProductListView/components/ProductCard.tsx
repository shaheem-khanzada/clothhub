import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { DiscountBadge } from '@/components/catalog/DiscountBadge';
import { LikeButton } from '@/components/catalog/LikeButton';
import { PriceLine } from '@/components/catalog/PriceLine';
import { ProductImage } from '@/components/catalog/ProductImage';
import { Text } from '@/components/ui/Text';
import { VStack } from '@/components/ui/VStack';
import { ProductGrid, Radii, Spacing, Typography } from '@/constants/theme';
import { toneOf } from '@/constants/tones';
import type { Product } from '@/domain/catalog/types';
import { useIsFavorite, useToggleFavorite } from '@/domain/favorites/useFavoritesStore';
import { useTheme } from '@/hooks/useTheme';

type ProductCardProps = {
  product: Product;
  /** Rendered width in points, used to request a right-sized photo. */
  width: number;
  /** Takes the product, so the list can pass one stable callback to every card. */
  onPress: (product: Product) => void;
};

export function ProductCard({ product, width, onPress }: ProductCardProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const liked = useIsFavorite(product.id);
  const toggleFavorite = useToggleFavorite();

  const cover = product.images[0];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={product.title}
      onPress={() => onPress(product)}
      style={({ pressed }) => [{ width }, pressed && styles.pressed]}
    >
      <View style={[styles.imageFrame, { backgroundColor: theme.surface }]}>
        <ProductImage
          uri={cover}
          width={width}
          tone={toneOf(product.colors)}
          thumbhash={product.coverThumbhash}
          recyclingKey={product.id}
          style={StyleSheet.absoluteFill}
        />

        {!product.inStock ? (
          <View style={[styles.stockLabel, { backgroundColor: theme.scrim }]}>
            <Text style={Typography.caption_11_bold}>
              {t('catalog.common.outOfStock')}
            </Text>
          </View>
        ) : null}

        <LikeButton
          liked={liked}
          onToggle={() => toggleFavorite(product.id)}
          size={32}
          iconSize={15}
          style={styles.save}
        />
      </View>

      <VStack space="one" style={styles.info}>
        <Text numberOfLines={2} style={Typography.footnote_13_medium}>
          {product.name}
        </Text>

        <PriceLine price={product.price} compareAtPrice={product.compareAtPrice} />

        {product.discountPercent ? (
          <DiscountBadge percent={product.discountPercent} />
        ) : null}
      </VStack>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.85,
  },

  imageFrame: {
    aspectRatio: ProductGrid.imageAspectRatio,
    borderRadius: Radii.image,
    overflow: 'hidden',
  },

  save: {
    position: 'absolute',
    top: Spacing.two,
    end: Spacing.two,
  },

  stockLabel: {
    position: 'absolute',
    start: Spacing.two,
    bottom: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: 6,
  },

  info: {
    paddingTop: Spacing.two,
    paddingHorizontal: Spacing.half,
  },
});
