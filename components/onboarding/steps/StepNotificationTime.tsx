import { useEffect, useMemo, useState } from 'react';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import {
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';

import { useOnboardingContext } from '@/contexts/onboarding-context';
import { useAppTheme } from '@/theme';

import type { StepComponentProps } from '../types';
import { createOnboardingStyles } from '../styles';

type TimeOption = {
  value: string;
  hint: string;
};

const quickOptions: TimeOption[] = [
  { value: '09:00', hint: 'Morning spark' },
  { value: '12:00', hint: 'Midday break' },
  { value: '17:00', hint: 'Evening wind-down' },
];
const serifFamily = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' });

const timeStringToDate = (value: string) => {
  const [hoursString, minutesString] = value.split(':');
  const date = new Date();
  const hours = Number.parseInt(hoursString ?? '9', 10);
  const minutes = Number.parseInt(minutesString ?? '0', 10);

  date.setHours(Number.isFinite(hours) ? hours : 9);
  date.setMinutes(Number.isFinite(minutes) ? minutes : 0);
  date.setSeconds(0);
  date.setMilliseconds(0);

  return date;
};

const dateToTimeString = (value: Date) => {
  const hours = value.getHours().toString().padStart(2, '0');
  const minutes = value.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

const StepNotificationTime = (_props: StepComponentProps) => {
  const { state, updateState } = useOnboardingContext();
  const theme = useAppTheme();
  const { styles } = useMemo(() => createOnboardingStyles(theme), [theme]);

  const isQuickMatch = useMemo(
    () => quickOptions.some((option) => option.value === state.notificationTime),
    [state.notificationTime]
  );

  const [selected, setSelected] = useState(isQuickMatch ? state.notificationTime : 'custom');
  const [showPickerModal, setShowPickerModal] = useState(false);
  const [draftReminderDate, setDraftReminderDate] = useState(() =>
    timeStringToDate(state.notificationTime || '09:00')
  );

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const animateExpand = () => {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(240, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity)
    );
  };

  const handleSelect = (value: string) => {
    if (selected === 'custom') {
      animateExpand();
    }
    setSelected(value);
    updateState({ notificationTime: value, notificationEnabled: true });
  };

  const handleCustomSelect = () => {
    const baseTime = state.notificationTime || '09:00';
    if (selected !== 'custom') {
      animateExpand();
    }
    setSelected('custom');
    setDraftReminderDate(timeStringToDate(baseTime));
    updateState({ notificationTime: baseTime, notificationEnabled: true });
  };

  const handleReminderPickerChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (!selectedDate) {
      return;
    }
    setDraftReminderDate(selectedDate);
  };

  const handleInlineReminderPickerChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (!selectedDate) {
      return;
    }
    setDraftReminderDate(selectedDate);
    updateState({
      notificationTime: dateToTimeString(selectedDate),
      notificationEnabled: true,
    });
  };

  const handleSaveReminderPicker = () => {
    updateState({
      notificationTime: dateToTimeString(draftReminderDate),
      notificationEnabled: true,
    });
    setShowPickerModal(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.stepScroll} showsVerticalScrollIndicator={false}>
      <Text style={[styles.stepTitle, localStyles.title]}>When should we ping you?</Text>
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

        <View style={[styles.timeOption, selected === 'custom' && styles.timeOptionActive]}>
          <Pressable
            onPress={handleCustomSelect}
            style={({ pressed }) => [pressed && selected !== 'custom' && styles.cardPressed]}
          >
            <View style={localStyles.customOptionHeader}>
              <Text style={styles.timeOptionLabel}>Other time</Text>
              <Text style={styles.timeOptionHint}>Choose a specific schedule</Text>
            </View>
          </Pressable>

          {selected === 'custom' && (
            <View style={localStyles.inlinePickerWrap}>
              {Platform.OS === 'ios' ? (
                <>
                  <Text style={[styles.cardTitle, localStyles.deliveryTitle]}>Delivery time</Text>
                  <Text style={localStyles.timeValue}>{dateToTimeString(draftReminderDate)}</Text>
                  <DateTimePicker
                    value={draftReminderDate}
                    mode="time"
                    display="spinner"
                    minuteInterval={5}
                    textColor={theme.colors.textPrimary}
                    themeVariant={theme.mode}
                    onChange={handleInlineReminderPickerChange}
                  />
                </>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Reminder time, ${dateToTimeString(draftReminderDate)}`}
                  onPress={() => setShowPickerModal(true)}
                  style={({ pressed }) => [localStyles.androidPickerButton, pressed && styles.cardPressed]}
                >
                  <Text style={styles.timeOptionLabel}>Delivery time</Text>
                  <Text style={localStyles.timeValueCompact}>{dateToTimeString(draftReminderDate)}</Text>
                  <Text style={styles.timeOptionHint}>Tap to open native time picker</Text>
                </Pressable>
              )}
            </View>
          )}
        </View>
      </View>

      <Modal
        animationType="fade"
        transparent
        visible={showPickerModal}
        onRequestClose={() => setShowPickerModal(false)}
      >
        <View style={localStyles.pickerOverlay}>
          <View style={[localStyles.pickerCard, { backgroundColor: theme.colors.surface }]}> 
            <View style={localStyles.pickerHeader}>
              <Pressable accessibilityRole="button" onPress={() => setShowPickerModal(false)}>
                <Text style={[localStyles.pickerAction, { color: theme.colors.accentPrimary }]}>Cancel</Text>
              </Pressable>
              <Text style={[localStyles.pickerTitle, { color: theme.colors.textPrimary }]}>Edit Reminder</Text>
              <Pressable accessibilityRole="button" onPress={handleSaveReminderPicker}>
                <Text style={[localStyles.pickerAction, { color: theme.colors.accentPrimary }]}>Save</Text>
              </Pressable>
            </View>

            <DateTimePicker
              value={draftReminderDate}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              minuteInterval={5}
              textColor={Platform.OS === 'ios' ? theme.colors.textPrimary : undefined}
              themeVariant={Platform.OS === 'ios' ? theme.mode : undefined}
              onChange={handleReminderPickerChange}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const localStyles = StyleSheet.create({
  title: {
    fontFamily: serifFamily,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -0.6,
    fontWeight: '400',
  },
  customOptionHeader: {
    alignItems: 'center',
  },
  inlinePickerWrap: {
    marginTop: 14,
    gap: 12,
  },
  deliveryTitle: {
    marginTop: 6,
    textAlign: 'center',
  },
  androidPickerButton: {
    borderRadius: 14,
    paddingVertical: 8,
    gap: 4,
  },
  timeValue: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '400',
    textAlign: 'center',
  },
  timeValueCompact: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '400',
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  pickerCard: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  pickerHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  pickerAction: {
    fontSize: 15,
    fontWeight: '600',
  },
});

export default StepNotificationTime;
