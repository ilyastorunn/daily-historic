import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { Image, type ImageErrorEventData, type ImageLoadEventData, type ImageSource } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { heroEvent } from '@/constants/events';
import { PeekCarousel } from '@/components/ui/peek-carousel';
import { useDailyDigestEvents } from '@/hooks/use-daily-digest-events';
import { useEventEngagement, type ReactionType } from '@/hooks/use-event-engagement';
import { useUserContext } from '@/contexts/user-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAppTheme, type ThemeDefinition } from '@/theme';
import type { FirestoreEventDocument } from '@/types/events';
import { trackEvent } from '@/services/analytics';
import { WeeklyCollectionsGrid } from '@/components/home/WeeklyCollectionsGrid';
import { CategoryChipRail } from '@/components/home/CategoryChipRail';
import { useWeeklyCollections } from '@/hooks/use-weekly-collections';
import { useHomeChips } from '@/hooks/use-home-chips';
import { getDateParts, getIsoWeekKey } from '@/utils/dates';
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
import { TimeMachineBlock } from '@/components/home/TimeMachineBlock';
import { useTimeMachine } from '@/hooks/use-time-machine';

const reactions: { id: ReactionType; emoji: string; label: string }[] = [
  { id: 'appreciate', emoji: '👍', label: 'Appreciate' },
  { id: 'insight', emoji: '💡', label: 'Insight' },
];

