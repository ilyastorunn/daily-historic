import { Image } from 'expo-image';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { useOnboardingContext } from '@/contexts/onboarding-context';

import type { StepComponentProps } from '../types';
import { styles } from '../styles';

const StepNotificationPermission = ({ onNext, onBack }: StepComponentProps) => {
  const { state, updateState } = useOnboardingContext();

  const handleEnable = () => {
    updateState({
      pushPermission: 'enabled',
      notificationEnabled: true,
      notificationTime: state.notificationTime || '09:00',
    });
    onNext();
  };

  const handleSkip = () => {
    updateState({ pushPermission: 'declined', notificationEnabled: false });
    onNext();
  };

  return (
    <ScrollView contentContainerStyle={styles.stepScroll}>
      <Text style={styles.stepTitle}>Stay in sync with gentle reminders</Text>
      <Text style={styles.sectionCopy}>
        We’ll nudge you once per day with a handpicked moment. No streak-busting spam—just pure inspiration when you want it.
      </Text>

      <View style={styles.permissionCard}>
        <Image
          source={require('@/pics/notification-img.png')}
          style={styles.permissionImage}
          contentFit="cover"
        />
      </View>

      <Text style={styles.helperText}>
        {"After you tap \"Allow notifications\", confirm by pressing \"Allow\" on the system prompt."}
      </Text>

      <View style={styles.heroActions}>
        <Pressable
          style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
          onPress={handleEnable}
        >
          <Text style={styles.primaryButtonText}>Allow notifications</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressedButton]}
          onPress={handleSkip}
        >
          <Text style={styles.secondaryButtonText}>Maybe later</Text>
        </Pressable>
      </View>

      <Pressable
        onPress={onBack}
        style={({ pressed }) => [styles.inlineBackLink, pressed && styles.inlineGhostButtonPressed]}
      >
        <Text style={styles.inlineBackLinkText}>← Back</Text>
      </Pressable>
    </ScrollView>
  );
};

export default StepNotificationPermission;
