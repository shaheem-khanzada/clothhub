import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Separator } from '@/components/ui/Separator';
import { Text } from '@/components/ui/Text';
import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { isIos } from '@/lib/deviceInfo';

type Provider = 'apple' | 'google';

/**
 * Continue with Apple / Google, above the email form.
 *
 * The buttons are final; signing in with them arrives with the Apple and
 * Google credentials, so for now a tap says it's coming. Apple is iOS only:
 * that's where App Review requires it next to Google, and on Android it would
 * need the web flow.
 */
export function SocialSignIn() {
  const theme = useTheme();
  const { t } = useTranslation();

  const handlePress = (provider: Provider) => {
    Alert.alert(
      t('auth.social.comingSoonTitle'),
      t('auth.social.comingSoonMessage', { provider: t(`auth.social.${provider}Name`) }),
    );
  };

  return (
    <View style={styles.container}>
      {isIos ? (
        <Button
          variant="inverse"
          title={t('auth.social.apple')}
          leftIcon="apple.fill"
          onPress={() => handlePress('apple')}
        />
      ) : null}

      <Button
        variant="surface"
        title={t('auth.social.google')}
        leftIcon="google.color"
        style={{ backgroundColor: theme.sheetFill }}
        onPress={() => handlePress('google')}
      />

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
