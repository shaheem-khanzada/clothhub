import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ErrorState } from '@/components/ErrorState';
import { Spacing } from '@/constants/theme';
import type { Product } from '@/domain/catalog/types';
import { useBrandQuery } from '@/domain/catalog/useBrandsQuery';
import { useBrowseParams } from '@/domain/catalog/useBrowseStore';
import { useFavoritesStore, useIsFavorite } from '@/domain/favorites/useFavoritesStore';
import { useProductQuery } from '@/domain/catalog/useProductQuery';
import { useProductsQuery } from '@/domain/catalog/useProductsQuery';
import { useTheme } from '@/hooks/useTheme';
import { feedback } from '@/lib/feedback';
import { sizedImageUrl } from '@/lib/images';

import { ActionRail } from './components/ActionRail';
import { GestureGuide } from './components/GestureGuide';
import { PRODUCT_SHEET, ProductSheet } from './components/ProductSheet';
import { ReelItem, STRIP_SPACE } from './components/ReelItem';
import { ReelToolbar } from './components/ReelToolbar';
import { openInBrowser, shareProduct } from './productActions';
import { useGestureGuide } from './useGestureGuide';

/** How many products ahead get their first photo warmed up. */
const PREFETCH_AHEAD = 2;

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
  const { width, scale } = useWindowDimensions();

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
  const toggleFavorite = useFavoritesStore((state) => state.toggle);

  // Warm up the next few products' first photo so a swipe never lands on grey.
  useEffect(() => {
    const upcoming = products
      .slice(activeIndex + 1, activeIndex + 1 + PREFETCH_AHEAD)
      .map((product) => product.images[0])
      .filter((uri): uri is string => Boolean(uri))
      .map((uri) => sizedImageUrl(uri, width * scale));

    if (upcoming.length > 0) {
      Image.prefetch(upcoming).catch(() => {
        // Prefetching is best-effort; the photo still loads when shown.
      });
    }
  }, [products, activeIndex, width, scale]);

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
        <FlatList
          data={products}
          keyExtractor={(product) => product.id}
          pagingEnabled
          bounces={false}
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          initialScrollIndex={Math.max(startIndex, 0)}
          getItemLayout={(_, index) => ({ length: height, offset: height * index, index })}
          windowSize={3}
          initialNumToRender={1}
          maxToRenderPerBatch={2}
          onMomentumScrollEnd={handleMomentumEnd}
          onEndReached={handleEndReached}
          onEndReachedThreshold={2}
          renderItem={({ item }) => (
            <ReelItem
              product={item}
              width={width}
              height={height}
              pixelRatio={scale}
              topInset={insets.top}
              sheetHeight={sheetHeight}
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
          onToggleLike={() => toggleFavorite(activeProduct.id)}
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
