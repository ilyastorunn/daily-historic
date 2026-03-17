import { useMemo } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useOnboardingContext } from '@/contexts/onboarding-context';
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
    minHeight: 176,
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
  const { styles, accentColor } = useMemo(() => createOnboardingStyles(theme), [theme]);

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
    <ScrollView
      contentContainerStyle={[styles.stepScroll, localStyles.scrollContent]}
      showsVerticalScrollIndicator={false}
    >
      <View style={localStyles.content}>
        <View style={styles.section}>
          <Text style={styles.stepTitle}>Stay in sync with gentle reminders</Text>
          <Text style={styles.sectionCopy}>We send one handpicked moment each day. Quiet, useful, and always on your schedule.</Text>
        </View>

        <View style={styles.permissionCard}>
          <View style={styles.permissionCardHeader}>
            <View style={styles.permissionBadge}>
              <Ionicons color={accentColor} name="notifications-outline" size={22} />
            </View>
            <View style={styles.permissionHeaderText}>
              <Text style={styles.permissionAppName}>Daily Historic</Text>
              <Text style={styles.permissionMeta}>One calm reminder, once a day</Text>
            </View>
          </View>

          <View style={styles.permissionCardContent}>
            <Text style={styles.permissionTitle}>Get a gentle nudge when today&apos;s moment is ready</Text>
            <Text style={styles.permissionHint}>Choose a time once, then adjust or pause reminders whenever you like from settings.</Text>
          </View>

          <View style={styles.permissionBulletList}>
            <View style={styles.permissionBulletRow}>
              <View style={styles.permissionBulletDot} />
              <Text style={styles.permissionBulletText}>Delivered at the time you pick next.</Text>
            </View>
            <View style={styles.permissionBulletRow}>
              <View style={styles.permissionBulletDot} />
              <Text style={styles.permissionBulletText}>Easy to pause or change later.</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={localStyles.actions}>
        <View pointerEvents="box-none" style={[styles.inlineActionScene, localStyles.illustrationScene]}>
          <DecorativeIllustration
            source={newtonIllustration}
            widthRatio={0.4}
            minWidth={148}
            maxWidth={188}
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
