import { useCallback, useEffect, useState } from 'react';

import { fetchWeeklyCollections, type HomeCollectionSummary } from '@/services/home';

type UseWeeklyCollectionsArgs = {
  weekKey?: string | null;
  limit?: number;
  enabled?: boolean;
};

type WeeklyCollectionsState = {
  loading: boolean;
  items: HomeCollectionSummary[];
  generatedAt?: string;
  error: Error | null;
};

const createInitialState = (): WeeklyCollectionsState => ({
  loading: true,
  items: [],
  generatedAt: undefined,
  error: null,
});

export const useWeeklyCollections = ({ weekKey, limit, enabled = true }: UseWeeklyCollectionsArgs) => {
  const [state, setState] = useState<WeeklyCollectionsState>(() => createInitialState());
  const [reloadKey, setReloadKey] = useState(0);

  const refresh = useCallback(() => {
    setReloadKey((value) => value + 1);
  }, []);

  useEffect(() => {
    if (!enabled || !weekKey) {
      setState({
        loading: false,
        items: [],
        generatedAt: undefined,
        error: null,
      });
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
        const result = await fetchWeeklyCollections({ weekKey, limit });
        if (cancelled) {
          return;
        }
        setState({
          loading: false,
          items: result.items,
          generatedAt: result.generatedAt,
          error: null,
        });
      } catch (error) {
        if (cancelled) {
          return;
        }
        const resolvedError = error instanceof Error ? error : new Error('Failed to load weekly collections');
        setState({
          loading: false,
          items: [],
          generatedAt: undefined,
          error: resolvedError,
        });
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [enabled, weekKey, limit, reloadKey]);

  return {
    ...state,
    refresh,
  };
};

