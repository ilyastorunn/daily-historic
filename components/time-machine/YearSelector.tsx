import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';

import { useAppTheme } from '@/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Year range configuration
const MIN_YEAR = 1800;
const MAX_YEAR = new Date().getFullYear();
const DEFAULT_YEAR = 1969;

// Slider configuration
const SLIDER_PADDING = 40;
const SLIDER_WIDTH = SCREEN_WIDTH - SLIDER_PADDING * 2;
const TICK_HEIGHT = 12;
const TICK_HEIGHT_MAJOR = 20;

type YearSelectorProps = {
  onYearSelect: (year: number) => void;
  onRandomYear: () => void;
  initialYear?: number;
};

export const YearSelector: React.FC<YearSelectorProps> = ({
  onYearSelect,
  onRandomYear,
  initialYear = DEFAULT_YEAR,
}) => {
  const theme = useAppTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);

  const [selectedYear, setSelectedYear] = useState(initialYear);

  // Calculate initial position from year
  const yearToPosition = useCallback((year: number) => {
    const percentage = (year - MIN_YEAR) / (MAX_YEAR - MIN_YEAR);
    return percentage * SLIDER_WIDTH;
  }, []);

  // Calculate year from position
  const positionToYear = useCallback((position: number) => {
    const clampedPosition = Math.max(0, Math.min(SLIDER_WIDTH, position));
    const percentage = clampedPosition / SLIDER_WIDTH;
    return Math.round(MIN_YEAR + percentage * (MAX_YEAR - MIN_YEAR));
  }, []);

  // Animation value for thumb position
  const pan = useRef(new Animated.Value(yearToPosition(initialYear))).current;
  const lastPosition = useRef(yearToPosition(initialYear));
  const lastHapticYear = useRef(initialYear);

  // Haptic feedback on year change
  const triggerHaptic = useCallback(() => {
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync();
    }
  }, []);

  // PanResponder for drag handling
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          // Store current position when drag starts
          pan.stopAnimation((value) => {
            lastPosition.current = value;
          });
        },
        onPanResponderMove: (_, gestureState) => {
          const newPosition = lastPosition.current + gestureState.dx;
          const clampedPosition = Math.max(0, Math.min(SLIDER_WIDTH, newPosition));
          pan.setValue(clampedPosition);

          const newYear = positionToYear(clampedPosition);
          if (newYear !== lastHapticYear.current) {
            lastHapticYear.current = newYear;
            setSelectedYear(newYear);
            triggerHaptic();
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          const finalPosition = lastPosition.current + gestureState.dx;
          const clampedPosition = Math.max(0, Math.min(SLIDER_WIDTH, finalPosition));
          const finalYear = positionToYear(clampedPosition);

          lastPosition.current = clampedPosition;
          setSelectedYear(finalYear);

          // Snap animation to final position
          Animated.spring(pan, {
            toValue: yearToPosition(finalYear),
            useNativeDriver: false,
            damping: 20,
            stiffness: 300,
          }).start(() => {
            lastPosition.current = yearToPosition(finalYear);
          });
        },
      }),
    [pan, positionToYear, yearToPosition, triggerHaptic]
  );

  // Handle continue press
  const handleContinue = useCallback(() => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onYearSelect(selectedYear);
  }, [selectedYear, onYearSelect]);

  // Handle random year
  const handleRandomYear = useCallback(() => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onRandomYear();
  }, [onRandomYear]);

  // Generate tick marks
  const tickMarks = useMemo(() => {
    const ticks: { year: number; isMajor: boolean }[] = [];
    // Major ticks every 50 years, minor every 10
    for (let year = MIN_YEAR; year <= MAX_YEAR; year += 10) {
      ticks.push({
        year,
        isMajor: year % 50 === 0,
      });
    }
    return ticks;
  }, []);

  // Decade labels (every 50 years)
  const decadeLabels = useMemo(() => {
    const labels: number[] = [];
    for (let year = 1850; year <= MAX_YEAR; year += 50) {
      labels.push(year);
    }
    return labels;
  }, []);

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.label}>TIME MACHINE</Text>
        <Text style={styles.title}>Choose your destination</Text>
        <Text style={styles.subtitle}>
          Slide to select a year and explore history
        </Text>
      </View>

      {/* Year Display */}
      <View style={styles.yearDisplayContainer}>
        <Text style={styles.yearDisplay}>{selectedYear}</Text>
        <Text style={styles.yearUnit}>year</Text>
      </View>

      {/* Slider Container */}
      <View style={styles.sliderContainer}>
        {/* Tick Marks */}
        <View style={styles.ticksContainer}>
          {tickMarks.map(({ year, isMajor }) => {
            const position = yearToPosition(year);
            return (
              <View
                key={year}
                style={[
                  styles.tick,
                  isMajor && styles.tickMajor,
                  { left: position - 0.5 },
                ]}
              />
            );
          })}
        </View>

        {/* Slider Track */}
        <View style={styles.sliderTrack} />

        {/* Draggable Thumb */}
        <Animated.View
          style={[
            styles.thumbContainer,
            {
              transform: [{ translateX: pan }],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <View style={styles.thumbLine} />
          <View style={styles.thumbKnob} />
        </Animated.View>

        {/* Decade Labels */}
        <View style={styles.labelsContainer}>
          {decadeLabels.map((year) => {
            const position = yearToPosition(year);
            return (
              <Text
                key={year}
                style={[
                  styles.decadeLabel,
                  { left: position - 20 },
                ]}
              >
                {year}
              </Text>
            );
          })}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <Pressable
          onPress={handleContinue}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.primaryButtonPressed,
          ]}
        >
          <Text style={styles.primaryButtonText}>Explore {selectedYear}</Text>
        </Pressable>

        <Pressable
          onPress={handleRandomYear}
          style={({ pressed }) => [
            styles.ghostButton,
            pressed && styles.ghostButtonPressed,
          ]}
        >
          <Text style={styles.ghostButtonText}>Surprise me</Text>
        </Pressable>
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
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.xxl,
    },
    header: {
      alignItems: 'center',
      marginBottom: theme.spacing.xxl,
    },
    label: {
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 2,
      color: theme.colors.textTertiary,
      fontFamily: sansFamily,
      marginBottom: theme.spacing.sm,
    },
    title: {
      fontSize: 28,
      lineHeight: 34,
      fontFamily: serifFamily,
      color: theme.colors.textPrimary,
      textAlign: 'center',
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: 15,
      lineHeight: 22,
      color: theme.colors.textSecondary,
      fontFamily: sansFamily,
      textAlign: 'center',
      marginTop: theme.spacing.sm,
      maxWidth: 260,
    },
    yearDisplayContainer: {
      alignItems: 'center',
      marginBottom: theme.spacing.xxl,
    },
    yearDisplay: {
      fontSize: 72,
      fontWeight: '300',
      color: theme.colors.textPrimary,
      fontFamily: sansFamily,
      letterSpacing: -2,
    },
    yearUnit: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.textTertiary,
      fontFamily: sansFamily,
      letterSpacing: 1,
      marginTop: theme.spacing.xs,
    },
    sliderContainer: {
      width: SLIDER_WIDTH,
      height: 100,
      justifyContent: 'center',
      marginBottom: theme.spacing.xxl,
    },
    ticksContainer: {
      position: 'absolute',
      width: '100%',
      height: TICK_HEIGHT_MAJOR,
      top: 20,
    },
    tick: {
      position: 'absolute',
      width: 1,
      height: TICK_HEIGHT,
      backgroundColor: theme.colors.borderSubtle,
    },
    tickMajor: {
      height: TICK_HEIGHT_MAJOR,
      backgroundColor: theme.colors.textTertiary,
    },
    sliderTrack: {
      position: 'absolute',
      width: '100%',
      height: 2,
      backgroundColor: theme.colors.borderSubtle,
      top: 40,
    },
    thumbContainer: {
      position: 'absolute',
      alignItems: 'center',
      top: 10,
      // Larger hit area for easier dragging
      paddingHorizontal: 20,
      marginLeft: -20,
    },
    thumbLine: {
      width: 2,
      height: 40,
      backgroundColor: theme.colors.textPrimary,
    },
    thumbKnob: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: theme.colors.textPrimary,
      marginTop: -2,
      shadowColor: theme.colors.shadowColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    labelsContainer: {
      position: 'absolute',
      width: '100%',
      top: 60,
    },
    decadeLabel: {
      position: 'absolute',
      width: 40,
      fontSize: 11,
      fontWeight: '500',
      color: theme.colors.textTertiary,
      fontFamily: sansFamily,
      textAlign: 'center',
    },
    actions: {
      width: '100%',
      gap: theme.spacing.md,
      marginTop: theme.spacing.lg,
    },
    primaryButton: {
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.accentPrimary,
      paddingVertical: theme.spacing.lg,
      borderRadius: theme.radius.pill,
      shadowColor: theme.colors.shadowColor,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.15,
      shadowRadius: 18,
      elevation: 4,
    },
    primaryButtonPressed: {
      transform: [{ scale: 0.98 }],
      opacity: 0.95,
    },
    primaryButtonText: {
      color: theme.colors.surface,
      fontWeight: '600',
      fontSize: 17,
      letterSpacing: 0.2,
      fontFamily: sansFamily,
    },
    ghostButton: {
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.md,
      borderRadius: theme.radius.pill,
    },
    ghostButtonPressed: {
      opacity: 0.7,
    },
    ghostButtonText: {
      color: theme.colors.textSecondary,
      fontWeight: '500',
      fontSize: 15,
      fontFamily: sansFamily,
    },
  });
};

export default YearSelector;
