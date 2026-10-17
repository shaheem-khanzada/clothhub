import {
  type DetentInfoEventPayload,
  type TrueSheet,
} from '@lodev09/react-native-true-sheet';
import {
  ReanimatedTrueSheet,
  ReanimatedTrueSheetProvider,
  useReanimatedTrueSheet,
} from '@lodev09/react-native-true-sheet/reanimated';
import { forwardRef, useRef, useState, type ForwardedRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, type NativeSyntheticEvent } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { PageGutter, Spacing } from '@/constants/theme';
import type { Product } from '@/domain/catalog/types';
import { useTheme } from '@/hooks/useTheme';
import { hasLiquidGlass, isIos } from '@/lib/deviceInfo';

import { ProductDetails } from './ProductDetails';
import { ProductSummary } from './ProductSummary';

export const PRODUCT_SHEET = 'reel-product';

// iOS 26 floats the collapsed sheet above the home indicator. The sheet
// library's automatic inset only *guesses* whether a sheet will float, and on
// a short card it guessed wrong and added an empty home-indicator strip. On
// iOS 26 that inset is off: the sheet is exactly its content, and the pinned
// footer pads itself clear of the home indicator instead.
const floatingSheet = hasLiquidGlass;

type ProductSheetProps = {
  product: Product;
  /** Reports the sheet's resting detent and its top edge (y from the top of the screen). */
  onSettle: (index: number, position: number) => void;
  onVisitBrand: () => void;
  /** A drag-down or Android back on the collapsed card means "leave the reel". */
  onRequestClose: () => void;
};

/**
 * The product card that never goes away.
 *
 * Collapsed, it is just the summary — photo, brand, name, price — floating
 * over the reel. Dragged up, the details appear below it and "Visit Brand"
 * is pinned at the bottom.
 *
 * The summary is the sheet's header, so the `peek` detent is its height. The
 * system still adds the home-indicator inset under it, and the top of the
 * footer would show in that strip — so:
 * - the strip serves as the card's bottom padding (the summary pads less), and
 * - the footer fades in with the sheet's live position, invisible and
 *   untouchable while collapsed.
 *
 * Undimmed while collapsed, so the photos behind stay swipeable.
 */
export const ProductSheet = forwardRef<TrueSheet, ProductSheetProps>(
  function ProductSheet(props, ref) {
    return (
      <ReanimatedTrueSheetProvider>
        <Sheet {...props} sheetRef={ref} />
      </ReanimatedTrueSheetProvider>
    );
  },
);

function Sheet({
  product,
  onSettle,
  onVisitBrand,
  onRequestClose,
  sheetRef,
}: ProductSheetProps & { sheetRef: ForwardedRef<TrueSheet> }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  const [collapsed, setCollapsed] = useState(true);

  const handleSettle = (event: NativeSyntheticEvent<DetentInfoEventPayload>) => {
    setCollapsed(event.nativeEvent.index === 0);
    onSettle(event.nativeEvent.index, event.nativeEvent.position);
  };

  return (
    <ReanimatedTrueSheet
      ref={sheetRef}
      name={PRODUCT_SHEET}
      detents={['peek', 0.55, 0.92]}
      initialDetentIndex={0}
      initialDetentAnimated
      dismissible={false}
      dimmed
      dimmedDetentIndex={1}
      grabber
      // iOS: no background at all, so the system draws its Liquid Glass sheet
      // (iOS 26). Android has no glass sheet.
      backgroundColor={isIos ? undefined : theme.background}
      scrollableRef={scrollRef}
      style={styles.sheet}
      insetAdjustment={floatingSheet ? 'never' : 'automatic'}
      header={
        <ProductSummary
          product={product}
          // Off iOS 26 the system's home-indicator strip already gives the
          // card room below.
          bottomPadding={floatingSheet ? Spacing.three : Math.max(0, Spacing.three - insets.bottom)}
        />
      }
      footer={
        <VisitBrandFooter
          bottomInset={floatingSheet ? insets.bottom : 0}
          collapsed={collapsed}
          label={t('catalog.common.visitBrand')}
          onPress={onVisitBrand}
        />
      }
      // A solid footer would sit as a dark block on the glass.
      footerStyle={isIos ? undefined : { backgroundColor: theme.background }}
      onDidPresent={handleSettle}
      onDetentChange={handleSettle}
      onDismissAttempt={onRequestClose}
    >
      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false}>
        <ProductDetails key={product.id} product={product} />
      </ScrollView>
    </ReanimatedTrueSheet>
  );
}

type VisitBrandFooterProps = {
  /** Padding under the button when the sheet does not add the safe area itself. */
  bottomInset: number;
  collapsed: boolean;
  label: string;
  onPress: () => void;
};

/** Hidden while the card is collapsed, fully shown by the middle detent. */
function VisitBrandFooter({ bottomInset, collapsed, label, onPress }: VisitBrandFooterProps) {
  const { animatedIndex } = useReanimatedTrueSheet();

  const fade = useAnimatedStyle(() => ({
    opacity: interpolate(animatedIndex.value, [0.1, 0.6], [0, 1], Extrapolation.CLAMP),
  }));

  return (
    <Animated.View
      pointerEvents={collapsed ? 'none' : 'auto'}
      style={[styles.footer, bottomInset > 0 && { paddingBottom: bottomInset }, fade]}
    >
      <Button title={label} rightIcon="open.outline" onPress={onPress} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
  },

  footer: {
    paddingHorizontal: PageGutter,
    paddingTop: Spacing.twoAndOne,
  },
});
