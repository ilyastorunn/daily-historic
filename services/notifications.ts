import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Linking, Platform } from 'react-native';

import { trackEvent } from '@/services/analytics';

export type PushPermissionState = 'unknown' | 'enabled' | 'declined';

export type NotificationPreferenceSnapshot = {
  notificationEnabled?: boolean;
  notificationTime?: string;
  timezone?: string;
  pushPermission?: PushPermissionState;
};

type ScheduleDailyNotificationArgs = {
  hour: number;
  minute: number;
  timezone?: string;
  deepLink?: string;
};

type StoredScheduleState = {
  identifier: string;
  time: string;
  timezone: string;
};

const NOTIFICATION_ID_KEY = '@daily_historic/daily_notification_id';
const NOTIFICATION_STATE_KEY = '@daily_historic/daily_notification_state';
const DEFAULT_TIMEZONE = 'UTC';
const DEFAULT_NOTIFICATION_TIME = '09:00';
const DEFAULT_DEEP_LINK = '/(tabs)';

let notificationHandlerConfigured = false;

const parseTime = (value: string | undefined) => {
  const rawValue = value?.trim() || DEFAULT_NOTIFICATION_TIME;
  const [hoursRaw, minutesRaw] = rawValue.split(':');
  const hours = Number.parseInt(hoursRaw ?? '', 10);
  const minutes = Number.parseInt(minutesRaw ?? '', 10);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return {
    hour: hours,
    minute: minutes,
    normalized: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
  };
};

const readStoredState = async (): Promise<StoredScheduleState | null> => {
  const [identifier, serializedState] = await Promise.all([
    AsyncStorage.getItem(NOTIFICATION_ID_KEY),
    AsyncStorage.getItem(NOTIFICATION_STATE_KEY),
  ]);

  if (!identifier || !serializedState) {
    return null;
  }

  try {
    const parsed = JSON.parse(serializedState) as Omit<StoredScheduleState, 'identifier'>;
    if (!parsed?.time || !parsed?.timezone) {
      return null;
    }

    return {
      identifier,
      time: parsed.time,
      timezone: parsed.timezone,
    };
  } catch {
    return null;
  }
};

const writeStoredState = async (state: StoredScheduleState) => {
  await Promise.all([
    AsyncStorage.setItem(NOTIFICATION_ID_KEY, state.identifier),
    AsyncStorage.setItem(
      NOTIFICATION_STATE_KEY,
      JSON.stringify({ time: state.time, timezone: state.timezone })
    ),
  ]);
};

const clearStoredState = async () => {
  await Promise.all([
    AsyncStorage.removeItem(NOTIFICATION_ID_KEY),
    AsyncStorage.removeItem(NOTIFICATION_STATE_KEY),
  ]);
};

const ensureAndroidChannel = async () => {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync('daily-reminder', {
    name: 'Daily Reminder',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 200, 100, 200],
    lightColor: '#3B82F6',
  });
};

export const configureNotificationHandler = () => {
  if (notificationHandlerConfigured) {
    return;
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });

  notificationHandlerConfigured = true;
};

export const getNotificationPermissionState = async (): Promise<PushPermissionState> => {
  const permissions = await Notifications.getPermissionsAsync();

  if (permissions.granted || permissions.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return 'enabled';
  }

  if (permissions.status === 'denied') {
    return 'declined';
  }

  return 'unknown';
};

export const requestNotificationPermission = async (): Promise<PushPermissionState> => {
  const existingState = await getNotificationPermissionState();

  if (existingState === 'enabled') {
    trackEvent('notification_permission_result', { result: 'enabled' });
    return 'enabled';
  }

  const requestResult = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: false,
      allowSound: true,
    },
  });

  const isGranted =
    requestResult.granted ||
    requestResult.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
  const nextState: PushPermissionState = isGranted ? 'enabled' : 'declined';

  trackEvent('notification_permission_result', { result: nextState });

  return nextState;
};

export const cancelDailyNotification = async () => {
  const storedState = await readStoredState();

  if (!storedState?.identifier) {
    return;
  }

  try {
    await Notifications.cancelScheduledNotificationAsync(storedState.identifier);
  } finally {
    await clearStoredState();
    trackEvent('notification_schedule_cancel', { reason: 'disabled_or_invalid' });
  }
};

export const scheduleDailyNotification = async ({
  hour,
  minute,
  timezone,
  deepLink = DEFAULT_DEEP_LINK,
}: ScheduleDailyNotificationArgs) => {
  await ensureAndroidChannel();
  await cancelDailyNotification();

  const trigger: Notifications.CalendarTriggerInput = {
    type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
    hour,
    minute,
    repeats: true,
    channelId: Platform.OS === 'android' ? 'daily-reminder' : undefined,
    timezone,
  };

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Your daily historic moment',
      body: 'Today in history is ready.',
      sound: false,
      data: {
        deepLink,
        source: 'daily-local-reminder',
      },
    },
    trigger,
  });

  const normalizedTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  const effectiveTimezone = timezone || DEFAULT_TIMEZONE;

  await writeStoredState({
    identifier,
    time: normalizedTime,
    timezone: effectiveTimezone,
  });

  trackEvent('notification_schedule_set', {
    hour,
    minute,
    timezone: effectiveTimezone,
  });
};

export const syncDailyNotificationFromProfile = async (
  profile: NotificationPreferenceSnapshot | null | undefined
) => {
  if (!profile?.notificationEnabled || profile.pushPermission !== 'enabled') {
    await cancelDailyNotification();
    return;
  }

  const permissionState = await getNotificationPermissionState();
  if (permissionState !== 'enabled') {
    await cancelDailyNotification();
    return;
  }

  const parsedTime = parseTime(profile.notificationTime);
  if (!parsedTime) {
    await cancelDailyNotification();
    return;
  }

  const effectiveTimezone = profile.timezone || DEFAULT_TIMEZONE;
  const storedState = await readStoredState();

  if (storedState?.time === parsedTime.normalized && storedState.timezone === effectiveTimezone) {
    return;
  }

  await scheduleDailyNotification({
    hour: parsedTime.hour,
    minute: parsedTime.minute,
    timezone: effectiveTimezone,
    deepLink: DEFAULT_DEEP_LINK,
  });
};

export const openSystemNotificationSettings = async () => {
  try {
    await Linking.openSettings();
  } catch (error) {
    console.error('Unable to open system notification settings', error);
  }
};
