import { useEffect, useState } from 'react';

import { getDevDigestEventById, isDevDigestEventId } from '@/constants/dev-digest';
import { getExploreSeedEventById, isExploreSeedEventId } from '@/constants/explore-seed';
import { fetchEventsByIds } from '@/services/content';
import { isWikimediaEventId, resolveWikimediaEventById } from '@/services/wikimedia-digest';
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

      try {
        const events = await fetchEventsByIds([eventId]);
        resolvedEvent = events[0] ?? null;
      } catch (error) {
        resolvedError = error instanceof Error ? error : new Error('Failed to load event content');
      }

      if (!resolvedEvent && isDevDigestEventId(eventId)) {
        resolvedEvent = getDevDigestEventById(eventId);
      }

      if (!resolvedEvent && isWikimediaEventId(eventId)) {
        try {
          resolvedEvent = await resolveWikimediaEventById(eventId);
        } catch (error) {
          if (!resolvedError) {
            resolvedError = error instanceof Error ? error : new Error('Failed to load event content');
          }
        }
      }

      if (!resolvedEvent && isExploreSeedEventId(eventId)) {
        resolvedEvent = getExploreSeedEventById(eventId);
      }

      if (cancelled) {
        return;
      }

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
