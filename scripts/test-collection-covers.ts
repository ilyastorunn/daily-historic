/**
 * Test script to validate all collection cover images are accessible
 * Usage: npx tsx scripts/test-collection-covers.ts
 */

import { EVENT_COLLECTIONS } from '../constants/events';
import { getImageUri } from '../utils/image-source';

type TestResult = {
  collectionId: string;
  title: string;
  status: 'success' | 'error';
  coverUrl?: string;
  errorMessage?: string;
  httpStatus?: number;
};

async function testImageUrl(url: string): Promise<{ success: boolean; status?: number; error?: string }> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return {
      success: response.ok,
      status: response.status,
      error: response.ok ? undefined : `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function testCollectionCovers() {
  console.log('\n🧪 Testing Collection Cover Images...\n');

  const results: TestResult[] = [];
  let successCount = 0;
  let errorCount = 0;

  for (const collection of EVENT_COLLECTIONS) {
    const coverImage = collection.coverImage ?? collection.image;
    const coverUrl = getImageUri(coverImage);

    if (!coverUrl) {
      results.push({
        collectionId: collection.id,
        title: collection.title,
        status: 'error',
        errorMessage: 'No URL generated',
      });
      errorCount++;
      continue;
    }

    console.log(`Testing: ${collection.title}...`);
    const testResult = await testImageUrl(coverUrl);

    if (testResult.success) {
      results.push({
        collectionId: collection.id,
        title: collection.title,
        status: 'success',
        coverUrl,
        httpStatus: testResult.status,
      });
      successCount++;
      console.log(`  ✅ OK (${testResult.status})`);
    } else {
      results.push({
        collectionId: collection.id,
        title: collection.title,
        status: 'error',
        coverUrl,
        errorMessage: testResult.error,
        httpStatus: testResult.status,
      });
      errorCount++;
      console.log(`  ❌ FAILED: ${testResult.error}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`📊 Summary: ${successCount} passed, ${errorCount} failed out of ${results.length} total`);
  console.log('='.repeat(60) + '\n');

  if (errorCount > 0) {
    console.log('❌ Failed Collections:\n');
    results
      .filter((r) => r.status === 'error')
      .forEach((r) => {
        console.log(`  • ${r.title}`);
        console.log(`    Collection ID: ${r.collectionId}`);
        console.log(`    URL: ${r.coverUrl ?? 'N/A'}`);
        console.log(`    Error: ${r.errorMessage}\n`);
      });

    process.exit(1);
  } else {
    console.log('✅ All collection covers are accessible!\n');
    process.exit(0);
  }
}

testCollectionCovers().catch((error) => {
  console.error('Test script failed:', error);
  process.exit(1);
});
