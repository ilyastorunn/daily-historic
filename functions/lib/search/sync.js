"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getContentEventSyncAction = void 0;
const getContentEventSyncAction = (args) => {
    const { eventId, beforeExists, afterExists } = args;
    if (!eventId) {
        return { type: "none" };
    }
    if (!afterExists && beforeExists) {
        return { type: "delete", objectID: eventId };
    }
    if (afterExists) {
        return { type: "upsert", objectID: eventId };
    }
    return { type: "none" };
};
exports.getContentEventSyncAction = getContentEventSyncAction;
//# sourceMappingURL=sync.js.map