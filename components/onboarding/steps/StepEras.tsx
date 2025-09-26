import { Pressable, ScrollView, Text, View } from 'react-native';

import { type EraOption, useOnboardingContext } from '@/contexts/onboarding-context';

import type { StepComponentProps } from '../types';
import { styles } from '../styles';

const options: { value: EraOption; label: string }[] = [
  { value: 'prehistory', label: 'Prehistory' },
  { value: 'ancient', label: 'Ancient Worlds' },
  { value: 'medieval', label: 'Medieval' },
  { value: 'early-modern', label: 'Early Modern' },
  { value: 'nineteenth', label: '19th Century' },
  { value: 'twentieth', label: '20th Century' },
  { value: 'contemporary', label: 'Contemporary' },
];

const StepEras = ({ onNext }: StepComponentProps) => {
  const { state, updateState } = useOnboardingContext();
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
    <ScrollView contentContainerStyle={styles.stepScroll}>
      <Text style={styles.stepTitle}>Focus by era (optional)</Text>
      <Text style={styles.sectionCopy}>
        Choose any periods you want to see more often, or skip to explore the full timeline.
      </Text>

      <View style={styles.chipRowWrap}>
        {options.map((option) => {
          const selected = eras.includes(option.value);
          return (
            <Pressable
              key={option.value}
              onPress={() => toggleOption(option.value)}
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

      <Pressable
        onPress={handleSkip}
        style={({ pressed }) => [styles.inlineGhostButton, pressed && styles.inlineGhostButtonPressed]}
      >
        <Text style={styles.inlineGhostButtonText}>Skip this step</Text>
      </Pressable>
    </ScrollView>
  );
};

export default StepEras;
