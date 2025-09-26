import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import {
  type AccountSelection,
  useOnboardingContext,
} from '@/contexts/onboarding-context';

import OptionRow from '../OptionRow';
import type { StepComponentProps } from '../types';
import { styles } from '../styles';

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const StepAccount = ({ onNext }: StepComponentProps) => {
  const { state, updateState } = useOnboardingContext();
  const router = useRouter();
  const [email, setEmail] = useState(state.emailAddress);
  const [password, setPassword] = useState(state.accountPassword);
  const [confirmPassword, setConfirmPassword] = useState(state.accountPasswordConfirm);
  const [username, setUsername] = useState(state.username);

  const selectSocial = (selection: AccountSelection) => {
    updateState({ accountSelection: selection, termsAccepted: true });
    onNext();
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    updateState({ emailAddress: value.trim(), accountSelection: 'email' });
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    updateState({ accountPassword: value, accountSelection: 'email' });
  };

  const handleConfirmPassword = (value: string) => {
    setConfirmPassword(value);
    updateState({ accountPasswordConfirm: value, accountSelection: 'email' });
  };

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    updateState({ username: value.trim(), accountSelection: 'email' });
  };

  const toggleTerms = () => {
    updateState({ termsAccepted: !state.termsAccepted, accountSelection: 'email' });
  };

  const handleLogin = () => {
    router.replace('/(tabs)');
  };

  const emailValid = isValidEmail(email);
  const passwordLongEnough = password.length >= 8;
  const passwordsMatch = password === confirmPassword && password.length > 0;

  const emailSubmitDisabled =
    !emailValid || !passwordLongEnough || !passwordsMatch || !state.termsAccepted;

  const handleEmailSubmit = () => {
    if (emailSubmitDisabled) {
      return;
    }

    updateState({ accountSelection: 'email' });
    onNext();
  };

  return (
    <ScrollView contentContainerStyle={styles.stepScroll}>
      <Text style={styles.stepTitle}>Create your Chrono account</Text>
      <Text style={styles.sectionCopy}>
        Link your preferences across devices and keep your daily streak glowing.
      </Text>

      <View style={styles.formCard}>
        <TextInput
          placeholder="you@example.com"
          value={email}
          onChangeText={handleEmailChange}
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />
        {!emailValid && email.length > 0 && (
          <Text style={styles.errorText}>Enter a valid email address.</Text>
        )}

        <TextInput
          placeholder="Create password (min 8 characters)"
          value={password}
          onChangeText={handlePasswordChange}
          secureTextEntry
          style={styles.input}
        />
        {!passwordLongEnough && password.length > 0 && (
          <Text style={styles.errorText}>Password must be at least 8 characters.</Text>
        )}

        <TextInput
          placeholder="Confirm password"
          value={confirmPassword}
          onChangeText={handleConfirmPassword}
          secureTextEntry
          style={styles.input}
        />
        {!passwordsMatch && confirmPassword.length > 0 && (
          <Text style={styles.errorText}>Passwords need to match.</Text>
        )}

        <TextInput
          placeholder="Username (optional)"
          value={username}
          onChangeText={handleUsernameChange}
          style={styles.input}
        />

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
            Create Account
          </Text>
        </Pressable>

        <Text style={styles.helperText}>We value your privacy. No spam, ever.</Text>
      </View>

      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerLabel}>OR</Text>
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.stackGap}>
        <OptionRow
          label="Continue with Apple"
          iconName="logo-apple"
          onPress={() => selectSocial('apple')}
          selected={state.accountSelection === 'apple'}
        />
        <OptionRow
          label="Continue with Google"
          iconName="logo-google"
          onPress={() => selectSocial('google')}
          selected={state.accountSelection === 'google'}
        />
        <OptionRow
          label="Continue with Meta"
          iconName="logo-facebook"
          onPress={() => selectSocial('meta')}
          selected={state.accountSelection === 'meta'}
        />
      </View>

      <Text style={styles.legalText}>
        By signing up, you agree to Chrono’s <Text style={styles.legalLink}>Terms of Service</Text> and{' '}
        <Text style={styles.legalLink}>Privacy Policy</Text>.
      </Text>

      <Pressable onPress={handleLogin}>
        <Text style={styles.ghostLink}>Already have an account? Log in</Text>
      </Pressable>
    </ScrollView>
  );
};

export default StepAccount;
