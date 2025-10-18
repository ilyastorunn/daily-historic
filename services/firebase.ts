import '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

export const firebaseAuth = auth();
export const firebaseFirestore = firestore();
export const firebaseFieldValue = firestore.FieldValue;

export const USERS_COLLECTION = 'Users';
export const CONTENT_EVENTS_COLLECTION = 'contentEvents';
export const DAILY_DIGESTS_COLLECTION = 'dailyDigests';
