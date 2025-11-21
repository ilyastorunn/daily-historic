import { useMemo } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { type CategoryOption, useOnboardingContext } from '@/contexts/onboarding-context';
import { useAppTheme, type ThemeDefinition } from '@/theme';

import type { StepComponentProps } from '../types';
import { styles as onboardingStyles } from '../styles';

const categoryOptions: { value: CategoryOption; label: string; icon?: string }[] = [
  { value: 'world-wars', label: 'World Wars' },
  { value: 'ancient-civilizations', label: 'Ancient Civilizations' },
  { value: 'science-discovery', label: 'Science & Discovery' },
  { value: 'art-culture', label: 'Art & Culture' },
  { value: 'politics', label: 'Politics' },
  { value: 'inventions', label: 'Inventions' },
  { value: 'natural-disasters', label: 'Natural Disasters' },
  { value: 'civil-rights', label: 'Civil Rights' },
  { value: 'exploration', label: 'Exploration' },
  { value: 'surprise', label: 'None of these' },
];

const createStyles = (theme: ThemeDefinition) => {
  const { colors, spacing, radius, mode } = theme;
  const serifFamily = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' });
  const sansFamily = Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' });

  return StyleSheet.create({
    container: {
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.xxl,
      gap: spacing.xl,
    },
    header: {
      gap: spacing.sm,
      paddingTop: spacing.md,
    },
    title: {
      fontFamily: serifFamily,
      fontSize: 32,
      lineHeight: 38,
      letterSpacing: -0.6,
      color: colors.textPrimary,
      fontWeight: '400',
    },
    cardGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
      paddingTop: spacing.lg,
    },
    cardWrapper: {
      width: '47%',
    },
    card: {
      backgroundColor: mode === 'dark' ? colors.surfaceElevated : colors.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      minHeight: 140,
      position: 'relative',
      borderWidth: 1,
      borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : colors.borderSubtle,
    },
    cardPressed: {
      opacity: 0.7,
    },
    iconPlaceholder: {
      width: 48,
      height: 48,
      marginBottom: spacing.md,
    },
    cardLabel: {
      fontFamily: sansFamily,
      fontSize: 17,
      lineHeight: 22,
      fontWeight: '400',
      color: colors.textPrimary,
    },
    checkbox: {
      position: 'absolute',
      top: spacing.md,
      right: spacing.md,
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)',
      backgroundColor: 'transparent',
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxSelected: {
      backgroundColor: '#5CB85C',
      borderColor: '#5CB85C',
    },
  });
};

const StepCategories = ({ onNext }: StepComponentProps) => {
  const { state, updateState } = useOnboardingContext();
  const theme = useAppTheme();
  const themedStyles = useMemo(() => createStyles(theme), [theme]);

  const toggleCategory = (value: CategoryOption) => {
    if (value === 'surprise') {
      updateState({ categories: ['surprise'], categoriesSkipped: false });
      return;
    }

    const next = state.categories.includes(value)
      ? state.categories.filter((item) => item !== value)
      : [...state.categories.filter((item) => item !== 'surprise'), value];

    updateState({ categories: next, categoriesSkipped: false });
  };

  const handleSkip = () => {
    updateState({ categories: [], categoriesSkipped: true });
    onNext();
  };

  return (
    <ScrollView
      contentContainerStyle={[onboardingStyles.stepScroll, themedStyles.container]}
      showsVerticalScrollIndicator={false}
    >
      <View style={themedStyles.header}>
        <Text style={themedStyles.title}>What are your{'\n'}interests?</Text>
      </View>

      <View style={themedStyles.cardGrid}>
        {categoryOptions.map((option) => {
          const selected = state.categories.includes(option.value);
          return (
            <View key={option.value} style={themedStyles.cardWrapper}>
              <Pressable
                onPress={() => toggleCategory(option.value)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityHint={selected ? 'Double tap to deselect' : 'Double tap to select'}
                testID={`category-card-${option.value}`}
                style={({ pressed }) => [
                  themedStyles.card,
                  pressed && themedStyles.cardPressed,
                ]}
              >
                {/* Icon placeholder - will be replaced with illustrations later */}
                <View style={themedStyles.iconPlaceholder} />

                <Text style={themedStyles.cardLabel}>{option.label}</Text>

                {/* Checkbox */}
                <View style={[themedStyles.checkbox, selected && themedStyles.checkboxSelected]}>
                  {selected && (
                    <Ionicons name="checkmark" size={18} color="white" />
                  )}
                </View>
              </Pressable>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
};

export default StepCategories;
