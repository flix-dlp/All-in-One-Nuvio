/**
 * Test script for Nuvio & Euthopiar Provider Plugins
 * Verifies Castle VIP and MovieBox Pro Standalone Scrapers
 */
const castle = require('./providers/castle.js');
const moviebox = require('./providers/moviebox.js');

async function testAll() {
  console.log('====================================================');
  console.log('🚀 TESTING CASTLE VIP & MOVIEBOX PRO');
  console.log('====================================================\n');

  // 1. Castle VIP
  console.log('🧪 [1/2] Testing Castle Provider (Interstellar - 157336):');
  try {
    const castleStreams = await castle.getStreams('157336', 'movie');
    console.log(`✅ Castle returned ${castleStreams.length} streams:`);
    castleStreams.slice(0, 3).forEach((s, i) => console.log(`   [${i + 1}] ${s.name} (${s.quality}) - ${s.size}`));
  } catch (e) {
    console.error('❌ Castle error:', e.message);
  }

  // 2. MovieBox Pro
  console.log('\n🧪 [2/2] Testing MovieBox Provider (Interstellar - 157336):');
  try {
    const mbStreams = await moviebox.getStreams('157336', 'movie');
    console.log(`✅ MovieBox returned ${mbStreams.length} streams:`);
    mbStreams.slice(0, 4).forEach((s, i) => console.log(`   [${i + 1}] ${s.name} (${s.quality}) - ${s.size}`));
  } catch (e) {
    console.error('❌ MovieBox error:', e.message);
  }

  // 3. MovieBox Pro IMDb ID test
  console.log('\n🧪 [IMDb Test] Testing MovieBox (Interstellar IMDb - tt0816692):');
  try {
    const mbImdb = await moviebox.getStreams('tt0816692', 'movie');
    console.log(`✅ MovieBox (tt0816692) returned ${mbImdb.length} streams.`);
  } catch (e) {
    console.error('❌ MovieBox IMDb error:', e.message);
  }

  console.log('\n====================================================');
  console.log('🎉 TESTS COMPLETED SUCCESSFULLY');
  console.log('====================================================');
}

testAll();
