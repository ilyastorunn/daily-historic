import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules } from 'react-native';

import type { HomeHeroWidgetPayload } from '@/types/widgets';

export const HOME_HERO_WIDGET_STORAGE_KEY = '@daily_historic/widgets/home_hero/v1';
export const HOME_HERO_WIDGET_APP_GROUP = 'group.com.ilyastorun.histora';
export const HOME_HERO_WIDGET_APP_GROUP_KEY = 'home_hero_payload_v1';

type WidgetBridgeModule = {
  setHomeHeroPayload?: (payloadJson: string) => Promise<void> | void;
  reloadAllTimelines?: () => Promise<void> | void;
};

const getNativeWidgetBridge = (): WidgetBridgeModule | null => {
  const module = (NativeModules as Record<string, unknown>).HistoriqWidgetBridge;
  if (!module || typeof module !== 'object') {
    return null;
  }

  return module as WidgetBridgeModule;
};

export const setHomeHeroWidgetPayload = async (payload: HomeHeroWidgetPayload): Promise<'native' | 'storage'> => {
  const payloadJson = JSON.stringify(payload);
  const nativeBridge = getNativeWidgetBridge();

  if (nativeBridge?.setHomeHeroPayload) {
    await Promise.resolve(nativeBridge.setHomeHeroPayload(payloadJson));
    if (nativeBridge.reloadAllTimelines) {
      await Promise.resolve(nativeBridge.reloadAllTimelines());
    }
    return 'native';
  }

  await AsyncStorage.setItem(HOME_HERO_WIDGET_STORAGE_KEY, payloadJson);
  return 'storage';
};

export const getHomeHeroWidgetPayloadFromStorage = async (): Promise<HomeHeroWidgetPayload | null> => {
  const rawPayload = await AsyncStorage.getItem(HOME_HERO_WIDGET_STORAGE_KEY);
  if (!rawPayload) {
    return null;
  }

  try {
    return JSON.parse(rawPayload) as HomeHeroWidgetPayload;
  } catch {
    return null;
  }
};
