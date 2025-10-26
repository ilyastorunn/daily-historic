import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

// Initialize Firebase Admin SDK
admin.initializeApp();

// Export Firestore instance for use in other modules
export const db = admin.firestore();

// Import API routes
import {exploreSearch} from "./api/explore/search";

// Export HTTP functions
export const api = functions.https.onRequest(async (request, response) => {
  // CORS headers
  response.set("Access-Control-Allow-Origin", "*");
  response.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.set("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight
  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  // Route requests
  const path = request.path;

  if (path === "/explore/search") {
    await exploreSearch(request, response);
    return;
  }

  response.status(404).json({error: "Not found"});
});
