import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { DarkTheme, Stack, ThemeProvider, type Theme } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import '@/i18next/i18next';

import { LaunchSplash } from '@/components/brand/LaunchSplash';
import { useTheme } from '@/hooks/useTheme';
import { queryClient } from '@/lib/queryClient';
import { queryPersistOptions } from '@/lib/queryPersistence';

const isIos = Platform.OS === 'ios';

// The native launch screen stays up until LaunchSplash has drawn its first
// (identical) frame and hands over; a short fade hides any rounding.
SplashScreen.preventAutoHideAsync().catch(() => {
  // Already hidden (fast refresh): nothing to keep up.
});
SplashScreen.setOptions({ duration: 200, fade: true });

export default function RootLayout() {
  const theme = useTheme();
  // Once per launch; the app renders and loads beneath it meanwhile.
  const [launching, setLaunching] = useState(true);

  // Native chrome (headers, back buttons, search bars) reads its colours from
  // the navigation theme, so it is derived from the app's tokens.
  const navigationTheme: Theme = {
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

  return (
    <GestureHandlerRootView style={styles.root}>
      <PersistQueryClientProvider client={queryClient} persistOptions={queryPersistOptions}>
        <ThemeProvider value={navigationTheme}>
          <StatusBar style="light" />

          <Stack
            screenOptions={{
              headerTransparent: isIos,
              headerShadowVisible: false,
              headerBackButtonMenuEnabled: false,
              headerBackTitle: '',
              // Android left-aligns titles by default; match iOS.
              headerTitleAlign: 'center',
              headerTintColor: theme.text,
              title: '',
              contentStyle: { backgroundColor: theme.background },
            }}
          >
            <Stack.Screen
              name="index"
              options={{ headerShown: false }}
            />

            <Stack.Screen name="brand/[brandId]/index" />

            <Stack.Screen
              name="brand/[brandId]/[productId]"
              options={{
                // iOS puts close and ⋯ in the native bar (see ReelToolbar), so
                // the header is on from the first frame: switching it on later
                // inside a modal remounts the screen. Android draws its own.
                headerShown: isIos,
                headerTransparent: true,
                headerBackVisible: false,
                // The photos are the content: no blur where they meet the bar or the sheet.
                scrollEdgeEffects: { top: 'hidden', bottom: 'hidden' },
                presentation: 'fullScreenModal',
                // The reel pages vertically; a swipe-to-dismiss would fight it.
                gestureEnabled: false,
                contentStyle: { backgroundColor: theme.mediaBackground },
              }}
            />
          </Stack>

          {launching ? <LaunchSplash onFinish={() => setLaunching(false)} /> : null}
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
