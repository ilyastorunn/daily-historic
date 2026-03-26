#!/usr/bin/env node
/**
 * Bulk Ingestion Runner for Time Machine Year Coverage
 *
 * Runs `npm run ingest` for 60 dates spread across the year.
 * Each date's "On This Day" Wikipedia data covers many different years,
 * so 60 runs yield ~1,200 new events covering a wide range of years.
 *
 * Strategy: months 1-12 x days [1, 8, 15, 22, 28] = 60 runs
 *
 * Usage: npx tsx scripts/bulk-ingest-years.ts
 */

import { execFileSync } from 'node:child_process';

const DAYS_TO_INGEST = [1, 8, 15, 22, 28];
const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const DELAY_MS = 2000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function bulkIngest() {
  console.log('Bulk Ingestion Runner for Time Machine\n');

  const dates: { month: number; day: number }[] = [];
  for (const month of MONTHS) {
    for (const day of DAYS_TO_INGEST) {
      dates.push({ month, day });
    }
  }

  console.log(`Plan: ${dates.length} ingestion runs`);
  console.log(`   Months: ${MONTHS.join(', ')}`);
  console.log(`   Days: ${DAYS_TO_INGEST.join(', ')}`);
  console.log(`   Delay between runs: ${DELAY_MS}ms\n`);
  console.log('-'.repeat(60));

  let succeeded = 0;
  let failed = 0;
  const failedDates: { month: number; day: number; error: string }[] = [];

  for (let i = 0; i < dates.length; i++) {
    const { month, day } = dates[i];
    const progress = `[${i + 1}/${dates.length}]`;
    console.log(`\n${progress} Ingesting month=${month} day=${day}...`);

    try {
      // Use execFileSync (not exec/execSync) to avoid shell injection risk.
      // All args are hardcoded numbers — no user input involved.
      execFileSync('npm', ['run', 'ingest', '--', `--month=${month}`, `--day=${day}`], {
        stdio: 'inherit',
        cwd: process.cwd(),
      });
      succeeded++;
      console.log('   Done');
    } catch (error) {
      failed++;
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      failedDates.push({ month, day, error: errorMsg });
      console.error(`   Failed: ${errorMsg}`);
    }

    // Rate-limit delay (skip after last item)
    if (i < dates.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\nINGESTION SUMMARY\n');
  console.log(`   Succeeded: ${succeeded}/${dates.length}`);
  console.log(`   Failed: ${failed}/${dates.length}`);

  if (failedDates.length > 0) {
    console.log('\n   Failed dates:');
    for (const { month, day, error } of failedDates) {
      console.log(`   - month=${month} day=${day}: ${error}`);
    }
  }

  console.log('\nRun `npx tsx scripts/check-year-coverage.ts` to see updated coverage.\n');
}

bulkIngest().catch((error) => {
  console.error('Bulk ingestion failed:', error);
  process.exit(1);
});
