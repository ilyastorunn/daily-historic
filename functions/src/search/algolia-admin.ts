import type { FunctionAlgoliaSearchRecord } from "./record";
import { defineSecret } from "firebase-functions/params";

const DEFAULT_INDEX_NAME = "events_prod";
export const algoliaAdminApiKey = defineSecret("ALGOLIA_ADMIN_API_KEY");

const getRequiredEnv = (name: string) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const getConfig = () => {
  return {
    appId: getRequiredEnv("ALGOLIA_APP_ID"),
    adminApiKey: algoliaAdminApiKey.value(),
    indexName: process.env.ALGOLIA_INDEX_EVENTS ?? DEFAULT_INDEX_NAME,
  };
};

const createHeaders = (appId: string, adminApiKey: string) => ({
  "Content-Type": "application/json",
  "X-Algolia-API-Key": adminApiKey,
  "X-Algolia-Application-Id": appId,
});

export const upsertAlgoliaRecord = async (record: FunctionAlgoliaSearchRecord) => {
  const { appId, adminApiKey, indexName } = getConfig();
  const response = await fetch(
    `https://${appId}.algolia.net/1/indexes/${encodeURIComponent(indexName)}/${encodeURIComponent(record.objectID)}`,
    {
      method: "PUT",
      headers: createHeaders(appId, adminApiKey),
      body: JSON.stringify(record),
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Algolia upsert failed (${response.status}): ${body}`);
  }
};

export const deleteAlgoliaRecord = async (objectID: string) => {
  const { appId, adminApiKey, indexName } = getConfig();
  const response = await fetch(
    `https://${appId}.algolia.net/1/indexes/${encodeURIComponent(indexName)}/${encodeURIComponent(objectID)}`,
    {
      method: "DELETE",
      headers: createHeaders(appId, adminApiKey),
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Algolia delete failed (${response.status}): ${body}`);
  }
};
