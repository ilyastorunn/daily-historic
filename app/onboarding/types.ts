import type { JSX } from 'react';

type StepKey =
  | 'welcome'
  | 'account'
  | 'timezone'
  | 'eras'
  | 'themes'
  | 'region'
  | 'engagement'
  | 'reminder-permission'
  | 'personalizing'
  | 'ftue';

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
};

export type { StepComponentProps, StepDefinition, StepRenderer, StepKey };
