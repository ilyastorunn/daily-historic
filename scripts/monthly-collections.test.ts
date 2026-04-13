import { describe, expect, it } from 'vitest';

import { EVENT_LIBRARY, MONTHLY_COLLECTIONS } from '../constants/events';
import { getMonthlyIAEPackage, getWeeklyFeaturedFromMonthly } from '../services/home';
import { getMonthKey } from '../utils/dates';

describe('monthly collections schema', () => {
  it('ensures each monthly collection has valid featured and event ids', () => {
    expect(MONTHLY_COLLECTIONS).toHaveLength(12);

    const years = new Set(MONTHLY_COLLECTIONS.map((collection) => collection.monthKey.slice(0, 4)));
    const coveredMonths = new Set(MONTHLY_COLLECTIONS.map((collection) => collection.monthKey.slice(5, 7)));
    expect(years.size).toBe(1);
    expect(coveredMonths.size).toBe(12);

    const sourceCountByEvent = new Map(EVENT_LIBRARY.map((event) => [event.id, event.sources.length]));

    for (const collection of MONTHLY_COLLECTIONS) {
      expect(collection.featuredEventIds).toHaveLength(4);
      expect(collection.eventIds.length).toBeGreaterThanOrEqual(8);
      expect(collection.eventIds.length).toBeLessThanOrEqual(12);
      expect(new Set(collection.eventIds).size).toBe(collection.eventIds.length);

      for (const featuredEventId of collection.featuredEventIds) {
        expect(collection.eventIds.includes(featuredEventId)).toBe(true);
      }

      for (const eventId of collection.eventIds) {
        expect(sourceCountByEvent.get(eventId)).toBeGreaterThanOrEqual(2);
      }
    }
  });
});

describe('weekly picks determinism', () => {
  it('returns stable picks for the same week and month', () => {
    const first = getWeeklyFeaturedFromMonthly({
      monthKey: '2026-05',
      weekKey: '2026-19',
      limit: 4,
    });

    const second = getWeeklyFeaturedFromMonthly({
      monthKey: '2026-05',
      weekKey: '2026-19',
      limit: 4,
    });

    expect(first.map((event) => event.id)).toEqual(second.map((event) => event.id));
    expect(first).toHaveLength(4);
  });

  it('returns different ordering for different week keys in the same month', () => {
    const first = getWeeklyFeaturedFromMonthly({
      monthKey: '2026-10',
      weekKey: '2026-41',
      limit: 4,
    });
    const second = getWeeklyFeaturedFromMonthly({
      monthKey: '2026-10',
      weekKey: '2026-42',
      limit: 4,
    });

    expect(first.map((event) => event.id)).not.toEqual(second.map((event) => event.id));
  });
});

describe('month key generation', () => {
  it('builds YYYY-MM month key using provided timezone', () => {
    const key = getMonthKey(new Date('2026-04-30T23:30:00Z'), { timeZone: 'Europe/Istanbul' });
    expect(key).toBe('2026-05');
  });
});

describe('monthly IAE package', () => {
  it('builds an IAE payload compatible with monthly collection metadata', () => {
    const pkg = getMonthlyIAEPackage('2026-12');
    expect(pkg.collectionId).toBe('monthly-2026-12-year-end-defining-moments');
    expect(pkg.eventName.length).toBeGreaterThan(10);
    expect(pkg.deeplink).toContain('/collection/');
  });
});
