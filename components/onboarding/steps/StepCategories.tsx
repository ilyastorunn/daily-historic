import { Pressable, ScrollView, Text, View } from 'react-native';

import { type CategoryOption, useOnboardingContext } from '@/contexts/onboarding-context';

import type { StepComponentProps } from '../types';
import { styles } from '../styles';

const categoryOptions: { value: CategoryOption; label: string }[] = [
  { value: 'world-wars', label: 'World Wars' },
  { value: 'ancient-civilizations', label: 'Ancient Civilizations' },
  { value: 'science-discovery', label: 'Science & Discovery' },
  { value: 'art-culture', label: 'Art & Culture' },
  { value: 'politics', label: 'Politics & Leaders' },
  { value: 'inventions', label: 'Inventions & Breakthroughs' },
  { value: 'natural-disasters', label: 'Natural Disasters' },
  { value: 'civil-rights', label: 'Civil Rights & Movements' },
  { value: 'exploration', label: 'Exploration' },
  { value: 'surprise', label: 'Surprise me' },
];

const StepCategories = ({ onNext }: StepComponentProps) => {
  const { state, updateState } = useOnboardingContext();

  const toggleCategory = (value: CategoryOption) => {
    if (value === 'surprise') {
      updateState({ categories: ['surprise'] });
      return;
    }

    const next = state.categories.includes(value)
      ? state.categories.filter((item) => item !== value)
      : [...state.categories.filter((item) => item !== 'surprise'), value];

    updateState({ categories: next });
  };

  return (
    <ScrollView contentContainerStyle={styles.stepScroll}>
      <Text style={styles.stepTitle}>What interests you?</Text>
      <Text style={styles.sectionCopy}>
        Pick one or more categories so Chrono can tailor your daily digest. Choose “Surprise me” for a balanced mix.
      </Text>
      <View style={styles.chipRowWrap}>
        {categoryOptions.map((option) => {
          const selected = state.categories.includes(option.value);
          return (
            <Pressable
              key={option.value}
              onPress={() => toggleCategory(option.value)}
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
      <Text style={styles.helperText}>
        You can adjust these anytime in settings. Selecting “Surprise me” clears other picks.
      </Text>
      <Pressable
        onPress={() => {
          updateState({ categories: ['surprise'] });
          onNext();
        }}
        style={({ pressed }) => [styles.inlineGhostButton, pressed && styles.inlineGhostButtonPressed]}
      >
        <Text style={styles.inlineGhostButtonText}>Skip for now</Text>
      </Pressable>
    </ScrollView>
  );
};

export default StepCategories;
