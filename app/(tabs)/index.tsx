import { Image, type ImageErrorEventData, type ImageLoadEventData, type ImageSource } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';

import { ProgressiveBlurHeader } from '@/components/ui/progressive-blur-header';
import { SavedStories } from '@/components/explore/SavedStories';
import { CategoryExploreGrid } from '@/components/home/CategoryExploreGrid';
import { MonthlyCollectionHero } from '@/components/home/MonthlyCollectionHero';
import { MonthlyFeaturedEvents } from '@/components/home/MonthlyFeaturedEvents';
import { TimeMachineBlock } from '@/components/home/TimeMachineBlock';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { PeekCarousel } from '@/components/ui/peek-carousel';
import { heroEvent } from '@/constants/events';
import { useUserContext } from '@/contexts/user-context';
import { useDailyDigestEvents } from '@/hooks/use-daily-digest-events';
import { useEventEngagement } from '@/hooks/use-event-engagement';
import { useMonthlyCollection } from '@/hooks/use-monthly-collection';
import { useProgressiveHeaderScroll } from '@/hooks/use-progressive-header-scroll';
import { useSavedEvents } from '@/hooks/use-saved-events';
import { trackEvent } from '@/services/analytics';
import { useAppTheme, type ThemeDefinition } from '@/theme';
import type { FirestoreEventDocument } from '@/types/events';
import { getDateParts, getIsoWeekKey, getMonthKey } from '@/utils/dates';
import {
  getEventImageUri,
  getEventLocation,
  getEventMeta,
  getEventSummary,
  getEventTitle,
  getEventYearLabel,
} from '@/utils/event-presentation';
import { createImageSource, toImageSource } from '@/utils/wikimedia-image-source';
import { createLinearGradientSource } from '@/utils/gradient';
import { getImageUri } from '@/utils/image-source';

// Reactions removed - using Like + Deep Dive + Save + Share instead

