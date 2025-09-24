export type ThemeMode = 'light' | 'dark';

type ColorScale = {
  appBackground: string;
  headerBackground: string;
  heroBackground: string;
  screen: string;
  surface: string;
  surfaceSubtle: string;
  surfaceElevated: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  accentPrimary: string;
  accentSoft: string;
  accentMuted: string;
  borderSubtle: string;
  borderStrong: string;
  progressTrack: string;
  shadowColor: string;
  heroBorder: string;
};

type SpacingScale = {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
  card: number;
};

type RadiusScale = {
  sm: number;
  md: number;
  lg: number;
  xl: number;
  card: number;
  pill: number;
};

type TypographyScale = {
  headingLg: { fontSize: number; lineHeight: number; fontWeight: '600'; };
  headingMd: { fontSize: number; lineHeight: number; fontWeight: '600'; };
  body: { fontSize: number; lineHeight: number; fontWeight: '400'; };
  label: { fontSize: number; lineHeight: number; fontWeight: '500'; };
  helper: { fontSize: number; lineHeight: number; fontWeight: '400'; };
};

type Palette = {
  midnight: string;
  midnightTint: string;
  slate950: string;
  slate900: string;
  slate800: string;
  slate700: string;
  slate600: string;
  slate500: string;
  slate200: string;
  slate100: string;
  slate50: string;
  white: string;
  indigo500: string;
  indigo200: string;
  indigo100: string;
  borderSoft: string;
};

type ThemeDefinition = {
  mode: ThemeMode;
  palette: Palette;
  colors: ColorScale;
  spacing: SpacingScale;
  radius: RadiusScale;
  typography: TypographyScale;
};

const palette: Palette = {
  midnight: '#0f172a',
  midnightTint: '#111c34',
  slate950: '#020617',
  slate900: '#0f172a',
  slate800: '#1e293b',
  slate700: '#334155',
  slate600: '#475569',
  slate500: '#64748b',
  slate200: '#cbd5f5',
  slate100: '#e2e8f0',
  slate50: '#f8fafc',
  white: '#ffffff',
  indigo500: '#2563eb',
  indigo200: '#bfdbfe',
  indigo100: '#e0ecff',
  borderSoft: '#cbd5f5',
};

const spacing: SpacingScale = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  card: 20,
};

const radius: RadiusScale = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  card: 18,
  pill: 999,
};

const typography: TypographyScale = {
  headingLg: { fontSize: 26, lineHeight: 32, fontWeight: '600' },
  headingMd: { fontSize: 24, lineHeight: 30, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 22, fontWeight: '400' },
  label: { fontSize: 15, lineHeight: 20, fontWeight: '500' },
  helper: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
};

const lightColors: ColorScale = {
  appBackground: palette.midnight,
  headerBackground: palette.midnight,
  heroBackground: palette.midnightTint,
  screen: palette.slate50,
  surface: palette.white,
  surfaceSubtle: '#f1f5f9',
  surfaceElevated: palette.white,
  textPrimary: palette.midnight,
  textSecondary: palette.slate600,
  textTertiary: palette.slate500,
  textInverse: palette.slate100,
  accentPrimary: palette.indigo500,
  accentSoft: palette.indigo100,
  accentMuted: palette.indigo200,
  borderSubtle: palette.borderSoft,
  borderStrong: palette.slate700,
  progressTrack: palette.slate800,
  shadowColor: 'rgba(15, 23, 42, 0.08)',
  heroBorder: palette.slate700,
};

const darkColors: ColorScale = {
  appBackground: palette.slate950,
  headerBackground: palette.slate900,
  heroBackground: palette.slate900,
  screen: palette.slate900,
  surface: '#111827',
  surfaceSubtle: '#1f2937',
  surfaceElevated: '#111827',
  textPrimary: palette.slate100,
  textSecondary: palette.slate200,
  textTertiary: palette.indigo200,
  textInverse: palette.midnight,
  accentPrimary: palette.indigo500,
  accentSoft: 'rgba(37, 99, 235, 0.24)',
  accentMuted: palette.indigo200,
  borderSubtle: 'rgba(148, 163, 184, 0.32)',
  borderStrong: 'rgba(148, 163, 184, 0.64)',
  progressTrack: 'rgba(148, 163, 184, 0.24)',
  shadowColor: 'rgba(2, 6, 23, 0.4)',
  heroBorder: 'rgba(148, 163, 184, 0.4)',
};

export const createTheme = (mode: ThemeMode = 'light'): ThemeDefinition => ({
  mode,
  palette,
  colors: mode === 'dark' ? darkColors : lightColors,
  spacing,
  radius,
  typography,
});

export const lightTheme = createTheme('light');
export const darkTheme = createTheme('dark');

export { palette, spacing, radius, typography };

export type { ThemeDefinition, ColorScale, SpacingScale, RadiusScale, TypographyScale, Palette };
