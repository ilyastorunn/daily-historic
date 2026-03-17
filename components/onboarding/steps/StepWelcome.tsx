import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';

import { useOnboardingContext } from '@/contexts/onboarding-context';
import { useAppTheme } from '@/theme';

import DecorativeIllustration from '../DecorativeIllustration';
import type { StepComponentProps } from '../types';
import { createOnboardingStyles, spacingScale } from '../styles';

const einsteinIllustration = require('@/assets/illustrations/einstein.png');
const atomIllustration = require('@/assets/illustrations/atom.png');

const ATOM_SIZE = 120;

const StepWelcome = ({ onNext }: StepComponentProps) => {
  const { state, updateState } = useOnboardingContext();
  const router = useRouter();
  const theme = useAppTheme();
  const { styles } = useMemo(() => createOnboardingStyles(theme), [theme]);
  const { height: windowHeight } = useWindowDimensions();
  const displayName = state.displayName.trim();
  const greeting = displayName ? `Hello, ${displayName}!` : 'Hello!';

  // Responsive Einstein size: 38% of screen height, capped between 200–300pt
  const einsteinSize = Math.min(Math.max(Math.round(windowHeight * 0.38), 200), 300);

  const handleBegin = () => {
    updateState({ heroPreviewSeen: true });
    onNext();
  };

  const handleLogin = () => {
    router.replace('/(tabs)');
  };

  return (
    <View style={localStyles.container}>
      {/* Heading only — stays at top */}
      <Text style={styles.heroGreeting}>{greeting}</Text>

      {/* Einstein — centered in remaining space */}
      <View style={localStyles.einsteinSection}>
        <DecorativeIllustration
          source={einsteinIllustration}
          width={einsteinSize}
          height={einsteinSize}
        />
      </View>

      {/* Body text below Einstein, atom overlaps it from bottom */}
      <View style={localStyles.bodyAndAtom}>
        <Text style={[styles.heroBody, localStyles.bodyText]}>
          Chrono curates one luminous moment from history every day. We will tune the timeline so it fits your curiosity.
        </Text>

        {/* Atom: absolute, centered, overlaps bottom of body text, zIndex above text */}
        <View pointerEvents="box-none" style={localStyles.atomOverlay}>
          <DecorativeIllustration
            source={atomIllustration}
            width={ATOM_SIZE}
            height={ATOM_SIZE}
            opacity={0.5}
          />
        </View>
      </View>

      {/* Button + sign in — always at bottom */}
      <View style={localStyles.bottomSection}>
        <Pressable
          style={({ pressed }) => [styles.primaryButton, localStyles.fullWidthButton, pressed && styles.primaryButtonPressed]}
          onPress={handleBegin}
        >
          <Text style={styles.primaryButtonText}>Start Your Journey</Text>
        </Pressable>

        <Pressable onPress={handleLogin}>
          <Text style={styles.ghostLink}>Already have a pass? Sign in</Text>
        </Pressable>
      </View>
    </View>
  );
};

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: spacingScale.lg,
    alignItems: 'center',
  },
  einsteinSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyAndAtom: {
    width: '100%',
    alignItems: 'center',
    // Bottom padding reserves space for the atom that overflows upward
    paddingBottom: ATOM_SIZE * 0.6,
  },
  bodyText: {
    zIndex: 0,
  },
  atomOverlay: {
    position: 'absolute',
    bottom: 0,
    alignItems: 'center',
    zIndex: 2,
  },
  bottomSection: {
    width: '100%',
    alignItems: 'center',
    gap: spacingScale.md,
    // Pull up so button sits tight against atom bottom
    marginTop: -ATOM_SIZE * 0.4,
    zIndex: 3,
  },
  fullWidthButton: {
    flex: 0,
    width: '100%',
  },
});

export default StepWelcome;
