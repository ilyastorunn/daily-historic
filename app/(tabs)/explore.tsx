import React, { useCallback, useMemo, useState } from 'react';
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
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  EVENT_COLLECTIONS,
  EVENT_LIBRARY,
  QUICK_FILTERS,
  type EventCategory,
  type EventRecord,
} from '@/constants/events';
import { useUserContext } from '@/contexts/user-context';
import { useEventEngagement } from '@/hooks/use-event-engagement';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { PeekCarousel } from '@/components/ui/peek-carousel';
import { useAppTheme, type ThemeDefinition } from '@/theme';
import { createLinearGradientSource } from '@/utils/gradient';

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

const toDateKey = (date: Date) => date.toISOString().slice(0, 10);

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
          {DAY_LABELS.map((day) => (
            <Text key={day} style={styles.dayLabel}>
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

const shareEvent = async (event: EventRecord) => {
  try {
    await Share.share({
      title: event.title,
      message: `${event.title} — ${event.summary}`,
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
  event: EventRecord;
  onOpenDetail: () => void;
  styles: ExploreStyles;
  theme: ThemeDefinition;
}) => {
  const { isSaved, reaction, toggleReaction, toggleSave } = useEventEngagement(event.id);
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

  return (
    <Pressable accessibilityRole="button" onPress={onOpenDetail} style={styles.resultCard}>
      <View pointerEvents="none" style={styles.resultMedia}>
        <Image source={event.image} style={styles.resultImage} contentFit="cover" transition={180} />
        <Image
          pointerEvents="none"
          source={overlaySource}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />
      </View>
      <View style={styles.resultBody}>
        <Text style={styles.yearBadge}>{event.year}</Text>
        <Text style={styles.resultTitle}>{event.title}</Text>
        <Text style={styles.resultSummary}>{event.summary}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.locationText}>{event.location}</Text>
          {event.categories.slice(0, 1).map((category) => (
            <View key={category} style={styles.categoryPill}>
              <Text style={styles.categoryText}>{category.replace('-', ' ')}</Text>
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
  const [query, setQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [filters, setFilters] = useState<Set<EventCategory>>(new Set());
  const [calendarVisible, setCalendarVisible] = useState(false);

  const eventsById = useMemo(() => {
    const map = new Map<string, EventRecord>();
    EVENT_LIBRARY.forEach((event) => {
      map.set(event.id, event);
    });
    return map;
  }, []);

  const highlightedDates = useMemo(() => {
    const savedIds = profile?.savedEventIds ?? [];
    const set = new Set<string>();
    savedIds.forEach((id) => {
      const event = eventsById.get(id);
      if (event) {
        set.add(event.date);
      }
    });
    return set;
  }, [eventsById, profile?.savedEventIds]);

  const normalizedQuery = query.trim().toLowerCase();
  const activeFilters = Array.from(filters);

  const results = useMemo(() => {
    const filtered = EVENT_LIBRARY.filter((event) => {
      if (selectedDate && event.date !== selectedDate) {
        return false;
      }
      if (activeFilters.length > 0) {
        const matchesFilter = activeFilters.some((filter) => event.categories.includes(filter));
        if (!matchesFilter) {
          return false;
        }
      }
      if (!normalizedQuery) {
        return true;
      }
      const haystack = `${event.title} ${event.summary} ${event.location}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });

    return filtered
      .sort((a, b) => (a.date > b.date ? -1 : 1))
      .slice(0, 20);
  }, [activeFilters, normalizedQuery, selectedDate]);

  const suggestions = useMemo(() => {
    if (normalizedQuery.length < 2) {
      return [] as EventRecord[];
    }
    return EVENT_LIBRARY.filter((event) =>
      event.title.toLowerCase().includes(normalizedQuery)
    ).slice(0, 4);
  }, [normalizedQuery]);

  const handleToggleFilter = (filterId: EventCategory | 'all') => {
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
  };

  const handleOpenDetail = useCallback(
    (id: string) => {
      router.push({ pathname: '/event/[id]', params: { id } });
    },
    [router]
  );

  const handleRandomDate = () => {
    const pool = EVENT_LIBRARY;
    const random = pool[Math.floor(Math.random() * pool.length)];
    setSelectedDate(random.date);
    setQuery('');
  };

  const selectedDateDisplay = selectedDate
    ? new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date(selectedDate))
    : 'Any date';

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
              onLongPress={() => setSelectedDate(null)}
              style={({ pressed }) => [styles.dateButton, pressed && { opacity: 0.9 }]}
            >
              <IconSymbol
                name="calendar"
                size={18}
                color={theme.colors.textSecondary}
              />
              <Text style={styles.dateLabel}>{selectedDateDisplay}</Text>
            </Pressable>
          </View>

          {suggestions.length > 0 && (
            <View style={styles.suggestionsSurface}>
              {suggestions.map((item) => (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  onPress={() => {
                    setQuery(item.title);
                    handleOpenDetail(item.id);
                  }}
                  style={({ pressed }) => [styles.suggestionPill, pressed && { opacity: 0.85 }]}
                >
                  <Text style={styles.suggestionLabel}>{item.title}</Text>
                </Pressable>
              ))}
            </View>
          )}

          <View style={styles.fieldRow}>
            {QUICK_FILTERS.map((filter) => {
              const isActive = filter.id !== 'all' && filters.has(filter.id as EventCategory);
              const isAll = filter.id === 'all';
              return (
                <Pressable
                  key={filter.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isAll ? filters.size === 0 : isActive }}
                  onPress={() => handleToggleFilter(filter.id as EventCategory | 'all')}
                  style={({ pressed }) => [
                    styles.chip,
                    (isAll ? filters.size === 0 : isActive) && styles.chipActive,
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipLabel,
                      (isAll ? filters.size === 0 : isActive) && styles.chipLabelActive,
                    ]}
                  >
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
                key={event.id}
                event={event}
                onOpenDetail={() => handleOpenDetail(event.id)}
                styles={styles}
                theme={theme}
              />
            ))}
            {results.length === 0 && (
              <Text style={styles.helperText}>No moments yet—adjust filters or try another date.</Text>
            )}
          </View>

          <View style={styles.collectionsSurface}>
            <Text style={styles.sectionTitle}>Collections</Text>
            <PeekCarousel
              data={EVENT_COLLECTIONS}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => handleOpenDetail(item.eventIds[0])}
                  style={({ pressed }) => [styles.collectionCard, pressed && { opacity: 0.92 }]}
                >
                  <Image source={item.image} style={StyleSheet.absoluteFill} contentFit="cover" />
                  <Image
                    pointerEvents="none"
                    source={createLinearGradientSource(
                      [
                        { offset: 0, color: 'rgba(12, 10, 6, 0.2)' },
                        { offset: 100, color: 'rgba(12, 10, 6, 0.65)' },
                      ],
                      { x1: 0.5, y1: 0, x2: 0.5, y2: 1 }
                    )}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                  />
                  <View style={styles.collectionOverlay}>
                    <Text style={styles.collectionTitle}>{item.title}</Text>
                    <Text style={styles.collectionSummary}>{item.summary}</Text>
                  </View>
                </Pressable>
              )}
            />
          </View>
        </ScrollView>
      </View>

      <CalendarModal
        visible={calendarVisible}
        selectedDate={selectedDate}
        highlightedDates={highlightedDates}
        onSelect={setSelectedDate}
        onClose={() => setCalendarVisible(false)}
      />
    </SafeAreaView>
  );
};

export default ExploreScreen;
