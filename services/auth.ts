export const linkWithGoogleCredential = async () => {
  throw new Error('Google sign-in is only available in native builds.');
};

export const linkWithAppleCredential = async () => {
  throw new Error('Apple sign-in is only available in native iOS builds.');
};

export const linkWithEmailCredential = async (_email: string, _password: string) => {
  throw new Error('Email sign-in is only available in native builds.');
};

export const signInWithGoogleCredential = async () => {
  throw new Error('Google sign-in is only available in native builds.');
};

export const signInWithAppleCredential = async () => {
  throw new Error('Apple sign-in is only available in native iOS builds.');
};

export const signInWithEmailCredential = async (_email: string, _password: string) => {
  throw new Error('Email sign-in is only available in native builds.');
};

export const reauthenticateWithGoogleCredential = async () => {
  throw new Error('Google reauthentication is only available in native builds.');
};

export const reauthenticateWithAppleCredentialAndGetAuthorizationCode = async () => {
  throw new Error('Apple reauthentication is only available in native iOS builds.');
};

export const reauthenticateWithEmailCredential = async (_password: string, _email?: string) => {
  throw new Error('Email reauthentication is only available in native builds.');
};

export const clearProviderSessions = async () => undefined;
