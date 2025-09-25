import { Pressable, ScrollView, Text, View } from 'react-native';

import { type ThemeOption, useOnboardingContext } from '@/contexts/onboarding-context';

import type { StepComponentProps } from '../types';
import { styles } from '../styles';

const themeOptions: { value: ThemeOption; label: string }[] = [
  { value: 'wars', label: 'Wars & Revolutions' },
  { value: 'science', label: 'Science & Innovation' },
  { value: 'art', label: 'Art & Culture' },
  { value: 'politics', label: 'Politics & Leaders' },
  { value: 'social', label: 'Social Movements' },
  { value: 'biographies', label: 'Biographies' },
  { value: 'daily-life', label: 'Daily Life & Society' },
  { value: 'mysteries', label: 'Mysteries' },
  { value: 'exploration', label: 'Exploration' },
  { value: 'entertainment', label: 'Entertainment & Sport' },
  { value: 'surprise', label: 'Surprise me' },
];

const StepThemes = (_: StepComponentProps) => {
  const { state, updateState } = useOnboardingContext();

  const toggleTheme = (value: ThemeOption) => {
    if (value === 'surprise') {
      updateState({ themes: ['surprise'] });
      return;
    }

    const next = state.themes.includes(value)
      ? state.themes.filter((item) => item !== value)
      : [...state.themes.filter((item) => item !== 'surprise'), value];

    updateState({ themes: next });
  };

  return (
    <ScrollView contentContainerStyle={styles.stepScroll}>
      <Text style={styles.stepTitle}>What kinds of stories keep you intrigued?</Text>
      <Text style={styles.sectionCopy}>We recommend choosing at least three themes to start.</Text>
      <View style={styles.chipRowWrap}>
        {themeOptions.map((option) => {
          const selected = state.themes.includes(option.value);
          return (
            <Pressable
              key={option.value}
              onPress={() => toggleTheme(option.value)}
              style={({ pressed }) => [
                styles.optionChip,
                styles.optionChipOutlined,
                selected && styles.optionChipActive,
                pressed && styles.optionChipPressed,
              ]}
            >
              <Text
                style={[
                  styles.optionChipText,
                  selected && styles.optionChipTextActive,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
};

export default StepThemes;
