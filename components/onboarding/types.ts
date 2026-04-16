import type { JSX } from 'react';

import type { OnboardingState } from '@/contexts/onboarding-context';

type StepKey =
  | 'hook'
  | 'goal'
  | 'name'
  | 'pain-points'
  | 'social-proof'
  | 'tinder-cards'
  | 'solution'
  | 'categories'
  | 'eras'
  | 'personalizing'
  | 'notification-permission'
  | 'notification-time'
  | 'account'
  | 'paywall';

type StepComponentProps = {
  onNext: () => void;
  onBack: () => void;
  isLast: boolean;
};

type StepRenderer = (props: StepComponentProps) => JSX.Element;

type StepDefinition = {
  key: StepKey;
  title: string;
  Component: StepRenderer;
  nextLabel?: string | ((state: OnboardingState) => string);
  shouldDisableNext?: (state: OnboardingState) => boolean;
};

export type { StepComponentProps, StepDefinition, StepRenderer, StepKey };
