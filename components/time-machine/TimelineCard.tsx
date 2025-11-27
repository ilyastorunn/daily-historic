import React, { memo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/theme';
import { categoryLabelFromId } from '@/utils/categories';

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

export const TimelineCard = memo(
  ({ id, title, summary, imageUrl, dateISO, categoryId, footerLabel, onPress }: TimelineCardProps) => {
  const theme = useAppTheme();
  const styles = getStyles(theme);

  const handlePress = () => {
    onPress?.(id);
  };

  return (
    <Pressable accessibilityRole="button" onPress={handlePress} style={styles.card}>
      {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.image} contentFit="cover" /> : null}
      <View style={styles.body}>
        {dateISO ? (
          <View style={styles.yearBadge}>
            <Text style={styles.yearText}>{dateISO}</Text>
          </View>
        ) : null}
        <Text style={styles.title}>{title}</Text>
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

const getStyles = (() => {
  let cachedTheme: ReturnType<typeof useAppTheme> | null = null;
  let cachedStyles: ReturnType<typeof StyleSheet.create> | null = null;
  return (theme: ReturnType<typeof useAppTheme>) => {
    if (cachedTheme === theme && cachedStyles) {
      return cachedStyles;
    }
    const styles = StyleSheet.create({
      card: {
        borderRadius: 16, // r-md per NorthStar
        overflow: 'hidden',
        backgroundColor: theme.colors.surface,
        shadowColor: theme.colors.shadowColor,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 1,
        shadowRadius: 32,
        elevation: 2,
      },
      image: {
        width: '100%',
        height: 200,
        backgroundColor: theme.colors.surfaceSubtle,
      },
      body: {
        padding: theme.spacing.md,
        gap: theme.spacing.sm,
      },
      yearBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
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
        fontFamily: 'serif', // Serif for editorial feel
        fontSize: 20,
        lineHeight: 26,
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
      },
      footer: {
        fontFamily: 'System',
        fontSize: 12,
        color: theme.colors.textSecondary,
      },
    });
    cachedTheme = theme;
    cachedStyles = styles;
    return styles;
  };
})();
