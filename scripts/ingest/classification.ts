import type { HistoricalEventRecord, WikidataEntitySummary } from './types';

const CATEGORY_BY_KEYWORD: Array<{ regex: RegExp; category: string }> = [
  { regex: /world war|wwi|world war i|world war ii|wwii|battle|war/i, category: 'world-wars' },
  { regex: /invention|invented|patent/i, category: 'inventions' },
  { regex: /discovery|scientist|physics|chemistry|astronomy/i, category: 'science-discovery' },
  { regex: /earthquake|hurricane|flood|tsunami|eruption|volcano/i, category: 'natural-disasters' },
  { regex: /civil rights|equality|suffrage/i, category: 'civil-rights' },
  { regex: /art|painting|composer|music|opera|sculpture|culture/i, category: 'art-culture' },
  { regex: /president|prime minister|election|parliament|treaty|government/i, category: 'politics' },
  { regex: /exploration|expedition|voyage|mission/i, category: 'exploration' },
];

const CATEGORY_BY_ENTITY: Record<string, string> = {
  Q198: 'world-wars', // war
  Q191021: 'natural-disasters', // earthquake
  Q11446: 'natural-disasters', // volcano eruption
  Q11460: 'natural-disasters', // tsunami
  Q13466005: 'science-discovery', // scientific discovery
  Q11016: 'inventions', // invention
  Q16521: 'art-culture', // artwork
  Q17537576: 'civil-rights', // civil rights movement
  Q49757: 'politics', // election
  Q622425: 'exploration', // expedition
};

const TAGS_BY_ENTITY: Record<string, string> = {
  Q180684: 'air-accident',
  Q178561: 'spaceflight',
  Q43229: 'revolution',
};

const determineEra = (year?: number, exactDate?: string): string | undefined => {
  const derivedYear = year ?? (exactDate ? Number.parseInt(exactDate.slice(0, 4), 10) : undefined);
  if (derivedYear === undefined || Number.isNaN(derivedYear)) {
    return undefined;
  }

  if (derivedYear < -3000) return 'prehistory';
  if (derivedYear < 500) return 'ancient';
  if (derivedYear < 1500) return 'medieval';
  if (derivedYear < 1800) return 'early-modern';
  if (derivedYear < 1900) return 'nineteenth';
  if (derivedYear < 2000) return 'twentieth';
  return 'contemporary';
};

const applyKeywordRules = (text: string, accumulator: Set<string>) => {
  for (const rule of CATEGORY_BY_KEYWORD) {
    if (rule.regex.test(text)) {
      accumulator.add(rule.category);
    }
  }
};

const applyEntityRules = (entities: WikidataEntitySummary[], accumulator: Set<string>, tags: Set<string>) => {
  for (const entity of entities) {
    for (const id of entity.instanceOfIds) {
      const category = CATEGORY_BY_ENTITY[id];
      if (category) {
        accumulator.add(category);
      }
      const tag = TAGS_BY_ENTITY[id];
      if (tag) {
        tags.add(tag);
      }
    }
    for (const id of entity.subclassOfIds) {
      const category = CATEGORY_BY_ENTITY[id];
      if (category) {
        accumulator.add(category);
      }
    }
    for (const id of entity.genreIds) {
      const category = CATEGORY_BY_ENTITY[id];
      if (category) {
        accumulator.add(category);
      }
    }
  }
};

export interface ClassificationInput {
  event: HistoricalEventRecord;
  primaryEntity?: WikidataEntitySummary;
  relatedEntities: WikidataEntitySummary[];
}

export interface ClassificationResult {
  categories: string[];
  era?: string;
  tags: string[];
}

export const classifyEvent = ({
  event,
  primaryEntity,
  relatedEntities,
}: ClassificationInput): ClassificationResult => {
  const categories = new Set<string>();
  const tags = new Set<string>();

  const eventText = [event.text, event.summary]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  applyKeywordRules(eventText, categories);

  if (primaryEntity) {
    applyKeywordRules(`${primaryEntity.label} ${primaryEntity.description ?? ''}`.toLowerCase(), categories);
  }

  applyEntityRules(
    [primaryEntity, ...relatedEntities].filter(Boolean) as WikidataEntitySummary[],
    categories,
    tags
  );

  if (categories.size === 0) {
    categories.add('surprise');
  }

  const era = determineEra(event.year, primaryEntity?.pointInTime ?? event.enrichment?.exactDate);

  return {
    categories: Array.from(categories),
    era,
    tags: Array.from(tags),
  };
};
