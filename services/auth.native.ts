import auth from '@react-native-firebase/auth';
import type { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

import { firebaseAuth } from '@/services/firebase';

let googleConfigured = false;
type LinkResult = 'linked' | 'signedIn';

const assertGuestUser = () => {
  const currentUser = firebaseAuth.currentUser;

  if (!currentUser) {
    throw new Error('No guest session is available to link.');
  }

  return currentUser;
};

const assertAuthenticatedUser = () => {
  const currentUser = firebaseAuth.currentUser;

  if (!currentUser || currentUser.isAnonymous) {
    throw new Error('No authenticated account is available for this action.');
  }

  return currentUser;
};

const randomNonce = () => {
  return [...Crypto.getRandomBytes(16)]
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('');
};

const ensureGoogleConfigured = () => {
  if (googleConfigured) {
    return;
  }

  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

  if (!webClientId) {
    throw new Error(
      'Missing EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID. Add the Google web client ID before using Google sign-in.'
    );
  }

  GoogleSignin.configure({
    webClientId,
    iosClientId,
    scopes: ['email', 'profile'],
  });

  googleConfigured = true;
};

const getGoogleCredential = async () => {
  ensureGoogleConfigured();

  if (Platform.OS === 'android') {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  }

  const signInResult = await GoogleSignin.signIn();

  if (signInResult.type !== 'success') {
    const cancelError = new Error('Sign-in was cancelled.') as Error & { code?: string };
    cancelError.code = 'SIGN_IN_CANCELLED';
    throw cancelError;
  }

  const idToken = signInResult.data.idToken;

  if (!idToken) {
    throw new Error('Google sign-in did not return an ID token.');
  }

  return auth.GoogleAuthProvider.credential(idToken);
};

const extractAuthErrorCode = (error: unknown) =>
  typeof error === 'object' && error && 'code' in error
    ? String((error as { code?: unknown }).code)
    : '';

const isCredentialCollisionAuthError = (code: string) =>
  code === 'auth/credential-already-in-use' ||
  code === 'auth/account-exists-with-different-credential' ||
  code === 'auth/provider-already-linked';

type AppleSignInPayload = {
  credential: FirebaseAuthTypes.AuthCredential;
  authorizationCode: string;
};

const getAppleSignInPayload = async (): Promise<AppleSignInPayload> => {
  if (Platform.OS !== 'ios') {
    throw new Error('Apple sign-in is only available on iOS.');
  }

  const isAvailable = await AppleAuthentication.isAvailableAsync();

  if (!isAvailable) {
    throw new Error('Apple sign-in is not available on this device.');
  }

  const rawNonce = randomNonce();
  const hashedNonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    rawNonce
  );

  const appleCredential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
    nonce: hashedNonce,
  });

  if (!appleCredential.identityToken) {
    throw new Error('Apple sign-in did not return an identity token.');
  }

  if (!appleCredential.authorizationCode) {
    throw new Error('Apple sign-in did not return an authorization code.');
  }

  return {
    credential: auth.AppleAuthProvider.credential(appleCredential.identityToken, rawNonce),
    authorizationCode: appleCredential.authorizationCode,
  };
};

const getAppleCredential = async () => {
  const payload = await getAppleSignInPayload();
  return payload.credential;
};

export const linkWithGoogleCredential = async (): Promise<LinkResult> => {
  const user = assertGuestUser();
  const credential = await getGoogleCredential();

  try {
    await user.linkWithCredential(credential);
    return 'linked';
  } catch (error) {
    const code = extractAuthErrorCode(error);

    if (!isCredentialCollisionAuthError(code)) {
      throw error;
    }

    await firebaseAuth.signInWithCredential(credential);
    return 'signedIn';
  }
};

export const linkWithAppleCredential = async (): Promise<LinkResult> => {
  const user = assertGuestUser();
  const payload = await getAppleSignInPayload();

  try {
    await user.linkWithCredential(payload.credential);
    return 'linked';
  } catch (error) {
    const code = extractAuthErrorCode(error);

    if (!isCredentialCollisionAuthError(code)) {
      throw error;
    }

    await firebaseAuth.signInWithCredential(payload.credential);
    return 'signedIn';
  }
};

export const linkWithEmailCredential = async (email: string, password: string) => {
  const user = assertGuestUser();
  const credential = auth.EmailAuthProvider.credential(email.trim(), password);
  await user.linkWithCredential(credential);
};

export const signInWithGoogleCredential = async () => {
  const credential = await getGoogleCredential();
  await firebaseAuth.signInWithCredential(credential);
};

export const signInWithAppleCredential = async () => {
  const credential = await getAppleCredential();
  await firebaseAuth.signInWithCredential(credential);
};

export const signInWithEmailCredential = async (email: string, password: string) => {
  await firebaseAuth.signInWithEmailAndPassword(email.trim(), password);
};

export const reauthenticateWithGoogleCredential = async () => {
  const user = assertAuthenticatedUser();
  const credential = await getGoogleCredential();
  await user.reauthenticateWithCredential(credential);
};

export const reauthenticateWithAppleCredentialAndGetAuthorizationCode = async () => {
  const user = assertAuthenticatedUser();
  const payload = await getAppleSignInPayload();
  await user.reauthenticateWithCredential(payload.credential);
  return payload.authorizationCode;
};

export const reauthenticateWithEmailCredential = async (password: string, email?: string) => {
  const user = assertAuthenticatedUser();
  const resolvedEmail = email?.trim() || user.email?.trim();

  if (!resolvedEmail) {
    throw new Error('Email reauthentication requires an email address.');
  }

  const credential = auth.EmailAuthProvider.credential(resolvedEmail, password);
  await user.reauthenticateWithCredential(credential);
};

export const clearProviderSessions = async () => {
  try {
    await GoogleSignin.signOut();
  } catch {
    // Best effort only. Firebase auth state is authoritative for the app.
  }
};
