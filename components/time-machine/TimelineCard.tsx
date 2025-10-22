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
        {dateISO ? <Text style={styles.date}>{dateISO}</Text> : null}
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
        borderRadius: theme.radius.md,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.colors.borderSubtle,
        overflow: 'hidden',
        backgroundColor: theme.colors.surface,
      },
      image: {
        width: '100%',
        height: 180,
        backgroundColor: theme.colors.surfaceSubtle,
      },
      body: {
        padding: theme.spacing.md,
        gap: theme.spacing.xs,
      },
      date: {
        fontFamily: 'System',
        fontSize: 12,
        color: theme.colors.textTertiary,
      },
      title: {
        fontFamily: 'Times New Roman',
        fontSize: 20,
        color: theme.colors.textPrimary,
      },
      summary: {
        fontFamily: 'System',
        fontSize: 14,
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
