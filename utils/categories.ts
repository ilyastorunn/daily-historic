import { CATEGORY_LABELS } from '@/constants/personalization';

export const categoryLabelFromId = (id: string | undefined) => {
  if (!id) {
    return 'All topics';
  }
  return CATEGORY_LABELS[id as keyof typeof CATEGORY_LABELS] ?? id;
};

