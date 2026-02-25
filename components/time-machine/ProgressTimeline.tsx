import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/theme';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

type ProgressTimelineProps = {
  availableMonths: number[];
  activeMonth: number;
  currentIndex: number;
  totalEvents: number;
};

export const ProgressTimeline = memo<ProgressTimelineProps>(
  ({ availableMonths, activeMonth, currentIndex, totalEvents }) => {
    const theme = useAppTheme();
    const styles = buildStyles(theme);

    // Calculate progress (0-1)
    const progress = totalEvents > 0 ? currentIndex / (totalEvents - 1) : 0;

    return (
      <View style={styles.container}>
        {/* Progress line container */}
        <View style={styles.lineContainer}>
          {/* Background line */}
          <View style={styles.lineBg} />

          {/* Active progress line */}
          <View style={[styles.lineActive, { width: `${progress * 100}%` }]} />

          {/* Month markers */}
          {availableMonths.map((month) => {
            const isActive = month === activeMonth;
            // Position marker at month (1-12 → 0%-100%)
            const position = ((month - 1) / 11) * 100;

            return (
              <View
                key={month}
                style={[
                  styles.marker,
                  { left: `${position}%` },
                ]}
              >
                <View style={[styles.markerDot, isActive && styles.markerDotActive]} />
                {isActive ? (
                  <Text style={styles.markerLabel}>{MONTH_LABELS[month - 1]}</Text>
                ) : null}
              </View>
            );
          })}
        </View>
      </View>
    );
  }
);

ProgressTimeline.displayName = 'ProgressTimeline';

const buildStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.lg,
      backgroundColor: theme.colors.appBackground,
    },
    lineContainer: {
      position: 'relative',
      height: 32,
      justifyContent: 'center',
    },
    lineBg: {
      position: 'absolute',
      left: 0,
      right: 0,
      height: 2,
      backgroundColor: theme.colors.borderSubtle,
      borderRadius: 1,
    },
    lineActive: {
      position: 'absolute',
      left: 0,
      height: 2,
      backgroundColor: theme.colors.accentPrimary,
      borderRadius: 1,
    },
    marker: {
      position: 'absolute',
      top: -4,
      alignItems: 'center',
      transform: [{ translateX: -6 }], // Center dot on position
    },
    markerDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: theme.colors.surface,
      borderWidth: 2,
      borderColor: theme.colors.borderSubtle,
    },
    markerDotActive: {
      borderColor: theme.colors.accentPrimary,
      backgroundColor: theme.colors.accentPrimary,
    },
    markerLabel: {
      fontFamily: 'System',
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.accentPrimary,
      marginTop: 4,
      letterSpacing: 0.3,
    },
  });
