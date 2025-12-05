import { useCallback, useEffect, useMemo, useState } from 'react';

import { useUserContext } from '@/contexts/user-context';
import {
  USERS_COLLECTION,
  firebaseFirestore,
  doc,
  setDoc,
  arrayUnion,
  arrayRemove,
  deleteField,
} from '@/services/firebase';
import type { ReactionValue } from '@/types/user';

export type ReactionType = ReactionValue;

type UseEventEngagementReturn = {
  isSaved: boolean;
  isLiked: boolean;
  reaction: ReactionType | null;
  toggleSave: () => void;
  toggleLike: () => void;
  toggleReaction: (type: ReactionType) => void;
};

export const useEventEngagement = (eventId: string): UseEventEngagementReturn => {
  const { authUser, profile } = useUserContext();
  const [optimisticSave, setOptimisticSave] = useState<boolean | null>(null);
  const [optimisticLike, setOptimisticLike] = useState<boolean | null>(null);
  const [optimisticReaction, setOptimisticReaction] = useState<ReactionType | null | undefined>(
    undefined
  );

  const savedEventIds = profile?.savedEventIds ?? [];
  const likedEventIds = profile?.likedEventIds ?? [];
  const defaultSaved = useMemo(() => savedEventIds.includes(eventId), [savedEventIds, eventId]);
  const defaultLiked = useMemo(() => likedEventIds.includes(eventId), [likedEventIds, eventId]);
  const defaultReaction = profile?.reactions?.[eventId] ?? null;

  const isSaved = optimisticSave ?? defaultSaved;
  const isLiked = optimisticLike ?? defaultLiked;
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
    if (optimisticLike === null) {
      return;
    }
    if (defaultLiked === optimisticLike) {
      setOptimisticLike(null);
    }
  }, [defaultLiked, optimisticLike]);

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

    const docRef = doc(firebaseFirestore, USERS_COLLECTION, authUser.uid);

    const mutation = nextSaved
      ? setDoc(docRef, { savedEventIds: arrayUnion(eventId) }, { merge: true })
      : setDoc(docRef, { savedEventIds: arrayRemove(eventId) }, { merge: true });

    mutation.catch((error) => {
      console.error('Failed to toggle save state', error);
      setOptimisticSave(null);
    });
  }, [authUser, defaultSaved, eventId]);

  const toggleLike = useCallback(() => {
    if (!authUser) {
      console.warn('toggleLike called without an authenticated user');
      return;
    }

    const nextLiked = !defaultLiked;
    setOptimisticLike(nextLiked);

    const docRef = doc(firebaseFirestore, USERS_COLLECTION, authUser.uid);

    const mutation = nextLiked
      ? setDoc(docRef, { likedEventIds: arrayUnion(eventId) }, { merge: true })
      : setDoc(docRef, { likedEventIds: arrayRemove(eventId) }, { merge: true });

    mutation.catch((error) => {
      console.error('Failed to toggle like state', error);
      setOptimisticLike(null);
    });
  }, [authUser, defaultLiked, eventId]);

  const toggleReaction = useCallback(
    (type: ReactionType) => {
      if (!authUser) {
        console.warn('toggleReaction called without an authenticated user');
        return;
      }

      const current = defaultReaction;
      const next = current === type ? null : type;
      setOptimisticReaction(next);

      const docRef = doc(firebaseFirestore, USERS_COLLECTION, authUser.uid);
      const payload: Record<string, unknown> = {};
      const fieldPath = `reactions.${eventId}`;
      payload[fieldPath] = next ?? deleteField();

      setDoc(docRef, payload, { merge: true }).catch((error) => {
        console.error('Failed to toggle reaction', error);
        setOptimisticReaction(undefined);
      });
    },
    [authUser, defaultReaction, eventId]
  );

  return {
    isSaved,
    isLiked,
    reaction,
    toggleSave,
    toggleLike,
    toggleReaction,
  };
};
