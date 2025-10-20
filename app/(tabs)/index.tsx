import React, { useCallback, useEffect, useMemo } from 'react';
import { Platform, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { Image, type ImageErrorEventData, type ImageLoadEventData } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { heroEvent } from '@/constants/events';
import { useDailyDigestEvents } from '@/hooks/use-daily-digest-events';
import { useEventEngagement, type ReactionType } from '@/hooks/use-event-engagement';
import { useUserContext } from '@/contexts/user-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAppTheme, type ThemeDefinition } from '@/theme';
import type { FirestoreEventDocument } from '@/types/events';
import { getDateParts } from '@/utils/dates';
import { createLinearGradientSource } from '@/utils/gradient';
import { getImageUri } from '@/utils/image-source';
import {
  getEventImageUri,
  getEventLocation,
  getEventMeta,
  getEventSummary,
  getEventTitle,
  getEventYearLabel,
} from '@/utils/event-presentation';

const reactions: { id: ReactionType; emoji: string; label: string }[] = [
  { id: 'appreciate', emoji: '👍', label: 'Appreciate' },
  { id: 'insight', emoji: '💡', label: 'Insight' },
];

const buildStyles = (theme: ThemeDefinition) => {
  const { colors, spacing, radius, typography } = theme;
  const serifFamily = Platform.select({ ios: 'Times New Roman', android: 'serif', default: 'serif' });
  const sansFamily = Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' });

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.appBackground,
    },
    container: {
      flex: 1,
      backgroundColor: colors.screen,
    },
    scrollContent: {
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.xl,
      paddingBottom: spacing.xxl,
      gap: spacing.xl,
    },
    sectionHeader: {
      gap: spacing.xs,
    },
    sectionLabel: {
      fontFamily: sansFamily,
      color: colors.textSecondary,
      fontSize: typography.helper.fontSize,
      lineHeight: typography.helper.lineHeight,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    heroCard: {
      borderRadius: 16,
      overflow: 'hidden',
      backgroundColor: colors.heroBackground,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSubtle,
      shadowColor: colors.shadowColor,
      shadowOpacity: 0.12,
      shadowRadius: 32,
      shadowOffset: { width: 0, height: 16 },
      elevation: 8,
    },
    heroMedia: {
      height: 240,
      position: 'relative',
    },
    heroImage: {
      width: '100%',
      height: '100%',
    },
    vignette: {
      ...StyleSheet.absoluteFillObject,
    },
    heroBody: {
      paddingHorizontal: spacing.card,
      paddingVertical: spacing.lg,
      gap: spacing.sm,
    },
    yearPill: {
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.accentPrimary,
      color: colors.accentPrimary,
      fontFamily: sansFamily,
      fontSize: 12,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    heroTitle: {
      fontFamily: serifFamily,
      fontSize: 30,
      lineHeight: 36,
      letterSpacing: -0.3,
      color: colors.textPrimary,
    },
    heroSummary: {
      fontFamily: sansFamily,
      fontSize: typography.body.fontSize,
      lineHeight: typography.body.lineHeight,
      color: colors.textSecondary,
      maxWidth: 320,
    },
    heroMeta: {
      fontFamily: sansFamily,
      fontSize: typography.helper.fontSize,
      lineHeight: typography.helper.lineHeight,
      color: colors.textTertiary,
    },
    actionsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.md,
    },
    primaryAction: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      borderRadius: radius.pill,
      backgroundColor: colors.accentPrimary,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.18,
      shadowRadius: 18,
      elevation: 4,
    },
    primaryPressed: {
      opacity: 0.9,
    },
    primaryLabel: {
      fontFamily: sansFamily,
      fontSize: 15,
      fontWeight: '600',
      letterSpacing: 0.3,
      color: colors.surface,
    },
    secondaryAction: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      backgroundColor: 'transparent',
    },
    secondaryPressed: {
      opacity: 0.85,
    },
    secondaryLabel: {
      fontFamily: sansFamily,
      fontSize: 15,
      fontWeight: '500',
      letterSpacing: 0.3,
      color: colors.textPrimary,
    },
    engagementSurface: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginTop: spacing.lg,
    },
    reactionGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    reactionChip: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      minWidth: 56,
    },
    reactionChipActive: {
      borderColor: colors.accentPrimary,
      backgroundColor: colors.accentSoft,
    },
    reactionLabel: {
      fontFamily: sansFamily,
      fontSize: typography.helper.fontSize,
      color: colors.textSecondary,
    },
    reactionLabelActive: {
      color: colors.accentPrimary,
      fontWeight: '600',
    },
    actionIconButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      minWidth: 56,
    },
    actionIconLabel: {
      fontFamily: sansFamily,
      fontSize: typography.helper.fontSize,
      color: colors.textSecondary,
    },
    sectionHelper: {
      fontFamily: sansFamily,
      fontSize: typography.helper.fontSize,
      color: colors.textSecondary,
    },
  });
};

