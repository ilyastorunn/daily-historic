import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import {
  type AccountSelection,
  useOnboardingContext,
} from '@/contexts/onboarding-context';

import OptionRow from '../OptionRow';
import type { StepComponentProps } from '../types';
import { styles } from '../styles';

const StepAccount = ({ onNext }: StepComponentProps) => {
  const { state, updateState } = useOnboardingContext();
  const [email, setEmail] = useState(state.emailAddress);

  const handleSelect = (selection: AccountSelection) => {
    updateState({ accountSelection: selection });
    if (selection !== 'email') {
      onNext();
    }
  };

  const handleContinueWithEmail = () => {
    updateState({ accountSelection: 'email', emailAddress: email.trim() });
    onNext();
  };

  const canContinue = state.accountSelection === 'email' ? email.trim().length > 3 : true;

  return (
    <ScrollView contentContainerStyle={styles.stepScroll}>
      <Text style={styles.stepTitle}>Create your sync-ready profile</Text>
      <Text style={styles.sectionCopy}>
        Save favorites, keep streaks, and pick up where you left off across devices.
      </Text>

      <View style={styles.stackGap}>
        <OptionRow
          label="Continue with Google"
          onPress={() => handleSelect('google')}
          selected={state.accountSelection === 'google'}
        />
        <OptionRow
          label="Continue with Apple"
          onPress={() => handleSelect('apple')}
          selected={state.accountSelection === 'apple'}
        />
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Continue with email</Text>
          <TextInput
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />
          <Pressable
            style={({ pressed }) => [
              styles.inlinePrimaryButton,
              (!canContinue || email.trim().length < 3) && styles.disabledButton,
              pressed && canContinue && styles.primaryButtonPressed,
            ]}
            disabled={!canContinue}
            onPress={handleContinueWithEmail}
          >
            <Text
              style={[
                styles.inlinePrimaryButtonText,
                !canContinue && styles.disabledButtonText,
              ]}
            >
              Save email
            </Text>
          </Pressable>
        </View>
        <OptionRow
          label="Continue without account (limited)"
          subcopy="We’ll remind you later to secure your timeline."
          onPress={() => {
            updateState({ accountSelection: 'guest' });
            onNext();
          }}
          selected={state.accountSelection === 'guest'}
        />
      </View>
    </ScrollView>
  );
};

export default StepAccount;
