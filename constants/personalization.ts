import type { CategoryOption, EraOption } from '@/contexts/onboarding-context';

export const ERA_LABELS: Record<EraOption, string> = {
  prehistory: 'Prehistory',
  ancient: 'Ancient Worlds',
  medieval: 'Medieval Era',
  'early-modern': 'Early Modern',
  nineteenth: '19th Century',
  twentieth: '20th Century',
  contemporary: 'Contemporary',
};

export const CATEGORY_LABELS: Record<CategoryOption, string> = {
  'world-wars': 'World Wars',
  'ancient-civilizations': 'Ancient Civilizations',
  'science-discovery': 'Science & Discovery',
  'art-culture': 'Art & Culture',
  politics: 'Politics & Leaders',
  inventions: 'Inventions & Breakthroughs',
  'natural-disasters': 'Natural Disasters',
  'civil-rights': 'Civil Rights & Movements',
  exploration: 'Exploration',
  surprise: 'Surprise Me',
};

export const formatCategoryLabel = (category: string) => {
  return CATEGORY_LABELS[category as CategoryOption] ?? category;
};

export const formatEraLabel = (era: string | undefined) => {
  if (!era) {
    return 'Any era';
  }

  return ERA_LABELS[era as EraOption] ?? era;
};
