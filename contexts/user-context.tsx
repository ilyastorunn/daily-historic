import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import type { FirebaseAuthTypes } from '@react-native-firebase/auth';

import {
  USERS_COLLECTION,
  firebaseAuth,
  firebaseFirestore,
  doc,
  setDoc,
  onSnapshot,
  serverTimestamp,
} from '@/services/firebase';
import type { OnboardingData, UserDocument, UserProfile } from '@/types/user';

type OnboardingCompletionData = OnboardingData;

type UserContextValue = {
  authUser: FirebaseAuthTypes.User | null;
  profile: UserProfile | null;
  initializing: boolean;
  onboardingCompleted: boolean;
  error: Error | null;
  completeOnboarding: (data: OnboardingCompletionData) => Promise<void>;
  updateProfile: (data: Partial<UserDocument>) => Promise<void>;
  signOut: () => Promise<void>;
};

const UserContext = createContext<UserContextValue | null>(null);

type UserProviderProps = {
  children: ReactNode;
};

const USER_SAVED_EVENTS_SUBCOLLECTION = 'savedEvents';
const SAVED_EVENT_MIGRATION_BATCH_SIZE = 400;
const defaultError = null;

const chunkArray = <T,>(items: T[], chunkSize: number) => {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }

  return chunks;
};

const sanitizeSavedEventIds = (value: unknown) =>
  Array.isArray(value)
    ? value.filter((eventId): eventId is string => typeof eventId === 'string' && eventId.length > 0)
    : [];

const mergeSavedEventIds = (subcollectionIds: string[] | null, legacyIds: string[]) => {
  if (subcollectionIds === null) {
    return legacyIds;
  }

  const merged: string[] = [];
  const seen = new Set<string>();

  [...subcollectionIds, ...legacyIds].forEach((eventId) => {
    if (eventId.length === 0 || seen.has(eventId)) {
      return;
    }

    seen.add(eventId);
    merged.push(eventId);
  });

  return merged;
};

const normalizeProfileSnapshot = (data: UserProfile): UserProfile => {
  const savedEventIds = sanitizeSavedEventIds(data.savedEventIds);
  const likedEventIds = sanitizeSavedEventIds(data.likedEventIds);
  const reactions = data.reactions && typeof data.reactions === 'object' ? data.reactions : {};
  const categories = Array.isArray(data.categories) ? data.categories : [];
  const eras = Array.isArray(data.eras) ? data.eras : [];
  const categoriesSkipped =
    typeof data.categoriesSkipped === 'boolean' ? data.categoriesSkipped : false;

  return {
    ...data,
    categories,
    eras,
    savedEventIds,
    likedEventIds,
    reactions,
    categoriesSkipped,
  };
};

