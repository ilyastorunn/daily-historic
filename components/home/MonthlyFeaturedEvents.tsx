import React, { useMemo } from 'react';
import { Image } from 'expo-image';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme, type ThemeDefinition } from '@/theme';
import type { MonthlyFeaturedEventSummary } from '@/services/home';
import { createImageSource } from '@/utils/wikimedia-image-source';

type MonthlyFeaturedEventsProps = {
  title?: string;
  helperText?: string;
  items: MonthlyFeaturedEventSummary[];
  loading?: boolean;
  onPress: (eventId: string, index: number) => void;
  testID?: string;
};

const buildStyles = (theme: ThemeDefinition) => {
  const serifFamily = Platform.select({ ios: 'Times New Roman', android: 'serif', default: 'serif' });
  const sansFamily = Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' });

  return StyleSheet.create({
    container: {
      gap: theme.spacing.md,
    },
    header: {
      gap: theme.spacing.xs,
    },
    title: {
      fontFamily: serifFamily,
      fontSize: 24,
      lineHeight: 30,
      color: theme.colors.textPrimary,
    },
    helper: {
      fontFamily: sansFamily,
      fontSize: theme.typography.helper.fontSize,
      lineHeight: theme.typography.helper.lineHeight,
      color: theme.colors.textSecondary,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -6,
      rowGap: theme.spacing.md,
    },
    cardWrap: {
      width: '50%',
      paddingHorizontal: 6,
    },
    card: {
      borderRadius: theme.radius.md,
      overflow: 'hidden',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.borderSubtle,
      backgroundColor: theme.colors.surface,
    },
    cardImage: {
      width: '100%',
      aspectRatio: 1.25,
      backgroundColor: theme.colors.surfaceSubtle,
    },
    cardBody: {
      padding: theme.spacing.md,
      gap: theme.spacing.xs,
    },
    cardTitle: {
      fontFamily: serifFamily,
      fontSize: theme.typography.body.fontSize + 1,
      lineHeight: theme.typography.body.lineHeight,
      color: theme.colors.textPrimary,
    },
    cardMeta: {
      fontFamily: sansFamily,
      fontSize: theme.typography.helper.fontSize,
      lineHeight: theme.typography.helper.lineHeight,
      color: theme.colors.textSecondary,
    },
    skeletonCard: {
      opacity: 0.6,
    },
  });
};

const skeletonItems: MonthlyFeaturedEventSummary[] = Array.from({ length: 4 }, (_, index) => ({
  id: `monthly-featured-skeleton-${index}`,
  title: '',
  summary: '',
}));

export const MonthlyFeaturedEvents: React.FC<MonthlyFeaturedEventsProps> = ({
  title = "This Week's 4 Picks",
  helperText = '4 stories are auto-selected weekly from the active monthly collection.',
  items,
  loading,
  onPress,
  testID,
}) => {
  const theme = useAppTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);

  const displayItems = loading ? skeletonItems : items.slice(0, 4);

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.helper}>{helperText}</Text>
      </View>

      <View style={styles.grid}>
        {displayItems.map((item, index) => (
          <View key={item.id} style={styles.cardWrap}>
            <Pressable
              accessibilityRole="button"
              disabled={loading}
              onPress={() => onPress(item.id, index)}
              style={({ pressed }) => [styles.card, loading && styles.skeletonCard, pressed && { opacity: 0.9 }]}
            >
              <Image source={createImageSource(item.imageUrl)} style={styles.cardImage} contentFit="cover" />
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {loading ? ' ' : item.title}
                </Text>
                <Text style={styles.cardMeta} numberOfLines={1}>
                  {loading ? ' ' : item.year ? String(item.year) : 'Historical Moment'}
                </Text>
              </View>
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  );
};
