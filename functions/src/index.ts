import * as admin from "firebase-admin";
import {onRequest} from "firebase-functions/v2/https";

// Initialize Firebase Admin SDK
admin.initializeApp();

// Get Firestore instance (lazy initialization)
export const getDb = () => admin.firestore();

// Export HTTP functions (Gen2 format with built-in CORS)
export const api = onRequest(
  {
    cors: true, // Enable CORS for all origins
    timeoutSeconds: 60,
    memory: "256MiB",
  },
  async (request, response) => {
    // Lazy import to avoid top-level initialization issues
    const {exploreSearch} = await import("./api/explore/search");

    // Route requests
    const path = request.path;

    if (path === "/explore/search") {
      await exploreSearch(request, response);
      return;
    }

    response.status(404).json({error: "Not found"});
  }
);
