import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  PanResponder,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';

import { useAppTheme } from '@/theme';
import {
  TIME_MACHINE_MAX_YEAR,
  TIME_MACHINE_MIN_YEAR,
  clampTimeMachineYear,
} from '@/utils/time-machine';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SLIDER_PADDING = 44;
const SLIDER_WIDTH = SCREEN_WIDTH - SLIDER_PADDING * 2;
const AUTO_ENTER_DELAY_MS = 400;

type YearSelectorProps = {
  initialYear: number;
  onYearChange?: (year: number) => void;
  onYearCommit: (year: number) => void;
  minYear?: number;
  maxYear?: number;
};

export const YearSelector: React.FC<YearSelectorProps> = ({
  initialYear,
  onYearChange,
  onYearCommit,
  minYear = TIME_MACHINE_MIN_YEAR,
  maxYear = TIME_MACHINE_MAX_YEAR,
}) => {
  const theme = useAppTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);

  const [selectedYear, setSelectedYear] = useState(clampTimeMachineYear(initialYear));
  const animatedPosition = useRef(new Animated.Value(0)).current;
  const lastPosition = useRef(0);
  const lastHapticYear = useRef(selectedYear);
  const autoEnterTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const yearToPosition = useCallback(
    (year: number) => {
      const boundedYear = Math.min(maxYear, Math.max(minYear, year));
      const percentage = (boundedYear - minYear) / (maxYear - minYear);
      return percentage * SLIDER_WIDTH;
    },
    [maxYear, minYear]
  );

  const positionToYear = useCallback(
    (position: number) => {
      const clampedPosition = Math.max(0, Math.min(SLIDER_WIDTH, position));
      const percentage = clampedPosition / SLIDER_WIDTH;
      return Math.round(minYear + percentage * (maxYear - minYear));
    },
    [maxYear, minYear]
  );

  useEffect(() => {
    const nextYear = clampTimeMachineYear(initialYear);
    setSelectedYear(nextYear);
    const nextPosition = yearToPosition(nextYear);
    animatedPosition.setValue(nextPosition);
    lastPosition.current = nextPosition;
    lastHapticYear.current = nextYear;
  }, [animatedPosition, initialYear, yearToPosition]);

  useEffect(() => {
    return () => {
      if (autoEnterTimeout.current) {
        clearTimeout(autoEnterTimeout.current);
      }
    };
  }, []);

  const triggerHaptic = useCallback(() => {
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync().catch(() => undefined);
    }
  }, []);

  const scheduleCommit = useCallback(
    (year: number) => {
      if (autoEnterTimeout.current) {
        clearTimeout(autoEnterTimeout.current);
      }

      autoEnterTimeout.current = setTimeout(() => {
        onYearCommit(year);
      }, AUTO_ENTER_DELAY_MS);
    },
    [onYearCommit]
  );

  const updateSelectedYear = useCallback(
    (year: number) => {
      const nextYear = clampTimeMachineYear(year);
      setSelectedYear(nextYear);
      onYearChange?.(nextYear);

      if (nextYear !== lastHapticYear.current) {
        lastHapticYear.current = nextYear;
        triggerHaptic();
      }
    },
    [onYearChange, triggerHaptic]
  );

  const animateToYear = useCallback(
    (year: number, shouldCommit: boolean) => {
      const nextYear = clampTimeMachineYear(year);
      const nextPosition = yearToPosition(nextYear);

      Animated.spring(animatedPosition, {
        toValue: nextPosition,
        useNativeDriver: false,
        damping: 22,
        stiffness: 280,
      }).start(() => {
        lastPosition.current = nextPosition;
      });

      updateSelectedYear(nextYear);

      if (shouldCommit) {
        scheduleCommit(nextYear);
      }
    },
    [animatedPosition, scheduleCommit, updateSelectedYear, yearToPosition]
  );

  const tickMarks = useMemo(() => {
    const ticks: { year: number; isMajor: boolean }[] = [];
    for (let year = minYear; year <= maxYear; year += 10) {
      ticks.push({ year, isMajor: year % 50 === 0 });
    }
    return ticks;
  }, [maxYear, minYear]);

  const decadeLabels = useMemo(() => {
    const labels: number[] = [];
    for (let year = minYear; year <= maxYear; year += 50) {
      labels.push(year);
    }
    return labels;
  }, [maxYear, minYear]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          if (autoEnterTimeout.current) {
            clearTimeout(autoEnterTimeout.current);
          }
          animatedPosition.stopAnimation((value) => {
            lastPosition.current = value;
          });
        },
        onPanResponderMove: (_, gestureState) => {
          const nextPosition = Math.max(0, Math.min(SLIDER_WIDTH, lastPosition.current + gestureState.dx));
          animatedPosition.setValue(nextPosition);
          updateSelectedYear(positionToYear(nextPosition));
        },
        onPanResponderRelease: (_, gestureState) => {
          const nextPosition = Math.max(0, Math.min(SLIDER_WIDTH, lastPosition.current + gestureState.dx));
          const nextYear = positionToYear(nextPosition);
          animateToYear(nextYear, true);
        },
      }),
    [animateToYear, animatedPosition, positionToYear, updateSelectedYear]
  );

  const handleAccessibilityAction = useCallback(
    (actionName: string) => {
      if (actionName === 'activate') {
        scheduleCommit(selectedYear);
        return;
      }

      const delta = actionName === 'increment' ? 1 : -1;
      animateToYear(selectedYear + delta, true);
    },
    [animateToYear, scheduleCommit, selectedYear]
  );

  return (
    <View style={styles.container}>
      <View style={styles.ambientCircleLarge} />
      <View style={styles.ambientCircleSmall} />

      <Text style={styles.yearDisplay}>{selectedYear}</Text>

      <View
        accessibilityRole="adjustable"
        accessibilityLabel={`Year selector, ${selectedYear}`}
        accessibilityActions={[
          { name: 'increment', label: 'Next year' },
          { name: 'decrement', label: 'Previous year' },
          { name: 'activate', label: 'Travel to this year' },
        ]}
        onAccessibilityAction={({ nativeEvent }) => handleAccessibilityAction(nativeEvent.actionName)}
        style={styles.sliderShell}
      >
        <View style={styles.tickField}>
          {tickMarks.map(({ year, isMajor }) => (
            <View
              key={year}
              style={[
                styles.tick,
                isMajor && styles.tickMajor,
                { left: yearToPosition(year) },
              ]}
            />
          ))}
        </View>

        <View style={styles.trackGlow} />
        <View style={styles.track} />

        <Animated.View
          style={[
            styles.thumbContainer,
            {
              transform: [{ translateX: animatedPosition }],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <View style={styles.thumbAura} />
          <View style={styles.thumbStem} />
          <View style={styles.thumb} />
        </Animated.View>

        <View style={styles.labelRow}>
          {decadeLabels.map((year) => (
            <Text
              key={year}
              style={[
                styles.decadeLabel,
                { left: yearToPosition(year) - 18 },
              ]}
            >
              {year}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
};

const buildStyles = (theme: ReturnType<typeof useAppTheme>) => {
  const serifFamily = Platform.select({
    ios: 'Times New Roman',
    android: 'serif',
    default: 'serif',
  });
  const sansFamily = Platform.select({
    ios: 'System',
    android: 'sans-serif',
    default: 'System',
  });

  return StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.screen,
      paddingHorizontal: theme.spacing.xl,
      overflow: 'hidden',
    },
    ambientCircleLarge: {
      position: 'absolute',
      width: 260,
      height: 260,
      borderRadius: 130,
      backgroundColor: theme.colors.accentSoft,
      top: '22%',
      opacity: 0.45,
    },
    ambientCircleSmall: {
      position: 'absolute',
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: theme.colors.surfaceSubtle,
      bottom: '24%',
      right: 36,
      opacity: 0.9,
    },
    yearDisplay: {
      fontFamily: serifFamily,
      fontSize: 86,
      lineHeight: 92,
      letterSpacing: -2.8,
      color: theme.colors.textPrimary,
      marginBottom: theme.spacing.xxl,
    },
    sliderShell: {
      width: SLIDER_WIDTH,
      height: 132,
      justifyContent: 'center',
    },
    tickField: {
      position: 'absolute',
      width: '100%',
      top: 28,
      height: 24,
    },
    tick: {
      position: 'absolute',
      width: 1,
      height: 12,
      backgroundColor: theme.colors.borderSubtle,
      opacity: 0.55,
    },
    tickMajor: {
      height: 22,
      backgroundColor: theme.colors.textTertiary,
      opacity: 0.8,
    },
    trackGlow: {
      position: 'absolute',
      width: '100%',
      height: 18,
      borderRadius: 9,
      backgroundColor: theme.colors.accentSoft,
      opacity: 0.5,
      top: 42,
    },
    track: {
      position: 'absolute',
      width: '100%',
      height: 2,
      borderRadius: 1,
      backgroundColor: theme.colors.borderStrong,
      top: 50,
    },
    thumbContainer: {
      position: 'absolute',
      top: 22,
      marginLeft: -18,
      width: 36,
      alignItems: 'center',
    },
    thumbAura: {
      position: 'absolute',
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.colors.accentSoft,
      top: 8,
    },
    thumbStem: {
      width: 2,
      height: 46,
      backgroundColor: theme.colors.textPrimary,
      borderRadius: 999,
      opacity: 0.8,
    },
    thumb: {
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: theme.colors.textPrimary,
      marginTop: -3,
      shadowColor: theme.colors.shadowColor,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 5,
    },
    labelRow: {
      position: 'absolute',
      width: '100%',
      top: 72,
      height: 20,
    },
    decadeLabel: {
      position: 'absolute',
      width: 36,
      textAlign: 'center',
      fontFamily: sansFamily,
      fontSize: 10,
      fontWeight: '500',
      color: theme.colors.textTertiary,
      letterSpacing: 0.3,
    },
  });
};

export default YearSelector;
