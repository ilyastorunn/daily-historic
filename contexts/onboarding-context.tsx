import { createContext, useCallback, useContext, useMemo, useReducer } from 'react';
import type { ReactNode } from 'react';

type PushPermission = 'unknown' | 'enabled' | 'declined';

type AccountSelection = 'email' | 'google' | 'apple' | 'meta' | 'anonymous' | null;

type EraOption =
  | 'prehistory'
  | 'ancient'
  | 'medieval'
  | 'early-modern'
  | 'nineteenth'
  | 'twentieth'
  | 'contemporary';

type CategoryOption =
  | 'world-wars'
  | 'ancient-civilizations'
  | 'science-discovery'
  | 'art-culture'
  | 'politics'
  | 'inventions'
  | 'natural-disasters'
  | 'civil-rights'
  | 'exploration'
  | 'surprise';

type OnboardingState = {
  stepIndex: number;
  accountSelection: AccountSelection;
  emailAddress: string;
  accountPassword: string;
  accountPasswordConfirm: string;
  termsAccepted: boolean;
  timezone: string;
  notificationEnabled: boolean;
  notificationTime: string;
  eras: EraOption[];
  categories: CategoryOption[];
  categoriesSkipped: boolean;
  pushPermission: PushPermission;
  heroPreviewSeen: boolean;
};

type OnboardingAction =
  | { type: 'SET_STEP'; payload: number }
  | { type: 'NEXT_STEP'; max: number }
  | { type: 'PREV_STEP' }
  | { type: 'UPDATE'; payload: Partial<OnboardingState> }
  | { type: 'RESET'; initialState: OnboardingState };

const detectTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    console.warn('Unable to detect timezone automatically:', error);
    return 'UTC';
  }
};

const INITIAL_NOTIFICATION_TIME = '09:00';

const initialState: OnboardingState = {
  stepIndex: 0,
  accountSelection: null,
  emailAddress: '',
  accountPassword: '',
  accountPasswordConfirm: '',
  termsAccepted: false,
  timezone: detectTimezone(),
  notificationEnabled: true,
  notificationTime: INITIAL_NOTIFICATION_TIME,
  eras: [],
  categories: [],
  categoriesSkipped: false,
  pushPermission: 'unknown',
  heroPreviewSeen: false,
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

type OnboardingContextValue = {
  state: OnboardingState;
  totalSteps: number;
  goToStep: (step: number) => void;
  goNext: () => void;
  goBack: () => void;
  updateState: (data: Partial<OnboardingState>) => void;
  reset: () => void;
};

const reducer = (state: OnboardingState, action: OnboardingAction): OnboardingState => {
  switch (action.type) {
    case 'SET_STEP': {
      return { ...state, stepIndex: action.payload };
    }
    case 'NEXT_STEP': {
      return { ...state, stepIndex: Math.min(state.stepIndex + 1, action.max) };
    }
    case 'PREV_STEP': {
      return { ...state, stepIndex: Math.max(state.stepIndex - 1, 0) };
    }
    case 'UPDATE': {
      return { ...state, ...action.payload };
    }
    case 'RESET': {
      return { ...action.initialState };
    }
    default:
      return state;
  }
};

type OnboardingProviderProps = {
  children: ReactNode;
  totalSteps: number;
};

export const OnboardingProvider = ({ children, totalSteps }: OnboardingProviderProps) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const goToStep = useCallback(
    (step: number) => {
      dispatch({ type: 'SET_STEP', payload: Math.max(0, Math.min(step, totalSteps - 1)) });
    },
    [totalSteps]
  );

  const goNext = useCallback(() => {
    dispatch({ type: 'NEXT_STEP', max: totalSteps - 1 });
  }, [totalSteps]);

  const goBack = useCallback(() => {
    dispatch({ type: 'PREV_STEP' });
  }, []);

  const updateState = useCallback((data: Partial<OnboardingState>) => {
    dispatch({ type: 'UPDATE', payload: data });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET', initialState });
  }, []);

  const value = useMemo<OnboardingContextValue>(() => {
    return {
      state,
      totalSteps,
      goToStep,
      goNext,
      goBack,
      updateState,
      reset,
    };
  }, [state, totalSteps, goToStep, goNext, goBack, updateState, reset]);

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
};

export const useOnboardingContext = () => {
  const context = useContext(OnboardingContext);

  if (!context) {
    throw new Error('useOnboardingContext must be used within an OnboardingProvider');
  }

  return context;
};

export type {
  EraOption,
  CategoryOption,
  OnboardingState,
  AccountSelection,
  PushPermission,
};
