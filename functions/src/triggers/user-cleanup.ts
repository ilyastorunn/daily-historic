import * as admin from "firebase-admin";
import { logger } from "firebase-functions";
import { user } from "firebase-functions/v1/auth";

const USERS_COLLECTION = "Users";

export const cleanupUserDataOnDelete = user().onDelete(async (deletedUser) => {
  const uid = deletedUser.uid;
  const db = admin.firestore();
  const userDocRef = db.collection(USERS_COLLECTION).doc(uid);

  try {
    await db.recursiveDelete(userDocRef);
    logger.info("User data cleanup completed after auth deletion.", { uid });
  } catch (error) {
    logger.error("User data cleanup failed after auth deletion.", { uid, error });
    throw error;
  }
});
