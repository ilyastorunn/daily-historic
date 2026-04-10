import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { heroEvent } from '@/constants/events';
import { formatCategoryLabel, formatEraLabel } from '@/constants/personalization';
import { useEventEngagement } from '@/hooks/use-event-engagement';
import { useSavedEvents } from '@/hooks/use-saved-events';
import { trackEvent } from '@/services/analytics';
import { useAppTheme, type ThemeDefinition } from '@/theme';
import type { FirestoreEventDocument } from '@/types/events';
import {
  getEventImageSource,
  getEventLocation,
  getEventSummary,
  getEventTitle,
  getEventYearLabel,
} from '@/utils/event-presentation';
import { toImageSource } from '@/utils/wikimedia-image-source';

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
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xl,
      paddingBottom: spacing.xxl,
      gap: spacing.xl,
    },
    heroCard: {
      overflow: 'hidden',
      borderRadius: radius.xl,
      padding: spacing.xl,
      gap: spacing.lg,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      shadowColor: colors.shadowColor,
      shadowOpacity: 0.1,
      shadowRadius: 28,
      shadowOffset: { width: 0, height: 16 },
      elevation: 6,
    },
    heroOrbPrimary: {
      position: 'absolute',
      width: 184,
      height: 184,
      borderRadius: 999,
      top: -78,
      right: -42,
      backgroundColor: colors.accentSoft,
      opacity: 0.9,
    },
    heroOrbSecondary: {
      position: 'absolute',
      width: 128,
      height: 128,
      borderRadius: 999,
      bottom: -52,
      left: -36,
      backgroundColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(210, 198, 178, 0.28)',
    },
    heroBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      backgroundColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.7)',
    },
    heroBadgeText: {
      fontFamily: sansFamily,
      fontSize: typography.helper.fontSize,
      lineHeight: typography.helper.lineHeight,
      color: colors.accentPrimary,
      fontWeight: '600',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    heroHeader: {
      gap: spacing.sm,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    title: {
      flex: 1,
      fontFamily: serifFamily,
      fontSize: 38,
      lineHeight: 42,
      color: colors.textPrimary,
      letterSpacing: -0.8,
    },
    countPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      backgroundColor: colors.surfaceSubtle,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    countPillText: {
      fontFamily: sansFamily,
      fontSize: typography.helper.fontSize,
      lineHeight: typography.helper.lineHeight,
      color: colors.textPrimary,
      fontWeight: '600',
    },
    heroCopy: {
      fontFamily: sansFamily,
      fontSize: typography.body.fontSize,
      lineHeight: typography.body.lineHeight + 2,
      color: colors.textSecondary,
      maxWidth: 520,
    },
    statsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    statCard: {
      flex: 1,
      padding: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.55)',
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      gap: spacing.xs,
    },
    statValue: {
      fontFamily: serifFamily,
      fontSize: 28,
      lineHeight: 30,
      color: colors.textPrimary,
      letterSpacing: -0.4,
    },
    statLabel: {
      fontFamily: sansFamily,
      fontSize: 12,
      lineHeight: 16,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.45,
    },
    heroFootnote: {
      fontFamily: sansFamily,
      fontSize: typography.helper.fontSize,
      lineHeight: typography.helper.lineHeight,
      color: colors.textSecondary,
      maxWidth: 420,
    },
    leadCard: {
      overflow: 'hidden',
      borderRadius: radius.xl,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      shadowColor: colors.shadowColor,
      shadowOpacity: 0.12,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 14 },
      elevation: 5,
    },
    leadMediaWrap: {
      height: 240,
      backgroundColor: colors.surfaceSubtle,
    },
    leadImage: {
      width: '100%',
      height: '100%',
    },
    leadOverlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'space-between',
      padding: spacing.lg,
      backgroundColor: theme.mode === 'dark' ? 'rgba(8, 7, 5, 0.28)' : 'rgba(14, 12, 8, 0.18)',
    },
    mediaPill: {
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radius.pill,
      backgroundColor: 'rgba(247, 244, 238, 0.88)',
    },
    mediaPillText: {
      fontFamily: sansFamily,
      fontSize: 12,
      lineHeight: 16,
      color: colors.textPrimary,
      fontWeight: '600',
      letterSpacing: 0.35,
    },
    mediaCaption: {
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      backgroundColor: 'rgba(20, 17, 13, 0.58)',
    },
    mediaCaptionText: {
      fontFamily: sansFamily,
      fontSize: typography.helper.fontSize,
      lineHeight: typography.helper.lineHeight,
      color: colors.overlayText,
      opacity: 0.94,
    },
    leadBody: {
      padding: spacing.xl,
      gap: spacing.md,
    },
    leadEyebrow: {
      fontFamily: sansFamily,
      fontSize: 12,
      lineHeight: 16,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.45,
    },
    leadTitle: {
      fontFamily: serifFamily,
      fontSize: 31,
      lineHeight: 35,
      color: colors.textPrimary,
      letterSpacing: -0.6,
    },
    leadSummary: {
      fontFamily: sansFamily,
      fontSize: typography.body.fontSize,
      lineHeight: typography.body.lineHeight + 2,
      color: colors.textSecondary,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    metaChip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radius.pill,
      backgroundColor: colors.surfaceSubtle,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    metaChipText: {
      fontFamily: sansFamily,
      fontSize: typography.helper.fontSize,
      lineHeight: typography.helper.lineHeight,
      color: colors.textSecondary,
    },
    leadActions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      paddingTop: spacing.xs,
    },
    primaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderRadius: radius.pill,
      backgroundColor: colors.accentPrimary,
    },
    primaryButtonText: {
      fontFamily: sansFamily,
      fontSize: typography.body.fontSize,
      lineHeight: typography.body.lineHeight,
      color: colors.textInverse,
      fontWeight: '600',
    },
    ghostButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      backgroundColor: colors.surface,
    },
    ghostButtonText: {
      fontFamily: sansFamily,
      fontSize: typography.helper.fontSize,
      lineHeight: typography.helper.lineHeight,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    sectionHeader: {
      gap: spacing.xs,
    },
    sectionTitle: {
      fontFamily: serifFamily,
      fontSize: typography.headingMd.fontSize,
      lineHeight: typography.headingMd.lineHeight,
      color: colors.textPrimary,
      letterSpacing: -0.2,
    },
    sectionCopy: {
      fontFamily: sansFamily,
      fontSize: typography.helper.fontSize,
      lineHeight: typography.helper.lineHeight,
      color: colors.textSecondary,
      maxWidth: 420,
    },
    list: {
      gap: spacing.md,
    },
    archiveRow: {
      flexDirection: 'row',
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      shadowColor: colors.shadowColor,
      shadowOpacity: 0.08,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 10 },
      elevation: 3,
    },
    archiveImage: {
      width: 86,
      height: 106,
      borderRadius: radius.md,
      backgroundColor: colors.surfaceSubtle,
    },
    archiveBody: {
      flex: 1,
      gap: spacing.xs,
      justifyContent: 'space-between',
    },
    archiveMeta: {
      fontFamily: sansFamily,
      fontSize: 12,
      lineHeight: 16,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.45,
    },
    archiveTitle: {
      fontFamily: serifFamily,
      fontSize: 21,
      lineHeight: 24,
      color: colors.textPrimary,
      letterSpacing: -0.3,
    },
    archiveSummary: {
      fontFamily: sansFamily,
      fontSize: typography.helper.fontSize,
      lineHeight: typography.helper.lineHeight + 2,
      color: colors.textSecondary,
    },
    archiveActions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      paddingTop: spacing.xs,
    },
    iconButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      backgroundColor: colors.surfaceSubtle,
    },
    iconButtonActive: {
      backgroundColor: colors.accentSoft,
      borderColor: colors.accentMuted,
    },
    iconButtonText: {
      fontFamily: sansFamily,
      fontSize: 12,
      lineHeight: 16,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    iconButtonTextActive: {
      color: colors.accentPrimary,
    },
    archiveHint: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    archiveHintText: {
      fontFamily: sansFamily,
      fontSize: 12,
      lineHeight: 16,
      color: colors.textTertiary,
      flex: 1,
    },
    emptyState: {
      gap: spacing.md,
      padding: spacing.xl,
      borderRadius: radius.xl,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    emptyTitle: {
      fontFamily: serifFamily,
      fontSize: typography.headingLg.fontSize,
      lineHeight: typography.headingLg.lineHeight,
      color: colors.textPrimary,
    },
    emptyCopy: {
      fontFamily: sansFamily,
      fontSize: typography.body.fontSize,
      lineHeight: typography.body.lineHeight,
      color: colors.textSecondary,
    },
    emptyButton: {
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      backgroundColor: colors.accentSoft,
    },
    emptyButtonLabel: {
      fontFamily: sansFamily,
      fontSize: typography.body.fontSize,
      color: colors.accentPrimary,
      fontWeight: '600',
    },
    loadingState: {
      paddingVertical: spacing.xxl,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.md,
    },
    loadingText: {
      fontFamily: sansFamily,
      fontSize: typography.helper.fontSize,
      lineHeight: typography.helper.lineHeight,
      color: colors.textSecondary,
    },
    footerCallout: {
      gap: spacing.md,
      padding: spacing.xl,
      borderRadius: radius.xl,
      backgroundColor: colors.surfaceSubtle,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    footerTitle: {
      fontFamily: serifFamily,
      fontSize: typography.headingMd.fontSize,
      lineHeight: typography.headingMd.lineHeight,
      color: colors.textPrimary,
    },
    footerCopy: {
      fontFamily: sansFamily,
      fontSize: typography.body.fontSize,
      lineHeight: typography.body.lineHeight,
      color: colors.textSecondary,
    },
  });
};

