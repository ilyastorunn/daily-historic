import { Pressable, ScrollView, Text, View } from 'react-native';

import {
  type EngagementPreference,
  useOnboardingContext,
} from '@/contexts/onboarding-context';

import type { StepComponentProps } from '../types';
import { styles } from '../styles';

const options: { label: string; value: EngagementPreference }[] = [
  { label: 'Quick reads (1 min)', value: 'quick' },
  { label: 'In-depth dives', value: 'deep' },
  { label: 'Mix it up', value: 'mixed' },
];

const StepEngagement = (_: StepComponentProps) => {
  const { state, updateState } = useOnboardingContext();

  const toggleNewsletter = () => {
    updateState({ newsletterOptIn: !state.newsletterOptIn });
  };

  return (
    <ScrollView contentContainerStyle={styles.stepScroll}>
      <Text style={styles.stepTitle}>How do you like to explore history?</Text>
      <Text style={styles.sectionCopy}>
        We’ll balance your daily digest to match the pace you prefer.
      </Text>

      <View style={styles.stackGap}>
        {options.map((option) => {
          const selected = state.engagementPreference === option.value;
          return (
            <Pressable
              key={option.value ?? 'null'}
              onPress={() => updateState({ engagementPreference: option.value })}
              style={({ pressed }) => [
                styles.card,
                selected && styles.cardSelected,
                pressed && styles.cardPressed,
              ]}
            >
              <Text style={styles.cardTitle}>{option.label}</Text>
              {selected && <Text style={styles.cardHint}>Selected</Text>}
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={toggleNewsletter}
        style={({ pressed }) => [
          styles.inlineGhostButton,
          state.newsletterOptIn && styles.inlineGhostButtonActive,
          pressed && styles.inlineGhostButtonPressed,
        ]}
      >
        <Text
          style={[
            styles.inlineGhostButtonText,
            state.newsletterOptIn && styles.inlineGhostButtonTextActive,
          ]}
        >
          {state.newsletterOptIn ? '✓ Weekly recap enabled' : 'Enable the weekly recap email'}
        </Text>
      </Pressable>
    </ScrollView>
  );
};

export default StepEngagement;
