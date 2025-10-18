import { useEffect, useState } from 'react';

import { fetchEventsByIds } from '@/services/content';
import type { FirestoreEventDocument } from '@/types/events';

type EventContentState = {
  loading: boolean;
  event: FirestoreEventDocument | null;
  error: Error | null;
};

const createInitialState = (): EventContentState => ({
  loading: true,
  event: null,
  error: null,
});

export const useEventContent = (eventId: string | null | undefined) => {
  const [state, setState] = useState<EventContentState>(() => createInitialState());

  useEffect(() => {
    if (!eventId) {
      setState({
        loading: false,
        event: null,
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
        const events = await fetchEventsByIds([eventId]);
        if (cancelled) {
          return;
        }

        setState({
          loading: false,
          event: events[0] ?? null,
          error: null,
        });
      } catch (error) {
        if (cancelled) {
          return;
        }
        const resolvedError = error instanceof Error ? error : new Error('Failed to load event content');
        setState({
          loading: false,
          event: null,
          error: resolvedError,
        });
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [eventId]);

  return state;
};
