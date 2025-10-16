import { useCallback, useEffect, useMemo, useState } from 'react';

import { useUserContext } from '@/contexts/user-context';
import {
  USERS_COLLECTION,
  firebaseFieldValue,
  firebaseFirestore,
} from '@/services/firebase';
import type { ReactionValue } from '@/types/user';

export type ReactionType = ReactionValue;

type UseEventEngagementReturn = {
  isSaved: boolean;
  reaction: ReactionType | null;
  toggleSave: () => void;
  toggleReaction: (type: ReactionType) => void;
};

export const useEventEngagement = (eventId: string): UseEventEngagementReturn => {
  const { authUser, profile } = useUserContext();
  const [optimisticSave, setOptimisticSave] = useState<boolean | null>(null);
  const [optimisticReaction, setOptimisticReaction] = useState<ReactionType | null | undefined>(
    undefined
  );

  const savedEventIds = profile?.savedEventIds ?? [];
  const defaultSaved = useMemo(() => savedEventIds.includes(eventId), [savedEventIds, eventId]);
  const defaultReaction = profile?.reactions?.[eventId] ?? null;

  const isSaved = optimisticSave ?? defaultSaved;
  const reaction = optimisticReaction === undefined ? defaultReaction : optimisticReaction;

  useEffect(() => {
    if (optimisticSave === null) {
      return;
    }
    if (defaultSaved === optimisticSave) {
      setOptimisticSave(null);
    }
  }, [defaultSaved, optimisticSave]);

  useEffect(() => {
    if (optimisticReaction === undefined) {
      return;
    }
    if ((optimisticReaction ?? null) === (defaultReaction ?? null)) {
      setOptimisticReaction(undefined);
    }
  }, [defaultReaction, optimisticReaction]);

  const toggleSave = useCallback(() => {
    if (!authUser) {
      console.warn('toggleSave called without an authenticated user');
      return;
    }

    const nextSaved = !defaultSaved;
    setOptimisticSave(nextSaved);

    const docRef = firebaseFirestore.collection(USERS_COLLECTION).doc(authUser.uid);

    const mutation = nextSaved
      ? docRef.set({ savedEventIds: firebaseFieldValue.arrayUnion(eventId) }, { merge: true })
      : docRef.set({ savedEventIds: firebaseFieldValue.arrayRemove(eventId) }, { merge: true });

    mutation.catch((error) => {
      console.error('Failed to toggle save state', error);
      setOptimisticSave(null);
    });
  }, [authUser, defaultSaved, eventId]);

  const toggleReaction = useCallback(
    (type: ReactionType) => {
      if (!authUser) {
        console.warn('toggleReaction called without an authenticated user');
        return;
      }

      const current = defaultReaction;
      const next = current === type ? null : type;
      setOptimisticReaction(next);

      const docRef = firebaseFirestore.collection(USERS_COLLECTION).doc(authUser.uid);
      const payload: Record<string, unknown> = {};
      const fieldPath = `reactions.${eventId}`;
      payload[fieldPath] = next ?? firebaseFieldValue.delete();

      docRef.set(payload, { merge: true }).catch((error) => {
        console.error('Failed to toggle reaction', error);
        setOptimisticReaction(undefined);
      });
    },
    [authUser, defaultReaction, eventId]
  );

  return {
    isSaved,
    reaction,
    toggleSave,
    toggleReaction,
  };
};
