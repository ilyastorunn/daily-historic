import { useEffect, useMemo, useState } from 'react';

import { useUserContext } from '@/contexts/user-context';
import { resolveEventsByIds } from '@/services/content';
import type { FirestoreEventDocument } from '@/types/events';

type UseSavedEventsArgs = {
  limit?: number;
};

type SavedEventsState = {
  loading: boolean;
  savedEvents: FirestoreEventDocument[];
  totalCount: number;
};

export const useSavedEvents = ({ limit }: UseSavedEventsArgs = {}) => {
  const { profile } = useUserContext();
  const savedEventIdsKey = useMemo(
    () => JSON.stringify(profile?.savedEventIds ?? []),
    [profile?.savedEventIds]
  );
  const stableSavedEventIds = useMemo(
    () => JSON.parse(savedEventIdsKey) as string[],
    [savedEventIdsKey]
  );
  const totalCount = stableSavedEventIds.length;
  const [state, setState] = useState<SavedEventsState>({
    loading: false,
    savedEvents: [],
    totalCount,
  });

  useEffect(() => {
    const visibleIds =
      typeof limit === 'number' ? stableSavedEventIds.slice(0, Math.max(limit, 0)) : stableSavedEventIds;

    if (visibleIds.length === 0) {
      setState({
        loading: false,
        savedEvents: [],
        totalCount,
      });
      return;
    }

    let cancelled = false;
    setState((previous) => ({
      ...previous,
      loading: true,
      totalCount,
    }));

    const loadSavedEvents = async () => {
      try {
        const fetched = await resolveEventsByIds(visibleIds);
        if (cancelled) {
          return;
        }

        setState({
          loading: false,
          savedEvents: fetched,
          totalCount,
        });
      } catch (error) {
        console.error('Failed to load saved events', error);

        if (cancelled) {
          return;
        }

        setState({
          loading: false,
          savedEvents: [],
          totalCount,
        });
      }
    };

    void loadSavedEvents();

    return () => {
      cancelled = true;
    };
  }, [limit, stableSavedEventIds, totalCount]);

  return state;
};
