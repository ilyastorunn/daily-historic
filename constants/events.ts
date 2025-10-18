import type { ImageSource } from 'expo-image';

import { buildWikimediaFileUrl } from '@/utils/wikimedia';

export type EventCategory =
  | 'science'
  | 'culture'
  | 'politics'
  | 'innovation'
  | 'art'
  | 'human-rights';

export type EraSlug =
  | 'ancient'
  | 'renaissance'
  | 'industrial'
  | 'modern'
  | 'contemporary';

type EventSourceLink = {
  label: string;
  url: string;
};

export type EventRecord = {
  id: string;
  year: string;
  date: string;
  title: string;
  summary: string;
  detail: string;
  location: string;
  image: ImageSource;
  categories: EventCategory[];
  eras: EraSlug[];
  whyItMatters?: string;
  sources: EventSourceLink[];
};

export type EventCollection = {
  id: string;
  title: string;
  summary: string;
  image: ImageSource;
  eventIds: string[];
};

export const HERO_EVENT_ID = 'apollo-11-first-footsteps';

export const EVENT_LIBRARY: EventRecord[] = [
  {
    id: HERO_EVENT_ID,
    year: '1969',
    date: '1969-07-20',
    title: 'First footsteps on the Moon',
    summary: "Neil Armstrong's lunar step opens a new era of exploration.",
    detail:
      "Neil Armstrong descends from Apollo 11's Eagle module and becomes the first human to touch the lunar surface, broadcasting the moment to over 600 million viewers at home.",
    location: 'Sea of Tranquility, Moon',
    image: {
      uri: buildWikimediaFileUrl('File:Neil_Armstrong_pose.jpg'),
    },
    categories: ['science', 'innovation'],
    eras: ['modern'],
    whyItMatters:
      'A technological feat that redefined what daily discovery can feel like, embodying our promise of a singular historic moment each day.',
    sources: [
      { label: 'NASA Mission Log', url: 'https://www.nasa.gov/mission_pages/apollo/apollo11.html' },
      {
        label: 'Smithsonian Air & Space',
        url: 'https://airandspace.si.edu/exhibitions/apollo-11-moon-landing',
      },
    ],
  },
  {
    id: 'women-suffrage-usa',
    year: '1920',
    date: '1920-08-26',
    title: 'Votes reach every American woman',
    summary: 'The 19th Amendment is certified, expanding the electorate.',
    detail:
      'U.S. Secretary of State Bainbridge Colby certifies the 19th Amendment, granting women the right to vote nationwide after decades of activism.',
    location: 'Washington, D.C., USA',
    image: {
      uri: buildWikimediaFileUrl('Tennessee ratifies the Nineteenth Amendment.jpg'),
    },
    categories: ['human-rights', 'politics'],
    eras: ['modern'],
    whyItMatters: 'A milestone that underpins today’s conversations around civic equity.',
    sources: [
      {
        label: 'Library of Congress',
        url: 'https://www.loc.gov/item/today-in-history/august-26',
      },
    ],
  },
  {
    id: 'ada-lovelace-analytical',
    year: '1843',
    date: '1843-10-05',
    title: 'Ada Lovelace maps analytic engines',
    summary: 'Lovelace diagrams how machines might process symbols and sound.',
    detail:
      'Ada Lovelace publishes her notes on Charles Babbage’s Analytical Engine, describing algorithmic steps and envisioning creative uses beyond calculation.',
    location: 'London, United Kingdom',
    image: {
      uri: buildWikimediaFileUrl('File:Ada_Lovelace_portrait.jpg'),
    },
    categories: ['innovation', 'science'],
    eras: ['industrial'],
    sources: [
      {
        label: 'Science Museum Group',
        url: 'https://www.sciencemuseum.org.uk/objects-and-stories/ada-lovelace',
      },
      {
        label: 'Stanford Encyclopedia of Philosophy',
        url: 'https://plato.stanford.edu/entries/lovelace/',
      },
    ],
  },
  {
    id: 'harlem-renaissance-jazz',
    year: '1925',
    date: '1925-03-01',
    title: 'Jazz pours from Harlem brownstones',
    summary: 'The Harlem Renaissance shapes modern culture with nightly improvisation.',
    detail:
      'Speakeasies and theaters across Harlem popularize jazz legends like Duke Ellington, broadcasting a transformative sound to the entire country.',
    location: 'Harlem, New York City, USA',
    image: {
      uri: buildWikimediaFileUrl('Cotton Club interior, 1936 (LOC).jpg'),
    },
    categories: ['culture', 'art'],
    eras: ['modern'],
    sources: [
      { label: 'Schomburg Center', url: 'https://www.nypl.org/locations/schomburg' },
      {
        label: 'National Museum of African American History and Culture',
        url: 'https://nmaahc.si.edu/explore/stories/harlem-renaissance',
      },
    ],
  },
  {
    id: 'rosetta-stone-decode',
    year: '1822',
    date: '1822-09-27',
    title: 'Champollion unseals the Rosetta Stone',
    summary: 'Hieroglyphs speak again thanks to a trilingual key.',
    detail:
      'Jean-François Champollion announces that he has decoded Egyptian hieroglyphs by comparing Greek and Demotic scripts, giving voice to millennia of inscriptions.',
    location: 'Paris, France',
    image: {
      uri: buildWikimediaFileUrl('File:Rosetta_Stone.JPG'),
    },
    categories: ['culture', 'science'],
    eras: ['modern'],
    sources: [
      {
        label: 'The British Museum',
        url: 'https://www.britishmuseum.org/collection/object/Y_EA24',
      },
    ],
  },
  {
    id: 'women-in-stem-week',
    year: '1993',
    date: '1993-06-09',
    title: 'Sally Ride launches science camps',
    summary: 'The first American woman in space opens programs nurturing discovery.',
    detail:
      'Sally Ride Science starts camps to sustain girls’ curiosity in STEM, extending the impact of Ride’s 1983 mission to a new generation.',
    location: 'San Diego, USA',
    image: {
      uri: buildWikimediaFileUrl('File:Sally_Ride_in_1984.jpg'),
    },
    categories: ['science', 'human-rights'],
    eras: ['contemporary'],
    sources: [
      { label: 'Sally Ride Science', url: 'https://sallyridescience.ucsd.edu/about/' },
    ],
  },
];

export const EVENT_COLLECTIONS: EventCollection[] = [
  {
    id: 'women-in-stem-week',
    title: 'Women in STEM Week',
    summary: 'A curated loop of pioneers who widened the lab doors.',
    image: {
      uri: buildWikimediaFileUrl('File:Marie_Curie_c1920.jpg'),
    },
    eventIds: ['women-suffrage-usa', 'ada-lovelace-analytical', 'women-in-stem-week'],
  },
  {
    id: 'voices-of-change',
    title: 'Voices of Change',
    summary: 'Civic acts that reshaped the social contract.',
    image: {
      uri: buildWikimediaFileUrl('March on Washington (August 28, 1963).jpg'),
    },
    eventIds: ['women-suffrage-usa'],
  },
];

export const QUICK_FILTERS: { id: EventCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'science', label: 'Science' },
  { id: 'culture', label: 'Culture' },
  { id: 'human-rights', label: 'Human Rights' },
  { id: 'innovation', label: 'Innovation' },
  { id: 'art', label: 'Art & Design' },
  { id: 'politics', label: 'Civic' },
];

export const getEventById = (id: string) => EVENT_LIBRARY.find((event) => event.id === id);

export const heroEvent = EVENT_LIBRARY.find((event) => event.id === HERO_EVENT_ID) ?? EVENT_LIBRARY[0];
