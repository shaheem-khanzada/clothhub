import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { HStack } from '@/components/ui/HStack';
import { Radio } from '@/components/ui/Radio';
import { Separator } from '@/components/ui/Separator';
import { Text } from '@/components/ui/Text';
import { PageGutter, Radii, Spacing, Typography } from '@/constants/theme';
import { PRODUCT_SORTS } from '@/domain/catalog/filters';
import type { ProductSort } from '@/domain/catalog/types';
import { useTheme } from '@/hooks/useTheme';
import { isIos } from '@/lib/deviceInfo';
import { feedback } from '@/lib/feedback';

export const SORT_SHEET = 'product-sort';

type SortSheetProps = {
  selected: ProductSort;
  onSelect: (sort: ProductSort) => void;
};

/** A single choice that applies immediately — no confirm step to forget. */
export function SortSheet({ selected, onSelect }: SortSheetProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  const handleSelect = (sort: ProductSort) => {
    feedback.select();
    onSelect(sort);
    TrueSheet.dismiss(SORT_SHEET);
  };

  return (
    <TrueSheet
      name={SORT_SHEET}
      detents={['auto']}
      grabber
      // iOS 26 draws a Liquid Glass sheet when no background is given.
      backgroundColor={isIos ? undefined : theme.sheetBackground}
    >
      <View style={styles.container}>
        <Text accessibilityRole="header" style={[Typography.title_22_bold, styles.title]}>
          {t('catalog.sort.title')}
        </Text>

        <View style={[styles.list, { backgroundColor: theme.sheetFill }]}>
          {PRODUCT_SORTS.map((sort, index) => (
            <View key={sort}>
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ selected: sort === selected }}
                onPress={() => handleSelect(sort)}
                style={({ pressed }) => [
                  styles.row,
                  pressed && { backgroundColor: theme.sheetFillStrong },
                ]}
              >
                <HStack alignItems="center" justifyContent="space-between">
                  <Text style={Typography.body_17_regular}>
                    {t(`catalog.sort.options.${sort}`)}
                  </Text>

                  <Radio selected={sort === selected} />
                </HStack>
              </Pressable>

              {index < PRODUCT_SORTS.length - 1 ? (
                <Separator style={styles.separator} />
              ) : null}
            </View>
          ))}
        </View>
      </View>
    </TrueSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: PageGutter,
    paddingTop: Spacing.five,
    paddingBottom: Spacing.four,
  },

  title: {
    marginBottom: Spacing.three,
  },

  list: {
    borderRadius: Radii.card,
    overflow: 'hidden',
  },

  row: {
    minHeight: 52,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },

  separator: {
    marginStart: Spacing.three,
  },
});
