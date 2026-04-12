import { darkTheme, lightTheme, type ThemeDefinition } from '@/theme';
import type {
  HomeHeroWidgetCardSnapshot,
  HomeHeroWidgetEventSnapshot,
  HomeHeroWidgetFamilyContent,
  HomeHeroWidgetPayload,
  HomeHeroWidgetStyleTokens,
  HomeWidgetFamily,
} from '@/types/widgets';

const WIDGET_PAYLOAD_VERSION = 2;
const MAX_WIDGET_EVENTS = 5;

const MEDIUM_LIMITS = {
  title: 90,
  summary: 160,
  meta: 80,
  titleMaxLines: 2,
  summaryMaxLines: 3,
  metaMaxLines: 1,
} as const;

const LARGE_LIMITS = {
  title: 140,
  summary: 280,
  meta: 120,
  titleMaxLines: 3,
  summaryMaxLines: 5,
  metaMaxLines: 2,
} as const;

export interface CreateHomeHeroWidgetPayloadInput {
  cards: HomeHeroWidgetCardSnapshot[];
  baseIndex?: number;
  timezone?: string;
  appScheme?: string;
  families?: HomeWidgetFamily[];
}

const normalizeWhitespace = (value: string): string => {
  return value.replace(/\s+/g, ' ').trim();
};

const truncateText = (value: string, limit: number): string => {
  const normalized = normalizeWhitespace(value);
  if (normalized.length <= limit) {
    return normalized;
  }

  const clipped = normalized.slice(0, limit - 1).trimEnd();
  return `${clipped}...`;
};

const createFamilyContent = (
  card: HomeHeroWidgetCardSnapshot,
  limits: {
    title: number;
    summary: number;
    meta: number;
    titleMaxLines: number;
    summaryMaxLines: number;
    metaMaxLines: number;
  }
): HomeHeroWidgetFamilyContent => {
  const meta = card.meta ? truncateText(card.meta, limits.meta) : undefined;

  return {
    title: truncateText(card.title, limits.title),
    summary: truncateText(card.summary, limits.summary),
    meta,
    yearLabel: truncateText(card.yearLabel, 24),
    titleMaxLines: limits.titleMaxLines,
    summaryMaxLines: limits.summaryMaxLines,
    metaMaxLines: limits.metaMaxLines,
  };
};

const createEventSnapshot = (card: HomeHeroWidgetCardSnapshot): HomeHeroWidgetEventSnapshot => {
  return {
    id: card.id,
    imageUri: card.imageUri,
    content: {
      systemMedium: createFamilyContent(card, MEDIUM_LIMITS),
      systemLarge: createFamilyContent(card, LARGE_LIMITS),
    },
  };
};

const createStyleTokens = (theme: ThemeDefinition): HomeHeroWidgetStyleTokens => {
  return {
    colors: {
      heroBackground: theme.colors.heroBackground,
      borderSubtle: theme.colors.borderSubtle,
      textPrimary: theme.colors.textPrimary,
      textSecondary: theme.colors.textSecondary,
      textTertiary: theme.colors.textTertiary,
      accentPrimary: theme.colors.accentPrimary,
    },
    layout: {
      cardCornerRadius: 16,
      bodyHorizontalPadding: theme.spacing.card,
      bodyVerticalPadding: theme.spacing.lg,
      bodyGap: theme.spacing.sm,
      yearPillHorizontalPadding: theme.spacing.md,
      yearPillVerticalPadding: theme.spacing.xs,
      yearPillBorderWidth: 1,
    },
    typography: {
      year: {
        fontSize: 12,
        lineHeight: 14,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
      },
      title: {
        fontSize: 30,
        lineHeight: 36,
        letterSpacing: -0.3,
      },
      summary: {
        fontSize: theme.typography.body.fontSize,
        lineHeight: theme.typography.body.lineHeight,
      },
      meta: {
        fontSize: theme.typography.helper.fontSize,
        lineHeight: theme.typography.helper.lineHeight,
      },
    },
    vignette: [
      { offset: 0, color: 'rgba(12, 10, 6, 0.1)' },
      { offset: 100, color: 'rgba(12, 10, 6, 0.55)' },
    ],
  };
};

export const createHomeHeroWidgetPayload = ({
  cards,
  baseIndex = 0,
  timezone,
  appScheme = 'historiq',
  families = ['systemMedium', 'systemLarge'],
}: CreateHomeHeroWidgetPayloadInput): HomeHeroWidgetPayload | null => {
  const normalizedCards = cards.filter((card) => Boolean(card.id)).slice(0, MAX_WIDGET_EVENTS);
  if (normalizedCards.length === 0) {
    return null;
  }

  const normalizedIndex = ((baseIndex % normalizedCards.length) + normalizedCards.length) % normalizedCards.length;

  const resolvedTimezone = timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? undefined;

  return {
    version: WIDGET_PAYLOAD_VERSION,
    generatedAt: new Date().toISOString(),
    baseTimestamp: new Date().toISOString(),
    baseIndex: normalizedIndex,
    rotationCadence: 'hourly',
    timezone: resolvedTimezone,
    deepLinkTemplate: `${appScheme}://event/{id}?source=home-widget&index={index}`,
    events: normalizedCards.map(createEventSnapshot),
    families,
    theme: {
      light: createStyleTokens(lightTheme),
      dark: createStyleTokens(darkTheme),
    },
  };
};
