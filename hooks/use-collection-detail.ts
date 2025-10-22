import { useCallback, useEffect, useState } from 'react';

import { fetchCollectionDetail, type CollectionDetail } from '@/services/home';

type UseCollectionDetailArgs = {
  collectionId: string | null;
  enabled?: boolean;
};

type CollectionDetailState = {
  loading: boolean;
  collection: CollectionDetail | null;
  error: Error | null;
};

const createInitialState = (): CollectionDetailState => ({
  loading: true,
  collection: null,
  error: null,
});

export const useCollectionDetail = ({ collectionId, enabled = true }: UseCollectionDetailArgs) => {
  const [state, setState] = useState<CollectionDetailState>(() => createInitialState());
  const [reloadKey, setReloadKey] = useState(0);

  const refresh = useCallback(() => setReloadKey((value) => value + 1), []);

  useEffect(() => {
    if (!enabled || !collectionId) {
      setState({ loading: false, collection: null, error: null });
      return;
    }

    let cancelled = false;
    setState((previous) => ({ ...previous, loading: true, error: null }));

    const load = async () => {
      try {
        const result = await fetchCollectionDetail(collectionId);
        if (cancelled) {
          return;
        }
        setState({ loading: false, collection: result, error: null });
      } catch (error) {
        if (cancelled) {
          return;
        }
        const resolvedError = error instanceof Error ? error : new Error('Failed to load collection');
        setState({ loading: false, collection: null, error: resolvedError });
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [collectionId, enabled, reloadKey]);

  return { ...state, refresh };
};

