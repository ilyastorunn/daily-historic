import { useMemo, useState } from 'react';
import { Alert, Button, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type {
  AccountSelection,
  CategoryOption,
  EraOption,
  PushPermission,
} from '@/contexts/onboarding-context';
import { useUserContext } from '@/contexts/user-context';

const eraLabels: Record<EraOption, string> = {
  prehistory: 'Prehistory',
  ancient: 'Ancient Worlds',
  medieval: 'Medieval',
  'early-modern': 'Early Modern',
  nineteenth: '19th Century',
  twentieth: '20th Century',
  contemporary: 'Contemporary',
};

const categoryLabels: Record<CategoryOption, string> = {
  'world-wars': 'World Wars',
  'ancient-civilizations': 'Ancient Civilizations',
  'science-discovery': 'Science & Discovery',
  'art-culture': 'Art & Culture',
  politics: 'Politics & Leaders',
  inventions: 'Inventions & Breakthroughs',
  'natural-disasters': 'Natural Disasters',
  'civil-rights': 'Civil Rights & Movements',
  exploration: 'Exploration',
  surprise: 'Surprise me',
};

const accountLabels: Record<Exclude<AccountSelection, null>, string> = {
  email: 'Email account',
  google: 'Google',
  apple: 'Apple',
  meta: 'Meta',
  anonymous: 'Anonymous sign-in',
};

const pushPermissionLabels: Record<PushPermission, string> = {
  unknown: 'Not requested',
  enabled: 'Granted',
  declined: 'Declined',
};

const formatList = <T extends string>(values: T[] | undefined, labels: Record<T, string>) => {
  if (!values || values.length === 0) {
    return '—';
  }

  return values.map((value) => labels[value] ?? value).join(', ');
};

const formatAccountSelection = (selection: AccountSelection | null) => {
  if (!selection) {
    return 'Not selected';
  }

  return accountLabels[selection] ?? selection;
};

const formatNotificationStatus = (enabled: boolean, time?: string) => {
  if (!enabled) {
    return 'Disabled';
  }

  return `Enabled${time ? ` • ${time}` : ''}`;
};

const DashboardScreen = () => {
  const { authUser, profile, onboardingCompleted, signOut, error } = useUserContext();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const categoriesText = useMemo(() => formatList(profile?.categories, categoryLabels), [profile?.categories]);
  const erasText = useMemo(() => formatList(profile?.eras, eraLabels), [profile?.eras]);
  const accountText = useMemo(
    () => formatAccountSelection(profile?.accountSelection ?? null),
    [profile?.accountSelection]
  );
  const notificationText = useMemo(
    () => formatNotificationStatus(profile?.notificationEnabled ?? false, profile?.notificationTime),
    [profile?.notificationEnabled, profile?.notificationTime]
  );
  const pushPermissionText = useMemo(
    () => pushPermissionLabels[profile?.pushPermission ?? 'unknown'],
    [profile?.pushPermission]
  );

  const handleSignOut = async () => {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);
    try {
      await signOut();
    } catch (signOutError) {
      const message =
        signOutError instanceof Error ? signOutError.message : 'Unexpected error while signing out.';
      Alert.alert('Sign out failed', message);
    } finally {
      setIsSigningOut(false);
    }
  };

  if (!profile || !onboardingCompleted) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.title}>Loading dashboard…</Text>
          <Text style={styles.subtitle}>We are preparing your onboarding data.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Daily Historic Dashboard</Text>
          <Text style={styles.subtitle}>
            Onboarding is complete. Use this temporary screen to review your selections or sign out to
            start over.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Account</Text>
          <Text style={styles.body}>Status: {accountText}</Text>
          <Text style={styles.body}>UID: {authUser?.uid ?? 'Unknown'}</Text>
          <Text style={styles.body}>Timezone: {profile.timezone}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <Text style={styles.body}>Notifications: {notificationText}</Text>
          <Text style={styles.body}>Push permission: {pushPermissionText}</Text>
          <Text style={styles.body}>Eras: {erasText}</Text>
          <Text style={styles.body}>
            Categories: {categoriesText}
            {profile.categoriesSkipped ? ' (skipped)' : ''}
          </Text>
          <Text style={styles.body}>
            Preview seen: {profile.heroPreviewSeen ? 'Yes' : 'No'}
          </Text>
        </View>

        {error ? <Text style={styles.errorText}>{error.message}</Text> : null}

        <Button title={isSigningOut ? 'Signing out…' : 'Sign out'} onPress={handleSignOut} disabled={isSigningOut} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fb',
  },
  container: {
    flex: 1,
    padding: 24,
    gap: 24,
  },
  header: {
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#14161a',
  },
  subtitle: {
    fontSize: 16,
    color: '#444851',
    lineHeight: 22,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2230',
  },
  body: {
    fontSize: 15,
    color: '#303544',
  },
  errorText: {
    fontSize: 14,
    color: '#ba1a1a',
  },
});

export default DashboardScreen;
