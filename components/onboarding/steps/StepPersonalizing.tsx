import { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { useOnboardingContext } from '@/contexts/onboarding-context';

import type { StepComponentProps } from '../types';
import { accentColor, styles } from '../styles';

const StepPersonalizing = ({ onNext }: StepComponentProps) => {
  const { state } = useOnboardingContext();
  const eraSummary = state.eras.length > 0 ? `${state.eras.length}` : 'your';

  useEffect(() => {
    const timeout = setTimeout(() => {
      onNext();
    }, 900);

    return () => clearTimeout(timeout);
  }, [onNext]);

  return (
    <View style={styles.loadingState}>
      <ActivityIndicator size="large" color={accentColor} />
      <Text style={styles.stepTitle}>Curating your history feed...</Text>
      <Text style={styles.sectionCopy}>
        Training your time machine with {eraSummary} era selections and favorite themes.
      </Text>
    </View>
  );
};

export default StepPersonalizing;
