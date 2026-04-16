import { useEffect, useMemo, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';

import { useOnboardingContext } from '@/contexts/onboarding-context';
import { useUserContext } from '@/contexts/user-context';
import { readLastUsedAuthProvider, type LastUsedAuthProvider } from '@/services/last-used-auth';
import { useAppTheme } from '@/theme';

import type { StepComponentProps } from '../types';
import { createOnboardingStyles, spacingScale } from '../styles';

const localStyles = StyleSheet.create({
  heroCopy: {
    maxWidth: 250,
  },
  helperText: {
    maxWidth: 300,
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 13,
    lineHeight: 18,
  },
  authError: {
    maxWidth: 300,
    textAlign: 'center',
    color: '#B42318',
    fontSize: 13,
    lineHeight: 18,
  },
  authRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: spacingScale.md,
  },
  authOption: {
    width: 72,
    alignItems: 'center',
    gap: spacingScale.xs,
  },
  lastUsedBadge: {
    paddingHorizontal: spacingScale.sm,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(112, 141, 118, 0.16)',
  },
  lastUsedBadgeText: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    color: '#5B6D5F',
  },
  accountLinkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacingScale.xs,
    flexWrap: 'wrap',
  },
});

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const hexToRgb = (hex: string) => {
  const normalized = hex.replace('#', '');
  const bigint = parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b };
};

