import { useEffect, useMemo, useState } from 'react';
import { Pressable, SafeAreaView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import {
  OnboardingProvider,
  useOnboardingContext,
} from '@/contexts/onboarding-context';
import { styles } from './styles';
import type { StepDefinition } from './types';
import {
  StepAccount,
  StepEras,
  StepEngagement,
  StepFirstTour,
  StepPersonalizing,
  StepRegion,
  StepReminderPermission,
  StepThemes,
  StepTimezone,
  StepWelcome,
} from './steps';

const steps: StepDefinition[] = [
  {
    key: 'welcome',
    title: 'Welcome',
    Component: StepWelcome,
  },
  {
    key: 'account',
    title: 'Account',
    Component: StepAccount,
  },
  {
    key: 'timezone',
    title: 'Reminder Timing',
    Component: StepTimezone,
  },
  {
    key: 'eras',
    title: 'Eras',
    Component: StepEras,
  },
  {
    key: 'themes',
    title: 'Themes',
    Component: StepThemes,
  },
  {
    key: 'region',
    title: 'Regional Focus',
    Component: StepRegion,
  },
  {
    key: 'engagement',
    title: 'Engagement',
    Component: StepEngagement,
  },
  {
    key: 'reminder-permission',
    title: 'Reminder Permission',
    Component: StepReminderPermission,
  },
  {
    key: 'personalizing',
    title: 'Personalizing',
    Component: StepPersonalizing,
  },
  {
    key: 'ftue',
    title: 'First Tour',
    Component: StepFirstTour,
  },
];

const OnboardingStepper = ({ onComplete }: { onComplete: () => void }) => {
  const { state, goNext, goBack, totalSteps } = useOnboardingContext();
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (state.stepIndex === totalSteps - 1) {
      setCompleted(true);
    }
  }, [state.stepIndex, totalSteps]);

  const currentStepDef = useMemo(() => steps[state.stepIndex], [state.stepIndex]);
  const StepComponent = currentStepDef.Component;

  const handleNext = () => {
    if (state.stepIndex === totalSteps - 1) {
      onComplete();
      return;
    }

    goNext();
  };

  const handleBack = () => {
    if (state.stepIndex === 0) {
      return;
    }

    goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.progressText}>{`Step ${state.stepIndex + 1} of ${totalSteps}`}</Text>
        <ProgressBar progress={(state.stepIndex + 1) / totalSteps} />
      </View>

      <View style={styles.contentWrapper}>
        <StepComponent
          onNext={handleNext}
          onBack={handleBack}
          isLast={state.stepIndex === totalSteps - 1}
        />
      </View>

      <View style={styles.footer}>
        <Pressable
          onPress={handleBack}
          disabled={state.stepIndex === 0}
          style={({ pressed }) => [
            styles.secondaryButton,
            state.stepIndex === 0 && styles.disabledButton,
            pressed && state.stepIndex !== 0 && styles.pressedButton,
          ]}
        >
          <Text
            style={[
              styles.secondaryButtonText,
              state.stepIndex === 0 && styles.disabledButtonText,
            ]}
          >
            Back
          </Text>
        </Pressable>

        <Pressable
          onPress={handleNext}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
        >
          <Text style={styles.primaryButtonText}>{completed ? 'Enter Dashboard' : 'Continue'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const ProgressBar = ({ progress }: { progress: number }) => {
  return (
    <View style={styles.progressBarTrack}>
      <View style={[styles.progressBarFill, { width: `${Math.min(progress, 1) * 100}%` }]} />
    </View>
  );
};

const OnboardingScreen = () => {
  const router = useRouter();

  const handleComplete = () => {
    router.replace('/(tabs)');
  };

  return (
    <OnboardingProvider totalSteps={steps.length}>
      <OnboardingStepper onComplete={handleComplete} />
    </OnboardingProvider>
  );
};

export default OnboardingScreen;
