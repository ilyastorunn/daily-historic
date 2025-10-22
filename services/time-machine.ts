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
          dateISO: heroEvent.date,
          categoryId: heroEvent.categories?.[0],
        },
      ],
      before: [
        {
          id: 'gemini-program',
          title: 'Project Gemini lifts off',
          summary: 'NASA perfects rendezvous and EVA techniques in the years leading up to Apollo.',
          imageUrl:
            'https://upload.wikimedia.org/wikipedia/commons/5/5c/Gemini_6A_and_Gemini_7_photograph.jpg',
          dateISO: '1965-12-15',
          categoryId: 'science',
        },
        {
          id: 'sputnik-launch',
          title: 'Sputnik starts the space race',
          summary: 'The Soviet Union launches the first artificial satellite, spurring global competition.',
          imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/9b/Sputnik_1.jpg',
          dateISO: '1957-10-04',
          categoryId: 'science',
        },
      ],
      after: [
        {
          id: 'viking-on-mars',
          title: 'Viking 1 touches down on Mars',
          summary: 'NASA’s robotic lander beams back the first clear images from the Martian surface.',
          imageUrl:
            'https://upload.wikimedia.org/wikipedia/commons/1/1a/Viking_Lander_model.png',
          dateISO: '1976-07-20',
          categoryId: 'science',
        },
        {
          id: 'iss-assembly',
          title: 'International Space Station assembly begins',
          summary: 'Nations collaborate to build a permanent laboratory in orbit.',
          imageUrl:
            'https://upload.wikimedia.org/wikipedia/commons/d/d3/ISS_assembly_animation.gif',
          dateISO: '1998-11-20',
          categoryId: 'science',
        },
      ],
    };
  }
};
