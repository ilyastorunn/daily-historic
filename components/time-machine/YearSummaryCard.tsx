import React, { memo, useMemo, useState } from 'react';
import { Platform, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import { heroEvent } from '@/constants/events';
import { useAppTheme } from '@/theme';
import type { TimeMachineEditorialIntro } from '@/types/time-machine';
import { createLinearGradientSource } from '@/utils/gradient';
import { createImageSource, toImageSource } from '@/utils/wikimedia-image-source';

type YearSummaryCardProps = {
  year: number;
  coverImageUrl?: string;
  editorialIntro: TimeMachineEditorialIntro;
  startMonthLabel?: string | null;
};

export const YearSummaryCard = memo<YearSummaryCardProps>(
  ({ year, coverImageUrl, editorialIntro, startMonthLabel }) => {
    const theme = useAppTheme();
    const { height: screenHeight } = useWindowDimensions();
    const heroHeight = Math.min(Math.max(Math.round(screenHeight * 0.54), 440), 540);
    const panelOverlap = Math.min(Math.max(Math.round(heroHeight * 0.11), 44), 58);
    const styles = useMemo(
      () => buildStyles(theme, heroHeight, panelOverlap),
      [heroHeight, panelOverlap, theme]
    );
    const [imageLoadError, setImageLoadError] = useState(false);
    const fallbackImageSource = useMemo(() => toImageSource(heroEvent.image), []);
    const coverImageSource =
      imageLoadError || !coverImageUrl ? fallbackImageSource : createImageSource(coverImageUrl);
    const heroOverlay = useMemo(
      () =>
        createLinearGradientSource(
          [
            { offset: 0, color: 'rgba(12, 10, 6, 0.52)' },
            { offset: 16, color: 'rgba(12, 10, 6, 0.28)' },
            { offset: 34, color: 'rgba(12, 10, 6, 0.08)' },
            { offset: 64, color: 'rgba(12, 10, 6, 0.18)' },
            { offset: 100, color: 'rgba(12, 10, 6, 0.72)' },
          ],
          { x1: 0.5, y1: 0, x2: 0.5, y2: 1 }
        ),
      []
    );

    return (
      <View style={styles.wrap}>
        <View style={styles.heroHeader}>
          <View style={styles.heroMedia}>
            <Image
              source={coverImageSource}
              style={styles.heroImage}
              contentFit="cover"
              transition={220}
              onError={() => setImageLoadError(true)}
            />
            <Image
              pointerEvents="none"
              source={heroOverlay}
              style={styles.heroOverlay}
              contentFit="cover"
            />
          </View>
        </View>

        <View style={styles.editorialPanel}>
          <Text style={styles.yearLabel}>Year {year}</Text>
          <Text style={styles.hook}>{editorialIntro.hook}</Text>
          <Text style={styles.teaser}>{editorialIntro.teaser}</Text>

          {startMonthLabel ? (
            <View style={styles.scrollCue}>
              <View style={styles.scrollLine} />
              <Text style={styles.scrollText}>Begin in {startMonthLabel}</Text>
              <Ionicons name="chevron-down" size={14} color={theme.colors.textTertiary} />
            </View>
          ) : null}
        </View>
      </View>
    );
  }
);

YearSummaryCard.displayName = 'YearSummaryCard';

const buildStyles = (
  theme: ReturnType<typeof useAppTheme>,
  heroHeight: number,
  panelOverlap: number
) => {
  const serifFamily = Platform.select({ ios: 'Times New Roman', android: 'serif', default: 'serif' });
  const sansFamily = Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' });
  const editorialSurface =
    theme.mode === 'dark' ? '#25211b' : '#FBF7F0';
  const editorialBorder =
    theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.07)' : 'rgba(205, 194, 178, 0.62)';

  return StyleSheet.create({
    wrap: {
      marginBottom: theme.spacing.lg,
    },
    heroHeader: {
      overflow: 'hidden',
      backgroundColor: theme.colors.heroBackground,
      shadowColor: theme.colors.shadowColor,
      shadowOpacity: 0.22,
      shadowRadius: 28,
      shadowOffset: { width: 0, height: 16 },
      elevation: 8,
    },
    heroMedia: {
      height: heroHeight,
      position: 'relative',
      backgroundColor: theme.colors.heroBackground,
    },
    heroImage: {
      width: '100%',
      height: '100%',
    },
    heroOverlay: {
      ...StyleSheet.absoluteFillObject,
    },
    editorialPanel: {
      marginTop: -panelOverlap,
      marginHorizontal: theme.spacing.lg,
      borderRadius: theme.radius.xl,
      backgroundColor: editorialSurface,
      borderWidth: 1,
      borderColor: editorialBorder,
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.xl,
      gap: theme.spacing.md,
      shadowColor: theme.colors.shadowColor,
      shadowOpacity: 0.12,
      shadowRadius: 22,
      shadowOffset: { width: 0, height: 10 },
      elevation: 8,
    },
    yearLabel: {
      alignSelf: 'flex-start',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.radius.pill,
      borderWidth: 1,
      borderColor: theme.colors.accentPrimary,
      color: theme.colors.accentPrimary,
      fontFamily: sansFamily,
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      overflow: 'hidden',
    },
    hook: {
      fontFamily: serifFamily,
      fontSize: 32,
      lineHeight: 38,
      color: theme.colors.textPrimary,
      letterSpacing: -0.8,
    },
    teaser: {
      fontFamily: sansFamily,
      fontSize: 16,
      lineHeight: 24,
      color: theme.colors.textSecondary,
    },
    scrollCue: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingTop: theme.spacing.sm,
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
