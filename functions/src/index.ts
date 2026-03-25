import * as admin from "firebase-admin";
import {syncContentEventsToAlgolia} from "./triggers/content-events-sync";
import {cleanupUserDataOnDelete} from "./triggers/user-cleanup";

// Initialize Firebase Admin SDK
admin.initializeApp();

// Get Firestore instance (lazy initialization)
export const getDb = () => admin.firestore();
export {syncContentEventsToAlgolia};
export {cleanupUserDataOnDelete};
