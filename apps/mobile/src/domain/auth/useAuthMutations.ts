import { useMutation } from '@tanstack/react-query';

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
