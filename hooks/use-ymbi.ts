import { useCallback, useEffect, useMemo, useState } from 'react';

import { fetchYMBI, type YMBIResponse } from '@/services/you-might-be-interested';
import type { CategoryOption } from '@/contexts/onboarding-context';

type UseYMBIArgs = {
  userId: string;
  userCategories?: CategoryOption[];
  savedEventIds?: string[];
  homeEventIds?: string[];
  limit?: number;
  enabled?: boolean;
  timezone?: string;
};

type YMBIState = {
  loading: boolean;
  items: YMBIResponse['items'];
  rationale?: string;
  error: Error | null;
};

const createInitialState = (): YMBIState => ({
  loading: true,
  items: [],
  rationale: undefined,
  error: null,
});

export const useYMBI = ({
  userId,
  userCategories = [],
  savedEventIds = [],
  homeEventIds = [],
  limit = 8,
  enabled = true,
}: UseYMBIArgs) => {
  const [state, setState] = useState<YMBIState>(() => createInitialState());
  const [reloadKey, setReloadKey] = useState(0);
  const userCategoriesKey = useMemo(
    () => [...userCategories].sort().join('|'),
    [userCategories]
  );
  const savedEventIdsKey = useMemo(() => [...savedEventIds].sort().join('|'), [savedEventIds]);
  const homeEventIdsKey = useMemo(() => [...homeEventIds].sort().join('|'), [homeEventIds]);
  const stableUserCategories = useMemo(() => [...userCategories], [userCategoriesKey]);
  const stableSavedEventIds = useMemo(() => [...savedEventIds], [savedEventIdsKey]);
  const stableHomeEventIds = useMemo(() => [...homeEventIds], [homeEventIdsKey]);

  const refresh = useCallback(() => {
    setReloadKey((value) => value + 1);
  }, []);

  useEffect(() => {
    if (!enabled || !userId) {
      setState({
        loading: false,
        items: [],
        rationale: undefined,
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
        const result = await fetchYMBI(
          userId,
          stableUserCategories,
          stableSavedEventIds,
          stableHomeEventIds,
          limit
        );
        if (cancelled) {
          return;
        }
        setState({
          loading: false,
          items: result.items,
          rationale: result.rationale,
          error: null,
        });
      } catch (error) {
        if (cancelled) {
          return;
        }
        const resolvedError =
          error instanceof Error
            ? error
            : new Error('Failed to load You Might Be Interested recommendations');
        setState({
          loading: false,
          items: [],
          rationale: undefined,
          error: resolvedError,
        });
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [
    enabled,
    homeEventIdsKey,
    limit,
    reloadKey,
    savedEventIdsKey,
    stableHomeEventIds,
    stableSavedEventIds,
    stableUserCategories,
    userCategoriesKey,
    userId,
  ]);

  return {
    ...state,
    refresh,
  };
};
