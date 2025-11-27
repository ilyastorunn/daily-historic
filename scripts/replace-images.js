/**
 * Automatically replace broken Wikimedia image URLs with working alternatives
 */

const fs = require('fs');
const path = require('path');

const eventsPath = path.join(__dirname, '../constants/events.ts');
const replacementsPath = path.join(__dirname, 'image-replacements.json');

// Load replacement mapping
const replacements = JSON.parse(fs.readFileSync(replacementsPath, 'utf-8'));

// Load events file
let eventsContent = fs.readFileSync(eventsPath, 'utf-8');

console.log('\n🔄 Replacing broken image URLs...\n');

let replacedCount = 0;

// Apply replacements
for (const [oldUrl, newUrl] of Object.entries(replacements)) {
  const regex = new RegExp(`buildWikimediaFileUrl\\('${oldUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'\\)`, 'g');
  const matches = eventsContent.match(regex);

  if (matches && matches.length > 0) {
    eventsContent = eventsContent.replace(regex, `buildWikimediaFileUrl('${newUrl}')`);
    console.log(`✅ Replaced ${matches.length}x: ${oldUrl}`);
    console.log(`   → ${newUrl}`);
    replacedCount += matches.length;
  }
}

// Write updated content
fs.writeFileSync(eventsPath, eventsContent, 'utf-8');

console.log(`\n📊 Summary: Replaced ${replacedCount} image URLs\n`);
