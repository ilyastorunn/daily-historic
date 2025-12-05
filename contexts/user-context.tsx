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
  getDoc,
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

const defaultError = null;

export const UserProvider = ({ children }: UserProviderProps) => {
  const [authUser, setAuthUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authInitializing, setAuthInitializing] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [error, setError] = useState<Error | null>(defaultError);
  const signingInRef = useRef(false);

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
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    setProfileLoading(true);
    const docRef = doc(firebaseFirestore, USERS_COLLECTION, authUser.uid);

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (!snapshot.exists) {
          setProfile(null);
        } else {
          const data = snapshot.data();

          if (!data) {
            setProfile(null);
          } else {
            const savedEventIds = Array.isArray(data.savedEventIds) ? data.savedEventIds : [];
            const likedEventIds = Array.isArray(data.likedEventIds) ? data.likedEventIds : [];
            const reactions =
              data.reactions && typeof data.reactions === 'object' ? data.reactions : {};
            const categories = Array.isArray(data.categories) ? data.categories : [];
            const eras = Array.isArray(data.eras) ? data.eras : [];
            const categoriesSkipped =
              typeof data.categoriesSkipped === 'boolean' ? data.categoriesSkipped : false;

            setProfile({
              ...(data as UserProfile),
              categories,
              eras,
              savedEventIds,
              likedEventIds,
              reactions,
              categoriesSkipped,
            });
          }
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
        savedEventIds: profile?.savedEventIds ?? [],
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
  const initializing = authInitializing || profileLoading;

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
