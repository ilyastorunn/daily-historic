export type AnalyticsEventParams = Record<
  string,
  string | number | boolean | null | undefined
>;

const isDevelopment = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';

export const trackEvent = (name: string, params?: AnalyticsEventParams) => {
  if (!name) {
    return;
  }

  if (isDevelopment) {
    console.log('[analytics]', name, params ?? {});
  }

  // TODO: wire up real analytics provider (Mixpanel/Amplitude/Firebase) here.
};

