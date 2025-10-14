import { useMemo, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useOnboardingContext } from '@/contexts/onboarding-context';
import { useAppTheme } from '@/theme';

import type { StepComponentProps } from '../types';
import { spacingScale, styles } from '../styles';

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

const StepAccount = ({ onNext }: StepComponentProps) => {
  const { colors: dynamicColors } = useAppTheme();
  const { state, updateState } = useOnboardingContext();

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
    !emailValid || !passwordLongEnough || !passwordsMatch || !state.termsAccepted;

  const runHaptic = () => {
    void Haptics.selectionAsync().catch(() => undefined);
  };

  const handleSelectProvider = (provider: 'apple' | 'google') => {
    runHaptic();
    updateState({ accountSelection: provider, termsAccepted: true });
    onNext();
  };

  const openEmailSheet = () => {
    runHaptic();
    setShowEmailSheet(true);
    updateState({ accountSelection: 'email' });
  };

  const closeEmailSheet = () => {
    setShowEmailSheet(false);
  };

  const handleSkipAccount = () => {
    runHaptic();
    updateState({ accountSelection: 'anonymous', termsAccepted: false });
    onNext();
  };

  const handleEmailSubmit = () => {
    if (emailSubmitDisabled) {
      return;
    }

    updateState({
      accountSelection: 'email',
      emailAddress: email.trim(),
      accountPassword: password,
      accountPasswordConfirm: confirmPassword,
    });

    runHaptic();
    setShowEmailSheet(false);
    onNext();
  };

  const toggleTerms = () => {
    updateState({ termsAccepted: !state.termsAccepted, accountSelection: 'email' });
  };

  return (
    <View style={styles.accountScreen}>
      <Image pointerEvents="none" source={{ uri: gradientUri }} style={styles.accountBackground} />
      <ScrollView
        contentContainerStyle={styles.accountScroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.accountContent}>
          <Text accessibilityRole="header" style={styles.accountHero}>
            Your moment in history awaits.
          </Text>

          <View style={styles.accountActions}>
            <View style={styles.accountButtonsRow}>
              <Pressable
                accessibilityLabel="Continue with Apple"
                accessibilityRole="button"
                hitSlop={spacingScale.xs}
                onPress={() => handleSelectProvider('apple')}
                style={({ pressed, focused }) => [
                  styles.authButton,
                  pressed && styles.authButtonPressed,
                  focused && styles.authButtonFocused,
                ]}
              >
                <Ionicons name="logo-apple" size={28} style={styles.authButtonIcon} />
              </Pressable>

              <Pressable
                accessibilityLabel="Continue with Google"
                accessibilityRole="button"
                hitSlop={spacingScale.xs}
                onPress={() => handleSelectProvider('google')}
                style={({ pressed, focused }) => [
                  styles.authButton,
                  pressed && styles.authButtonPressed,
                  focused && styles.authButtonFocused,
                ]}
              >
                <Ionicons name="logo-google" size={28} style={styles.authButtonIcon} />
              </Pressable>

              <Pressable
                accessibilityLabel="Continue with Email"
                accessibilityRole="button"
                hitSlop={spacingScale.xs}
                onPress={openEmailSheet}
                style={({ pressed, focused }) => [
                  styles.authButton,
                  pressed && styles.authButtonPressed,
                  focused && styles.authButtonFocused,
                ]}
              >
                <Ionicons name="mail-outline" size={28} style={styles.authButtonIcon} />
              </Pressable>
            </View>

            <Pressable
              accessibilityLabel="Continue without sign up"
              accessibilityRole="button"
              hitSlop={spacingScale.xs}
              onPress={handleSkipAccount}
              style={({ pressed, focused, hovered }) => [
                styles.accountLink,
                (pressed || focused || hovered) && styles.accountLinkActive,
              ]}
            >
              {({ pressed, focused, hovered }) => (
                <Text
                  style={[
                    styles.accountLinkText,
                    (pressed || focused || hovered) && styles.accountLinkTextActive,
                  ]}
                >
                  Continue without sign up
                </Text>
              )}
            </Pressable>

            <Text style={styles.accountLegal}>
              By continuing, you agree to Chrono’s{' '}
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
              <Text style={styles.emailSheetTitle}>Continue with email</Text>
              <View style={styles.emailSheetForm}>
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  onChangeText={(value) => setEmail(value)}
                  placeholder="you@example.com"
                  style={styles.input}
                  value={email}
                />
              {!emailValid && email.length > 0 && (
                <Text style={styles.errorText}>Enter a valid email address.</Text>
              )}

              <TextInput
                onChangeText={(value) => setPassword(value)}
                placeholder="Create password (min 8 characters)"
                secureTextEntry
                style={styles.input}
                value={password}
              />
              {!passwordLongEnough && password.length > 0 && (
                <Text style={styles.errorText}>Password must be at least 8 characters.</Text>
              )}

              <TextInput
                onChangeText={(value) => setConfirmPassword(value)}
                placeholder="Confirm password"
                secureTextEntry
                style={styles.input}
                value={confirmPassword}
              />
              {!passwordsMatch && confirmPassword.length > 0 && (
                <Text style={styles.errorText}>Passwords need to match.</Text>
              )}

              <Pressable onPress={toggleTerms} style={styles.checkboxRow}>
                <View style={[styles.checkbox, state.termsAccepted && styles.checkboxChecked]} />
                <Text style={styles.checkboxLabel}>
                  I agree to the Terms of Service and Privacy Policy
                </Text>
              </Pressable>

              <Pressable
                disabled={emailSubmitDisabled}
                onPress={handleEmailSubmit}
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
                  Continue with email
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
