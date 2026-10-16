import { TrueSheet } from '@lodev09/react-native-true-sheet';
import * as WebBrowser from 'expo-web-browser';
import { useRef, useState, type ReactNode, type RefObject } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import type { TextInputRef } from '@/components/ui/TextInput';
import { Links } from '@/constants/links';
import { PageGutter, Radii, Spacing, Typography } from '@/constants/theme';
import { authErrorKey } from '@/domain/auth/errors';
import { useAccountGate } from '@/domain/auth/session';
import { SIGN_IN_SHEET } from '@/domain/auth/signInSheet';
import { useSignInWithEmail, useSignUpWithEmail } from '@/domain/auth/useAuthMutations';
import { useTheme } from '@/hooks/useTheme';

import { Field } from './Field';
import { validateSignIn, type SignInMode } from './validation';

/**
 * Sign in or create an account with email and password.
 *
 * One sheet for the whole app, mounted in the root layout and opened with
 * `presentSignIn()` — from the account screen, or by an action that needs an
 * account (the heart). That action waits in `useAccountGate`: it runs when
 * sign-in succeeds and is dropped if the sheet is closed.
 *
 * A sheet rather than a screen: TrueSheet presents from the topmost screen, so
 * it also opens over the reel, whose product sheet is always presented.
 */
export function SignInSheet() {
  const theme = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  // A new form each time the sheet opens.
  const [visit, setVisit] = useState(0);
  const clearAction = useAccountGate((state) => state.clear);

  const handleDidDismiss = () => {
    clearAction();
    setVisit((current) => current + 1);
  };

  return (
    <TrueSheet
      name={SIGN_IN_SHEET}
      detents={['auto']}
      grabber
      // iOS 26 draws a Liquid Glass sheet when no background is given.
      backgroundColor={Platform.OS === 'ios' ? undefined : theme.background}
      scrollableRef={scrollRef}
      onDidDismiss={handleDidDismiss}
    >
      <SignInForm key={visit} scrollRef={scrollRef} />
    </TrueSheet>
  );
}

type SignInFormProps = {
  scrollRef: RefObject<ScrollView | null>;
};

function SignInForm({ scrollRef }: SignInFormProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  const [mode, setMode] = useState<SignInMode>('signIn');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const emailRef = useRef<TextInputRef>(null);
  const passwordRef = useRef<TextInputRef>(null);

  const signIn = useSignInWithEmail();
  const signUp = useSignUpWithEmail();
  const mutation = mode === 'signIn' ? signIn : signUp;

  const releaseAction = useAccountGate((state) => state.release);

  const errors = submitted ? validateSignIn(mode, { name, email, password }) : {};
  const serverError = mutation.error ? t(`auth.errors.${authErrorKey(mutation.error)}`) : null;

  const handleSubmit = () => {
    setSubmitted(true);

    if (Object.keys(validateSignIn(mode, { name, email, password })).length > 0) {
      return;
    }

    // Signed in: run what was waiting (the heart fills as the sheet slides away), then close.
    const onSuccess = () => {
      releaseAction();
      void TrueSheet.dismiss(SIGN_IN_SHEET);
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
    <ScrollView
      ref={scrollRef}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text accessibilityRole="header" style={Typography.title_22_bold}>
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
  content: {
    paddingHorizontal: PageGutter + Spacing.two,
    paddingTop: Spacing.five,
    paddingBottom: Spacing.four,
    gap: Spacing.four,
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
