import { useMemo, useState } from 'react';
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
import { useAppTheme } from '@/theme';

import DecorativeIllustration from '../DecorativeIllustration';
import type { StepComponentProps } from '../types';
import { createOnboardingStyles, spacingScale } from '../styles';

const leftHandIllustration = require('@/assets/illustrations/adamleft.png');
const rightHandIllustration = require('@/assets/illustrations/adamright.png');

const localStyles = StyleSheet.create({
  heroScene: {
    minHeight: 220,
  },
  heroCopy: {
    maxWidth: 250,
  },
  statusCard: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    gap: spacingScale.sm,
    paddingVertical: spacingScale.md,
    paddingHorizontal: spacingScale.lg,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
  },
  statusTitle: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
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
    gap: spacingScale.md,
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

const connectedLabels = {
  google: 'Google is connected',
  apple: 'Apple is connected',
  email: 'Email account is connected',
};

const extractAuthErrorCode = (error: unknown) =>
  typeof error === 'object' && error && 'code' in error
    ? String((error as { code?: unknown }).code)
    : '';

const isAlreadyLinkedAuthError = (code: string) =>
  code === 'auth/credential-already-in-use' ||
  code === 'auth/provider-already-linked' ||
  code === 'auth/account-exists-with-different-credential';

const StepAccount = ({ onNext }: StepComponentProps) => {
  const theme = useAppTheme();
  const { styles, colors: dynamicColors } = useMemo(() => createOnboardingStyles(theme), [theme]);
  const { state, updateState } = useOnboardingContext();
  const {
    authAccountSelection,
    authBusy,
    authError,
    authUser,
    clearAuthError,
    isAnonymousSession,
    linkWithApple,
    linkWithEmail,
    linkWithGoogle,
    signInWithApple,
    signInWithGoogle,
  } = useUserContext();
  const router = useRouter();

  const [email, setEmail] = useState(state.emailAddress);
  const [password, setPassword] = useState(state.accountPassword);
  const [confirmPassword, setConfirmPassword] = useState(state.accountPasswordConfirm);
  const [showEmailSheet, setShowEmailSheet] = useState(false);

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
    authBusy || !emailValid || !passwordLongEnough || !passwordsMatch || !state.termsAccepted;
  const connectedAccountSelection =
    authAccountSelection === 'google' ||
    authAccountSelection === 'apple' ||
    authAccountSelection === 'email'
      ? authAccountSelection
      : null;
  const hasConnectedAccount = !isAnonymousSession && connectedAccountSelection !== null;

  const runHaptic = () => {
    void Haptics.selectionAsync().catch(() => undefined);
  };

  const handleContinueWithConnectedAccount = () => {
    if (!authAccountSelection) {
      return;
    }

    clearAuthError();
    updateState({
      accountSelection: authAccountSelection,
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
      await linkWithGoogle();
      updateState({ accountSelection: 'google', termsAccepted: true });
      onNext();
    } catch (error) {
      const code = extractAuthErrorCode(error);

      if (!isAlreadyLinkedAuthError(code)) {
        return;
      }

      try {
        await signInWithGoogle();
        router.replace('/');
      } catch {
        // Error text is surfaced from context.
      }
    }
  };

  const handleApplePress = async () => {
    clearAuthError();
    runHaptic();

    try {
      await linkWithApple();
      updateState({ accountSelection: 'apple', termsAccepted: true });
      onNext();
    } catch (error) {
      const code = extractAuthErrorCode(error);

      if (!isAlreadyLinkedAuthError(code)) {
        return;
      }

      try {
        await signInWithApple();
        router.replace('/');
      } catch {
        // Error text is surfaced from context.
      }
    }
  };

  const openEmailSheet = () => {
    clearAuthError();
    runHaptic();
    setShowEmailSheet(true);
    updateState({ accountSelection: 'email' });
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
            <View pointerEvents="box-none" style={[styles.inlineActionScene, localStyles.heroScene]}>
              <DecorativeIllustration
                source={leftHandIllustration}
                widthRatio={0.2}
                minWidth={70}
                maxWidth={86}
                top={18}
                left={-spacingScale.lg}
              />
              <Text accessibilityRole="header" style={[styles.accountHero, localStyles.heroCopy]}>
                {`Your moment in\nhistory awaits.`}
              </Text>
              <DecorativeIllustration
                source={rightHandIllustration}
                widthRatio={0.2}
                minWidth={70}
                maxWidth={86}
                top={18}
                right={-spacingScale.lg}
              />
            </View>
          </View>

          <View style={styles.accountActions}>
            {hasConnectedAccount ? (
              <View style={localStyles.statusCard}>
                <Text style={[localStyles.statusTitle, { color: theme.colors.textPrimary }]}>
                  {connectedLabels[connectedAccountSelection]}
                </Text>
                <Text style={localStyles.helperText}>
                  Your guest progress is ready to keep under this account.
                </Text>
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
              </View>
            ) : (
              <>
                <View style={localStyles.authRow}>
                  {Platform.OS === 'ios' ? (
                    <Pressable
                      accessibilityLabel={providerLabels.apple}
                      accessibilityRole="button"
                      accessibilityState={{ busy: authBusy }}
                      disabled={authBusy}
                      hitSlop={spacingScale.xs}
                      onPress={() => void handleApplePress()}
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
                    accessibilityLabel={providerLabels.google}
                    accessibilityRole="button"
                    accessibilityState={{ busy: authBusy }}
                    disabled={authBusy}
                    hitSlop={spacingScale.xs}
                    onPress={() => void handleGooglePress()}
                    style={({ pressed }) => [
                      styles.authButton,
                      authBusy && styles.disabledButton,
                      pressed && styles.authButtonPressed,
                    ]}
                  >
                    <Ionicons name="logo-google" size={28} style={styles.authButtonIcon} />
                  </Pressable>

                  <Pressable
                    accessibilityLabel={providerLabels.email}
                    accessibilityRole="button"
                    accessibilityState={{ busy: authBusy }}
                    disabled={authBusy}
                    hitSlop={spacingScale.xs}
                    onPress={openEmailSheet}
                    style={({ pressed }) => [
                      styles.authButton,
                      authBusy && styles.disabledButton,
                      pressed && styles.authButtonPressed,
                    ]}
                  >
                    <Ionicons name="mail-outline" size={28} style={styles.authButtonIcon} />
                  </Pressable>
                </View>

                <Text style={localStyles.helperText}>
                  Connect a real account now to keep your saved stories and preferences.
                </Text>
              </>
            )}

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
                    onPress={() => router.push('/sign-in' as never)}
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
              <Text style={styles.emailSheetTitle}>Create your account</Text>
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
                  placeholder="Create password (min 8 characters)"
                  secureTextEntry
                  style={styles.input}
                  value={password}
                />
                {!passwordLongEnough && password.length > 0 ? (
                  <Text style={styles.errorText}>Password must be at least 8 characters.</Text>
                ) : null}

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
                    {authBusy ? 'Creating account…' : 'Create account'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
};

export default StepAccount;
