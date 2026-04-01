import { describe, expect, it } from 'vitest';

import {
  normalizeYearPageEvent,
  parseYearPageEvents,
  type YearPagePayload,
} from './ingest/wikimedia-year-client';

const YEAR_WIKITEXT = `
== Events ==
=== January ===
* 17 – [[Boris Yeltsin]] becomes the first directly elected [[President of Russia]].
* [[January 20]] – The [[Baltic states]] hold mass demonstrations.
=== February ===
* 3–4 – [[Iraqi forces]] attack [[Khafji]] during the [[Gulf War]].
== Births ==
* [[Example Person]]
`.trim();

describe('wikimedia year page parsing', () => {
  it('extracts month/day pairs from the events section only', () => {
    const events = parseYearPageEvents(YEAR_WIKITEXT, 1991);

    expect(events).toHaveLength(3);
    expect(events.map((event) => [event.month, event.day])).toEqual([
      [1, 17],
      [1, 20],
      [2, 3],
    ]);
    expect(events[2]?.qualityFlags).toContain('date-range');
  });

  it('normalizes parsed year events into content records', () => {
    const parsed = parseYearPageEvents(YEAR_WIKITEXT, 1991)[0];
    const payload: YearPagePayload = {
      year: 1991,
      pageTitle: '1991',
      revisionId: 1,
      wikitext: YEAR_WIKITEXT,
      capturedAt: '2026-04-01T00:00:00.000Z',
      sourceKey: 'year-page:1991',
    };

    const pageMap = new Map([
      [
        'Boris Yeltsin',
        {
          pageId: 1,
          canonicalTitle: 'Boris Yeltsin',
          displayTitle: 'Boris Yeltsin',
          normalizedTitle: 'Boris Yeltsin',
          extract: 'President of Russia.',
          desktopUrl: 'https://en.wikipedia.org/wiki/Boris_Yeltsin',
          mobileUrl: 'https://en.wikipedia.org/wiki/Boris_Yeltsin',
          thumbnails: [],
        },
      ],
      [
        'President of Russia',
        {
          pageId: 2,
          canonicalTitle: 'President of Russia',
          displayTitle: 'President of Russia',
          normalizedTitle: 'President of Russia',
          extract: 'Head of state.',
          desktopUrl: 'https://en.wikipedia.org/wiki/President_of_Russia',
          mobileUrl: 'https://en.wikipedia.org/wiki/President_of_Russia',
          thumbnails: [],
        },
      ],
    ]);

    const normalized = normalizeYearPageEvent(parsed, payload, pageMap);

    expect(normalized).not.toBeNull();
    expect(normalized?.canonicalKey).toBe('1991:01:17:boris-yeltsin');
    expect(normalized?.timeMachine.eligible).toBe(true);
    expect(normalized?.timeMachine.sourceType).toBe('wikipedia-year-page');
    expect(normalized?.dateISO).toBe('1991-01-17');
  });
});
