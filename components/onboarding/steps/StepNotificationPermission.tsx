import { Pressable, ScrollView, Text, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { useOnboardingContext } from '@/contexts/onboarding-context';
import { useAppTheme } from '@/theme';

import type { StepComponentProps } from '../types';
import { styles } from '../styles';

const StepNotificationPermission = ({ onNext }: StepComponentProps) => {
  const { state, updateState } = useOnboardingContext();
  const {
    colors: { accentPrimary },
  } = useAppTheme();
  const reminderTime = state.notificationTime ?? '09:00';

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
        <View style={styles.permissionCardHeader}>
          <View style={styles.permissionBadge}>
            <IconSymbol name="bell.fill" size={20} color={accentPrimary} />
          </View>

          <View style={styles.permissionHeaderText}>
            <Text style={styles.permissionAppName}>Chrono Moment</Text>
            <Text style={styles.permissionMeta}>Mindful reminders that match your rhythm</Text>
          </View>
        </View>

        <View style={styles.permissionCardContent}>
          <Text style={styles.permissionTitle}>Allow mindful notifications</Text>
          <Text style={styles.permissionHint}>
            Turn on a single nudge at <Text style={styles.permissionHighlight}>{reminderTime}</Text> to stay in sync without
            the pressure.
          </Text>
        </View>

        <View style={styles.permissionBulletList}>
          <View style={styles.permissionBulletRow}>
            <View style={styles.permissionBulletDot} />
            <Text style={styles.permissionBulletText}>Daily inspiration chosen just for your timeline</Text>
          </View>

          <View style={styles.permissionBulletRow}>
            <View style={styles.permissionBulletDot} />
            <Text style={styles.permissionBulletText}>Pause or adjust alerts anytime from settings</Text>
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
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressedButton]}
          onPress={handleSkip}
        >
          <Text style={styles.secondaryButtonText}>Maybe later</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
};

export default StepNotificationPermission;