const shareEvent = async (event: FirestoreEventDocument) => {
  try {
    const title = getEventTitle(event);
    await Share.share({
      title,
      message: title,
    });
  } catch (error) {
    console.error('Share failed', error);
  }
};

const trimSummary = (value: string, maxLength: number) => {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength - 1).trimEnd()}…`;
};

const buildMetaChips = (event: FirestoreEventDocument) => {
  const chips: string[] = [];

  if (event.era) {
    chips.push(formatEraLabel(event.era));
  }

  if (Array.isArray(event.categories)) {
    event.categories.slice(0, 2).forEach((category) => {
      chips.push(formatCategoryLabel(category));
    });
  }

  return chips;
};

const StatCard = ({
  label,
  value,
  styles,
}: {
  label: string;
  value: string;
  styles: ReturnType<typeof buildStyles>;
}) => {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
};

const LeadSavedStoryCard = ({
  event,
  onOpen,
  styles,
}: {
  event: FirestoreEventDocument;
  onOpen: () => void;
  styles: ReturnType<typeof buildStyles>;
}) => {
  const theme = useAppTheme();
  const { isSaved, toggleSave } = useEventEngagement(event.eventId);
  const imageSource = getEventImageSource(event) ?? toImageSource(heroEvent.image);
  const title = getEventTitle(event);
  const summary = trimSummary(getEventSummary(event), 180);
  const yearLabel = getEventYearLabel(event);
  const location = getEventLocation(event) || 'Saved for a return visit';
  const chips = buildMetaChips(event);

  return (
    <View style={styles.leadCard}>
      <Pressable accessibilityRole="button" onPress={onOpen} style={styles.leadMediaWrap}>
        <Image source={imageSource} style={styles.leadImage} contentFit="cover" transition={180} />
        <View pointerEvents="none" style={styles.leadOverlay}>
          <View style={styles.mediaPill}>
            <Text style={styles.mediaPillText}>{yearLabel}</Text>
          </View>
          <View style={styles.mediaCaption}>
            <Text style={styles.mediaCaptionText}>{location}</Text>
          </View>
        </View>
      </Pressable>

      <View style={styles.leadBody}>
        <Text style={styles.leadEyebrow}>Featured From Your Shelf</Text>
        <Text style={styles.leadTitle}>{title}</Text>
        <Text style={styles.leadSummary}>{summary}</Text>

        {chips.length > 0 ? (
          <View style={styles.chipRow}>
            {chips.map((chip) => (
              <View key={`${event.eventId}-${chip}`} style={styles.metaChip}>
                <Text style={styles.metaChipText}>{chip}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.leadActions}>
          <Pressable
            accessibilityRole="button"
            onPress={onOpen}
            style={({ pressed }) => [styles.primaryButton, pressed && { opacity: 0.9 }]}
          >
            <IconSymbol name="book.fill" size={16} color={theme.colors.textInverse} />
            <Text style={styles.primaryButtonText}>Read story</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => shareEvent(event)}
            style={({ pressed }) => [styles.ghostButton, pressed && { opacity: 0.88 }]}
          >
            <IconSymbol name="square.and.arrow.up" size={16} color={theme.colors.textSecondary} />
            <Text style={styles.ghostButtonText}>Share</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={toggleSave}
            style={({ pressed }) => [styles.ghostButton, pressed && { opacity: 0.88 }]}
          >
            <IconSymbol
              name="bookmark.fill"
              size={16}
              color={isSaved ? theme.colors.accentPrimary : theme.colors.textSecondary}
            />
            <Text
              style={[
                styles.ghostButtonText,
                isSaved && { color: theme.colors.accentPrimary },
              ]}
            >
              {isSaved ? 'Saved' : 'Save again'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const ArchiveStoryRow = ({
  event,
  onOpen,
  styles,
}: {
  event: FirestoreEventDocument;
  onOpen: () => void;
  styles: ReturnType<typeof buildStyles>;
}) => {
  const theme = useAppTheme();
  const { isSaved, toggleSave } = useEventEngagement(event.eventId);
  const imageSource = getEventImageSource(event) ?? toImageSource(heroEvent.image);
  const title = getEventTitle(event);
  const summary = trimSummary(getEventSummary(event), 104);
  const metaParts = [getEventYearLabel(event)];
  if (event.era) {
    metaParts.push(formatEraLabel(event.era));
  }
  if (Array.isArray(event.categories) && event.categories[0]) {
    metaParts.push(formatCategoryLabel(event.categories[0]));
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onOpen}
      style={({ pressed }) => [styles.archiveRow, pressed && { opacity: 0.96 }]}
    >
      <Image source={imageSource} style={styles.archiveImage} contentFit="cover" transition={140} />

      <View style={styles.archiveBody}>
        <View>
          <Text style={styles.archiveMeta}>{metaParts.join(' • ')}</Text>
          <Text style={styles.archiveTitle}>{title}</Text>
          <Text style={styles.archiveSummary}>{summary}</Text>
        </View>

        <View>
          <View style={styles.archiveActions}>
            <Pressable
              accessibilityRole="button"
              onPress={(pressEvent) => {
                pressEvent.stopPropagation();
                shareEvent(event);
              }}
              style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.86 }]}
            >
              <IconSymbol name="square.and.arrow.up" size={14} color={theme.colors.textSecondary} />
              <Text style={styles.iconButtonText}>Share</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={(pressEvent) => {
                pressEvent.stopPropagation();
                toggleSave();
              }}
              style={({ pressed }) => [
                styles.iconButton,
                isSaved && styles.iconButtonActive,
                pressed && { opacity: 0.86 },
              ]}
            >
              <IconSymbol
                name="bookmark.fill"
                size={14}
                color={isSaved ? theme.colors.accentPrimary : theme.colors.textSecondary}
              />
              <Text
                style={[
                  styles.iconButtonText,
                  isSaved && styles.iconButtonTextActive,
                ]}
              >
                {isSaved ? 'Saved' : 'Save'}
              </Text>
            </Pressable>
          </View>

          <View style={styles.archiveHint}>
            <Text style={styles.archiveHintText}>Tap anywhere on the card to reopen the full story.</Text>
            <IconSymbol name="chevron.right" size={14} color={theme.colors.textTertiary} />
          </View>
        </View>
      </View>
    </Pressable>
  );
};

export default function SavedStoriesScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const { savedEvents, loading, totalCount } = useSavedEvents();

  const handleOpenEvent = useCallback(
    (eventId: string) => {
      trackEvent('saved_stories_event_opened', { event_id: eventId });
      router.push({ pathname: '/event/[id]', params: { id: eventId, source: 'saved-stories' } });
    },
    [router]
  );

  const handleBrowseExplore = useCallback(() => {
    router.push('/explore');
  }, [router]);

  const featuredEvent = savedEvents[0] ?? null;
  const archiveEvents = featuredEvent ? savedEvents.slice(1) : [];
  const uniqueThemesCount = useMemo(() => {
    const themes = new Set<string>();
    savedEvents.forEach((event) => {
      (event.categories ?? []).forEach((category) => themes.add(category));
    });
    return themes.size;
  }, [savedEvents]);
  const uniqueErasCount = useMemo(() => {
    return new Set(savedEvents.map((event) => event.era).filter(Boolean)).size;
  }, [savedEvents]);
  const heroCopy =
    totalCount === 1
      ? 'One story is being kept close, ready whenever you want to step back into it.'
      : `${totalCount} stories are arranged here like a private reference shelf for moments worth revisiting.`;

  return (
    <>
      <Stack.Screen options={{ title: 'Saved Stories' }} />
      <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.heroCard}>
              <View pointerEvents="none" style={styles.heroOrbPrimary} />
              <View pointerEvents="none" style={styles.heroOrbSecondary} />

              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>Personal Archive</Text>
              </View>

              <View style={styles.heroHeader}>
                <View style={styles.titleRow}>
                  <Text style={styles.title}>Saved Stories</Text>
                  <View style={styles.countPill}>
                    <IconSymbol name="bookmark.fill" size={14} color={theme.colors.accentPrimary} />
                    <Text style={styles.countPillText}>
                      {totalCount} kept
                    </Text>
                  </View>
                </View>
                <Text style={styles.heroCopy}>{heroCopy}</Text>
              </View>

              <View style={styles.statsRow}>
                <StatCard label="Stories" value={String(totalCount)} styles={styles} />
                <StatCard label="Themes" value={String(uniqueThemesCount)} styles={styles} />
                <StatCard label="Eras" value={String(uniqueErasCount)} styles={styles} />
              </View>

              <Text style={styles.heroFootnote}>
                Open a story, share it, or remove it from the shelf without leaving this archive.
              </Text>
            </View>

            {loading ? (
              <View style={styles.loadingState}>
                <ActivityIndicator color={theme.colors.accentPrimary} />
                <Text style={styles.loadingText}>Reordering your saved shelf…</Text>
              </View>
            ) : totalCount === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>Nothing saved yet.</Text>
                <Text style={styles.emptyCopy}>
                  When a story feels worth revisiting, save it and it will land here as part of your archive.
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={handleBrowseExplore}
                  style={({ pressed }) => [styles.emptyButton, pressed && { opacity: 0.88 }]}
                >
                  <Text style={styles.emptyButtonLabel}>Browse stories</Text>
                </Pressable>
              </View>
            ) : (
              <>
                {featuredEvent ? (
                  <LeadSavedStoryCard
                    event={featuredEvent}
                    onOpen={() => handleOpenEvent(featuredEvent.eventId)}
                    styles={styles}
                  />
                ) : null}

                {archiveEvents.length > 0 ? (
                  <>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>Archive Shelf</Text>
                      <Text style={styles.sectionCopy}>
                        The rest of your saved stories stay close in a cleaner, faster-to-scan reading stack.
                      </Text>
                    </View>

                    <View style={styles.list}>
                      {archiveEvents.map((event) => (
                        <ArchiveStoryRow
                          key={event.eventId}
                          event={event}
                          onOpen={() => handleOpenEvent(event.eventId)}
                          styles={styles}
                        />
                      ))}
                    </View>
                  </>
                ) : null}
              </>
            )}

            <View style={styles.footerCallout}>
              <Text style={styles.footerTitle}>Keep the archive growing.</Text>
              <Text style={styles.footerCopy}>
                Explore new stories, save the ones that deserve another read, and this shelf will stay curated for you.
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={handleBrowseExplore}
                style={({ pressed }) => [styles.primaryButton, pressed && { opacity: 0.9 }]}
              >
                <IconSymbol name="sparkles" size={16} color={theme.colors.textInverse} />
                <Text style={styles.primaryButtonText}>Explore more stories</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </>
  );
}
