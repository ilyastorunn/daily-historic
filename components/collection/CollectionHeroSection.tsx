import React, { useMemo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/theme';

export type CollectionHeroSectionProps = {
  title: string;
  blurb?: string;
  coverImageUrl?: string;
};

export const CollectionHeroSection = ({ title, blurb, coverImageUrl }: CollectionHeroSectionProps) => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => buildStyles(theme), [theme]);

  return (
    <View style={styles.hero}>
      {coverImageUrl ? (
        <View style={[styles.coverImageContainer, { paddingTop: insets.top }]}>
          <Image
            source={{ uri: coverImageUrl }}
            style={styles.coverImage}
            resizeMode="cover"
          />
        </View>
      ) : (
        <View style={{ height: insets.top + 60 }} />
      )}
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
  );
};

const buildStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    hero: {
      backgroundColor: theme.colors.screen,
    },
    coverImageContainer: {
      width: '100%',
      backgroundColor: theme.colors.surfaceSubtle,
    },
    coverImage: {
      width: '100%',
      height: 280,
      backgroundColor: theme.colors.surfaceSubtle,
    },
    textContainer: {
      paddingHorizontal: 20, // Match screen padding
      paddingTop: 24, // Hero block padding per NorthStar
      paddingBottom: 8,
      gap: theme.spacing.sm,
    },
    title: {
      fontFamily: 'serif', // Will fallback to system serif (Cormorant Garamond ideal)
      fontSize: 32,
      lineHeight: 40,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    blurb: {
      fontFamily: 'System',
      fontSize: 16,
      lineHeight: 22,
      color: theme.colors.textSecondary,
    },
  });
