import React, { memo } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';

import { createImageSource } from '@/utils/wikimedia-image-source';
import { useAppTheme } from '@/theme';
import { categoryLabelFromId } from '@/utils/categories';

const SCREEN_WIDTH = Dimensions.get('window').width;

export type TimeMachineCardProps = {
  id: string;
  title: string;
  summary: string;
  imageUrl?: string;
  dateISO?: string;
  categoryId?: string;
  onPress?: (id: string) => void;
  fullScreen?: boolean; // Tinder-style full-screen mode
};

const formatDate = (dateISO: string): string => {
  try {
    const date = new Date(dateISO);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  } catch {
    return dateISO;
  }
};

export const TimeMachineCard = memo<TimeMachineCardProps>(
  ({ id, title, summary, imageUrl, dateISO, categoryId, onPress, fullScreen = false }) => {
    const theme = useAppTheme();
    const styles = buildStyles(theme, fullScreen);

    const handlePress = () => {
      onPress?.(id);
    };

    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${title}, ${dateISO ? formatDate(dateISO) : ''}`}
        onPress={handlePress}
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      >
        {imageUrl ? (
          <View style={styles.imageContainer}>
            <Image
              source={createImageSource(imageUrl)}
              style={styles.image}
              contentFit="cover"
              transition={150}
            />
            <View style={styles.imageOverlay} />
          </View>
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]} />
        )}
        <View style={styles.body}>
          {dateISO ? (
            <View style={styles.dateBadge}>
              <Text style={styles.dateText}>{formatDate(dateISO)}</Text>
            </View>
          ) : null}
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          <Text style={styles.summary} numberOfLines={3}>
            {summary}
          </Text>
          {categoryId ? <Text style={styles.meta}>{categoryLabelFromId(categoryId)}</Text> : null}
        </View>
      </Pressable>
    );
  }
);

TimeMachineCard.displayName = 'TimeMachineCard';

const buildStyles = (theme: ReturnType<typeof useAppTheme>, fullScreen: boolean) => {
  const imageHeight = fullScreen ? 420 : 300; // Larger for full-screen mode

  return StyleSheet.create({
    card: {
      width: SCREEN_WIDTH - theme.spacing.xl * 2,
      alignSelf: 'center',
      borderRadius: theme.radius.card,
      overflow: 'hidden',
      backgroundColor: theme.colors.surface,
      shadowColor: theme.colors.shadowColor,
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.14,
      shadowRadius: 28,
      elevation: 6,
    },
    cardPressed: {
      transform: [{ scale: 0.98 }],
      shadowOpacity: 0.1,
    },
    imageContainer: {
      position: 'relative',
      width: '100%',
      height: imageHeight,
    },
    image: {
      width: '100%',
      height: imageHeight,
      backgroundColor: theme.colors.surfaceSubtle,
    },
    imagePlaceholder: {
      backgroundColor: theme.colors.surfaceSubtle,
    },
    imageOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.08)',
    },
    body: {
      padding: theme.spacing.card,
      gap: theme.spacing.md,
    },
    dateBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.radius.pill,
      borderWidth: 1,
      borderColor: theme.colors.accentPrimary,
      backgroundColor: theme.colors.accentSoft,
    },
    dateText: {
      fontFamily: 'System',
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.accentPrimary,
      letterSpacing: 0.4,
    },
    title: {
      fontFamily: 'serif',
      fontSize: 26,
      lineHeight: 32,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    summary: {
      fontFamily: 'System',
      fontSize: 15,
      lineHeight: 22,
      color: theme.colors.textSecondary,
    },
    meta: {
      fontFamily: 'System',
      fontSize: 13,
      color: theme.colors.textTertiary,
      marginTop: theme.spacing.xs,
    },
  });
};
