#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { exit } from 'node:process';

import {
  DEFAULT_OVERRIDE_PATH,
  formatOverrideIssues,
  overridesSchema,
  validateOverrideData,
} from './overrides';

const log = console.log;
const errorLog = console.error;

const resolveFilePath = (cliPath?: string) => {
  return cliPath ?? process.env.INGEST_OVERRIDES_PATH ?? DEFAULT_OVERRIDE_PATH;
};

const printSuccess = (filePath: string, eventCount: number) => {
  log(`Overrides validated successfully (${eventCount} event${eventCount === 1 ? '' : 's'}) in ${filePath}.`);
};

const printIssues = (filePath: string, issues: string[]) => {
  errorLog(`Overrides validation failed for ${filePath}:`);
  issues.forEach((issue) => {
    errorLog(`  - ${issue}`);
  });
};

const main = async () => {
  const filePath = resolveFilePath(process.argv[2]);

  let raw: string;

  try {
    raw = await readFile(filePath, 'utf-8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      log(`No overrides file found at ${filePath}. Nothing to validate.`);
      exit(0);
    }

    errorLog(`Failed to read overrides file: ${(error as Error).message}`);
    exit(1);
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch (jsonError) {
    errorLog(`Overrides file ${filePath} contains invalid JSON: ${(jsonError as Error).message}`);
    exit(1);
  }

  const result = validateOverrideData(parsed);

  if (!result.success) {
    const issues = formatOverrideIssues(result.error.issues);
    printIssues(filePath, issues);
    exit(1);
  }

  const overrides = result.data.events ?? {};
  // Ensure we coerce via schema to catch future shape changes
  overridesSchema.parse({ events: overrides });
  printSuccess(filePath, Object.keys(overrides).length);
  exit(0);
};

void main();
