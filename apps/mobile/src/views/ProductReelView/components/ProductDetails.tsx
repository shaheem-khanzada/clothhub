import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { Chip } from '@/components/ui/Chip';
import { HStack } from '@/components/ui/HStack';
import { Icon } from '@/components/ui/Icon';
import { Separator } from '@/components/ui/Separator';
import { Text } from '@/components/ui/Text';
import { VStack } from '@/components/ui/VStack';
import { PageGutter, Radii, Spacing, Typography } from '@/constants/theme';
import type { Product } from '@/domain/catalog/types';
import { useTheme } from '@/hooks/useTheme';
import { feedback } from '@/lib/feedback';

type ProductDetailsProps = {
  product: Product;
};

/** Everything below the collapsed card, revealed as the sheet is dragged up. */
export function ProductDetails({ product }: ProductDetailsProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [detailsExpanded, setDetailsExpanded] = useState(true);

  const sizeChips = [
    ...(product.stitching ? [t(`catalog.common.stitching.${product.stitching}`)] : []),
    ...product.sizes,
  ];

  const facts = [
    product.fabric ? { label: t('catalog.reel.fabric'), value: product.fabric } : null,
    product.color ? { label: t('catalog.reel.color'), value: product.color } : null,
  ].filter((fact) => fact !== null);

  const hasDetails =
    product.components.length > 0 || product.highlights.length > 0 || facts.length > 0;

  const toggleDetails = () => {
    feedback.select();
    setDetailsExpanded((expanded) => !expanded);
  };

  return (
    <VStack space="four" style={styles.container}>
      <HStack alignItems="center" space="two">
        <View
          style={[
            styles.stockDot,
            { backgroundColor: product.inStock ? theme.success : theme.danger },
          ]}
        />

        <Text style={[Typography.footnote_13_regular, { color: theme.textSecondary }]}>
          {product.inStock ? t('catalog.common.inStock') : t('catalog.common.outOfStock')}
        </Text>
      </HStack>

      {product.description ? (
        <VStack space="one">
          <Text
            numberOfLines={descriptionExpanded ? undefined : 3}
            style={[Typography.subhead_15_regular, { color: theme.textSecondary }]}
          >
            {product.description}
          </Text>

          <Pressable
            accessibilityRole="button"
            hitSlop={Spacing.two}
            onPress={() => setDescriptionExpanded((expanded) => !expanded)}
          >
            <Text style={Typography.subhead_15_semibold}>
              {descriptionExpanded ? t('catalog.reel.showLess') : t('catalog.reel.showMore')}
            </Text>
          </Pressable>
        </VStack>
      ) : null}

      {sizeChips.length > 0 ? (
        <VStack space="two">
          <Text style={Typography.subhead_15_semibold}>{t('catalog.reel.availableSizes')}</Text>

          <HStack space="two" style={styles.wrap}>
            {sizeChips.map((label) => (
              <Chip key={label} label={label} />
            ))}
          </HStack>
        </VStack>
      ) : null}

      {hasDetails ? (
        <View style={[styles.group, { backgroundColor: theme.sheetFill }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: detailsExpanded }}
            onPress={toggleDetails}
            style={styles.groupHeader}
          >
            <HStack alignItems="center" justifyContent="space-between">
              <Text style={Typography.body_17_semibold}>{t('catalog.reel.details')}</Text>

              <Icon
                name="chevron.down.outline"
                size={18}
                color={theme.textSecondary}
                style={detailsExpanded && styles.chevronOpen}
              />
            </HStack>
          </Pressable>

          {detailsExpanded ? (
            <VStack style={styles.groupBody}>
              {facts.map((fact) => (
                <HStack key={fact.label} justifyContent="space-between" style={styles.factRow}>
                  <Text style={[Typography.subhead_15_regular, { color: theme.textSecondary }]}>
                    {fact.label}
                  </Text>

                  <Text style={Typography.subhead_15_medium}>{fact.value}</Text>
                </HStack>
              ))}

              {product.components.map((component) => (
                <VStack key={component.label} space="half" style={styles.component}>
                  <Separator style={styles.componentSeparator} />

                  <Text style={Typography.subhead_15_semibold}>{component.label}</Text>

                  {component.lines.map((line) => (
                    <Text
                      key={line}
                      style={[Typography.subhead_15_regular, { color: theme.textSecondary }]}
                    >
                      {line}
                    </Text>
                  ))}
                </VStack>
              ))}

              {product.highlights.length > 0 ? (
                <VStack space="one" style={styles.component}>
                  <Separator style={styles.componentSeparator} />

                  {product.highlights.map((line) => (
                    <Text
                      key={line}
                      style={[Typography.subhead_15_regular, { color: theme.textSecondary }]}
                    >
                      {`•  ${line}`}
                    </Text>
                  ))}
                </VStack>
              ) : null}
            </VStack>
          ) : null}
        </View>
      ) : null}
    </VStack>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: PageGutter,
    paddingBottom: Spacing.four,
  },

  stockDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  wrap: {
    flexWrap: 'wrap',
  },

  group: {
    borderRadius: Radii.card,
    overflow: 'hidden',
  },

  groupHeader: {
    minHeight: 52,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },

  chevronOpen: {
    transform: [{ rotate: '180deg' }],
  },

  groupBody: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
  },

  factRow: {
    paddingVertical: Spacing.one,
  },

  component: {
    paddingTop: Spacing.twoAndOne,
  },

  componentSeparator: {
    marginBottom: Spacing.twoAndOne,
  },
});