export const UserProvider = ({ children }: UserProviderProps) => {
  const [authUser, setAuthUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [profileDocument, setProfileDocument] = useState<UserProfile | null>(null);
  const [savedEventIdsState, setSavedEventIdsState] = useState<string[] | null>(null);
  const [authInitializing, setAuthInitializing] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [savedEventsLoading, setSavedEventsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(defaultError);
  const signingInRef = useRef(false);
  const savedMigrationInFlightRef = useRef(false);

  useEffect(() => {
    const unsubscribe = firebaseAuth.onAuthStateChanged(async (currentUser) => {
      if (!currentUser) {
        setAuthUser(null);
        if (signingInRef.current) {
          return;
        }

        signingInRef.current = true;
        try {
          await firebaseAuth.signInAnonymously();
        } catch (authError) {
          console.error('Anonymous sign-in failed', authError);
          setError(authError instanceof Error ? authError : new Error('Anonymous sign-in failed'));
          setAuthInitializing(false);
        } finally {
          signingInRef.current = false;
        }
        return;
      }

      setAuthUser(currentUser);
      setError(null);
      setAuthInitializing(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!authUser) {
      setProfileDocument(null);
      setSavedEventIdsState(null);
      setProfileLoading(false);
      setSavedEventsLoading(false);
      savedMigrationInFlightRef.current = false;
      return;
    }

    setProfileLoading(true);
    const docRef = doc(firebaseFirestore, USERS_COLLECTION, authUser.uid);

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (!snapshot.exists) {
          setProfileDocument(null);
        } else {
          const data = snapshot.data();
          setProfileDocument(data ? normalizeProfileSnapshot(data as UserProfile) : null);
        }

        setError(null);
        setProfileLoading(false);
      },
      (profileError) => {
        console.error('Failed to fetch user profile', profileError);
        setError(
          profileError instanceof Error
            ? profileError
            : new Error('Failed to fetch user profile')
        );
        setProfileLoading(false);
      }
    );

    return unsubscribe;
  }, [authUser]);

  useEffect(() => {
    if (!authUser) {
      setSavedEventIdsState(null);
      setSavedEventsLoading(false);
      return;
    }

    setSavedEventsLoading(true);
    const unsubscribe = firebaseFirestore
      .collection(USERS_COLLECTION)
      .doc(authUser.uid)
      .collection(USER_SAVED_EVENTS_SUBCOLLECTION)
      .orderBy('savedAt', 'desc')
      .onSnapshot(
        (snapshot) => {
          const nextSavedEventIds = snapshot.docs
            .map((savedDoc) => savedDoc.id)
            .filter((eventId) => eventId.length > 0);

          setSavedEventIdsState(nextSavedEventIds);
          setError(null);
          setSavedEventsLoading(false);
        },
        (savedEventsError) => {
          console.error('Failed to fetch saved events', savedEventsError);
          setError(
            savedEventsError instanceof Error
              ? savedEventsError
              : new Error('Failed to fetch saved events')
          );
          setSavedEventsLoading(false);
        }
      );

    return unsubscribe;
  }, [authUser]);

  useEffect(() => {
    if (!authUser || !profileDocument || savedEventIdsState === null || savedMigrationInFlightRef.current) {
      return;
    }

    const legacySavedEventIds = sanitizeSavedEventIds(profileDocument.savedEventIds);
    const missingSavedEventIds = legacySavedEventIds.filter(
      (eventId) => !savedEventIdsState.includes(eventId)
    );

    if (missingSavedEventIds.length === 0) {
      return;
    }

    savedMigrationInFlightRef.current = true;
    let cancelled = false;

    const migrateLegacySavedEvents = async () => {
      try {
        const userRef = firebaseFirestore.collection(USERS_COLLECTION).doc(authUser.uid);

        for (const chunk of chunkArray(missingSavedEventIds, SAVED_EVENT_MIGRATION_BATCH_SIZE)) {
          const batch = firebaseFirestore.batch();

          chunk.forEach((eventId) => {
            batch.set(
              userRef.collection(USER_SAVED_EVENTS_SUBCOLLECTION).doc(eventId),
              {
                eventId,
                savedAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              },
              { merge: true }
            );
          });

          await batch.commit();
        }

        if (cancelled) {
          return;
        }

        await setDoc(
          doc(firebaseFirestore, USERS_COLLECTION, authUser.uid),
          { savedEventIds: [] },
          { merge: true }
        );
      } catch (migrationError) {
        console.error('Failed to migrate legacy saved events', migrationError);
      } finally {
        savedMigrationInFlightRef.current = false;
      }
    };

    void migrateLegacySavedEvents();

    return () => {
      cancelled = true;
    };
  }, [authUser, profileDocument, savedEventIdsState]);

  const profile = useMemo<UserProfile | null>(() => {
    if (!profileDocument) {
      return null;
    }

    return {
      ...profileDocument,
      savedEventIds: mergeSavedEventIds(savedEventIdsState, profileDocument.savedEventIds ?? []),
    };
  }, [profileDocument, savedEventIdsState]);

  const completeOnboarding = useCallback(
    async (data: OnboardingCompletionData) => {
      if (!authUser) {
        throw new Error('Cannot complete onboarding without an authenticated user.');
      }

      const docRef = doc(firebaseFirestore, USERS_COLLECTION, authUser.uid);
      const timestamp = serverTimestamp();
      const sanitizedData = Object.fromEntries(
        Object.entries(data).filter(([, value]) => value !== undefined)
      ) as Partial<OnboardingData>;

      const payload: UserDocument = {
        uid: authUser.uid,
        ...sanitizedData,
        onboardingCompleted: true,
        updatedAt: timestamp,
        ...(profile?.createdAt ? {} : { createdAt: timestamp }),
        likedEventIds: profile?.likedEventIds ?? [],
        reactions: profile?.reactions ?? {},
      };

      await setDoc(docRef, payload, { merge: true });
    },
    [authUser, profile]
  );

  const updateProfile = useCallback(
    async (data: Partial<UserDocument>) => {
      if (!authUser) {
        throw new Error('Cannot update profile without an authenticated user.');
      }

      const docRef = doc(firebaseFirestore, USERS_COLLECTION, authUser.uid);
      const timestamp = serverTimestamp();
      const sanitized = Object.fromEntries(
        Object.entries(data).filter(([, value]) => value !== undefined)
      );

      await setDoc(
        docRef,
        {
          ...sanitized,
          updatedAt: timestamp,
        },
        { merge: true }
      );
    },
    [authUser]
  );

  const signOut = useCallback(async () => {
    if (!firebaseAuth.currentUser) {
      setError(null);
      return;
    }

    try {
      await firebaseAuth.signOut();
      setError(null);
    } catch (signOutError) {
      console.error('Failed to sign out', signOutError);
      setError(signOutError instanceof Error ? signOutError : new Error('Failed to sign out'));
    }
  }, []);

  const onboardingCompleted = profile?.onboardingCompleted ?? false;
  const initializing = authInitializing || profileLoading || savedEventsLoading;

  const contextValue = useMemo<UserContextValue>(
    () => ({
      authUser,
      profile,
      initializing,
      onboardingCompleted,
      error,
      completeOnboarding,
      updateProfile,
      signOut,
    }),
    [
      authUser,
      profile,
      initializing,
      onboardingCompleted,
      error,
      completeOnboarding,
      updateProfile,
      signOut,
    ]
  );

  return <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>;
};

export const useUserContext = () => {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error('useUserContext must be used within a UserProvider');
  }

  return context;
};

export type { UserProfile, OnboardingCompletionData };
