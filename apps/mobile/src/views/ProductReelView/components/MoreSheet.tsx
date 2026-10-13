import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { HStack } from '@/components/ui/HStack';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Separator } from '@/components/ui/Separator';
import { Text } from '@/components/ui/Text';
import { PageGutter, Radii, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { feedback } from '@/lib/feedback';

export const MORE_SHEET = 'reel-more';

type MoreSheetProps = {
  onShare: () => void;
  brandName: string;
  /** `null` until the brand list is cached — the row is hidden rather than broken. */
  brandWebsite: string | null;
  onOpenWebsite: (url: string) => void;
  onShowGuide: () => void;
};

type MenuItem = {
  key: string;
  icon: IconName;
  label: string;
  onPress: () => void;
};

/** The reel's ⋮ menu: the less frequent actions that do not earn a button. */
export function MoreSheet({
  onShare,
  brandName,
  brandWebsite,
  onOpenWebsite,
  onShowGuide,
}: MoreSheetProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  // Dismiss first so the next thing (a browser, the guide) is not covered by this sheet.
  const run = (action: () => void) => async () => {
    feedback.select();
    await TrueSheet.dismiss(MORE_SHEET);
    action();
  };

  const items: MenuItem[] = [
    {
      key: 'share',
      icon: 'share.outline',
      label: t('common.actions.share'),
      onPress: run(onShare),
    },
    ...(brandWebsite
      ? [
          {
            key: 'website',
            icon: 'open.outline' as const,
            label: t('catalog.reel.menu.openWebsite', { brand: brandName }),
            onPress: run(() => onOpenWebsite(brandWebsite)),
          },
        ]
      : []),
    {
      key: 'guide',
      icon: 'swipe.up.outline',
      label: t('catalog.reel.menu.showGuide'),
      onPress: run(onShowGuide),
    },
  ];

  return (
    <TrueSheet
      name={MORE_SHEET}
      detents={['auto']}
      grabber
      backgroundColor={theme.background}
    >
      <View style={styles.container}>
        <View style={[styles.list, { backgroundColor: theme.surface }]}>
          {items.map((item, index) => (
            <View key={item.key}>
              <Pressable
                accessibilityRole="button"
                onPress={item.onPress}
                style={({ pressed }) => [
                  styles.row,
                  pressed && { backgroundColor: theme.surfaceRaised },
                ]}
              >
                <HStack space="three" alignItems="center">
                  <Icon name={item.icon} size={22} color={theme.text} />
                  <Text style={Typography.body_17_regular}>{item.label}</Text>
                </HStack>
              </Pressable>

              {index < items.length - 1 ? <Separator style={styles.separator} /> : null}
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
    marginStart: Spacing.three + 22 + Spacing.three,
  },
});
