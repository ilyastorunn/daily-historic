import { CATEGORY_LABELS } from '@/constants/personalization';

const HOME_API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://api.example.com';

const buildUrl = (path: string) => {
  return new URL(path, HOME_API_BASE_URL).toString();
};

const fetchJson = async <T>(input: RequestInfo | URL, init?: RequestInit) => {
  const response = await fetch(input, init);
  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }
  return (await response.json()) as T;
};

const fallbackChips = () =>
  Object.entries(CATEGORY_LABELS)
    .filter(([id]) => id !== 'surprise')
    .map(([id, label], index) => ({
      id,
      label,
      pinned: index === 0,
    }));

export type HomeChipResponse = {
  id: string;
  label: string;
  pinned?: boolean;
};

export const fetchHomeChips = async (): Promise<{ chips: HomeChipResponse[] }> => {
  try {
    return await fetchJson<{ chips: HomeChipResponse[] }>(buildUrl('/home/chips'));
  } catch (error) {
    console.warn('Falling back to local chips', error);
    return { chips: fallbackChips() };
  }
};

export const toggleHomeChipPin = async (_chipId: string, pinned: boolean) => {
  try {
    return await fetchJson<{ pinned: boolean }>(buildUrl('/home/chips/pin'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ chipId: _chipId, pinned }),
    });
  } catch (error) {
    console.warn('Chip pin update failed on backend', error);
    return { pinned };
  }
};
