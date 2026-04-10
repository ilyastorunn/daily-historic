import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { TimelineCard } from '@/components/time-machine/TimelineCard';
import { YearSummaryCard } from '@/components/time-machine/YearSummaryCard';
import { useTimeMachine } from '@/hooks/use-time-machine';
import { trackEvent } from '@/services/analytics';
import { useAppTheme } from '@/theme';
import type { TimeMachineSection, TimeMachineTimelineEvent } from '@/types/time-machine';
import { isValidTimeMachineYear } from '@/utils/time-machine';

type TimeMachineListSection = TimeMachineSection & {
  data: TimeMachineTimelineEvent[];
};

const AnimatedSectionList = Animated.SectionList<TimeMachineTimelineEvent, TimeMachineListSection>;
const MONTH_NAV_APPEAR_SCROLL = 72;
const MONTH_LABEL_FADE_OUT_MS = 90;
const MONTH_LABEL_FADE_IN_MS = 160;

type TimeMachineViewToken = ViewToken<TimeMachineTimelineEvent> & {
  section?: TimeMachineListSection;
};

const TimeMachineYearScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const blurTint = theme.mode === 'dark' ? 'dark' : 'light';
  const { year: yearParam } = useLocalSearchParams<{ year?: string | string[] }>();
  const [displayMonthLabel, setDisplayMonthLabel] = useState<string | null>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const stickyMonthOpacity = useRef(new Animated.Value(0)).current;
  const scrollOffsetRef = useRef(0);
  const trackedMonthRef = useRef<string | null>(null);
  const visibleMonthCandidateRef = useRef<string | null>(null);
  const displayedMonthLabelRef = useRef<string | null>(null);
  const sectionsRef = useRef<TimeMachineListSection[]>([]);

  const resolvedYearParam = Array.isArray(yearParam) ? yearParam[0] : yearParam;
  const parsedYear = resolvedYearParam ? Number.parseInt(resolvedYearParam, 10) : Number.NaN;
  const validYear = isValidTimeMachineYear(parsedYear) ? parsedYear : null;

  const { data, loading, error, refresh } = useTimeMachine({
    year: validYear,
    enabled: validYear !== null,
  });

  const visibleSections = useMemo(() => data?.sections ?? [], [data]);

  const listSections = useMemo(
    () =>
      visibleSections.map((section) => ({
        ...section,
        data: section.events,
      })) as TimeMachineListSection[],
    [visibleSections]
  );
  sectionsRef.current = listSections;

  const stickyNavOpacity = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [0, 24, 84, 168],
        outputRange: [0.68, 0.74, 0.9, 1],
        extrapolate: 'clamp',
      }),
    [scrollY]
  );
  const stickyNavTranslateY = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [0, 168],
        outputRange: [-6, 0],
        extrapolate: 'clamp',
      }),
    [scrollY]
  );
  const stickyBarFillOpacity = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [0, 36, 96, 180],
        outputRange: [0, 0.12, 0.48, 1],
        extrapolate: 'clamp',
      }),
    [scrollY]
  );
  const firstRenderedMonth = listSections[0]?.month ?? null;

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const updateDisplayedMonthLabel = useCallback(
    (nextLabel: string | null) => {
      if (nextLabel === displayedMonthLabelRef.current) {
        return;
      }

      const commitLabel = (label: string | null) => {
        displayedMonthLabelRef.current = label;
        setDisplayMonthLabel(label);
      };

      stickyMonthOpacity.stopAnimation();

      if (nextLabel === null) {
        Animated.timing(stickyMonthOpacity, {
          toValue: 0,
          duration: MONTH_LABEL_FADE_OUT_MS,
          useNativeDriver: true,
        }).start(({ finished }) => {
          if (finished) {
            commitLabel(null);
          }
        });
        return;
      }

      if (displayedMonthLabelRef.current === null) {
        commitLabel(nextLabel);
        stickyMonthOpacity.setValue(0);
        Animated.timing(stickyMonthOpacity, {
          toValue: 1,
          duration: MONTH_LABEL_FADE_IN_MS,
          useNativeDriver: true,
        }).start();
        return;
      }

      Animated.timing(stickyMonthOpacity, {
        toValue: 0,
        duration: MONTH_LABEL_FADE_OUT_MS,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished) {
          return;
        }

        commitLabel(nextLabel);
        stickyMonthOpacity.setValue(0);
        Animated.timing(stickyMonthOpacity, {
          toValue: 1,
          duration: MONTH_LABEL_FADE_IN_MS,
          useNativeDriver: true,
        }).start();
      });
    },
    [stickyMonthOpacity]
  );

  const updateTrackedMonth = useCallback(
    (nextLabel: string | null) => {
      if (nextLabel === trackedMonthRef.current) {
        return;
      }

      trackedMonthRef.current = nextLabel;
      updateDisplayedMonthLabel(nextLabel);
    },
    [updateDisplayedMonthLabel]
  );

  const handleEventPress = useCallback(
    (eventId: string) => {
      const currentYear = data?.year ?? validYear;
      trackEvent('time_machine_event_opened', { event_id: eventId, year: currentYear });
      router.push({ pathname: '/event/[id]', params: { id: eventId, source: 'time-machine' } });
    },
    [data?.year, router, validYear]
  );

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 55,
    waitForInteraction: false,
  }).current;

  const handleViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: TimeMachineViewToken[] }) => {
      const visibleItems = viewableItems
        .filter(
          (viewableItem) =>
            viewableItem.isViewable &&
            typeof viewableItem.index === 'number' &&
            Boolean(viewableItem.item) &&
            Boolean(viewableItem.section)
        )
        .sort((left, right) => {
          const leftMonth = left.section?.month ?? 99;
          const rightMonth = right.section?.month ?? 99;

          if (leftMonth !== rightMonth) {
            return leftMonth - rightMonth;
          }

          return (left.index ?? 0) - (right.index ?? 0);
        });

      const visibleMonth = visibleItems[0]?.section?.label ?? null;
      visibleMonthCandidateRef.current = visibleMonth;

      if (scrollOffsetRef.current <= MONTH_NAV_APPEAR_SCROLL) {
        updateTrackedMonth(null);
        return;
      }

      if (visibleMonth) {
        updateTrackedMonth(visibleMonth);
      }
    }
  );

  const handleScroll = useMemo(
    () =>
      Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        {
          useNativeDriver: true,
          listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
            const offsetY = event.nativeEvent.contentOffset.y;
            scrollOffsetRef.current = offsetY;

            if (offsetY <= MONTH_NAV_APPEAR_SCROLL) {
              updateTrackedMonth(null);
              return;
            }

            if (!trackedMonthRef.current && visibleMonthCandidateRef.current) {
              updateTrackedMonth(visibleMonthCandidateRef.current);
            }
          },
        }
      ),
    [scrollY, updateTrackedMonth]
  );

  if (validYear === null) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.centerState}>
          <Text style={styles.stateTitle}>This year is out of range.</Text>
          <Pressable onPress={() => router.replace('/time-machine')} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Back to explorer</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <StatusBar style={data ? 'light' : 'auto'} animated />
      <View style={styles.container}>
        {data ? (
          <>
            <AnimatedSectionList
              sections={listSections}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              stickySectionHeadersEnabled={false}
              scrollEventThrottle={16}
              onScroll={handleScroll}
              onViewableItemsChanged={handleViewableItemsChanged.current}
              viewabilityConfig={viewabilityConfig}
              refreshControl={
                refresh ? (
                  <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={theme.colors.accentPrimary} />
                ) : undefined
              }
              ListHeaderComponent={
                <YearSummaryCard
                  year={data.year}
                  coverImageUrl={data.coverImageUrl}
                  editorialIntro={data.editorialIntro}
                  startMonthLabel={data.sections[0]?.label ?? null}
                />
              }
              ListFooterComponent={
                !loading && data.publishState === 'empty' ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.stateTitle}>Curation in progress.</Text>
                    <Text style={styles.helperText}>{data.summary}</Text>
                  </View>
                ) : null
              }
              renderItem={({ item, section, index }) => (
                <View
                  style={[
                    styles.cardWrap,
                    index === 0 && section.month !== firstRenderedMonth ? styles.monthStartCardWrap : null,
                  ]}
                >
                  <TimelineCard
                    id={item.id}
                    title={item.title}
                    summary={item.summary}
                    imageUrl={item.imageUrl}
                    dateISO={item.dateISO}
                    categoryId={item.categoryId}
                    onPress={handleEventPress}
                  />
                </View>
              )}
            />

            <Animated.View
              style={[
                styles.stickyNav,
                {
                  top: insets.top + theme.spacing.sm,
                  opacity: stickyNavOpacity,
                  transform: [{ translateY: stickyNavTranslateY }],
                },
              ]}
            >
              <View style={styles.stickyBar}>
                <BlurView
                  tint={blurTint}
                  intensity={28}
                  experimentalBlurMethod="dimezisBlurView"
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.stickyBarScrim} />
                <Animated.View
                  pointerEvents="none"
                  style={[styles.stickyBarFill, { opacity: stickyBarFillOpacity }]}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Go back to year explorer"
                  onPress={handleBack}
                  style={({ pressed }) => [styles.stickyBackButton, pressed && styles.overlayNavButtonPressed]}
                >
                  <Ionicons name="chevron-back" size={18} color={theme.colors.textPrimary} />
                  <Text style={styles.stickyBackLabel}>Back</Text>
                </Pressable>
                <View pointerEvents="none" style={styles.stickyTitleWrap}>
                  <View style={styles.stickyTitleRow}>
                    <Text style={styles.stickyYear}>{validYear}</Text>
                    {displayMonthLabel ? (
                      <Animated.Text style={[styles.stickyMonth, { opacity: stickyMonthOpacity }]}>
                        {`, ${displayMonthLabel}`}
                      </Animated.Text>
                    ) : null}
                  </View>
                </View>
                <View style={styles.stickyRightSpacer} />
              </View>
            </Animated.View>
          </>
        ) : (
          <>
            <View style={[styles.topBar, { paddingTop: insets.top }]}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Go back to year explorer"
                onPress={handleBack}
                style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
              >
                <Ionicons name="chevron-back" size={22} color={theme.colors.textPrimary} />
              </Pressable>
              <Text style={styles.topBarYear}>{validYear}</Text>
              <View style={styles.topBarSpacer} />
            </View>

            {loading ? (
              <View style={styles.centerState}>
                <Text style={styles.helperText}>Traveling to {validYear}…</Text>
              </View>
            ) : null}

            {!loading && error ? (
              <View style={styles.centerState}>
                <Text style={styles.stateTitle}>Unable to load this year.</Text>
                <Text style={styles.helperText}>Try again or return to the explorer.</Text>
                <Pressable
                  onPress={refresh}
                  style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
                >
                  <Text style={styles.primaryButtonText}>Retry</Text>
                </Pressable>
              </View>
            ) : null}
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const buildStyles = (theme: ReturnType<typeof useAppTheme>) => {
  const sansFamily = Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' });
  const serifFamily = Platform.select({ ios: 'Times New Roman', android: 'serif', default: 'serif' });

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.appBackground,
    },
    container: {
      flex: 1,
      backgroundColor: theme.colors.screen,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.lg,
      backgroundColor: theme.colors.screen,
    },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surface,
    },
    backButtonPressed: {
      opacity: 0.72,
      transform: [{ scale: 0.96 }],
    },
    topBarYear: {
      fontFamily: serifFamily,
      fontSize: 22,
      color: theme.colors.textPrimary,
      letterSpacing: -0.4,
    },
    topBarSpacer: {
      width: 44,
      height: 44,
    },
    overlayNavButtonPressed: {
      opacity: 0.86,
    },
    stickyNav: {
      position: 'absolute',
      left: theme.spacing.lg,
      right: theme.spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      zIndex: 110,
      elevation: 110,
    },
    stickyBar: {
      flex: 1,
      minHeight: 50,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderRadius: theme.radius.lg,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor:
        theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(199, 186, 168, 0.56)',
      backgroundColor:
        theme.mode === 'dark' ? 'rgba(31, 28, 23, 0.70)' : 'rgba(247, 244, 238, 0.78)',
      shadowColor: theme.colors.shadowColor,
      shadowOpacity: 0.10,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 8 },
      elevation: 6,
    },
    stickyBarScrim: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor:
        theme.mode === 'dark' ? 'rgba(31, 28, 23, 0.22)' : 'rgba(247, 244, 238, 0.22)',
    },
    stickyBarFill: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor:
        theme.mode === 'dark' ? 'rgba(31, 28, 23, 0.32)' : 'rgba(247, 244, 238, 0.44)',
    },
    stickyBackButton: {
      minWidth: 84,
      minHeight: 50,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      gap: theme.spacing.xs,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.sm,
      zIndex: 2,
      elevation: 2,
    },
    stickyBackLabel: {
      fontFamily: sansFamily,
      fontSize: 13,
      color: theme.colors.textPrimary,
    },
    stickyRightSpacer: {
      width: 84,
      height: 50,
      zIndex: 2,
    },
    stickyTitleWrap: {
      position: 'absolute',
      left: theme.spacing.xl,
      right: theme.spacing.xl,
      top: 0,
      bottom: 0,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1,
    },
    stickyTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      maxWidth: '72%',
    },
    stickyYear: {
      fontFamily: serifFamily,
      fontSize: 22,
      color: theme.colors.textPrimary,
      letterSpacing: -0.35,
    },
    stickyMonth: {
      fontFamily: sansFamily,
      fontSize: 15,
      color: theme.colors.textSecondary,
      letterSpacing: 0.2,
    },
    listContent: {
      paddingBottom: theme.spacing.sm,
    },
    cardWrap: {
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
    },
    monthStartCardWrap: {
      paddingTop: theme.spacing.lg,
    },
    centerState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.xl,
      gap: theme.spacing.md,
    },
    emptyState: {
      marginTop: theme.spacing.lg,
      paddingHorizontal: theme.spacing.xl,
      gap: theme.spacing.sm,
    },
    stateTitle: {
      textAlign: 'center',
      fontFamily: serifFamily,
      fontSize: 28,
      lineHeight: 34,
      color: theme.colors.textPrimary,
    },
    helperText: {
      textAlign: 'center',
      fontFamily: sansFamily,
      fontSize: 14,
      lineHeight: 21,
      color: theme.colors.textSecondary,
    },
    primaryButton: {
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.accentPrimary,
    },
    primaryButtonPressed: {
      opacity: 0.86,
    },
    primaryButtonText: {
      fontFamily: sansFamily,
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.surface,
    },
  });
};

export default TimeMachineYearScreen;
