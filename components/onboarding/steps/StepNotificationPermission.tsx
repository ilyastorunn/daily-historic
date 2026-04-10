import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useOnboardingContext } from '@/contexts/onboarding-context';
import { requestNotificationPermission } from '@/services/notifications';
import { useAppTheme } from '@/theme';

import DecorativeIllustration from '../DecorativeIllustration';
import type { StepComponentProps } from '../types';
import { createOnboardingStyles, spacingScale } from '../styles';

const appleIllustration = require('@/assets/illustrations/apple.png');
const newtonIllustration = require('@/assets/illustrations/newton.png');

const localStyles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  content: {
    gap: spacingScale.xl,
  },
  actions: {
    gap: spacingScale.md,
  },
  illustrationScene: {
    minHeight: 93,
    marginBottom: -spacingScale.sm,
  },
  linkButton: {
    alignSelf: 'center',
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: spacingScale.md,
  },
  linkPressed: {
    opacity: 0.7,
  },
});

const StepNotificationPermission = ({ onNext }: StepComponentProps) => {
  const { state, updateState } = useOnboardingContext();
  const theme = useAppTheme();
  const { styles } = useMemo(() => createOnboardingStyles(theme), [theme]);

  const handleEnable = () => {
    void requestNotificationPermission()
      .then((permissionState) => {
        if (permissionState === 'enabled') {
          updateState({
            pushPermission: 'enabled',
            notificationEnabled: true,
            notificationTime: state.notificationTime || '09:00',
          });
        } else {
          updateState({
            pushPermission: 'declined',
            notificationEnabled: false,
          });
        }
      })
      .catch((error) => {
        console.error('Failed to request notification permission', error);
        updateState({
          pushPermission: 'declined',
          notificationEnabled: false,
        });
      })
      .finally(() => {
        onNext();
      });
  };

  const handleSkip = () => {
    updateState({ pushPermission: 'declined', notificationEnabled: false });
    onNext();
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.stepScroll, localStyles.scrollContent]}
      showsVerticalScrollIndicator={false}
    >
      <View style={localStyles.content}>
        <View style={styles.section}>
          <Text style={styles.stepTitle}>Stay in sync with gentle reminders</Text>
          <Text style={styles.sectionCopy}>We send one handpicked moment each day. Quiet, useful, and always on your schedule.</Text>
        </View>
      </View>

      <View style={localStyles.actions}>
        <View pointerEvents="box-none" style={[styles.inlineActionScene, localStyles.illustrationScene]}>
          <DecorativeIllustration
            source={newtonIllustration}
            widthRatio={0.22}
            minWidth={80}
            maxWidth={93}
          />
          <DecorativeIllustration
            source={appleIllustration}
            widthRatio={0.22}
            minWidth={82}
            maxWidth={104}
            top={8}
            right={34}
          />
        </View>

        <Pressable
          style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
          onPress={handleEnable}
        >
          <Text style={styles.primaryButtonText}>Allow notifications</Text>
        </Pressable>

        <Pressable
          onPress={handleSkip}
          style={({ pressed }) => [localStyles.linkButton, pressed && localStyles.linkPressed]}
        >
          <Text style={styles.ghostLink}>Maybe later</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
};

export default StepNotificationPermission;
