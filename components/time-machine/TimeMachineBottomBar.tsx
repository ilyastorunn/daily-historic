import React, { memo, useCallback, useEffect, useRef } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useAppTheme, type ThemeDefinition } from '@/theme';

type TimeMachineBottomBarProps = {
  availableYears: number[];
  currentYear: number | undefined;
  onYearSelect: (year: number) => void;
  onBackPress: () => void;
};

export const TimeMachineBottomBar = memo<TimeMachineBottomBarProps>(
  ({ availableYears, currentYear, onYearSelect, onBackPress }) => {
    const theme = useAppTheme();
    const insets = useSafeAreaInsets();
    const styles = buildStyles(theme);
    const scrollViewRef = useRef<ScrollView>(null);
    const yearRefs = useRef<Map<number, View>>(new Map());

    const bottomInset = Math.max(insets.bottom, theme.spacing.sm);

    // Scroll to selected year when it changes
    useEffect(() => {
      if (currentYear !== undefined && yearRefs.current.has(currentYear)) {
        const yearView = yearRefs.current.get(currentYear);
        if (yearView) {
          yearView.measureLayout(
            scrollViewRef.current as any,
            (x) => {
              scrollViewRef.current?.scrollTo({ x: x - 100, animated: true });
            },
            () => undefined
          );
        }
      }
    }, [currentYear]);

    const handleBackPress = useCallback(() => {
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
      }
      onBackPress();
    }, [onBackPress]);

    const handleYearPress = useCallback(
      (year: number) => {
        if (Platform.OS === 'ios') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
        }
        onYearSelect(year);
      },
      [onYearSelect]
    );

    return (
      <View style={[styles.container, { paddingBottom: bottomInset }]}>
        <View style={styles.contentWrapper}>
          {/* Back Button - Left */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={handleBackPress}
            style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
          </Pressable>

          {/* Year Picker - Center */}
          <ScrollView
            ref={scrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.yearScrollContent}
            style={styles.yearScroll}
          >
            {availableYears.map((year) => {
              const isSelected = year === currentYear;

              return (
                <Pressable
                  key={year}
                  accessibilityRole="button"
                  accessibilityLabel={`Select year ${year}`}
                  accessibilityState={isSelected ? { selected: true } : undefined}
                  onPress={() => handleYearPress(year)}
                  style={({ pressed }) => [
                    styles.yearChip,
                    isSelected && styles.yearChipSelected,
                    pressed && styles.yearChipPressed,
                  ]}
                  ref={(ref) => {
                    if (ref) {
                      yearRefs.current.set(year, ref as any);
                    } else {
                      yearRefs.current.delete(year);
                    }
                  }}
                >
                  <Text style={[styles.yearText, isSelected && styles.yearTextSelected]}>
                    {year}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Right Placeholder (future filter/info button) */}
          <View style={styles.rightPlaceholder} />
        </View>
      </View>
    );
  }
);

TimeMachineBottomBar.displayName = 'TimeMachineBottomBar';

const buildStyles = (theme: ThemeDefinition) => {
  const { colors, spacing, mode } = theme;
  const sansFamily = Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' });

  return StyleSheet.create({
    // Container with 24pt radius and translucent background (NorthStar compliant)
    container: {
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      overflow: 'hidden',
      backgroundColor:
        mode === 'dark' ? 'rgba(27, 24, 19, 0.95)' : 'rgba(247, 244, 238, 0.95)',
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 8,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    },
    // Content wrapper with horizontal layout
    contentWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.sm,
      gap: spacing.md,
    },
    // Back button (44x44pt touch target)
    backButton: {
      width: 44,
      height: 44,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 22,
    },
    backButtonPressed: {
      opacity: 0.7,
      backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
    },
    // Year picker scroll container
    yearScroll: {
      flex: 1,
      maxHeight: 44,
    },
    yearScrollContent: {
      gap: spacing.sm,
      paddingHorizontal: spacing.xs,
    },
    // Year chip (outline style)
    yearChip: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      backgroundColor: colors.surface,
      minHeight: 44,
      justifyContent: 'center',
      alignItems: 'center',
    },
    yearChipSelected: {
      borderColor: colors.accentPrimary,
      backgroundColor: colors.accentSoft,
    },
    yearChipPressed: {
      opacity: 0.7,
      transform: [{ scale: 0.98 }],
    },
    // Year text
    yearText: {
      fontFamily: sansFamily,
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
      letterSpacing: -0.2,
    },
    yearTextSelected: {
      color: colors.accentPrimary,
      fontWeight: '700',
    },
    // Right placeholder (44x44pt to balance layout)
    rightPlaceholder: {
      width: 44,
      height: 44,
    },
  });
};
