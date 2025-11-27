/**
 * Test all Wikimedia image URLs in EVENT_LIBRARY
 * Reports which images return 404 errors
 */

const BASE_URL = 'https://commons.wikimedia.org/wiki/Special:FilePath';

// Extract buildWikimediaFileUrl logic (UPDATED - keep underscores)
function buildWikimediaFileUrl(fileName) {
  const trimmed = fileName.trim();
  const normalizedName = trimmed.replace(/^file:/i, ''); // Keep underscores!
  const encodedName = encodeURIComponent(normalizedName);
  return `${BASE_URL}/${encodedName}`;
}

// Extract image URLs from events.ts file
const fs = require('fs');
const path = require('path');

const eventsPath = path.join(__dirname, '../constants/events.ts');
const eventsContent = fs.readFileSync(eventsPath, 'utf-8');

// Find all buildWikimediaFileUrl calls
const regex = /buildWikimediaFileUrl\('([^']+)'\)/g;
const matches = [...eventsContent.matchAll(regex)];

console.log(`\n🔍 Testing ${matches.length} Wikimedia images...\n`);

async function testUrl(url, fileName) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return {
      fileName,
      url,
      status: response.status,
      ok: response.ok,
    };
  } catch (error) {
    return {
      fileName,
      url,
      status: 'ERROR',
      ok: false,
      error: error.message,
    };
  }
}

async function testAllImages() {
  const results = [];

  for (const match of matches) {
    const fileName = match[1];
    const url = buildWikimediaFileUrl(fileName);
    const result = await testUrl(url, fileName);
    results.push(result);

    const icon = result.ok ? '✅' : '❌';
    console.log(`${icon} ${result.status} - ${fileName}`);

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n📊 Summary:');
  const failed = results.filter(r => !r.ok);
  const succeeded = results.filter(r => r.ok);

  console.log(`✅ Working: ${succeeded.length}`);
  console.log(`❌ Failed: ${failed.length}`);

  if (failed.length > 0) {
    console.log('\n❌ Failed images:');
    failed.forEach(f => {
      console.log(`  - ${f.fileName} (${f.status})`);
      console.log(`    URL: ${f.url}`);
    });
  }
}

testAllImages().catch(console.error);
