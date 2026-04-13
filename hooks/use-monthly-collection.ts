import { useCallback, useEffect, useState } from 'react';

import { fetchMonthlyCollection, type MonthlyCollectionSummary } from '@/services/home';

type UseMonthlyCollectionArgs = {
  monthKey?: string | null;
  weekKey?: string | null;
  limit?: number;
  enabled?: boolean;
};

type MonthlyCollectionState = {
  loading: boolean;
  item: MonthlyCollectionSummary | null;
  generatedAt?: string;
  error: Error | null;
};

const createInitialState = (): MonthlyCollectionState => ({
  loading: true,
  item: null,
  generatedAt: undefined,
  error: null,
});

export const useMonthlyCollection = ({
  monthKey,
  weekKey,
  limit,
  enabled = true,
}: UseMonthlyCollectionArgs) => {
  const [state, setState] = useState<MonthlyCollectionState>(() => createInitialState());
  const [reloadKey, setReloadKey] = useState(0);

  const refresh = useCallback(() => {
    setReloadKey((value) => value + 1);
  }, []);

  useEffect(() => {
    if (!enabled || !monthKey) {
      setState({
        loading: false,
        item: null,
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
        const result = await fetchMonthlyCollection({ monthKey, weekKey, limit });
        if (cancelled) {
          return;
        }
        setState({
          loading: false,
          item: result.item,
          generatedAt: result.generatedAt,
          error: null,
        });
      } catch (error) {
        if (cancelled) {
          return;
        }
        const resolvedError = error instanceof Error ? error : new Error('Failed to load monthly collection');
        setState({
          loading: false,
          item: null,
          generatedAt: undefined,
          error: resolvedError,
        });
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [enabled, limit, monthKey, weekKey, reloadKey]);

  return {
    ...state,
    refresh,
  };
};