const withAlpha = (hex: string, alpha: number) => {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const providerLabels = {
  google: 'Continue with Google',
  apple: 'Continue with Apple',
  email: 'Create with Email',
};

type EmailSheetMode = 'create' | 'sign-in';

const StepAccount = ({ onNext }: StepComponentProps) => {
  const theme = useAppTheme();
  const { styles, colors: dynamicColors } = useMemo(() => createOnboardingStyles(theme), [theme]);
  const { state, updateState } = useOnboardingContext();
  const {
    authAccountSelection,
    authBusy,
    authError,
    authUser,
    profile,
    clearAuthError,
    isAnonymousSession,
    linkWithApple,
    linkWithEmail,
    linkWithGoogle,
    signInWithEmail,
  } = useUserContext();
  const router = useRouter();

  const [email, setEmail] = useState(state.emailAddress);
  const [password, setPassword] = useState(state.accountPassword);
  const [confirmPassword, setConfirmPassword] = useState(state.accountPasswordConfirm);
  const [showEmailSheet, setShowEmailSheet] = useState(false);
  const [emailSheetMode, setEmailSheetMode] = useState<EmailSheetMode>('create');
  const [storedLastUsedProvider, setStoredLastUsedProvider] = useState<LastUsedAuthProvider | null>(
    null
  );

  useEffect(() => {
    let mounted = true;

    const loadLastUsedProvider = async () => {
      try {
        const provider = await readLastUsedAuthProvider();

        if (mounted) {
          setStoredLastUsedProvider(provider);
        }
      } catch {
        if (mounted) {
          setStoredLastUsedProvider(null);
        }
      }
    };

    void loadLastUsedProvider();

    return () => {
      mounted = false;
    };
  }, []);

  const gradientUri = useMemo(() => {
    const heroTone = dynamicColors.heroBackground ?? dynamicColors.screen;
    const accentMist = withAlpha(dynamicColors.accentPrimary, 0.12);
    const svg = `\
<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1" preserveAspectRatio="none">\
  <defs>\
    <radialGradient id="g" cx="0.55" cy="0.45" r="0.85">\
      <stop offset="0%" stop-color="${heroTone}" />\
      <stop offset="60%" stop-color="${heroTone}" />\
      <stop offset="100%" stop-color="${accentMist}" />\
    </radialGradient>\
  </defs>\
  <rect x="0" y="0" width="1" height="1" fill="url(#g)" />\
</svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }, [dynamicColors.accentPrimary, dynamicColors.heroBackground, dynamicColors.screen]);

  const emailValid = isValidEmail(email);
  const passwordLongEnough = password.length >= 8;
  const passwordsMatch = password === confirmPassword && password.length > 0;
  const emailSubmitDisabled =
    emailSheetMode === 'create'
      ? authBusy || !emailValid || !passwordLongEnough || !passwordsMatch || !state.termsAccepted
      : authBusy || !emailValid || password.length === 0;
  const connectedAccountSelection =
    authAccountSelection === 'google' ||
    authAccountSelection === 'apple' ||
    authAccountSelection === 'email'
      ? authAccountSelection
      : null;
  const profileAccountSelection =
    profile?.accountSelection === 'google' ||
    profile?.accountSelection === 'apple' ||
    profile?.accountSelection === 'email'
      ? profile.accountSelection
      : null;
  const continueAccountSelection = connectedAccountSelection ?? profileAccountSelection;
  const resolvedLastUsedProvider =
    connectedAccountSelection ?? storedLastUsedProvider ?? profileAccountSelection;

  const runHaptic = () => {
    void Haptics.selectionAsync().catch(() => undefined);
  };

  const handleContinueWithConnectedAccount = () => {
    if (!continueAccountSelection) {
      return;
    }

    clearAuthError();
    updateState({
      accountSelection: continueAccountSelection,
      emailAddress: state.emailAddress || authUser?.email || '',
      termsAccepted: true,
    });
    runHaptic();
    onNext();
  };

  const handleGooglePress = async () => {
    clearAuthError();
    runHaptic();

    try {
      const result = await linkWithGoogle();

      if (result === 'signedIn') {
        router.replace('/');
        return;
      }

      updateState({ accountSelection: 'google', termsAccepted: true });
      onNext();
    } catch {
      // Error text is surfaced from context.
    }
  };

  const handleApplePress = async () => {
    clearAuthError();
    runHaptic();

    try {
      const result = await linkWithApple();

      if (result === 'signedIn') {
        router.replace('/');
        return;
      }

      updateState({ accountSelection: 'apple', termsAccepted: true });
      onNext();
    } catch {
      // Error text is surfaced from context.
    }
  };

  const openEmailSheet = (mode: EmailSheetMode = 'create') => {
    clearAuthError();
    runHaptic();
    setEmailSheetMode(mode);
    setShowEmailSheet(true);
    if (mode === 'create') {
      updateState({ accountSelection: 'email' });
    }
  };

  const closeEmailSheet = () => {
    setShowEmailSheet(false);
  };

  const handleSkipAccount = () => {
    clearAuthError();
    runHaptic();
    updateState({ accountSelection: 'anonymous', termsAccepted: false });
    onNext();
  };

  const handleEmailSubmit = async () => {
    if (emailSubmitDisabled) {
      return;
    }

    clearAuthError();

    try {
      if (emailSheetMode === 'sign-in') {
        await signInWithEmail(email.trim(), password);
        runHaptic();
        setShowEmailSheet(false);
        router.replace('/');
        return;
      }

      await linkWithEmail(email.trim(), password);
      updateState({
        accountSelection: 'email',
        emailAddress: email.trim(),
        accountPassword: password,
        accountPasswordConfirm: confirmPassword,
      });
      runHaptic();
      setShowEmailSheet(false);
      onNext();
    } catch {
      // Error text is surfaced from context.
    }
  };

  const toggleTerms = () => {
    clearAuthError();
    updateState({ termsAccepted: !state.termsAccepted, accountSelection: 'email' });
  };

  const toggleEmailSheetMode = () => {
    clearAuthError();
    setEmailSheetMode((currentMode) => (currentMode === 'create' ? 'sign-in' : 'create'));
  };

  return (
    <View style={styles.accountScreen}>
      <Image source={{ uri: gradientUri }} style={styles.accountBackground} />
      <ScrollView
        contentContainerStyle={styles.accountScroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.accountContent}>
          <View style={styles.accountHeroContainer}>
            <View pointerEvents="box-none" style={styles.inlineActionScene}>
              <Text accessibilityRole="header" style={[styles.accountHero, localStyles.heroCopy]}>
                {`Your moment in\nhistory awaits.`}
              </Text>
            </View>
          </View>

          <View style={styles.accountActions}>
            <View style={localStyles.authRow}>
              {Platform.OS === 'ios' ? (
                <View style={localStyles.authOption}>
                  <Pressable
                    accessibilityLabel={providerLabels.apple}
                    accessibilityRole="button"
                    accessibilityState={{ busy: authBusy }}
                    disabled={authBusy || !isAnonymousSession}
                    hitSlop={spacingScale.xs}
                    onPress={() => void handleApplePress()}
                    style={({ pressed }) => [
                      styles.authButton,
                      (authBusy || !isAnonymousSession) && styles.disabledButton,
                      pressed && styles.authButtonPressed,
                    ]}
                  >
                    <Ionicons name="logo-apple" size={28} style={styles.authButtonIcon} />
                  </Pressable>
                  {resolvedLastUsedProvider === 'apple' ? (
                    <View style={localStyles.lastUsedBadge}>
                      <Text style={localStyles.lastUsedBadgeText}>Last used</Text>
                    </View>
                  ) : null}
                </View>
              ) : null}

              <View style={localStyles.authOption}>
                <Pressable
                  accessibilityLabel={providerLabels.google}
                  accessibilityRole="button"
                  accessibilityState={{ busy: authBusy }}
                  disabled={authBusy || !isAnonymousSession}
                  hitSlop={spacingScale.xs}
                  onPress={() => void handleGooglePress()}
                  style={({ pressed }) => [
                    styles.authButton,
                    (authBusy || !isAnonymousSession) && styles.disabledButton,
                    pressed && styles.authButtonPressed,
                  ]}
                >
                  <Ionicons name="logo-google" size={28} style={styles.authButtonIcon} />
                </Pressable>
                {resolvedLastUsedProvider === 'google' ? (
                  <View style={localStyles.lastUsedBadge}>
                    <Text style={localStyles.lastUsedBadgeText}>Last used</Text>
                  </View>
                ) : null}
              </View>

              <View style={localStyles.authOption}>
                <Pressable
                  accessibilityLabel={providerLabels.email}
                  accessibilityRole="button"
                  accessibilityState={{ busy: authBusy }}
                  disabled={authBusy || !isAnonymousSession}
                  hitSlop={spacingScale.xs}
                  onPress={() => openEmailSheet('create')}
                  style={({ pressed }) => [
                    styles.authButton,
                    (authBusy || !isAnonymousSession) && styles.disabledButton,
                    pressed && styles.authButtonPressed,
                  ]}
                >
                  <Ionicons name="mail-outline" size={28} style={styles.authButtonIcon} />
                </Pressable>
                {resolvedLastUsedProvider === 'email' ? (
                  <View style={localStyles.lastUsedBadge}>
                    <Text style={localStyles.lastUsedBadgeText}>Last used</Text>
                  </View>
                ) : null}
              </View>
            </View>

            <Text style={localStyles.helperText}>
              {isAnonymousSession
                ? 'Connect a real account now to keep your saved stories and preferences.'
                : 'You are already connected. Continue to keep using this account.'}
            </Text>

            {!isAnonymousSession ? (
              <Pressable
                accessibilityRole="button"
                disabled={authBusy}
                onPress={handleContinueWithConnectedAccount}
                style={({ pressed }) => [
                  styles.primaryButton,
                  authBusy && styles.primaryButtonDisabled,
                  pressed && !authBusy && styles.primaryButtonPressed,
                ]}
              >
                <Text style={styles.primaryButtonText}>Continue</Text>
              </Pressable>
            ) : null}

            {authError ? <Text style={localStyles.authError}>{authError}</Text> : null}

            {isAnonymousSession ? (
              <>
                <Pressable
                  accessibilityLabel="Continue without sign up"
                  accessibilityRole="button"
                  disabled={authBusy}
                  hitSlop={spacingScale.xs}
                  onPress={handleSkipAccount}
                  style={({ pressed, hovered }) => [
                    styles.accountLink,
                    authBusy && styles.disabledButton,
                    (pressed || hovered) && styles.accountLinkActive,
                  ]}
                >
                  {({ pressed, hovered }) => (
                    <Text
                      style={[
                        styles.accountLinkText,
                        (pressed || hovered) && styles.accountLinkTextActive,
                      ]}
                    >
                      Continue without sign up
                    </Text>
                  )}
                </Pressable>

                <View style={localStyles.accountLinkRow}>
                  <Text style={localStyles.helperText}>Already have an account?</Text>
                  <Pressable
                    accessibilityRole="button"
                    disabled={authBusy}
                    onPress={() => openEmailSheet('sign-in')}
                  >
                    <Text style={styles.accountLegalLink}>Sign in</Text>
                  </Pressable>
                </View>
              </>
            ) : null}

            <Text style={styles.accountLegal}>
              By continuing, you agree to Chrono&apos;s{' '}
              <Text style={styles.accountLegalLink}>Terms</Text> and{' '}
              <Text style={styles.accountLegalLink}>Privacy</Text>.
            </Text>
          </View>
        </View>
      </ScrollView>

      <Modal
        animationType="fade"
        transparent
        visible={showEmailSheet}
        onRequestClose={closeEmailSheet}
      >
        <View style={styles.emailSheetRoot}>
          <Pressable style={styles.emailSheetOverlay} onPress={closeEmailSheet}>
            <View />
          </Pressable>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.emailSheetContainer}
          >
            <View style={styles.emailSheet}>
              <View style={styles.emailSheetHandle} />
              <Text style={styles.emailSheetTitle}>
                {emailSheetMode === 'create' ? 'Create your account' : 'Sign in to your account'}
              </Text>
              <View style={styles.emailSheetForm}>
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
                {!emailValid && email.length > 0 ? (
                  <Text style={styles.errorText}>Enter a valid email address.</Text>
                ) : null}

                <TextInput
                  onChangeText={(value) => {
                    clearAuthError();
                    setPassword(value);
                  }}
                  placeholder={
                    emailSheetMode === 'create'
                      ? 'Create password (min 8 characters)'
                      : 'Password'
                  }
                  secureTextEntry
                  style={styles.input}
                  value={password}
                />
                {emailSheetMode === 'create' && !passwordLongEnough && password.length > 0 ? (
                  <Text style={styles.errorText}>Password must be at least 8 characters.</Text>
                ) : null}

                {emailSheetMode === 'create' ? (
                  <>
                    <TextInput
                      onChangeText={(value) => {
                        clearAuthError();
                        setConfirmPassword(value);
                      }}
                      placeholder="Confirm password"
                      secureTextEntry
                      style={styles.input}
                      value={confirmPassword}
                    />
                    {!passwordsMatch && confirmPassword.length > 0 ? (
                      <Text style={styles.errorText}>Passwords need to match.</Text>
                    ) : null}

                    <Pressable
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: state.termsAccepted }}
                      onPress={toggleTerms}
                      style={({ pressed }) => [styles.termsToggle, pressed && styles.pressedButton]}
                    >
                      <View
                        style={[
                          styles.termsCheckbox,
                          state.termsAccepted && styles.termsCheckboxSelected,
                        ]}
                      >
                        {state.termsAccepted ? (
                          <Ionicons name="checkmark" size={14} style={styles.termsCheckIcon} />
                        ) : null}
                      </View>
                      <Text style={styles.termsCopy}>
                        I agree to the Terms and Privacy Policy.
                      </Text>
                    </Pressable>
                    <View style={localStyles.accountLinkRow}>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => router.push('/legal/terms')}
                        style={({ pressed }) => pressed && { opacity: 0.8 }}
                      >
                        <Text style={[styles.legalText, styles.legalLink]}>View Terms</Text>
                      </Pressable>
                      <Text style={styles.legalText}>and</Text>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => router.push('/legal/privacy')}
                        style={({ pressed }) => pressed && { opacity: 0.8 }}
                      >
                        <Text style={[styles.legalText, styles.legalLink]}>Privacy Policy</Text>
                      </Pressable>
                    </View>
                  </>
                ) : null}

                {authError ? <Text style={localStyles.authError}>{authError}</Text> : null}

                <Pressable
                  accessibilityRole="button"
                  disabled={emailSubmitDisabled}
                  onPress={() => void handleEmailSubmit()}
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
                    {authBusy
                      ? emailSheetMode === 'create'
                        ? 'Creating account…'
                        : 'Signing in…'
                      : emailSheetMode === 'create'
                        ? 'Create account'
                        : 'Sign in'}
                  </Text>
                </Pressable>

                <View style={localStyles.accountLinkRow}>
                  <Text style={localStyles.helperText}>
                    {emailSheetMode === 'create'
                      ? 'Already have an email account?'
                      : 'Need a new email account?'}
                  </Text>
                  <Pressable accessibilityRole="button" onPress={toggleEmailSheetMode}>
                    <Text style={styles.accountLegalLink}>
                      {emailSheetMode === 'create' ? 'Sign in' : 'Create one'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
};

export default StepAccount;
