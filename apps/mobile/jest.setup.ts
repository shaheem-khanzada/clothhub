// Real translations, so component tests assert on the copy users see.
import '@/i18next/i18next';

import { setUpTests } from 'react-native-reanimated';

// Haptics are fire-and-forget native calls; tests only care that the UI reacts.
jest.mock('react-native-pulsar', () => ({
  HapticSupport: { NO_SUPPORT: 0 },
  Settings: { getHapticsSupportLevel: () => 0 },
  Presets: new Proxy({}, { get: () => jest.fn() }),
}));

// Reanimated runs worklets on the UI thread; in tests they run in JS, with
// the library's own animation matchers.
jest.mock('react-native-worklets', () => jest.requireActual('react-native-worklets/lib/module/mock'));
setUpTests();

// MMKV is a Nitro native module; tests use its own in-memory implementation.
jest.mock('react-native-mmkv', () => {
  const { createMockMMKV } = jest.requireActual('react-native-mmkv/lib/createMMKV/createMockMMKV');

  return { createMMKV: createMockMMKV };
});
