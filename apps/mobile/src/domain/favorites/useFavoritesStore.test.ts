import { act, renderHook } from '@testing-library/react-native';
import { router } from 'expo-router';

import { useAccountGate } from '@/domain/auth/session';
import { mmkv, STORAGE_KEYS } from '@/lib/mmkv';
import { signInAs, signOutForTest } from '@/test-utils/authClient';

import { useFavoritesStore, useIsFavorite, useToggleFavorite } from './useFavoritesStore';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

beforeEach(() => {
  useFavoritesStore.setState({ savedAt: {} });
  mmkv.clearAll();
  signOutForTest();
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

  it('saves straight away when signed in', async () => {
    signInAs();
    const { result } = await renderHook(() => useToggleFavorite());

    let saved: boolean | undefined;
    await act(async () => {
      saved = result.current('product-3');
    });

    expect(saved).toBe(true);
    expect(useFavoritesStore.getState().savedAt['product-3']).toBeDefined();
  });

  it('asks a signed-out person to sign in, then saves', async () => {
    const { result } = await renderHook(() => useToggleFavorite());

    await act(async () => {
      result.current('product-4');
    });

    expect(router.push).toHaveBeenCalledWith('/sign-in');
    expect(useFavoritesStore.getState().savedAt['product-4']).toBeUndefined();

    await act(async () => {
      useAccountGate.getState().release();
    });

    expect(useFavoritesStore.getState().savedAt['product-4']).toBeDefined();
  });
});
