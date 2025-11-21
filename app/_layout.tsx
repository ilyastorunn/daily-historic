import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { UserProvider } from '@/contexts/user-context';
import { ThemeProvider, useThemeContext } from '@/contexts/theme-context';
import { darkTheme, lightTheme } from '@/theme/tokens';

export const unstable_settings = {
  anchor: 'index',
};

function AppNavigator() {
  const { mode } = useThemeContext();

  const navigationTheme = useMemo(() => {
    const appTheme = mode === 'dark' ? darkTheme : lightTheme;
    const baseTheme = mode === 'dark' ? DarkTheme : DefaultTheme;

    return {
      ...baseTheme,
      colors: {
        ...baseTheme.colors,
        background: appTheme.colors.appBackground,
        card: appTheme.colors.surface,
      },
    };
  }, [mode]);

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <Stack initialRouteName="index">
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="event/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding/index" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <UserProvider>
        <ThemeProvider>
          <AppNavigator />
        </ThemeProvider>
      </UserProvider>
    </GestureHandlerRootView>
  );
}
