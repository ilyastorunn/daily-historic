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
  midnight: '#1c1a16',
  midnightTint: '#28251f',
  slate950: '#15130f',
  slate900: '#1f1c17',
  slate800: '#353128',
  slate700: '#524d43',
  slate600: '#6d675c',
  slate500: '#8d867a',
  slate200: '#D8D3C9',
  slate100: '#EDE7DE',
  slate50: '#F7F4EE',
  white: '#ffffff',
  indigo500: '#708C77',
  indigo200: '#CAD6CE',
  indigo100: '#E7EEE9',
  borderSoft: '#e5d9c8',
};

const spacing: SpacingScale = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 18,
  xl: 28,
  xxl: 40,
  card: 24,
};

const radius: RadiusScale = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 28,
  card: 22,
  pill: 999,
};

const typography: TypographyScale = {
  headingLg: { fontSize: 28, lineHeight: 34, fontWeight: '600' },
  headingMd: { fontSize: 24, lineHeight: 30, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 22, fontWeight: '400' },
  label: { fontSize: 15, lineHeight: 20, fontWeight: '500' },
  helper: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
};

const lightColors: ColorScale = {
  appBackground: palette.slate50,
  headerBackground: palette.slate50,
  heroBackground: palette.slate100,
  screen: '#F7F4EE',
  surface: palette.white,
  surfaceSubtle: '#f1ebdf',
  surfaceElevated: palette.white,
  textPrimary: palette.midnight,
  textSecondary: palette.slate600,
  textTertiary: palette.slate500,
  textInverse: palette.slate50,
  accentPrimary: palette.indigo500,
  accentSoft: 'rgba(112, 140, 119, 0.12)',
  accentMuted: palette.indigo200,
  borderSubtle: palette.borderSoft,
  borderStrong: '#b9ac98',
  progressTrack: 'rgba(82, 77, 67, 0.16)',
  shadowColor: 'rgba(23, 18, 12, 0.12)',
  heroBorder: 'rgba(82, 77, 67, 0.24)',
};

const darkColors: ColorScale = {
  appBackground: palette.slate900,
  headerBackground: palette.slate900,
  heroBackground: palette.slate800,
  screen: '#1b1813',
  surface: '#24201a',
  surfaceSubtle: '#2f2a24',
  surfaceElevated: '#27221c',
  textPrimary: palette.slate100,
  textSecondary: '#c8c0b3',
  textTertiary: '#9f978a',
  textInverse: palette.midnight,
  accentPrimary: '#9bbb92',
  accentSoft: 'rgba(155, 187, 146, 0.2)',
  accentMuted: 'rgba(155, 187, 146, 0.45)',
  borderSubtle: 'rgba(214, 206, 192, 0.35)',
  borderStrong: 'rgba(214, 206, 192, 0.65)',
  progressTrack: 'rgba(214, 206, 192, 0.24)',
  shadowColor: 'rgba(5, 4, 3, 0.6)',
  heroBorder: 'rgba(214, 206, 192, 0.32)',
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
