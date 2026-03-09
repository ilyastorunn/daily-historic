import { describe, expect, it } from 'vitest';

import { getContentEventSyncAction } from '../../functions/src/search/sync';

describe('getContentEventSyncAction', () => {
  it('returns upsert for create and update events', () => {
    expect(
      getContentEventSyncAction({
        eventId: 'apollo-11',
        beforeExists: false,
        afterExists: true,
      })
    ).toEqual({ type: 'upsert', objectID: 'apollo-11' });

    expect(
      getContentEventSyncAction({
        eventId: 'apollo-11',
        beforeExists: true,
        afterExists: true,
      })
    ).toEqual({ type: 'upsert', objectID: 'apollo-11' });
  });

  it('returns delete for remove events', () => {
    expect(
      getContentEventSyncAction({
        eventId: 'apollo-11',
        beforeExists: true,
        afterExists: false,
      })
    ).toEqual({ type: 'delete', objectID: 'apollo-11' });
  });

  it('returns none when no valid object can be synced', () => {
    expect(
      getContentEventSyncAction({
        eventId: '',
        beforeExists: false,
        afterExists: false,
      })
    ).toEqual({ type: 'none' });
  });
});
