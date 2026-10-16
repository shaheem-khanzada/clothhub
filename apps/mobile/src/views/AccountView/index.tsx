import { Stack } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Separator } from '@/components/ui/Separator';
import { Text } from '@/components/ui/Text';
import { Links } from '@/constants/links';
import { PageGutter, Radii, Spacing, Typography } from '@/constants/theme';
import { useSession } from '@/domain/auth/session';
import { presentSignIn } from '@/domain/auth/signInSheet';
import { useDeleteAccount, useSignOut } from '@/domain/auth/useAuthMutations';
import { useTheme } from '@/hooks/useTheme';


/** The signed-in person's account: who they are, sign out, delete the account. */
export default function AccountView() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const session = useSession();
  const signOut = useSignOut();
  const deleteAccount = useDeleteAccount();

  const busy = signOut.isPending || deleteAccount.isPending;

  const handleSignOut = () => {
    signOut.mutate(undefined, {
      onError: () => Alert.alert(t('auth.account.signOutFailed')),
    });
  };

  const handleDelete = () => {
    Alert.alert(t('auth.account.deleteTitle'), t('auth.account.deleteMessage'), [
      { text: t('common.actions.cancel'), style: 'cancel' },
      {
        text: t('auth.account.deleteConfirm'),
        style: 'destructive',
        onPress: () =>
          deleteAccount.mutate(undefined, {
            onError: () => Alert.alert(t('auth.account.deleteFailed')),
          }),
      },
    ]);
  };

  return (
    <>
      <Stack.Screen options={{ title: t('auth.account.title') }} />

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ backgroundColor: theme.background }}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.four }]}
      >
        {session.status === 'loading' ? (
          <ActivityIndicator color={theme.textSecondary} style={styles.loading} />
        ) : session.status === 'signedOut' ? (
          <View style={styles.signedOut}>
            <View style={[styles.signedOutIcon, { backgroundColor: theme.surface }]}>
              <Icon name="person.outline" size={32} color={theme.textSecondary} />
            </View>
            <Text accessibilityRole="header" style={[Typography.title_22_bold, styles.center]}>
              {t('auth.account.signedOutTitle')}
            </Text>
            <Text style={[Typography.subhead_15_regular, styles.center, { color: theme.textSecondary }]}>
              {t('auth.account.signedOutDescription')}
            </Text>
            <Button
              title={t('auth.account.signInCta')}
              onPress={presentSignIn}
              style={styles.signedOutButton}
            />
          </View>
        ) : (
          <>
            <View style={styles.profile}>
              <Avatar name={session.user.name} size={72} />
              <View style={styles.profileText}>
                <Text accessibilityRole="header" style={[Typography.title_22_bold, styles.center]}>
                  {session.user.name}
                </Text>
                <Text style={[Typography.subhead_15_regular, styles.center, { color: theme.textSecondary }]}>
                  {session.user.email}
                </Text>
              </View>
            </View>

            <View style={[styles.group, { backgroundColor: theme.surface }]}>
              <Row label={t('auth.account.signOut')} disabled={busy} loading={signOut.isPending} onPress={handleSignOut} />
              <Separator style={styles.separator} />
              <Row
                label={t('auth.account.deleteAccount')}
                destructive
                disabled={busy}
                loading={deleteAccount.isPending}
                onPress={handleDelete}
              />
            </View>
          </>
        )}

        <View style={styles.links}>
          <Button variant="link" size="sm" title={t('auth.privacy')} onPress={() => void WebBrowser.openBrowserAsync(Links.privacyPolicy)} />
          <Button variant="link" size="sm" title={t('auth.terms')} onPress={() => void WebBrowser.openBrowserAsync(Links.terms)} />
        </View>
      </ScrollView>
    </>
  );
}

type RowProps = {
  label: string;
  destructive?: boolean;
  disabled?: boolean;
  loading?: boolean;
  onPress: () => void;
};

function Row({ label, destructive = false, disabled = false, loading = false, onPress }: RowProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled, busy: loading }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: theme.surfaceRaised }]}
    >
      <Text style={[Typography.body_17_regular, { color: destructive ? theme.danger : theme.text }]}>{label}</Text>
      {loading ? <ActivityIndicator color={theme.textSecondary} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: PageGutter,
    paddingTop: Spacing.four,
    gap: Spacing.five,
  },

  loading: {
    marginTop: Spacing.six,
  },

  center: {
    textAlign: 'center',
  },

  signedOut: {
    alignItems: 'center',
    gap: Spacing.twoAndOne,
    paddingTop: Spacing.five,
  },

  signedOutIcon: {
    width: 72,
    height: 72,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },

  signedOutButton: {
    marginTop: Spacing.three,
  },

  profile: {
    alignItems: 'center',
    gap: Spacing.three,
  },

  profileText: {
    gap: Spacing.one,
  },

  group: {
    borderRadius: Radii.card,
    overflow: 'hidden',
  },

  row: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
  },

  separator: {
    marginStart: Spacing.three,
  },

  links: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.four,
  },
});
