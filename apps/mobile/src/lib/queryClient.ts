import { QueryClient } from '@tanstack/react-query';

import { toApiError } from '@/axios';

const MAX_RETRIES = 2;

/**
 * Retry what might work a moment later (no connection, timeouts, server
 * errors); never retry what will fail the same way again (404, 400) or a
 * response that does not match the contract.
 */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= MAX_RETRIES) {
    return false;
  }

  const apiError = toApiError(error);

  if (apiError.status === null) {
    return apiError.code === 'network_error' || apiError.code === 'timeout';
  }

  return apiError.status >= 500;
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: shouldRetry,
        // The catalog changes when the import job runs, a few times a day.
        staleTime: 5 * 60 * 1000,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

export const queryClient = createQueryClient();
