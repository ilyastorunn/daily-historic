import { describe, expect, it } from 'vitest';

import { toAlgoliaSearchRecord } from '../algolia-record';

describe('toAlgoliaSearchRecord', () => {
  it('builds a projection from event content and primary page metadata', () => {
    const record = toAlgoliaSearchRecord({
      eventId: 'apollo-11',
      year: 1969,
      text: 'Apollo 11 lands on the moon.',
      summary: 'Neil Armstrong steps onto the lunar surface.',
      categories: ['science-discovery'],
      era: 'twentieth',
      tags: ['space', 'nasa'],
      date: { month: 7, day: 20 },
      updatedAt: '2026-03-08T10:00:00.000Z',
      relatedPages: [
        {
          displayTitle: 'Apollo 11',
          canonicalTitle: 'Apollo_11',
          description: 'Crewed lunar landing mission',
          extract: 'Apollo 11 was the spaceflight that first landed humans on the Moon.',
          selectedMedia: {
            sourceUrl: 'https://upload.wikimedia.org/example.jpg',
          },
        },
      ],
    });

    expect(record).toMatchObject({
      objectID: 'apollo-11',
      eventId: 'apollo-11',
      title: 'Apollo 11',
      summary: 'Neil Armstrong steps onto the lunar surface.',
      categories: ['science-discovery'],
      era: 'twentieth',
      year: 1969,
      month: 7,
      day: 20,
      imageUrl: 'https://upload.wikimedia.org/example.jpg',
      location: 'Crewed lunar landing mission',
      updatedAt: '2026-03-08T10:00:00.000Z',
      editorialBoost: 0,
      popularityScore: 0,
    });

    expect(record?.searchableText).toContain('Apollo 11 lands on the moon.');
    expect(record?.searchableText).toContain('Apollo 11 was the spaceflight');
    expect(record?.searchableText).toContain('space');
  });

  it('returns null when eventId is missing', () => {
    expect(
      toAlgoliaSearchRecord({
        eventId: '',
      })
    ).toBeNull();
  });
});
