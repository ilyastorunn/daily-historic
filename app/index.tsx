import { useMemo } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';

import { useUserContext } from '@/contexts/user-context';

const splashStyle = {
  flex: 1,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

export default function Index() {
  const { initializing, onboardingCompleted } = useUserContext();

  const redirectHref = useMemo(() => {
    return onboardingCompleted ? '/dashboard' : '/onboarding';
  }, [onboardingCompleted]);

  if (initializing) {
    return (
      <View style={splashStyle}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Redirect href={redirectHref} />;
}
