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
exports.cleanupUserDataOnDelete = exports.syncContentEventsToAlgolia = exports.getDb = void 0;
const admin = __importStar(require("firebase-admin"));
const content_events_sync_1 = require("./triggers/content-events-sync");
Object.defineProperty(exports, "syncContentEventsToAlgolia", { enumerable: true, get: function () { return content_events_sync_1.syncContentEventsToAlgolia; } });
const user_cleanup_1 = require("./triggers/user-cleanup");
Object.defineProperty(exports, "cleanupUserDataOnDelete", { enumerable: true, get: function () { return user_cleanup_1.cleanupUserDataOnDelete; } });
// Initialize Firebase Admin SDK
admin.initializeApp();
// Get Firestore instance (lazy initialization)
const getDb = () => admin.firestore();
exports.getDb = getDb;
//# sourceMappingURL=index.js.map