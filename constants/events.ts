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
  {
    id: 'magellan-circumnavigation',
    year: '1522',
    date: '1522-09-06',
    title: 'Magellan's expedition circumnavigates globe',
    summary: 'First voyage around the world proves Earth's roundness.',
    detail:
      'The Victoria returns to Spain, completing the first circumnavigation of Earth. Though Magellan died in the Philippines, his expedition proves the world is round and opens new trade routes.',
    location: 'Seville, Spain',
    image: {
      uri: buildWikimediaFileUrl('File:Magellan_Elcano_Circumnavigation-en.svg'),
    },
    categories: ['innovation'],
    eras: ['renaissance'],
    sources: [
      { label: 'Britannica', url: 'https://www.britannica.com/biography/Ferdinand-Magellan' },
      { label: 'National Geographic', url: 'https://www.nationalgeographic.org/encyclopedia/magellan/' },
    ],
  },
  {
    id: 'lewis-clark-expedition',
    year: '1805',
    date: '1805-11-15',
    title: 'Lewis & Clark reach Pacific Ocean',
    summary: 'Corps of Discovery opens the American West.',
    detail:
      'After 18 months of arduous travel, the Lewis and Clark Expedition reaches the Pacific coast, mapping unknown territory and establishing American claims to the western frontier.',
    location: 'Pacific Coast, Oregon',
    image: {
      uri: buildWikimediaFileUrl('File:Lewis_and_clark-expedition.jpg'),
    },
    categories: ['innovation', 'politics'],
    eras: ['industrial'],
    sources: [
      { label: 'National Park Service', url: 'https://www.nps.gov/lecl/index.htm' },
      { label: 'Lewis & Clark Trail Heritage Foundation', url: 'https://lewisandclark.org/' },
    ],
  },
  {
    id: 'amundsen-south-pole',
    year: '1911',
    date: '1911-12-14',
    title: 'Roald Amundsen reaches South Pole',
    summary: 'Norwegian explorer wins race to Earth's southernmost point.',
    detail:
      'Roald Amundsen and his team become the first humans to reach the geographic South Pole, beating Robert Scott's British expedition by 34 days in the heroic age of Antarctic exploration.',
    location: 'South Pole, Antarctica',
    image: {
      uri: buildWikimediaFileUrl('File:Amundsen_Expedition_at_South_Pole.jpg'),
    },
    categories: ['innovation'],
    eras: ['modern'],
    sources: [
      { label: 'South Pole Station', url: 'https://www.nsf.gov/geo/opp/support/southp.jsp' },
      { label: 'Polar Museum', url: 'https://en.uit.no/tmu' },
    ],
  },
  {
    id: 'hillary-everest',
    year: '1953',
    date: '1953-05-29',
    title: 'Hillary & Tenzing summit Everest',
    summary: 'First confirmed ascent of world's highest peak.',
    detail:
      'Edmund Hillary and Tenzing Norgay reach the 29,029-foot summit of Mount Everest, conquering the world's highest mountain after decades of failed attempts.',
    location: 'Mount Everest, Nepal-Tibet border',
    image: {
      uri: buildWikimediaFileUrl('File:Tenzing_Norgay_and_Edmund_Hillary.jpg'),
    },
    categories: ['innovation'],
    eras: ['modern'],
    sources: [
      { label: 'Royal Geographical Society', url: 'https://www.rgs.org/in-the-field/in-the-field-conservation/mount-everest/' },
      { label: 'National Geographic', url: 'https://www.nationalgeographic.com/adventure/article/everest' },
    ],
  },
  {
    id: 'cook-pacific-voyage',
    year: '1770',
    date: '1770-04-29',
    title: 'Captain Cook maps Pacific Ocean',
    summary: 'British navigator charts Australia and New Zealand.',
    detail:
      'Captain James Cook lands at Botany Bay, Australia, during his first Pacific voyage. His meticulous charts and observations transform European knowledge of the Southern Hemisphere.',
    location: 'Botany Bay, Australia',
    image: {
      uri: buildWikimediaFileUrl('File:Captain_James_Cook,_oil_on_canvas_by_Nathaniel_Dance-Holland.jpg'),
    },
    categories: ['innovation'],
    eras: ['industrial'],
    sources: [
      { label: 'British Library', url: 'https://www.bl.uk/people/captain-james-cook' },
      { label: 'National Maritime Museum', url: 'https://www.rmg.co.uk/stories/topics/captain-james-cook' },
    ],
  },
  {
    id: 'shackleton-endurance',
    year: '1916',
    date: '1916-08-30',
    title: 'Shackleton's epic Antarctic survival',
    summary: 'All crew saved after ship crushed by ice.',
    detail:
      'Ernest Shackleton completes one of history's greatest survival stories, rescuing his entire crew after the Endurance was crushed by Antarctic ice, enduring 22 months of extreme conditions.',
    location: 'Elephant Island, Antarctica',
    image: {
      uri: buildWikimediaFileUrl('File:Endurance_trapped_in_pack_ice.jpg'),
    },
    categories: ['innovation'],
    eras: ['modern'],
    sources: [
      { label: 'Scott Polar Research Institute', url: 'https://www.spri.cam.ac.uk/' },
      { label: 'Royal Geographical Society', url: 'https://www.rgs.org/CMSPages/GetFile.aspx?nodeguid=a1b1b1c1' },
    ],
  },
  {
    id: 'salk-polio-vaccine',
    year: '1955',
    date: '1955-04-12',
    title: 'Jonas Salk develops polio vaccine',
    summary: 'Vaccine eradicates one of history's most feared diseases.',
    detail:
      'Jonas Salk announces the successful trial of his polio vaccine, protecting millions of children from paralysis and death. He refuses to patent it, saying "Could you patent the sun?"',
    location: 'Pittsburgh, Pennsylvania, USA',
    image: {
      uri: buildWikimediaFileUrl('File:Jonas_Salk_seated.jpg'),
    },
    categories: ['science'],
    eras: ['modern'],
    sources: [
      { label: 'Salk Institute', url: 'https://www.salk.edu/about/history-of-salk/jonas-salk/' },
      { label: 'CDC', url: 'https://www.cdc.gov/polio/what-is-polio/polio-us.html' },
    ],
  },
  {
    id: 'dna-structure-discovery',
    year: '1953',
    date: '1953-04-25',
    title: 'Watson & Crick discover DNA structure',
    summary: 'Double helix unlocks the secret of life.',
    detail:
      'James Watson and Francis Crick publish their model of DNA's double helix structure in Nature, revolutionizing biology and launching the era of molecular genetics.',
    location: 'Cambridge, United Kingdom',
    image: {
      uri: buildWikimediaFileUrl('File:James_Watson_Francis_Crick_1953.jpg'),
    },
    categories: ['science'],
    eras: ['modern'],
    sources: [
      { label: 'Nature Journal', url: 'https://www.nature.com/articles/171737a0' },
      { label: 'Nobel Prize', url: 'https://www.nobelprize.org/prizes/medicine/1962/summary/' },
    ],
  },
  {
    id: 'first-heart-transplant',
    year: '1967',
    date: '1967-12-03',
    title: 'First successful human heart transplant',
    summary: 'Christiaan Barnard pioneers cardiac surgery.',
    detail:
      'South African surgeon Christiaan Barnard performs the first successful human-to-human heart transplant, opening a new frontier in organ transplantation and extending countless lives.',
    location: 'Cape Town, South Africa',
    image: {
      uri: buildWikimediaFileUrl('File:Christiaan_Barnard_(1968).jpg'),
    },
    categories: ['science'],
    eras: ['modern'],
    sources: [
      { label: 'American Heart Association', url: 'https://www.heart.org/en/health-topics/heart-transplant' },
      { label: 'SA History', url: 'https://www.sahistory.org.za/article/first-human-heart-transplant' },
    ],
  },
  {
    id: 'xray-discovery',
    year: '1895',
    date: '1895-11-08',
    title: 'Wilhelm Röntgen discovers X-rays',
    summary: 'Mysterious rays revolutionize medical diagnosis.',
    detail:
      'German physicist Wilhelm Röntgen accidentally discovers X-rays while experimenting with cathode rays, creating the first X-ray image of his wife's hand and founding medical imaging.',
    location: 'Würzburg, Germany',
    image: {
      uri: buildWikimediaFileUrl('File:Wilhelm_R%C3%B6ntgen_(1845%E2%80%931923).jpg'),
    },
    categories: ['science'],
    eras: ['industrial'],
    sources: [
      { label: 'Nobel Prize', url: 'https://www.nobelprize.org/prizes/physics/1901/rontgen/facts/' },
      { label: 'American College of Radiology', url: 'https://www.acr.org/About-Us/History-of-Radiology' },
    ],
  },
  {
    id: 'germ-theory-pasteur',
    year: '1861',
    date: '1861-01-01',
    title: 'Louis Pasteur proves germ theory',
    summary: 'Microorganisms identified as cause of disease.',
    detail:
      'Louis Pasteur's experiments definitively prove that microorganisms cause fermentation and disease, revolutionizing medicine and leading to antiseptic practices that save millions.',
    location: 'Paris, France',
    image: {
      uri: buildWikimediaFileUrl('File:Louis_Pasteur.jpg'),
    },
    categories: ['science'],
    eras: ['industrial'],
    sources: [
      { label: 'Pasteur Institute', url: 'https://www.pasteur.fr/en/institut-pasteur/history' },
      { label: 'Science History Institute', url: 'https://www.sciencehistory.org/historical-profile/louis-pasteur' },
    ],
  },
  {
    id: 'anesthesia-first-use',
    year: '1846',
    date: '1846-10-16',
    title: 'First use of anesthesia in surgery',
    summary: 'Ether demonstration ends surgical agony.',
    detail:
      'William T.G. Morton publicly demonstrates ether anesthesia during surgery at Massachusetts General Hospital, transforming medicine by eliminating the horrific pain of operations.',
    location: 'Boston, Massachusetts, USA',
    image: {
      uri: buildWikimediaFileUrl('File:The_first_use_of_ether_in_dental_surgery.jpg'),
    },
    categories: ['science'],
    eras: ['industrial'],
    sources: [
      { label: 'Mass General Hospital', url: 'https://www.massgeneral.org/history/ether-dome' },
      { label: 'Wood Library-Museum', url: 'https://www.woodlibrarymuseum.org/' },
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
    eventIds: ['apollo-11-first-footsteps', 'women-in-stem-week', 'amelia-earhart-atlantic'],
  },
  {
    id: 'ancient-innovations',
    title: 'Ancient Inventions',
    summary: 'Engineering leaps that shaped early civilizations.',
    image: {
      uri: buildWikimediaFileUrl('File:NAMA_Machine_d%27Anticyth%C3%A8re_1.jpg'),
    },
    eventIds: [
      'rosetta-stone-decode',
      'ada-lovelace-analytical',
      'harlem-renaissance-jazz',
    ],
  },
  {
    id: 'age-of-exploration',
    title: 'Age of Exploration',
    summary: 'Intrepid voyages that mapped the unknown and conquered new frontiers.',
    image: {
      uri: buildWikimediaFileUrl('File:Magellan_Elcano_Circumnavigation-en.svg'),
    },
    eventIds: [
      'magellan-circumnavigation',
      'lewis-clark-expedition',
      'amundsen-south-pole',
      'hillary-everest',
      'cook-pacific-voyage',
      'shackleton-endurance',
    ],
  },
  {
    id: 'medical-miracles',
    title: 'Medical Miracles',
    summary: 'Breakthroughs that conquered disease and transformed human health.',
    image: {
      uri: buildWikimediaFileUrl('File:Jonas_Salk_seated.jpg'),
    },
    eventIds: [
      'salk-polio-vaccine',
      'dna-structure-discovery',
      'first-heart-transplant',
      'xray-discovery',
      'germ-theory-pasteur',
      'anesthesia-first-use',
      'florence-nightingale-nursing',
    ],
  },
  {
    id: 'scientific-breakthroughs',
    title: 'Scientific Breakthroughs',
    summary: 'Discoveries that redefined our understanding of the universe.',
    image: {
      uri: buildWikimediaFileUrl('File:James_Watson_Francis_Crick_1953.jpg'),
    },
    eventIds: [
      'dna-structure-discovery',
      'marie-curie-nobel',
      'ada-lovelace-analytical',
      'xray-discovery',
      'germ-theory-pasteur',
    ],
  },
  {
    id: 'inventors-visionaries',
    title: 'Inventors & Visionaries',
    summary: 'Bold minds who imagined the impossible and made it real.',
    image: {
      uri: buildWikimediaFileUrl('File:Ada_Lovelace_portrait.jpg'),
    },
    eventIds: [
      'ada-lovelace-analytical',
      'marie-curie-nobel',
      'amelia-earhart-atlantic',
      'salk-polio-vaccine',
      'first-heart-transplant',
    ],
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
