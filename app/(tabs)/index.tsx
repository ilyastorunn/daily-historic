import { Image, type ImageErrorEventData, type ImageLoadEventData, type ImageSource } from 'expo-image';
import { useRouter } from 'expo-router';
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
import { SafeAreaView } from 'react-native-safe-area-context';

import { SavedStories } from '@/components/explore/SavedStories';
import { CategoryExploreGrid } from '@/components/home/CategoryExploreGrid';
import { TimeMachineBlock } from '@/components/home/TimeMachineBlock';
import { WeeklyCollectionsGrid } from '@/components/home/WeeklyCollectionsGrid';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { PeekCarousel } from '@/components/ui/peek-carousel';
import { heroEvent } from '@/constants/events';
import { useUserContext } from '@/contexts/user-context';
import { useDailyDigestEvents } from '@/hooks/use-daily-digest-events';
import { useEventEngagement } from '@/hooks/use-event-engagement';
import { useTimeMachine } from '@/hooks/use-time-machine';
import { useWeeklyCollections } from '@/hooks/use-weekly-collections';
import { trackEvent } from '@/services/analytics';
import { fetchEventsByIds } from '@/services/content';
import { useAppTheme, type ThemeDefinition } from '@/theme';
import type { FirestoreEventDocument } from '@/types/events';
import { getDateParts, getIsoWeekKey } from '@/utils/dates';
import {
  getEventImageUri,
  getEventLocation,
  getEventMeta,
  getEventSummary,
  getEventTitle,
  getEventYearLabel,
} from '@/utils/event-presentation';
import { createLinearGradientSource } from '@/utils/gradient';
import { getImageUri } from '@/utils/image-source';

// Reactions removed - using Like + Deep Dive + Save + Share instead

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
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xl,
      paddingBottom: spacing.md, // Reduced to minimize gap above tab bar
      gap: spacing.xxl, // 40pt - Generous spacing for better breathability
    },
    sectionHeader: {
      gap: spacing.xs,
    },
    heroCarouselContainer: {
      gap: 0,
      marginTop: -28, // Reduce gap between header and carousel (40pt - 28pt = 12pt)
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
      height: 360,
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
    engagementRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: spacing.md,
      marginTop: spacing.lg,
    },
    engagementButton: {
      alignItems: 'center',
      justifyContent: 'center',
      width: 44,
      height: 44,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      backgroundColor: 'transparent',
    },
    engagementButtonActive: {
      borderColor: colors.accentPrimary,
      backgroundColor: colors.accentSoft,
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
  allItemIds: string[];
  styles: ReturnType<typeof buildStyles>;
  theme: ThemeDefinition;
  heroGradient: ImageSource;
  onOpen: (eventId: string, source?: string, carouselIndex?: number, carouselItemIds?: string[]) => void;
  onCardOpened: (eventId: string, index: number) => void;
  onCtaPress: (eventId: string, index: number, cta: HeroCarouselCta) => void;
  onShare?: (eventId: string, index: number) => void;
  isSkeleton?: boolean;
};

