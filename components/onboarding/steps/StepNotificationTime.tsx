import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { useOnboardingContext } from '@/contexts/onboarding-context';

import type { StepComponentProps } from '../types';
import { styles } from '../styles';

type TimeOption = {
  value: string;
  hint: string;
};

const quickOptions: TimeOption[] = [
  { value: '09:00', hint: 'Morning spark' },
  { value: '12:00', hint: 'Midday break' },
  { value: '17:00', hint: 'Evening wind-down' },
];

const isCompleteTime = (value: string) => /^\d{2}:\d{2}$/.test(value);

const StepNotificationTime = ({ onNext }: StepComponentProps) => {
  const { state, updateState } = useOnboardingContext();

  const isQuickMatch = useMemo(
    () => quickOptions.some((option) => option.value === state.notificationTime),
    [state.notificationTime]
  );

  const [selected, setSelected] = useState(isQuickMatch ? state.notificationTime : 'custom');
  const [timezoneInput, setTimezoneInput] = useState(state.timezone);
  const [timeInput, setTimeInput] = useState(isQuickMatch ? '' : state.notificationTime || '');
  const [showError, setShowError] = useState(false);

  const handleSelect = (value: string) => {
    setSelected(value);
    setTimeInput('');
    setShowError(false);
    updateState({ notificationTime: value, notificationEnabled: true });
  };

  const handleCustomSelect = () => {
    setSelected('custom');
    updateState({ notificationTime: '' });
  };

  const validateAndStoreTime = (rawValue: string) => {
    setSelected('custom');
    const sanitized = rawValue.replace(/[^\d:]/g, '');
    const withColon = sanitized.includes(':')
      ? sanitized
      : sanitized.length > 2
        ? `${sanitized.slice(0, 2)}:${sanitized.slice(2, 4)}`
        : sanitized;

    setTimeInput(withColon);

    if (!isCompleteTime(withColon)) {
      updateState({ notificationTime: '' });
      setShowError(false);
      return;
    }

    const [hoursRaw, minutesRaw] = withColon.split(':');
    const hours = Number(hoursRaw);
    const minutes = Number(minutesRaw);

    if (Number.isNaN(hours) || Number.isNaN(minutes) || hours > 23 || minutes > 59) {
      updateState({ notificationTime: '' });
      setShowError(true);
      return;
    }

    const normalized = `${hoursRaw.padStart(2, '0')}:${minutesRaw.padStart(2, '0')}`;
    updateState({ notificationTime: normalized, notificationEnabled: true });
    setShowError(false);
  };

  const handleTimezoneChange = (value: string) => {
    setTimezoneInput(value);
    updateState({ timezone: value.trim() || state.timezone });
  };

  return (
    <ScrollView contentContainerStyle={styles.stepScroll}>
      <Text style={styles.stepTitle}>When should we ping you?</Text>
      <Text style={styles.sectionCopy}>
        Pick a moment in the day for Chrono to deliver your highlight. You can change this anytime.
      </Text>

      <View style={styles.timeOptionGroup}>
        {quickOptions.map((option) => {
          const active = selected === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => handleSelect(option.value)}
              style={({ pressed }) => [
                styles.timeOption,
                active && styles.timeOptionActive,
                pressed && !active && styles.cardPressed,
              ]}
            >
              <Text style={styles.timeOptionLabel}>{option.value}</Text>
              <Text style={styles.timeOptionHint}>{option.hint}</Text>
            </Pressable>
          );
        })}

        <Pressable
          onPress={handleCustomSelect}
          style={({ pressed }) => [
            styles.timeOption,
            selected === 'custom' && styles.timeOptionActive,
            pressed && selected !== 'custom' && styles.cardPressed,
          ]}
        >
          <Text style={styles.timeOptionLabel}>Other time</Text>
          <Text style={styles.timeOptionHint}>Choose a specific schedule</Text>
        </Pressable>
      </View>

      {selected === 'custom' && (
        <View style={[styles.card, styles.timeCustomCard]}>
          <Text style={styles.cardTitle}>Custom reminder</Text>
          <TextInput
            value={timeInput}
            onChangeText={validateAndStoreTime}
            keyboardType="numbers-and-punctuation"
            placeholder="09:45"
            maxLength={5}
            style={styles.input}
            autoCorrect={false}
          />
          {showError && <Text style={styles.errorText}>Enter time as HH:MM (24-hour).</Text>}
        </View>
      )}

      <View style={[styles.card, styles.timeCustomCard]}>
        <Text style={styles.cardTitle}>Time zone</Text>
        <TextInput
          value={timezoneInput}
          onChangeText={handleTimezoneChange}
          autoCapitalize="none"
          placeholder="America/New_York"
          style={styles.input}
        />
        <Text style={styles.helperText}>
          We detected {state.timezone}. Update it if you’d prefer reminders elsewhere.
        </Text>
      </View>

      <Pressable
        onPress={() => {
          updateState({ notificationEnabled: false });
          onNext();
        }}
        style={({ pressed }) => [styles.inlineGhostButton, pressed && styles.inlineGhostButtonPressed]}
      >
        <Text style={[styles.inlineGhostButtonText, styles.inlineGhostButtonTextActive]}>
          Skip reminders for now
        </Text>
      </Pressable>
    </ScrollView>
  );
};

export default StepNotificationTime;
