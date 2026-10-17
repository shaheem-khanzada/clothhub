import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Separator } from '@/components/ui/Separator';
import { Text } from '@/components/ui/Text';
import { Spacing, Typography } from '@/constants/theme';
import { authErrorKey } from '@/domain/auth/errors';
import { type SocialSignInResult, useSignInWithApple, useSignInWithGoogle } from '@/domain/auth/useAuthMutations';
import { useTheme } from '@/hooks/useTheme';
import { isIos } from '@/lib/deviceInfo';

type SocialSignInProps = {
  /** Called once the person is signed in. */
  onSignedIn: () => void;
};

/**
 * Continue with Apple / Google, above the email form. Both sign in natively.
 *
 * Apple is iOS only: that's where App Review requires it next to Google, and
 * on Android it would need the web flow.
 */
export function SocialSignIn({ onSignedIn }: SocialSignInProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  const apple = useSignInWithApple();
  const google = useSignInWithGoogle();

  const busy = apple.isPending || google.isPending;
  const failure = apple.error ?? google.error;
  const error = failure ? t(`auth.errors.${authErrorKey(failure)}`) : null;

  const onSuccess = (result: SocialSignInResult) => {
    if (result === 'signedIn') {
      onSignedIn();
    }
  };

  // One sign-in at a time, and only the latest one's error on screen.
  const handleApple = () => {
    google.reset();
    apple.mutate(undefined, { onSuccess });
  };

  const handleGoogle = () => {
    apple.reset();
    google.mutate(undefined, { onSuccess });
  };

  return (
    <View style={styles.container}>
      {isIos ? (
        <Button
          variant="inverse"
          title={t('auth.social.apple')}
          leftIcon="apple.fill"
          loading={apple.isPending}
          disabled={google.isPending}
          onPress={handleApple}
        />
      ) : null}

      <Button
        variant="surface"
        title={t('auth.social.google')}
        leftIcon="google.color"
        loading={google.isPending}
        disabled={apple.isPending}
        style={{ backgroundColor: theme.sheetFill }}
        onPress={handleGoogle}
      />

      {error && !busy ? (
        <Text
          accessibilityLiveRegion="polite"
          style={[Typography.subhead_15_regular, styles.error, { color: theme.danger }]}
        >
          {error}
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
