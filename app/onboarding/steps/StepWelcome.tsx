import { Pressable, ScrollView, Text, View } from 'react-native';

import { useOnboardingContext } from '@/contexts/onboarding-context';

import type { StepComponentProps } from '../types';
import { styles } from '../styles';

const StepWelcome = (_: StepComponentProps) => {
  const { updateState } = useOnboardingContext();

  const handleHeroPreview = () => {
    updateState({ heroPreviewSeen: true });
  };

  return (
    <ScrollView contentContainerStyle={styles.stepScroll}>
      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>Welcome to Your History Journey</Text>
        <Text style={styles.heroSubtitle}>
          Discover a cinematic timeline tailored to what inspires you. Let’s set up your daily ritual.
        </Text>
        <Pressable
          style={({ pressed }) => [styles.ghostButton, pressed && styles.ghostButtonPressed]}
          onPress={handleHeroPreview}
        >
          <Text style={styles.ghostButtonText}>See today’s highlight</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>What to expect</Text>
        <Text style={styles.sectionCopy}>
          You’ll pick the eras, themes, and reminders that matter to you. We’ll craft a daily feed that feels fresh yet familiar.
        </Text>
      </View>
    </ScrollView>
  );
};

export default StepWelcome;
