import { useEffect, useMemo } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import {
  OnboardingProvider,
  useOnboardingContext,
} from '@/contexts/onboarding-context';
import { useUserContext, type OnboardingCompletionData } from '@/contexts/user-context';
import { styles } from '@/components/onboarding/styles';
import type { StepDefinition } from '@/components/onboarding/types';
import {
  StepAccount,
  StepCategories,
  StepEras,
  StepNotificationPermission,
  StepNotificationTime,
  StepPreview,
  StepWelcome,
} from '@/components/onboarding/steps';

const steps: StepDefinition[] = [
  {
    key: 'welcome',
    title: 'Welcome',
    Component: StepWelcome,
    nextLabel: 'Get Started',
  },
  {
    key: 'preview',
    title: 'Preview',
    Component: StepPreview,
  },
  {
    key: 'categories',
    title: 'Categories',
    Component: StepCategories,
    shouldDisableNext: (state) => {
      if (state.categoriesSkipped) {
        return false;
      }
      const hasSelection = state.categories.includes('surprise') || state.categories.length >= 1;
      return !hasSelection;
    },
  },
  {
    key: 'eras',
    title: 'Eras',
    Component: StepEras,
  },
  {
    key: 'notification-permission',
    title: 'Notifications',
    Component: StepNotificationPermission,
  },
  {
    key: 'notification-time',
    title: 'Reminder Timing',
    Component: StepNotificationTime,
    nextLabel: 'Save Time',
    shouldDisableNext: (state) => state.pushPermission === 'enabled' && !state.notificationTime,
  },
  {
    key: 'account',
    title: 'Account',
    Component: StepAccount,
    nextLabel: 'Create Account',
    shouldDisableNext: (state) => {
      if (!state.accountSelection) {
        return true;
      }

      if (state.accountSelection === 'email') {
        const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.emailAddress.trim());
        const passwordValid = state.accountPassword.length >= 8;
        const passwordsMatch = state.accountPassword === state.accountPasswordConfirm;
        return !(emailValid && passwordValid && passwordsMatch && state.termsAccepted);
      }

      return false;
    },
  },
];

const OnboardingStepper = ({ onComplete }: { onComplete: () => void }) => {
  const { state, goNext, goBack, goToStep, totalSteps } = useOnboardingContext();
  const { completeOnboarding } = useUserContext();

  const isFirstStep = state.stepIndex === 0;

  useEffect(() => {
    const current = steps[state.stepIndex];
    if (current?.key === 'notification-time' && state.pushPermission !== 'enabled') {
      goNext();
    }
  }, [goNext, state.pushPermission, state.stepIndex]);

  const currentStepDef = useMemo(() => steps[state.stepIndex], [state.stepIndex]);
  const StepComponent = currentStepDef.Component;

  const visibleSteps = useMemo(() => {
    return steps.filter((definition) =>
      definition.key === 'notification-time' ? state.pushPermission === 'enabled' : true
    );
  }, [state.pushPermission]);

  const currentVisibleIndex = useMemo(() => {
    return visibleSteps.findIndex((definition) => definition.key === currentStepDef.key);
  }, [currentStepDef.key, visibleSteps]);

  const displayedStepNumber = currentVisibleIndex >= 0 ? currentVisibleIndex + 1 : state.stepIndex + 1;
  const displayedStepTotal = visibleSteps.length;

  const isLastVisibleStep = currentVisibleIndex === visibleSteps.length - 1;

  const nextLabel = useMemo(() => {
    const label = currentStepDef.nextLabel;
    if (typeof label === 'function') {
      return label(state);
    }
    if (label) {
      return label;
    }
    return isLastVisibleStep ? 'Finish Setup' : 'Continue';
  }, [currentStepDef.nextLabel, isLastVisibleStep, state]);

  const isNextDisabled = currentStepDef.shouldDisableNext?.(state) ?? false;

  const handleNext = () => {
    if (isNextDisabled) {
      return;
    }

    if (state.stepIndex === totalSteps - 1) {
      const onboardingData: OnboardingCompletionData = {
        accountSelection: state.accountSelection,
        categories: state.categories,
        categoriesSkipped: state.categoriesSkipped,
        emailAddress: state.emailAddress ? state.emailAddress : undefined,
        eras: state.eras,
        heroPreviewSeen: state.heroPreviewSeen,
        notificationEnabled: state.notificationEnabled,
        notificationTime:
          state.pushPermission === 'enabled' && state.notificationTime
            ? state.notificationTime
            : undefined,
        pushPermission: state.pushPermission,
        timezone: state.timezone,
      };

      void completeOnboarding(onboardingData)
        .then(onComplete)
        .catch((error) => {
          console.error('Failed to complete onboarding', error);
        });
      return;
    }

    goNext();
  };

  const handleBack = () => {
    if (isFirstStep) {
      return;
    }

    if (currentVisibleIndex > 0) {
      const targetKey = visibleSteps[currentVisibleIndex - 1]?.key;
      const targetIndex = steps.findIndex((definition) => definition.key === targetKey);
      if (targetIndex >= 0) {
        goToStep(targetIndex);
        return;
      }
    }

    goBack();
  };

  const shouldShowFooter = !isFirstStep && currentStepDef.key !== 'notification-permission';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.progressText}>{`Step ${displayedStepNumber} of ${displayedStepTotal}`}</Text>
        <ProgressBar current={displayedStepNumber} total={displayedStepTotal} />
      </View>

      <View style={styles.contentWrapper}>
        <StepComponent
          onNext={handleNext}
          onBack={handleBack}
          isLast={isLastVisibleStep}
        />
      </View>

      {shouldShowFooter && (
        <View style={styles.footer}>
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.pressedButton,
            ]}
          >
            <Text style={styles.secondaryButtonText}>Back</Text>
          </Pressable>

          <Pressable
            onPress={handleNext}
            disabled={isNextDisabled}
            style={({ pressed }) => [
              styles.primaryButton,
              isNextDisabled && styles.primaryButtonDisabled,
              pressed && !isNextDisabled && styles.primaryButtonPressed,
            ]}
          >
            <Text
              style={[
                styles.primaryButtonText,
                isNextDisabled && styles.primaryButtonTextDisabled,
              ]}
            >
              {nextLabel}
            </Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
};

const ProgressBar = ({ current, total }: { current: number; total: number }) => {
  const progress = total <= 0 ? 0 : Math.min(current / total, 1);
  return (
    <View style={styles.progressBarTrack}>
      <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
    </View>
  );
};

const loadingStyle = {
  flex: 1,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

const OnboardingScreen = () => {
  const router = useRouter();
  const { initializing, onboardingCompleted } = useUserContext();

  useEffect(() => {
    if (!initializing && onboardingCompleted) {
      router.replace('/(tabs)');
    }
  }, [initializing, onboardingCompleted, router]);

  const handleComplete = () => {
    router.replace('/(tabs)');
  };

  if (initializing) {
    return (
      <SafeAreaView style={loadingStyle}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <OnboardingProvider totalSteps={steps.length}>
      <OnboardingStepper onComplete={handleComplete} />
    </OnboardingProvider>
  );
};

export default OnboardingScreen;
