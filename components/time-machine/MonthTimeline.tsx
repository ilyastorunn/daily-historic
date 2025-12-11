import React, { memo, useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/theme';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

type MonthTimelineProps = {
  availableMonths: number[];
  activeMonth: number;
  year: number;
  onMonthPress: (month: number) => void;
};

export const MonthTimeline = memo<MonthTimelineProps>(
  ({ availableMonths, activeMonth, year, onMonthPress }) => {
    const theme = useAppTheme();
    const styles = buildStyles(theme);

    if (availableMonths.length === 0) {
      return null;
    }

    return (
      <View style={styles.container}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {availableMonths.map((month) => (
            <MonthChip
              key={month}
              month={month}
              isActive={month === activeMonth}
              onPress={() => onMonthPress(month)}
            />
          ))}
        </ScrollView>
      </View>
    );
  }
);

MonthTimeline.displayName = 'MonthTimeline';

type MonthChipProps = {
  month: number;
  isActive: boolean;
  onPress: () => void;
};

const MonthChip = memo<MonthChipProps>(({ month, isActive, onPress }) => {
  const theme = useAppTheme();
  const styles = buildStyles(theme);
  const animatedScale = useRef(new Animated.Value(isActive ? 1.05 : 1)).current;
  const animatedOpacity = useRef(new Animated.Value(isActive ? 1 : 0.92)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(animatedScale, {
        toValue: isActive ? 1.05 : 1,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(animatedOpacity, {
        toValue: isActive ? 1 : 0.92,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [isActive, animatedScale, animatedOpacity]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        isActive && styles.chipActive,
        pressed && styles.chipPressed,
      ]}
    >
      <Animated.View
        style={{
          transform: [{ scale: animatedScale }],
          opacity: animatedOpacity,
        }}
      >
        <Text style={[styles.chipLabel, isActive && styles.chipLabelActive]}>
          {MONTH_LABELS[month - 1]}
        </Text>
      </Animated.View>
    </Pressable>
  );
});

MonthChip.displayName = 'MonthChip';

const buildStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.appBackground,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.borderSubtle,
      paddingVertical: theme.spacing.sm,
    },
    scrollContent: {
      paddingHorizontal: theme.spacing.xl,
      gap: theme.spacing.sm,
    },
    chip: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.radius.pill,
      borderWidth: 1,
      borderColor: theme.colors.borderSubtle,
      backgroundColor: theme.colors.surface,
      minHeight: 44,
      justifyContent: 'center',
      alignItems: 'center',
    },
    chipActive: {
      backgroundColor: theme.colors.accentPrimary,
      borderColor: theme.colors.accentPrimary,
    },
    chipPressed: {
      opacity: 0.85,
    },
    chipLabel: {
      fontFamily: 'System',
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.textPrimary,
      letterSpacing: 0.3,
    },
    chipLabelActive: {
      color: theme.colors.textInverse,
    },
  });
