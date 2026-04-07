import { useEffect, useState } from 'react';

import { resolveEventById } from '@/services/content';
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
      let resolvedEvent: FirestoreEventDocument | null = null;
      let resolvedError: Error | null = null;

      console.log('[useEventContent] Loading event:', eventId);

      try {
        resolvedEvent = await resolveEventById(eventId);
        console.log('[useEventContent] Resolved event:', resolvedEvent ? 'found' : 'not found');
      } catch (error) {
        console.error('[useEventContent] Event resolve error:', error);
        resolvedError = error instanceof Error ? error : new Error('Failed to load event content');
      }

      if (cancelled) {
        console.log('[useEventContent] Load cancelled for:', eventId);
        return;
      }

      console.log('[useEventContent] Final state:', {
        eventId,
        found: !!resolvedEvent,
        error: !!resolvedError
      });

      setState({
        loading: false,
        event: resolvedEvent,
        error: resolvedEvent ? null : resolvedError,
      });
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [eventId]);

  return state;
};
