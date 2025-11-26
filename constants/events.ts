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
      'Sally Ride Science starts camps to sustain girls' curiosity in STEM, extending the impact of Ride's 1983 mission to a new generation.',
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
  {
    id: 'd-day-normandy-landing',
    year: '1944',
    date: '1944-06-06',
    title: 'D-Day: Allied forces storm Normandy beaches',
    summary: 'Operation Overlord marks the beginning of the end for Nazi Germany.',
    detail:
      'Over 150,000 Allied troops land on five beaches in Normandy, France, launching the largest amphibious invasion in history and opening a critical Western Front against Nazi occupation.',
    location: 'Normandy, France',
    image: {
      uri: buildWikimediaFileUrl('File:Into_the_Jaws_of_Death_23-0455M_edit.jpg'),
    },
    categories: ['politics'],
    eras: ['modern'],
    sources: [
      { label: 'National WWII Museum', url: 'https://www.nationalww2museum.org/war/topics/d-day' },
      { label: 'History.com', url: 'https://www.history.com/topics/world-war-ii/d-day' },
    ],
  },
  {
    id: 'pearl-harbor-attack',
    year: '1941',
    date: '1941-12-07',
    title: 'Attack on Pearl Harbor brings US into WWII',
    summary: 'Japan's surprise strike transforms American isolationism into total war.',
    detail:
      'Japanese aircraft attack the US Pacific Fleet at Pearl Harbor, Hawaii, killing over 2,400 Americans and sinking battleships. The next day, President Roosevelt declares war.',
    location: 'Pearl Harbor, Hawaii, USA',
    image: {
      uri: buildWikimediaFileUrl('File:The_USS_Arizona_(BB-39)_burning_after_the_Japanese_attack_on_Pearl_Harbor_-_NARA_195617_-_Edit.jpg'),
    },
    categories: ['politics'],
    eras: ['modern'],
    sources: [
      { label: 'Pearl Harbor National Memorial', url: 'https://www.nps.gov/perl/index.htm' },
      { label: 'National Archives', url: 'https://www.archives.gov/publications/prologue/2001/winter/crafting-day-of-infamy-speech' },
    ],
  },
  {
    id: 'ww1-armistice',
    year: '1918',
    date: '1918-11-11',
    title: 'WWI Armistice ends "War to End All Wars"',
    summary: 'The guns fall silent on the Western Front at the eleventh hour.',
    detail:
      'Germany signs an armistice agreement with the Allies, ending four years of unprecedented carnage that claimed over 17 million lives and reshaped the modern world.',
    location: 'Compiègne, France',
    image: {
      uri: buildWikimediaFileUrl('File:Ww1_armistice.jpg'),
    },
    categories: ['politics'],
    eras: ['modern'],
    sources: [
      { label: 'Imperial War Museums', url: 'https://www.iwm.org.uk/history/the-armistice' },
      { label: 'Library of Congress', url: 'https://www.loc.gov/collections/world-war-i-rotogravures/articles-and-essays/events/armistice/' },
    ],
  },
  {
    id: 'hiroshima-atomic-bomb',
    year: '1945',
    date: '1945-08-06',
    title: 'First atomic bomb dropped on Hiroshima',
    summary: 'Nuclear age dawns with devastating force, reshaping warfare forever.',
    detail:
      'The B-29 bomber Enola Gay drops "Little Boy" on Hiroshima, instantly killing 70,000 and ushering in the atomic age. Japan surrenders nine days later, ending WWII.',
    location: 'Hiroshima, Japan',
    image: {
      uri: buildWikimediaFileUrl('File:Atomic_bombing_of_Japan.jpg'),
    },
    categories: ['politics', 'science'],
    eras: ['modern'],
    sources: [
      { label: 'Atomic Heritage Foundation', url: 'https://www.atomicheritage.org/history/bombing-hiroshima-and-nagasaki-1945' },
      { label: 'Hiroshima Peace Memorial Museum', url: 'https://hpmmuseum.jp/?lang=eng' },
    ],
  },
  {
    id: 'battle-of-stalingrad',
    year: '1943',
    date: '1943-02-02',
    title: 'Battle of Stalingrad turns tide against Nazi Germany',
    summary: 'Soviet victory marks the beginning of Hitler's retreat.',
    detail:
      'After months of brutal urban combat, the German Sixth Army surrenders at Stalingrad. The decisive Soviet victory shifts momentum on the Eastern Front and dooms the Nazi invasion.',
    location: 'Stalingrad (Volgograd), Soviet Union',
    image: {
      uri: buildWikimediaFileUrl('File:RIAN_archive_602161_Center_of_Stalingrad_after_liberation.jpg'),
    },
    categories: ['politics'],
    eras: ['modern'],
    sources: [
      { label: 'History.com', url: 'https://www.history.com/topics/world-war-ii/battle-of-stalingrad' },
      { label: 'Britannica', url: 'https://www.britannica.com/event/Battle-of-Stalingrad' },
    ],
  },
  {
    id: 'treaty-of-versailles',
    year: '1919',
    date: '1919-06-28',
    title: 'Treaty of Versailles signed after WWI',
    summary: 'Peace terms sow seeds of future conflict in Europe.',
    detail:
      'The Treaty of Versailles officially ends WWI, imposing harsh reparations on Germany and redrawing European borders. Its punitive terms contribute to economic collapse and the rise of extremism.',
    location: 'Versailles, France',
    image: {
      uri: buildWikimediaFileUrl('File:William_Orpen_-_The_Signing_of_Peace_in_the_Hall_of_Mirrors.jpg'),
    },
    categories: ['politics'],
    eras: ['modern'],
    sources: [
      { label: 'National Archives', url: 'https://www.archives.gov/milestone-documents/treaty-of-versailles' },
      { label: 'Britannica', url: 'https://www.britannica.com/event/Treaty-of-Versailles-1919' },
    ],
  },
  {
    id: 'cuban-missile-crisis',
    year: '1962',
    date: '1962-10-28',
    title: 'Cuban Missile Crisis brings world to nuclear brink',
    summary: 'Thirteen days of tension end with Soviet withdrawal from Cuba.',
    detail:
      'The standoff over Soviet missiles in Cuba brings the US and USSR closest to nuclear war. President Kennedy's naval blockade and Khrushchev's decision to withdraw avert catastrophe.',
    location: 'Cuba and Washington, D.C.',
    image: {
      uri: buildWikimediaFileUrl('File:Cuban_Missile_Crisis_Quarantine_Map.jpg'),
    },
    categories: ['politics'],
    eras: ['modern'],
    sources: [
      { label: 'JFK Library', url: 'https://www.jfklibrary.org/learn/about-jfk/jfk-in-history/cuban-missile-crisis' },
      { label: 'National Security Archive', url: 'https://nsarchive.gwu.edu/briefing-book/cuba-nuclear-vault/2022-10-27/cuban-missile-crisis-60-years' },
    ],
  },
  {
    id: 'marie-curie-nobel',
    year: '1903',
    date: '1903-12-10',
    title: 'Marie Curie wins Nobel Prize in Physics',
    summary: 'First woman Nobel laureate breaks barriers in science.',
    detail:
      'Marie Curie shares the Nobel Prize in Physics with Pierre Curie and Henri Becquerel for their work on radioactivity, becoming the first woman to receive a Nobel Prize.',
    location: 'Stockholm, Sweden',
    image: {
      uri: buildWikimediaFileUrl('File:Marie_Curie_c1920.jpg'),
    },
    categories: ['science', 'human-rights'],
    eras: ['modern'],
    sources: [
      { label: 'Nobel Prize', url: 'https://www.nobelprize.org/prizes/physics/1903/marie-curie/biographical/' },
      { label: 'American Institute of Physics', url: 'https://www.aip.org/history-programs/niels-bohr-library/ex hibitions/curie' },
    ],
  },
  {
    id: 'rosa-parks-bus-boycott',
    year: '1955',
    date: '1955-12-01',
    title: 'Rosa Parks sparks Montgomery Bus Boycott',
    summary: 'Refusal to give up seat ignites civil rights movement.',
    detail:
      'Rosa Parks refuses to surrender her bus seat to a white passenger in Montgomery, Alabama. Her arrest sparks a 381-day boycott that catapults Martin Luther King Jr. to prominence and desegregates public transit.',
    location: 'Montgomery, Alabama, USA',
    image: {
      uri: buildWikimediaFileUrl('File:Rosa_Parks_Booking.jpg'),
    },
    categories: ['human-rights', 'politics'],
    eras: ['modern'],
    sources: [
      { label: 'National Archives', url: 'https://www.archives.gov/education/lessons/rosa-parks' },
      { label: 'Rosa Parks Museum', url: 'https://www.troy.edu/rosaparks/' },
    ],
  },
  {
    id: 'amelia-earhart-atlantic',
    year: '1932',
    date: '1932-05-20',
    title: 'Amelia Earhart flies solo across Atlantic',
    summary: 'First woman to complete the perilous transatlantic solo flight.',
    detail:
      'Amelia Earhart lands in Northern Ireland after flying solo from Newfoundland, becoming the first woman to fly solo across the Atlantic Ocean and cementing her place as an aviation pioneer.',
    location: 'Culmore, Northern Ireland',
    image: {
      uri: buildWikimediaFileUrl('File:Amelia_Earhart_standing_under_nose_of_her_Lockheed_Model_10-E_Electra.jpg'),
    },
    categories: ['innovation', 'human-rights'],
    eras: ['modern'],
    sources: [
      { label: 'Smithsonian Air & Space', url: 'https://airandspace.si.edu/explore-and-learn/topics/women-in-aviation/earhart.cfm' },
      { label: 'Amelia Earhart Museum', url: 'https://www.ameliaearhartmuseum.org/' },
    ],
  },
  {
    id: 'florence-nightingale-nursing',
    year: '1854',
    date: '1854-11-05',
    title: 'Florence Nightingale establishes modern nursing',
    summary: 'The "Lady with the Lamp" transforms military medicine.',
    detail:
      'Florence Nightingale arrives in Crimea with 38 nurses, introducing sanitary reforms that dramatically reduce death rates. Her work establishes nursing as a respected profession.',
    location: 'Scutari (Üsküdar), Ottoman Empire',
    image: {
      uri: buildWikimediaFileUrl('File:Florence_Nightingale_(H_Hering_NPG_x82368).jpg'),
    },
    categories: ['science', 'human-rights'],
    eras: ['industrial'],
    sources: [
      { label: 'Florence Nightingale Museum', url: 'https://www.florence-nightingale.co.uk/' },
      { label: 'British Library', url: 'https://www.bl.uk/people/florence-nightingale' },
    ],
  },
  {
    id: 'harriet-tubman-underground',
    year: '1850',
    date: '1850-01-01',
    title: 'Harriet Tubman leads hundreds to freedom',
    summary: 'The "Moses of her people" risks everything to free the enslaved.',
    detail:
      'Harriet Tubman makes over a dozen dangerous trips into slave states via the Underground Railroad, personally leading approximately 70 enslaved people to freedom and never losing a passenger.',
    location: 'Eastern Shore, Maryland to Northern States',
    image: {
      uri: buildWikimediaFileUrl('File:Harriet_Tubman_by_Squyer,_NPG,_c1885.jpg'),
    },
    categories: ['human-rights'],
    eras: ['industrial'],
    sources: [
      { label: 'National Park Service', url: 'https://www.nps.gov/people/harriet-tubman.htm' },
      { label: 'Harriet Tubman Underground Railroad National Historical Park', url: 'https://www.nps.gov/hatu/index.htm' },
    ],
  },
  {
    id: 'malala-nobel-peace',
    year: '2014',
    date: '2014-10-10',
    title: 'Malala Yousafzai wins Nobel Peace Prize',
    summary: 'Youngest-ever Nobel laureate champions education for all.',
    detail:
      'At 17, Malala becomes the youngest Nobel Prize winner, recognized for her courageous advocacy for girls' education after surviving a Taliban assassination attempt in Pakistan.',
    location: 'Oslo, Norway',
    image: {
      uri: buildWikimediaFileUrl('File:Malala_Yousafzai_at_Girl_Summit_2014.jpg'),
    },
    categories: ['human-rights'],
    eras: ['contemporary'],
    sources: [
      { label: 'Nobel Prize', url: 'https://www.nobelprize.org/prizes/peace/2014/yousafzai/facts/' },
      { label: 'Malala Fund', url: 'https://malala.org/' },
    ],
  },
  {
    id: 'emmeline-pankhurst-suffragette',
    year: '1903',
    date: '1903-10-10',
    title: 'Emmeline Pankhurst founds Suffragette Movement',
    summary: 'Militant tactics energize the fight for women's votes.',
    detail:
      'Emmeline Pankhurst founds the Women's Social and Political Union in Manchester, adopting the motto "Deeds not Words" and launching militant tactics that accelerate the suffrage movement.',
    location: 'Manchester, United Kingdom',
    image: {
      uri: buildWikimediaFileUrl('File:Emmeline_Pankhurst_addresses_crowd.jpg'),
    },
    categories: ['human-rights', 'politics'],
    eras: ['modern'],
    sources: [
      { label: 'UK Parliament', url: 'https://www.parliament.uk/about/living-heritage/transformingsociety/electionsvoting/womenvote/overview/thepankhursts/' },
      { label: 'The National Archives UK', url: 'https://www.nationalarchives.gov.uk/education/resources/suffragettes-on-file/' },
    ],
  },
];