type HeroCarouselItem = {
  id: string;
  title: string;
  summary: string;
  meta: string;
  yearLabel: string;
  imageSource: ImageSource;
  imageUri?: string;
  event?: FirestoreEventDocument;
  isFallback?: boolean;
  categories?: string[];
};

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
      paddingBottom: spacing.md, // Reduced to minimize gap above tab bar
      gap: spacing.xl,
    },
    sectionHeader: {
      gap: spacing.xs,
    },
    heroCarouselContainer: {
      gap: spacing.sm,
    },
    moduleSpacing: {
      marginTop: spacing.xl,
    },
    bottomSpacer: {
      height: spacing.xxl + spacing.lg,
    },
    relatedStrip: {
      marginTop: spacing.md,
      gap: spacing.sm,
    },
    relatedHeading: {
      fontFamily: serifFamily,
      fontSize: typography.helper.fontSize,
      color: colors.textSecondary,
      letterSpacing: 0.3,
    },
    relatedList: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    relatedCard: {
      width: 180,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSubtle,
      overflow: 'hidden',
    },
    relatedImage: {
      width: '100%',
      height: 120,
      backgroundColor: colors.surfaceSubtle,
    },
    relatedCardBody: {
      padding: spacing.md,
      gap: spacing.xs,
    },
    relatedTitle: {
      fontFamily: serifFamily,
      fontSize: typography.helper.fontSize + 1,
      color: colors.textPrimary,
    },
    relatedMeta: {
      fontFamily: sansFamily,
      fontSize: typography.helper.fontSize,
      color: colors.textSecondary,
    },
    sectionLabel: {
      fontFamily: sansFamily,
      color: colors.textSecondary,
      fontSize: typography.helper.fontSize,
      lineHeight: typography.helper.lineHeight,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    carouselIndicator: {
      alignSelf: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radius.pill,
      backgroundColor: colors.surfaceSubtle,
    },
    carouselIndicatorText: {
      fontFamily: sansFamily,
      fontSize: typography.helper.fontSize,
      color: colors.textSecondary,
      letterSpacing: 0.3,
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
    heroSkeleton: {
      backgroundColor: colors.surfaceSubtle,
      opacity: 0.65,
    },
    skeletonImageArea: {
      height: 240,
      backgroundColor: colors.surfaceSubtle,
    },
    skeletonBody: {
      paddingHorizontal: spacing.card,
      paddingVertical: spacing.lg,
      gap: spacing.sm,
    },
    skeletonPill: {
      width: 80,
      height: 24,
      borderRadius: radius.pill,
      backgroundColor: colors.surfaceSubtle,
    },
    skeletonTitle: {
      width: '85%',
      height: 36,
      borderRadius: radius.sm,
      backgroundColor: colors.surfaceSubtle,
    },
    skeletonSummary: {
      width: '100%',
      height: 60,
      borderRadius: radius.sm,
      backgroundColor: colors.surfaceSubtle,
      marginTop: spacing.xs,
    },
    skeletonMeta: {
      width: '50%',
      height: 16,
      borderRadius: radius.sm,
      backgroundColor: colors.surfaceSubtle,
    },
    skeletonActions: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.md,
    },
    skeletonButton: {
      flex: 1,
      height: 48,
      borderRadius: radius.pill,
      backgroundColor: colors.surfaceSubtle,
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

type HeroCarouselCta = 'continue' | 'preview';

type HeroCarouselCardProps = {
  item: HeroCarouselItem;
  index: number;
  styles: ReturnType<typeof buildStyles>;
  theme: ThemeDefinition;
  heroGradient: ImageSource;
  onOpen: (eventId: string) => void;
  onCardOpened: (eventId: string, index: number) => void;
  onCtaPress: (eventId: string, index: number, cta: HeroCarouselCta) => void;
  onShare?: (eventId: string, index: number) => void;
  isSkeleton?: boolean;
};

const HeroCarouselCard = React.memo(
  ({ item, index, styles, theme, heroGradient, onOpen, onCardOpened, onCtaPress, onShare, isSkeleton }: HeroCarouselCardProps) => {
  const { isSaved, reaction, toggleReaction, toggleSave } = useEventEngagement(item.id);

  const handleOpenDetail = useCallback(() => {
    onCardOpened(item.id, index);
    onOpen(item.id);
  }, [index, item.id, onCardOpened, onOpen]);

  const handlePrimaryPress = useCallback(() => {
    onCtaPress(item.id, index, 'continue');
    onOpen(item.id);
  }, [index, item.id, onCtaPress, onOpen]);

  const handleSecondaryPress = useCallback(() => {
    onCtaPress(item.id, index, 'preview');
    onOpen(item.id);
  }, [index, item.id, onCtaPress, onOpen]);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        title: item.title,
        message: `${item.title} — ${item.summary}`,
      });
      onShare?.(item.id, index);
    } catch (error) {
      console.error('Share failed', error);
    }
  }, [index, item.id, item.summary, item.title, onShare]);

  const handleHeroImageLoad = useCallback(
    (event: ImageLoadEventData) => {
      console.log('[Home] hero image loaded', {
        id: item.id,
        uri: item.imageUri,
        resolvedUrl: event.source?.url,
        cacheType: event.cacheType,
        width: event.source?.width,
        height: event.source?.height,
      });
    },
    [item.id, item.imageUri]
  );

  const handleHeroImageError = useCallback(
    (event: ImageErrorEventData) => {
      console.warn('[Home] hero image failed to load', {
        id: item.id,
        uri: item.imageUri,
        error: event.error,
      });
    },
    [item.id, item.imageUri]
  );

  // Skeleton state
  if (isSkeleton) {
    return (
      <View style={[styles.heroCard, styles.heroSkeleton]} pointerEvents="none">
        <View style={styles.skeletonImageArea} />
        <View style={styles.skeletonBody}>
          <View style={styles.skeletonPill} />
          <View style={styles.skeletonTitle} />
          <View style={styles.skeletonSummary} />
          <View style={styles.skeletonMeta} />
          <View style={styles.skeletonActions}>
            <View style={styles.skeletonButton} />
            <View style={styles.skeletonButton} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <Pressable accessibilityRole="button" onPress={handleOpenDetail} style={styles.heroCard}>
      <View pointerEvents="none" style={styles.heroMedia}>
        <Image
          source={item.imageSource}
          style={styles.heroImage}
          contentFit="cover"
          transition={180}
          onLoad={handleHeroImageLoad}
          onError={handleHeroImageError}
        />
        <Image pointerEvents="none" source={heroGradient} style={styles.vignette} contentFit="cover" />
      </View>

      <View style={styles.heroBody}>
        <Text style={styles.yearPill}>{item.yearLabel}</Text>
        <Text style={styles.heroTitle}>{item.title}</Text>
        <Text style={styles.heroSummary}>{item.summary}</Text>
        {item.meta ? <Text style={styles.heroMeta}>{item.meta}</Text> : null}

        <View style={styles.actionsRow}>
          <Pressable accessibilityRole="button" onPress={handlePrimaryPress} style={({ pressed }) => [styles.primaryAction, pressed && styles.primaryPressed]}>
            <Text style={styles.primaryLabel}>Continue</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={handleSecondaryPress}
            style={({ pressed }) => [styles.secondaryAction, pressed && styles.secondaryPressed]}
          >
            <Text style={styles.secondaryLabel}>Preview</Text>
          </Pressable>
        </View>

        <View style={styles.engagementSurface}>
          <View style={styles.reactionGroup}>
            {reactions.map((reactionOption) => {
              const isActive = reaction === reactionOption.id;
              return (
                <Pressable
                  key={reactionOption.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                  onPress={() => toggleReaction(reactionOption.id)}
                  style={({ pressed }) => [
                    styles.reactionChip,
                    isActive && styles.reactionChipActive,
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <Text accessibilityLabel={`${reactionOption.label} reaction`}>{reactionOption.emoji}</Text>
                  <Text style={[styles.reactionLabel, isActive && styles.reactionLabelActive]}>
                    {reactionOption.label}
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
              <Text style={[styles.actionIconLabel, isSaved && styles.reactionLabelActive]}>Save</Text>
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
  );
  }
);

HeroCarouselCard.displayName = 'HeroCarouselCard';

const HomeScreen = () => {
  const router = useRouter();
  const { profile } = useUserContext();
  const theme = useAppTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const today = useMemo(() => getDateParts(new Date(), { timeZone: profile?.timezone }), [profile?.timezone]);
  const { events: digestEvents, loading: digestLoading, error: digestError } = useDailyDigestEvents({
    month: today.month,
    day: today.day,
    year: today.year,
  });

  const preferredEvent = useMemo(
    () => selectPreferredDigestEvent(digestEvents, profile?.categories, profile?.eras),
    [digestEvents, profile?.categories, profile?.eras]
  );

  const defaultHeroItem = useMemo<HeroCarouselItem>(
    () => ({
      id: heroEvent.id,
      title: heroEvent.title,
      summary: heroEvent.summary,
      meta: heroEvent.location,
      yearLabel: heroEvent.year,
      imageSource: heroEvent.image,
      imageUri: getImageUri(heroEvent.image),
      isFallback: true,
      categories: heroEvent.categories ?? [],
    }),
    []
  );

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

  const isoWeekKey = useMemo(() => {
    const referenceDate = today.isoDate ? new Date(`${today.isoDate}T00:00:00Z`) : new Date();
    return getIsoWeekKey(referenceDate, { timeZone: profile?.timezone });
  }, [profile?.timezone, today.isoDate]);

  const {
    items: weeklyCollectionItems,
    loading: weeklyCollectionsLoading,
    error: weeklyCollectionsError,
  } = useWeeklyCollections({ weekKey: isoWeekKey, limit: 4 });

  useEffect(() => {
    if (weeklyCollectionsError) {
      console.error('Failed to load weekly collections', weeklyCollectionsError);
    }
  }, [weeklyCollectionsError]);

  const {
    chips: homeChips,
    loading: homeChipsLoading,
    setPinned: setChipPinned,
  } = useHomeChips();

  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const [heroCarouselWidth, setHeroCarouselWidth] = useState<number | null>(null);
  const lastViewedHeroIdRef = useRef<string | null>(null);
  const [selectedChipId, setSelectedChipId] = useState<string | null>(null);

  const isPremiumUser = useMemo(() => {
    const inferredProfile = profile as { isPremium?: boolean } | null;
    return Boolean(inferredProfile?.isPremium);
  }, [profile]);

  useEffect(() => {
    if (selectedChipId) {
      return;
    }
    const defaultPinned = homeChips.find((chip) => chip.pinned);
    if (defaultPinned) {
      setSelectedChipId(defaultPinned.id);
    }
  }, [homeChips, selectedChipId]);

  const {
    loading: timeMachineLoading,
    seedLoading: timeMachineSeeding,
    timelineYear: timeMachineYear,
    heroImageUrl: timeMachineImageUrl,
    loadTimeline: loadTimeMachineTimeline,
  } = useTimeMachine({ enabled: true, seedOnMount: true, premium: isPremiumUser });

  const weeklyCollections = useMemo(
    () =>
      weeklyCollectionItems.map((collection) => ({
        id: collection.id,
        title: collection.title,
        coverUrl: collection.coverUrl || defaultHeroItem.imageUri || '',
      })),
    [defaultHeroItem.imageUri, weeklyCollectionItems]
  );

  const heroCarouselItems = useMemo(() => {
    const items: HeroCarouselItem[] = [];
    const seen = new Set<string>();

    const pushEvent = (event?: FirestoreEventDocument | null) => {
      if (!event || !event.eventId || seen.has(event.eventId)) {
        return;
      }
      seen.add(event.eventId);

      const title = getEventTitle(event);
      const summary = getEventSummary(event);
      const location = getEventLocation(event);
      const meta = location || getEventMeta(event) || defaultHeroItem.meta;
      const yearLabel = getEventYearLabel(event, defaultHeroItem.yearLabel);
      const imageUri = getEventImageUri(event);
      const categories = Array.isArray(event.categories) ? event.categories : [];

      items.push({
        id: event.eventId,
        title,
        summary,
        meta,
        yearLabel,
        imageSource: imageUri ? { uri: imageUri } : defaultHeroItem.imageSource,
        imageUri: imageUri ?? defaultHeroItem.imageUri,
        event,
        categories,
      });
    };

    pushEvent(preferredEvent);
    digestEvents.forEach((event) => pushEvent(event));

    if (items.length === 0) {
      items.push(defaultHeroItem);
    }

    return items.slice(0, 5);
  }, [defaultHeroItem, digestEvents, preferredEvent]);

  const skeletonHeroItems = useMemo<HeroCarouselItem[]>(() => {
    return Array.from({ length: 2 }, (_, index) => ({
      id: `hero-skeleton-${index}`,
      title: '',
      summary: '',
      meta: '',
      yearLabel: '',
      imageSource: { uri: '' },
      isFallback: true,
      categories: [],
    }));
  }, []);

  const filteredHeroItems = useMemo(() => {
    if (!selectedChipId) {
      return heroCarouselItems;
    }
    const filtered = heroCarouselItems.filter((item) => item.categories?.includes(selectedChipId));
    return filtered.length > 0 ? filtered : heroCarouselItems;
  }, [heroCarouselItems, selectedChipId]);

  const displayHeroItems = digestLoading ? skeletonHeroItems : filteredHeroItems;

  const relatedNowItems = useMemo(() => {
    if (!selectedChipId) {
      return [] as HeroCarouselItem[];
    }
    const current = filteredHeroItems[activeHeroIndex];
    return filteredHeroItems
      .filter((item) => item.id !== current?.id)
      .slice(0, 3);
  }, [activeHeroIndex, filteredHeroItems, selectedChipId]);

  const fallbackHeroWidth = useMemo(() => {
    const screenWidth = Dimensions.get('window').width;
    const horizontalPadding = theme.spacing.xl * 2;
    return Math.max(screenWidth - horizontalPadding, 320);
  }, [theme.spacing.xl]);

  const computedHeroWidth = heroCarouselWidth ?? fallbackHeroWidth;

  const handleHeroCarouselLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const width = event.nativeEvent.layout.width;
      if (width > 0 && Math.abs(width - (heroCarouselWidth ?? 0)) > 1) {
        setHeroCarouselWidth(width);
      }
    },
    [heroCarouselWidth]
  );

  const handleHeroIndexChange = useCallback((index: number) => {
    setActiveHeroIndex(index);
  }, []);

  useEffect(() => {
    if (activeHeroIndex >= filteredHeroItems.length) {
      setActiveHeroIndex(0);
    }
  }, [activeHeroIndex, filteredHeroItems.length]);

  useEffect(() => {
    const currentItem = filteredHeroItems[activeHeroIndex];
    if (currentItem && lastViewedHeroIdRef.current !== currentItem.id) {
      trackEvent('hero_card_viewed', { card_id: currentItem.id, index: activeHeroIndex });
      lastViewedHeroIdRef.current = currentItem.id;
    }
  }, [activeHeroIndex, filteredHeroItems]);

  useEffect(() => {
    setActiveHeroIndex(0);
  }, [selectedChipId]);

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

  const handleOpenEvent = useCallback(
    (eventId: string) => {
      router.push({ pathname: '/event/[id]', params: { id: eventId } });
    },
    [router]
  );

  const handleOpenCollection = useCallback(
    (collectionId: string, index: number) => {
      trackEvent('collections_tile_opened', { collection_id: collectionId, index, week_key: isoWeekKey });
      router.push({ pathname: '/collection/[id]', params: { id: collectionId } });
    },
    [isoWeekKey, router]
  );

  const handleSeeAllCollections = useCallback(() => {
    trackEvent('collections_see_all_clicked', { week_key: isoWeekKey });
    router.push('/explore');
  }, [isoWeekKey, router]);

  const timeMachineImage = useMemo(
    () => timeMachineImageUrl ?? defaultHeroItem.imageUri ?? getImageUri(heroEvent.image) ?? '',
    [defaultHeroItem.imageUri, timeMachineImageUrl]
  );

  const handleTimeMachineTeaser = useCallback(() => {
    trackEvent('time_machine_paywall_shown', { source: 'teaser' });
    router.push({ pathname: '/time-machine', params: { mode: 'teaser' } });
  }, [router]);

  const handleTimeMachinePress = useCallback(async () => {
    const userTier = isPremiumUser ? 'premium' : 'free';
    trackEvent('time_machine_open_clicked', { user_tier: userTier });
    if (!isPremiumUser) {
      handleTimeMachineTeaser();
      return;
    }
    await loadTimeMachineTimeline();
    trackEvent('time_machine_started', { year: timeMachineYear ?? undefined, user_tier: userTier });
    router.push({ pathname: '/time-machine', params: { year: timeMachineYear ? String(timeMachineYear) : undefined } });
  }, [handleTimeMachineTeaser, isPremiumUser, loadTimeMachineTimeline, router, timeMachineYear]);

  const handleChipSelect = useCallback((chipId: string) => {
    setSelectedChipId((previous) => {
      const nextValue = previous === chipId ? null : chipId;
      trackEvent('chip_selected', { chip_id: nextValue ?? 'all' });
      return nextValue;
    });
  }, []);

  const handleChipPin = useCallback(
    (chipId: string, pinned: boolean) => {
      setChipPinned(chipId, pinned);
      if (pinned) {
        setSelectedChipId(chipId);
      }
      trackEvent('chip_pinned', { chip_id: chipId, pinned });
    },
    [setChipPinned]
  );

  const handleHeroCardOpened = useCallback((eventId: string, index: number) => {
    trackEvent('hero_card_opened', { card_id: eventId, index });
  }, []);

  const handleHeroCtaPress = useCallback((eventId: string, index: number, cta: HeroCarouselCta) => {
    trackEvent('hero_cta_clicked', { card_id: eventId, index, cta });
  }, []);

  const handleHeroShare = useCallback((eventId: string, index: number) => {
    trackEvent('hero_share_clicked', { card_id: eventId, index });
  }, []);

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

          <View style={styles.heroCarouselContainer} onLayout={handleHeroCarouselLayout}>
            <PeekCarousel
              data={displayHeroItems}
              keyExtractor={(item) => item.id}
              onIndexChange={handleHeroIndexChange}
              itemWidth={computedHeroWidth}
              gap={0}
              renderItem={({ item, index }) => (
                <HeroCarouselCard
                  item={item}
                  index={index}
                  styles={styles}
                  theme={theme}
                  heroGradient={heroGradient}
                  onOpen={handleOpenEvent}
                  onCardOpened={handleHeroCardOpened}
                  onCtaPress={handleHeroCtaPress}
                  onShare={handleHeroShare}
                  isSkeleton={digestLoading}
                />
              )}
              testID="home-hero-carousel"
            />
            {!digestLoading && displayHeroItems.length > 1 ? (
              <View style={styles.carouselIndicator}>
                <Text style={styles.carouselIndicatorText}>
                  {activeHeroIndex + 1}/{displayHeroItems.length}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.moduleSpacing}>
            <WeeklyCollectionsGrid
              items={weeklyCollections}
              loading={weeklyCollectionsLoading}
              onOpen={handleOpenCollection}
              onSeeAll={handleSeeAllCollections}
              testID="home-weekly-collections"
            />
          </View>

          <View style={styles.moduleSpacing}>
            <TimeMachineBlock
              premium={isPremiumUser}
              imageUrl={timeMachineImage}
              subtitle="Guided timeline journeys."
              onPress={handleTimeMachinePress}
              onTeaser={handleTimeMachineTeaser}
              loading={timeMachineLoading || timeMachineSeeding}
              testID="home-time-machine"
            />
          </View>

          <View style={styles.moduleSpacing}>
            <CategoryChipRail
              chips={homeChips}
              selectedId={selectedChipId}
              loading={homeChipsLoading}
              onSelect={handleChipSelect}
              onPin={handleChipPin}
              testID="home-category-chips"
            />
            {selectedChipId && relatedNowItems.length > 0 ? (
              <View style={styles.relatedStrip}>
                <Text style={styles.relatedHeading}>Related now</Text>
                <View style={styles.relatedList}>
                  {relatedNowItems.map((item) => (
                    <Pressable
                      key={item.id}
                      accessibilityRole="button"
                      onPress={() => handleOpenEvent(item.id)}
                      style={styles.relatedCard}
                    >
                      <Image
                        source={item.imageUri ? { uri: item.imageUri } : heroEvent.image}
                        style={styles.relatedImage}
                        contentFit="cover"
                      />
                      <View style={styles.relatedCardBody}>
                        <Text style={styles.relatedTitle} numberOfLines={2}>
                          {item.title}
                        </Text>
                        {item.meta ? (
                          <Text style={styles.relatedMeta} numberOfLines={1}>
                            {item.meta}
                          </Text>
                        ) : null}
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}
          </View>

          <View style={styles.bottomSpacer} />

        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default HomeScreen;
