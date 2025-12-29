import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import { useAppTheme } from '@/theme';
import { useTimeMachine } from '@/hooks/use-time-machine';
import { TimeMachineCard } from '@/components/time-machine/TimeMachineCard';
import { ProgressTimeline } from '@/components/time-machine/ProgressTimeline';
import { YearSelector } from '@/components/time-machine/YearSelector';
import { trackEvent } from '@/services/analytics';
import type { TimelineEvent } from '@/services/time-machine';
import { isValidYear } from '@/services/time-machine';

const SCREEN_WIDTH = Dimensions.get('window').width;

// Featured years with enriched content
const FEATURED_YEARS = [2013, 1991, 1987, 1943, 1944, 1969];

type ScreenState = 'year-selector' | 'timeline';

const TimeMachineScreen = () => {
  const router = useRouter();
  const theme = useAppTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);

  // Screen state - start with year selector
  const [screenState, setScreenState] = useState<ScreenState>('year-selector');
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);

  const { timeline, loading, error, loadTimeline } = useTimeMachine({
    enabled: screenState === 'timeline' && selectedYear !== undefined,
    seedOnMount: false,
    premium: true,
  });

  const events = useMemo(() => timeline?.events ?? [], [timeline?.events]);
  const year = timeline?.year ?? selectedYear;

  // Horizontal scroll state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeMonth, setActiveMonth] = useState<number>(1);
  const flatListRef = useRef<FlatList>(null);

  // Security: Prevent rapid year selection (debouncing)
  const lastYearLoadTime = useRef<number>(0);
  const YEAR_LOAD_DEBOUNCE_MS = 500;

  // Group events by month
  const eventsByMonth = useMemo(() => {
    const grouped = new Map<number, TimelineEvent[]>();
    events.forEach((event) => {
      if (event.dateISO) {
        const month = parseInt(event.dateISO.split('-')[1], 10);
        if (month > 0 && month <= 12) {
          if (!grouped.has(month)) {
            grouped.set(month, []);
          }
          grouped.get(month)!.push(event);
        }
      }
    });
    return grouped;
  }, [events]);

  // Get available months (only those with events)
  const availableMonths = useMemo(
    () => Array.from(eventsByMonth.keys()).sort((a, b) => a - b),
    [eventsByMonth]
  );

  // Handle viewable items change (track current card)
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        const index = viewableItems[0].index ?? 0;
        setCurrentIndex(index);

        // Update active month based on current event
        const event = events[index];
        if (event?.dateISO) {
          const month = parseInt(event.dateISO.split('-')[1], 10);
          if (month > 0 && month <= 12) {
            setActiveMonth(month);
          }
        }
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  // Handle event press
  const handleEventPress = useCallback(
    (eventId: string) => {
      trackEvent('time_machine_event_opened', { event_id: eventId, year });
      router.push({ pathname: '/event/[id]', params: { id: eventId, source: 'time-machine' } });
    },
    [router, year]
  );

  // Handle year selection from YearSelector
  const handleYearSelect = useCallback(
    (yearToLoad: number) => {
      // Security: Validate year input
      if (!isValidYear(yearToLoad)) {
        return;
      }

      // Security: Debounce year selection
      const now = Date.now();
      if (now - lastYearLoadTime.current < YEAR_LOAD_DEBOUNCE_MS) {
        return;
      }
      lastYearLoadTime.current = now;

      trackEvent('time_machine_year_selected', { year: yearToLoad });
      setSelectedYear(yearToLoad);
      setScreenState('timeline');
      loadTimeline(yearToLoad);
    },
    [loadTimeline]
  );

  // Handle random year selection
  const handleRandomYear = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * FEATURED_YEARS.length);
    const randomYear = FEATURED_YEARS[randomIndex];

    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    trackEvent('time_machine_random_year', { year: randomYear });
    setSelectedYear(randomYear);
    setScreenState('timeline');
    loadTimeline(randomYear);
  }, [loadTimeline]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    if (screenState === 'timeline') {
      // Go back to year selector
      setScreenState('year-selector');
      setCurrentIndex(0);
      setActiveMonth(1);
    } else {
      // Go back to previous screen (home)
      router.back();
    }
  }, [screenState, router]);

  // Initialize active month when events load
  React.useEffect(() => {
    if (availableMonths.length > 0 && activeMonth === 1 && !availableMonths.includes(1)) {
      setActiveMonth(availableMonths[0]);
    }
  }, [availableMonths, activeMonth]);

  // Render card
  const renderCard = useCallback(
    ({ item }: { item: TimelineEvent }) => (
      <View style={styles.cardContainer}>
        <TimeMachineCard {...item} onPress={handleEventPress} fullScreen />
      </View>
    ),
    [handleEventPress, styles.cardContainer]
  );

  // Year Selector Screen
  if (screenState === 'year-selector') {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.container}>
          {/* Back Button */}
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed,
            ]}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color={theme.colors.textPrimary}
            />
          </Pressable>

          {/* Year Selector Component */}
          <YearSelector
            onYearSelect={handleYearSelect}
            onRandomYear={handleRandomYear}
            initialYear={selectedYear ?? 1969}
          />
        </View>
      </SafeAreaView>
    );
  }

  // Timeline Screen
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* Header with Back Button */}
        <View style={styles.header}>
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed,
            ]}
            accessibilityLabel="Go back to year selector"
            accessibilityRole="button"
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color={theme.colors.textPrimary}
            />
          </Pressable>

          {year && (
            <Text style={styles.headerTitle}>{year}</Text>
          )}

          {/* Placeholder for alignment */}
          <View style={styles.headerPlaceholder} />
        </View>

        {/* Progress Timeline */}
        {availableMonths.length > 0 && (
          <ProgressTimeline
            availableMonths={availableMonths}
            activeMonth={activeMonth}
            currentIndex={currentIndex}
            totalEvents={events.length}
          />
        )}

        {/* Loading/Error States */}
        {loading ? (
          <View style={styles.centerContent}>
            <Text style={styles.loading}>Loading timeline…</Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.centerContent}>
            <Text style={styles.error}>Unable to load events right now.</Text>
            <Pressable
              onPress={handleBack}
              style={({ pressed }) => [
                styles.retryButton,
                pressed && styles.retryButtonPressed,
              ]}
            >
              <Text style={styles.retryButtonText}>Try another year</Text>
            </Pressable>
          </View>
        ) : null}

        {/* Empty State */}
        {!loading && !error && events.length === 0 && (
          <View style={styles.centerContent}>
            <Text style={styles.emptyTitle}>No events found</Text>
            <Text style={styles.emptySubtitle}>
              We don&apos;t have events for {selectedYear} yet.
            </Text>
            <Pressable
              onPress={handleBack}
              style={({ pressed }) => [
                styles.retryButton,
                pressed && styles.retryButtonPressed,
              ]}
            >
              <Text style={styles.retryButtonText}>Choose another year</Text>
            </Pressable>
          </View>
        )}

        {/* Horizontal Swipeable Cards (Tinder-style) */}
        {!loading && !error && events.length > 0 && (
          <View style={styles.cardListContainer}>
            <FlatList
              ref={flatListRef}
              data={events}
              renderItem={renderCard}
              keyExtractor={(item) => item.id}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              snapToAlignment="center"
              decelerationRate="fast"
              onViewableItemsChanged={onViewableItemsChanged}
              viewabilityConfig={viewabilityConfig}
              contentContainerStyle={styles.flatListContent}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const buildStyles = (theme: ReturnType<typeof useAppTheme>) => {
  const sansFamily = Platform.select({
    ios: 'System',
    android: 'sans-serif',
    default: 'System',
  });

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.appBackground,
    },
    container: {
      flex: 1,
      backgroundColor: theme.colors.screen,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: theme.colors.textPrimary,
      fontFamily: sansFamily,
      letterSpacing: 0.5,
    },
    headerPlaceholder: {
      width: 44,
      height: 44,
    },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surfaceSubtle,
    },
    backButtonPressed: {
      opacity: 0.7,
      transform: [{ scale: 0.96 }],
    },
    centerContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.xl,
      gap: theme.spacing.lg,
    },
    loading: {
      fontFamily: sansFamily,
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    error: {
      fontFamily: sansFamily,
      fontSize: 14,
      color: theme.colors.borderStrong,
      textAlign: 'center',
    },
    emptyTitle: {
      fontFamily: sansFamily,
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.textPrimary,
      textAlign: 'center',
    },
    emptySubtitle: {
      fontFamily: sansFamily,
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    retryButton: {
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.surfaceSubtle,
      borderWidth: 1,
      borderColor: theme.colors.borderSubtle,
    },
    retryButtonPressed: {
      opacity: 0.7,
    },
    retryButtonText: {
      fontFamily: sansFamily,
      fontSize: 15,
      fontWeight: '500',
      color: theme.colors.accentPrimary,
    },
    cardListContainer: {
      flex: 1,
    },
    cardContainer: {
      width: SCREEN_WIDTH,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.xl,
    },
    flatListContent: {
      paddingVertical: theme.spacing.lg,
    },
  });
};

export default TimeMachineScreen;
