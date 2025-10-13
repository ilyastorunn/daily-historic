import { useMemo } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { SelectableChip } from '@/components/ui/selectable-chip';
import { type EraOption, useOnboardingContext } from '@/contexts/onboarding-context';
import { useAppTheme, type ThemeDefinition } from '@/theme';

import type { StepComponentProps } from '../types';
import { styles as onboardingStyles } from '../styles';

const options: { value: EraOption; label: string }[] = [
  { value: 'prehistory', label: 'Prehistory' },
  { value: 'ancient', label: 'Ancient Worlds' },
  { value: 'medieval', label: 'Medieval' },
  { value: 'early-modern', label: 'Early Modern' },
  { value: 'nineteenth', label: '19th Century' },
  { value: 'twentieth', label: '20th Century' },
  { value: 'contemporary', label: 'Contemporary' },
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
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingTop: spacing.md,
    },
    headerCopy: {
      flex: 1,
      paddingRight: spacing.lg,
      gap: spacing.xs,
    },
    title: {
      fontFamily: serifFamily,
      fontSize: 26,
      lineHeight: 32,
      letterSpacing: -0.5,
      color: colors.textPrimary,
    },
    body: {
      fontFamily: sansFamily,
      fontSize: 15,
      lineHeight: 22,
      color: colors.textSecondary,
    },
    skipLink: {
      paddingVertical: spacing.xs,
    },
    skipLabel: {
      fontFamily: sansFamily,
      fontSize: 14,
      fontWeight: '500',
      color: colors.textSecondary,
      opacity: 0.55,
      letterSpacing: 0.3,
    },
    chipGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingTop: spacing.md,
    },
  });
};

const StepEras = ({ onNext }: StepComponentProps) => {
  const { state, updateState } = useOnboardingContext();
  const theme = useAppTheme();
  const themedStyles = useMemo(() => createStyles(theme), [theme]);
  const eras = state.eras;

  const toggleOption = (option: EraOption) => {
    const next = eras.includes(option)
      ? eras.filter((item) => item !== option)
      : [...eras, option];

    updateState({ eras: next });
  };

  const handleSkip = () => {
    updateState({ eras: [] });
    onNext();
  };

  return (
    <ScrollView
      contentContainerStyle={[onboardingStyles.stepScroll, themedStyles.container]}
      showsVerticalScrollIndicator={false}
    >
      <View style={themedStyles.headerRow}>
        <View style={themedStyles.headerCopy}>
          <Text style={themedStyles.title}>Focus by era</Text>
          <Text style={themedStyles.body}>
            Hone in on the periods you crave, or keep the full timeline open.
          </Text>
        </View>
        <Pressable
          accessibilityLabel="Skip era focus"
          accessibilityRole="button"
          onPress={handleSkip}
          style={({ pressed }) => [
            themedStyles.skipLink,
            pressed && { opacity: 0.6 },
          ]}
        >
          <Text style={themedStyles.skipLabel}>Skip</Text>
        </Pressable>
      </View>

      <View style={themedStyles.chipGrid}>
        {options.map((option) => {
          const selected = eras.includes(option.value);
          return (
            <SelectableChip
              key={option.value}
              label={option.label}
              selected={selected}
              onPress={() => toggleOption(option.value)}
              accessibilityHint={selected ? 'Double tap to remove this era' : 'Double tap to focus on this era more often'}
              testID={`era-chip-${option.value}`}
            />
          );
        })}
      </View>
    </ScrollView>
  );
};

export default StepEras;
