import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { HStack } from '@/components/ui/HStack';
import { RangeSlider } from '@/components/ui/RangeSlider';
import { Separator } from '@/components/ui/Separator';
import { Switch } from '@/components/ui/Switch';
import { Text } from '@/components/ui/Text';
import { VStack } from '@/components/ui/VStack';
import { PageGutter, Radii, Spacing, Typography } from '@/constants/theme';
import {
  DEFAULT_FILTERS,
  PIECE_TYPES,
  PRICE_STEP,
  countActiveFilters,
  normalizePriceRange,
  priceBounds,
} from '@/domain/catalog/filters';
import type {
  PieceType,
  PriceRange,
  ProductFacets,
  ProductFilters,
} from '@/domain/catalog/types';
import { useTheme } from '@/hooks/useTheme';
import { isIos } from '@/lib/deviceInfo';
import { formatPrice } from '@/lib/formatters';

export const FILTER_SHEET = 'product-filters';

type FilterSheetProps = {
  facets: ProductFacets;
  filters: ProductFilters;
  onApply: (filters: ProductFilters) => void;
};

/**
 * Edits are local until Apply — the grid behind the sheet only reloads once,
 * with the whole new set.
 */
export function FilterSheet({ facets, filters, onApply }: FilterSheetProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  const bounds = priceBounds(facets);

  const [draft, setDraft] = useState<ProductFilters>(filters);
  const [draftRange, setDraftRange] = useState<PriceRange>(filters.priceRange ?? bounds);

  const pending: ProductFilters = {
    ...draft,
    priceRange: normalizePriceRange(draftRange, bounds),
  };
  const pendingCount = countActiveFilters(pending);

  const pieceTypes = PIECE_TYPES.filter((type) => facets.pieceTypes.includes(type));

  const handleWillPresent = () => {
    setDraft(filters);
    setDraftRange(filters.priceRange ?? bounds);
  };

  const handleReset = () => {
    setDraft(DEFAULT_FILTERS);
    setDraftRange(bounds);
  };

  const handleApply = () => {
    onApply(pending);
    TrueSheet.dismiss(FILTER_SHEET);
  };

  const setPieceType = (pieceType: PieceType | null) => {
    setDraft((current) => ({ ...current, pieceType }));
  };

  return (
    <TrueSheet
      name={FILTER_SHEET}
      detents={['auto']}
      grabber
      // iOS 26 draws a Liquid Glass sheet when no background is given.
      backgroundColor={isIos ? undefined : theme.sheetBackground}
      onWillPresent={handleWillPresent}
      header={
        <HStack alignItems="center" justifyContent="space-between" style={styles.header}>
          <Button
            title={t('common.actions.reset')}
            variant="link"
            onPress={handleReset}
            textStyle={{ color: theme.textSecondary }}
            style={styles.headerSide}
          />

          <Text accessibilityRole="header" style={Typography.body_17_semibold}>
            {t('catalog.filters.title')}
          </Text>

          <Button
            title={
              pendingCount > 0
                ? t('common.actions.applyCount', { count: pendingCount })
                : t('common.actions.apply')
            }
            variant="primary"
            size="sm"
            onPress={handleApply}
            style={styles.headerSide}
          />
        </HStack>
      }
    >
      {/* Android needs its own gesture root inside a native sheet. */}
      <GestureHandlerRootView style={styles.gestureRoot}>
        <VStack space="four" style={styles.content}>
          <VStack gap={Spacing.twoAndOne}>
            <Text style={Typography.subhead_15_semibold}>
              {t('catalog.filters.priceRange')}
            </Text>

            <RangeSlider
              min={bounds[0]}
              max={bounds[1]}
              step={PRICE_STEP}
              value={draftRange}
              onChange={setDraftRange}
              accessibilityLabel={t('catalog.filters.priceSlider')}
            />

            <HStack space="two">
              <PriceBox label={t('catalog.filters.minimum')} value={draftRange[0]} />
              <PriceBox label={t('catalog.filters.maximum')} value={draftRange[1]} />
            </HStack>
          </VStack>

          {pieceTypes.length > 1 ? (
            <VStack gap={Spacing.twoAndOne}>
              <Text style={Typography.subhead_15_semibold}>
                {t('catalog.filters.type')}
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chips}
              >
                <Chip
                  label={t('catalog.filters.all')}
                  selected={draft.pieceType === null}
                  onPress={() => setPieceType(null)}
                />

                {pieceTypes.map((type) => (
                  <Chip
                    key={type}
                    label={t(`catalog.common.pieceType.${type}`)}
                    selected={draft.pieceType === type}
                    onPress={() => setPieceType(type)}
                  />
                ))}
              </ScrollView>
            </VStack>
          ) : null}

          <View style={[styles.group, { backgroundColor: theme.sheetFill }]}>
            <ToggleRow
              title={t('catalog.filters.availability')}
              label={t('catalog.filters.inStockOnly')}
              value={draft.inStockOnly}
              onValueChange={(inStockOnly) =>
                setDraft((current) => ({ ...current, inStockOnly }))
              }
            />

            <Separator style={styles.groupSeparator} />

            <ToggleRow
              title={t('catalog.filters.onSale')}
              label={t('catalog.filters.onSaleOnly')}
              value={draft.onSaleOnly}
              onValueChange={(onSaleOnly) =>
                setDraft((current) => ({ ...current, onSaleOnly }))
              }
            />
          </View>
        </VStack>
      </GestureHandlerRootView>
    </TrueSheet>
  );
}

function PriceBox({ label, value }: { label: string; value: number }) {
  const theme = useTheme();

  return (
    <View
      accessible
      accessibilityLabel={`${label} ${formatPrice(value)}`}
      style={[styles.priceBox, { backgroundColor: theme.sheetFill }]}
    >
      <Text style={[Typography.caption_12_regular, { color: theme.textSecondary }]}>
        {label}
      </Text>

      <Text style={Typography.body_17_semibold}>{formatPrice(value)}</Text>
    </View>
  );
}

type ToggleRowProps = {
  title: string;
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
};

function ToggleRow({ title, label, value, onValueChange }: ToggleRowProps) {
  const theme = useTheme();

  return (
    <HStack alignItems="center" justifyContent="space-between" space="three" style={styles.toggleRow}>
      <VStack style={styles.toggleText}>
        <Text style={[Typography.footnote_13_regular, { color: theme.textSecondary }]}>
          {title}
        </Text>

        <Text style={Typography.body_17_regular}>{label}</Text>
      </VStack>

      <Switch
        value={value}
        onValueChange={onValueChange}
        accessibilityLabel={label}
      />
    </HStack>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: PageGutter,
    paddingTop: Spacing.five,
    paddingBottom: Spacing.two,
  },

  headerSide: {
    minWidth: 72,
  },

  gestureRoot: {
    flexGrow: 1,
  },

  content: {
    paddingHorizontal: PageGutter,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.four,
  },

  priceBox: {
    flex: 1,
    borderRadius: Radii.image,
    paddingHorizontal: Spacing.twoAndOne,
    paddingVertical: Spacing.two,
    gap: Spacing.half,
  },

  chips: {
    gap: Spacing.two,
  },

  group: {
    borderRadius: Radii.card,
    overflow: 'hidden',
  },

  groupSeparator: {
    marginStart: Spacing.three,
  },

  toggleRow: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.twoAndOne,
  },

  toggleText: {
    flex: 1,
  },
});
