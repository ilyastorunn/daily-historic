import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import {
  type ReminderWindow,
  useOnboardingContext,
} from '@/contexts/onboarding-context';

import type { StepComponentProps } from '../types';
import { styles } from '../styles';

const reminderOptions: { label: string; value: ReminderWindow }[] = [
  { label: 'Morning', value: 'morning' },
  { label: 'Afternoon', value: 'afternoon' },
  { label: 'Evening', value: 'evening' },
  { label: 'Off', value: 'off' },
];

const StepTimezone = ({ onNext }: StepComponentProps) => {
  const { state, updateState } = useOnboardingContext();
  const [timezone, setTimezone] = useState(state.timezone);
  const [reminderWindow, setReminderWindow] = useState<ReminderWindow>(state.reminderWindow);
  const [enabled, setEnabled] = useState(state.reminderEnabled);

  const handleContinue = () => {
    updateState({ timezone: timezone.trim() || 'UTC', reminderWindow, reminderEnabled: enabled });
    onNext();
  };

  return (
    <ScrollView contentContainerStyle={styles.stepScroll}>
      <Text style={styles.stepTitle}>We’ll drop by at the right moment</Text>
      <Text style={styles.sectionCopy}>
        Confirm your time zone and when you’d like your daily historical highlight.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Time zone</Text>
        <TextInput
          value={timezone}
          onChangeText={setTimezone}
          style={styles.input}
          placeholder="e.g., America/New_York"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reminder window</Text>
        <View style={styles.chipRowWrap}>
          {reminderOptions.map((option) => (
            <Pressable
              key={option.value}
              onPress={() => {
                setReminderWindow(option.value);
                setEnabled(option.value !== 'off');
              }}
              style={({ pressed }) => [
                styles.optionChip,
                styles.optionChipOutlined,
                reminderWindow === option.value && styles.optionChipActive,
                pressed && styles.optionChipPressed,
              ]}
            >
              <Text
                style={[
                  styles.optionChipText,
                  reminderWindow === option.value && styles.optionChipTextActive,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.helperText}>
          Reminders are {enabled ? 'enabled' : 'paused'}; you can adjust this anytime in settings.
        </Text>
      </View>

      <Pressable
        onPress={handleContinue}
        style={({ pressed }) => [styles.inlinePrimaryButton, pressed && styles.primaryButtonPressed]}
      >
        <Text style={styles.inlinePrimaryButtonText}>Save reminder preferences</Text>
      </Pressable>
    </ScrollView>
  );
};

export default StepTimezone;
