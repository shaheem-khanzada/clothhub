import { useMutation } from '@tanstack/react-query';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';

import { apiClient } from '@/axios';
import { authClient } from '@/lib/authClient';

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

/** Development breadcrumbs for Apple sign-in. Never the tokens themselves. */
function logApple(message: string, details?: unknown) {
  if (__DEV__) {
    console.log(`[apple sign-in] ${message}`, details ?? '');
  }
}

/** How a Sign in with Apple ended: signed in, or the person closed Apple's sheet. */
export type AppleSignInResult = 'signedIn' | 'cancelled';

/**
 * Sign in with Apple, natively (iOS). Apple's sheet returns an identity token,
 * which Better Auth checks and signs in with: a new account the first time,
 * with the name Apple shares only then. Closing the sheet is not an error.
 */
export function useSignInWithApple() {
  return useMutation({
    mutationFn: async (): Promise<AppleSignInResult> => {
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
          logApple('sheet closed by the person');
          return 'cancelled';
        }
        console.warn('[apple sign-in] Apple\'s sheet failed', error);
        throw error;
      }

      logApple('Apple returned a credential', {
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
        logApple('signed in');
      }

      unwrap(result);

      // Lets the API revoke this Apple sign-in if the account is deleted
      // (Apple requires that). Signing in has already worked, so a failure
      // here doesn't undo it; the next Apple sign-in sends a fresh code.
      if (credential.authorizationCode) {
        await apiClient
          .post('/v1/me/apple-authorization', { authorizationCode: credential.authorizationCode })
          .then(() => logApple('authorization code saved for revoking'))
          .catch((error: unknown) => console.warn('[apple sign-in] could not save the authorization code', error));
      }

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
