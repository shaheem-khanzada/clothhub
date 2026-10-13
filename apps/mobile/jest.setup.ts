// Real translations, so component tests assert on the copy users see.
import '@/i18next/i18next';

// Haptics are fire-and-forget native calls; tests only care that the UI reacts.
jest.mock('react-native-pulsar', () => ({
  HapticSupport: { NO_SUPPORT: 0 },
  Settings: { getHapticsSupportLevel: () => 0 },
  Presets: new Proxy({}, { get: () => jest.fn() }),
}));

// MMKV is a Nitro native module; tests use its own in-memory implementation.
jest.mock('react-native-mmkv', () => {
  const { createMockMMKV } = jest.requireActual('react-native-mmkv/lib/createMMKV/createMockMMKV');

  return { createMMKV: createMockMMKV };
});
