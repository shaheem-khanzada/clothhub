import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { DarkTheme, Stack, ThemeProvider, type NativeStackNavigationOptions, type Theme } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import '@/i18next/i18next';

import type { ThemeColors } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { isIos } from '@/lib/deviceInfo';
import { queryClient } from '@/lib/queryClient';
import { queryPersistOptions } from '@/lib/queryPersistence';

/** Every screen: a transparent native bar on iOS, no title unless a screen sets one. */
function stackOptions(theme: ThemeColors): NativeStackNavigationOptions {
  return {
    headerTransparent: isIos,
    headerShadowVisible: false,
    headerBackButtonMenuEnabled: false,
    headerBackTitle: '',
    // Android left-aligns titles by default; match iOS.
    headerTitleAlign: 'center',
    headerTintColor: theme.text,
    title: '',
    contentStyle: { backgroundColor: theme.background },
  };
}

const hiddenHeaderOptions: NativeStackNavigationOptions = {
  headerShown: false,
};

/**
 * Forms that slide up over the current screen (sign-in): a native form sheet
 * that sizes to its content. On iOS it has no background, so iOS 26 draws its
 * Liquid Glass sheet; Android gets the page colour.
 */
function sheetOptions(theme: ThemeColors): NativeStackNavigationOptions {
  return {
    headerShown: false,
    presentation: 'formSheet',
    sheetAllowedDetents: 'fitToContents',
    sheetGrabberVisible: true,
    sheetCornerRadius: isIos ? undefined : 32,
    contentStyle: { backgroundColor: isIos ? 'transparent' : theme.background },
  };
}

/** The product reel: full-screen photos over everything, paged vertically. */
function reelOptions(theme: ThemeColors): NativeStackNavigationOptions {
  return {
    // iOS puts close and ⋯ in the native bar (see ReelToolbar), so the header
    // is on from the first frame: switching it on later inside a modal
    // remounts the screen. Android draws its own.
    headerShown: isIos,
    headerTransparent: true,
    headerBackVisible: false,
    // The photos are the content: no blur where they meet the bar or the sheet.
    scrollEdgeEffects: { top: 'hidden', bottom: 'hidden' },
    presentation: 'fullScreenModal',
    // The reel pages vertically; a swipe-to-dismiss would fight it.
    gestureEnabled: false,
    contentStyle: { backgroundColor: theme.mediaBackground },
  };
}

/**
 * Native chrome (headers, back buttons, search bars) reads its colours from
 * the navigation theme, so it is derived from the app's tokens.
 */
function navigationTheme(theme: ThemeColors): Theme {
  return {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      primary: theme.text,
      background: theme.background,
      card: theme.background,
      text: theme.text,
      border: theme.border,
    },
  };
}

export default function RootLayout() {
  const theme = useTheme();

  return (
    <GestureHandlerRootView style={styles.root}>
      <PersistQueryClientProvider client={queryClient} persistOptions={queryPersistOptions}>
        <ThemeProvider value={navigationTheme(theme)}>
          {/* Light status bar content (time, battery) for the dark-only theme. */}
          <StatusBar style="light" />

          <Stack screenOptions={stackOptions(theme)}>
            <Stack.Screen name="index" options={hiddenHeaderOptions} />
            <Stack.Screen name="brand/[brandId]/index" />
            <Stack.Screen name="brand/[brandId]/[productId]" options={reelOptions(theme)} />
            <Stack.Screen name="account" />
            <Stack.Screen name="sign-in" options={sheetOptions(theme)} />
          </Stack>
        </ThemeProvider>
      </PersistQueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
