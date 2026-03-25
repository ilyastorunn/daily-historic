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
exports.cleanupUserDataOnDelete = void 0;
const admin = __importStar(require("firebase-admin"));
const firebase_functions_1 = require("firebase-functions");
const auth_1 = require("firebase-functions/v1/auth");
const USERS_COLLECTION = "Users";
exports.cleanupUserDataOnDelete = (0, auth_1.user)().onDelete(async (deletedUser) => {
    const uid = deletedUser.uid;
    const db = admin.firestore();
    const userDocRef = db.collection(USERS_COLLECTION).doc(uid);
    try {
        await db.recursiveDelete(userDocRef);
        firebase_functions_1.logger.info("User data cleanup completed after auth deletion.", { uid });
    }
    catch (error) {
        firebase_functions_1.logger.error("User data cleanup failed after auth deletion.", { uid, error });
        throw error;
    }
});
//# sourceMappingURL=user-cleanup.js.map