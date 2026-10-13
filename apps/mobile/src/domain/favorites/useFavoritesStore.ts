import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { mmkvStateStorage, STORAGE_KEYS } from '@/lib/mmkv';

type FavoritesStore = {
  /** Product id → when it was saved (ISO). A map, so look-ups stay O(1). */
  savedAt: Record<string, string>;

  /** Saves or un-saves a product; returns whether it is saved afterwards. */
  toggle: (productId: string) => boolean;
};

/**
 * The products the user has hearted.
 *
 * V1 has no accounts, so favourites live on the device (MMKV) and survive
 * restarts. When sign-in arrives, this becomes the local cache of a server
 * list and `toggle` the optimistic half of a mutation — the screens keep
 * calling the same two hooks.
 */
export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      savedAt: {},

      toggle: (productId) => {
        const { [productId]: existing, ...rest } = get().savedAt;

        if (existing) {
          set({ savedAt: rest });
          return false;
        }

        set({ savedAt: { ...rest, [productId]: new Date().toISOString() } });
        return true;
      },
    }),
    {
      name: STORAGE_KEYS.FAVORITES,
      storage: createJSONStorage(() => mmkvStateStorage),
      partialize: (state) => ({ savedAt: state.savedAt }),
      version: 1,
    },
  ),
);

export function useIsFavorite(productId: string): boolean {
  return useFavoritesStore((state) => Boolean(state.savedAt[productId]));
}
