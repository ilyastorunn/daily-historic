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
import type { AccountSelection } from '@/contexts/onboarding-context';

import {
  USERS_COLLECTION,
  firebaseAuth,
  firebaseFirestore,
  doc,
  setDoc,
  onSnapshot,
  serverTimestamp,
} from '@/services/firebase';
import {
  clearProviderSessions,
  linkWithAppleCredential,
  linkWithEmailCredential,
  linkWithGoogleCredential,
  reauthenticateWithAppleCredentialAndGetAuthorizationCode,
  reauthenticateWithEmailCredential,
  reauthenticateWithGoogleCredential,
  signInWithAppleCredential,
  signInWithEmailCredential,
  signInWithGoogleCredential,
} from '@/services/auth';
import { syncDailyNotificationFromProfile } from '@/services/notifications';
import type { OnboardingData, UserDocument, UserProfile } from '@/types/user';

type OnboardingCompletionData = OnboardingData;
type LinkResult = 'linked' | 'signedIn';

type UserContextValue = {
  authUser: FirebaseAuthTypes.User | null;
  authAccountSelection: AccountSelection | null;
  profile: UserProfile | null;
  initializing: boolean;
  onboardingCompleted: boolean;
  isAnonymousSession: boolean;
  authBusy: boolean;
  authError: string | null;
  error: Error | null;
  clearAuthError: () => void;
  completeOnboarding: (data: OnboardingCompletionData) => Promise<void>;
  linkWithGoogle: () => Promise<LinkResult>;
  linkWithApple: () => Promise<LinkResult>;
  linkWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  deleteAccount: (options?: { password?: string }) => Promise<void>;
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
const defaultAuthError = null;

const firebaseProviderMap: Partial<Record<string, AccountSelection>> = {
  'google.com': 'google',
  'apple.com': 'apple',
  password: 'email',
};

const inferAccountSelectionFromUser = (
  user: FirebaseAuthTypes.User | null
): AccountSelection | null => {
  if (!user || user.isAnonymous) {
    return null;
  }

  for (const providerInfo of user.providerData) {
    const mappedProvider = firebaseProviderMap[providerInfo.providerId];

    if (mappedProvider) {
      return mappedProvider;
    }
  }

  return null;
};

const createAuthFlowError = (code: string, message: string) => {
  const error = new Error(message) as Error & { code?: string };
  error.code = code;
  return error;
};

const extractAuthErrorCode = (authError: unknown) =>
  typeof authError === 'object' && authError && 'code' in authError
    ? String((authError as { code?: unknown }).code)
    : '';

const formatAuthErrorMessage = (authError: unknown) => {
  const code = extractAuthErrorCode(authError);

  switch (code) {
    case 'auth/account-exists-with-different-credential':
      return 'This email is already attached to another sign-in method.';
    case 'auth/credential-already-in-use':
      return 'That account is already linked elsewhere. Use Sign in instead.';
    case 'auth/email-already-in-use':
      return 'This email is already in use. Use Sign in instead.';
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    case 'auth/invalid-credential':
      return 'Those credentials are invalid or expired. Try again.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled in Firebase yet.';
    case 'auth/provider-already-linked':
      return 'This provider is already linked to your account.';
    case 'auth/requires-recent-login':
      return 'Please sign in again and retry this action.';
    case 'auth/requires-password':
      return 'Enter your password to delete this account.';
    case 'auth/unsupported-provider':
      return 'This account type is not supported for in-app deletion yet.';
    case 'auth/guest-session':
      return 'Guest sessions cannot be deleted.';
    case 'auth/user-not-found':
      return 'No account found for that email.';
    case 'auth/wrong-password':
      return 'The password is incorrect.';
    case 'ERR_REQUEST_CANCELED':
    case 'SIGN_IN_CANCELLED':
      return 'Sign-in was cancelled.';
    case 'IN_PROGRESS':
      return 'Another sign-in attempt is already in progress.';
    case 'PLAY_SERVICES_NOT_AVAILABLE':
      return 'Google Play services are not available on this device.';
    default:
      return authError instanceof Error ? authError.message : 'Authentication failed. Try again.';
  }
};

const hasNotificationPreferenceUpdate = (data: Partial<UserDocument>) =>
  'notificationEnabled' in data ||
  'notificationTime' in data ||
  'timezone' in data ||
  'pushPermission' in data;

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
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(defaultAuthError);
  const [error, setError] = useState<Error | null>(defaultError);
  const signingInRef = useRef(false);
  const savedMigrationInFlightRef = useRef(false);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  const ensureAnonymousSession = useCallback(async () => {
    if (firebaseAuth.currentUser || signingInRef.current) {
      return;
    }

    signingInRef.current = true;

    try {
      await firebaseAuth.signInAnonymously();
      setError(null);
    } catch (signInError) {
      console.error('Anonymous sign-in failed', signInError);
      setError(signInError instanceof Error ? signInError : new Error('Anonymous sign-in failed'));
      setAuthInitializing(false);
      throw signInError;
    } finally {
      signingInRef.current = false;
    }
  }, []);

  const runAuthAction = useCallback(async <T,>(action: () => Promise<T>) => {
    setAuthBusy(true);
    setAuthError(null);

    try {
      const result = await action();
      setError(null);
      return result;
    } catch (actionError) {
      const authErrorCode = extractAuthErrorCode(actionError);
      console.error('Authentication action failed', {
        code: authErrorCode || 'unknown',
      });
      setAuthError(formatAuthErrorMessage(actionError));
      throw actionError;
    } finally {
      setAuthBusy(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = firebaseAuth.onAuthStateChanged(async (currentUser) => {
      if (!currentUser) {
        setAuthUser(null);
        setProfileDocument(null);
        setSavedEventIdsState(null);
        setProfileLoading(false);
        setSavedEventsLoading(false);
        setAuthInitializing(true);
        savedMigrationInFlightRef.current = false;

        try {
          await ensureAnonymousSession();
        } catch {
          // Error state is handled in ensureAnonymousSession.
        }

        return;
      }

      setProfileLoading(true);
      setSavedEventsLoading(true);
      setAuthUser(currentUser);
      setAuthError(null);
      setError(null);
      setAuthInitializing(false);
    });

    return unsubscribe;
  }, [ensureAnonymousSession]);

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
      const resolvedAccountSelection =
        data.accountSelection ??
        profile?.accountSelection ??
        inferAccountSelectionFromUser(authUser) ??
        'anonymous';

      const payload = {
        uid: authUser.uid,
        ...sanitizedData,
        accountSelection: resolvedAccountSelection,
        onboardingCompleted: true,
        updatedAt: timestamp,
        ...(profile?.createdAt ? {} : { createdAt: timestamp }),
        likedEventIds: profile?.likedEventIds ?? [],
        reactions: profile?.reactions ?? {},
      } as UserDocument;

      await setDoc(docRef, payload, { merge: true });

      await syncDailyNotificationFromProfile({
        notificationEnabled:
          payload.notificationEnabled ?? profile?.notificationEnabled ?? false,
        notificationTime: payload.notificationTime ?? profile?.notificationTime,
        timezone: payload.timezone ?? profile?.timezone,
        pushPermission: payload.pushPermission ?? profile?.pushPermission ?? 'unknown',
      });
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
      ) as Partial<UserDocument>;

      await setDoc(
        docRef,
        {
          ...sanitized,
          updatedAt: timestamp,
        },
        { merge: true }
      );

      if (hasNotificationPreferenceUpdate(sanitized)) {
        await syncDailyNotificationFromProfile({
          notificationEnabled:
            sanitized.notificationEnabled ??
            profile?.notificationEnabled ??
            false,
          notificationTime:
            sanitized.notificationTime ?? profile?.notificationTime,
          timezone: sanitized.timezone ?? profile?.timezone,
          pushPermission:
            sanitized.pushPermission ?? profile?.pushPermission ?? 'unknown',
        });
      }
    },
    [authUser, profile]
  );

  const linkWithGoogle = useCallback(async () => {
    return runAuthAction(async () => {
      return linkWithGoogleCredential();
    });
  }, [runAuthAction]);

  const linkWithApple = useCallback(async () => {
    return runAuthAction(async () => {
      return linkWithAppleCredential();
    });
  }, [runAuthAction]);

  const linkWithEmail = useCallback(
    async (email: string, password: string) => {
      await runAuthAction(async () => {
        await linkWithEmailCredential(email, password);
      });
    },
    [runAuthAction]
  );

  const signInWithGoogle = useCallback(async () => {
    await runAuthAction(async () => {
      await signInWithGoogleCredential();
    });
  }, [runAuthAction]);

  const signInWithApple = useCallback(async () => {
    await runAuthAction(async () => {
      await signInWithAppleCredential();
    });
  }, [runAuthAction]);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      await runAuthAction(async () => {
        await signInWithEmailCredential(email, password);
      });
    },
    [runAuthAction]
  );

  const deleteAccount = useCallback(
    async (options?: { password?: string }) => {
      await runAuthAction(async () => {
        const currentUser = firebaseAuth.currentUser;

        if (!currentUser || currentUser.isAnonymous) {
          throw createAuthFlowError('auth/guest-session', 'Guest sessions cannot be deleted.');
        }

        const providerIds = new Set(
          currentUser.providerData
            .map((provider) => provider.providerId)
            .filter((providerId): providerId is string => providerId.length > 0)
        );

        if (providerIds.has('apple.com')) {
          const authorizationCode = await reauthenticateWithAppleCredentialAndGetAuthorizationCode();
          await firebaseAuth.revokeToken(authorizationCode);
        } else if (providerIds.has('google.com')) {
          await reauthenticateWithGoogleCredential();
        } else if (providerIds.has('password')) {
          const password = options?.password?.trim();

          if (!password) {
            throw createAuthFlowError(
              'auth/requires-password',
              'Password is required for email account deletion.'
            );
          }

          await reauthenticateWithEmailCredential(password, currentUser.email ?? undefined);
        } else {
          throw createAuthFlowError(
            'auth/unsupported-provider',
            'No supported sign-in provider was found for account deletion.'
          );
        }

        await currentUser.delete();
        await ensureAnonymousSession();
        setError(null);
      });
    },
    [ensureAnonymousSession, runAuthAction]
  );

  const signOut = useCallback(async () => {
    if (!firebaseAuth.currentUser) {
      setError(null);
      await ensureAnonymousSession();
      return;
    }

    setAuthInitializing(true);
    setAuthBusy(true);
    setAuthError(null);

    try {
      await clearProviderSessions();
      await firebaseAuth.signOut();
      await ensureAnonymousSession();
      setError(null);
    } catch (signOutError) {
      console.error('Failed to sign out', signOutError);
      setError(signOutError instanceof Error ? signOutError : new Error('Failed to sign out'));
      setAuthError(formatAuthErrorMessage(signOutError));
      setAuthInitializing(false);
      throw signOutError;
    } finally {
      setAuthBusy(false);
    }
  }, [ensureAnonymousSession]);

  const authAccountSelection = useMemo(
    () => inferAccountSelectionFromUser(authUser),
    [authUser]
  );
  const isAnonymousSession = authUser?.isAnonymous ?? true;
  const onboardingCompleted = profile?.onboardingCompleted ?? false;
  const initializing = authInitializing || profileLoading || savedEventsLoading;

  const contextValue = useMemo<UserContextValue>(
    () => ({
      authUser,
      authAccountSelection,
      profile,
      initializing,
      onboardingCompleted,
      isAnonymousSession,
      authBusy,
      authError,
      error,
      clearAuthError,
      completeOnboarding,
      linkWithGoogle,
      linkWithApple,
      linkWithEmail,
      signInWithGoogle,
      signInWithApple,
      signInWithEmail,
      deleteAccount,
      updateProfile,
      signOut,
    }),
    [
      authUser,
      authAccountSelection,
      profile,
      initializing,
      onboardingCompleted,
      isAnonymousSession,
      authBusy,
      authError,
      error,
      clearAuthError,
      completeOnboarding,
      linkWithGoogle,
      linkWithApple,
      linkWithEmail,
      signInWithGoogle,
      signInWithApple,
      signInWithEmail,
      deleteAccount,
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
export { inferAccountSelectionFromUser };
