import React, { useMemo } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';

import type { SOTDResponse } from '@/services/story-of-the-day';
import { heroEvent } from '@/constants/events';
import { useAppTheme, type ThemeDefinition } from '@/theme';
import { createLinearGradientSource } from '@/utils/gradient';

type StoryOfTheDayProps = {
  story: SOTDResponse | null;
  loading?: boolean;
  onPress?: () => void;
};

const createStyles = (theme: ThemeDefinition) => {
  const { colors, spacing, radius, typography } = theme;
  const serifFamily = Platform.select({ ios: 'Times New Roman', android: 'serif', default: 'serif' });
  const sansFamily = Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' });

  return StyleSheet.create({
    container: {
      gap: spacing.sm,
    },
    sectionLabel: {
      fontFamily: sansFamily,
      fontSize: typography.body.fontSize,
      fontWeight: '600',
      color: colors.textPrimary,
      letterSpacing: 0.2,
    },
    card: {
      borderRadius: radius.lg,
      overflow: 'hidden',
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSubtle,
      shadowColor: colors.shadowColor,
      shadowOpacity: 0.12,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 14 },
      elevation: 6,
    },
    imageContainer: {
      position: 'relative',
      aspectRatio: 16 / 9,
      backgroundColor: colors.surfaceSubtle,
    },
    image: {
      width: '100%',
      height: '100%',
    },
    ribbonContainer: {
      position: 'absolute',
      top: spacing.lg,
      left: spacing.lg,
      backgroundColor: colors.accentPrimary,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radius.sm,
      shadowColor: colors.shadowColor,
      shadowOpacity: 0.24,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    ribbonText: {
      fontFamily: sansFamily,
      fontSize: typography.helper.fontSize,
      fontWeight: '600',
      color: colors.surface,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    seedBadge: {
      backgroundColor: colors.surfaceSubtle,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    seedBadgeText: {
      color: colors.textSecondary,
    },
    content: {
      padding: spacing.card,
      gap: spacing.sm,
    },
    title: {
      fontFamily: serifFamily,
      fontSize: typography.headingMd.fontSize,
      lineHeight: typography.headingMd.lineHeight,
      color: colors.textPrimary,
      letterSpacing: -0.2,
    },
    blurb: {
      fontFamily: sansFamily,
      fontSize: typography.body.fontSize,
      lineHeight: typography.body.lineHeight,
      color: colors.textSecondary,
    },
    ctaButton: {
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      backgroundColor: colors.accentSoft,
      borderWidth: 1,
      borderColor: colors.accentPrimary,
      minHeight: 44,
      justifyContent: 'center',
      marginTop: spacing.xs,
    },
    ctaLabel: {
      fontFamily: sansFamily,
      fontSize: typography.body.fontSize,
      fontWeight: '600',
      color: colors.accentPrimary,
    },
    loadingContainer: {
      aspectRatio: 16 / 9,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceSubtle,
      borderRadius: radius.lg,
    },
    skeletonCard: {
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSubtle,
      overflow: 'hidden',
    },
    skeletonImage: {
      aspectRatio: 16 / 9,
      backgroundColor: colors.surfaceSubtle,
    },
    skeletonContent: {
      padding: spacing.card,
      gap: spacing.md,
    },
    skeletonTitle: {
      height: 24,
      width: '80%',
      backgroundColor: colors.surfaceSubtle,
      borderRadius: radius.sm,
    },
    skeletonBlurb: {
      height: 16,
      width: '100%',
      backgroundColor: colors.surfaceSubtle,
      borderRadius: radius.sm,
    },
    skeletonBlurbShort: {
      height: 16,
      width: '60%',
      backgroundColor: colors.surfaceSubtle,
      borderRadius: radius.sm,
    },
  });
};

export const StoryOfTheDay = ({ story, loading, onPress }: StoryOfTheDayProps) => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const overlaySource = useMemo(
    () =>
      createLinearGradientSource(
        [
          { offset: 0, color: 'rgba(12, 10, 6, 0)' },
          { offset: 100, color: 'rgba(12, 10, 6, 0.25)' },
        ],
        { x1: 0.5, y1: 0, x2: 0.5, y2: 1 }
      ),
    []
  );

  // Loading skeleton
  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionLabel}>Story of the Day</Text>
        <View style={styles.skeletonCard}>
          <View style={styles.skeletonImage}>
            <ActivityIndicator
              size="large"
              color={theme.colors.accentPrimary}
              style={{ marginTop: theme.spacing.xxl }}
            />
          </View>
          <View style={styles.skeletonContent}>
            <View style={styles.skeletonTitle} />
            <View style={styles.skeletonBlurb} />
            <View style={styles.skeletonBlurbShort} />
          </View>
        </View>
      </View>
    );
  }

  if (!story) {
    return null;
  }

  const imageSource = story.imageUrl ? { uri: story.imageUrl } : heroEvent.image;
  const isEditorsPick = story.source === 'seed';
  const ribbonLabel = isEditorsPick ? "Editor's Pick" : 'Story of the Day';

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>Story of the Day</Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Story of the Day: ${story.title}`}
        accessibilityHint="Double tap to read full story"
        onPress={onPress}
        style={({ pressed }) => [styles.card, pressed && { opacity: 0.95 }]}
      >
        <View style={styles.imageContainer}>
          <Image source={imageSource} style={styles.image} contentFit="cover" transition={180} />
          <Image
            pointerEvents="none"
            source={overlaySource}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
          <View style={[styles.ribbonContainer, isEditorsPick && styles.seedBadge]}>
            <Text style={[styles.ribbonText, isEditorsPick && styles.seedBadgeText]}>
              {ribbonLabel}
            </Text>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={2}>
            {story.title}
          </Text>
          {story.blurb && (
            <Text style={styles.blurb} numberOfLines={2}>
              {story.blurb}
            </Text>
          )}
          <View style={styles.ctaButton}>
            <Text style={styles.ctaLabel}>Read</Text>
          </View>
        </View>
      </Pressable>
    </View>
  );
};
