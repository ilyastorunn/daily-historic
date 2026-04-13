import React, { useMemo } from 'react';
import { Image } from 'expo-image';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme, type ThemeDefinition } from '@/theme';
import { createLinearGradientSource } from '@/utils/gradient';
import { createImageSource } from '@/utils/wikimedia-image-source';

type MonthlyCollectionHeroProps = {
  title: string;
  subtitle: string;
  heroBlurb: string;
  monthLabel: string;
  coverUrl: string;
  ctaLabel?: string;
  loading?: boolean;
  onPress: () => void;
  testID?: string;
};

const buildStyles = (theme: ThemeDefinition) => {
  const serifFamily = Platform.select({ ios: 'Times New Roman', android: 'serif', default: 'serif' });
  const sansFamily = Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' });

  return StyleSheet.create({
    container: {
      borderRadius: 18,
      overflow: 'hidden',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.borderSubtle,
      backgroundColor: theme.colors.surface,
      shadowColor: theme.colors.shadowColor,
      shadowOpacity: 0.18,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 8 },
      elevation: 5,
    },
    imageWrap: {
      height: 260,
      width: '100%',
      backgroundColor: theme.colors.surfaceSubtle,
    },
    image: {
      width: '100%',
      height: '100%',
    },
    gradient: {
      ...StyleSheet.absoluteFillObject,
    },
    textOverlay: {
      position: 'absolute',
      left: theme.spacing.lg,
      right: theme.spacing.lg,
      bottom: theme.spacing.lg,
      gap: theme.spacing.xs,
    },
    monthLabel: {
      fontFamily: sansFamily,
      color: '#FFFFFF',
      fontSize: theme.typography.helper.fontSize,
      lineHeight: theme.typography.helper.lineHeight,
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    title: {
      fontFamily: serifFamily,
      color: '#FFFFFF',
      fontSize: 30,
      lineHeight: 36,
      letterSpacing: -0.35,
    },
    subtitle: {
      fontFamily: sansFamily,
      color: 'rgba(255,255,255,0.92)',
      fontSize: theme.typography.body.fontSize,
      lineHeight: theme.typography.body.lineHeight,
    },
    body: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.lg,
      gap: theme.spacing.md,
    },
    blurb: {
      fontFamily: sansFamily,
      color: theme.colors.textSecondary,
      fontSize: theme.typography.body.fontSize,
      lineHeight: theme.typography.body.lineHeight,
    },
    ctaButton: {
      alignSelf: 'flex-start',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.textPrimary,
    },
    ctaText: {
      fontFamily: sansFamily,
      color: theme.colors.screen,
      fontSize: theme.typography.helper.fontSize,
      letterSpacing: 0.3,
    },
    loadingState: {
      opacity: 0.7,
    },
  });
};

export const MonthlyCollectionHero: React.FC<MonthlyCollectionHeroProps> = ({
  title,
  subtitle,
  heroBlurb,
  monthLabel,
  coverUrl,
  ctaLabel = 'Open collection',
  loading,
  onPress,
  testID,
}) => {
  const theme = useAppTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);

  const gradient = useMemo(
    () =>
      createLinearGradientSource(
        [
          { offset: 0, color: 'rgba(12, 10, 6, 0.05)' },
          { offset: 65, color: 'rgba(12, 10, 6, 0.35)' },
          { offset: 100, color: 'rgba(12, 10, 6, 0.82)' },
        ],
        { x1: 0.5, y1: 0, x2: 0.5, y2: 1 }
      ),
    []
  );

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={loading}
      testID={testID}
      style={({ pressed }) => [styles.container, loading && styles.loadingState, pressed && { opacity: 0.9 }]}
    >
      <View style={styles.imageWrap}>
        <Image source={createImageSource(coverUrl)} style={styles.image} contentFit="cover" />
        <Image source={gradient} style={styles.gradient} contentFit="cover" />
        <View style={styles.textOverlay}>
          <Text style={styles.monthLabel}>{monthLabel}</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.blurb}>{heroBlurb}</Text>
        <View style={styles.ctaButton}>
          <Text style={styles.ctaText}>{ctaLabel}</Text>
        </View>
      </View>
    </Pressable>
  );
};
