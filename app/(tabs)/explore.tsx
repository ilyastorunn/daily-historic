import { Image, type ImageErrorEventData, type ImageLoadEventData } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';

import { FilterModal, type FilterState } from '@/components/explore/FilterModal';
import { ProgressiveBlurHeader } from '@/components/ui/progressive-blur-header';
import { YouMightBeInterested } from '@/components/explore/YouMightBeInterested';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { heroEvent } from '@/constants/events';
import { formatCategoryLabel } from '@/constants/personalization';
import type { CategoryOption } from '@/contexts/onboarding-context';
import { useUserContext } from '@/contexts/user-context';
import { useEventEngagement } from '@/hooks/use-event-engagement';
import { useProgressiveHeaderScroll } from '@/hooks/use-progressive-header-scroll';
import { useYMBI } from '@/hooks/use-ymbi';
import { trackEvent } from '@/services/analytics';
import {
  searchExploreEvents,
  type ExploreSearchResultItem,
} from '@/services/explore-search';
import { useAppTheme, type ThemeDefinition } from '@/theme';
import { formatIsoDateLabel, getDateParts, parseIsoDate } from '@/utils/dates';
import { createLinearGradientSource } from '@/utils/gradient';
import { createImageSource } from '@/utils/wikimedia-image-source';

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const reactions = [
  { id: 'appreciate', emoji: '👍', label: 'Appreciate' },
  { id: 'insight', emoji: '💡', label: 'Insight' },
] as const;

const MIN_SEARCH_QUERY_LENGTH = 2;

type ReactionOption = (typeof reactions)[number]['id'];

type CalendarModalProps = {
  visible: boolean;
  selectedDate: string | null;
  highlightedDates: Set<string>;
  onClose: () => void;
  onSelect: (date: string) => void;
};

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const buildMonthMatrix = (pivot: Date) => {
  const year = pivot.getFullYear();
  const month = pivot.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const matrix: (Date | null)[][] = [];
  let current = new Date(firstDay);
  current.setDate(current.getDate() - current.getDay());

  while (current <= lastDay || current.getDay() !== 0) {
    const week: (Date | null)[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(current.getMonth() === month ? new Date(current) : null);
      current.setDate(current.getDate() + 1);
    }
    matrix.push(week);
  }

  return matrix;
};

const formatMonthTitle = (date: Date) =>
  new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);

