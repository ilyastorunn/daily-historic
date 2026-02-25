import { useState } from 'react';
import { Platform, StyleSheet, Text, TextInput, View } from 'react-native';

import { useOnboardingContext } from '@/contexts/onboarding-context';
import { useAppTheme } from '@/theme';

import type { StepComponentProps } from '../types';

const serifFamily = Platform.select({ ios: 'Times New Roman', android: 'serif', default: 'serif' });
const sansFamily = Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' });

const StepName = ({ onNext }: StepComponentProps) => {
  const { state, updateState } = useOnboardingContext();
  const theme = useAppTheme();
  const [focused, setFocused] = useState(false);

  const handleNameChange = (text: string) => {
    updateState({ displayName: text });
  };

  return (
    <View style={styles.container}>
      <View style={styles.masthead}>
        <Text style={[styles.greeting, { color: theme.colors.textPrimary }]}>
          Welcome, Time Voyager
        </Text>
        <Text style={[styles.subtext, { color: theme.colors.textSecondary }]}>
          How should we call you? Let's personalize your journey through history.
        </Text>
      </View>

      <View style={styles.inputArea}>
        <TextInput
          style={[
            styles.nameInput,
            {
              color: theme.colors.textPrimary,
              borderBottomColor: focused
                ? theme.colors.accentPrimary
                : theme.colors.borderSubtle,
            },
          ]}
          placeholder="Your name"
          placeholderTextColor={theme.colors.textTertiary}
          value={state.displayName}
          onChangeText={handleNameChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={onNext}
          maxLength={50}
          textAlign="center"
          autoFocus
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    gap: 48,
    paddingBottom: 40,
  },
  masthead: {
    alignItems: 'center',
    gap: 12,
  },
  greeting: {
    fontFamily: serifFamily,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -0.6,
    textAlign: 'center',
  },
  subtext: {
    fontFamily: sansFamily,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  inputArea: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  nameInput: {
    fontFamily: serifFamily,
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: -0.4,
    width: '100%',
    borderBottomWidth: 1.5,
    paddingBottom: 10,
    paddingTop: 4,
  },
});

export default StepName;
