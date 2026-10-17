import { LegendList } from '@legendapp/list/react-native';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  StyleSheet,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ErrorState } from '@/components/ErrorState';
import { Spacing, productCardWidth } from '@/constants/theme';
import { useSession } from '@/domain/auth/session';
import type { Product } from '@/domain/catalog/types';
import { useBrandQuery } from '@/domain/catalog/useBrandsQuery';
import { useBrowseParams } from '@/domain/catalog/useBrowseStore';
import { useIsFavorite, useToggleFavorite } from '@/domain/favorites/useFavoritesStore';
import { useProductQuery } from '@/domain/catalog/useProductQuery';
import { useProductsQuery } from '@/domain/catalog/useProductsQuery';
import { useTheme } from '@/hooks/useTheme';
import { feedback } from '@/lib/feedback';
import { photoUrl } from '@/lib/images';

import { ActionRail } from './components/ActionRail';
import { GestureGuide } from './components/GestureGuide';
import { PRODUCT_SHEET, ProductSheet } from './components/ProductSheet';
import { ReelItem, STRIP_SPACE } from './components/ReelItem';
import { ReelToolbar } from './components/ReelToolbar';
import { openInBrowser, shareProduct } from './productActions';
import { useGestureGuide } from './useGestureGuide';
import { useReelPrefetch } from './useReelPrefetch';

/** Gap between the safe area and the close / share / more buttons. */
const TOP_BAR_OFFSET = Spacing.twoAndOne;

type SheetState = {
  index: number;
  /** The sheet's top edge, measured from the top of the screen. */
  top: number;
};

/**
 * Full-screen product browsing: swipe up and down between the brand's
 * products, left and right between a product's photos, and drag the card at
 * the bottom up for details.
 *
 * Pages through exactly the list the user just came from — same sort, filters
 * and search — by reading the same React Query cache entry.
 */
