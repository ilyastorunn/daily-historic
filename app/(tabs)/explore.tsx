import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
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
import { CATEGORY_LABELS, formatCategoryLabel } from '@/constants/personalization';
import { useUserContext } from '@/contexts/user-context';
import { useEventEngagement } from '@/hooks/use-event-engagement';
import { useDailyDigestEvents } from '@/hooks/use-daily-digest-events';
import { fetchEventsByIds } from '@/services/content';
import type { CategoryOption } from '@/contexts/onboarding-context';
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

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const reactions = [
  { id: 'appreciate', emoji: '👍', label: 'Appreciate' },
  { id: 'insight', emoji: '💡', label: 'Insight' },
] as const;

type ReactionOption = (typeof reactions)[number]['id'];
type CategoryFilter = CategoryOption | 'all';

const QUICK_FILTERS: { id: CategoryFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  ...Object.entries(CATEGORY_LABELS).map(([key, label]) => ({
    id: key as CategoryOption,
    label,
  })),
];

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
          <Pressable accessibilityRole="button" onPress={() => handleShiftMonth(-1)}>
            <IconSymbol name="chevron.right" size={20} color={theme.colors.textSecondary} style={{ transform: [{ rotate: '180deg' }] }} />
          </Pressable>
          <Text style={styles.monthLabel}>{formatMonthTitle(pivot)}</Text>
          <Pressable accessibilityRole="button" onPress={() => handleShiftMonth(1)}>
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
      width: 36,
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
      width: 36,
      height: 36,
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
    searchInput: {
      width: '100%',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.card,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      backgroundColor: colors.surface,
      fontFamily: sansFamily,
      fontSize: typography.body.fontSize,
      color: colors.textPrimary,
    },
    fieldRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      alignItems: 'center',
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
    },
    dateLabel: {
      fontFamily: sansFamily,
      fontSize: typography.helper.fontSize,
      color: colors.textSecondary,
    },
    chip: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      backgroundColor: colors.surface,
    },
    chipActive: {
      borderColor: colors.accentPrimary,
      backgroundColor: colors.accentSoft,
    },
    chipLabel: {
      fontFamily: sansFamily,
      fontSize: typography.helper.fontSize,
      color: colors.textSecondary,
    },
    chipLabelActive: {
      color: colors.accentPrimary,
      fontWeight: '600',
    },
    suggestionsSurface: {
      gap: spacing.xs,
    },
    suggestionPill: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    suggestionLabel: {
      fontFamily: sansFamily,
      fontSize: typography.helper.fontSize,
      color: colors.textSecondary,
    },
    randomButton: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
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
    collectionsSurface: {
      gap: spacing.sm,
    },
    collectionCard: {
      flex: 1,
      height: 220,
      borderRadius: 18,
      overflow: 'hidden',
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSubtle,
      shadowColor: colors.shadowColor,
      shadowOpacity: 0.12,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 14 },
      elevation: 6,
    },
    collectionOverlay: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: spacing.card,
      paddingVertical: spacing.lg,
      gap: spacing.xs,
      backgroundColor: 'rgba(12, 10, 6, 0.55)',
    },
    collectionTitle: {
      fontFamily: serifFamily,
      fontSize: typography.headingMd.fontSize,
      lineHeight: typography.headingMd.lineHeight,
      color: colors.surface,
    },
    collectionSummary: {
      fontFamily: sansFamily,
      fontSize: typography.helper.fontSize,
      color: colors.accentMuted,
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
  const { profile } = useUserContext();
  const today = useMemo(
    () => getDateParts(new Date(), { timeZone: profile?.timezone }),
    [profile?.timezone]
  );
  const [query, setQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>(today.isoDate);
  const [filters, setFilters] = useState<Set<CategoryFilter>>(new Set());
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [eventCache, setEventCache] = useState<Record<string, FirestoreEventDocument>>({});

  const activeDate = useMemo(() => parseIsoDate(selectedDate) ?? today, [selectedDate, today]);

  const {
    events: digestEvents,
    digest,
    loading: digestLoading,
    error: digestError,
  } = useDailyDigestEvents({ month: activeDate.month, day: activeDate.day, year: activeDate.year });

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

  const normalizedQuery = query.trim().toLowerCase();
  const activeFilters = useMemo(() => Array.from(filters), [filters]);

  const results = useMemo(() => {
    return digestEvents
      .filter((event) => {
        if (activeFilters.length > 0) {
          const categories = event.categories ?? [];
          if (!activeFilters.some((filter) => categories.includes(filter))) {
            return false;
          }
        }
        if (!normalizedQuery) {
          return true;
        }
        return buildEventSearchText(event).includes(normalizedQuery);
      })
      .slice(0, 20);
  }, [activeFilters, digestEvents, normalizedQuery]);

  const suggestionPool = useMemo(() => Object.values(eventCache), [eventCache]);

  const suggestions = useMemo(() => {
    if (normalizedQuery.length < 2) {
      return [] as FirestoreEventDocument[];
    }
    return suggestionPool
      .filter((event) => getEventTitle(event).toLowerCase().includes(normalizedQuery))
      .slice(0, 4);
  }, [normalizedQuery, suggestionPool]);

  const handleToggleFilter = useCallback((filterId: CategoryFilter) => {
    if (filterId === 'all') {
      setFilters(new Set());
      return;
    }

    setFilters((prev) => {
      const next = new Set(prev);
      if (next.has(filterId)) {
        next.delete(filterId);
      } else {
        next.add(filterId);
      }
      return next;
    });
  }, []);

  const handleOpenDetail = useCallback(
    (id: string) => {
      router.push({ pathname: '/event/[id]', params: { id } });
    },
    [router]
  );

  const handleRandomDate = useCallback(() => {
    const datedEvents = suggestionPool.filter((event) => event.date);
    if (datedEvents.length === 0) {
      setSelectedDate(today.isoDate);
      return;
    }
    const random = datedEvents[Math.floor(Math.random() * datedEvents.length)];
    if (random.date) {
      const month = random.date.month.toString().padStart(2, '0');
      const day = random.date.day.toString().padStart(2, '0');
      setSelectedDate(`${today.year}-${month}-${day}`);
      setQuery('');
    }
  }, [suggestionPool, today.year, today.isoDate]);

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
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Explore</Text>
            <Text style={styles.helperText}>
              Search the archive, skim collections, or jump to a date.
            </Text>
            {statusMessage ? <Text style={styles.helperText}>{statusMessage}</Text> : null}
          </View>

          <View style={styles.fieldRow}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search events, people, or themes"
              placeholderTextColor={theme.colors.textTertiary}
              style={styles.searchInput}
              returnKeyType="search"
            />
            <Pressable
              accessibilityRole="button"
              onPress={() => setCalendarVisible(true)}
              style={({ pressed }) => [styles.dateButton, pressed && { opacity: 0.9 }]}
            >
              <IconSymbol name="calendar" size={18} color={theme.colors.textSecondary} />
              <Text style={styles.dateLabel}>{selectedDateDisplay || 'Select date'}</Text>
            </Pressable>
          </View>

          {suggestions.length > 0 && (
            <View style={styles.suggestionsSurface}>
              {suggestions.map((item) => {
                const title = getEventTitle(item);
                return (
                  <Pressable
                    key={item.eventId}
                    accessibilityRole="button"
                    onPress={() => {
                      setQuery(title);
                      handleOpenDetail(item.eventId);
                    }}
                    style={({ pressed }) => [styles.suggestionPill, pressed && { opacity: 0.85 }]}
                  >
                    <Text style={styles.suggestionLabel}>{title}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          <View style={styles.fieldRow}>
            {QUICK_FILTERS.map((filter) => {
              const isAll = filter.id === 'all';
              const isActive = isAll ? filters.size === 0 : filters.has(filter.id);
              return (
                <Pressable
                  key={filter.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                  onPress={() => handleToggleFilter(filter.id)}
                  style={({ pressed }) => [
                    styles.chip,
                    isActive && styles.chipActive,
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <Text style={[styles.chipLabel, isActive && styles.chipLabelActive]}>
                    {filter.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={handleRandomDate}
            style={({ pressed }) => [styles.randomButton, pressed && { opacity: 0.85 }]}
          >
            <IconSymbol name="sparkles" size={18} color={theme.colors.textSecondary} />
            <Text style={styles.actionLabel}>I’m feeling curious</Text>
          </Pressable>

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
            {!digestLoading && results.length === 0 ? (
              <Text style={styles.helperText}>No moments yet—adjust filters or try another date.</Text>
            ) : null}
          </View>
        </ScrollView>
      </View>

      <CalendarModal
        visible={calendarVisible}
        selectedDate={selectedDate}
        highlightedDates={highlightedDates}
        onClose={() => setCalendarVisible(false)}
        onSelect={(date) => setSelectedDate(date)}
      />
    </SafeAreaView>
  );
};

export default ExploreScreen;
