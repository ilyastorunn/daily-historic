import { Pressable, ScrollView, Text, View } from 'react-native';

import { useOnboardingContext } from '@/contexts/onboarding-context';

import type { StepComponentProps } from '../types';
import { styles } from '../styles';

const StepReminderPermission = ({ onNext }: StepComponentProps) => {
  const { state, updateState } = useOnboardingContext();

  const handleEnable = () => {
    updateState({ pushPermission: 'enabled' });
    onNext();
  };

  const handleSkip = () => {
    updateState({ pushPermission: 'declined' });
    onNext();
  };

  return (
    <ScrollView contentContainerStyle={styles.stepScroll}>
      <Text style={styles.stepTitle}>Stay on top of history</Text>
      <Text style={styles.sectionCopy}>
        We’ll deliver a curated highlight at your {state.reminderWindow} slot. Enable notifications to keep your streak.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Daily reminder</Text>
        <Text style={styles.sectionCopy}>
          A concise story, tailored to your picks, just when you want it.
        </Text>

        <View style={styles.inlineButtonsRow}>
          <Pressable
            onPress={handleEnable}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
          >
            <Text style={styles.primaryButtonText}>Enable notifications</Text>
          </Pressable>
          <Pressable
            onPress={handleSkip}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressedButton]}
          >
            <Text style={styles.secondaryButtonText}>Maybe later</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
};

export default StepReminderPermission;
