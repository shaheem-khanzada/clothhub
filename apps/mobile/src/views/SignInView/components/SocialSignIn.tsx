import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Separator } from '@/components/ui/Separator';
import { Text } from '@/components/ui/Text';
import { Spacing, Typography } from '@/constants/theme';
import { authErrorKey } from '@/domain/auth/errors';
import { useSignInWithApple } from '@/domain/auth/useAuthMutations';
import { useTheme } from '@/hooks/useTheme';
import { isIos } from '@/lib/deviceInfo';

type SocialSignInProps = {
  /** Called once the person is signed in. */
  onSignedIn: () => void;
};

/**
 * Continue with Apple / Google, above the email form.
 *
 * Apple signs in natively and is iOS only: that's where App Review requires
 * it next to Google, and on Android it would need the web flow. Google's
 * button says it's coming until its credentials exist.
 */
export function SocialSignIn({ onSignedIn }: SocialSignInProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  const apple = useSignInWithApple();
  const appleError = apple.error ? t(`auth.errors.${authErrorKey(apple.error)}`) : null;

  const handleApple = () => {
    apple.mutate(undefined, {
      onSuccess: (result) => {
        if (result === 'signedIn') {
          onSignedIn();
        }
      },
    });
  };

  const handleGoogle = () => {
    Alert.alert(
      t('auth.social.comingSoonTitle'),
      t('auth.social.comingSoonMessage', { provider: t('auth.social.googleName') }),
    );
  };

  return (
    <View style={styles.container}>
      {isIos ? (
        <Button
          variant="inverse"
          title={t('auth.social.apple')}
          leftIcon="apple.fill"
          loading={apple.isPending}
          onPress={handleApple}
        />
      ) : null}

      <Button
        variant="surface"
        title={t('auth.social.google')}
        leftIcon="google.color"
        disabled={apple.isPending}
        style={{ backgroundColor: theme.sheetFill }}
        onPress={handleGoogle}
      />

      {appleError ? (
        <Text
          accessibilityLiveRegion="polite"
          style={[Typography.subhead_15_regular, styles.error, { color: theme.danger }]}
        >
          {appleError}
        </Text>
      ) : null}

      <View style={styles.divider}>
        <Separator style={styles.rule} />
        <Text style={[Typography.footnote_13_regular, { color: theme.textTertiary }]}>
          {t('auth.social.or')}
        </Text>
        <Separator style={styles.rule} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.twoAndOne,
  },

  error: {
    textAlign: 'center',
  },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginTop: Spacing.one,
  },

  rule: {
    flex: 1,
  },
});
