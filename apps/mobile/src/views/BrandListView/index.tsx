import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PageGutter, Spacing } from '@/constants/theme';
import type { Brand } from '@/domain/catalog/types';
import { useBrandsQuery } from '@/domain/catalog/useBrandsQuery';
import { useTheme } from '@/hooks/useTheme';

import { BrandCard } from './components/BrandCard';
import { Empty } from './components/Empty';
import { ListHeader } from './components/ListHeader';

export default function BrandListView() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [query, setQuery] = useState('');

  const {
    data: brands = [],
    isPending,
    isError,
    isRefetching,
    refetch,
  } = useBrandsQuery();

  // A few dozen brands at most — filtering on the device is instant and works
  // offline once the list is cached.
  const normalizedQuery = query.trim().toLowerCase();
  const visibleBrands = normalizedQuery
    ? brands.filter((brand) => brand.name.toLowerCase().includes(normalizedQuery))
    : brands;

  const handleBrandPress = (brand: Brand) => {
    router.push({
      pathname: '/brand/[brandId]',
      params: { brandId: brand.id },
    });
  };

  const renderEmpty = () => {
    if (isPending) {
      return <Empty state="loading" />;
    }

    if (isError) {
      return <Empty state="error" retrying={isRefetching} onRetry={refetch} />;
    }

    return <Empty state="noMatches" query={query.trim()} />;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        data={visibleBrands}
        keyExtractor={(brand) => brand.id}
        renderItem={({ item }) => (
          <BrandCard brand={item} onPress={() => handleBrandPress(item)} />
        )}
        ListHeaderComponent={<ListHeader query={query} onQueryChange={setQuery} />}
        ListEmptyComponent={renderEmpty}
        ItemSeparatorComponent={Separator}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + Spacing.two,
            paddingBottom: insets.bottom + Spacing.four,
          },
        ]}
      />
    </View>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    paddingHorizontal: PageGutter,
  },

  separator: {
    height: Spacing.three,
  },
});
