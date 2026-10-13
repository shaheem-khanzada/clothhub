import { createMMKV } from 'react-native-mmkv';
import type { StateStorage } from 'zustand/middleware';

export const mmkv = createMMKV({
  id: 'clothhub-storage',
});

export const STORAGE_KEYS = {
  /**
   * Set once the swipe guide on the product reel has been dismissed, so it
   * shows on the first visit only. It can be reopened from the reel's menu.
   */
  REEL_GESTURE_GUIDE_SEEN: 'reelGestureGuideSeen',

  /** The products the user has saved with the heart. Kept on the device only in V1. */
  FAVORITES: 'favorites',
} as const;

/** MMKV behind Zustand's `persist` middleware — synchronous, so stores hydrate before the first frame. */
export const mmkvStateStorage: StateStorage = {
  getItem: (key) => mmkv.getString(key) ?? null,
  setItem: (key, value) => mmkv.set(key, value),
  removeItem: (key) => {
    mmkv.remove(key);
  },
};
