import type { FirestoreEventDocument } from '@/types/events';

/**
 * Seed data for Explore page fallbacks
 * Used when services fail to fetch live data
 */

// Story of the Day fallback events (Editor's picks)
export const SOTD_SEED_EVENTS: FirestoreEventDocument[] = [
  {
    eventId: 'apollo-11-moon-landing',
    year: 1969,
    text: 'Apollo 11 astronauts Neil Armstrong and Buzz Aldrin become the first humans to walk on the Moon.',
    summary: "Neil Armstrong's historic first steps on the lunar surface marked humanity's greatest achievement in space exploration.",
    categories: ['science-discovery', 'inventions'],
    era: 'twentieth',
    tags: ['space', 'nasa', 'moon landing'],
    date: { month: 7, day: 20 },
    relatedPages: [
      {
        pageId: 869,
        canonicalTitle: 'Apollo 11',
        displayTitle: 'Apollo 11',
        description: 'First crewed mission to land on the Moon',
        desktopUrl: 'https://en.wikipedia.org/wiki/Apollo_11',
        mobileUrl: 'https://en.m.wikipedia.org/wiki/Apollo_11',
        thumbnails: [
          {
            id: 'apollo-11-thumbnail',
            sourceUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/98/Aldrin_Apollo_11_original.jpg',
            width: 2349,
            height: 3000,
            provider: 'wikimedia',
          },
        ],
      },
    ],
  },
  {
    eventId: 'fall-of-berlin-wall',
    year: 1989,
    text: 'The Berlin Wall falls, marking the beginning of the end of the Cold War.',
    summary: 'Thousands of jubilant Germans from both sides dismantled the wall that had divided Berlin for 28 years.',
    categories: ['politics', 'civil-rights'],
    era: 'twentieth',
    tags: ['cold war', 'germany', 'freedom'],
    date: { month: 11, day: 9 },
    relatedPages: [
      {
        pageId: 3854,
        canonicalTitle: 'Berlin_Wall',
        displayTitle: 'Berlin Wall',
        description: 'Barrier that divided Berlin from 1961 to 1989',
        desktopUrl: 'https://en.wikipedia.org/wiki/Berlin_Wall',
        mobileUrl: 'https://en.m.wikipedia.org/wiki/Berlin_Wall',
        thumbnails: [
          {
            id: 'berlin-wall-thumbnail',
            sourceUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Bundesarchiv_Bild_183-1989-1118-028,_Berlin,_Brandenburger_Tor,_%C3%96ffnung.jpg',
            width: 800,
            height: 529,
            provider: 'wikimedia',
          },
        ],
      },
    ],
  },
  {
    eventId: 'womens-suffrage-us',
    year: 1920,
    text: 'The 19th Amendment to the U.S. Constitution is ratified, granting women the right to vote.',
    summary: 'After decades of activism, American women gained the constitutional right to vote in all elections.',
    categories: ['civil-rights', 'politics'],
    era: 'twentieth',
    tags: ['womens rights', 'suffrage', 'democracy'],
    date: { month: 8, day: 26 },
    relatedPages: [
      {
        pageId: 31656,
        canonicalTitle: 'Nineteenth_Amendment_to_the_United_States_Constitution',
        displayTitle: '19th Amendment',
        description: 'Prohibits the denial of voting rights based on sex',
        desktopUrl: 'https://en.wikipedia.org/wiki/Nineteenth_Amendment_to_the_United_States_Constitution',
        mobileUrl: 'https://en.m.wikipedia.org/wiki/Nineteenth_Amendment_to_the_United_States_Constitution',
        thumbnails: [
          {
            id: 'suffrage-thumbnail',
            sourceUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Suffrage_Parade,_New_York_City,_May_6,_1912.jpg',
            width: 1024,
            height: 683,
            provider: 'wikimedia',
          },
        ],
      },
    ],
  },
];

