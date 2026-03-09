import { onDocumentWritten } from "firebase-functions/v2/firestore";

import { algoliaAdminApiKey, deleteAlgoliaRecord, upsertAlgoliaRecord } from "../search/algolia-admin";
import { toAlgoliaSearchRecord } from "../search/record";
import { getContentEventSyncAction } from "../search/sync";

export const syncContentEventsToAlgolia = onDocumentWritten(
  {
    document: "contentEvents/{eventId}",
    timeoutSeconds: 60,
    memory: "256MiB",
    secrets: [algoliaAdminApiKey],
  },
  async (event) => {
    const eventId = event.params.eventId as string;
    const beforeExists = event.data?.before.exists ?? false;
    const afterExists = event.data?.after.exists ?? false;
    const action = getContentEventSyncAction({
      eventId,
      beforeExists,
      afterExists,
    });

    if (action.type === "delete") {
      await deleteAlgoliaRecord(action.objectID);
      return;
    }

    if (action.type !== "upsert") {
      return;
    }

    const afterData = event.data?.after.data();
    if (!afterData) {
      return;
    }

    const record = toAlgoliaSearchRecord({
      ...afterData,
      eventId,
    });

    if (!record) {
      return;
    }

    await upsertAlgoliaRecord(record);
  }
);