export const EVENT_COLLECTIONS: EventCollection[] = [
  {
    id: 'women-in-stem-week',
    title: 'Women Who Changed the World',
    summary: 'Pioneers who shattered glass ceilings across science, politics, and human rights.',
    image: {
      uri: buildWikimediaFileUrl('File:Marie_Curie_c1920.jpg'),
    },
    eventIds: [
      'marie-curie-nobel',
      'ada-lovelace-analytical',
      'women-in-stem-week',
      'florence-nightingale-nursing',
      'amelia-earhart-atlantic',
      'malala-nobel-peace',
    ],
  },
  {
    id: 'voices-of-change',
    title: 'Voices of Change',
    summary: 'Courageous acts that redefined freedom, equality, and justice.',
    image: {
      uri: buildWikimediaFileUrl('File:March_on_Washington_for_Jobs_and_Freedom,_Martin_Luther_King,_Jr._and_Joachim_Prinz_1963.jpg'),
    },
    eventIds: [
      'rosa-parks-bus-boycott',
      'women-suffrage-usa',
      'harriet-tubman-underground',
      'emmeline-pankhurst-suffragette',
      'malala-nobel-peace',
    ],
  },
  {
    id: 'world-wars-defining-moments',
    title: 'World Wars: Defining Moments',
    summary: 'Turning points that shaped the 20th century through conflict and resolution.',
    image: {
      uri: buildWikimediaFileUrl('File:Into_the_Jaws_of_Death_23-0455M_edit.jpg'),
    },
    eventIds: [
      'd-day-normandy-landing',
      'pearl-harbor-attack',
      'ww1-armistice',
      'hiroshima-atomic-bomb',
      'battle-of-stalingrad',
      'treaty-of-versailles',
      'cuban-missile-crisis',
    ],
  },
  {
    id: 'space-race',
    title: 'Sprint to the Stars',
    summary: 'Cold War rivalries that pushed human ingenuity beyond Earth.',
    image: {
      uri: buildWikimediaFileUrl('File:Apollo_11_Saturn_V_lifting_off_on_July_16,_1969.jpg'),
    },
    eventIds: ['apollo-11-first-footsteps'], // Will expand with space exploration events in Phase 2B
  },
  {
    id: 'ancient-innovations',
    title: 'Ancient Inventions',
    summary: 'Engineering leaps that shaped early civilizations.',
    image: {
      uri: buildWikimediaFileUrl('File:NAMA_Machine_d%27Anticyth%C3%A8re_1.jpg'),
    },
    eventIds: ['rosetta-stone-decode'], // Will expand with ancient events in Phase 2B
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