// You Might Be Interested fallback events (Popular classics spanning diverse categories)
export const YMBI_SEED_EVENTS: FirestoreEventDocument[] = [
  {
    eventId: 'declaration-of-independence',
    year: 1776,
    text: 'The Declaration of Independence is adopted by the Continental Congress.',
    summary: 'Thirteen American colonies declared themselves independent from British rule, founding the United States.',
    categories: ['politics'],
    era: 'early-modern',
    tags: ['american revolution', 'independence', 'founding'],
    date: { month: 7, day: 4 },
  },
  {
    eventId: 'first-powered-flight',
    year: 1903,
    text: 'The Wright brothers achieve the first sustained powered flight in Kitty Hawk, North Carolina.',
    summary: 'Orville and Wilbur Wright flew their Wright Flyer for 12 seconds, traveling 120 feet and ushering in the age of aviation.',
    categories: ['inventions', 'science-discovery'],
    era: 'twentieth',
    tags: ['aviation', 'flight', 'innovation'],
    date: { month: 12, day: 17 },
  },
  {
    eventId: 'gutenberg-printing-press',
    year: 1440,
    text: 'Johannes Gutenberg invents the mechanical movable-type printing press.',
    summary: 'The printing press revolutionized the spread of information, making books affordable and accessible across Europe.',
    categories: ['inventions', 'art-culture'],
    era: 'medieval',
    tags: ['printing', 'renaissance', 'books'],
    date: { month: 1, day: 1 },
  },
  {
    eventId: 'penicillin-discovery',
    year: 1928,
    text: 'Alexander Fleming discovers penicillin, the world\'s first antibiotic.',
    summary: 'Fleming\'s accidental discovery of penicillin in mold spores revolutionized medicine and saved millions of lives.',
    categories: ['science-discovery'],
    era: 'twentieth',
    tags: ['medicine', 'antibiotics', 'discovery'],
    date: { month: 9, day: 28 },
  },
  {
    eventId: 'mona-lisa-completion',
    year: 1519,
    text: 'Leonardo da Vinci completes the Mona Lisa.',
    summary: 'Da Vinci finished his masterpiece, which became the world\'s most famous painting and a Renaissance icon.',
    categories: ['art-culture'],
    era: 'early-modern',
    tags: ['art', 'renaissance', 'painting'],
    date: { month: 5, day: 2 },
  },
  {
    eventId: 'great-pyramid-completion',
    year: -2560,
    text: 'The Great Pyramid of Giza is completed for Pharaoh Khufu.',
    summary: 'Ancient Egyptians finished building the last surviving wonder of the ancient world, standing 481 feet tall.',
    categories: ['ancient-civilizations'],
    era: 'ancient',
    tags: ['egypt', 'pyramids', 'architecture'],
    date: { month: 1, day: 1 },
  },
  {
    eventId: 'mount-vesuvius-eruption',
    year: 79,
    text: 'Mount Vesuvius erupts, burying the Roman cities of Pompeii and Herculaneum.',
    summary: 'The catastrophic eruption preserved these cities in volcanic ash, providing an invaluable snapshot of Roman life.',
    categories: ['natural-disasters', 'ancient-civilizations'],
    era: 'ancient',
    tags: ['volcano', 'pompeii', 'disaster'],
    date: { month: 8, day: 24 },
  },
  {
    eventId: 'columbus-americas',
    year: 1492,
    text: 'Christopher Columbus reaches the Americas, initiating European exploration of the New World.',
    summary: 'Columbus landed in the Bahamas, beginning sustained contact between the Old and New Worlds.',
    categories: ['exploration'],
    era: 'early-modern',
    tags: ['exploration', 'americas', 'discovery'],
    date: { month: 10, day: 12 },
  },
];

/**
 * Get a random SOTD seed event
 */
export const getRandomSOTDSeed = (): FirestoreEventDocument => {
  const randomIndex = Math.floor(Math.random() * SOTD_SEED_EVENTS.length);
  return SOTD_SEED_EVENTS[randomIndex];
};

/**
 * Check if an eventId belongs to explore seed data
 */
export const isExploreSeedEventId = (eventId: string): boolean => {
  const allSeedEvents = [...SOTD_SEED_EVENTS, ...YMBI_SEED_EVENTS];
  return allSeedEvents.some((event) => event.eventId === eventId);
};

/**
 * Get explore seed event by ID
 */
export const getExploreSeedEventById = (eventId: string): FirestoreEventDocument | null => {
  const allSeedEvents = [...SOTD_SEED_EVENTS, ...YMBI_SEED_EVENTS];
  return allSeedEvents.find((event) => event.eventId === eventId) ?? null;
};

/**
 * Get YMBI seed events with diversity (at least 3 categories)
 */
export const getYMBISeedEvents = (limit: number = 8): FirestoreEventDocument[] => {
  // Shuffle and return up to limit items
  const shuffled = [...YMBI_SEED_EVENTS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(limit, YMBI_SEED_EVENTS.length));
};
