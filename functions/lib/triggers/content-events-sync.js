"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncContentEventsToAlgolia = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const algolia_admin_1 = require("../search/algolia-admin");
const record_1 = require("../search/record");
const sync_1 = require("../search/sync");
exports.syncContentEventsToAlgolia = (0, firestore_1.onDocumentWritten)({
    document: "contentEvents/{eventId}",
    timeoutSeconds: 60,
    memory: "256MiB",
    secrets: [algolia_admin_1.algoliaAdminApiKey],
}, async (event) => {
    var _a, _b, _c, _d, _e;
    const eventId = event.params.eventId;
    const beforeExists = (_b = (_a = event.data) === null || _a === void 0 ? void 0 : _a.before.exists) !== null && _b !== void 0 ? _b : false;
    const afterExists = (_d = (_c = event.data) === null || _c === void 0 ? void 0 : _c.after.exists) !== null && _d !== void 0 ? _d : false;
    const action = (0, sync_1.getContentEventSyncAction)({
        eventId,
        beforeExists,
        afterExists,
    });
    if (action.type === "delete") {
        await (0, algolia_admin_1.deleteAlgoliaRecord)(action.objectID);
        return;
    }
    if (action.type !== "upsert") {
        return;
    }
    const afterData = (_e = event.data) === null || _e === void 0 ? void 0 : _e.after.data();
    if (!afterData) {
        return;
    }
    const record = (0, record_1.toAlgoliaSearchRecord)(Object.assign(Object.assign({}, afterData), { eventId }));
    if (!record) {
        return;
    }
    await (0, algolia_admin_1.upsertAlgoliaRecord)(record);
});
//# sourceMappingURL=content-events-sync.js.map