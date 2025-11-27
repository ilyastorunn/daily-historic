import React, { useMemo } from 'react';
import { Image as ExpoImage } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/theme';
import { createLinearGradientSource } from '@/utils/gradient';

export type CollectionHeroSectionProps = {
  title: string;
  blurb?: string;
  coverImageUrl?: string;
};

export const CollectionHeroSection = ({ title, blurb, coverImageUrl }: CollectionHeroSectionProps) => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => buildStyles(theme), [theme]);

  // Gradient overlay for text readability
  const gradientOverlay = useMemo(
    () =>
      createLinearGradientSource(
        [
          { offset: 0, color: 'rgba(12, 10, 6, 0)' },
          { offset: 50, color: 'rgba(12, 10, 6, 0.2)' },
          { offset: 100, color: 'rgba(12, 10, 6, 0.85)' },
        ],
        { x1: 0.5, y1: 0, x2: 0.5, y2: 1 }
      ),
    []
  );

  const heroHeight = 400 + insets.top;

  return (
    <View style={styles.hero}>
      {coverImageUrl ? (
        <View style={[styles.coverImageContainer, { height: heroHeight }]}>
          {/* Cover Image */}
          <ExpoImage
            source={{ uri: coverImageUrl }}
            style={styles.coverImage}
            contentFit="cover"
          />

          {/* Gradient Overlay */}
          <ExpoImage
            pointerEvents="none"
            source={gradientOverlay}
            style={styles.gradientOverlay}
            contentFit="cover"
          />

          {/* Text Content on Image */}
          <View style={styles.textContainer}>
            <Text style={styles.title} numberOfLines={3}>
              {title}
            </Text>
            {blurb ? (
              <Text style={styles.blurb} numberOfLines={3}>
                {blurb}
              </Text>
            ) : null}
          </View>
        </View>
      ) : (
        <View style={{ height: insets.top + 60 }} />
      )}
    </View>
  );
};

const buildStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    hero: {
      backgroundColor: theme.colors.screen,
      marginTop: 0,
    },
    coverImageContainer: {
      width: '100%',
      position: 'relative',
      backgroundColor: theme.colors.surfaceSubtle,
      overflow: 'hidden',
    },
    coverImage: {
      width: '100%',
      height: '100%',
      backgroundColor: theme.colors.surfaceSubtle,
    },
    gradientOverlay: {
      ...StyleSheet.absoluteFillObject,
    },
    textContainer: {
      position: 'absolute',
      bottom: 24, // Bottom padding per NorthStar
      left: 20,
      right: 20,
      gap: theme.spacing.sm,
    },
    title: {
      fontFamily: 'serif', // Will fallback to system serif (Cormorant Garamond ideal)
      fontSize: 32,
      lineHeight: 40,
      fontWeight: '600',
      color: '#ffffff', // White for visibility on gradient
      textShadowColor: 'rgba(0, 0, 0, 0.4)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 8,
    },
    blurb: {
      fontFamily: 'System',
      fontSize: 16,
      lineHeight: 22,
      color: 'rgba(255, 255, 255, 0.92)', // Slightly transparent white
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 4,
    },
  });
