import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { useAppTheme } from '@/theme';
import { useTimeMachine } from '@/hooks/use-time-machine';
import { TimeMachineCard } from '@/components/time-machine/TimeMachineCard';
import { MonthTimeline } from '@/components/time-machine/MonthTimeline';
import { trackEvent } from '@/services/analytics';
import type { TimelineEvent } from '@/services/time-machine';
import { isValidYear } from '@/services/time-machine';

const TimeMachineScreen = () => {
  const params = useLocalSearchParams<{ year?: string }>();
  const router = useRouter();
  const theme = useAppTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);

  // Security: Validate year parameter from URL
  const yearParam = useMemo(() => {
    if (!params.year) return undefined;
    const parsed = Number(params.year);
    return isValidYear(parsed) ? parsed : undefined;
  }, [params.year]);

  const { timeline, loading, error, loadTimeline } = useTimeMachine({
    enabled: true,
    seedOnMount: !yearParam,
    premium: true,
  });

  const events = useMemo(() => timeline?.events ?? [], [timeline?.events]);
  const year = timeline?.year ?? yearParam;
  const [isYearPickerVisible, setYearPickerVisible] = useState(false);

  // Scroll tracking state
  const [activeMonth, setActiveMonth] = useState<number>(1);
  const cardPositions = useRef<Map<number, number>>(new Map());
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollY = useRef(new Animated.Value(0)).current;

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

  // Available years for picker
  const availableYears = useMemo(() => {
    const featuredYears = [2013, 1991, 1987, 1943, 1944];
    const merged = Array.from(new Set([year, ...featuredYears].filter(Boolean) as number[]));
    return merged.sort((a, b) => a - b);
  }, [year]);

  // Handle card layout to track positions
  const handleCardLayout = useCallback((month: number, yPosition: number) => {
    cardPositions.current.set(month, yPosition);
  }, []);

  // Track scroll position and update active month
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = event.nativeEvent.contentOffset.y;

      if (availableMonths.length === 0) return;

      // Find which month is currently most visible
      let currentMonth = availableMonths[0];
      for (const [month, yPos] of cardPositions.current) {
        if (yPos <= offsetY + 100) {
          currentMonth = month;
        }
      }

      if (currentMonth !== activeMonth) {
        setActiveMonth(currentMonth);
      }
    },
    [availableMonths, activeMonth]
  );

  // Scroll to specific month
  const scrollToMonth = useCallback((month: number) => {
    const yPosition = cardPositions.current.get(month);
    if (yPosition !== undefined && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        y: yPosition,
        animated: true,
      });
    }
    setActiveMonth(month);
  }, []);

  // Handle event press
  const handleEventPress = useCallback(
    (eventId: string) => {
      trackEvent('time_machine_event_opened', { event_id: eventId, year });
      router.push({ pathname: '/event/[id]', params: { id: eventId, source: 'time-machine' } });
    },
    [router, year]
  );

  // Initialize active month when events load
  React.useEffect(() => {
    if (availableMonths.length > 0 && activeMonth === 1 && !availableMonths.includes(1)) {
      setActiveMonth(availableMonths[0]);
    }
  }, [availableMonths, activeMonth]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Time Machine</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => setYearPickerVisible(true)}
            style={styles.yearButton}
          >
            <Text style={styles.yearButtonText}>{year ?? '—'}</Text>
          </Pressable>
        </View>

        {/* Month Timeline */}
        {availableMonths.length > 0 && year && (
          <MonthTimeline
            availableMonths={availableMonths}
            activeMonth={activeMonth}
            year={year}
            onMonthPress={scrollToMonth}
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
          </View>
        ) : null}

        {/* Cards ScrollView */}
        {!loading && !error && (
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
              useNativeDriver: false,
              listener: handleScroll,
            })}
            scrollEventThrottle={16}
          >
            {/* Render events */}
            {events.map((event, index) => (
              <View
                key={event.id}
                onLayout={(e) => {
                  if (event.dateISO) {
                    const month = parseInt(event.dateISO.split('-')[1], 10);
                    if (index === 0 || !cardPositions.current.has(month)) {
                      handleCardLayout(month, e.nativeEvent.layout.y);
                    }
                  }
                }}
              >
                <TimeMachineCard {...event} onPress={handleEventPress} />
              </View>
            ))}

            {/* Bottom spacing */}
            <View style={styles.bottomSpacer} />

            {/* Back button */}
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <Text style={styles.backText}>← Back to Home</Text>
            </Pressable>
          </ScrollView>
        )}
      </View>

      {/* Year Picker Modal */}
      <Modal
        transparent
        visible={isYearPickerVisible}
        animationType="fade"
        onRequestClose={() => setYearPickerVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Select a year</Text>
            {availableYears.map((option) => (
              <Pressable
                key={option}
                accessibilityRole="button"
                onPress={() => {
                  // Security: Debounce year selection to prevent rapid tapping abuse
                  const now = Date.now();
                  if (now - lastYearLoadTime.current < YEAR_LOAD_DEBOUNCE_MS) {
                    return; // Ignore rapid taps
                  }
                  lastYearLoadTime.current = now;

                  setYearPickerVisible(false);
                  trackEvent('time_machine_year_selected', { year: option });
                  loadTimeline(option);
                }}
                style={styles.modalOption}
              >
                <Text style={styles.modalOptionLabel}>{option}</Text>
              </Pressable>
            ))}
            <Pressable
              accessibilityRole="button"
              onPress={() => setYearPickerVisible(false)}
              style={styles.modalCancel}
            >
              <Text style={styles.modalCancelLabel}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const buildStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
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
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.lg,
    },
    title: {
      fontFamily: 'serif',
      fontSize: 32,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    yearButton: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.radius.pill,
      borderWidth: 1,
      borderColor: theme.colors.borderSubtle,
      backgroundColor: theme.colors.surface,
      minHeight: 44,
      justifyContent: 'center',
    },
    yearButtonText: {
      fontFamily: 'System',
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    centerContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.xl,
    },
    loading: {
      fontFamily: 'System',
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    error: {
      fontFamily: 'System',
      fontSize: 14,
      color: theme.colors.borderStrong,
      textAlign: 'center',
    },
    scrollContent: {
      paddingTop: theme.spacing.xl,
      gap: theme.spacing.xl,
    },
    bottomSpacer: {
      height: theme.spacing.xxl,
    },
    backButton: {
      alignSelf: 'center',
      paddingVertical: theme.spacing.lg,
    },
    backText: {
      fontFamily: 'System',
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    modalContainer: {
      width: '100%',
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.lg,
      gap: theme.spacing.sm,
    },
    modalTitle: {
      fontFamily: 'serif',
      fontSize: 22,
      fontWeight: '600',
      color: theme.colors.textPrimary,
      marginBottom: theme.spacing.sm,
    },
    modalOption: {
      paddingVertical: theme.spacing.sm,
    },
    modalOptionLabel: {
      fontFamily: 'System',
      fontSize: 16,
      color: theme.colors.textPrimary,
    },
    modalCancel: {
      marginTop: theme.spacing.sm,
      paddingVertical: theme.spacing.sm,
    },
    modalCancelLabel: {
      fontFamily: 'System',
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
  });

export default TimeMachineScreen;
