import React, { memo, useMemo } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import { useAppTheme } from '@/theme';
import type { TimeMachineSection, TimeMachineTimelineEvent } from '@/types/time-machine';
import { buildTimeMachineEditorialIntro } from '@/utils/time-machine';
import { createImageSource } from '@/utils/wikimedia-image-source';

type YearSummaryCardProps = {
  year: number;
  hero: TimeMachineTimelineEvent | null;
  sections: TimeMachineSection[];
};

export const YearSummaryCard = memo<YearSummaryCardProps>(
  ({ year, hero, sections }) => {
    const theme = useAppTheme();
    const styles = useMemo(() => buildStyles(theme), [theme]);
    const editorial = useMemo(
      () => buildTimeMachineEditorialIntro({ year, hero, sections }),
      [hero, sections, year]
    );

    return (
      <View style={styles.card}>
        <Text style={styles.eyebrow}>{editorial.eyebrow}</Text>
        <Text style={styles.year}>{year}</Text>
        <Text style={styles.hook}>{editorial.hook}</Text>
        <Text style={styles.teaser}>{editorial.teaser}</Text>

        {hero ? (
          <View style={styles.heroRow}>
            {hero.imageUrl ? (
              <Image
                source={createImageSource(hero.imageUrl)}
                style={styles.heroImage}
                contentFit="cover"
                transition={160}
              />
            ) : (
              <View style={[styles.heroImage, styles.heroImageFallback]} />
            )}
            <View style={styles.heroCopy}>
              <Text style={styles.heroLabel}>Featured moment</Text>
              <Text style={styles.heroTitle} numberOfLines={2}>
                {hero.title}
              </Text>
              <Text style={styles.heroSummary} numberOfLines={2}>
                {hero.summary}
              </Text>
            </View>
          </View>
        ) : null}

        {editorial.startMonthLabel ? (
          <View style={styles.scrollCue}>
            <View style={styles.scrollLine} />
            <Text style={styles.scrollText}>Begin in {editorial.startMonthLabel}</Text>
            <Ionicons name="chevron-down" size={14} color={theme.colors.textTertiary} />
          </View>
        ) : null}
      </View>
    );
  }
);

YearSummaryCard.displayName = 'YearSummaryCard';

const buildStyles = (theme: ReturnType<typeof useAppTheme>) => {
  const serifFamily = Platform.select({ ios: 'Times New Roman', android: 'serif', default: 'serif' });
  const sansFamily = Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' });

  return StyleSheet.create({
    card: {
      marginHorizontal: theme.spacing.lg,
      marginTop: theme.spacing.lg,
      borderRadius: theme.radius.xl,
      padding: theme.spacing.xl,
      backgroundColor: theme.colors.surface,
      shadowColor: theme.colors.shadowColor,
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.14,
      shadowRadius: 32,
      elevation: 6,
      gap: theme.spacing.lg,
    },
    eyebrow: {
      fontFamily: sansFamily,
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 1.4,
      textTransform: 'uppercase',
      color: theme.colors.textTertiary,
    },
    year: {
      marginTop: -theme.spacing.md,
      fontFamily: serifFamily,
      fontSize: 44,
      lineHeight: 48,
      color: theme.colors.textPrimary,
      letterSpacing: -1.4,
    },
    hook: {
      marginTop: -theme.spacing.sm,
      fontFamily: serifFamily,
      fontSize: 28,
      lineHeight: 34,
      color: theme.colors.textPrimary,
      letterSpacing: -0.7,
    },
    teaser: {
      fontFamily: sansFamily,
      fontSize: theme.typography.body.fontSize,
      lineHeight: 24,
      color: theme.colors.textSecondary,
    },
    heroRow: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      borderRadius: theme.radius.lg,
      overflow: 'hidden',
      backgroundColor: theme.colors.appBackground,
    },
    heroImage: {
      width: 104,
      height: 116,
      backgroundColor: theme.colors.surfaceSubtle,
    },
    heroImageFallback: {
      backgroundColor: theme.colors.surfaceSubtle,
    },
    heroCopy: {
      flex: 1,
      paddingVertical: theme.spacing.md,
      paddingRight: theme.spacing.md,
      gap: theme.spacing.xs,
    },
    heroLabel: {
      fontFamily: sansFamily,
      fontSize: 11,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      color: theme.colors.accentPrimary,
    },
    heroTitle: {
      fontFamily: serifFamily,
      fontSize: 22,
      lineHeight: 26,
      color: theme.colors.textPrimary,
    },
    heroSummary: {
      fontFamily: sansFamily,
      fontSize: 13,
      lineHeight: 18,
      color: theme.colors.textSecondary,
    },
    scrollCue: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingTop: theme.spacing.xs,
    },
    scrollLine: {
      flex: 1,
      height: 1,
      backgroundColor: theme.colors.borderSubtle,
    },
    scrollText: {
      fontFamily: sansFamily,
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      color: theme.colors.textTertiary,
    },
  });
};
