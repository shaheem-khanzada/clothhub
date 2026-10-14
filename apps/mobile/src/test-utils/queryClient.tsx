import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

/**
 * A fresh client per test — no cache shared between tests — with the app's
 * caching behaviour (`src/lib/queryClient.ts`) but no retries, so failures
 * show up at once.
 */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity, staleTime: 5 * 60 * 1000 },
      mutations: { retry: false },
    },
  });
}

export function createQueryWrapper(client = createTestQueryClient()) {
  return function QueryWrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}
