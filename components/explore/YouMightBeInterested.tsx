import React, { useMemo } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';

import type { FirestoreEventDocument } from '@/types/events';
import { heroEvent } from '@/constants/events';
import { formatCategoryLabel } from '@/constants/personalization';
import { useAppTheme, type ThemeDefinition } from '@/theme';
import { getEventImageUri, getEventSummary, getEventTitle, getEventYearLabel } from '@/utils/event-presentation';
import { createLinearGradientSource } from '@/utils/gradient';
import { markNotInterested } from '@/services/you-might-be-interested';
import { trackEvent } from '@/services/analytics';

type YouMightBeInterestedProps = {
  items: FirestoreEventDocument[];
  loading?: boolean;
  onCardPress?: (eventId: string) => void;
  onRefresh?: () => void;
  onSeeMore?: () => void;
};

const createStyles = (theme: ThemeDefinition) => {
  const { colors, spacing, radius, typography } = theme;
  const serifFamily = Platform.select({ ios: 'Times New Roman', android: 'serif', default: 'serif' });
  const sansFamily = Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' });

  return StyleSheet.create({
    container: {
      gap: spacing.md,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    sectionLabel: {
      fontFamily: sansFamily,
      fontSize: typography.body.fontSize,
      fontWeight: '600',
      color: colors.textPrimary,
      letterSpacing: 0.2,
    },
    seeMoreButton: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    seeMoreLabel: {
      fontFamily: sansFamily,
      fontSize: typography.helper.fontSize,
      color: colors.textSecondary,
    },
    list: {
      gap: spacing.md,
    },
    card: {
      borderRadius: radius.md,
      overflow: 'hidden',
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSubtle,
      shadowColor: colors.shadowColor,
      shadowOpacity: 0.08,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 4,
    },
    cardMedia: {
      height: 140,
      position: 'relative',
      backgroundColor: colors.surfaceSubtle,
    },
    cardImage: {
      width: '100%',
      height: '100%',
    },
    cardContent: {
      padding: spacing.card,
      gap: spacing.sm,
    },
    yearBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      backgroundColor: colors.surfaceSubtle,
      fontFamily: sansFamily,
      fontSize: 12,
      letterSpacing: 0.6,
      color: colors.textSecondary,
      textTransform: 'uppercase',
    },
    cardTitle: {
      fontFamily: serifFamily,
      fontSize: typography.headingMd.fontSize,
      lineHeight: typography.headingMd.lineHeight,
      color: colors.textPrimary,
      letterSpacing: -0.2,
    },
    cardSummary: {
      fontFamily: sansFamily,
      fontSize: typography.body.fontSize,
      lineHeight: typography.body.lineHeight,
      color: colors.textSecondary,
    },
    categoryPill: {
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radius.pill,
      backgroundColor: colors.accentSoft,
    },
    categoryText: {
      fontFamily: sansFamily,
      fontSize: typography.helper.fontSize,
      color: colors.accentPrimary,
    },
    loadingContainer: {
      gap: spacing.md,
    },
    skeletonCard: {
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSubtle,
      overflow: 'hidden',
    },
    skeletonImage: {
      height: 140,
      backgroundColor: colors.surfaceSubtle,
    },
    skeletonContent: {
      padding: spacing.card,
      gap: spacing.md,
    },
    skeletonTitle: {
      height: 20,
      width: '75%',
      backgroundColor: colors.surfaceSubtle,
      borderRadius: radius.sm,
    },
    skeletonSummary: {
      height: 16,
      width: '100%',
      backgroundColor: colors.surfaceSubtle,
      borderRadius: radius.sm,
    },
    emptyContainer: {
      padding: spacing.xl,
      alignItems: 'center',
      gap: spacing.sm,
    },
    emptyText: {
      fontFamily: sansFamily,
      fontSize: typography.body.fontSize,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });
};

const YMBICard = ({
  event,
  onPress,
  onRefresh,
  theme,
  styles,
}: {
  event: FirestoreEventDocument;
  onPress: () => void;
  onRefresh?: () => void;
  theme: ThemeDefinition;
  styles: ReturnType<typeof createStyles>;
}) => {
  const overlaySource = useMemo(
    () =>
      createLinearGradientSource(
        [
          { offset: 0, color: 'rgba(12, 10, 6, 0.05)' },
          { offset: 100, color: 'rgba(12, 10, 6, 0.35)' },
        ],
        { x1: 0.5, y1: 0, x2: 0.5, y2: 1 }
      ),
    []
  );

  const imageUri = getEventImageUri(event);
  const imageSource = imageUri ? { uri: imageUri } : heroEvent.image;
  const yearLabel = getEventYearLabel(event);
  const title = getEventTitle(event);
  const summary = getEventSummary(event);
  const primaryCategory = event.categories?.[0];
  const categoryLabel = primaryCategory ? formatCategoryLabel(primaryCategory) : null;

  const handleLongPress = () => {
    Alert.alert(
      'Not Interested',
      `Hide "${title}" and similar content for 7 days?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Hide',
          style: 'destructive',
          onPress: async () => {
            if (!primaryCategory) return;

            try {
              await markNotInterested(event.eventId, primaryCategory);

              trackEvent('ymbi_not_interested', {
                event_id: event.eventId,
                category_id: primaryCategory,
                event_year: event.year,
              });

              onRefresh?.();
            } catch (error) {
              console.error('[YMBI] Failed to mark not interested:', error);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`You might be interested: ${title}`}
      accessibilityHint="Double tap to view event details. Long press to hide."
      onPress={onPress}
      onLongPress={handleLongPress}
      delayLongPress={500}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.95 }]}
    >
      <View style={styles.cardMedia}>
        <Image source={imageSource} style={styles.cardImage} contentFit="cover" transition={180} />
        <Image
          pointerEvents="none"
          source={overlaySource}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.yearBadge}>{yearLabel}</Text>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {title}
        </Text>
        <Text style={styles.cardSummary} numberOfLines={2}>
          {summary}
        </Text>
        {categoryLabel && (
          <View style={styles.categoryPill}>
            <Text style={styles.categoryText}>{categoryLabel}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
};

export const YouMightBeInterested = ({
  items,
  loading,
  onCardPress,
  onRefresh,
  onSeeMore,
}: YouMightBeInterestedProps) => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Loading skeleton
  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionLabel}>You Might Be Interested</Text>
        <View style={styles.loadingContainer}>
          {[1, 2, 3].map((index) => (
            <View key={index} style={styles.skeletonCard}>
              <View style={styles.skeletonImage}>
                {index === 2 && (
                  <ActivityIndicator
                    size="small"
                    color={theme.colors.accentPrimary}
                    style={{ marginTop: theme.spacing.xl }}
                  />
                )}
              </View>
              <View style={styles.skeletonContent}>
                <View style={styles.skeletonTitle} />
                <View style={styles.skeletonSummary} />
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionLabel}>You Might Be Interested</Text>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No recommendations available right now. Check back later!
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionLabel}>You Might Be Interested</Text>
        {onSeeMore && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="See more recommendations"
            accessibilityHint="Navigate to search with similar content"
            style={styles.seeMoreButton}
            onPress={onSeeMore}
          >
            <Text style={styles.seeMoreLabel}>See more</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.list}>
        {items.map((event, index) => (
          <YMBICard
            key={event.eventId}
            event={event}
            onPress={() => onCardPress?.(event.eventId)}
            onRefresh={onRefresh}
            theme={theme}
            styles={styles}
          />
        ))}
      </View>
    </View>
  );
};
