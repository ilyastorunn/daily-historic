import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';

import { useAppTheme } from '@/theme';
import { categoryLabelFromId } from '@/utils/categories';
import { createImageSource } from '@/utils/wikimedia-image-source';

export type TimelineCardProps = {
  id: string;
  title: string;
  summary: string;
  imageUrl?: string;
  dateISO?: string;
  categoryId?: string;
  onPress?: (id: string) => void;
  footerLabel?: string;
};

const formatBadge = (dateISO?: string) => {
  if (!dateISO) {
    return null;
  }

  const exactDateMatch = /^-?\d{4,}-(\d{2})-(\d{2})$/.exec(dateISO);
  if (exactDateMatch) {
    const month = Number.parseInt(exactDateMatch[1], 10);
    const day = Number.parseInt(exactDateMatch[2], 10);
    const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(
      new Date(Date.UTC(2020, month - 1, day))
    );
    return `${monthLabel} ${day}`;
  }

  if (/^-?\d{4,}$/.test(dateISO)) {
    return dateISO;
  }

  return dateISO;
};

export const TimelineCard = memo(
  ({ id, title, summary, imageUrl, dateISO, categoryId, footerLabel, onPress }: TimelineCardProps) => {
  const theme = useAppTheme();
  const styles = buildStyles(theme);
  const badge = formatBadge(dateISO);

  const handlePress = () => {
    onPress?.(id);
  };

  return (
    <Pressable accessibilityRole="button" onPress={handlePress} style={styles.card}>
      {imageUrl ? <Image source={createImageSource(imageUrl)} style={styles.image} contentFit="cover" /> : null}
      <View style={styles.body}>
        {badge ? (
          <View style={styles.yearBadge}>
            <Text style={styles.yearText}>{badge}</Text>
          </View>
        ) : null}
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        <Text style={styles.summary} numberOfLines={3}>
          {summary}
        </Text>
        {categoryId ? <Text style={styles.meta}>{categoryLabelFromId(categoryId)}</Text> : null}
        {footerLabel ? <Text style={styles.footer}>{footerLabel}</Text> : null}
      </View>
    </Pressable>
  );
}
);

TimelineCard.displayName = 'TimelineCard';

const buildStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      borderRadius: 16,
      overflow: 'hidden',
      backgroundColor: theme.colors.surface,
      shadowColor: theme.colors.shadowColor,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
      elevation: 3,
      minHeight: 154,
    },
    image: {
      width: 118,
      height: 154,
      backgroundColor: theme.colors.surfaceSubtle,
    },
    body: {
      flex: 1,
      padding: theme.spacing.lg,
      gap: theme.spacing.sm,
    },
    yearBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: theme.radius.pill,
      borderWidth: 1,
      borderColor: theme.colors.accentPrimary,
      backgroundColor: theme.colors.accentSoft,
    },
    yearText: {
      fontFamily: 'System',
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.accentPrimary,
      textTransform: 'uppercase',
    },
    title: {
      fontFamily: 'serif',
      fontSize: 21,
      lineHeight: 27,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    summary: {
      fontFamily: 'System',
      fontSize: 14,
      lineHeight: 20,
      color: theme.colors.textSecondary,
    },
    meta: {
      fontFamily: 'System',
      fontSize: 12,
      color: theme.colors.textTertiary,
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    footer: {
      fontFamily: 'System',
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
  });