const HOME_SAVED_STORIES_PREVIEW_LIMIT = 3;

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
      paddingTop: spacing.lg,
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
    timeMachineContainer: {
      marginVertical: spacing.md, // Add extra 12pt top and bottom (total: 40pt + 12pt = 52pt)
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
): { event: FirestoreEventDocument | null; reason: 'none' | 'matched_era' | 'matched_category' | 'fallback_first' } => {
  if (events.length === 0) {
    return { event: null, reason: 'none' };
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

  if (eraMatches[0]) {
    return { event: eraMatches[0], reason: 'matched_era' };
  }

  if (categoryMatches[0]) {
    return { event: categoryMatches[0], reason: 'matched_category' };
  }

  return { event: events[0] ?? null, reason: 'fallback_first' };
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
  const insets = useSafeAreaInsets();
  const { profile } = useUserContext();
  const theme = useAppTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const { onScroll, scrollY } = useProgressiveHeaderScroll();
  const largeHeaderStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 56], [1, 0], Extrapolation.CLAMP),
  }));
  const today = useMemo(() => getDateParts(new Date(), { timeZone: profile?.timezone }), [profile?.timezone]);
  const { events: digestEvents, loading: digestLoading, error: digestError } = useDailyDigestEvents({
    month: today.month,
    day: today.day,
    year: today.year,
  });

  const preferredSelection = useMemo(
    () => selectPreferredDigestEvent(digestEvents, profile?.categories, profile?.eras),
    [digestEvents, profile?.categories, profile?.eras]
  );
  const preferredEvent = preferredSelection.event;

  const defaultHeroItem = useMemo<HeroCarouselItem>(
    () => ({
      id: heroEvent.id,
      title: heroEvent.title,
      summary: heroEvent.summary,
      meta: heroEvent.location,
      yearLabel: heroEvent.year,
      imageSource: toImageSource(heroEvent.image)!,
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

  const monthKey = useMemo(() => {
    const referenceDate = today.isoDate ? new Date(`${today.isoDate}T00:00:00Z`) : new Date();
    return getMonthKey(referenceDate, { timeZone: profile?.timezone });
  }, [profile?.timezone, today.isoDate]);

  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        month: 'long',
        year: 'numeric',
      }).format(new Date(`${monthKey}-01T00:00:00Z`)),
    [monthKey]
  );

  const monthNameLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        month: 'long',
      }).format(new Date(`${monthKey}-01T00:00:00Z`)),
    [monthKey]
  );

  const weeklyEditLabel = useMemo(() => {
    const weekMatch = isoWeekKey.match(/W(\d{1,2})/);
    if (!weekMatch) {
      return undefined;
    }
    return `Week ${weekMatch[1]} Edit`;
  }, [isoWeekKey]);

  const {
    item: monthlyCollection,
    loading: monthlyCollectionLoading,
    error: monthlyCollectionError,
  } = useMonthlyCollection({
    monthKey,
    weekKey: isoWeekKey,
    limit: 4,
    enabled: Boolean(monthKey),
  });

  useEffect(() => {
    if (monthlyCollectionError) {
      console.error('Failed to load monthly collection', monthlyCollectionError);
    }
  }, [monthlyCollectionError]);

  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const [heroCarouselWidth, setHeroCarouselWidth] = useState<number | null>(null);
  const lastViewedHeroIdRef = useRef<string | null>(null);
  const lastSelectionMetricRef = useRef<string | null>(null);

  const isPremiumUser = useMemo(() => {
    const inferredProfile = profile as { isPremium?: boolean } | null;
    return Boolean(inferredProfile?.isPremium);
  }, [profile]);

  const {
    savedEvents: savedEventsPreview,
    loading: savedEventsLoading,
    totalCount: savedStoriesCount,
  } = useSavedEvents({ limit: HOME_SAVED_STORIES_PREVIEW_LIMIT });

  const monthlyFeaturedItems = useMemo(
    () => monthlyCollection?.featuredItems ?? [],
    [monthlyCollection?.featuredItems]
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
        imageSource: imageUri
          ? (createImageSource(imageUri) ?? defaultHeroItem.imageSource)
          : defaultHeroItem.imageSource,
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
    if (!preferredEvent?.eventId || digestLoading) {
      return;
    }

    const metricKey = `${preferredEvent.eventId}:${preferredSelection.reason}:${digestEvents.length}`;
    if (lastSelectionMetricRef.current === metricKey) {
      return;
    }
    lastSelectionMetricRef.current = metricKey;

    trackEvent('home_hero_selection_resolved', {
      event_id: preferredEvent.eventId,
      selection_reason: preferredSelection.reason,
      digest_events_count: digestEvents.length,
    });
  }, [digestEvents.length, digestLoading, preferredEvent?.eventId, preferredSelection.reason]);

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

  const handleOpenEvent = useCallback(
    (eventId: string, source?: string, carouselIndex?: number, carouselItemIds?: string[]) => {
      const params: { id: string; source?: string; carouselIndex?: string; carouselItemIds?: string } = {
        id: eventId,
      };
      if (source) params.source = source;
      if (carouselIndex !== undefined) params.carouselIndex = String(carouselIndex);
      if (carouselItemIds) params.carouselItemIds = carouselItemIds.join(',');

      router.push({ pathname: '/event/[id]', params });
    },
    [router]
  );

  const handleOpenMonthlyCollection = useCallback(() => {
    if (!monthlyCollection) {
      return;
    }

    trackEvent('monthly_collection_opened', {
      collection_id: monthlyCollection.id,
      month_key: monthKey,
      week_key: isoWeekKey,
      source: 'home_monthly_hero',
    });
    router.push({
      pathname: '/collection/[id]',
      params: { id: monthlyCollection.id, source: 'home-monthly-hero', monthKey },
    });
  }, [isoWeekKey, monthKey, monthlyCollection, router]);

  const handleSeeAllMonthlyCollection = useCallback(() => {
    if (!monthlyCollection) {
      return;
    }
    trackEvent('monthly_collection_see_all_clicked', {
      collection_id: monthlyCollection.id,
      month_key: monthKey,
      week_key: isoWeekKey,
    });
    router.push({
      pathname: '/collection/[id]',
      params: { id: monthlyCollection.id, source: 'home-monthly-see-all', monthKey },
    });
  }, [isoWeekKey, monthKey, monthlyCollection, router]);

  const handleMonthlyFeaturedEventPress = useCallback(
    (eventId: string, index: number) => {
      trackEvent('monthly_featured_event_opened', {
        event_id: eventId,
        index,
        month_key: monthKey,
        week_key: isoWeekKey,
      });
      handleOpenEvent(eventId, 'home-monthly-featured', index, monthlyFeaturedItems.map((item) => item.id));
    },
    [handleOpenEvent, isoWeekKey, monthKey, monthlyFeaturedItems]
  );

  const timeMachineImage = useMemo(
    () => defaultHeroItem.imageUri ?? getImageUri(heroEvent.image) ?? '',
    [defaultHeroItem.imageUri]
  );

  const handleTimeMachinePress = useCallback(() => {
    const userTier = isPremiumUser ? 'premium' : 'free';
    trackEvent('time_machine_open_clicked', { user_tier: userTier });
    router.push('/time-machine');
  }, [isPremiumUser, router]);

  const handleSavedStoryPress = useCallback(
    (eventId: string) => {
      trackEvent('home_saved_story_opened', { event_id: eventId });
      handleOpenEvent(eventId);
    },
    [handleOpenEvent]
  );

  const handleSeeAllSavedStories = useCallback(() => {
    trackEvent('home_saved_stories_see_all_clicked', { saved_count: savedStoriesCount });
    router.push('/saved-stories');
  }, [router, savedStoriesCount]);

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
        <Animated.ScrollView
          contentContainerStyle={styles.scrollContent}
          bounces={false}
          alwaysBounceVertical={false}
          overScrollMode="never"
          showsVerticalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
        >
          <Animated.View style={[styles.sectionHeader, largeHeaderStyle]}>
            <Text style={styles.sectionLabel}>Today&apos;s Moment</Text>
            <Text style={styles.sectionHelper}>
              {new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric' }).format(new Date(today.isoDate))}
            </Text>
            {statusMessage ? <Text style={styles.sectionHelper}>{statusMessage}</Text> : null}
          </Animated.View>

          <View style={styles.heroCarouselContainer} onLayout={handleHeroCarouselLayout}>
            <PeekCarousel
              data={displayHeroItems}
              keyExtractor={(item) => item.id}
              onIndexChange={handleHeroIndexChange}
              itemWidth={computedHeroWidth}
              gap={0}
              contentPaddingVertical={0}
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

          {monthlyCollection ? (
            <View style={{ marginTop: -40 }}>
              <MonthlyCollectionHero
                title={monthlyCollection.title}
                subtitle={monthlyCollection.subtitle}
                heroBlurb={monthlyCollection.heroBlurb}
                monthLabel={monthLabel}
                coverUrl={monthlyCollection.coverUrl || defaultHeroItem.imageUri || ''}
                onPress={handleOpenMonthlyCollection}
                loading={monthlyCollectionLoading}
                testID="home-monthly-collection-hero"
              />
            </View>
          ) : null}

          <MonthlyFeaturedEvents
            collectionLabel={monthNameLabel}
            weekLabel={weeklyEditLabel}
            items={monthlyFeaturedItems}
            loading={monthlyCollectionLoading}
            onPress={handleMonthlyFeaturedEventPress}
            onSeeAllPress={monthlyCollection ? handleSeeAllMonthlyCollection : undefined}
            testID="home-monthly-featured-events"
          />

          <View style={styles.timeMachineContainer}>
            <TimeMachineBlock
              premium={true}
              imageUrl={timeMachineImage}
              subtitle="Travel through any year."
              onPress={handleTimeMachinePress}
              testID="home-time-machine"
            />
          </View>

          <CategoryExploreGrid testID="home-category-explore" />

          {savedEventsPreview.length > 0 && (
            <SavedStories
              savedEvents={savedEventsPreview}
              loading={savedEventsLoading}
              onEventPress={handleSavedStoryPress}
              helperText="A short shelf of stories you wanted to keep close."
              onSeeAll={handleSeeAllSavedStories}
            />
          )}

          <View style={styles.bottomSpacer} />

        </Animated.ScrollView>
      </View>

      <ProgressiveBlurHeader
        scrollY={scrollY}
        topInset={insets.top}
        testID="home-progressive-blur-header"
      />
    </SafeAreaView>
  );
};

export default HomeScreen;
