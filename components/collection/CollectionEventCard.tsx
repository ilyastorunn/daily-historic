import React, { memo } from 'react';
import { Image } from 'expo-image';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/theme';
import { categoryLabelFromId } from '@/utils/categories';
import { createImageSource } from '@/utils/wikimedia-image-source';

type CollectionEventCardProps = {
  id: string;
  title: string;
  summary: string;
  imageUrl?: string;
  dateISO?: string;
  categoryId?: string;
  onPress?: (id: string) => void;
};

const formatBadge = (dateISO?: string) => {
  if (!dateISO) {
    return null;
  }
  if (/^-?\d{4,}$/.test(dateISO)) {
    return dateISO;
  }
  return dateISO;
};

export const CollectionEventCard = memo(
  ({ id, title, summary, imageUrl, dateISO, categoryId, onPress }: CollectionEventCardProps) => {
    const theme = useAppTheme();
    const styles = buildStyles(theme);
    const badge = formatBadge(dateISO);

    return (
      <Pressable
        accessibilityRole="button"
        onPress={() => onPress?.(id)}
        style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}
      >
        {imageUrl ? (
          <Image source={createImageSource(imageUrl)} style={styles.image} contentFit="cover" />
        ) : (
          <View style={styles.imageFallback} />
        )}
        {badge ? (
          <View style={styles.yearBadge}>
            <Text style={styles.yearText}>{badge}</Text>
          </View>
        ) : null}
        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          <Text style={styles.summary} numberOfLines={2}>
            {summary}
          </Text>
          {categoryId ? (
            <Text style={styles.meta} numberOfLines={1}>
              {categoryLabelFromId(categoryId)}
            </Text>
          ) : null}
        </View>
      </Pressable>
    );
  }
);

CollectionEventCard.displayName = 'CollectionEventCard';

const buildStyles = (theme: ReturnType<typeof useAppTheme>) => {
  const sansFamily = Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' });
  const serifFamily = Platform.select({ ios: 'Times New Roman', android: 'serif', default: 'serif' });

  return StyleSheet.create({
    card: {
      borderRadius: theme.radius.md,
      overflow: 'hidden',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.borderSubtle,
      backgroundColor: theme.colors.surface,
      shadowColor: theme.colors.shadowColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 10,
      elevation: 3,
    },
    image: {
      width: '100%',
      aspectRatio: 1.08,
      backgroundColor: theme.colors.surfaceSubtle,
    },
    imageFallback: {
      width: '100%',
      aspectRatio: 1.08,
      backgroundColor: theme.colors.surfaceSubtle,
    },
    yearBadge: {
      position: 'absolute',
      top: theme.spacing.sm,
      left: theme.spacing.sm,
      borderRadius: theme.radius.pill,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 3,
      borderWidth: 1,
      borderColor: theme.colors.accentPrimary,
      backgroundColor: theme.colors.accentSoft,
    },
    yearText: {
      fontFamily: sansFamily,
      fontSize: 11,
      lineHeight: 14,
      color: theme.colors.accentPrimary,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    body: {
      padding: theme.spacing.md,
      gap: theme.spacing.xs,
    },
    title: {
      fontFamily: serifFamily,
      fontSize: 27,
      lineHeight: 32,
      color: theme.colors.textPrimary,
      fontWeight: '600',
    },
    summary: {
      fontFamily: sansFamily,
      fontSize: 13,
      lineHeight: 17,
      color: theme.colors.textSecondary,
    },
    meta: {
      marginTop: 2,
      fontFamily: sansFamily,
      fontSize: 11,
      lineHeight: 14,
      letterSpacing: 0.35,
      textTransform: 'uppercase',
      color: theme.colors.textTertiary,
    },
  });
};