const HeroCarouselCard = React.memo(
  ({ item, index, allItemIds, styles, theme, heroGradient, onOpen, onCardOpened, onCtaPress, onShare, isSkeleton }: HeroCarouselCardProps) => {
  const { isSaved, isLiked, toggleSave, toggleLike } = useEventEngagement(item.id);

  const handleOpenDetail = useCallback(() => {
    onCardOpened(item.id, index);
    onOpen(item.id, 'home-carousel', index, allItemIds);
  }, [index, item.id, allItemIds, onCardOpened, onOpen]);

  const handleDeepDive = useCallback(() => {
    // TODO: Implement Deep Dive navigation after card redesign is complete
    console.log('[Deep Dive] Placeholder for event:', item.id);
  }, [item.id]);

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

        <View style={styles.engagementRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Like"
            accessibilityState={{ selected: isLiked }}
            onPress={toggleLike}
            style={({ pressed }) => [
              styles.engagementButton,
              isLiked && styles.engagementButtonActive,
              pressed && { opacity: 0.85 },
            ]}
          >
            <IconSymbol
              name={isLiked ? 'heart.fill' : 'heart'}
              size={22}
              color={isLiked ? theme.colors.accentPrimary : theme.colors.textSecondary}
            />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Deep Dive"
            onPress={handleDeepDive}
            style={({ pressed }) => [styles.engagementButton, pressed && { opacity: 0.85 }]}
          >
            <IconSymbol name="book" size={22} color={theme.colors.textSecondary} />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Save"
            accessibilityState={{ selected: isSaved }}
            onPress={toggleSave}
            style={({ pressed }) => [
              styles.engagementButton,
              isSaved && styles.engagementButtonActive,
              pressed && { opacity: 0.85 },
            ]}
          >
            <IconSymbol
              name={isSaved ? 'bookmark.fill' : 'bookmark'}
              size={22}
              color={isSaved ? theme.colors.accentPrimary : theme.colors.textSecondary}
            />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Share"
            onPress={handleShare}
            style={({ pressed }) => [styles.engagementButton, pressed && { opacity: 0.85 }]}
          >
            <IconSymbol name="square.and.arrow.up" size={22} color={theme.colors.textSecondary} />
          </Pressable>
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

  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const [heroCarouselWidth, setHeroCarouselWidth] = useState<number | null>(null);
  const lastViewedHeroIdRef = useRef<string | null>(null);

  const isPremiumUser = useMemo(() => {
    const inferredProfile = profile as { isPremium?: boolean } | null;
    return Boolean(inferredProfile?.isPremium);
  }, [profile]);

  // Saved events state
  const [savedEventsData, setSavedEventsData] = useState<FirestoreEventDocument[]>([]);
  const [savedEventsLoading, setSavedEventsLoading] = useState(false);

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

  const displayHeroItems = digestLoading ? skeletonHeroItems : heroCarouselItems;

  const fallbackHeroWidth = useMemo(() => {
    const screenWidth = Dimensions.get('window').width;
    const horizontalPadding = theme.spacing.lg * 2;
    return Math.max(screenWidth - horizontalPadding, 320);
  }, [theme.spacing.lg]);

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
    if (activeHeroIndex >= heroCarouselItems.length) {
      setActiveHeroIndex(0);
    }
  }, [activeHeroIndex, heroCarouselItems.length]);

  useEffect(() => {
    const currentItem = heroCarouselItems[activeHeroIndex];
    if (currentItem && lastViewedHeroIdRef.current !== currentItem.id) {
      trackEvent('hero_card_viewed', { card_id: currentItem.id, index: activeHeroIndex });
      lastViewedHeroIdRef.current = currentItem.id;
    }
  }, [activeHeroIndex, heroCarouselItems]);

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

  // Fetch saved events from Firestore when savedEventIds change
  useEffect(() => {
    const savedIds = profile?.savedEventIds ?? [];
    if (savedIds.length === 0) {
      setSavedEventsData([]);
      setSavedEventsLoading(false);
      return;
    }

    let cancelled = false;
    const loadSavedEvents = async () => {
      setSavedEventsLoading(true);
      try {
        const fetched = await fetchEventsByIds(savedIds);
        if (cancelled) return;

        setSavedEventsData(fetched);
      } catch (error) {
        console.error('Failed to load saved events', error);
      } finally {
        if (!cancelled) {
          setSavedEventsLoading(false);
        }
      }
    };

    void loadSavedEvents();

    return () => {
      cancelled = true;
    };
  }, [profile?.savedEventIds]);

  const handleOpenEvent = useCallback(
    (eventId: string, source?: string, carouselIndex?: number, carouselItemIds?: string[]) => {
      const params: Record<string, string> = { id: eventId };
      if (source) params.source = source;
      if (carouselIndex !== undefined) params.carouselIndex = String(carouselIndex);
      if (carouselItemIds) params.carouselItemIds = carouselItemIds.join(',');

      router.push({ pathname: '/event/[id]', params });
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

  const handleSavedStoryPress = useCallback(
    (eventId: string) => {
      trackEvent('home_saved_story_opened', { event_id: eventId });
      handleOpenEvent(eventId);
    },
    [handleOpenEvent]
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
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          bounces={false}
          alwaysBounceVertical={false}
          overScrollMode="never"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>Today's Moment</Text>
            <Text style={styles.sectionHelper}>
              {new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric' }).format(new Date(today.isoDate))}
            </Text>
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
                  allItemIds={displayHeroItems.map((i) => i.id)}
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
          </View>

          <WeeklyCollectionsGrid
            items={weeklyCollections}
            loading={weeklyCollectionsLoading}
            onOpen={handleOpenCollection}
            onSeeAll={handleSeeAllCollections}
            testID="home-weekly-collections"
          />

          <TimeMachineBlock
            premium={isPremiumUser}
            imageUrl={timeMachineImage}
            subtitle="Guided timeline journeys."
            onPress={handleTimeMachinePress}
            onTeaser={handleTimeMachineTeaser}
            loading={timeMachineLoading || timeMachineSeeding}
            testID="home-time-machine"
          />

          <CategoryExploreGrid testID="home-category-explore" />

          {savedEventsData.length > 0 && (
            <SavedStories
              savedEvents={savedEventsData}
              loading={savedEventsLoading}
              onEventPress={handleSavedStoryPress}
            />
          )}

          <View style={styles.bottomSpacer} />

        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default HomeScreen;
