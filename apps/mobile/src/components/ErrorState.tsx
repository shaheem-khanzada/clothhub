import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { VStack } from '@/components/ui/VStack';
import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

type ErrorStateProps = {
  onRetry: () => void;
  retrying?: boolean;
};

/** A failed load, with a way to try again. Used by every screen that fetches. */
export function ErrorState({ onRetry, retrying = false }: ErrorStateProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <VStack alignItems="center" space="two" style={styles.container}>
      <Text style={[Typography.body_17_semibold, styles.centered]}>
        {t('common.error.title')}
      </Text>

      <Text
        style={[
          Typography.subhead_15_regular,
          styles.centered,
          { color: theme.textSecondary },
        ]}
      >
        {t('common.error.description')}
      </Text>

      <Button
        title={t('common.actions.retry')}
        variant="surface"
        size="md"
        loading={retrying}
        onPress={onRetry}
        style={styles.button}
      />
    </VStack>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.five,
    paddingHorizontal: Spacing.four,
  },

  centered: {
    textAlign: 'center',
  },

  button: {
    marginTop: Spacing.two,
  },
});
