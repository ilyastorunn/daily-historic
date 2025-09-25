import { Pressable, ScrollView, Text, View } from 'react-native';

import { type EraOption, useOnboardingContext } from '@/contexts/onboarding-context';

import type { StepComponentProps } from '../types';
import { styles } from '../styles';

const options: { value: EraOption; label: string }[] = [
  { value: 'ancient', label: 'Ancient' },
  { value: 'medieval', label: 'Medieval' },
  { value: 'renaissance', label: 'Renaissance' },
  { value: 'early-modern', label: '17th–18th' },
  { value: 'nineteenth', label: '19th Century' },
  { value: 'twentieth', label: '1900s' },
  { value: 'twenty-first', label: '21st Century' },
  { value: 'prehistory', label: 'Prehistory' },
  { value: 'all', label: 'I’m open to everything' },
];

const StepEras = (_: StepComponentProps) => {
  const { state, updateState } = useOnboardingContext();
  const eras = state.eras;

  const toggleOption = (option: EraOption) => {
    if (option === 'all') {
      updateState({ eras: ['all'] });
      return;
    }

    const next = eras.includes(option)
      ? eras.filter((item) => item !== option)
      : [...eras.filter((item) => item !== 'all'), option];

    updateState({ eras: next });
  };

  return (
    <ScrollView contentContainerStyle={styles.stepScroll}>
      <Text style={styles.stepTitle}>Which eras captivate you?</Text>
      <Text style={styles.sectionCopy}>
        Pick as many as you like. We’ll weave daily stories from these periods.
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
      <Text style={styles.helperText}>Select at least one to keep your feed focused.</Text>
    </ScrollView>
  );
};

export default StepEras;
