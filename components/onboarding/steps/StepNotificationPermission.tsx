import { Pressable, ScrollView, Text, View } from 'react-native';

import { useOnboardingContext } from '@/contexts/onboarding-context';

import type { StepComponentProps } from '../types';
import { styles } from '../styles';

const StepNotificationPermission = ({ onNext }: StepComponentProps) => {
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
        <Text style={styles.permissionTitle}>
          {"\"Chrono\" would like to send you notifications"}
        </Text>
        <Text style={styles.permissionHint}>
          Alerts may include daily highlights and streak reminders.
        </Text>

        <View style={styles.permissionActions}>
          <View style={[styles.permissionAction, styles.permissionActionSecondary]}>
            <Text style={styles.permissionActionLabel}>Not Now</Text>
          </View>
          <View style={[styles.permissionAction, styles.permissionActionPrimary]}>
            <Text style={styles.permissionActionLabel}>Allow</Text>
          </View>
        </View>
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
          style={({ pressed }) => [styles.inlineGhostButton, pressed && styles.inlineGhostButtonPressed]}
          onPress={handleSkip}
        >
          <Text style={[styles.inlineGhostButtonText, styles.inlineGhostButtonTextActive]}>Maybe later</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
};

export default StepNotificationPermission;
