import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Text } from '@/components/ui/Text';
import type { TextInputRef } from '@/components/ui/TextInput';
import { Links } from '@/constants/links';
import { MinTouchTarget, PageGutter, Radii, Spacing, Typography } from '@/constants/theme';
import { authErrorKey } from '@/domain/auth/errors';
import { useAccountGate } from '@/domain/auth/session';
import { useSignInWithEmail, useSignUpWithEmail } from '@/domain/auth/useAuthMutations';
import { useTheme } from '@/hooks/useTheme';

import { Field } from './components/Field';
import { validateSignIn, type SignInMode } from './validation';

/**
 * Sign in or create an account with email and password, as a modal.
 *
 * It opens from the account screen, or from an action that needs an account
 * (the heart): that action waits in `useAccountGate` and runs once the person
 * is signed in. Closing without signing in drops it.
 */
export default function SignInView() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const [mode, setMode] = useState<SignInMode>('signIn');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const emailRef = useRef<TextInputRef>(null);
  const passwordRef = useRef<TextInputRef>(null);
  const signedIn = useRef(false);

  const signIn = useSignInWithEmail();
  const signUp = useSignUpWithEmail();
  const mutation = mode === 'signIn' ? signIn : signUp;

  const releaseAction = useAccountGate((state) => state.release);
  const clearAction = useAccountGate((state) => state.clear);

  // Closed without signing in: the waiting action is dropped.
  useEffect(
    () => () => {
      if (!signedIn.current) clearAction();
    },
    [clearAction],
  );

  const errors = submitted ? validateSignIn(mode, { name, email, password }) : {};
  const serverError = mutation.error ? t(`auth.errors.${authErrorKey(mutation.error)}`) : null;

  const handleSubmit = () => {
    setSubmitted(true);

    if (Object.keys(validateSignIn(mode, { name, email, password })).length > 0) {
      return;
    }

    const onSuccess = () => {
      signedIn.current = true;
      router.back();
      releaseAction();
    };

    if (mode === 'signIn') {
      signIn.mutate({ email, password }, { onSuccess });
    } else {
      signUp.mutate({ name, email, password }, { onSuccess });
    }
  };

  const handleSwitchMode = () => {
    setMode(mode === 'signIn' ? 'signUp' : 'signIn');
    setSubmitted(false);
    signIn.reset();
    signUp.reset();
  };

  const copy = mode === 'signIn' ? 'auth.signIn' : 'auth.signUp';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.root, { backgroundColor: theme.background }]}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        contentContainerStyle={[
          styles.content,
          { paddingTop: Spacing.three, paddingBottom: insets.bottom + Spacing.four },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.actions.close')}
          hitSlop={Spacing.two}
          onPress={() => router.back()}
          style={[styles.close, { backgroundColor: theme.surface }]}
        >
          <Icon name="close.outline" size={20} color={theme.text} />
        </Pressable>

        <View style={styles.header}>
          <Text accessibilityRole="header" style={Typography.title_28_bold}>
            {t(`${copy}.title`)}
          </Text>
          <Text style={[Typography.subhead_15_regular, { color: theme.textSecondary }]}>
            {t(`${copy}.subtitle`)}
          </Text>
        </View>

        <View style={styles.fields}>
          {mode === 'signUp' ? (
            <Field
              label={t('auth.fields.name')}
              placeholder={t('auth.fields.namePlaceholder')}
              value={name}
              onChangeText={setName}
              autoComplete="name"
              textContentType="name"
              autoCapitalize="words"
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
              error={errors.name ? t(`auth.validation.${errors.name}`) : null}
            />
          ) : null}

          <Field
            ref={emailRef}
            label={t('auth.fields.email')}
            placeholder={t('auth.fields.emailPlaceholder')}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoComplete="email"
            textContentType={mode === 'signIn' ? 'username' : 'emailAddress'}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            error={errors.email ? t(`auth.validation.${errors.email}`) : null}
          />

          <Field
            ref={passwordRef}
            label={t('auth.fields.password')}
            placeholder={mode === 'signUp' ? t('auth.fields.passwordPlaceholder') : undefined}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!passwordVisible}
            autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
            textContentType={mode === 'signIn' ? 'password' : 'newPassword'}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="go"
            onSubmitEditing={handleSubmit}
            error={errors.password ? t(`auth.validation.${errors.password}`) : null}
            accessory={
              <Button
                variant="link"
                size="sm"
                title={t(passwordVisible ? 'auth.fields.hidePassword' : 'auth.fields.showPassword')}
                textStyle={{ color: theme.textSecondary }}
                onPress={() => setPasswordVisible(!passwordVisible)}
              />
            }
          />
        </View>

        {serverError ? (
          <View accessibilityLiveRegion="polite" style={[styles.serverError, { backgroundColor: theme.sheetFill }]}>
            <Text style={[Typography.subhead_15_regular, { color: theme.danger }]}>{serverError}</Text>
          </View>
        ) : null}

        <Button title={t(`${copy}.submit`)} loading={mutation.isPending} onPress={handleSubmit} />

        <View style={styles.switch}>
          <Text style={[Typography.subhead_15_regular, { color: theme.textSecondary }]}>{t(`${copy}.switch`)}</Text>
          <Button variant="link" size="sm" title={t(`${copy}.switchAction`)} onPress={handleSwitchMode} />
        </View>

        <Text style={[Typography.footnote_13_regular, styles.legal, { color: theme.textTertiary }]}>
          <Trans
            i18nKey="auth.legal"
            components={{
              terms: <LegalLink url={Links.terms} />,
              privacy: <LegalLink url={Links.privacyPolicy} />,
            }}
          />
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/** A link inside the legal line; `Trans` passes the link text as children. */
function LegalLink({ url, children }: { url: string; children?: ReactNode }) {
  const theme = useTheme();

  return (
    <Text
      accessibilityRole="link"
      onPress={() => void WebBrowser.openBrowserAsync(url)}
      style={[Typography.footnote_13_medium, { color: theme.textSecondary }]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },

  content: {
    paddingHorizontal: PageGutter + Spacing.two,
    gap: Spacing.four,
  },

  close: {
    alignSelf: 'flex-end',
    width: MinTouchTarget - Spacing.two,
    height: MinTouchTarget - Spacing.two,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },

  header: {
    gap: Spacing.two,
  },

  fields: {
    gap: Spacing.three,
  },

  serverError: {
    borderRadius: Radii.image,
    padding: Spacing.three,
  },

  switch: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
  },

  legal: {
    textAlign: 'center',
  },
});