const CalendarModal = ({ visible, selectedDate, highlightedDates, onClose, onSelect }: CalendarModalProps) => {
  const theme = useAppTheme();
  const styles = useMemo(() => createCalendarStyles(theme), [theme]);
  const [pivot, setPivot] = useState(() => (selectedDate ? new Date(selectedDate) : new Date()));

  const matrix = useMemo(() => buildMonthMatrix(pivot), [pivot]);
  const selectedKey = selectedDate ?? '';

  const handleShiftMonth = (delta: number) => {
    setPivot((prev) => {
      const next = new Date(prev);
      next.setMonth(prev.getMonth() + delta);
      return next;
    });
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>
      <View style={styles.modalSurface}>
        <View style={styles.modalHeader}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Previous month"
            onPress={() => handleShiftMonth(-1)}
            style={styles.monthNavButton}
          >
            <IconSymbol name="chevron.right" size={20} color={theme.colors.textSecondary} style={{ transform: [{ rotate: '180deg' }] }} />
          </Pressable>
          <Text style={styles.monthLabel}>{formatMonthTitle(pivot)}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Next month"
            onPress={() => handleShiftMonth(1)}
            style={styles.monthNavButton}
          >
            <IconSymbol name="chevron.right" size={20} color={theme.colors.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.dayRow}>
          {DAY_LABELS.map((day, index) => (
            <Text key={`${day}-${index}`} style={styles.dayLabel}>
              {day}
            </Text>
          ))}
        </View>

        {matrix.map((week, weekIndex) => (
          <View key={weekIndex} style={styles.weekRow}>
            {week.map((date, index) => {
              if (!date) {
                return <View key={`empty-${index}`} style={styles.dayCell} />;
              }
              const key = toDateKey(date);
              const isSelected = key === selectedKey;
              const isHighlighted = highlightedDates.has(key);
              return (
                <Pressable
                  key={key}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => {
                    onSelect(key);
                    onClose();
                  }}
                  style={({ pressed }) => [
                    styles.dayCell,
                    (isSelected || isHighlighted) && styles.dayActive,
                    pressed && styles.dayPressed,
                  ]}
                >
                  <Text style={[styles.dayValue, isSelected && styles.dayValueSelected]}>{date.getDate()}</Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </Modal>
  );
};

const createCalendarStyles = (theme: ThemeDefinition) => {
  const { colors, radius, spacing, typography } = theme;
  const sansFamily = Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' });

  return StyleSheet.create({
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(12, 10, 6, 0.4)',
    },
    modalSurface: {
      position: 'absolute',
      left: spacing.xl,
      right: spacing.xl,
      top: '20%',
      padding: spacing.lg,
      borderRadius: radius.xl,
      backgroundColor: colors.surface,
      shadowColor: colors.shadowColor,
      shadowOpacity: 0.18,
      shadowRadius: 32,
      shadowOffset: { width: 0, height: 18 },
      elevation: 8,
      gap: spacing.sm,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    monthNavButton: {
      minWidth: 44,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    monthLabel: {
      fontFamily: sansFamily,
      fontSize: typography.body.fontSize,
      letterSpacing: 0.4,
      color: colors.textPrimary,
    },
    dayRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    dayLabel: {
      width: 44,
      textAlign: 'center',
      fontFamily: sansFamily,
      fontSize: typography.helper.fontSize,
      color: colors.textSecondary,
    },
    weekRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    dayCell: {
      width: 44,
      height: 44,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: spacing.xs,
    },
    dayActive: {
      backgroundColor: colors.accentSoft,
      borderWidth: 1,
      borderColor: colors.accentPrimary,
    },
    dayPressed: {
      opacity: 0.85,
    },
    dayValue: {
      fontFamily: sansFamily,
      fontSize: typography.helper.fontSize,
      color: colors.textSecondary,
    },
    dayValueSelected: {
      color: colors.accentPrimary,
      fontWeight: '600',
    },
  });
};

const createStyles = (theme: ThemeDefinition) => {
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
    sectionTitle: {
      fontFamily: serifFamily,
      fontSize: typography.headingLg.fontSize,
      lineHeight: typography.headingLg.lineHeight,
      color: colors.textPrimary,
      letterSpacing: -0.3,
    },
    helperText: {
      fontFamily: sansFamily,
      fontSize: typography.helper.fontSize,
      color: colors.textSecondary,
    },
    searchSection: {
      gap: spacing.sm,
    },
    searchRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      alignItems: 'center',
    },
    searchInputContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.card,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      backgroundColor: colors.surface,
      height: 48,
    },
    searchInput: {
      flex: 1,
      fontFamily: sansFamily,
      fontSize: typography.body.fontSize,
      color: colors.textPrimary,
      marginLeft: spacing.sm,
    },
    clearButton: {
      padding: spacing.xs,
      minWidth: 44,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    filterButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      backgroundColor: colors.surface,
      minHeight: 48,
    },
    filterButtonActive: {
      borderColor: colors.accentPrimary,
      backgroundColor: colors.accentSoft,
    },
    filterLabel: {
      fontFamily: sansFamily,
      fontSize: typography.helper.fontSize,
      color: colors.textSecondary,
    },
    filterLabelActive: {
      color: colors.accentPrimary,
      fontWeight: '600',
    },
    dateButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      backgroundColor: colors.surface,
      minHeight: 48,
    },
    dateLabel: {
      fontFamily: sansFamily,
      fontSize: typography.helper.fontSize,
      color: colors.textSecondary,
    },
    resultsColumn: {
      gap: spacing.lg,
    },
    sortToggleContainer: {
      flexDirection: 'row',
      gap: spacing.sm,
      paddingBottom: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.borderSubtle,
      marginBottom: spacing.lg,
    },
    sortToggleButton: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      backgroundColor: 'transparent',
    },
    sortToggleButtonActive: {
      backgroundColor: colors.accentSoft,
      borderColor: colors.accentPrimary,
    },
    sortToggleText: {
      fontFamily: sansFamily,
      fontSize: typography.helper.fontSize,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    sortToggleTextActive: {
      color: colors.accentPrimary,
      fontWeight: '600',
    },
    resultCard: {
      borderRadius: 16,
      overflow: 'hidden',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSubtle,
      backgroundColor: colors.surface,
      shadowColor: colors.shadowColor,
      shadowOpacity: 0.12,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 14 },
      elevation: 6,
    },
    resultMedia: {
      height: 180,
      position: 'relative',
    },
    resultImage: {
      width: '100%',
      height: '100%',
    },
    resultBody: {
      paddingHorizontal: spacing.card,
      paddingVertical: spacing.lg,
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
    resultTitle: {
      fontFamily: serifFamily,
      fontSize: typography.headingMd.fontSize,
      lineHeight: typography.headingMd.lineHeight,
      color: colors.textPrimary,
      letterSpacing: -0.2,
    },
    resultSummary: {
      fontFamily: sansFamily,
      fontSize: typography.body.fontSize,
      lineHeight: typography.body.lineHeight,
      color: colors.textSecondary,
    },
    metaRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      alignItems: 'center',
      flexWrap: 'wrap',
    },
    locationText: {
      fontFamily: sansFamily,
      fontSize: typography.helper.fontSize,
      color: colors.textTertiary,
    },
    categoryPill: {
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
    engagementRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    reactionGroup: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    reactionChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
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
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    actionLabel: {
      fontFamily: sansFamily,
      fontSize: typography.helper.fontSize,
      color: colors.textSecondary,
    },
    emptyState: {
      padding: spacing.xl,
      alignItems: 'center',
      gap: spacing.sm,
    },
    emptyStateText: {
      fontFamily: sansFamily,
      fontSize: typography.body.fontSize,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    activeChipsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      paddingTop: spacing.sm,
    },
    activeChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radius.pill,
      backgroundColor: colors.accentSoft,
      borderWidth: 1,
      borderColor: colors.accentPrimary,
    },
    activeChipText: {
      fontFamily: sansFamily,
      fontSize: typography.helper.fontSize,
      color: colors.accentPrimary,
      fontWeight: '600',
    },
    activeChipButton: {
      padding: spacing.xs,
      marginLeft: spacing.xs,
    },
  });
};

const shareEvent = async (event: ExploreSearchResultItem) => {
  try {
    const title = event.title;
    const summary = event.summary;
    await Share.share({
      title,
      message: `${title} — ${summary}`,
    });
  } catch (error) {
    console.error('Share failed', error);
  }
};

type ExploreStyles = ReturnType<typeof createStyles>;

const EventResultCard = ({
  event,
  onOpenDetail,
  styles,
  theme,
}: {
  event: ExploreSearchResultItem;
  onOpenDetail: () => void;
  styles: ExploreStyles;
  theme: ThemeDefinition;
}) => {
  const eventId = event.eventId;
  const { isSaved, reaction, toggleReaction, toggleSave } = useEventEngagement(eventId);
  const overlaySource = useMemo(
    () =>
      createLinearGradientSource(
        [
          { offset: 0, color: 'rgba(12, 10, 6, 0.05)' },
          { offset: 100, color: 'rgba(12, 10, 6, 0.55)' },
        ],
        { x1: 0.5, y1: 0, x2: 0.5, y2: 1 }
      ),
    []
  );
  const imageUri = event.imageUrl;
  const imageSource = createImageSource(imageUri) ?? heroEvent.image;
  const yearLabel = event.year ? String(event.year) : 'Today';
  const title = event.title;
  const summary = event.summary;
  const locationText = event.location ?? '';
  const categoryLabels = (event.categories ?? []).slice(0, 1).map((category) => formatCategoryLabel(category));

  const handleImageLoad = useCallback(
    (loadEvent: ImageLoadEventData) => {
      console.log('[Explore] result image loaded', {
        eventId,
        uri: imageUri,
        resolvedUrl: loadEvent.source?.url,
        cacheType: loadEvent.cacheType,
        width: loadEvent.source?.width,
        height: loadEvent.source?.height,
      });
    },
    [eventId, imageUri]
  );

  const handleImageError = useCallback(
    (errorEvent: ImageErrorEventData) => {
      console.warn('[Explore] result image failed to load', {
        eventId,
        uri: imageUri,
        error: errorEvent.error,
      });
    },
    [eventId, imageUri]
  );

  return (
    <Pressable accessibilityRole="button" onPress={onOpenDetail} style={styles.resultCard}>
      <View pointerEvents="none" style={styles.resultMedia}>
        <Image
          source={imageSource}
          style={styles.resultImage}
          contentFit="cover"
          transition={180}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
        <Image
          pointerEvents="none"
          source={overlaySource}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />
      </View>
      <View style={styles.resultBody}>
        <Text style={styles.yearBadge}>{yearLabel}</Text>
        <Text style={styles.resultTitle}>{title}</Text>
        <Text style={styles.resultSummary}>{summary}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.locationText}>{locationText}</Text>
          {categoryLabels.map((label) => (
            <View key={label} style={styles.categoryPill}>
              <Text style={styles.categoryText}>{label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.engagementRow}>
          <View style={styles.reactionGroup}>
            {reactions.map((item) => {
              const isActive = reaction === item.id;
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                  onPress={() => toggleReaction(item.id as ReactionOption)}
                  style={({ pressed }) => [
                    styles.reactionChip,
                    isActive && styles.reactionChipActive,
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <Text>{item.emoji}</Text>
                  <Text style={[styles.reactionLabel, isActive && styles.reactionLabelActive]}>
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
              onPress={(pressEvent) => {
                pressEvent.stopPropagation();
                toggleSave();
              }}
              style={({ pressed }) => [
                styles.actionButton,
                isSaved && styles.reactionChipActive,
                pressed && { opacity: 0.85 },
              ]}
            >
              <IconSymbol
                name={isSaved ? 'bookmark.fill' : 'bookmark'}
                size={20}
                color={isSaved ? theme.colors.accentPrimary : theme.colors.textSecondary}
              />
              <Text style={[styles.actionLabel, isSaved && styles.reactionLabelActive]}>Save</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={(pressEvent) => {
                pressEvent.stopPropagation();
                shareEvent(event);
              }}
              style={({ pressed }) => [styles.actionButton, pressed && { opacity: 0.85 }]}
            >
              <IconSymbol
                name="square.and.arrow.up"
                size={20}
                color={theme.colors.textSecondary}
              />
              <Text style={styles.actionLabel}>Share</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

const ExploreScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string }>();
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const { profile, authUser } = useUserContext();

  const today = useMemo(
    () => getDateParts(new Date(), { timeZone: profile?.timezone }),
    [profile?.timezone]
  );

  // Search state
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    categories: new Set<CategoryOption>(),
    era: null,
  });
  const [tempFilters, setTempFilters] = useState<FilterState>(filters);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Sort state (persisted per session)
  const [sortMode, setSortMode] = useState<'relevance' | 'recent'>('relevance');

  // Date state
  const [selectedDate, setSelectedDate] = useState<string>(today.isoDate);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [searchResults, setSearchResults] = useState<ExploreSearchResultItem[]>([]);
  const [searchState, setSearchState] = useState({
    page: 0,
    hasMore: false,
    loading: false,
    error: null as Error | null,
  });

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  // Track processed category param to avoid infinite loop
  const processedCategoryRef = useRef<string | null>(null);

  // Ref to track ongoing pagination fetch
  const paginationFetchingRef = useRef(false);
  const searchBaseKeyRef = useRef<string | null>(null);
  const searchAbortControllerRef = useRef<AbortController | null>(null);

  // Handle category parameter from navigation
  useEffect(() => {
    if (params.category && params.category !== processedCategoryRef.current) {
      const categoryOption = params.category as CategoryOption;
      const categorySet = new Set<CategoryOption>();
      categorySet.add(categoryOption);
      setFilters({
        categories: categorySet,
        era: null,
      });
      trackEvent('explore_category_deeplink', { category: params.category });
      processedCategoryRef.current = params.category;
    }
  }, [params.category]);

  const activeDate = useMemo(() => parseIsoDate(selectedDate) ?? today, [selectedDate, today]);
  const normalizedQuery = debouncedQuery.trim();
  const effectiveQuery =
    normalizedQuery.length >= MIN_SEARCH_QUERY_LENGTH ? normalizedQuery : '';
  const categoriesArray = useMemo(() => Array.from(filters.categories).sort(), [filters.categories]);
  const categoriesKey = categoriesArray.join(',');
  const isDateSelected = selectedDate !== today.isoDate;
  const showResults =
    effectiveQuery.length > 0 ||
    categoriesArray.length > 0 ||
    filters.era !== null ||
    isDateSelected;

  const { items: ymbiItems, loading: ymbiLoading, refresh: refreshYMBI } = useYMBI({
    userId: authUser?.uid ?? '',
    userCategories: profile?.categories ?? [],
    savedEventIds: profile?.savedEventIds ?? [],
    homeEventIds: [],
    limit: 8,
    enabled: !showResults,
    timezone: profile?.timezone,
  });

  // Pull to refresh
  const [refreshing, setRefreshing] = useState(false);

  const highlightedDates = useMemo(() => {
    const set = new Set<string>();
    return set;
  }, []);

  // Fetch search results from Algolia
  const fetchSearchResults = useCallback(
    async (page = 0, append = false) => {
      const controller = !append ? new AbortController() : null;
      const baseKey = JSON.stringify([
        effectiveQuery,
        categoriesKey,
        filters.era ?? '',
        sortMode,
        isDateSelected ? selectedDate : '',
      ]);

      if (append) {
        if (paginationFetchingRef.current) {
          console.log('[Explore] Skipping pagination - already fetching');
          return;
        }

        paginationFetchingRef.current = true;
      } else {
        searchAbortControllerRef.current?.abort();
        searchAbortControllerRef.current = controller;
        searchBaseKeyRef.current = baseKey;
      }

      setSearchState((previous) => ({ ...previous, loading: true, error: null }));

      try {
        const result = await searchExploreEvents({
          query: effectiveQuery,
          categories: categoriesArray,
          era: filters.era,
          month: isDateSelected ? activeDate.month : undefined,
          day: isDateSelected ? activeDate.day : undefined,
          page,
          hitsPerPage: page === 0 ? 8 : 10,
          sortMode,
          signal: controller?.signal,
        });

        if (searchBaseKeyRef.current !== baseKey) {
          return;
        }

        setSearchResults((previous) => {
          if (!append) {
            return result.items;
          }

          return [
            ...previous,
            ...result.items.filter(
              (item) => !previous.some((existing) => existing.eventId === item.eventId)
            ),
          ];
        });
        setSearchState({
          page: result.page,
          hasMore: result.hasMore,
          loading: false,
          error: null,
        });

        trackEvent(!append ? 'explore_search_results_loaded' : 'explore_pagination_loaded', {
          q_len: effectiveQuery.length,
          categories_count: categoriesArray.length,
          era_selected: filters.era || 'none',
          results_count: result.items.length,
        });
      } catch (error) {
        if (searchBaseKeyRef.current !== baseKey) {
          return;
        }

        if (
          controller?.signal.aborted ||
          (error instanceof Error && error.name === 'AbortError')
        ) {
          return;
        }

        console.error('[Explore] Algolia search error:', error);
        setSearchState((previous) => ({
          ...previous,
          loading: false,
          error: error instanceof Error ? error : new Error('Search failed'),
        }));
      } finally {
        if (!append && searchAbortControllerRef.current === controller) {
          searchAbortControllerRef.current = null;
        }
        paginationFetchingRef.current = false;
      }
    },
    [
      activeDate.day,
      activeDate.month,
      categoriesArray,
      categoriesKey,
      effectiveQuery,
      filters.era,
      isDateSelected,
      selectedDate,
      sortMode,
    ]
  );

  const fetchNextPage = useCallback(() => {
    if (!searchState.hasMore || searchState.loading || paginationFetchingRef.current) {
      return;
    }

    void fetchSearchResults(searchState.page + 1, true);
  }, [fetchSearchResults, searchState.hasMore, searchState.loading, searchState.page]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (showResults) {
        await fetchSearchResults(0, false);
      } else {
        refreshYMBI();
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error('[Explore] Refresh failed', error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchSearchResults, refreshYMBI, showResults]);

  const results = searchResults;

  const activeFilterCount = (categoriesKey ? categoriesKey.split(',').length : 0) + (filters.era ? 1 : 0);

  // Track explore_opened on mount
  useEffect(() => {
    trackEvent('explore_opened', { source: 'tab' });
  }, []);

  // Track search typed when debounced query changes
  useEffect(() => {
    if (debouncedQuery.length > 0) {
      trackEvent('explore_search_typed', {
        q_len: debouncedQuery.length,
        submitted: false, // Debounced input, not explicit submit
      });
    }
  }, [debouncedQuery]);

  // Track YMBI shown when items are loaded and visible
  useEffect(() => {
    if (ymbiItems.length > 0 && !showResults && !ymbiLoading) {
      trackEvent('ymbi_shown', {
        count: ymbiItems.length,
      });
    }
  }, [ymbiItems, showResults, ymbiLoading]);

  // Fetch search results when query, filters, sort, or date change.
  useEffect(() => {
    if (!showResults) {
      searchAbortControllerRef.current?.abort();
      searchAbortControllerRef.current = null;
      searchBaseKeyRef.current = null;
      paginationFetchingRef.current = false;
      setSearchResults([]);
      setSearchState({
        page: 0,
        hasMore: false,
        loading: false,
        error: null,
      });
      return;
    }

    paginationFetchingRef.current = false;
    void fetchSearchResults(0, false);

    return () => {
      searchAbortControllerRef.current?.abort();
      searchAbortControllerRef.current = null;
    };
  }, [fetchSearchResults, showResults]);

  // Track no results when search/filters yield empty results
  useEffect(() => {
    if (showResults && results.length === 0 && !searchState.loading) {
      trackEvent('explore_no_results', {
        q_len: effectiveQuery.length,
        categories_count: categoriesArray.length,
        era_selected: filters.era ?? 'none',
      });
    }
  }, [categoriesArray.length, effectiveQuery.length, filters.era, results.length, searchState.loading, showResults]);

  const handleOpenDetail = useCallback(
    (id: string) => {
      router.push({ pathname: '/event/[id]', params: { id } });
    },
    [router]
  );

  const handleYMBICardPress = useCallback(
    (eventId: string) => {
      const event = ymbiItems.find((e) => e.eventId === eventId);
      if (event) {
        trackEvent('ymbi_card_opened', {
          card_id: eventId,
          category_id: event.categories?.[0] ?? 'unknown',
        });
      }
      handleOpenDetail(eventId);
    },
    [ymbiItems, handleOpenDetail]
  );

  const handleYMBISeeMore = useCallback(() => {
    // Clear search query
    setQuery('');
    setDebouncedQuery('');

    // Pre-select all user categories
    const userCategories = profile?.categories ?? [];
    setFilters({
      categories: new Set(userCategories),
      era: null,
    });

    trackEvent('ymbi_see_more', {
      categories_count: userCategories.length,
    });
  }, [profile?.categories]);

  const handleFilterOpen = () => {
    setTempFilters(filters);
    setFilterModalVisible(true);
    trackEvent('explore_filters_opened');
  };

  const handleFilterReset = () => {
    setTempFilters({
      categories: new Set(),
      era: null,
    });
  };

  const handleFilterApply = () => {
    setFilters(tempFilters);
    setFilterModalVisible(false);
    trackEvent('explore_filters_applied', {
      categories_count: tempFilters.categories.size,
      era_selected: tempFilters.era ?? 'none',
    });
  };

  const handleClearSearch = () => {
    setQuery('');
    setDebouncedQuery('');
    setFilters({
      categories: new Set(),
      era: null,
    });
    setSelectedDate(today.isoDate); // Reset date to today
  };

  // Individual chip removal handlers
  const handleRemoveCategory = (category: CategoryOption) => {
    const newCategories = new Set(filters.categories);
    newCategories.delete(category);
    setFilters({ ...filters, categories: newCategories });
  };

  const handleRemoveEra = () => {
    setFilters({ ...filters, era: null });
  };

  const handleRemoveDate = () => {
    setSelectedDate(today.isoDate);
  };

  const selectedDateDisplay = formatIsoDateLabel(selectedDate, {
    timeZone: profile?.timezone,
  });

  const handleScrollMetrics = useCallback(
    ({
      y,
      viewportHeight,
      contentHeight,
    }: {
      y: number;
      viewportHeight: number;
      contentHeight: number;
    }) => {
      // Disable pagination when date is selected (all events already loaded)
      if (!showResults || !searchState.hasMore || searchState.loading) {
        return;
      }

      if (contentHeight <= 0) {
        return;
      }

      const scrollPercentage = (viewportHeight + y) / contentHeight;
      // Fetch next page when 70% scrolled
      if (scrollPercentage >= 0.7) {
        fetchNextPage();
      }
    },
    [fetchNextPage, searchState.hasMore, searchState.loading, showResults]
  );

  const { onScroll, scrollY } = useProgressiveHeaderScroll({
    onScrollMetrics: handleScrollMetrics,
  });
  const largeHeaderStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 56], [1, 0], Extrapolation.CLAMP),
  }));

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <Animated.ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.accentPrimary}
            />
          }
          onScroll={onScroll}
          scrollEventThrottle={16}
        >
          <Animated.View style={[styles.sectionHeader, largeHeaderStyle]}>
            <Text style={styles.sectionTitle}>Explore</Text>
            <Text style={styles.helperText}>
              Search the archive, skim collections, or jump to a date.
            </Text>
          </Animated.View>

          {/* Search Section */}
          <View style={styles.searchSection}>
            {/* Search Bar */}
            <View style={styles.searchRow}>
              <View style={styles.searchInputContainer}>
                <IconSymbol name="magnifyingglass" size={18} color={theme.colors.textTertiary} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search events, people, or themes"
                  placeholderTextColor={theme.colors.textTertiary}
                  style={styles.searchInput}
                  returnKeyType="search"
                  multiline={false}
                  numberOfLines={1}
                />
                {showResults && (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Clear search and filters"
                    onPress={handleClearSearch}
                    style={styles.clearButton}
                  >
                    <IconSymbol name="xmark.circle.fill" size={18} color={theme.colors.textTertiary} />
                  </Pressable>
                )}
              </View>
            </View>

            {/* Filter & Date Row */}
            <View style={styles.searchRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Filters${activeFilterCount > 0 ? ` (${activeFilterCount} active)` : ''}`}
              onPress={handleFilterOpen}
              style={({ pressed }) => [
                styles.filterButton,
                activeFilterCount > 0 && styles.filterButtonActive,
                pressed && { opacity: 0.9 },
              ]}
            >
              <IconSymbol
                name="line.horizontal.3.decrease.circle"
                size={18}
                color={activeFilterCount > 0 ? theme.colors.accentPrimary : theme.colors.textSecondary}
              />
              <Text style={[styles.filterLabel, activeFilterCount > 0 && styles.filterLabelActive]}>
                {activeFilterCount > 0 ? `Filters • ${activeFilterCount}` : 'Filters'}
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => setCalendarVisible(true)}
              style={({ pressed }) => [styles.dateButton, pressed && { opacity: 0.9 }]}
            >
              <IconSymbol name="calendar" size={18} color={theme.colors.textSecondary} />
              <Text style={styles.dateLabel}>{selectedDateDisplay || 'Select date'}</Text>
            </Pressable>
          </View>
          </View>

          {/* Active Filter Chips */}
          {showResults && (categoriesArray.length > 0 || filters.era !== null || isDateSelected) && (
            <View style={styles.activeChipsContainer}>
              {/* Category chips */}
              {Array.from(filters.categories).map((category) => (
                <Pressable
                  key={category}
                  onPress={() => handleRemoveCategory(category)}
                  style={styles.activeChip}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${formatCategoryLabel(category)} filter`}
                >
                  <Text style={styles.activeChipText}>
                    📂 {formatCategoryLabel(category)}
                  </Text>
                  <IconSymbol name="xmark" size={12} color={theme.colors.accentPrimary} />
                </Pressable>
              ))}

              {/* Era chip */}
              {filters.era && (
                <Pressable
                  onPress={handleRemoveEra}
                  style={styles.activeChip}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${filters.era} era filter`}
                >
                  <Text style={styles.activeChipText}>
                    🏛️ {filters.era.charAt(0).toUpperCase() + filters.era.slice(1)}
                  </Text>
                  <IconSymbol name="xmark" size={12} color={theme.colors.accentPrimary} />
                </Pressable>
              )}

              {/* Date chip */}
              {selectedDate !== today.isoDate && (
                <Pressable
                  onPress={handleRemoveDate}
                  style={styles.activeChip}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove date filter: ${selectedDateDisplay}`}
                >
                  <Text style={styles.activeChipText}>
                    📅 {selectedDateDisplay}
                  </Text>
                  <IconSymbol name="xmark" size={12} color={theme.colors.accentPrimary} />
                </Pressable>
              )}
            </View>
          )}

          {/* Conditional Rendering: Default Layout vs Results */}
          {showResults ? (
            // Results Layout
            <View style={styles.resultsColumn}>
              {/* Sort Toggle */}
              <View style={styles.sortToggleContainer}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Sort by relevance"
                  accessibilityState={{ selected: sortMode === 'relevance' }}
                  style={[
                    styles.sortToggleButton,
                    sortMode === 'relevance' && styles.sortToggleButtonActive,
                  ]}
                  onPress={() => {
                    setSortMode('relevance');
                    trackEvent('explore_sort_changed', { sort_mode: 'relevance' });
                  }}
                >
                  <Text
                    style={[
                      styles.sortToggleText,
                      sortMode === 'relevance' && styles.sortToggleTextActive,
                    ]}
                  >
                    Relevance
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Sort by recent"
                  accessibilityState={{ selected: sortMode === 'recent' }}
                  style={[
                    styles.sortToggleButton,
                    sortMode === 'recent' && styles.sortToggleButtonActive,
                  ]}
                  onPress={() => {
                    setSortMode('recent');
                    trackEvent('explore_sort_changed', { sort_mode: 'recent' });
                  }}
                >
                  <Text
                    style={[
                      styles.sortToggleText,
                      sortMode === 'recent' && styles.sortToggleTextActive,
                    ]}
                  >
                    Recent
                  </Text>
                </Pressable>
              </View>

              {results.map((event) => (
                <EventResultCard
                  key={event.eventId}
                  event={event}
                  onOpenDetail={() => handleOpenDetail(event.eventId)}
                  styles={styles}
                  theme={theme}
                />
              ))}
              {searchState.loading && (
                <View style={{ paddingVertical: theme.spacing.xl, alignItems: 'center' }}>
                  <ActivityIndicator size="large" color={theme.colors.accentPrimary} />
                  <Text style={{ ...styles.emptyStateText, marginTop: theme.spacing.sm }}>
                    Loading more results...
                  </Text>
                </View>
              )}
              {!searchState.loading && results.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>
                    {searchState.error
                      ? 'Search is temporarily unavailable. Please try again shortly.'
                      : 'No matches found. Try fewer filters or a different search term.'}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : (
            // Default Layout: YMBI + SavedStories
            // SOTD temporarily disabled due to image loading issues with seed events
            // TODO: Re-enable SOTD when Wikimedia URL issues are resolved
            <>
              {/* <StoryOfTheDay
                story={story}
                loading={sotdLoading}
                onPress={handleSOTDPress}
              /> */}

              <YouMightBeInterested
                items={ymbiItems}
                loading={ymbiLoading}
                onCardPress={handleYMBICardPress}
                onRefresh={refreshYMBI}
                onSeeMore={handleYMBISeeMore}
              />
            </>
          )}
        </Animated.ScrollView>
      </View>

      <ProgressiveBlurHeader
        scrollY={scrollY}
        topInset={insets.top}
        testID="explore-progressive-blur-header"
      />

      <CalendarModal
        visible={calendarVisible}
        selectedDate={selectedDate}
        highlightedDates={highlightedDates}
        onClose={() => setCalendarVisible(false)}
        onSelect={(date) => setSelectedDate(date)}
      />

      <FilterModal
        visible={filterModalVisible}
        filters={tempFilters}
        onFiltersChange={setTempFilters}
        onReset={handleFilterReset}
        onApply={handleFilterApply}
        onClose={() => setFilterModalVisible(false)}
      />
    </SafeAreaView>
  );
};

export default ExploreScreen;
