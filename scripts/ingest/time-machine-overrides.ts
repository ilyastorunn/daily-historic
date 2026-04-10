import { readFile } from 'node:fs/promises';

import { z, type ZodIssue } from 'zod';

import type { ParsedYearPageEvent } from './wikimedia-year-client';

const timeMachineOverrideSchema = z.object({
  suppress: z.boolean().optional(),
  summary: z.string().min(1).optional(),
  month: z.number().int().min(1).max(12).optional(),
  day: z.number().int().min(1).max(31).optional(),
  qualityFlags: z.array(z.string().min(1)).optional(),
});

const timeMachineOverridesSchema = z.object({
  events: z.record(timeMachineOverrideSchema).optional(),
});

export type TimeMachineOverride = z.infer<typeof timeMachineOverrideSchema>;
export type TimeMachineOverrideConfig = z.infer<typeof timeMachineOverridesSchema>;

export const DEFAULT_TIME_MACHINE_OVERRIDE_PATH = 'overrides/time-machine.json';

const formatIssues = (issues: ZodIssue[]) => {
  return issues.map((issue) => {
    const path = issue.path.length ? issue.path.join('.') : 'root';
    return `${path}: ${issue.message}`;
  });
};

export const loadTimeMachineOverrides = async (path?: string): Promise<TimeMachineOverrideConfig> => {
  const filePath = path ?? process.env.TIME_MACHINE_OVERRIDES_PATH ?? DEFAULT_TIME_MACHINE_OVERRIDE_PATH;

  try {
    const data = await readFile(filePath, 'utf-8');
    const parsedJson = JSON.parse(data) as unknown;
    const result = timeMachineOverridesSchema.safeParse(parsedJson);
    if (!result.success) {
      throw new Error(`Time Machine override file ${filePath} is invalid: ${formatIssues(result.error.issues).join('; ')}`);
    }
    return {
      events: result.data.events ?? {},
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return { events: {} };
    }
    throw error;
  }
};

export const applyTimeMachineOverride = (
  event: ParsedYearPageEvent,
  override: TimeMachineOverride | undefined
): ParsedYearPageEvent | null => {
  if (!override) {
    return event;
  }
  if (override.suppress) {
    return null;
  }

  return {
    ...event,
    month: override.month ?? event.month,
    day: override.day ?? event.day,
    text: override.summary ?? event.text,
    qualityFlags: Array.from(new Set([...(event.qualityFlags ?? []), ...(override.qualityFlags ?? [])])),
  };
};
