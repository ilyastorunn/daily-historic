import { useMemo } from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { useOnboardingContext } from '@/contexts/onboarding-context';
import { requestNotificationPermission } from '@/services/notifications';
import { useAppTheme } from '@/theme';

import type { StepComponentProps } from '../types';
import { createOnboardingStyles, spacingScale } from '../styles';

const serifFamily = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' });

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    gap: spacingScale.xl,
  },
  mascotArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacingScale.sm,
  },
  mascot: {
    width: '86%',
    maxWidth: 320,
    height: '100%',
    maxHeight: 390,
  },
  actions: {
    width: '100%',
    gap: spacingScale.xs,
    paddingBottom: spacingScale.sm,
  },
  linkButton: {
    alignSelf: 'center',
    minHeight: 32,
    justifyContent: 'center',
    paddingHorizontal: spacingScale.md,
  },
  linkPressed: {
    opacity: 0.7,
  },
  title: {
    fontFamily: serifFamily,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -0.6,
    fontWeight: '400',
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
    <View style={localStyles.container}>
      <View style={localStyles.content}>
        <View style={styles.section}>
          <Text style={[styles.stepTitle, localStyles.title]}>Stay in sync with gentle reminders</Text>
          <Text style={styles.sectionCopy}>We send one handpicked moment each day. Quiet, useful, and always on your schedule.</Text>
        </View>
      </View>

      <View style={localStyles.mascotArea}>
        <Image
          source={require('../../../assets/mascot/notification-permission.png')}
          style={localStyles.mascot}
          resizeMode="contain"
          accessible={false}
        />
      </View>

      <View style={localStyles.actions}>
        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            { flex: 0, width: '100%' },
            pressed && styles.primaryButtonPressed,
          ]}
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
    </View>
  );
};

export default StepNotificationPermission;
