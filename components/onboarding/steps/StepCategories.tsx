import { useMemo } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { SelectableChip } from '@/components/ui/selectable-chip';
import { type CategoryOption, useOnboardingContext } from '@/contexts/onboarding-context';
import { useAppTheme, type ThemeDefinition } from '@/theme';

import type { StepComponentProps } from '../types';
import { styles as onboardingStyles } from '../styles';

const categoryOptions: { value: CategoryOption; label: string }[] = [
  { value: 'world-wars', label: 'World Wars' },
  { value: 'ancient-civilizations', label: 'Ancient Worlds' },
  { value: 'science-discovery', label: 'Science & Discovery' },
  { value: 'art-culture', label: 'Art & Culture' },
  { value: 'politics', label: 'Leaders & Power' },
  { value: 'inventions', label: 'Breakthroughs' },
  { value: 'natural-disasters', label: 'Forces of Nature' },
  { value: 'civil-rights', label: 'Rights & Movements' },
  { value: 'exploration', label: 'Exploration' },
  { value: 'surprise', label: 'Surprise me' },
];

const createStyles = (theme: ThemeDefinition) => {
  const { colors, spacing } = theme;
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
      fontSize: 28,
      lineHeight: 34,
      letterSpacing: -0.6,
      color: colors.textPrimary,
    },
    body: {
      fontFamily: sansFamily,
      fontSize: 15,
      lineHeight: 22,
      color: colors.textSecondary,
      maxWidth: 320,
    },
    chipGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingTop: spacing.md,
    },
    helper: {
      fontFamily: sansFamily,
      fontSize: 13,
      lineHeight: 18,
      color: colors.textTertiary,
    },
    skipLink: {
      alignSelf: 'flex-start',
      paddingVertical: spacing.xs,
    },
    skipLabel: {
      fontFamily: sansFamily,
      fontSize: 15,
      fontWeight: '500',
      color: colors.textSecondary,
      opacity: 0.7,
      textDecorationLine: 'underline',
      letterSpacing: 0.2,
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
        <Text style={themedStyles.title}>Choose what to explore</Text>
        <Text style={themedStyles.body}>
          Pick a few themes for today’s digest. “Surprise me” keeps the mix broad.
        </Text>
      </View>

      <View style={themedStyles.chipGrid}>
        {categoryOptions.map((option) => {
          const selected = state.categories.includes(option.value);
          return (
            <SelectableChip
              key={option.value}
              label={option.label}
              selected={selected}
              onPress={() => toggleCategory(option.value)}
              accessibilityHint={selected ? 'Double tap to remove from your digest' : 'Double tap to add to your digest'}
              testID={`category-chip-${option.value}`}
            />
          );
        })}
      </View>

      <Text style={themedStyles.helper}>
        You can refine these anytime in settings. Choosing “Surprise me” clears other picks.
      </Text>

      <Pressable
        onPress={handleSkip}
        accessibilityRole="button"
        accessibilityLabel="Skip category selection"
        style={({ pressed }) => [
          themedStyles.skipLink,
          pressed && { opacity: 0.6 },
        ]}
      >
        <Text style={themedStyles.skipLabel}>Skip for now</Text>
      </Pressable>
    </ScrollView>
  );
};

export default StepCategories;
