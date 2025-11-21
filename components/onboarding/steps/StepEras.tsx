import { useMemo } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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

  return (
    <ScrollView
      contentContainerStyle={[onboardingStyles.stepScroll, themedStyles.container]}
      showsVerticalScrollIndicator={false}
    >
      <View style={themedStyles.header}>
        <Text style={themedStyles.title}>Which eras do you{'\n'}prefer?</Text>
      </View>

      <View style={themedStyles.cardGrid}>
        {options.map((option) => {
          const selected = eras.includes(option.value);
          return (
            <View key={option.value} style={themedStyles.cardWrapper}>
              <Pressable
                onPress={() => toggleOption(option.value)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityHint={selected ? 'Double tap to deselect' : 'Double tap to select'}
                testID={`era-card-${option.value}`}
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

export default StepEras;
