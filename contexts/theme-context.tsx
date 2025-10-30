import React, { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';

import { useUserContext } from './user-context';
import type { ThemeMode } from '@/theme/tokens';

type ThemeContextValue = {
  /** The active theme mode (light or dark) */
  mode: ThemeMode;
  /** The user's theme preference (light, dark, or system) */
  preference: 'light' | 'dark' | 'system';
  /** Whether the current theme is forced (not following system) */
  isForced: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

type ThemeProviderProps = {
  children: ReactNode;
};

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const { profile } = useUserContext();
  const systemColorScheme = useSystemColorScheme();

  const contextValue = useMemo<ThemeContextValue>(() => {
    const preference = profile?.themePreference ?? 'system';

    // Determine final theme mode
    let mode: ThemeMode;
    let isForced: boolean;

    if (preference === 'system') {
      // Follow system theme
      mode = systemColorScheme === 'dark' ? 'dark' : 'light';
      isForced = false;
    } else {
      // Use forced theme
      mode = preference;
      isForced = true;
    }

    return {
      mode,
      preference,
      isForced,
    };
  }, [profile?.themePreference, systemColorScheme]);

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
};

export const useThemeContext = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }

  return context;
};
