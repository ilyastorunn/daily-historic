import { describe, expect, it } from 'vitest';

import {
  buildAlgoliaFilters,
  buildAlgoliaSearchPayload,
  resolveAlgoliaIndexName,
} from '../algolia-query';

describe('algolia query helpers', () => {
  it('builds category, era, and date filters together', () => {
    expect(
      buildAlgoliaFilters({
        categories: ['science-discovery', 'inventions'],
        era: 'twentieth',
        month: 7,
        day: 20,
      })
    ).toBe(
      '(categories:"science-discovery" OR categories:"inventions") AND era:"twentieth" AND month=7 AND day=20'
    );
  });

  it('resolves recent sort to the replica index', () => {
    expect(resolveAlgoliaIndexName('events_prod', 'recent')).toBe('events_prod_recent');
  });

  it('creates a stable payload for client search', () => {
    const result = buildAlgoliaSearchPayload(
      {
        query: 'apollo',
        filters: { month: 7, day: 20 },
        page: 2,
        hitsPerPage: 12,
        sortMode: 'relevance',
      },
      'events_prod'
    );

    expect(result).toMatchObject({
      indexName: 'events_prod',
      payload: {
        query: 'apollo',
        page: 2,
        hitsPerPage: 12,
        filters: 'month=7 AND day=20',
      },
    });
  });
});
