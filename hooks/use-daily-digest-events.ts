import { useCallback, useEffect, useState } from 'react';

import { buildDevDailyDigest } from '@/constants/dev-digest';
import { fetchDailyDigest } from '@/services/content';
import { fetchWikimediaDailyDigest } from '@/services/wikimedia-digest';
import type { DailyDigestDocument, FirestoreEventDocument } from '@/types/events';

type UseDailyDigestEventsArgs = {
  month: number;
  day: number;
  year?: number;
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

export const useDailyDigestEvents = ({ month, day, year, enabled = true }: UseDailyDigestEventsArgs) => {
  const [state, setState] = useState<UseDailyDigestEventsState>(() => createInitialState());
  const [reloadKey, setReloadKey] = useState(0);

  const refresh = useCallback(() => {
    setReloadKey((value) => value + 1);
  }, []);

  useEffect(() => {
    const normalizedYear = typeof year === 'number' && Number.isFinite(year) ? year : undefined;

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
        const result = await fetchDailyDigest(month, day, normalizedYear);
        if (cancelled) {
          return;
        }

        let resolvedEvents = result.events;
        let resolvedDigest = result.digest;

        if (!resolvedDigest || resolvedEvents.length === 0) {
          try {
            const wikimediaResult = await fetchWikimediaDailyDigest({ month, day });
            if (cancelled) {
              return;
            }
            if (wikimediaResult.digest && wikimediaResult.events.length > 0) {
              resolvedEvents = wikimediaResult.events;
              resolvedDigest = wikimediaResult.digest;
            }
          } catch (wikimediaError) {
            console.warn('Falling back to local digest after Wikimedia fetch error', wikimediaError);
          }
        }

        if (!resolvedDigest || resolvedEvents.length === 0) {
          const fallback = buildDevDailyDigest(month, day);
          if (fallback) {
            resolvedEvents = fallback.events;
            resolvedDigest = fallback.digest;
          }
        }

        setState({
          loading: false,
          events: resolvedEvents,
          digest: resolvedDigest,
          error: null,
        });
      } catch (error) {
        if (cancelled) {
          return;
        }
        try {
          const wikimediaResult = await fetchWikimediaDailyDigest({ month, day });
          if (!cancelled && wikimediaResult.digest && wikimediaResult.events.length > 0) {
            setState({
              loading: false,
              events: wikimediaResult.events,
              digest: wikimediaResult.digest,
              error: null,
            });
            return;
          }
        } catch (wikimediaError) {
          console.warn('Wikimedia digest fetch failed after Firestore error', wikimediaError);
        }
        const fallback = buildDevDailyDigest(month, day);
        if (fallback) {
          setState({
            loading: false,
            events: fallback.events,
            digest: fallback.digest,
            error: null,
          });
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
  }, [month, day, year, enabled, reloadKey]);

  return {
    ...state,
    refresh,
  };
};
