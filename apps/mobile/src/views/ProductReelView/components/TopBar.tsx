import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';

import { GlassIconButton } from '@/components/ui/GlassIconButton';
import { HStack } from '@/components/ui/HStack';
import { Spacing } from '@/constants/theme';

type TopBarProps = {
  top: number;
  onClose: () => void;
  onMore: () => void;
};

export function TopBar({ top, onClose, onMore }: TopBarProps) {
  const { t } = useTranslation();

  return (
    <HStack
      pointerEvents="box-none"
      alignItems="center"
      justifyContent="space-between"
      style={[styles.bar, { top }]}
    >
      <GlassIconButton
        icon="close.outline"
        symbol="xmark"
        accessibilityLabel={t('common.actions.close')}
        onPress={onClose}
      />

      <GlassIconButton
        icon="more.outline"
        symbol="ellipsis"
        accessibilityLabel={t('common.actions.more')}
        onPress={onMore}
      />
    </HStack>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    start: Spacing.three,
    end: Spacing.three,
  },
});
