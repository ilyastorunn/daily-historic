import { describe, expect, it } from 'vitest';

import {
  buildTimeMachineSections,
  buildTimeMachineYearAggregate,
  createEmptyTimeMachineYearDocument,
} from '../utils/time-machine';

describe('Time Machine aggregate helpers', () => {
  it('builds a deterministic aggregate and selects highlights by importance', () => {
    const aggregate = buildTimeMachineYearAggregate(1991, [
      {
        eventId: 'a',
        year: 1991,
        title: 'A',
        summary: 'A long enough summary to score well.',
        categories: ['politics'],
        date: { month: 12, day: 8 },
        imageUrl: 'https://example.com/a.jpg',
        pageCount: 2,
      },
      {
        eventId: 'b',
        year: 1991,
        title: 'B',
        summary: 'Short summary',
        categories: ['science-discovery'],
        date: { month: 1, day: 1 },
        pageCount: 1,
      },
      {
        eventId: 'c',
        year: 1991,
        title: 'C',
        summary: 'Another event with enough content to stay in the timeline.',
        categories: ['culture'],
        date: { month: 2, day: 14 },
        pageCount: 1,
      },
      {
        eventId: 'd',
        year: 1991,
        title: 'D',
        summary: 'A fourth event pushes the year into partial coverage.',
        categories: ['conflict'],
        date: { month: 5, day: 9 },
        pageCount: 1,
      },
    ]);

    expect(aggregate.document.heroEventId).toBe('a');
    expect(aggregate.document.highlightEventIds).toEqual(['b', 'c', 'd', 'a']);
    expect(aggregate.stats.eventCount).toBe(4);
    expect(aggregate.document.publishState).toBe('partial');
  });

  it('groups month sections in chronological order', () => {
    const aggregate = buildTimeMachineYearAggregate(1969, [
      {
        eventId: 'moon',
        year: 1969,
        title: 'Moon landing',
        summary: 'Apollo 11 lands on the Moon.',
        categories: ['exploration'],
        date: { month: 7, day: 20 },
        imageUrl: 'https://example.com/moon.jpg',
      },
      {
        eventId: 'network',
        year: 1969,
        title: 'ARPANET',
        summary: 'ARPANET sends its first message.',
        categories: ['science-discovery'],
        date: { month: 10, day: 29 },
      },
    ]);

    const sections = buildTimeMachineSections(
      aggregate.events,
      aggregate.document.highlightEventIds
    );

    expect(sections.map((section) => section.month)).toEqual([7, 10]);
    expect(sections[0]?.events[0]?.id).toBe('moon');
    expect(sections[1]?.events[0]?.id).toBe('network');
  });

  it('creates placeholder documents for empty years', () => {
    const emptyDoc = createEmptyTimeMachineYearDocument(1801, '2026-04-01T00:00:00.000Z');

    expect(emptyDoc.year).toBe(1801);
    expect(emptyDoc.eventCount).toBe(0);
    expect(emptyDoc.publishState).toBe('empty');
    expect(emptyDoc.highlightEventIds).toEqual([]);
    expect(emptyDoc.summary.length).toBeGreaterThan(0);
  });

  it('marks well-covered years as strong', () => {
    const aggregate = buildTimeMachineYearAggregate(
      1999,
      Array.from({ length: 12 }, (_, index) => ({
        eventId: `event-${index + 1}`,
        year: 1999,
        title: `Event ${index + 1}`,
        summary: 'A detailed historical summary that provides enough signal.',
        categories: ['politics', index % 2 === 0 ? 'culture' : 'science-discovery'],
        date: {
          month: Math.min(12, index + 1),
          day: 1,
        },
        imageUrl: index === 0 ? 'https://example.com/hero.jpg' : undefined,
        pageCount: 2,
      }))
    );

    expect(aggregate.document.publishState).toBe('strong');
    expect(aggregate.document.qualityScore).toBeGreaterThan(0);
  });
});
