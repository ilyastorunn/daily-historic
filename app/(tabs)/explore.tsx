import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Image, type ImageErrorEventData, type ImageLoadEventData } from 'expo-image';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { heroEvent } from '@/constants/events';
import { formatCategoryLabel } from '@/constants/personalization';
import { useUserContext } from '@/contexts/user-context';
import { useEventEngagement } from '@/hooks/use-event-engagement';
import { useDailyDigestEvents } from '@/hooks/use-daily-digest-events';
import { useStoryOfTheDay } from '@/hooks/use-story-of-the-day';
import { useYMBI } from '@/hooks/use-ymbi';
import { fetchEventsByIds } from '@/services/content';
import type { CategoryOption, EraOption } from '@/contexts/onboarding-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAppTheme, type ThemeDefinition } from '@/theme';
import type { FirestoreEventDocument } from '@/types/events';
import { getDateParts, parseIsoDate, formatIsoDateLabel } from '@/utils/dates';
import {
  buildEventSearchText,
  getEventImageUri,
  getEventLocation,
  getEventSummary,
  getEventTitle,
  getEventYearLabel,
} from '@/utils/event-presentation';
import { createLinearGradientSource } from '@/utils/gradient';
import { FilterModal, type FilterState } from '@/components/explore/FilterModal';
import { StoryOfTheDay } from '@/components/explore/StoryOfTheDay';
import { YouMightBeInterested } from '@/components/explore/YouMightBeInterested';
import { trackEvent } from '@/services/analytics';

// API Configuration
// TODO: Move to environment config
const API_BASE_URL = __DEV__
  ? 'http://localhost:5001/daily-historic/us-central1/api'
  : 'https://us-central1-daily-historic.cloudfunctions.net/api';

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const reactions = [
  { id: 'appreciate', emoji: '👍', label: 'Appreciate' },
  { id: 'insight', emoji: '💡', label: 'Insight' },
] as const;

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
      paddingBottom: spacing.xxl,
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
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      backgroundColor: colors.surface,
      minHeight: 48,
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
  });
};

