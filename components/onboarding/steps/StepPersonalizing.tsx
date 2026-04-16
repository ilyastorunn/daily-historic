import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useOnboardingContext } from '@/contexts/onboarding-context';
import { useAppTheme, type ThemeDefinition } from '@/theme';

import type { StepComponentProps } from '../types';
import { createOnboardingStyles } from '../styles';

const sansFamily = Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' });

const PHASES = [
  { icon: null, text: 'Analysing your preferences...' },
  { icon: null, text: 'Matching your interests...' },
  { icon: null, text: 'Building your timeline...' },
  { icon: 'checkmark-circle', text: 'All set!' },
];

const PHASE_DURATION = 600;

const createStyles = (theme: ThemeDefinition) => {
  const { colors, spacing } = theme;

  return StyleSheet.create({
    phaseText: {
      fontFamily: sansFamily,
      fontSize: 15,
      lineHeight: 22,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    checkIcon: {
      marginBottom: spacing.xs,
    },
  });
};

const StepPersonalizing = ({ onNext }: StepComponentProps) => {
  const { state } = useOnboardingContext();
  const theme = useAppTheme();
  const { styles, accentColor } = useMemo(() => createOnboardingStyles(theme), [theme]);
  const localStyles = useMemo(() => createStyles(theme), [theme]);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const eraSummary = state.eras.length > 0 ? `${state.eras.length}` : 'your';

  useEffect(() => {
    const totalDuration = PHASES.length * PHASE_DURATION;

    const phaseTimers = PHASES.map((_, index) =>
      setTimeout(() => setPhaseIndex(index), index * PHASE_DURATION)
    );

    const doneTimer = setTimeout(() => {
      onNext();
    }, totalDuration + 200);

    return () => {
      phaseTimers.forEach(clearTimeout);
      clearTimeout(doneTimer);
    };
  }, [onNext]);

  const currentPhase = PHASES[phaseIndex] ?? PHASES[PHASES.length - 1]!;
  const isDone = phaseIndex === PHASES.length - 1;

  return (
    <View style={styles.loadingState}>
      {isDone ? (
        <Ionicons
          name="checkmark-circle"
          size={48}
          color={accentColor}
          style={localStyles.checkIcon}
        />
      ) : (
        <ActivityIndicator size="large" color={accentColor} />
      )}
      <Text style={styles.stepTitle}>Curating your history feed...</Text>
      <Text style={localStyles.phaseText}>{currentPhase.text}</Text>
      <Text style={styles.sectionCopy}>
        Tuning your time machine with {eraSummary} era selections and favourite themes.
      </Text>
    </View>
  );
};

export default StepPersonalizing;
