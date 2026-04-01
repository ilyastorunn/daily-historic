import { describe, expect, it } from 'vitest';

import { classifyEvent } from '../classification';
import type { HistoricalEventRecord } from '../types';

const baseEvent = (summary: string): HistoricalEventRecord => ({
  eventId: 'evt',
  canonicalKey: '1969:01:28:test',
  year: 1969,
  text: summary,
  summary,
  categories: [],
  tags: [],
  date: {
    month: 1,
    day: 28,
  },
  dateISO: '1969-01-28',
  relatedPages: [
    {
      pageId: 1,
      canonicalTitle: 'Example',
      displayTitle: 'Example',
      normalizedTitle: 'Example',
      desktopUrl: 'https://example.com',
      mobileUrl: 'https://example.com',
      thumbnails: [],
    },
  ],
  source: {
    provider: 'wikimedia',
    feed: 'year-page',
    rawType: 'events',
    capturedAt: '2026-01-01T00:00:00.000Z',
    sourceDate: '1969',
    payloadCacheKey: 'year-page:1969',
  },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  timeMachine: {
    eligible: true,
    sourceType: 'wikipedia-year-page',
    sourceTypes: ['wikipedia-year-page'],
    sourceKey: 'year-page:1969:1',
    parserVersion: 'test',
    qualityFlags: [],
  },
});

describe('classification keyword rules', () => {
  it('does not misclassify Santa Barbara as art-culture', () => {
    const result = classifyEvent({
      event: baseEvent("1969 Santa Barbara oil spill: A blowout spills crude oil into the Pacific Ocean."),
      relatedEntities: [],
    });

    expect(result.categories.includes('art-culture')).toBe(false);
    expect(result.categories.includes('natural-disasters')).toBe(true);
  });

  it('still classifies elections as politics', () => {
    const result = classifyEvent({
      event: baseEvent('2024 Portuguese legislative election: The Democratic Alliance wins a plurality of seats.'),
      relatedEntities: [],
    });

    expect(result.categories.includes('politics')).toBe(true);
  });

  it('classifies Apollo Moon missions as exploration', () => {
    const result = classifyEvent({
      event: baseEvent(
        'Apollo program: Apollo 11 lifts off toward the first crewed landing on the Moon.'
      ),
      relatedEntities: [],
    });

    expect(result.categories.includes('exploration')).toBe(true);
  });

  it('classifies Woodstock-style festival events as art-culture', () => {
    const result = classifyEvent({
      event: baseEvent(
        'The Woodstock Festival is held near White Lake, New York, featuring top rock musicians of the era.'
      ),
      relatedEntities: [],
    });

    expect(result.categories.includes('art-culture')).toBe(true);
  });
});
