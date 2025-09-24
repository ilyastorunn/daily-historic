import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { useOnboardingContext } from '@/contexts/onboarding-context';

import type { StepComponentProps } from '../types';
import { styles } from '../styles';

const StepRegion = (_: StepComponentProps) => {
  const { state, updateState } = useOnboardingContext();
  const [region, setRegion] = useState(state.regionPreference ?? '');

  const handleSave = (value: string | null) => {
    updateState({ regionPreference: value });
    if (value !== null) {
      setRegion(value);
    } else {
      setRegion('');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.stepScroll}>
      <Text style={styles.stepTitle}>Should we spotlight a region?</Text>
      <Text style={styles.sectionCopy}>
        We’ll still share global stories, but can lead with the places that matter most to you.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Choose a region or country</Text>
        <TextInput
          placeholder="e.g., Japan, Europe, Latin America"
          value={region}
          onChangeText={(text) => {
            setRegion(text);
            updateState({ regionPreference: text.length ? text : null });
          }}
          style={styles.input}
        />
      </View>

      <View style={styles.chipRowWrap}>
        <Pressable
          onPress={() => handleSave(null)}
          style={({ pressed }) => [
            styles.optionChip,
            styles.optionChipOutlined,
            state.regionPreference === null && styles.optionChipActive,
            pressed && styles.optionChipPressed,
          ]}
        >
          <Text
            style={[
              styles.optionChipText,
              state.regionPreference === null && styles.optionChipTextActive,
            ]}
          >
            No preference
          </Text>
        </Pressable>
        <Pressable
          onPress={() => handleSave('surprise')}
          style={({ pressed }) => [
            styles.optionChip,
            styles.optionChipOutlined,
            state.regionPreference === 'surprise' && styles.optionChipActive,
            pressed && styles.optionChipPressed,
          ]}
        >
          <Text
            style={[
              styles.optionChipText,
              state.regionPreference === 'surprise' && styles.optionChipTextActive,
            ]}
          >
            Surprise me
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
};

export default StepRegion;
