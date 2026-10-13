import { TrueSheetOverlay } from '@lodev09/react-native-true-sheet';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Button } from '@/components/ui/Button';
import { HStack } from '@/components/ui/HStack';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Text } from '@/components/ui/Text';
import { VStack } from '@/components/ui/VStack';
import { PageGutter, Radii, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

type GuideRow = {
  icon: IconName;
  titleKey: string;
  descriptionKey: string;
};

const ROWS: readonly GuideRow[] = [
  {
    icon: 'swipe.up.outline',
    titleKey: 'catalog.reel.guide.nextTitle',
    descriptionKey: 'catalog.reel.guide.nextDescription',
  },
  {
    icon: 'swipe.down.outline',
    titleKey: 'catalog.reel.guide.previousTitle',
    descriptionKey: 'catalog.reel.guide.previousDescription',
  },
  {
    icon: 'swipe.horizontal.outline',
    titleKey: 'catalog.reel.guide.imagesTitle',
    descriptionKey: 'catalog.reel.guide.imagesDescription',
  },
  {
    icon: 'details.outline',
    titleKey: 'catalog.reel.guide.detailsTitle',
    descriptionKey: 'catalog.reel.guide.detailsDescription',
  },
];

type GestureGuideProps = {
  onDismiss: () => void;
};

/**
 * The first-visit card that teaches the reel's four gestures.
 *
 * Rendered in a TrueSheetOverlay because the product sheet is always
 * presented — anything drawn in the screen itself would sit underneath it.
 */
export function GestureGuide({ onDismiss }: GestureGuideProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <TrueSheetOverlay>
      <Animated.View
        entering={FadeIn.duration(220)}
        exiting={FadeOut.duration(180)}
        style={styles.container}
      >
        <Pressable
          accessibilityLabel={t('catalog.reel.guide.dismiss')}
          onPress={onDismiss}
          style={[StyleSheet.absoluteFill, { backgroundColor: theme.scrim }]}
        />

        <View
          accessibilityViewIsModal
          style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <Text accessibilityRole="header" style={[Typography.title_20_semibold, styles.title]}>
            {t('catalog.reel.guide.title')}
          </Text>

          <VStack space="three">
            {ROWS.map((row) => (
              <HStack key={row.titleKey} space="three" alignItems="center">
                <View style={[styles.iconWell, { backgroundColor: theme.surfaceRaised }]}>
                  <Icon name={row.icon} size={22} color={theme.text} />
                </View>

                <VStack space="half" style={styles.rowText}>
                  <Text style={Typography.callout_16_semibold}>{t(row.titleKey)}</Text>
                  <Text style={[Typography.subhead_15_regular, { color: theme.textSecondary }]}>
                    {t(row.descriptionKey)}
                  </Text>
                </VStack>
              </HStack>
            ))}
          </VStack>

          <Button
            title={t('catalog.reel.guide.dismiss')}
            onPress={onDismiss}
            style={styles.dismiss}
          />
        </View>
      </Animated.View>
    </TrueSheetOverlay>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    start: 0,
    end: 0,
    justifyContent: 'center',
    paddingHorizontal: PageGutter + Spacing.two,
  },

  card: {
    borderRadius: Radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.four,
  },

  title: {
    marginBottom: Spacing.four,
    textAlign: 'center',
  },

  iconWell: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },

  rowText: {
    flex: 1,
  },

  dismiss: {
    marginTop: Spacing.four,
  },
});
