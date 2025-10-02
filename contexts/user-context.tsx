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
  firebaseFieldValue,
  firebaseFirestore,
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
    const docRef = firebaseFirestore
      .collection<UserDocument>(USERS_COLLECTION)
      .doc(authUser.uid);

    const unsubscribe = docRef.onSnapshot(
      (snapshot) => {
        if (!snapshot.exists) {
          setProfile(null);
        } else {
          setProfile(snapshot.data() as UserProfile);
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

      const docRef = firebaseFirestore
        .collection<UserDocument>(USERS_COLLECTION)
        .doc(authUser.uid);

      const serverTimestamp = firebaseFieldValue.serverTimestamp();

      const sanitizedData = Object.fromEntries(
        Object.entries(data).filter(([, value]) => value !== undefined)
      ) as Partial<OnboardingData>;

      const payload: UserDocument = {
        uid: authUser.uid,
        ...sanitizedData,
        onboardingCompleted: true,
        updatedAt: serverTimestamp,
        ...(profile?.createdAt ? {} : { createdAt: serverTimestamp }),
      };

      await docRef.set(payload, { merge: true });
    },
    [authUser, profile]
  );

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
    }),
    [authUser, profile, initializing, onboardingCompleted, error, completeOnboarding]
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
