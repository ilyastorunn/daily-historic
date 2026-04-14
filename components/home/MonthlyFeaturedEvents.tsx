import React, { useMemo } from 'react';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme, type ThemeDefinition } from '@/theme';
import type { MonthlyFeaturedEventSummary } from '@/services/home';
import { createImageSource } from '@/utils/wikimedia-image-source';

type MonthlyFeaturedEventsProps = {
  title?: string;
  helperText?: string;
  collectionLabel?: string;
  weekLabel?: string;
  seeAllLabel?: string;
  items: MonthlyFeaturedEventSummary[];
  loading?: boolean;
  onPress: (eventId: string, index: number) => void;
  onSeeAllPress?: () => void;
  testID?: string;
};

const buildStyles = (theme: ThemeDefinition) => {
  const serifFamily = Platform.select({ ios: 'Times New Roman', android: 'serif', default: 'serif' });
  const sansFamily = Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' });

  return StyleSheet.create({
    container: {
      gap: theme.spacing.md,
    },
    headerPanel: {
      gap: theme.spacing.sm,
    },
    collectionTagWrap: {
      alignSelf: 'flex-start',
      borderRadius: theme.radius.pill,
      overflow: 'hidden',
    },
    collectionTagBlur: {
      paddingHorizontal: theme.spacing.sm + 2,
      paddingVertical: 5,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(255,255,255,0.24)',
      backgroundColor: 'rgba(12, 10, 6, 0.14)',
    },
    collectionTagText: {
      fontFamily: sansFamily,
      fontSize: 11,
      lineHeight: 14,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: 'rgba(255,255,255,0.95)',
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    title: {
      fontFamily: serifFamily,
      fontSize: 26,
      lineHeight: 32,
      color: theme.colors.textPrimary,
      flexShrink: 1,
    },
    seeAllButton: {
      paddingVertical: 2,
    },
    seeAllText: {
      fontFamily: sansFamily,
      fontSize: theme.typography.helper.fontSize,
      lineHeight: theme.typography.helper.lineHeight,
      color: theme.colors.accentPrimary,
      letterSpacing: 0.2,
      fontWeight: '600',
      textDecorationLine: 'underline',
    },
    footerRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: 2,
    },
    helperRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    helper: {
      fontFamily: sansFamily,
      fontSize: theme.typography.helper.fontSize,
      lineHeight: theme.typography.helper.lineHeight,
      color: theme.colors.textSecondary,
      flex: 1,
    },
    weekMeta: {
      fontFamily: sansFamily,
      fontSize: theme.typography.helper.fontSize - 1,
      lineHeight: theme.typography.helper.lineHeight,
      color: theme.colors.textTertiary,
      letterSpacing: 0.3,
      textTransform: 'uppercase',
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
      shadowColor: theme.colors.shadowColor,
      shadowOpacity: 0.12,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 3,
    },
    cardImage: {
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
      paddingVertical: 4,
      backgroundColor: 'rgba(12, 10, 6, 0.5)',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(255,255,255,0.28)',
    },
    yearBadgeText: {
      fontFamily: sansFamily,
      fontSize: 11,
      lineHeight: 14,
      color: '#FFFFFF',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
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
    cardSummary: {
      fontFamily: sansFamily,
      fontSize: theme.typography.helper.fontSize,
      lineHeight: theme.typography.helper.lineHeight,
      color: theme.colors.textTertiary,
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
  helperText = "Drawn from this month's Collection of the Month.",
  collectionLabel = 'This Month',
  weekLabel,
  seeAllLabel = 'View Full Collection',
  items,
  loading,
  onPress,
  onSeeAllPress,
  testID,
}) => {
  const theme = useAppTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);

  const displayItems = loading ? skeletonItems : items.slice(0, 4);

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.headerPanel}>
        <View style={styles.collectionTagWrap}>
          <BlurView intensity={30} tint="dark" style={styles.collectionTagBlur}>
            <Text style={styles.collectionTagText}>{`From ${collectionLabel} Collection`}</Text>
          </BlurView>
        </View>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{title}</Text>
        </View>
        <View style={styles.helperRow}>
          <Text style={styles.helper}>{helperText}</Text>
          {weekLabel ? <Text style={styles.weekMeta}>{weekLabel}</Text> : null}
        </View>
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
              <View style={styles.yearBadge}>
                <Text style={styles.yearBadgeText}>
                  {loading ? ' ' : item.year ? String(item.year) : 'History'}
                </Text>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {loading ? ' ' : item.title}
                </Text>
                <Text style={styles.cardMeta} numberOfLines={1}>
                  {loading ? ' ' : 'Weekly editor pick'}
                </Text>
                <Text style={styles.cardSummary} numberOfLines={2}>
                  {loading ? ' ' : item.summary}
                </Text>
              </View>
            </Pressable>
          </View>
        ))}
      </View>

      {onSeeAllPress ? (
        <View style={styles.footerRow}>
          <Pressable
            accessibilityRole="button"
            disabled={loading}
            onPress={onSeeAllPress}
            style={({ pressed }) => [styles.seeAllButton, pressed && { opacity: 0.75 }]}
          >
            <Text style={styles.seeAllText}>{seeAllLabel}</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
};
