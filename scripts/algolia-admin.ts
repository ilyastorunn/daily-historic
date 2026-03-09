import type { AlgoliaSearchRecord } from "../search/algolia-record";

const DEFAULT_INDEX_NAME = "events_prod";
const DEFAULT_RECENT_REPLICA_SUFFIX = "_recent";

type AlgoliaTaskResponse = {
  taskID?: number;
  updatedAt?: string;
};

const getRequiredEnv = (name: string) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

export const getAlgoliaAdminConfig = () => {
  const appId = getRequiredEnv("ALGOLIA_APP_ID");
  const adminApiKey = getRequiredEnv("ALGOLIA_ADMIN_API_KEY");
  const indexName = process.env.ALGOLIA_INDEX_EVENTS ?? DEFAULT_INDEX_NAME;

  return {
    appId,
    adminApiKey,
    indexName,
    recentReplicaIndexName: `${indexName}${DEFAULT_RECENT_REPLICA_SUFFIX}`,
  };
};

const createHeaders = (appId: string, adminApiKey: string) => ({
  "Content-Type": "application/json",
  "X-Algolia-API-Key": adminApiKey,
  "X-Algolia-Application-Id": appId,
});

const requestAlgolia = async (
  path: string,
  init: RequestInit = {}
): Promise<unknown> => {
  const { appId, adminApiKey } = getAlgoliaAdminConfig();
  const response = await fetch(`https://${appId}.algolia.net${path}`, {
    ...init,
    headers: {
      ...createHeaders(appId, adminApiKey),
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Algolia admin request failed (${response.status}): ${body}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};

const waitForTask = async (indexName: string, taskId: number) => {
  const { appId, adminApiKey } = getAlgoliaAdminConfig();

  for (let attempt = 0; attempt < 30; attempt += 1) {
    const response = await fetch(
      `https://${appId}.algolia.net/1/indexes/${encodeURIComponent(indexName)}/task/${taskId}`,
      {
        headers: createHeaders(appId, adminApiKey),
      }
    );

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Algolia task polling failed (${response.status}): ${body}`);
    }

    const payload = (await response.json()) as { status?: string };
    if (payload.status === "published") {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Algolia task ${taskId} did not complete in time for index ${indexName}`);
};

const extractTaskId = (response: unknown) => {
  const taskId = (response as AlgoliaTaskResponse | null)?.taskID;
  if (typeof taskId !== "number") {
    throw new Error("Algolia response did not include a taskID");
  }
  return taskId;
};

export const configureAlgoliaIndices = async () => {
  const { indexName, recentReplicaIndexName } = getAlgoliaAdminConfig();

  const primarySettings = {
    searchableAttributes: [
      "title",
      "unordered(tags)",
      "unordered(summary)",
      "unordered(searchableText)",
    ],
    attributesForFaceting: [
      "filterOnly(categories)",
      "filterOnly(era)",
      "filterOnly(month)",
      "filterOnly(day)",
    ],
    customRanking: ["desc(editorialBoost)", "desc(popularityScore)", "desc(year)"],
    typoTolerance: true,
    allowTyposOnNumericTokens: false,
    replicas: [recentReplicaIndexName],
  };

  const replicaSettings = {
    searchableAttributes: primarySettings.searchableAttributes,
    attributesForFaceting: primarySettings.attributesForFaceting,
    customRanking: ["desc(year)", "desc(editorialBoost)", "desc(popularityScore)"],
    typoTolerance: true,
    allowTyposOnNumericTokens: false,
  };

  const primaryResponse = await requestAlgolia(
    `/1/indexes/${encodeURIComponent(indexName)}/settings?forwardToReplicas=true`,
    {
      method: "PUT",
      body: JSON.stringify(primarySettings),
    }
  );

  await waitForTask(indexName, extractTaskId(primaryResponse));

  const replicaResponse = await requestAlgolia(
    `/1/indexes/${encodeURIComponent(recentReplicaIndexName)}/settings`,
    {
      method: "PUT",
      body: JSON.stringify(replicaSettings),
    }
  );

  await waitForTask(recentReplicaIndexName, extractTaskId(replicaResponse));
};

export const clearAlgoliaIndex = async () => {
  const { indexName } = getAlgoliaAdminConfig();
  const response = await requestAlgolia(`/1/indexes/${encodeURIComponent(indexName)}/clear`, {
    method: "POST",
  });

  await waitForTask(indexName, extractTaskId(response));
};

export const upsertAlgoliaRecords = async (records: AlgoliaSearchRecord[]) => {
  if (records.length === 0) {
    return;
  }

  const { indexName } = getAlgoliaAdminConfig();
  const response = await requestAlgolia(`/1/indexes/${encodeURIComponent(indexName)}/batch`, {
    method: "POST",
    body: JSON.stringify({
      requests: records.map((record) => ({
        action: "updateObject",
        body: {
          ...record,
          objectID: record.objectID,
        },
      })),
    }),
  });

  await waitForTask(indexName, extractTaskId(response));
};

export const deleteAlgoliaRecord = async (objectID: string) => {
  const { indexName } = getAlgoliaAdminConfig();
  const response = await requestAlgolia(
    `/1/indexes/${encodeURIComponent(indexName)}/${encodeURIComponent(objectID)}`,
    {
      method: "DELETE",
    }
  );

  await waitForTask(indexName, extractTaskId(response));
};
