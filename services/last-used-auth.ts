import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AccountSelection } from '@/contexts/onboarding-context';

export type LastUsedAuthProvider = Extract<AccountSelection, 'google' | 'apple' | 'email'>;

const LAST_USED_AUTH_PROVIDER_KEY = '@daily_historic/last_used_auth_provider';

const isSupportedProvider = (value: unknown): value is LastUsedAuthProvider =>
  value === 'google' || value === 'apple' || value === 'email';

export const persistLastUsedAuthProvider = async (provider: LastUsedAuthProvider) => {
  await AsyncStorage.setItem(LAST_USED_AUTH_PROVIDER_KEY, provider);
};

export const readLastUsedAuthProvider = async (): Promise<LastUsedAuthProvider | null> => {
  const storedProvider = await AsyncStorage.getItem(LAST_USED_AUTH_PROVIDER_KEY);

  return isSupportedProvider(storedProvider) ? storedProvider : null;
};
