/**
 * Enrich featured Time Machine events with images and context
 *
 * This script:
 * 1. Reads event IDs from time-machine-analysis.json
 * 2. Allows manual addition of image URLs and before/after context
 * 3. Updates Firestore events with enriched data
 *
 * Usage: npx tsx scripts/enrich-featured-events.ts
 */

import { bootstrapFirestore } from './ingest/firestore-admin';

interface EventEnrichment {
  eventId: string;
  imageUrl?: string;
  beforeContext?: string;
  afterContext?: string;
}

// Manual enrichment data for featured events
// Add image URLs from Wikimedia Commons and before/after context
const ENRICHMENTS: EventEnrichment[] = [
  // ========== 2013 Events (16 total) ==========

  // Mars Orbiter Mission
  {
    eventId: '852aa2c5970083d25cc0fd52bfab0504',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Mars_Orbiter_Mission_-_India_-_ArtistsConcept.jpg/1200px-Mars_Orbiter_Mission_-_India_-_ArtistsConcept.jpg',
    beforeContext: 'India had been developing its space program since the 1960s, primarily focused on Earth observation satellites. The Mars Orbiter Mission represented India\'s first venture into interplanetary exploration, aiming to demonstrate technological capabilities and study Mars\' atmosphere.',
    afterContext: 'The mission successfully entered Mars orbit in September 2014, making India the first Asian nation and the fourth space agency to reach Mars. It cost only $74 million, showcasing India\'s cost-effective space engineering approach.'
  },

  // Typhoon Haiyan
  {
    eventId: 'bf4a602699a3a4519e6fb5002ea2494f',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Haiyan_2013-11-07_0405Z.jpg/1200px-Haiyan_2013-11-07_0405Z.jpg',
    beforeContext: 'The Philippines had been hit by devastating typhoons before, but meteorologists warned that Haiyan was one of the strongest tropical cyclones ever recorded, with sustained winds exceeding 195 mph. Evacuation orders were issued across the Visayas region.',
    afterContext: 'Typhoon Haiyan killed at least 6,300 people, displaced 4 million, and caused $2.98 billion in damage. The catastrophe led to improvements in disaster preparedness and international climate change discussions about extreme weather events.'
  },

  // Magnus Carlsen World Chess Champion
  {
    eventId: 'c95d2411824edb35ec9a5ad0409e1a14',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Magnus_Carlsen_%282016%29.jpg/1200px-Magnus_Carlsen_%282016%29.jpg',
    beforeContext: 'Magnus Carlsen had been the world\'s highest-rated player since 2011 and was considered the favorite to defeat defending champion Viswanathan Anand. At 22, Carlsen represented a new generation of chess players who used computers extensively in preparation.',
    afterContext: 'Carlsen dominated the match, winning 6.5-3.5 and becoming the second-youngest world champion at age 22. He would go on to hold the title for over a decade, revolutionizing chess with his universal playing style and popularizing the game through streaming.'
  },

  // Marmaray Tunnel
  {
    eventId: 'b09a3a8185b7ce1a6feebc8bb2e1daef',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Marmaray_train_at_S%C3%B6%C4%9F%C3%BCtl%C3%BC%C3%A7e%C5%9Fme_station_2014.jpg/1200px-Marmaray_train_at_S%C3%B6%C4%9F%C3%BCtl%C3%BC%C3%A7e%C5%9Fme_station_2014.jpg',
    beforeContext: 'For centuries, crossing between Europe and Asia in Istanbul required ferries or bridges. The Marmaray project, first proposed in 1860, aimed to build an undersea rail tunnel beneath the Bosphorus Strait, connecting both continents via subway.',
    afterContext: 'The tunnel became the deepest immersed tube tunnel in the world at 60 meters below sea level. It connects Istanbul\'s European and Asian sides, carrying 1.5 million passengers daily and reducing crossing times from 90 minutes to 4 minutes.'
  },

  // Metallica Antarctica Concert
  {
    eventId: '6a4ae3e7805085b5d415f72358ba4e38',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Metallica_Live_at_The_O2%2C_London%2C_England%2C_22_October_2017.jpg/1200px-Metallica_Live_at_The_O2%2C_London%2C_England%2C_22_October_2017.jpg',
    beforeContext: 'Metallica had been performing worldwide for over 30 years, but Antarctica remained unconquered. The band partnered with Coca-Cola Zero to play a secret show at Argentina\'s Carlini Station, requiring special environmental clearances to avoid disturbing wildlife.',
    afterContext: 'The 120-fan concert was completely silent to the outside world—attendees wore headphones while the band played through a custom sound system. Metallica became the first band to perform on all seven continents, earning a Guinness World Record.'
  },

  // One Direction - Midnight Memories
  {
    eventId: '5290ecf546191d214c8c6bf77b5f9889',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/5f/One_Direction_-_Midnight_Memories_%28Official_Album_Cover%29.png/1200px-One_Direction_-_Midnight_Memories_%28Official_Album_Cover%29.png',
  },

  // Bohol Earthquake
  {
    eventId: '9ba3e5e36480d5a5c8a781b40689bfbb',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/2013_Bohol_earthquake_damage_in_Tagbilaran.jpg/1200px-2013_Bohol_earthquake_damage_in_Tagbilaran.jpg',
  },

  // Little India Riot Singapore
  {
    eventId: '00f9e6f5bf67733ba33dd3692ccc8d54',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Little_India_Singapore_3.jpg/1200px-Little_India_Singapore_3.jpg',
  },

  // Sidemen YouTube
  {
    eventId: '160aae16611eb7831de1d291ba670068',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Logo_of_YouTube_%282015-2017%29.svg/1200px-Logo_of_YouTube_%282015-2017%29.svg.png',
  },

  // Madhya Pradesh Stampede
  {
    eventId: '2be40024b3c7b899b51c2b9028214a2e',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Ratangarh_Mata_Temple.jpg/1200px-Ratangarh_Mata_Temple.jpg',
  },

  // Beijing Terrorist Attack
  {
    eventId: '330f10f44dfc9787f0ba4ca96d1548d1',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Tiananmen_Square%2C_Beijing%2C_China_-_panoramio_%2817%29.jpg/1200px-Tiananmen_Square%2C_Beijing%2C_China_-_panoramio_%2817%29.jpg',
  },

  // Iranian Embassy Beirut Bombing
  {
    eventId: '5e9ed710c7a203b78c285ffca8d3410a',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Embassy_of_Iran%2C_Beirut.jpg/1200px-Embassy_of_Iran%2C_Beirut.jpg',
  },

  // Lao Airlines Flight 301
  {
    eventId: '95b4bca99fc24c2761527d7add3a8d14',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Lao_Airlines_ATR_72-600_at_Pakse.jpg/1200px-Lao_Airlines_ATR_72-600_at_Pakse.jpg',
  },

  // Tatarstan Airlines Flight 363
  {
    eventId: 'b0d7231a6ac30acf898eba5a69323a93',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Boeing_737-500_Tatarstan.jpg/1200px-Boeing_737-500_Tatarstan.jpg',
  },

  // November Tornado Outbreak
  {
    eventId: 'c39d96d9f2d74840b33d6953e7be7286',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/F5_tornado_Elie_Manitoba_2007.jpg/1200px-F5_tornado_Elie_Manitoba_2007.jpg',
  },

  // Medellín Building Collapse
  {
    eventId: 'f039bde5277b95ffbcbd9e2aa41402e3',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Medellin_Colombia.jpg/1200px-Medellin_Colombia.jpg',
  },
];

