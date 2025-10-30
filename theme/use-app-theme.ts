import { useMemo } from 'react';

import { useThemeContext } from '@/contexts/theme-context';

import { createTheme, type ThemeDefinition } from './tokens';

export const useAppTheme = (): ThemeDefinition => {
  const { mode } = useThemeContext();

  return useMemo(() => createTheme(mode), [mode]);
};
