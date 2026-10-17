import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/Icon';
import { MinTouchTarget, Radii } from '@/constants/theme';
import { useSession } from '@/domain/auth/session';
import { useTheme } from '@/hooks/useTheme';
import { feedback } from '@/lib/feedback';

const SIZE = 36;

/** Opens the account screen: the person's initials when signed in, an outline figure otherwise. */
export function AccountButton() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const session = useSession();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('auth.account.open')}
      hitSlop={(MinTouchTarget - SIZE) / 2}
      onPress={() => {
        feedback.tap();
        router.push('/account');
      }}
      style={({ pressed }) => [styles.button, { opacity: pressed ? 0.75 : 1 }]}
    >
      {session.status === 'signedIn' ? (
        <Avatar name={session.user.name} size={SIZE} />
      ) : (
        <View style={[styles.disc, { backgroundColor: theme.surface }]}>
          <Icon name="person.outline" size={22} color={theme.text} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: SIZE,
    height: SIZE,
    borderRadius: Radii.pill,
    overflow: 'hidden',
  },

  disc: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