const selectPreferredDigestEvent = (
  events: FirestoreEventDocument[],
  preferredCategories: string[] | undefined,
  preferredEras: string[] | undefined
): FirestoreEventDocument | null => {
  if (events.length === 0) {
    return null;
  }

  const categoryMatches =
    preferredCategories && preferredCategories.length > 0
      ? events.filter((event) => {
          const categories = event.categories ?? [];
          return categories.some((category) => preferredCategories.includes(category));
        })
      : events;

  const eraMatches =
    preferredEras && preferredEras.length > 0
      ? categoryMatches.filter((event) => event.era && preferredEras.includes(event.era))
      : categoryMatches;

  return eraMatches[0] ?? categoryMatches[0] ?? events[0] ?? null;
};

const HomeScreen = () => {
  const router = useRouter();
  const { profile } = useUserContext();
  const theme = useAppTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const today = useMemo(() => getDateParts(new Date(), { timeZone: profile?.timezone }), [profile?.timezone]);
  const {
    events: digestEvents,
    loading: digestLoading,
    error: digestError,
  } = useDailyDigestEvents({ month: today.month, day: today.day, year: today.year });
  const preferredEvent = useMemo(
    () => selectPreferredDigestEvent(digestEvents, profile?.categories, profile?.eras),
    [digestEvents, profile?.categories, profile?.eras]
  );
  const heroIdentifier = preferredEvent?.eventId ?? heroEvent.id;
  const { isSaved, reaction, toggleReaction, toggleSave } = useEventEngagement(heroIdentifier);
  const heroGradient = useMemo(
    () =>
      createLinearGradientSource(
        [
          { offset: 0, color: 'rgba(12, 10, 6, 0.1)' },
          { offset: 100, color: 'rgba(12, 10, 6, 0.55)' },
        ],
        { x1: 0.5, y1: 0, x2: 0.5, y2: 1 }
      ),
    []
  );
  const staticHeroImageUri = useMemo(() => getImageUri(heroEvent.image), []);
  const dynamicHeroImageUri = preferredEvent ? getEventImageUri(preferredEvent) : undefined;
  const heroImageSource = dynamicHeroImageUri ? { uri: dynamicHeroImageUri } : heroEvent.image;
  const heroImageUri = dynamicHeroImageUri ?? staticHeroImageUri;
  const heroYear = preferredEvent ? getEventYearLabel(preferredEvent) : heroEvent.year;
  const heroTitle = preferredEvent ? getEventTitle(preferredEvent) : heroEvent.title;
  const heroSummary = preferredEvent ? getEventSummary(preferredEvent) : heroEvent.summary;
  const heroLocation = preferredEvent ? getEventLocation(preferredEvent) : heroEvent.location;
  const heroMeta = preferredEvent
    ? heroLocation || getEventMeta(preferredEvent)
    : digestLoading
      ? "Loading today's story…"
      : heroEvent.location;
  const shareTitle = heroTitle;
  const shareSummary = heroSummary;
  const statusMessage = digestLoading
    ? "Curating today's picks…"
    : digestError
      ? 'Showing a highlight while we refresh new stories.'
      : undefined;

  useEffect(() => {
    if (digestError) {
      console.error('Failed to load daily digest events', digestError);
    }
  }, [digestError]);

  const handleHeroImageLoad = useCallback(
    (event: ImageLoadEventData) => {
      console.log('[Home] hero image loaded', {
        uri: heroImageUri,
        resolvedUrl: event.source?.url,
        cacheType: event.cacheType,
        width: event.source?.width,
        height: event.source?.height,
      });
    },
    [heroImageUri]
  );

  const handleHeroImageError = useCallback(
    (event: ImageErrorEventData) => {
      console.warn('[Home] hero image failed to load', {
        uri: heroImageUri,
        error: event.error,
      });
    },
    [heroImageUri]
  );

  const handleOpenDetail = () => {
    router.push({ pathname: '/event/[id]', params: { id: heroIdentifier } });
  };

  const handleShare = async () => {
    try {
      await Share.share({
        title: shareTitle,
        message: `${shareTitle} — ${shareSummary}`,
      });
    } catch (error) {
      console.error('Share failed', error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          bounces={false}
          alwaysBounceVertical={false}
          overScrollMode="never"
          showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>Today’s Moment</Text>
          {statusMessage ? <Text style={styles.sectionHelper}>{statusMessage}</Text> : null}
        </View>

          <Pressable accessibilityRole="button" onPress={handleOpenDetail} style={styles.heroCard}>
            <View pointerEvents="none" style={styles.heroMedia}>
              <Image
                source={heroImageSource}
                style={styles.heroImage}
                contentFit="cover"
                transition={180}
                onLoad={handleHeroImageLoad}
                onError={handleHeroImageError}
              />
              <Image
                pointerEvents="none"
                source={heroGradient}
                style={styles.vignette}
                contentFit="cover"
              />
            </View>

            <View style={styles.heroBody}>
              <Text style={styles.yearPill}>{heroYear}</Text>
              <Text style={styles.heroTitle}>{heroTitle}</Text>
              <Text style={styles.heroSummary}>{heroSummary}</Text>
              <Text style={styles.heroMeta}>{heroMeta}</Text>

              <View style={styles.actionsRow}>
                <Pressable
                  accessibilityRole="button"
                  onPress={handleOpenDetail}
                  style={({ pressed }) => [styles.primaryAction, pressed && styles.primaryPressed]}
                >
                  <Text style={styles.primaryLabel}>Continue</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={handleOpenDetail}
                  style={({ pressed }) => [styles.secondaryAction, pressed && styles.secondaryPressed]}
                >
                  <Text style={styles.secondaryLabel}>Preview</Text>
                </Pressable>
              </View>

              <View style={styles.engagementSurface}>
                <View style={styles.reactionGroup}>
                  {reactions.map((item) => {
                    const isActive = reaction === item.id;
                    return (
                      <Pressable
                        key={item.id}
                        accessibilityRole="button"
                        accessibilityState={{ selected: isActive }}
                        onPress={() => toggleReaction(item.id)}
                        style={({ pressed }) => [
                          styles.reactionChip,
                          isActive && styles.reactionChipActive,
                          pressed && { opacity: 0.85 },
                        ]}
                      >
                        <Text accessibilityLabel={`${item.label} reaction`}>{item.emoji}</Text>
                        <Text
                          style={[styles.reactionLabel, isActive && styles.reactionLabelActive]}
                        >
                          {item.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={styles.reactionGroup}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSaved }}
                    onPress={toggleSave}
                    style={({ pressed }) => [
                      styles.actionIconButton,
                      isSaved && styles.reactionChipActive,
                      pressed && { opacity: 0.85 },
                    ]}
                  >
                    <IconSymbol
                      name={isSaved ? 'bookmark.fill' : 'bookmark'}
                      size={20}
                      color={isSaved ? theme.colors.accentPrimary : theme.colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.actionIconLabel,
                        isSaved && styles.reactionLabelActive,
                      ]}
                    >
                      Save
                    </Text>
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    onPress={handleShare}
                    style={({ pressed }) => [styles.actionIconButton, pressed && { opacity: 0.85 }]}
                  >
                    <IconSymbol name="square.and.arrow.up" size={20} color={theme.colors.textSecondary} />
                    <Text style={styles.actionIconLabel}>Share</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </Pressable>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default HomeScreen;
