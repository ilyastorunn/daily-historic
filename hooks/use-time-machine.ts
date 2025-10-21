import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  fetchTimeMachineSeed,
  fetchTimeMachineTimeline,
  type TimeMachineSeedResponse,
  type TimeMachineTimelineResponse,
} from '@/services/time-machine';

type UseTimeMachineOptions = {
  enabled?: boolean;
  seedOnMount?: boolean;
  premium?: boolean;
};

type TimeMachineState = {
  loading: boolean;
  seedLoading: boolean;
  timeline: TimeMachineTimelineResponse | null;
  lastSeed: TimeMachineSeedResponse | null;
  error: Error | null;
};

const createInitialState = (): TimeMachineState => ({
  loading: false,
  seedLoading: false,
  timeline: null,
  lastSeed: null,
  error: null,
});

export const useTimeMachine = ({ enabled = true, seedOnMount = true, premium = false }: UseTimeMachineOptions) => {
  const [state, setState] = useState<TimeMachineState>(() => createInitialState());
  const [seedKey, setSeedKey] = useState(0);

  const seed = useCallback(async () => {
    if (!enabled) {
      return;
    }
    setState((previous) => ({ ...previous, seedLoading: true, error: null }));
    try {
      const result = await fetchTimeMachineSeed();
      setState((previous) => ({ ...previous, seedLoading: false, lastSeed: result }));
    } catch (error) {
      const resolvedError = error instanceof Error ? error : new Error('Failed to seed Time Machine');
      setState((previous) => ({ ...previous, seedLoading: false, error: resolvedError }));
    }
  }, [enabled]);

  const loadTimeline = useCallback(
    async (year?: number, categories?: string) => {
      if (!enabled) {
        return;
      }
      const targetYear = year ?? state.lastSeed?.year;
      if (!targetYear) {
        return;
      }
      setState((previous) => ({ ...previous, loading: true, error: null }));
      try {
        const result = await fetchTimeMachineTimeline(targetYear, { categories });
        setState((previous) => ({ ...previous, loading: false, timeline: result }));
      } catch (error) {
        const resolvedError = error instanceof Error ? error : new Error('Failed to load timeline');
        setState((previous) => ({ ...previous, loading: false, error: resolvedError }));
      }
    },
    [enabled, state.lastSeed?.year]
  );

  useEffect(() => {
    if (!enabled || !seedOnMount) {
      return;
    }
    void seed();
  }, [enabled, seedOnMount, seed, seedKey]);

  const reset = useCallback(() => {
    setState(createInitialState());
    setSeedKey((value) => value + 1);
  }, []);

  const timelineYear = state.timeline?.year ?? state.lastSeed?.year ?? null;
  const heroImageUrl = useMemo(() => state.timeline?.events?.[0]?.imageUrl ?? null, [state.timeline]);

  return {
    ...state,
    timelineYear,
    heroImageUrl,
    seed,
    loadTimeline,
    reset,
    premium,
  };
};
