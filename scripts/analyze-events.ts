/**
 * Analyze existing Firestore events for Time Machine curation
 *
 * This script:
 * 1. Counts events per year (1900-2024)
 * 2. Identifies years with rich content (10+ events)
 * 3. Lists years with sparse content (<5 events)
 * 4. Checks for image coverage
 * 5. Reports category distribution
 *
 * Usage: npx tsx scripts/analyze-events.ts
 */

import { bootstrapFirestore } from './ingest/firestore-admin';

interface YearStats {
  year: number;
  count: number;
  withImages: number;
  withoutImages: number;
  categories: Set<string>;
  events: Array<{
    id: string;
    title: string;
    dateISO: string;
    hasImage: boolean;
    categories: string[];
  }>;
}

async function analyzeEvents() {
  console.log('🔍 Analyzing Firestore events for Time Machine...\n');

  const { firestore: db } = await bootstrapFirestore({});
  const eventsRef = db.collection('contentEvents');

  // Fetch all events
  console.log('📥 Fetching events from Firestore...');
  const snapshot = await eventsRef.get();
  console.log(`   Found ${snapshot.size} total events\n`);

  // Group by year
  const yearMap = new Map<number, YearStats>();

  snapshot.forEach((doc) => {
    const data = doc.data();
    const year = data.year;

    if (!year || year < 1900 || year > 2024) {
      return; // Skip invalid years
    }

    if (!yearMap.has(year)) {
      yearMap.set(year, {
        year,
        count: 0,
        withImages: 0,
        withoutImages: 0,
        categories: new Set(),
        events: [],
      });
    }

    const stats = yearMap.get(year)!;
    stats.count++;

    const hasImage = Boolean(data.imageUrl || data.enrichment?.imageUrl);
    if (hasImage) {
      stats.withImages++;
    } else {
      stats.withoutImages++;
    }

    // Track categories
    if (Array.isArray(data.categories)) {
      data.categories.forEach((cat: string) => stats.categories.add(cat));
    }

    // Store event details
    stats.events.push({
      id: doc.id,
      title: data.title || data.text || 'Untitled',
      dateISO: data.dateISO || `${year}-01-01`,
      hasImage,
      categories: data.categories || [],
    });
  });

  // Sort years
  const years = Array.from(yearMap.values()).sort((a, b) => b.year - a.year);

  // Generate reports
  console.log('📊 YEAR DISTRIBUTION REPORT\n');
  console.log('═'.repeat(80));

  // Rich years (10+ events)
  const richYears = years.filter((y) => y.count >= 10);
  console.log(`\n🌟 RICH YEARS (10+ events): ${richYears.length} years\n`);
  richYears.forEach((y) => {
    const imagePercent = ((y.withImages / y.count) * 100).toFixed(0);
    console.log(
      `   ${y.year}: ${y.count} events | ${y.withImages} with images (${imagePercent}%) | ${y.categories.size} categories`
    );
  });

  // Moderate years (5-9 events)
  const moderateYears = years.filter((y) => y.count >= 5 && y.count < 10);
  console.log(`\n📈 MODERATE YEARS (5-9 events): ${moderateYears.length} years\n`);
  moderateYears.forEach((y) => {
    const imagePercent = ((y.withImages / y.count) * 100).toFixed(0);
    console.log(
      `   ${y.year}: ${y.count} events | ${y.withImages} with images (${imagePercent}%) | ${y.categories.size} categories`
    );
  });

  // Sparse years (1-4 events)
  const sparseYears = years.filter((y) => y.count < 5);
  console.log(`\n⚠️  SPARSE YEARS (1-4 events): ${sparseYears.length} years\n`);
  sparseYears.slice(0, 10).forEach((y) => {
    console.log(`   ${y.year}: ${y.count} events`);
  });
  if (sparseYears.length > 10) {
    console.log(`   ... and ${sparseYears.length - 10} more sparse years`);
  }

  // Missing years (0 events)
  const allYears = new Set(years.map((y) => y.year));
  const missingYears: number[] = [];
  for (let year = 1900; year <= 2024; year++) {
    if (!allYears.has(year)) {
      missingYears.push(year);
    }
  }
  console.log(`\n❌ MISSING YEARS (0 events): ${missingYears.length} years`);
  if (missingYears.length > 0) {
    console.log(`   Range: ${Math.min(...missingYears)} - ${Math.max(...missingYears)}`);
  }

  // Top 5 richest year candidates (by event count)
  console.log('\n═'.repeat(80));
  console.log('\n🎯 TOP 5 RICHEST YEAR CANDIDATES (by event count)\n');
  const candidates = years
    .filter((y) => y.count >= 10)
    .sort((a, b) => {
      // Sort by: event count first, then category diversity
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      return b.categories.size - a.categories.size;
    })
    .slice(0, 5);

  candidates.forEach((y, index) => {
    console.log(
      `${index + 1}. ${y.year} - ${y.count} events, ${y.categories.size} categories (${Array.from(y.categories).join(', ')})`
    );
  });

  // Category distribution
  console.log('\n═'.repeat(80));
  console.log('\n📂 CATEGORY DISTRIBUTION\n');
  const categoryCount = new Map<string, number>();
  years.forEach((y) => {
    y.categories.forEach((cat) => {
      categoryCount.set(cat, (categoryCount.get(cat) || 0) + y.count);
    });
  });
  const sortedCategories = Array.from(categoryCount.entries()).sort((a, b) => b[1] - a[1]);
  sortedCategories.slice(0, 15).forEach(([cat, count]) => {
    console.log(`   ${cat}: ${count} events`);
  });

  // Summary
  console.log('\n═'.repeat(80));
  console.log('\n📋 SUMMARY\n');
  console.log(`   Total Events: ${snapshot.size}`);
  console.log(`   Years Covered: ${years.length} (${Math.min(...years.map((y) => y.year))} - ${Math.max(...years.map((y) => y.year))})`);
  console.log(`   Rich Years (10+): ${richYears.length}`);
  console.log(`   Moderate Years (5-9): ${moderateYears.length}`);
  console.log(`   Sparse Years (1-4): ${sparseYears.length}`);
  console.log(`   Missing Years: ${missingYears.length}`);
  console.log(`   Avg Events/Year: ${(snapshot.size / years.length).toFixed(1)}`);
  console.log();

  // Export detailed data for top candidates
  console.log('💾 Exporting detailed data for top 5 richest years...\n');
  const exportData = {
    generatedAt: new Date().toISOString(),
    summary: {
      totalEvents: snapshot.size,
      yearsCovered: years.length,
      richYears: richYears.length,
      sparseYears: sparseYears.length,
      missingYears: missingYears.length,
    },
    featuredYears: candidates.map((y) => ({
      year: y.year,
      eventCount: y.count,
      categoryCount: y.categories.size,
      categories: Array.from(y.categories),
      events: y.events
        .sort((a, b) => a.dateISO.localeCompare(b.dateISO))
        .map((e) => ({
          id: e.id,
          dateISO: e.dateISO,
          title: e.title,
          hasImage: e.hasImage,
          categories: e.categories,
        })),
    })),
  };

  const fs = await import('fs/promises');
  await fs.writeFile(
    './scripts/time-machine-analysis.json',
    JSON.stringify(exportData, null, 2)
  );
  console.log('✅ Detailed analysis saved to: scripts/time-machine-analysis.json');
  console.log('\n🎉 Analysis complete!\n');
}

// Run the analysis
analyzeEvents().catch((error) => {
  console.error('❌ Analysis failed:', error);
  process.exit(1);
});
