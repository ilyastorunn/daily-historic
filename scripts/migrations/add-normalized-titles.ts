/**
 * Migration: Add normalizedTitle field to contentEvents
 *
 * IMPORTANT: This script modifies production data!
 * Only run after backup and testing.
 *
 * Usage:
 *   npx ts-node scripts/migrations/add-normalized-titles.ts --dry-run
 *   npx ts-node scripts/migrations/add-normalized-titles.ts --execute
 */

import * as admin from 'firebase-admin';
import { normalizeTitle } from '../../utils/title-matching';

// Initialize Firebase Admin (if not already initialized)
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

type MigrationStats = {
  total: number;
  updated: number;
  skipped: number;
  errors: number;
};

/**
 * Add normalizedTitle field to all contentEvents
 */
async function migrateNormalizedTitles(dryRun: boolean = true): Promise<MigrationStats> {
  const stats: MigrationStats = {
    total: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
  };

  console.log(`[Migration] Starting... (dry-run: ${dryRun})`);

  try {
    // Fetch all contentEvents in batches
    const batchSize = 100;
    let lastDoc: admin.firestore.QueryDocumentSnapshot | null = null;
    let hasMore = true;

    while (hasMore) {
      let query = db.collection('contentEvents').orderBy('eventId').limit(batchSize);

      if (lastDoc) {
        query = query.startAfter(lastDoc);
      }

      const snapshot = await query.get();

      if (snapshot.empty) {
        hasMore = false;
        break;
      }

      // Process batch
      const batch = db.batch();
      let batchCount = 0;

      for (const doc of snapshot.docs) {
        stats.total++;

        const data = doc.data();

        // Skip if normalizedTitle already exists
        if (data.normalizedTitle) {
          stats.skipped++;
          console.log(`[Migration] Skipped (already has normalizedTitle): ${doc.id}`);
          continue;
        }

        // Skip if no text field
        if (!data.text && !data.summary) {
          stats.skipped++;
          console.log(`[Migration] Skipped (no text/summary): ${doc.id}`);
          continue;
        }

        // Normalize title
        const sourceText = data.text || data.summary || '';
        const normalized = normalizeTitle(sourceText);

        if (!dryRun) {
          batch.update(doc.ref, {
            normalizedTitle: normalized,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          batchCount++;
        }

        stats.updated++;
        console.log(`[Migration] ${dryRun ? 'Would update' : 'Updating'}: ${doc.id} -> "${normalized}"`);
      }

      // Commit batch (only if not dry-run and has updates)
      if (!dryRun && batchCount > 0) {
        await batch.commit();
        console.log(`[Migration] Committed batch of ${batchCount} updates`);
      }

      lastDoc = snapshot.docs[snapshot.docs.length - 1];
      hasMore = snapshot.size === batchSize;
    }

    console.log('[Migration] Complete!');
    console.log('[Migration] Stats:', stats);

    return stats;
  } catch (error) {
    console.error('[Migration] Fatal error:', error);
    stats.errors++;
    throw error;
  }
}

/**
 * Main entry point
 */
async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--execute');

  if (dryRun) {
    console.log('='.repeat(60));
    console.log('DRY RUN MODE - No changes will be made');
    console.log('Use --execute flag to apply changes');
    console.log('='.repeat(60));
  } else {
    console.log('='.repeat(60));
    console.log('EXECUTE MODE - Changes will be applied!');
    console.log('='.repeat(60));

    // Extra confirmation for execute mode
    console.log('Starting in 3 seconds... (Ctrl+C to cancel)');
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  const stats = await migrateNormalizedTitles(dryRun);

  console.log('\n' + '='.repeat(60));
  console.log('MIGRATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total events:    ${stats.total}`);
  console.log(`Updated:         ${stats.updated}`);
  console.log(`Skipped:         ${stats.skipped}`);
  console.log(`Errors:          ${stats.errors}`);
  console.log('='.repeat(60));

  if (dryRun) {
    console.log('\nTo apply these changes, run with --execute flag');
  }

  process.exit(0);
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
}

export { migrateNormalizedTitles };
