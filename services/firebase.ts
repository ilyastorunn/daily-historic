import '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore, {
  doc,
  getDoc,
  getDocs,
  setDoc,
  onSnapshot,
  collection,
  query,
  where,
  limit,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  deleteField,
} from '@react-native-firebase/firestore';

export const firebaseAuth = auth();
export const firebaseFirestore = firestore();

// Modular API exports
export {
  doc,
  getDoc,
  getDocs,
  setDoc,
  onSnapshot,
  collection,
  query,
  where,
  limit,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  deleteField,
};

export const USERS_COLLECTION = 'Users';
export const CONTENT_EVENTS_COLLECTION = 'contentEvents';
export const DAILY_DIGESTS_COLLECTION = 'dailyDigests';