async function enrichEvents() {
  console.log('🔧 Starting event enrichment process...\n');

  const { firestore: db } = await bootstrapFirestore({});
  const eventsRef = db.collection('contentEvents');

  let updatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const enrichment of ENRICHMENTS) {
    const { eventId, imageUrl, beforeContext, afterContext } = enrichment;

    try {
      const eventDoc = await eventsRef.doc(eventId).get();

      if (!eventDoc.exists) {
        console.warn(`⚠️  Event ${eventId} not found, skipping...`);
        skippedCount++;
        continue;
      }

      const eventData = eventDoc.data();
      const updateData: Record<string, unknown> = {};

      // Add image URL to relatedPages array
      if (imageUrl) {
        const relatedPages = eventData?.relatedPages || [];

        // If relatedPages is empty, create a new entry
        if (relatedPages.length === 0) {
          relatedPages.push({
            pageId: 0,
            canonicalTitle: eventData?.text || 'Event',
            desktopUrl: '',
            mobileUrl: '',
            selectedMedia: {
              id: `manual-${eventId}`,
              sourceUrl: imageUrl,
              provider: 'wikimedia',
              assetType: 'original',
            },
          });
        } else {
          // Update existing first page's selectedMedia
          relatedPages[0] = {
            ...relatedPages[0],
            selectedMedia: {
              id: `manual-${eventId}`,
              sourceUrl: imageUrl,
              provider: 'wikimedia',
              assetType: 'original',
            },
          };
        }

        updateData.relatedPages = relatedPages;
      }

      // Add before/after context
      if (beforeContext) {
        updateData.beforeContext = beforeContext;
      }
      if (afterContext) {
        updateData.afterContext = afterContext;
      }

      if (Object.keys(updateData).length === 0) {
        console.log(`⏭️  No enrichment data for ${eventId}, skipping...`);
        skippedCount++;
        continue;
      }

      await eventDoc.ref.update(updateData);

      console.log(`✅ Updated: ${eventData?.text?.slice(0, 60)}...`);
      updatedCount++;
    } catch (error) {
      console.error(`❌ Error updating ${eventId}:`, error);
      errorCount++;
    }
  }

  console.log('\n═'.repeat(80));
  console.log('\n📊 ENRICHMENT SUMMARY\n');
  console.log(`   Total Enrichments: ${ENRICHMENTS.length}`);
  console.log(`   ✅ Updated: ${updatedCount}`);
  console.log(`   ⏭️  Skipped: ${skippedCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log('\n🎉 Enrichment complete!\n');
}

// Run the enrichment
enrichEvents().catch((error) => {
  console.error('❌ Enrichment failed:', error);
  process.exit(1);
});
