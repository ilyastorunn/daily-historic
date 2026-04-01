import { describe, expect, it } from 'vitest';

import { getPreferredEventTitle, selectPreferredRelatedPage } from './event-primary-page';

describe('event primary page selection', () => {
  it('avoids date-like titles and prefers event pages', () => {
    const page = selectPreferredRelatedPage(
      [
        {
          pageId: 1,
          canonicalTitle: 'April 5',
          displayTitle: 'April 5',
          desktopUrl: 'https://example.com/april-5',
          mobileUrl: 'https://example.com/april-5',
          thumbnails: [],
        },
        {
          pageId: 2,
          canonicalTitle: 'Quito',
          displayTitle: 'Quito',
          description: 'Capital city of Ecuador',
          desktopUrl: 'https://example.com/quito',
          mobileUrl: 'https://example.com/quito',
          thumbnails: [],
          selectedMedia: {
            id: 'm1',
            sourceUrl: 'https://example.com/quito.jpg',
          },
        },
        {
          pageId: 3,
          canonicalTitle: 'Vienna Convention on Diplomatic Relations',
          displayTitle: 'Vienna Convention on Diplomatic Relations',
          description: 'International treaty',
          desktopUrl: 'https://example.com/vienna',
          mobileUrl: 'https://example.com/vienna',
          thumbnails: [],
          selectedMedia: {
            id: 'm2',
            sourceUrl: 'https://example.com/vienna.jpg',
          },
        },
      ],
      'Ecuadorian police raid the Mexican embassy in Quito in order to arrest former vice-president Jorge Glas.'
    );

    expect(page?.displayTitle).toBe('Vienna Convention on Diplomatic Relations');
  });

  it('falls back to a summary headline when pages are too generic', () => {
    const title = getPreferredEventTitle(
      [
        {
          pageId: 1,
          canonicalTitle: 'Quito',
          displayTitle: 'Quito',
          description: 'Capital city of Ecuador',
          desktopUrl: 'https://example.com/quito',
          mobileUrl: 'https://example.com/quito',
          thumbnails: [],
        },
        {
          pageId: 2,
          canonicalTitle: 'Ecuador',
          displayTitle: 'Ecuador',
          description: 'Country in South America',
          desktopUrl: 'https://example.com/ecuador',
          mobileUrl: 'https://example.com/ecuador',
          thumbnails: [],
        },
      ],
      'Ecuadorian police raid the Mexican embassy in Quito in order to arrest former vice-president Jorge Glas.'
    );

    expect(title.startsWith('Ecuadorian police raid the Mexican embassy in Quito')).toBe(true);
  });
});
