import AsyncStorage from '@react-native-async-storage/async-storage';
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
type NotificationsModuleShape = {
  AndroidImportance: { DEFAULT: number };
  IosAuthorizationStatus: { PROVISIONAL: number };
  SchedulableTriggerInputTypes: { CALENDAR: string };
  setNotificationChannelAsync: (
    channelId: string,
    channel: {
      name: string;
      importance: number;
      vibrationPattern?: number[];
      lightColor?: string;
    }
  ) => Promise<void>;
  setNotificationHandler: (handler: {
    handleNotification: () => Promise<{
      shouldShowBanner: boolean;
      shouldShowList: boolean;
      shouldPlaySound: boolean;
      shouldSetBadge: boolean;
    }>;
  }) => void;
  getPermissionsAsync: () => Promise<{
    granted: boolean;
    status: string;
    ios?: { status?: number };
  }>;
  requestPermissionsAsync: (input: {
    ios: { allowAlert: boolean; allowBadge: boolean; allowSound: boolean };
  }) => Promise<{ granted: boolean; ios?: { status?: number } }>;
  cancelScheduledNotificationAsync: (identifier: string) => Promise<void>;
  scheduleNotificationAsync: (input: {
    content: {
      title: string;
      body: string;
      sound: boolean;
      data: { deepLink: string; source: string };
    };
    trigger: {
      type: string;
      hour: number;
      minute: number;
      repeats: boolean;
      channelId?: string;
      timezone?: string;
    };
  }) => Promise<string>;
  addNotificationResponseReceivedListener: (
    listener: (response: {
      notification: { request: { content: { data?: { deepLink?: unknown } } } };
    }) => void
  ) => { remove: () => void };
};

let notificationsModulePromise: Promise<NotificationsModuleShape | null> | null = null;
let notificationsUnavailableLogged = false;

const logNotificationsUnavailable = (error: unknown) => {
  if (notificationsUnavailableLogged) {
    return;
  }

  notificationsUnavailableLogged = true;
  console.warn(
    '[Notifications] expo-notifications native module is unavailable. Notification features will be disabled.',
    error
  );
};

const loadNotificationsModule = async () => {
  if (!notificationsModulePromise) {
    notificationsModulePromise = Promise.resolve().then(() => {
      try {
        const requiredModule = require('expo-notifications');
        const normalizedModule = (requiredModule?.default ?? requiredModule) as
          | NotificationsModuleShape
          | undefined;

        if (!normalizedModule) {
          throw new Error('expo-notifications module is empty');
        }

        if (
          typeof normalizedModule.setNotificationHandler !== 'function' ||
          typeof normalizedModule.addNotificationResponseReceivedListener !== 'function' ||
          typeof normalizedModule.getPermissionsAsync !== 'function' ||
          typeof normalizedModule.requestPermissionsAsync !== 'function'
        ) {
          throw new Error('expo-notifications API surface is incomplete on this build');
        }

        return normalizedModule;
      } catch (error) {
        logNotificationsUnavailable(error);
        return null;
      }
    });
  }

  return notificationsModulePromise;
};

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
  const Notifications = await loadNotificationsModule();
  if (!Notifications || Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync('daily-reminder', {
    name: 'Daily Reminder',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 200, 100, 200],
    lightColor: '#3B82F6',
  });
};

export const configureNotificationHandler = async () => {
  if (notificationHandlerConfigured) {
    return;
  }

  const Notifications = await loadNotificationsModule();
  if (!Notifications) {
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
  const Notifications = await loadNotificationsModule();
  if (!Notifications) {
    return 'unknown';
  }

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
  const Notifications = await loadNotificationsModule();
  if (!Notifications) {
    trackEvent('notification_permission_result', { result: 'unavailable' });
    return 'declined';
  }

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
  const Notifications = await loadNotificationsModule();
  const storedState = await readStoredState();

  if (!storedState?.identifier) {
    return;
  }

  try {
    if (Notifications) {
      await Notifications.cancelScheduledNotificationAsync(storedState.identifier);
    }
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
  const Notifications = await loadNotificationsModule();
  if (!Notifications) {
    await clearStoredState();
    return;
  }

  await ensureAndroidChannel();
  await cancelDailyNotification();

  const trigger = {
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

export const addNotificationResponseReceivedListener = async (
  listener: (deepLink: string | null) => void
) => {
  const Notifications = await loadNotificationsModule();
  if (!Notifications) {
    return null;
  }

  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const rawDeepLink = response.notification.request.content.data?.deepLink;
    listener(typeof rawDeepLink === 'string' ? rawDeepLink : null);
  });

  return () => {
    subscription.remove();
  };
};

export const openSystemNotificationSettings = async () => {
  try {
    await Linking.openSettings();
  } catch (error) {
    console.error('Unable to open system notification settings', error);
  }
};
