import { useCallback, useEffect, useState } from 'react';

import { fetchHomeChips, toggleHomeChipPin, type HomeChipResponse } from '@/services/chips';

type UseHomeChipsState = {
  chips: HomeChipResponse[];
  loading: boolean;
  error: Error | null;
};

const createInitialState = (): UseHomeChipsState => ({
  chips: [],
  loading: true,
  error: null,
});

export const useHomeChips = () => {
  const [state, setState] = useState<UseHomeChipsState>(() => createInitialState());
  const [reloadKey, setReloadKey] = useState(0);

  const refresh = useCallback(() => setReloadKey((value) => value + 1), []);

  useEffect(() => {
    let cancelled = false;
    setState((previous) => ({ ...previous, loading: true, error: null }));

    const load = async () => {
      try {
        const result = await fetchHomeChips();
        if (cancelled) {
          return;
        }
        setState({ chips: result.chips, loading: false, error: null });
      } catch (error) {
        if (cancelled) {
          return;
        }
        const resolvedError = error instanceof Error ? error : new Error('Failed to load chips');
        setState({ chips: [], loading: false, error: resolvedError });
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const setPinned = useCallback(async (chipId: string, pinned: boolean) => {
    setState((previous) => ({
      ...previous,
      chips: previous.chips.map((chip) =>
        chip.id === chipId
          ? {
              ...chip,
              pinned,
            }
          : chip
      ),
    }));
    try {
      await toggleHomeChipPin(chipId, pinned);
    } catch (error) {
      console.warn('Failed to update chip pin state', error);
    }
  }, []);

  return {
    ...state,
    refresh,
    setPinned,
  };
};

