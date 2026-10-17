import { expoClient } from '@better-auth/expo/client';
import { createAuthClient } from 'better-auth/react';
import * as SecureStore from 'expo-secure-store';

import { setSessionCookieSource } from '@/axios';

/**
 * Better Auth's client, talking to the API's `/api/auth` endpoints.
 *
 * The session cookie is kept in SecureStore (the iOS Keychain / Android
 * Keystore), never in MMKV. `apiClient` attaches it to every API request, so
 * the API knows who is asking. Screens don't use this directly: they go
 * through `domain/auth` (useSession, useRequireAccount and the mutations).
 */
export const authClient = createAuthClient({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  plugins: [
    expoClient({
      scheme: 'clothhub',
      storagePrefix: 'clothhub',
      // Must match the API's `advanced.cookiePrefix`.
      cookiePrefix: 'clothhub',
      storage: SecureStore,
    }),
  ],
});

setSessionCookieSource(() => authClient.getCookie());
