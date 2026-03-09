export type ContentEventSyncAction =
  | { type: "upsert"; objectID: string }
  | { type: "delete"; objectID: string }
  | { type: "none" };

export const getContentEventSyncAction = (args: {
  eventId: string;
  beforeExists: boolean;
  afterExists: boolean;
}): ContentEventSyncAction => {
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
