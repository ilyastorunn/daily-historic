"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = exports.getDb = void 0;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
// Initialize Firebase Admin SDK
admin.initializeApp();
// Get Firestore instance (lazy initialization)
const getDb = () => admin.firestore();
exports.getDb = getDb;
// Export HTTP functions (Gen2 format with built-in CORS)
exports.api = (0, https_1.onRequest)({
    cors: true, // Enable CORS for all origins
    timeoutSeconds: 60,
    memory: "256MiB",
}, async (request, response) => {
    // Lazy import to avoid top-level initialization issues
    const { exploreSearch } = await Promise.resolve().then(() => __importStar(require("./api/explore/search")));
    // Route requests
    const path = request.path;
    if (path === "/explore/search") {
        await exploreSearch(request, response);
        return;
    }
    response.status(404).json({ error: "Not found" });
});
//# sourceMappingURL=index.js.map