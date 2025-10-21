import { CATEGORY_LABELS } from '@/constants/personalization';

export type HomeChipResponse = {
  id: string;
  label: string;
  pinned?: boolean;
};

export const fetchHomeChips = async (): Promise<{ chips: HomeChipResponse[] }> => {
  // TODO: replace with real endpoint.
  const chips = Object.entries(CATEGORY_LABELS)
    .filter(([id]) => id !== 'surprise')
    .map(([id, label], index) => ({
      id,
      label,
      pinned: index < 2,
    }));

  return { chips };
};

export const toggleHomeChipPin = async (_chipId: string, pinned: boolean) => {
  // TODO: send pin state to backend when available.
  return { pinned };
};

