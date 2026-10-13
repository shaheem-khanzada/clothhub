import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { LikeButton } from '@/components/catalog/LikeButton';
import { GlassIconButton } from '@/components/ui/GlassIconButton';
import { VStack } from '@/components/ui/VStack';
import { Spacing } from '@/constants/theme';

/** One size for all three, so the rail reads as a single column. */
const BUTTON_SIZE = 52;
const ICON_SIZE = 22;

type ActionRailProps = {
  bottom: number;
  liked: boolean;
  onToggleLike: () => void;
  onShare: () => void;
  onVisitBrand: () => void;
};

/**
 * The thumb-reach actions on the right edge of the reel: save, share, visit
 * the brand. Filled symbols with no captions — the icons are universal, and
 * the photo gets the space back.
 */
export function ActionRail({ bottom, liked, onToggleLike, onShare, onVisitBrand }: ActionRailProps) {
  const { t } = useTranslation();

  return (
    <Animated.View
      entering={FadeIn}
      exiting={FadeOut}
      pointerEvents="box-none"
      style={[styles.rail, { bottom }]}
    >
      <VStack space="three" alignItems="center">
        <LikeButton
          liked={liked}
          onToggle={onToggleLike}
          size={BUTTON_SIZE}
          iconSize={ICON_SIZE}
        />

        <GlassIconButton
          icon="share.fill"
          symbol="square.and.arrow.up.fill"
          accessibilityLabel={t('common.actions.share')}
          size={BUTTON_SIZE}
          iconSize={ICON_SIZE}
          onPress={onShare}
        />

        <GlassIconButton
          icon="open.fill"
          symbol="arrow.up.right.square.fill"
          accessibilityLabel={t('catalog.common.visitBrand')}
          size={BUTTON_SIZE}
          iconSize={ICON_SIZE}
          onPress={onVisitBrand}
        />
      </VStack>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  rail: {
    position: 'absolute',
    end: Spacing.twoAndOne,
  },
});
