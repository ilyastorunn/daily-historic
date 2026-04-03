import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
const STICKY_NAV_THRESHOLD = 30;

const TimeMachineYearScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const blurTint = theme.mode === 'dark' ? 'dark' : 'light';
  const { year: yearParam } = useLocalSearchParams<{ year?: string | string[] }>();
  const [showAll, setShowAll] = useState(false);
  const [isStickyNavActive, setIsStickyNavActive] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const stickyNavActiveRef = useRef(false);

  const resolvedYearParam = Array.isArray(yearParam) ? yearParam[0] : yearParam;
  const parsedYear = resolvedYearParam ? Number.parseInt(resolvedYearParam, 10) : Number.NaN;
  const validYear = isValidTimeMachineYear(parsedYear) ? parsedYear : null;

  const { data, loading, error, refresh } = useTimeMachine({
    year: validYear,
    enabled: validYear !== null,
  });

  const visibleSections = useMemo(() => {
    if (!data) {
      return [];
    }

    if (showAll) {
      return data.sections;
    }

    return data.sections
      .map((section) => ({
        ...section,
        events:
          section.highlightedCount > 0
            ? section.events.slice(0, section.highlightedCount)
            : [],
      }))
      .filter((section) => section.events.length > 0);
  }, [data, showAll]);

  const listSections = useMemo(
    () =>
      visibleSections.map((section) => ({
        ...section,
        data: section.events,
      })) as TimeMachineListSection[],
    [visibleSections]
  );

  const overlayNavOpacity = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [0, 18, 52],
        outputRange: [1, 0.86, 0],
        extrapolate: 'clamp',
      }),
    [scrollY]
  );
  const overlayNavTranslateY = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [0, 52],
        outputRange: [0, -8],
        extrapolate: 'clamp',
      }),
    [scrollY]
  );
  const stickyNavOpacity = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [12, 36, 60],
        outputRange: [0, 0.42, 1],
        extrapolate: 'clamp',
      }),
    [scrollY]
  );
  const stickyNavTranslateY = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [12, 60],
        outputRange: [-6, 0],
        extrapolate: 'clamp',
      }),
    [scrollY]
  );

  useEffect(() => {
    scrollY.setValue(0);
    stickyNavActiveRef.current = false;
    setIsStickyNavActive(false);
  }, [scrollY, validYear]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleEventPress = useCallback(
    (eventId: string) => {
      const currentYear = data?.year ?? validYear;
      trackEvent('time_machine_event_opened', { event_id: eventId, year: currentYear });
      router.push({ pathname: '/event/[id]', params: { id: eventId, source: 'time-machine' } });
    },
    [data?.year, router, validYear]
  );

  const handleShowMore = useCallback(() => {
    if (!data) {
      return;
    }

    setShowAll(true);
    trackEvent('time_machine_overflow_expanded', {
      year: data.year,
      overflow_count: data.overflowCount,
    });
  }, [data]);

  const handleScroll = useMemo(
    () =>
      Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        {
          useNativeDriver: true,
          listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
            const offsetY = event.nativeEvent.contentOffset.y;
            const shouldShowStickyNav = offsetY > STICKY_NAV_THRESHOLD;

            if (shouldShowStickyNav !== stickyNavActiveRef.current) {
              stickyNavActiveRef.current = shouldShowStickyNav;
              setIsStickyNavActive(shouldShowStickyNav);
            }
          },
        }
      ),
    [scrollY]
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
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
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
                data.overflowCount > 0 && !showAll ? (
                  <Pressable
                    onPress={handleShowMore}
                    style={({ pressed }) => [
                      styles.showMoreButton,
                      pressed && styles.primaryButtonPressed,
                    ]}
                  >
                    <Text style={styles.showMoreText}>Show more from {data.year}</Text>
                  </Pressable>
                ) : !loading && data.publishState === 'empty' ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.stateTitle}>Curation in progress.</Text>
                    <Text style={styles.helperText}>{data.summary}</Text>
                  </View>
                ) : (
                  <View style={styles.bottomSpacer} />
                )
              }
              renderSectionHeader={({ section }) => (
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionLine} />
                  <Text style={styles.sectionTitle}>{section.label}</Text>
                </View>
              )}
              renderItem={({ item }) => (
                <View style={styles.cardWrap}>
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
              pointerEvents={isStickyNavActive ? 'none' : 'auto'}
              style={[
                styles.overlayNav,
                {
                  top: insets.top + theme.spacing.lg,
                  opacity: overlayNavOpacity,
                  transform: [{ translateY: overlayNavTranslateY }],
                },
              ]}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Go back to year explorer"
                onPress={handleBack}
                style={({ pressed }) => [styles.overlayNavButton, pressed && styles.overlayNavButtonPressed]}
              >
                <Ionicons name="chevron-back" size={18} color={theme.colors.overlayText} />
                <Text style={styles.overlayNavLabel}>Back</Text>
              </Pressable>
              <Text style={styles.overlayYear}>{validYear}</Text>
              <View style={styles.overlaySpacer} />
            </Animated.View>

            <Animated.View
              pointerEvents={isStickyNavActive ? 'auto' : 'none'}
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
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Go back to year explorer"
                  onPress={handleBack}
                  style={({ pressed }) => [styles.stickyBackButton, pressed && styles.overlayNavButtonPressed]}
                >
                  <Ionicons name="chevron-back" size={18} color={theme.colors.textPrimary} />
                  <Text style={styles.stickyBackLabel}>Back</Text>
                </Pressable>
                <Text style={styles.stickyYear}>{validYear}</Text>
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
    overlayNav: {
      position: 'absolute',
      left: theme.spacing.lg,
      right: theme.spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      zIndex: 100,
      elevation: 100,
    },
    overlayNavButton: {
      minWidth: 78,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.radius.pill,
      backgroundColor: 'rgba(12, 10, 6, 0.45)',
    },
    overlayNavButtonPressed: {
      opacity: 0.86,
    },
    overlayNavLabel: {
      fontFamily: sansFamily,
      fontSize: 13,
      color: theme.colors.overlayText,
      textShadowColor: 'rgba(12, 10, 6, 0.42)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 6,
    },
    overlayYear: {
      fontFamily: serifFamily,
      fontSize: 24,
      color: theme.colors.overlayText,
      letterSpacing: -0.4,
      textShadowColor: 'rgba(12, 10, 6, 0.48)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 10,
    },
    overlaySpacer: {
      minWidth: 78,
      height: 36,
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
    stickyBackButton: {
      minWidth: 84,
      minHeight: 50,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      gap: theme.spacing.xs,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.sm,
    },
    stickyBackLabel: {
      fontFamily: sansFamily,
      fontSize: 13,
      color: theme.colors.textPrimary,
    },
    stickyYear: {
      position: 'absolute',
      left: theme.spacing.lg,
      right: theme.spacing.lg,
      textAlign: 'center',
      fontFamily: serifFamily,
      fontSize: 22,
      color: theme.colors.textPrimary,
      letterSpacing: -0.35,
    },
    stickyRightSpacer: {
      width: 84,
      height: 50,
    },
    listContent: {
      paddingBottom: theme.spacing.xxl,
    },
    sectionHeader: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.xl,
      paddingBottom: theme.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    sectionLine: {
      flex: 1,
      height: 1,
      backgroundColor: theme.colors.borderSubtle,
    },
    sectionTitle: {
      fontFamily: sansFamily,
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: theme.colors.textTertiary,
    },
    cardWrap: {
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
    },
    showMoreButton: {
      marginTop: theme.spacing.lg,
      marginHorizontal: theme.spacing.lg,
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.accentPrimary,
      paddingVertical: theme.spacing.lg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    showMoreText: {
      fontFamily: sansFamily,
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.surface,
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
    bottomSpacer: {
      height: theme.spacing.xl,
    },
  });
};

export default TimeMachineYearScreen;
