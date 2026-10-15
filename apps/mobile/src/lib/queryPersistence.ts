import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import type { Query } from '@tanstack/react-query';
import type { PersistedClient, PersistQueryClientOptions } from '@tanstack/react-query-persist-client';

import { catalogKeys } from '@/domain/catalog/queryKeys';

import { mmkv, STORAGE_KEYS } from './mmkv';

/*
 * The catalogue the user last saw, saved to MMKV, so a cold start opens
 * straight onto brands and products while fresh data loads behind them.
 *
 * Only what makes the first screens instant is kept: the brand list and the
 * first page of each product list visited recently. Everything is refetched
 * as soon as it is shown (it is older than `staleTime`), so a saved copy is
 * never the last word.
 */

/** Bump when a saved response shape changes; older saved caches are then dropped. */
export const QUERY_CACHE_VERSION = '2';

const MAX_AGE_MS = 24 * 60 * 60 * 1000;

function isSaved(query: Query): boolean {
  const [area, kind] = query.queryKey;

  return (
    query.state.status === 'success' &&
    area === catalogKeys.all[0] &&
    (kind === catalogKeys.brands()[1] || kind === 'products')
  );
}

type InfiniteData = { pages: unknown[]; pageParams: unknown[] };

function isInfiniteData(data: unknown): data is InfiniteData {
  return (
    typeof data === 'object' &&
    data !== null &&
    Array.isArray((data as InfiniteData).pages) &&
    Array.isArray((data as InfiniteData).pageParams)
  );
}

/** Product lists are saved with their first page only: that is all a cold start shows. */
export function keepFirstPages(client: PersistedClient): PersistedClient {
  return {
    ...client,
    clientState: {
      ...client.clientState,
      queries: client.clientState.queries.map((query) => {
        const { data } = query.state;

        return isInfiniteData(data)
          ? {
              ...query,
              state: { ...query.state, data: { pages: data.pages.slice(0, 1), pageParams: data.pageParams.slice(0, 1) } },
            }
          : query;
      }),
    },
  };
}

export const queryPersistOptions: Omit<PersistQueryClientOptions, 'queryClient'> = {
  persister: createAsyncStoragePersister({
    // MMKV is synchronous; the persister accepts that as well as promises.
    storage: {
      getItem: (key) => mmkv.getString(key) ?? null,
      setItem: (key, value) => mmkv.set(key, value),
      removeItem: (key) => {
        mmkv.remove(key);
      },
    },
    key: STORAGE_KEYS.QUERY_CACHE,
    serialize: (client) => JSON.stringify(keepFirstPages(client)),
  }),
  maxAge: MAX_AGE_MS,
  buster: QUERY_CACHE_VERSION,
  dehydrateOptions: { shouldDehydrateQuery: isSaved },
};
