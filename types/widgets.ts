export type HomeWidgetFamily = 'systemMedium' | 'systemLarge';
export type HomeWidgetRotationCadence = 'hourly';

export interface HomeHeroWidgetCardSnapshot {
  id: string;
  title: string;
  summary: string;
  meta?: string;
  yearLabel: string;
  imageUri?: string;
}

export interface HomeHeroWidgetTypographyToken {
  fontSize: number;
  lineHeight: number;
  letterSpacing?: number;
  textTransform?: 'none' | 'uppercase';
}

export interface HomeHeroWidgetColorTokens {
  heroBackground: string;
  borderSubtle: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  accentPrimary: string;
}

export interface HomeHeroWidgetLayoutTokens {
  cardCornerRadius: number;
  bodyHorizontalPadding: number;
  bodyVerticalPadding: number;
  bodyGap: number;
  yearPillHorizontalPadding: number;
  yearPillVerticalPadding: number;
  yearPillBorderWidth: number;
}

export interface HomeHeroWidgetVignetteStop {
  offset: number;
  color: string;
}

export interface HomeHeroWidgetStyleTokens {
  colors: HomeHeroWidgetColorTokens;
  layout: HomeHeroWidgetLayoutTokens;
  typography: {
    year: HomeHeroWidgetTypographyToken;
    title: HomeHeroWidgetTypographyToken;
    summary: HomeHeroWidgetTypographyToken;
    meta: HomeHeroWidgetTypographyToken;
  };
  vignette: HomeHeroWidgetVignetteStop[];
}

export interface HomeHeroWidgetFamilyContent {
  title: string;
  summary: string;
  meta?: string;
  yearLabel: string;
  titleMaxLines: number;
  summaryMaxLines: number;
  metaMaxLines: number;
}

export interface HomeHeroWidgetEventSnapshot {
  id: string;
  imageUri?: string;
  content: {
    systemMedium: HomeHeroWidgetFamilyContent;
    systemLarge: HomeHeroWidgetFamilyContent;
  };
}

export interface HomeHeroWidgetPayload {
  version: number;
  generatedAt: string;
  baseTimestamp: string;
  baseIndex: number;
  rotationCadence: HomeWidgetRotationCadence;
  timezone?: string;
  deepLinkTemplate: string;
  events: HomeHeroWidgetEventSnapshot[];
  families: HomeWidgetFamily[];
  theme: {
    light: HomeHeroWidgetStyleTokens;
    dark: HomeHeroWidgetStyleTokens;
  };
}
