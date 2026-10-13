import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';

import { feedback } from '@/lib/feedback';

import { MORE_SHEET, MoreSheet } from './MoreSheet';
import { TopBar } from './TopBar';

type ReelToolbarProps = {
  /** Where the Android buttons sit; iOS places its own in the navigation bar. */
  top: number;
  brandName: string;
  /** `null` until the brand list is cached — the menu item is left out rather than broken. */
  brandWebsite: string | null;
  onClose: () => void;
  onShare: () => void;
  onOpenWebsite: (url: string) => void;
  onShowGuide: () => void;
};

/**
 * Close and the ⋯ menu (share, the brand's website, the swipe guide).
 *
 * iOS uses the native navigation bar (switched on for this route in the root
 * layout): SF Symbols, Liquid Glass on iOS 26 and a
 * native pull-down menu, with the system picking the icon colour against the
 * photo. Android has no SF Symbols and the native toolbar only takes bitmap
 * icons, so it keeps the drawn glass buttons and a sheet for the menu.
 */
export function ReelToolbar(props: ReelToolbarProps) {
  return Platform.OS === 'ios' ? <NativeToolbar {...props} /> : <DrawnToolbar {...props} />;
}

function NativeToolbar({
  brandName,
  brandWebsite,
  onClose,
  onShare,
  onOpenWebsite,
  onShowGuide,
}: ReelToolbarProps) {
  const { t } = useTranslation();

  return (
    <>
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button
          icon="xmark"
          accessibilityLabel={t('common.actions.close')}
          onPress={onClose}
        />
      </Stack.Toolbar>

      {/* One round ⋯ mirrors the close button; share is in the side rail and here. */}
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Menu icon="ellipsis" accessibilityLabel={t('common.actions.more')}>
          <Stack.Toolbar.MenuAction icon="square.and.arrow.up" onPress={onShare}>
            {t('common.actions.share')}
          </Stack.Toolbar.MenuAction>

          {brandWebsite ? (
            <Stack.Toolbar.MenuAction icon="safari" onPress={() => onOpenWebsite(brandWebsite)}>
              {t('catalog.reel.menu.openWebsite', { brand: brandName })}
            </Stack.Toolbar.MenuAction>
          ) : null}

          <Stack.Toolbar.MenuAction icon="hand.draw" onPress={onShowGuide}>
            {t('catalog.reel.menu.showGuide')}
          </Stack.Toolbar.MenuAction>
        </Stack.Toolbar.Menu>
      </Stack.Toolbar>
    </>
  );
}

function DrawnToolbar({
  top,
  brandName,
  brandWebsite,
  onClose,
  onShare,
  onOpenWebsite,
  onShowGuide,
}: ReelToolbarProps) {
  const handleMore = () => {
    feedback.tap();
    TrueSheet.present(MORE_SHEET);
  };

  return (
    <>
      <TopBar top={top} onClose={onClose} onMore={handleMore} />

      <MoreSheet
        onShare={onShare}
        brandName={brandName}
        brandWebsite={brandWebsite}
        onOpenWebsite={onOpenWebsite}
        onShowGuide={onShowGuide}
      />
    </>
  );
}
