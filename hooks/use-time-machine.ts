import { useCallback, useEffect, useState } from 'react';

import {
  fetchTimeMachineYear,
  getLastVisitedTimeMachineYear,
  saveLastVisitedTimeMachineYear,
  type TimeMachineYearResponse,
} from '@/services/time-machine';

type UseTimeMachineOptions = {
  year?: number | null;
  enabled?: boolean;
};

type TimeMachineState = {
  loading: boolean;
  data: TimeMachineYearResponse | null;
  error: Error | null;
};

const createInitialState = (): TimeMachineState => ({
  loading: false,
  data: null,
  error: null,
});

export const useTimeMachine = ({ year, enabled = true }: UseTimeMachineOptions) => {
  const [state, setState] = useState<TimeMachineState>(() => createInitialState());
  const [lastVisitedYear, setLastVisitedYear] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadLastVisitedYear = async () => {
      try {
        const storedYear = await getLastVisitedTimeMachineYear();
        if (!cancelled) {
          setLastVisitedYear(storedYear);
        }
      } catch (error) {
        if (!cancelled) {
          setLastVisitedYear(null);
        }
      }
    };

    void loadLastVisitedYear();

    return () => {
      cancelled = true;
    };
  }, []);

  const loadYear = useCallback(
    async (targetYear: number, options: { forceRefresh?: boolean } = {}) => {
      if (!enabled) {
        return null;
      }

      setState((previous) => ({ ...previous, loading: true, error: null }));

      try {
        const result = await fetchTimeMachineYear(targetYear, options);
        await saveLastVisitedTimeMachineYear(targetYear);
        setLastVisitedYear(targetYear);
        setState({
          loading: false,
          data: result,
          error: null,
        });
        return result;
      } catch (error) {
        const resolvedError =
          error instanceof Error ? error : new Error('Failed to load Time Machine year');
        setState({
          loading: false,
          data: null,
          error: resolvedError,
        });
        return null;
      }
    },
    [enabled]
  );

  useEffect(() => {
    if (!enabled || !year) {
      return;
    }

    void loadYear(year);
  }, [enabled, loadYear, year]);

  return {
    ...state,
    lastVisitedYear,
    loadYear,
    refresh: year ? () => loadYear(year, { forceRefresh: true }) : undefined,
  };
};
