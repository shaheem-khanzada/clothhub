import { useState } from 'react';

import { mmkv, STORAGE_KEYS } from '@/lib/mmkv';

/**
 * The reel's swipe guide: shown automatically on the first visit only, and on
 * request from the reel's menu after that.
 */
export function useGestureGuide() {
  const [visible, setVisible] = useState(
    () => !mmkv.getBoolean(STORAGE_KEYS.REEL_GESTURE_GUIDE_SEEN),
  );

  const show = () => setVisible(true);

  const dismiss = () => {
    mmkv.set(STORAGE_KEYS.REEL_GESTURE_GUIDE_SEEN, true);
    setVisible(false);
  };

  return { visible, show, dismiss };
}
