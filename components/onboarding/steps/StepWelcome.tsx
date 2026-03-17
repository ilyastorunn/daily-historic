import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { useOnboardingContext } from '@/contexts/onboarding-context';
import { useAppTheme } from '@/theme';

import DecorativeIllustration from '../DecorativeIllustration';
import type { StepComponentProps } from '../types';
import { createOnboardingStyles, spacingScale } from '../styles';

const einsteinIllustration = require('@/assets/illustrations/einstein.png');
const atomIllustration = require('@/assets/illustrations/atom.png');

const StepWelcome = ({ onNext }: StepComponentProps) => {
  const { state, updateState } = useOnboardingContext();
  const router = useRouter();
  const theme = useAppTheme();
  const { styles } = useMemo(() => createOnboardingStyles(theme), [theme]);
  const displayName = state.displayName.trim();
  const greeting = displayName ? `Hello, ${displayName}!` : 'Hello!';

  const handleBegin = () => {
    updateState({ heroPreviewSeen: true });
    onNext();
  };

  const handleLogin = () => {
    router.replace('/(tabs)');
  };

  return (
    <ScrollView contentContainerStyle={styles.welcomeScroll} showsVerticalScrollIndicator={false}>
      <View style={styles.heroMasthead}>
        <Text style={styles.heroGreeting}>{greeting}</Text>
        <Text style={styles.heroBody}>
          Chrono curates one luminous moment from history every day. We will tune the timeline so it fits your curiosity.
        </Text>
      </View>

      <View pointerEvents="box-none" style={[styles.inlineActionScene, localStyles.einsteinScene]}>
        <DecorativeIllustration
          source={einsteinIllustration}
          widthRatio={0.45}
          minWidth={155}
          maxWidth={200}
        />
      </View>

      <View style={styles.heroActions}>
        <View pointerEvents="box-none" style={[styles.inlineActionScene, localStyles.atomScene]}>
          <DecorativeIllustration
            source={atomIllustration}
            widthRatio={0.14}
            minWidth={50}
            maxWidth={65}
            opacity={0.5}
          />
        </View>

        <Pressable
          style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
          onPress={handleBegin}
        >
          <Text style={styles.primaryButtonText}>Start Your Journey</Text>
        </Pressable>
      </View>

      <Pressable onPress={handleLogin}>
        <Text style={styles.ghostLink}>Already have a pass? Sign in</Text>
      </Pressable>
    </ScrollView>
  );
};

const localStyles = StyleSheet.create({
  einsteinScene: {
    minHeight: 210,
    marginTop: -spacingScale.sm,
    marginBottom: -spacingScale.sm,
  },
  atomScene: {
    minHeight: 56,
    marginBottom: -spacingScale.md,
  },
});

export default StepWelcome;
