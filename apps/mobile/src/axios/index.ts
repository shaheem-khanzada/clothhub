import { ErrorResponseSchema } from '@clothhub/shared';
import axios, { AxiosError } from 'axios';

/**
 * The one HTTP client. Feature API modules call through this rather than
 * `fetch`/`axios` directly, so headers, base URL and error handling stay in
 * one place.
 *
 * The base URL comes from `EXPO_PUBLIC_API_URL` (see `.env.example`); each
 * build profile points at its own environment.
 */
export const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 15_000,

  headers: {
    Accept: 'application/json',
  },
});

/**
 * Every failed request surfaces as an `ApiError`, with the API's error code
 * when it sent one (`not_found`, `invalid_request`), or `network_error` /
 * `timeout` when it never answered.
 */
export class ApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number | null,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof AxiosError) {
    const status = error.response?.status ?? null;
    const body = ErrorResponseSchema.safeParse(error.response?.data);

    if (body.success) {
      return new ApiError(body.data.error.code, body.data.error.message, status);
    }

    if (error.code === AxiosError.ECONNABORTED || error.code === AxiosError.ETIMEDOUT) {
      return new ApiError('timeout', 'The server took too long to answer.', status);
    }

    if (!error.response) {
      return new ApiError('network_error', 'Could not reach the server.', null);
    }

    return new ApiError('http_error', error.message, status);
  }

  return new ApiError('unknown_error', error instanceof Error ? error.message : String(error), null);
}

apiClient.interceptors.response.use(undefined, (error: unknown) => Promise.reject(toApiError(error)));
