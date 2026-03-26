#!/usr/bin/env node
/**
 * Year Coverage Analysis for Time Machine
 *
 * Reports which years (1800-2025) have events in Firestore
 * and publishes the list to contentMeta/yearIndex for the app to consume.
 *
 * Usage: npx tsx scripts/check-year-coverage.ts
 */

import { bootstrapFirestore } from './ingest/firestore-admin';

const MIN_YEAR = 1800;
const MAX_YEAR = 2025;
const MIN_EVENTS_OK = 3;

async function checkYearCoverage() {
  console.log('Checking Time Machine year coverage...\n');

  const { firestore: db } = await bootstrapFirestore({});
  const eventsRef = db.collection('contentEvents');

  console.log('Fetching events from Firestore...');
  const snapshot = await eventsRef.get();
  console.log(`   Found ${snapshot.size} total events\n`);

  // Count events per year
  const yearCount = new Map<number, number>();
  snapshot.forEach((doc) => {
    const year = doc.data().year as number | undefined;
    if (typeof year === 'number' && year >= MIN_YEAR && year <= MAX_YEAR) {
      yearCount.set(year, (yearCount.get(year) ?? 0) + 1);
    }
  });

  // Classify years
  const missing: number[] = [];
  const low: number[] = [];
  const ok: number[] = [];

  for (let year = MIN_YEAR; year <= MAX_YEAR; year++) {
    const count = yearCount.get(year) ?? 0;
    if (count === 0) {
      missing.push(year);
    } else if (count < MIN_EVENTS_OK) {
      low.push(year);
    } else {
      ok.push(year);
    }
  }

  const total = MAX_YEAR - MIN_YEAR + 1;

  // Print problem years
  console.log('Year | Count | Status');
  console.log('-----|-------|-------');
  for (let year = MIN_YEAR; year <= MAX_YEAR; year++) {
    const count = yearCount.get(year) ?? 0;
    if (count < MIN_EVENTS_OK) {
      const status = count === 0 ? 'MISSING' : `LOW (<${MIN_EVENTS_OK})`;
      console.log(`${year} | ${String(count).padStart(5)} | ${status}`);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('\nCOVERAGE SUMMARY\n');
  console.log(`   Total years (${MIN_YEAR}-${MAX_YEAR}): ${total}`);
  console.log(`   OK  (>=${MIN_EVENTS_OK} events): ${ok.length} years`);
  console.log(`   LOW (<${MIN_EVENTS_OK} events): ${low.length} years`);
  console.log(`   MISSING (0 events): ${missing.length} years`);
  console.log(`   Coverage: ${((ok.length / total) * 100).toFixed(1)}%`);

  if (missing.length > 0) {
    console.log(`\n   Missing range: ${Math.min(...missing)}-${Math.max(...missing)}`);
  }

  // Publish available years to Firestore for the mobile app to consume
  const availableYears = [...ok].sort((a, b) => a - b);
  console.log(`\nPublishing ${availableYears.length} available years to contentMeta/yearIndex...`);
  await db.collection('contentMeta').doc('yearIndex').set({
    years: availableYears,
    updatedAt: new Date().toISOString(),
    totalEvents: snapshot.size,
  });
  console.log('   Published!\n');

  console.log('Coverage check complete!\n');
}

checkYearCoverage().catch((error) => {
  console.error('Coverage check failed:', error);
  process.exit(1);
});
