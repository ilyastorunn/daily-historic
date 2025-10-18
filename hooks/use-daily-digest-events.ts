import { useCallback, useEffect, useState } from 'react';

import { fetchDailyDigest } from '@/services/content';
import type { DailyDigestDocument, FirestoreEventDocument } from '@/types/events';

type UseDailyDigestEventsArgs = {
  month: number;
  day: number;
  enabled?: boolean;
};

type UseDailyDigestEventsState = {
  loading: boolean;
  events: FirestoreEventDocument[];
  digest: DailyDigestDocument | null;
  error: Error | null;
};

const createInitialState = (): UseDailyDigestEventsState => ({
  loading: true,
  events: [],
  digest: null,
  error: null,
});

export const useDailyDigestEvents = ({ month, day, enabled = true }: UseDailyDigestEventsArgs) => {
  const [state, setState] = useState<UseDailyDigestEventsState>(() => createInitialState());
  const [reloadKey, setReloadKey] = useState(0);

  const refresh = useCallback(() => {
    setReloadKey((value) => value + 1);
  }, []);

  useEffect(() => {
    if (!enabled || !Number.isFinite(month) || !Number.isFinite(day) || month <= 0 || day <= 0) {
      setState((previous) => ({
        ...previous,
        loading: false,
        events: [],
        digest: null,
      }));
      return;
    }

    let cancelled = false;
    setState((previous) => ({
      ...previous,
      loading: true,
      error: null,
    }));

    const load = async () => {
      try {
        const result = await fetchDailyDigest(month, day);
        if (cancelled) {
          return;
        }

        setState({
          loading: false,
          events: result.events,
          digest: result.digest,
          error: null,
        });
      } catch (error) {
        if (cancelled) {
          return;
        }
        const resolvedError = error instanceof Error ? error : new Error('Failed to load daily digest');
        setState({
          loading: false,
          events: [],
          digest: null,
          error: resolvedError,
        });
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [month, day, enabled, reloadKey]);

  return {
    ...state,
    refresh,
  };
};
