import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';

import { GlassIconButton } from '@/components/ui/GlassIconButton';
import { HStack } from '@/components/ui/HStack';
import { Text } from '@/components/ui/Text';
import { VStack } from '@/components/ui/VStack';
import { PageGutter, Radii, Spacing, Typography } from '@/constants/theme';
import type { Brand } from '@/domain/catalog/types';
import { useTheme } from '@/hooks/useTheme';
import { feedback } from '@/lib/feedback';
import { sizedImageUrl } from '@/lib/images';

export const BRAND_CARD_HEIGHT = 216;

type BrandCardProps = {
  brand: Brand;
  onPress: () => void;
};

export function BrandCard({ brand, onPress }: BrandCardProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { width, scale } = useWindowDimensions();

  const imageWidth = (width - PageGutter * 2) * scale;

  const handlePress = () => {
    feedback.tap();
    onPress();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('catalog.brands.openBrand', { name: brand.name })}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.surface },
        pressed && styles.pressed,
      ]}
    >
      {brand.coverImage ? (
        <Image
          source={{ uri: sizedImageUrl(brand.coverImage, imageWidth) }}
          // Model shots: keep faces and the neckline in frame.
          contentPosition="top"
          contentFit="cover"
          transition={250}
          style={StyleSheet.absoluteFill}
        />
      ) : null}

      <LinearGradient
        colors={['transparent', theme.scrim, 'rgba(0, 0, 0, 0.85)']}
        locations={[0.35, 0.75, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.footer}>
        <HStack alignItems="flex-end" justifyContent="space-between" space="three">
          <VStack space="half" style={styles.text}>
            <Text numberOfLines={1} style={Typography.title_28_bold}>
              {brand.name}
            </Text>

            <Text style={[Typography.subhead_15_regular, { color: theme.textSecondary }]}>
              {t('catalog.common.productCount', { count: brand.productCount })}
            </Text>
          </VStack>

          {/* Decorative: the whole card is the button. */}
          <View pointerEvents="none" importantForAccessibility="no-hide-descendants">
            <GlassIconButton
              icon="chevron.right.outline"
              symbol="chevron.right"
              accessibilityLabel=""
              size={40}
              iconSize={18}
            />
          </View>
        </HStack>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    height: BRAND_CARD_HEIGHT,
    borderRadius: Radii.card,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },

  pressed: {
    transform: [{ scale: 0.985 }],
  },

  footer: {
    padding: Spacing.twenty,
  },

  text: {
    flex: 1,
  },
});
