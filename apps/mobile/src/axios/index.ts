import axios from 'axios';

/**
 * The one HTTP client. Feature API modules call through this rather than
 * `fetch`/`axios` directly, so headers, base URL and response handling stay
 * in one place.
 *
 * Unused while the catalog runs on the mock server — see
 * `src/domain/catalog/api.ts`.
 */
export const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 10_000,

  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});
