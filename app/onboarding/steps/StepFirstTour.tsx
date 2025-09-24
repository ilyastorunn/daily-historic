import { ScrollView, Text, View } from 'react-native';

import { useOnboardingContext } from '@/contexts/onboarding-context';

import type { StepComponentProps } from '../types';
import { styles } from '../styles';

const StepFirstTour = (_: StepComponentProps) => {
  const { state } = useOnboardingContext();

  return (
    <ScrollView contentContainerStyle={styles.stepScroll}>
      <Text style={styles.stepTitle}>You’re set for today</Text>
      <Text style={styles.sectionCopy}>
        Expect a hero story first, followed by tailored highlights across your themes. Save discoveries, share them, and keep your streak glowing.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>What’s next</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>• Hero event curated for your favorite eras</Text>
          <Text style={styles.bulletItem}>• Personalized timeline with your themes</Text>
          <Text style={styles.bulletItem}>• {state.reminderEnabled ? 'Daily reminder scheduled' : 'Reminder paused for now'}</Text>
        </View>
      </View>

      <Text style={styles.helperText}>Tap “Enter Dashboard” to meet today’s moments.</Text>
    </ScrollView>
  );
};

export default StepFirstTour;
