"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAlgoliaRecord = exports.upsertAlgoliaRecord = exports.algoliaAdminApiKey = void 0;
const params_1 = require("firebase-functions/params");
const DEFAULT_INDEX_NAME = "events_prod";
exports.algoliaAdminApiKey = (0, params_1.defineSecret)("ALGOLIA_ADMIN_API_KEY");
const getRequiredEnv = (name) => {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
};
const getConfig = () => {
    var _a;
    return {
        appId: getRequiredEnv("ALGOLIA_APP_ID"),
        adminApiKey: exports.algoliaAdminApiKey.value(),
        indexName: (_a = process.env.ALGOLIA_INDEX_EVENTS) !== null && _a !== void 0 ? _a : DEFAULT_INDEX_NAME,
    };
};
const createHeaders = (appId, adminApiKey) => ({
    "Content-Type": "application/json",
    "X-Algolia-API-Key": adminApiKey,
    "X-Algolia-Application-Id": appId,
});
const upsertAlgoliaRecord = async (record) => {
    const { appId, adminApiKey, indexName } = getConfig();
    const response = await fetch(`https://${appId}.algolia.net/1/indexes/${encodeURIComponent(indexName)}/${encodeURIComponent(record.objectID)}`, {
        method: "PUT",
        headers: createHeaders(appId, adminApiKey),
        body: JSON.stringify(record),
    });
    if (!response.ok) {
        const body = await response.text();
        throw new Error(`Algolia upsert failed (${response.status}): ${body}`);
    }
};
exports.upsertAlgoliaRecord = upsertAlgoliaRecord;
const deleteAlgoliaRecord = async (objectID) => {
    const { appId, adminApiKey, indexName } = getConfig();
    const response = await fetch(`https://${appId}.algolia.net/1/indexes/${encodeURIComponent(indexName)}/${encodeURIComponent(objectID)}`, {
        method: "DELETE",
        headers: createHeaders(appId, adminApiKey),
    });
    if (!response.ok) {
        const body = await response.text();
        throw new Error(`Algolia delete failed (${response.status}): ${body}`);
    }
};
exports.deleteAlgoliaRecord = deleteAlgoliaRecord;
//# sourceMappingURL=algolia-admin.js.map