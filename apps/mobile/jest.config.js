/**
 * Unit and component tests (jest-expo + React Native Testing Library).
 * Tests sit next to the code they cover, as `*.test.ts(x)`.
 *
 * @type {import('jest').Config}
 */
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testMatch: ['<rootDir>/src/**/*.test.{ts,tsx}'],
  testPathIgnorePatterns: ['/node_modules/', '/ios/', '/android/'],
  moduleNameMapper: {
    // First: the first pattern that matches wins, and icons are imported as '@/assets/icons/….svg'.
    '\\.svg$': '<rootDir>/jest/svgMock.js',
    '^@/i18next/(.*)$': '<rootDir>/i18next/$1',
    '^@/assets/(.*)$': '<rootDir>/assets/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|react-native-svg|@lodev09/.*|zod))',
  ],
};
