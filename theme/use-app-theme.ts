import { useMemo } from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';

import { createTheme, type ThemeDefinition, type ThemeMode } from './tokens';

export const useAppTheme = (): ThemeDefinition => {
  const colorScheme = useColorScheme();
  const mode: ThemeMode = colorScheme === 'dark' ? 'dark' : 'light';

  return useMemo(() => createTheme(mode), [mode]);
};
