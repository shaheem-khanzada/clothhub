import { QueryClient } from '@tanstack/react-query';
import { persistQueryClientRestore, persistQueryClientSave } from '@tanstack/react-query-persist-client';

import { catalogKeys } from '@/domain/catalog/queryKeys';
import { DEFAULT_FILTERS } from '@/domain/catalog/filters';

import { mmkv, STORAGE_KEYS } from './mmkv';
import { queryPersistOptions } from './queryPersistence';

const params = { brandId: 'saya', sort: 'featured' as const, filters: DEFAULT_FILTERS, search: '' };

/** No garbage-collection timers, so the test process can exit. */
const newClient = () => new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } });

async function saveAndRestore(fill: (client: QueryClient) => void) {
  const saved = newClient();
  fill(saved);
  await persistQueryClientSave({ ...queryPersistOptions, queryClient: saved });

  const restored = newClient();
  await persistQueryClientRestore({ ...queryPersistOptions, queryClient: restored });

  return restored;
}

describe('the saved query cache', () => {
  beforeEach(() => {
    mmkv.clearAll();
  });

  it('keeps the brand list for an instant cold start', async () => {
    const restored = await saveAndRestore((client) => {
      client.setQueryData(catalogKeys.brands(), [{ id: 'saya' }]);
    });

    expect(restored.getQueryData(catalogKeys.brands())).toEqual([{ id: 'saya' }]);
  });

  it('keeps only the first page of a product list', async () => {
    const restored = await saveAndRestore((client) => {
      client.setQueryData(catalogKeys.products(params), { pages: ['page 1', 'page 2'], pageParams: [1, 2] });
    });

    expect(restored.getQueryData(catalogKeys.products(params))).toEqual({ pages: ['page 1'], pageParams: [1] });
  });

  it('leaves out everything else', async () => {
    const restored = await saveAndRestore((client) => {
      client.setQueryData(catalogKeys.product('p1'), { id: 'p1' });
      client.setQueryData(['session'], { token: 'x' });
    });

    expect(restored.getQueryData(catalogKeys.product('p1'))).toBeUndefined();
    expect(restored.getQueryData(['session'])).toBeUndefined();
  });

  it('drops a cache saved by an older version of the app', async () => {
    mmkv.set(
      STORAGE_KEYS.QUERY_CACHE,
      JSON.stringify({ buster: '1', timestamp: Date.now(), clientState: { queries: [], mutations: [] } }),
    );

    const restored = newClient();
    await persistQueryClientRestore({ ...queryPersistOptions, queryClient: restored });

    expect(mmkv.getString(STORAGE_KEYS.QUERY_CACHE)).toBeUndefined();
  });
});
