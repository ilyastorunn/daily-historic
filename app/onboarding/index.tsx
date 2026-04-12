import { useEffect, useMemo } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

import {
  OnboardingProvider,
  useOnboardingContext,
} from '@/contexts/onboarding-context';
import { useUserContext, type OnboardingCompletionData } from '@/contexts/user-context';
import { useAppTheme } from '@/theme';
import { createOnboardingStyles } from '@/components/onboarding/styles';
import type { StepDefinition } from '@/components/onboarding/types';
import {
  StepAccount,
  StepCategories,
  StepEras,
  StepName,
  StepNotificationPermission,
  StepNotificationTime,
  StepPaywall,
  StepPreview,
  StepRateUs,
  StepWelcome,
} from '@/components/onboarding/steps';

const steps: StepDefinition[] = [
  {
    key: 'name',
    title: 'Your Name',
    Component: StepName,
    nextLabel: 'Get Started',
    shouldDisableNext: (state) => !state.displayName.trim(),
  },
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
  {
    key: 'paywall',
    title: 'Premium',
    Component: StepPaywall,
  },
  {
    key: 'rate-us',
    title: 'Rate Us',
    Component: StepRateUs,
  },
];

const OnboardingStepper = ({ onComplete }: { onComplete: () => void }) => {
  const { state, goNext, goBack, goToStep, totalSteps, updateState } = useOnboardingContext();
  const { authAccountSelection, authUser, completeOnboarding } = useUserContext();
  const theme = useAppTheme();
  const { styles } = useMemo(() => createOnboardingStyles(theme), [theme]);

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
  const isReminderTimeStep = currentStepDef.key === 'notification-time';

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
      const resolvedAccountSelection = state.accountSelection ?? authAccountSelection;
      const onboardingData: OnboardingCompletionData = {
        displayName: state.displayName.trim() || undefined,
        accountSelection: resolvedAccountSelection,
        categories: state.categories,
        categoriesSkipped: state.categoriesSkipped,
        emailAddress: state.emailAddress || authUser?.email || undefined,
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

  const handleReminderSkip = () => {
    updateState({ notificationEnabled: false });
    goNext();
  };

  const shouldShowFooter =
    currentStepDef.key !== 'welcome' &&
    currentStepDef.key !== 'notification-permission' &&
    currentStepDef.key !== 'rate-us' &&
    currentStepDef.key !== 'paywall' &&
    currentStepDef.key !== 'account';

  const showBackButton = !isFirstStep;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          {showBackButton ? (
            <Pressable
              accessibilityLabel="Go back"
              onPress={handleBack}
              style={({ pressed }) => [
                styles.headerBackButton,
                pressed && styles.headerBackButtonPressed,
              ]}
            >
              <Ionicons name="arrow-back" style={styles.headerBackIcon} />
            </Pressable>
          ) : (
            <View style={styles.headerBackPlaceholder} />
          )}
        </View>
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
          {isReminderTimeStep ? (
            <View style={{ width: '100%', alignItems: 'center', gap: 8 }}>
              <Pressable
                onPress={handleNext}
                disabled={isNextDisabled}
                style={({ pressed }) => [
                  styles.primaryButton,
                  { flex: 0, width: '100%' },
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
              <Pressable
                accessibilityRole="button"
                onPress={handleReminderSkip}
                style={({ pressed }) => [
                  { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={styles.ghostLink}>Skip</Text>
              </Pressable>
            </View>
          ) : (
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
          )}
        </View>
      )}
    </SafeAreaView>
  );
};

const ProgressBar = ({ current, total }: { current: number; total: number }) => {
  const theme = useAppTheme();
  const { styles: pbStyles } = useMemo(() => createOnboardingStyles(theme), [theme]);
  const progress = total <= 0 ? 0 : Math.min(current / total, 1);
  return (
    <View style={pbStyles.progressBarTrack}>
      <View style={[pbStyles.progressBarFill, { width: `${progress * 100}%` }]} />
    </View>
  );
};

const loadingStyle = {
  flex: 1,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

const getSingleParam = (value?: string | string[]) => (Array.isArray(value) ? value[0] : value);

const OnboardingRouteStateSync = ({
  stepKey,
  displayName,
}: {
  stepKey?: string;
  displayName?: string;
}) => {
  const { state, goToStep, updateState } = useOnboardingContext();

  useEffect(() => {
    if (!stepKey) {
      return;
    }

    const targetIndex = steps.findIndex((definition) => definition.key === stepKey);

    if (targetIndex >= 0 && state.stepIndex !== targetIndex) {
      goToStep(targetIndex);
    }
  }, [goToStep, state.stepIndex, stepKey]);

  useEffect(() => {
    if (!displayName || state.displayName === displayName) {
      return;
    }

    updateState({ displayName });
  }, [displayName, state.displayName, updateState]);

  return null;
};

const OnboardingScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{
    step?: string | string[];
    displayName?: string | string[];
  }>();
  const { initializing, onboardingCompleted } = useUserContext();
  const stepKey = getSingleParam(params.step);
  const displayName = getSingleParam(params.displayName)?.trim();

  const initialStateOverride = useMemo(() => {
    const targetIndex = steps.findIndex((definition) => definition.key === stepKey);

    return {
      ...(targetIndex >= 0 ? { stepIndex: targetIndex } : {}),
      ...(displayName ? { displayName } : {}),
    };
  }, [displayName, stepKey]);

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
    <OnboardingProvider
      totalSteps={steps.length}
      initialStateOverride={initialStateOverride}
    >
      <OnboardingRouteStateSync
        stepKey={stepKey}
        displayName={displayName}
      />
      <OnboardingStepper onComplete={handleComplete} />
    </OnboardingProvider>
  );
};

export default OnboardingScreen;
