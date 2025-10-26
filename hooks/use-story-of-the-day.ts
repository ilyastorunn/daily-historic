import { useCallback, useEffect, useState } from 'react';

import { fetchStoryOfTheDay, type SOTDResponse } from '@/services/story-of-the-day';

type UseStoryOfTheDayArgs = {
  enabled?: boolean;
};

type StoryOfTheDayState = {
  loading: boolean;
  story: SOTDResponse | null;
  error: Error | null;
};

const createInitialState = (): StoryOfTheDayState => ({
  loading: true,
  story: null,
  error: null,
});

export const useStoryOfTheDay = ({ enabled = true }: UseStoryOfTheDayArgs = {}) => {
  const [state, setState] = useState<StoryOfTheDayState>(() => createInitialState());
  const [reloadKey, setReloadKey] = useState(0);

  const refresh = useCallback(() => {
    setReloadKey((value) => value + 1);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setState({
        loading: false,
        story: null,
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
        const result = await fetchStoryOfTheDay();
        if (cancelled) {
          return;
        }
        setState({
          loading: false,
          story: result,
          error: null,
        });
      } catch (error) {
        if (cancelled) {
          return;
        }
        const resolvedError =
          error instanceof Error ? error : new Error('Failed to load Story of the Day');
        setState({
          loading: false,
          story: null,
          error: resolvedError,
        });
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [enabled, reloadKey]);

  return {
    ...state,
    refresh,
  };
};
