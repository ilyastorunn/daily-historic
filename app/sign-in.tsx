import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { useUserContext } from '@/contexts/user-context';
import { useAppTheme } from '@/theme';
import { createOnboardingStyles } from '@/components/onboarding/styles';

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const createLocalStyles = () =>
  StyleSheet.create({
    screen: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: 32,
    },
    body: {
      flex: 1,
      gap: 28,
      justifyContent: 'center',
    },
    copy: {
      gap: 10,
    },
    title: {
      fontSize: 30,
      lineHeight: 36,
      fontWeight: '600',
    },
    subtitle: {
      fontSize: 15,
      lineHeight: 22,
    },
    authRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 12,
    },
    divider: {
      alignItems: 'center',
    },
    dividerText: {
      fontSize: 13,
      letterSpacing: 0.3,
      textTransform: 'uppercase',
    },
    emailStack: {
      gap: 12,
    },
    errorText: {
      fontSize: 13,
      lineHeight: 18,
    },
    footerRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 6,
      flexWrap: 'wrap',
    },
  });

export default function SignInScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    returnToStep?: string | string[];
    displayName?: string | string[];
  }>();
  const theme = useAppTheme();
  const { styles } = useMemo(() => createOnboardingStyles(theme), [theme]);
  const localStyles = useMemo(() => createLocalStyles(), []);
  const {
    authBusy,
    authError,
    clearAuthError,
    signInWithApple,
    signInWithEmail,
    signInWithGoogle,
  } = useUserContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const returnToStep = Array.isArray(params.returnToStep)
    ? params.returnToStep[0]
    : params.returnToStep;
  const displayName = Array.isArray(params.displayName)
    ? params.displayName[0]
    : params.displayName;

  const handleSuccessfulSignIn = () => {
    router.replace('/');
  };

  const handleBackToOnboarding = () => {
    if (returnToStep) {
      router.replace({
        pathname: '/onboarding',
        params: {
          step: returnToStep,
          ...(displayName ? { displayName } : {}),
        },
      });
      return;
    }

    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/onboarding');
  };

  const emailSubmitDisabled = authBusy || !isValidEmail(email) || password.length === 0;

  const runHaptic = () => {
    void Haptics.selectionAsync().catch(() => undefined);
  };

  const handleGoogleSignIn = async () => {
    clearAuthError();
    runHaptic();

    try {
      await signInWithGoogle();
      handleSuccessfulSignIn();
    } catch {
      // Error state is shown from context.
    }
  };

  const handleAppleSignIn = async () => {
    clearAuthError();
    runHaptic();

    try {
      await signInWithApple();
      handleSuccessfulSignIn();
    } catch {
      // Error state is shown from context.
    }
  };

  const handleEmailSignIn = async () => {
    if (emailSubmitDisabled) {
      return;
    }

    clearAuthError();
    runHaptic();

    try {
      await signInWithEmail(email.trim(), password);
      handleSuccessfulSignIn();
    } catch {
      // Error state is shown from context.
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, localStyles.screen]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={localStyles.screen}
      >
        <ScrollView
          contentContainerStyle={localStyles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <Pressable
                accessibilityLabel="Back to onboarding"
                onPress={handleBackToOnboarding}
                style={({ pressed }) => [
                  styles.headerBackButton,
                  pressed && styles.headerBackButtonPressed,
                ]}
              >
                <Ionicons name="arrow-back" style={styles.headerBackIcon} />
              </Pressable>
            </View>
          </View>

          <View style={[styles.contentWrapper, localStyles.body]}>
            <View style={localStyles.copy}>
              <Text style={[localStyles.title, { color: theme.colors.textPrimary }]}>
                Welcome back
              </Text>
              <Text style={[localStyles.subtitle, { color: theme.colors.textSecondary }]}>
                Sign in to restore your saved stories, reactions, and preferences.
              </Text>
            </View>

            <View style={localStyles.authRow}>
              {Platform.OS === 'ios' ? (
                <Pressable
                  accessibilityLabel="Sign in with Apple"
                  accessibilityRole="button"
                  disabled={authBusy}
                  onPress={() => void handleAppleSignIn()}
                  style={({ pressed }) => [
                    styles.authButton,
                    authBusy && styles.disabledButton,
                    pressed && styles.authButtonPressed,
                  ]}
                >
                  <Ionicons name="logo-apple" size={28} style={styles.authButtonIcon} />
                </Pressable>
              ) : null}

              <Pressable
                accessibilityLabel="Sign in with Google"
                accessibilityRole="button"
                disabled={authBusy}
                onPress={() => void handleGoogleSignIn()}
                style={({ pressed }) => [
                  styles.authButton,
                  authBusy && styles.disabledButton,
                  pressed && styles.authButtonPressed,
                ]}
              >
                <Ionicons name="logo-google" size={28} style={styles.authButtonIcon} />
              </Pressable>
            </View>

            <View style={localStyles.divider}>
              <Text style={[localStyles.dividerText, { color: theme.colors.textTertiary }]}>
                or use email
              </Text>
            </View>

            <View style={localStyles.emailStack}>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                onChangeText={(value) => {
                  clearAuthError();
                  setEmail(value);
                }}
                placeholder="you@example.com"
                style={styles.input}
                value={email}
              />
              {!isValidEmail(email) && email.length > 0 ? (
                <Text style={[localStyles.errorText, { color: '#B42318' }]}>
                  Enter a valid email address.
                </Text>
              ) : null}

              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={(value) => {
                  clearAuthError();
                  setPassword(value);
                }}
                placeholder="Password"
                secureTextEntry
                style={styles.input}
                value={password}
              />

              {authError ? (
                <Text style={[localStyles.errorText, { color: '#B42318' }]}>{authError}</Text>
              ) : null}

              <Pressable
                accessibilityRole="button"
                disabled={emailSubmitDisabled}
                onPress={() => void handleEmailSignIn()}
                style={({ pressed }) => [
                  styles.primaryButton,
                  emailSubmitDisabled && styles.primaryButtonDisabled,
                  pressed && !emailSubmitDisabled && styles.primaryButtonPressed,
                ]}
              >
                <Text
                  style={[
                    styles.primaryButtonText,
                    emailSubmitDisabled && styles.primaryButtonTextDisabled,
                  ]}
                >
                  {authBusy ? 'Signing in…' : 'Sign in'}
                </Text>
              </Pressable>
            </View>

            <View style={localStyles.footerRow}>
              <Text style={{ color: theme.colors.textSecondary }}>Need a new account?</Text>
              <Pressable accessibilityRole="button" onPress={handleBackToOnboarding}>
                <Text style={styles.accountLegalLink}>Continue onboarding</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
