import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { DiscountBadge } from '@/components/catalog/DiscountBadge';
import { PriceLine } from '@/components/catalog/PriceLine';
import { HStack } from '@/components/ui/HStack';
import { Text } from '@/components/ui/Text';
import { VStack } from '@/components/ui/VStack';
import { PageGutter, Spacing, Typography } from '@/constants/theme';
import type { Product } from '@/domain/catalog/types';
import { useTheme } from '@/hooks/useTheme';
import { sizedImageUrl } from '@/lib/images';

const THUMB_SIZE = 64;
const NAME_LINES = 2;

const NAME_MARGIN_TOP = Spacing.one;
const NAME_MARGIN_BOTTOM = Spacing.two;

/**
 * Tall enough for a two-line name. The text block is centred in it, so a
 * one-line name leaves the space above and below the block rather than
 * between the name and the price — and the card keeps one height as you
 * swipe between products.
 */
const TEXT_BLOCK_HEIGHT =
  Typography.caption_12_semibold.lineHeight +
  NAME_MARGIN_TOP +
  Typography.body_17_semibold.lineHeight * NAME_LINES +
  NAME_MARGIN_BOTTOM +
  Typography.subhead_15_bold.lineHeight;

type ProductSummaryProps = {
  product: Product;
  /** Space under the price; the sheet passes less when the system adds its own. */
  bottomPadding?: number;
};

/**
 * The collapsed card, and the top of the opened sheet: who makes it, what it
 * is and what it costs, next to a round crop of the outfit.
 */
export function ProductSummary({ product, bottomPadding = Spacing.three }: ProductSummaryProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const cover = product.images[0];

  const meta = [
    product.brandName,
    product.pieceCount ? t('catalog.common.pieceCount', { count: product.pieceCount }) : null,
    // Most names already say the fabric; only add it when they don't.
    product.fabric && !product.shortName.toLowerCase().includes(product.fabric.toLowerCase())
      ? product.fabric
      : null,
  ]
    .filter(Boolean)
    .join('  ·  ');

  return (
    <HStack
      alignItems="center"
      space="three"
      style={[styles.container, { paddingBottom: 0 }]}
    >
      <View style={[styles.thumb, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {cover ? (
          <Image
            source={{ uri: sizedImageUrl(cover, 220) }}
            contentFit="cover"
            // Portrait product shots: the upper part holds the neckline and
            // embroidery, which is what identifies the outfit in a circle.
            contentPosition={{ top: '25%' }}
            style={StyleSheet.absoluteFill}
          />
        ) : null}
      </View>

      <VStack style={styles.text}>
        <Text
          numberOfLines={1}
          style={[Typography.caption_12_semibold, styles.meta, { color: theme.textSecondary }]}
        >
          {meta}
        </Text>

        <Text
          accessibilityRole="header"
          numberOfLines={NAME_LINES}
          style={[Typography.body_17_semibold, styles.name]}
        >
          {product.shortName}
        </Text>

        <HStack alignItems="center" space="two">
          <PriceLine price={product.price} compareAtPrice={product.compareAtPrice} />

          {product.discountPercent ? (
            <DiscountBadge percent={product.discountPercent} style={styles.badge} />
          ) : null}
        </HStack>
      </VStack>
    </HStack>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: PageGutter + Spacing.one,
    // Clears the grabber.
    paddingTop: Spacing.twenty + Spacing.one,
  },

  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },

  text: {
    flex: 1,
    minHeight: TEXT_BLOCK_HEIGHT,
    justifyContent: 'center',
  },

  meta: {
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },

  name: {
    marginTop: NAME_MARGIN_TOP,
    marginBottom: NAME_MARGIN_BOTTOM,
  },

  badge: {
    alignSelf: 'center',
  },
});
