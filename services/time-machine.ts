import { getImageUri } from '@/utils/image-source';
import { heroEvent } from '@/constants/events';

export type TimeMachineSeedResponse = {
  year: number;
};

export type TimelineEvent = {
  id: string;
  title: string;
  summary: string;
  imageUrl?: string;
  dateISO?: string;
  categoryId?: string;
};

export type TimeMachineTimelineResponse = {
  year: number;
  events: TimelineEvent[];
  before?: TimelineEvent[];
  after?: TimelineEvent[];
};

const TIME_MACHINE_BASE_URL = 'https://api.example.com/time-machine';

const buildUrl = (path: string, params?: Record<string, string | number | undefined>) => {
  const url = new URL(path, TIME_MACHINE_BASE_URL);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    });
  }
  return url.toString();
};

const fetchJson = async <T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> => {
  const response = await fetch(input, init);
  if (!response.ok) {
    throw new Error(`Time Machine request failed (${response.status})`);
  }
  return (await response.json()) as T;
};

export const fetchTimeMachineSeed = async (): Promise<TimeMachineSeedResponse> => {
  try {
    return await fetchJson<TimeMachineSeedResponse>(buildUrl('/seed'));
  } catch (error) {
    console.warn('Falling back to local time machine seed', error);
    return { year: 1969 };
  }
};

export const fetchTimeMachineTimeline = async (
  year: number,
  options: { categories?: string } = {}
): Promise<TimeMachineTimelineResponse> => {
  try {
    return await fetchJson<TimeMachineTimelineResponse>(
      buildUrl('/timeline', { year, categories: options.categories })
    );
  } catch (error) {
    console.warn('Falling back to local time machine timeline', error);
    return {
      year,
      events: [
        {
          id: heroEvent.id,
          title: heroEvent.title,
          summary: heroEvent.summary,
          imageUrl: getImageUri(heroEvent.image) ?? undefined,
        },
      ],
    };
  }
};
