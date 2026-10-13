import { act, renderHook } from '@testing-library/react-native';

import { mmkv, STORAGE_KEYS } from '@/lib/mmkv';

import { useFavoritesStore, useIsFavorite, useToggleFavorite } from './useFavoritesStore';

beforeEach(() => {
  useFavoritesStore.setState({ savedAt: {} });
  mmkv.clearAll();
});

describe('useFavoritesStore', () => {
  it('saves and un-saves a product, reporting the new state', async () => {
    const { result } = await renderHook(() => useIsFavorite('product-1'));

    let saved = false;
    await act(async () => {
      saved = useFavoritesStore.getState().toggle('product-1');
    });
    expect(saved).toBe(true);
    expect(result.current).toBe(true);

    await act(async () => {
      saved = useFavoritesStore.getState().toggle('product-1');
    });
    expect(saved).toBe(false);
    expect(result.current).toBe(false);
  });

  it('persists saves on the device', async () => {
    await act(async () => {
      useFavoritesStore.getState().toggle('product-2');
    });

    const stored = JSON.parse(mmkv.getString(STORAGE_KEYS.FAVORITES) ?? '{}') as {
      state: { savedAt: Record<string, string> };
    };
    expect(Object.keys(stored.state.savedAt)).toEqual(['product-2']);
  });

  it('saves through the account gate', async () => {
    const { result } = await renderHook(() => useToggleFavorite());

    let saved = false;
    await act(async () => {
      saved = result.current('product-3');
    });

    expect(saved).toBe(true);
    expect(useFavoritesStore.getState().savedAt['product-3']).toBeDefined();
  });
});