const shareEvent = async (event: FirestoreEventDocument) => {
  try {
    const title = getEventTitle(event);
    const summary = getEventSummary(event);
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
  event: FirestoreEventDocument;
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
  const imageUri = useMemo(() => getEventImageUri(event), [event]);
  const imageSource = imageUri ? { uri: imageUri } : heroEvent.image;
  const yearLabel = getEventYearLabel(event);
  const title = getEventTitle(event);
  const summary = getEventSummary(event);
  const locationText = getEventLocation(event);
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
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
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

  // Date state
  const [selectedDate, setSelectedDate] = useState<string>(today.isoDate);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [eventCache, setEventCache] = useState<Record<string, FirestoreEventDocument>>({});

  // Pagination state (backend API)
  const [paginationState, setPaginationState] = useState({
    cursor: null as string | null,
    hasMore: true,
    loading: false,
    loadedIds: new Set<string>(),
  });
  const [apiResults, setApiResults] = useState<FirestoreEventDocument[]>([]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  // Determine if we're showing results or default layout
  const showResults = debouncedQuery.length > 0 || filters.categories.size > 0 || filters.era !== null;

  const activeDate = useMemo(() => parseIsoDate(selectedDate) ?? today, [selectedDate, today]);

  // Data hooks
  const {
    events: digestEvents,
    digest,
    loading: digestLoading,
    error: digestError,
  } = useDailyDigestEvents({ month: activeDate.month, day: activeDate.day, year: activeDate.year });

  const { story, loading: sotdLoading } = useStoryOfTheDay({ enabled: !showResults });

  const { items: ymbiItems, loading: ymbiLoading, refresh: refreshYMBI } = useYMBI({
    userId: authUser?.uid ?? '',
    userCategories: profile?.categories ?? [],
    savedEventIds: profile?.savedEventIds ?? [],
    homeEventIds: [], // TODO: Track Home event IDs to avoid duplicates
    limit: 8,
    enabled: !showResults,
  });

  useEffect(() => {
    if (digestError) {
      console.error('Failed to load explore digest', digestError);
    }
  }, [digestError]);

  useEffect(() => {
    if (digestEvents.length === 0) {
      return;
    }
    setEventCache((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const event of digestEvents) {
        const existing = next[event.eventId];
        const existingStamp = existing?.updatedAt ? String(existing.updatedAt) : '';
        const incomingStamp = event.updatedAt ? String(event.updatedAt) : '';
        if (!existing || existingStamp !== incomingStamp) {
          next[event.eventId] = event;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [digestEvents]);

  useEffect(() => {
    const savedIds = profile?.savedEventIds ?? [];
    if (savedIds.length === 0) {
      return;
    }
    const missing = savedIds.filter((id) => !eventCache[id]);
    if (missing.length === 0) {
      return;
    }

    let cancelled = false;
    const load = async () => {
      try {
        const fetched = await fetchEventsByIds(missing);
        if (cancelled) {
          return;
        }
        setEventCache((prev) => {
          const next = { ...prev };
          let changed = false;
          for (const event of fetched) {
            if (!next[event.eventId]) {
              next[event.eventId] = event;
              changed = true;
            }
          }
          return changed ? next : prev;
        });
      } catch (error) {
        console.error('Failed to load saved events for highlights', error);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [profile?.savedEventIds, eventCache]);

  const highlightedDates = useMemo(() => {
    const savedIds = profile?.savedEventIds ?? [];
    const set = new Set<string>();
    savedIds.forEach((id) => {
      const event = eventCache[id];
      const date = event?.date;
      if (date) {
        const month = date.month.toString().padStart(2, '0');
        const day = date.day.toString().padStart(2, '0');
        set.add(`${today.year}-${month}-${day}`);
      }
    });
    return set;
  }, [eventCache, profile?.savedEventIds, today.year]);

  const normalizedQuery = debouncedQuery.trim().toLowerCase();

  // Fetch search results from backend API
  const fetchSearchResults = useCallback(
    async (cursor?: string | null) => {
      if (paginationState.loading) return;

      try {
        setPaginationState((prev) => ({ ...prev, loading: true }));

        // Build query params
        const params = new URLSearchParams();
        if (normalizedQuery) params.append('q', normalizedQuery);
        if (filters.categories.size > 0) {
          params.append('categories', Array.from(filters.categories).join(','));
        }
        if (filters.era) params.append('era', filters.era);
        if (cursor) params.append('cursor', cursor);
        params.append('limit', '20');

        const url = `${API_BASE_URL}/explore/search?${params.toString()}`;
        console.log('[Explore] Fetching:', url);

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        console.log('[Explore] API Response:', {
          itemCount: data.items?.length,
          nextCursor: data.nextCursor,
        });

        // Update state
        const newItems = data.items || [];
        const newIds = new Set(paginationState.loadedIds);
        newItems.forEach((item: FirestoreEventDocument) => newIds.add(item.eventId));

        setPaginationState((prev) => ({
          ...prev,
          cursor: data.nextCursor || null,
          hasMore: !!data.nextCursor,
          loading: false,
          loadedIds: newIds,
        }));

        // Append or replace results
        setApiResults((prev) => (cursor ? [...prev, ...newItems] : newItems));

        // Track analytics
        if (!cursor) {
          trackEvent('explore_search_results_loaded', {
            q_len: normalizedQuery.length,
            categories_count: filters.categories.size,
            era_selected: filters.era || 'none',
            results_count: newItems.length,
          });
        } else {
          trackEvent('explore_pagination_loaded', {
            page_number: Math.floor(prev.length / 20) + 1,
            items_count: newItems.length,
          });
        }
      } catch (error) {
        console.error('[Explore] API error:', error);
        setPaginationState((prev) => ({ ...prev, loading: false }));
      }
    },
    [normalizedQuery, filters, paginationState.loading, paginationState.loadedIds]
  );

  // Fetch next page
  const fetchNextPage = useCallback(() => {
    if (paginationState.hasMore && !paginationState.loading && paginationState.cursor) {
      fetchSearchResults(paginationState.cursor);
    }
  }, [paginationState, fetchSearchResults]);

  // Determine results source (API or local filtering)
  const results = useMemo(() => {
    // If showing default layout (SOTD + YMBI), use digestEvents for date picker
    if (!showResults) {
      return digestEvents;
    }

    // Use API results for search/filter
    return apiResults;
  }, [showResults, apiResults, digestEvents]);

  const activeFilterCount = filters.categories.size + (filters.era ? 1 : 0);

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

  // Track SOTD shown when story is loaded and visible
  useEffect(() => {
    if (story && !showResults && !sotdLoading) {
      trackEvent('sotd_shown', {
        source: story.source,
        matched: story.matched ?? (story.source === 'wikimedia'),
      });
    }
  }, [story, showResults, sotdLoading]);

  // Track YMBI shown when items are loaded and visible
  useEffect(() => {
    if (ymbiItems.length > 0 && !showResults && !ymbiLoading) {
      trackEvent('ymbi_shown', {
        count: ymbiItems.length,
      });
    }
  }, [ymbiItems, showResults, ymbiLoading]);

  // Fetch search results when query or filters change
  useEffect(() => {
    if (showResults) {
      // Reset pagination and fetch first page
      setPaginationState({
        cursor: null,
        hasMore: true,
        loading: false,
        loadedIds: new Set(),
      });
      setApiResults([]);
      fetchSearchResults(null);
    }
  }, [showResults, normalizedQuery, filters.categories, filters.era]); // eslint-disable-line react-hooks/exhaustive-deps

  // Track no results when search/filters yield empty results
  useEffect(() => {
    if (showResults && results.length === 0 && !paginationState.loading) {
      trackEvent('explore_no_results', {
        q_len: debouncedQuery.length,
        categories_count: filters.categories.size,
        era_selected: filters.era ?? 'none',
      });
    }
  }, [showResults, results.length, paginationState.loading, debouncedQuery.length, filters]);

  const handleOpenDetail = useCallback(
    (id: string) => {
      router.push({ pathname: '/event/[id]', params: { id } });
    },
    [router]
  );

  const handleSOTDPress = useCallback(() => {
    if (story?.eventId) {
      trackEvent('sotd_opened', {
        matched: story.matched ?? (story.source === 'wikimedia'),
      });
      handleOpenDetail(story.eventId);
    }
  }, [story, handleOpenDetail]);

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
  };

  const selectedDateDisplay = formatIsoDateLabel(digest?.date ?? selectedDate, {
    timeZone: profile?.timezone,
  });

  const statusMessage = digestLoading
    ? 'Fetching daily stories…'
    : digestError
      ? 'Showing the latest cached set while we refresh.'
      : undefined;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onScroll={(event) => {
            if (!showResults || !paginationState.hasMore || paginationState.loading) return;

            const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
            const scrollPercentage =
              (layoutMeasurement.height + contentOffset.y) / contentSize.height;

            // Fetch next page when 70% scrolled
            if (scrollPercentage >= 0.7) {
              fetchNextPage();
            }
          }}
          scrollEventThrottle={400}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Explore</Text>
            <Text style={styles.helperText}>
              Search the archive, skim collections, or jump to a date.
            </Text>
            {statusMessage ? <Text style={styles.helperText}>{statusMessage}</Text> : null}
          </View>

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
              />
              {query.length > 0 && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Clear search"
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

          {/* Conditional Rendering: Default Layout vs Results */}
          {showResults ? (
            // Results Layout
            <View style={styles.resultsColumn}>
              {results.map((event) => (
                <EventResultCard
                  key={event.eventId}
                  event={event}
                  onOpenDetail={() => handleOpenDetail(event.eventId)}
                  styles={styles}
                  theme={theme}
                />
              ))}
              {paginationState.loading && (
                <View style={{ paddingVertical: theme.spacing.xl, alignItems: 'center' }}>
                  <ActivityIndicator size="large" color={theme.colors.accentPrimary} />
                  <Text style={{ ...styles.emptyStateText, marginTop: theme.spacing.sm }}>
                    Loading more results...
                  </Text>
                </View>
              )}
              {!paginationState.loading && results.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>
                    No matches found. Try fewer filters or a different search term.
                  </Text>
                </View>
              ) : null}
            </View>
          ) : (
            // Default Layout: SOTD + YMBI
            <>
              <StoryOfTheDay
                story={story}
                loading={sotdLoading}
                onPress={handleSOTDPress}
              />

              <YouMightBeInterested
                items={ymbiItems}
                loading={ymbiLoading}
                onCardPress={handleYMBICardPress}
                onRefresh={refreshYMBI}
                onSeeMore={handleYMBISeeMore}
              />
            </>
          )}
        </ScrollView>
      </View>

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
