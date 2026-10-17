import { LegendList } from '@legendapp/list/react-native';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDebouncedCallback } from 'use-debounce';

import { SearchInput } from '@/components/ui/SearchInput';
import { PageGutter, ProductGrid, Spacing, productCardWidth } from '@/constants/theme';
import { DEFAULT_FILTERS, countActiveFilters } from '@/domain/catalog/filters';
import type { Product } from '@/domain/catalog/types';
import { useBrandQuery } from '@/domain/catalog/useBrandsQuery';
import { useBrowseParams, useBrowseStore } from '@/domain/catalog/useBrowseStore';
import { catalogKeys } from '@/domain/catalog/queryKeys';
import { useProductsQuery } from '@/domain/catalog/useProductsQuery';
import { useTheme } from '@/hooks/useTheme';
import { isAndroid, isIos } from '@/lib/deviceInfo';

import { Empty } from './components/Empty';
import { FILTER_SHEET, FilterSheet } from './components/FilterSheet';
import { HeaderTitle } from './components/HeaderTitle';
import { ProductCard } from './components/ProductCard';
import { SORT_SHEET, SortSheet } from './components/SortSheet';
import { Toolbar } from './components/Toolbar';
import { usePrefetchNextPage } from './usePrefetchNextPage';

const SEARCH_DEBOUNCE_MS = 300;

/** Name, price and badge under each card's photo, for LegendList's first layout. */
const CARD_INFO_HEIGHT = 84;

/** How far below the screen cards are already laid out, so their photos start loading early. */
const DRAW_DISTANCE = 600;

// iOS gets the native search bar in the navigation bar. Android's native one
// overflows the header, so Android searches from a field at the top of the list.
const nativeHeaderSearch = isIos;

export default function ProductListView() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const { brandId } = useLocalSearchParams<{ brandId: string }>();

  const { data: brand } = useBrandQuery(brandId);
  const params = useBrowseParams(brandId);
  const setSort = useBrowseStore((state) => state.setSort);
  const setFilters = useBrowseStore((state) => state.setFilters);
  const setSearch = useBrowseStore((state) => state.setSearch);

  const {
    data,
    isPending,
    isError,
    isRefetching,
    isPlaceholderData,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useProductsQuery(params);

  const products = data?.products ?? [];
  const facets = data?.facets ?? null;
  const activeFilterCount = countActiveFilters(params.filters);
  const hasNarrowing = activeFilterCount > 0 || params.search.trim().length > 0;

  const cardWidth = productCardWidth(width);

  usePrefetchNextPage(
    isPlaceholderData ? [] : products,
    cardWidth,
    JSON.stringify(catalogKeys.products(params)),
  );

  const handleSearchChange = useDebouncedCallback((text: string) => {
    setSearch(brandId, text);
  }, SEARCH_DEBOUNCE_MS);

  // What is typed in the Android field; the store only sees it after the debounce.
  const [query, setQuery] = useState(params.search);

  const handleQueryChange = (text: string) => {
    setQuery(text);
    handleSearchChange(text);
  };

  const clearSearch = () => {
    handleSearchChange.cancel();
    setQuery('');
    setSearch(brandId, '');
  };

  const handleProductPress = (product: Product) => {
    router.push({
      pathname: '/brand/[brandId]/[productId]',
      params: { brandId, productId: product.id },
    });
  };

  const handleEndReached = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const handleClear = () => {
    setFilters(brandId, DEFAULT_FILTERS);
    setSearch(brandId, '');
  };

  const renderEmpty = () => {
    if (isPending) {
      return <Empty state="loading" cardWidth={cardWidth} gap={ProductGrid.columnGap} />;
    }

    if (isError) {
      return <Empty state="error" retrying={isRefetching} onRetry={refetch} />;
    }

    return <Empty state="noResults" canClear={hasNarrowing} onClear={handleClear} />;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <HeaderTitle name={brand?.name ?? ''} total={data ? data.total : null} />
          ),
          headerSearchBarOptions: nativeHeaderSearch
            ? {
                placeholder: t('catalog.products.searchPlaceholder', { brand: brand?.name ?? '' }),
                hideWhenScrolling: true,
                barTintColor: theme.surface,
                textColor: theme.text,
                tintColor: theme.text,
                onChangeText: (event) => handleSearchChange(event.nativeEvent.text),
                onCancelButtonPress: clearSearch,
              }
            : undefined,
        }}
      />

      <LegendList
        data={products}
        keyExtractor={(product) => product.id}
        numColumns={ProductGrid.columns}
        columnWrapperStyle={{ columnGap: ProductGrid.columnGap, rowGap: ProductGrid.rowGap }}
        // Cards hold no state of their own, so their views are reused as the grid scrolls.
        recycleItems
        estimatedItemSize={cardWidth / ProductGrid.imageAspectRatio + CARD_INFO_HEIGHT}
        drawDistance={DRAW_DISTANCE}
        renderItem={({ item }) => (
          <ProductCard product={item} width={cardWidth} onPress={handleProductPress} />
        )}
        ListHeaderComponent={
          <>
            {nativeHeaderSearch ? null : (
              <SearchInput
                value={query}
                onChangeText={handleQueryChange}
                onClear={clearSearch}
                clearAccessibilityLabel={t('common.actions.clear')}
                placeholder={t('catalog.products.searchPlaceholder', { brand: brand?.name ?? '' })}
                containerStyle={styles.search}
              />
            )}

            <Toolbar
              activeFilterCount={activeFilterCount}
              filtersAvailable={facets !== null}
              onSortPress={() => TrueSheet.present(SORT_SHEET)}
              onFiltersPress={() => TrueSheet.present(FILTER_SHEET)}
            />
          </>
        }
        ListEmptyComponent={renderEmpty()}
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator color={theme.textSecondary} style={styles.footer} />
          ) : null
        }
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.6}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching && !isFetchingNextPage && !isPlaceholderData}
            onRefresh={refetch}
            tintColor={theme.textSecondary}
          />
        }
        contentInsetAdjustmentBehavior="automatic"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        style={isPlaceholderData && styles.updating}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: isAndroid ? Spacing.twoAndOne : Spacing.two,
            paddingBottom: insets.bottom + Spacing.four,
          },
        ]}
      />

      <SortSheet
        selected={params.sort}
        onSelect={(sort) => setSort(brandId, sort)}
      />

      {facets ? (
        <FilterSheet
          facets={facets}
          filters={params.filters}
          onApply={(filters) => setFilters(brandId, filters)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    paddingHorizontal: PageGutter,
  },

  search: {
    marginBottom: Spacing.twoAndOne,
  },

  footer: {
    paddingVertical: Spacing.four,
  },

  // While new sort/filter results load, the old grid stays but dims.
  updating: {
    opacity: 0.55,
  },
});
