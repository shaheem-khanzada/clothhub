import { useMutation } from '@tanstack/react-query';
import {
  GoogleSignin,
  isCancelledResponse,
  isErrorWithCode,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';

import { apiClient } from '@/axios';
import { authClient } from '@/lib/authClient';
import { isAndroid } from '@/lib/deviceInfo';
import { GOOGLE_SIGN_IN } from '@/lib/googleSignIn';

import { unwrap } from './errors';

/*
 * Sign-in actions as React Query mutations: screens get `isPending` and
 * `error` for free, and failures arrive as `AuthError` (see errors.ts).
 * `useSession()` updates by itself after each of them.
 */

export type EmailCredentials = {
  email: string;
  password: string;
};

export type NewAccount = EmailCredentials & {
  name: string;
};

export function useSignInWithEmail() {
  return useMutation({
    mutationFn: async ({ email, password }: EmailCredentials) =>
      unwrap(await authClient.signIn.email({ email: email.trim(), password })),
  });
}

export function useSignUpWithEmail() {
  return useMutation({
    mutationFn: async ({ name, email, password }: NewAccount) =>
      unwrap(await authClient.signUp.email({ name: name.trim(), email: email.trim(), password })),
  });
}

/** Development breadcrumbs for Apple and Google sign-in. Never the tokens themselves. */
function logSignIn(provider: 'apple' | 'google', message: string, details?: unknown) {
  if (__DEV__) {
    console.log(`[${provider} sign-in] ${message}`, details ?? '');
  }
}

/** How a sign-in with Apple or Google ended: signed in, or the person closed its sheet. */
export type SocialSignInResult = 'signedIn' | 'cancelled';

/**
 * Sign in with Apple, natively (iOS). Apple's sheet returns an identity token,
 * which Better Auth checks and signs in with: a new account the first time,
 * with the name Apple shares only then. Closing the sheet is not an error.
 */
export function useSignInWithApple() {
  return useMutation({
    mutationFn: async (): Promise<SocialSignInResult> => {
      // Ties the identity token to this sign-in, so a stolen one can't be replayed.
      const nonce = Crypto.randomUUID();
      let credential: AppleAuthentication.AppleAuthenticationCredential;

      try {
        credential = await AppleAuthentication.signInAsync({
          requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
          ],
          nonce,
        });
      } catch (error) {
        if (error instanceof Error && 'code' in error && error.code === 'ERR_REQUEST_CANCELED') {
          logSignIn('apple', 'sheet closed by the person');
          return 'cancelled';
        }
        console.warn('[apple sign-in] Apple\'s sheet failed', error);
        throw error;
      }

      logSignIn('apple', 'Apple returned a credential', {
        hasIdentityToken: Boolean(credential.identityToken),
        hasAuthorizationCode: Boolean(credential.authorizationCode),
        sharedEmail: Boolean(credential.email),
        sharedName: Boolean(credential.fullName?.givenName || credential.fullName?.familyName),
      });

      if (!credential.identityToken) {
        throw new Error('Sign in with Apple returned no identity token');
      }

      const firstName = credential.fullName?.givenName ?? undefined;
      const lastName = credential.fullName?.familyName ?? undefined;

      const result = await authClient.signIn.social({
        provider: 'apple',
        idToken: {
          token: credential.identityToken,
          nonce,
          ...((firstName || lastName) && { user: { name: { firstName, lastName } } }),
        },
      });

      if (result.error) {
        // The API's log says why (search it for "auth:").
        console.warn('[apple sign-in] the API refused the identity token', result.error);
      } else {
        logSignIn('apple', 'signed in');
      }

      unwrap(result);

      // Lets the API revoke this Apple sign-in if the account is deleted
      // (Apple requires that). Signing in has already worked, so a failure
      // here doesn't undo it; the next Apple sign-in sends a fresh code.
      if (credential.authorizationCode) {
        await apiClient
          .post('/v1/me/apple-authorization', { authorizationCode: credential.authorizationCode })
          .then(() => logSignIn('apple', 'authorization code saved for revoking'))
          .catch((error: unknown) => console.warn('[apple sign-in] could not save the authorization code', error));
      }

      return 'signedIn';
    },
  });
}

/**
 * Sign in with Google, natively (iOS and Android). Google's sheet returns an
 * identity token addressed to the Web client, which Better Auth checks and
 * signs in with. Closing the sheet is not an error.
 */
export function useSignInWithGoogle() {
  return useMutation({
    mutationFn: async (): Promise<SocialSignInResult> => {
      GoogleSignin.configure(GOOGLE_SIGN_IN);

      if (isAndroid) {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      }

      let response: Awaited<ReturnType<typeof GoogleSignin.signIn>>;

      try {
        response = await GoogleSignin.signIn();
      } catch (error) {
        // A second tap while Google's sheet is already open.
        if (isErrorWithCode(error) && error.code === statusCodes.IN_PROGRESS) {
          return 'cancelled';
        }
        console.warn('[google sign-in] Google\'s sheet failed', error);
        throw error;
      }

      if (isCancelledResponse(response)) {
        logSignIn('google', 'sheet closed by the person');
        return 'cancelled';
      }

      const { idToken } = response.data;
      logSignIn('google', 'Google returned a credential', { hasIdToken: Boolean(idToken) });

      if (!idToken) {
        throw new Error('Google sign-in returned no identity token');
      }

      const result = await authClient.signIn.social({ provider: 'google', idToken: { token: idToken } });

      if (result.error) {
        // The API's log says why (search it for "auth:").
        console.warn('[google sign-in] the API refused the identity token', result.error);
      } else {
        logSignIn('google', 'signed in');
      }

      unwrap(result);
      return 'signedIn';
    },
  });
}

export function useSignOut() {
  return useMutation({
    mutationFn: async () => unwrap(await authClient.signOut()),
  });
}

/**
 * Deletes the account on the server (`DELETE /v1/me`), then signs out, which
 * also removes the session from the device.
 */
export function useDeleteAccount() {
  return useMutation({
    mutationFn: async () => {
      await apiClient.delete('/v1/me');
      await authClient.signOut();
    },
  });
}