export default function ProductReelView() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const { brandId, productId } = useLocalSearchParams<{
    brandId: string;
    productId: string;
  }>();

  const params = useBrowseParams(brandId);
  const { data: brand } = useBrandQuery(brandId);
  const {
    data,
    isPending,
    isError,
    isRefetching,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
  } = useProductsQuery(params);

  const listed = data?.products ?? [];
  const startIndex = listed.findIndex((product) => product.id === productId);

  // A shared link can point at a product the current list does not hold
  // (a different filter, a later page). Show that one product on its own.
  const needsFallback = !isPending && !isError && startIndex === -1;
  const fallback = useProductQuery(productId, needsFallback);

  const products: Product[] = needsFallback
    ? fallback.data
      ? [fallback.data]
      : []
    : listed;

  const sheetRef = useRef<TrueSheet>(null);

  const [height, setHeight] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [sheet, setSheet] = useState<SheetState | null>(null);

  const guide = useGestureGuide();

  const activeIndex = selectedIndex ?? Math.max(startIndex, 0);
  const activeProduct = products[activeIndex] ?? null;

  const liked = useIsFavorite(activeProduct?.id ?? '');
  const toggleFavorite = useToggleFavorite();
  const session = useSession();
  const productSheetSteppedAside = useRef(false);

  // Sign-in is a native form sheet, and iOS can't present it while this
  // screen presents the product sheet. Signed out, the heart closes the
  // product sheet first; it comes back when the reel is in focus again.
  useFocusEffect(() => {
    if (productSheetSteppedAside.current) {
      productSheetSteppedAside.current = false;
      TrueSheet.present(PRODUCT_SHEET);
    }
  });

  useReelPrefetch(products, activeIndex, width);

  // The product the user tapped opens on the photo its card was showing — a
  // file already in the cache — and sharpens from there.
  const openedCover = needsFallback ? null : listed[startIndex]?.images[0];
  const openedCoverUri = openedCover ? photoUrl(openedCover, productCardWidth(width)) : null;

  const handleLayout = (event: LayoutChangeEvent) => {
    setHeight(event.nativeEvent.layout.height);
  };

  const handleMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!height) {
      return;
    }

    const next = Math.round(event.nativeEvent.contentOffset.y / height);

    if (next !== activeIndex && products[next]) {
      feedback.page();
      setSelectedIndex(next);
    }
  };

  const handleEndReached = () => {
    if (!needsFallback && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const handleClose = async () => {
    // The product sheet is presented natively over this screen; it has to go
    // first or it would linger after the screen is gone.
    try {
      await TrueSheet.dismiss(PRODUCT_SHEET, false);
    } catch {
      // Not presented yet (still loading) — nothing to dismiss.
    }

    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace({ pathname: '/brand/[brandId]', params: { brandId } });
    }
  };

  const handleToggleLike = async () => {
    if (!activeProduct) {
      return;
    }

    if (session.status !== 'signedIn') {
      productSheetSteppedAside.current = true;
      await TrueSheet.dismiss(PRODUCT_SHEET);
    }

    toggleFavorite(activeProduct.id);
  };

  const handleShare = () => {
    if (activeProduct) {
      shareProduct(activeProduct, t);
    }
  };

  const handleVisitBrand = () => {
    if (activeProduct) {
      openInBrowser(activeProduct.link);
    }
  };

  const handleSheetSettle = (index: number, top: number) => {
    setSheet({ index, top });
  };

  const isLoading = isPending || (needsFallback && fallback.isPending);

  if (!activeProduct) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.mediaBackground }]}>
        {isLoading ? (
          <ActivityIndicator color={theme.text} />
        ) : (
          <ErrorState
            retrying={isRefetching || fallback.isRefetching}
            onRetry={() => (needsFallback ? fallback.refetch() : refetch())}
          />
        )}

        <ReelToolbar
          top={insets.top + TOP_BAR_OFFSET}
          brandName={brand?.name ?? ''}
          brandWebsite={brand?.website ?? null}
          onClose={handleClose}
          onShare={handleShare}
          onOpenWebsite={openInBrowser}
          onShowGuide={guide.show}
        />
      </View>
    );
  }

  const sheetHeight = height !== null && sheet !== null ? height - sheet.top : null;

  return (
    <View onLayout={handleLayout} style={[styles.container, { backgroundColor: theme.mediaBackground }]}>
      {height !== null ? (
        <LegendList
          data={products}
          keyExtractor={(product) => product.id}
          pagingEnabled
          bounces={false}
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          initialScrollIndex={Math.max(startIndex, 0)}
          getFixedItemSize={() => height}
          // One product above and below stays laid out, so a swipe never shows a gap.
          drawDistance={height}
          onMomentumScrollEnd={handleMomentumEnd}
          onEndReached={handleEndReached}
          onEndReachedThreshold={2}
          renderItem={({ item }) => (
            <ReelItem
              product={item}
              width={width}
              height={height}
              topInset={insets.top}
              sheetHeight={sheetHeight}
              coverPlaceholderUri={item.id === productId ? openedCoverUri : null}
            />
          )}
        />
      ) : null}

      <ReelToolbar
        top={insets.top + TOP_BAR_OFFSET}
        brandName={brand?.name ?? activeProduct.brandName}
        brandWebsite={brand?.website ?? null}
        onClose={handleClose}
        onShare={handleShare}
        onOpenWebsite={openInBrowser}
        onShowGuide={guide.show}
      />

      {sheet?.index === 0 && sheetHeight !== null ? (
        <ActionRail
          bottom={sheetHeight + STRIP_SPACE}
          liked={liked}
          onToggleLike={handleToggleLike}
          onShare={handleShare}
          onVisitBrand={handleVisitBrand}
        />
      ) : null}

      <ProductSheet
        ref={sheetRef}
        product={activeProduct}
        onSettle={handleSheetSettle}
        onVisitBrand={handleVisitBrand}
        onRequestClose={handleClose}
      />

      {guide.visible ? <GestureGuide onDismiss={guide.dismiss} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
