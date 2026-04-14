import { describe, expect, it } from 'vitest';

import { normalizeEvent } from '../wikimedia-client';
import { toTimeMachineDateISO } from '../../../utils/time-machine';
import type { RawOnThisDayEvent } from '../types';

const baseRawEvent = (year: number): RawOnThisDayEvent => ({
  year,
  text: 'Test event',
  type: 'selected',
  pages: [
    {
      type: 'standard',
      title: 'Julius Caesar',
      displaytitle: 'Julius Caesar',
      pageid: 123,
      namespace: { id: 0, text: '' },
      titles: {
        canonical: 'Julius_Caesar',
        normalized: 'Julius Caesar',
        display: 'Julius Caesar',
      },
      content_urls: {
        desktop: {
          page: 'https://en.wikipedia.org/wiki/Julius_Caesar',
          revisions: 'https://en.wikipedia.org/wiki/Julius_Caesar?action=history',
          edit: 'https://en.wikipedia.org/wiki/Julius_Caesar?action=edit',
          talk: 'https://en.wikipedia.org/wiki/Talk:Julius_Caesar',
        },
        mobile: {
          page: 'https://en.m.wikipedia.org/wiki/Julius_Caesar',
          revisions: 'https://en.m.wikipedia.org/wiki/Julius_Caesar?action=history',
          edit: 'https://en.m.wikipedia.org/wiki/Julius_Caesar?action=edit',
          talk: 'https://en.m.wikipedia.org/wiki/Talk:Julius_Caesar',
        },
      },
      description: 'Roman general',
      extract: 'Roman general and statesman',
    },
  ],
});

describe('dateISO formatting', () => {
  it('formats BCE years as ISO-like signed year', () => {
    expect(toTimeMachineDateISO(-44, 3, 15)).toBe('-0044-03-15');
  });

  it('keeps CE formatting unchanged', () => {
    expect(toTimeMachineDateISO(1969, 1, 28)).toBe('1969-01-28');
  });

  it('normalizes on-this-day events with BCE dateISO', () => {
    const normalized = normalizeEvent(baseRawEvent(-44), {
      month: 3,
      day: 15,
      capturedAt: '2026-01-01T00:00:00.000Z',
      rawType: 'selected',
      cacheKey: 'onthisday:selected:03-15',
    });

    expect(normalized.dateISO).toBe('-0044-03-15');
  });
});
