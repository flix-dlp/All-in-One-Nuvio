/**
 * Comprehensive Test script for Nuvio & Euthopiar Provider Plugins
 * Verifies Castle VIP, NetMirror, 4KHDHub, HDHub4u, and MovieBox Standalone Scrapers
 */
const castle = require('./providers/castle.js');
const netmirror = require('./providers/netmirror.js');
const fourkhdhub = require('./providers/4khdhub.js');
const hdhub4u = require('./providers/hdhub4u.js');
const moviebox = require('./providers/moviebox.js');

async function testAll() {
  console.log('====================================================');
  console.log('🚀 TESTING ALL 5 STANDALONE NUVIO SCRAPERS');
  console.log('====================================================\n');

  // 1. Castle VIP (Interstellar - 157336)
  console.log('🧪 [1/5] Testing Castle Provider Plugin (Interstellar - 157336):');
  try {
    const castleStreams = await castle.getStreams('157336', 'movie');
    console.log(`✅ Castle returned ${castleStreams.length} streams:`);
    castleStreams.slice(0, 3).forEach((s, i) => console.log(`   [${i + 1}] ${s.name} (${s.quality}) - ${s.size}`));
  } catch (e) {
    console.error('❌ Castle test error:', e.message);
  }

  // 2. NetMirror (Interstellar - 157336)
  console.log('\n🧪 [2/5] Testing NetMirror Provider Plugin (Interstellar - 157336):');
  try {
    const nmStreams = await netmirror.getStreams('157336', 'movie');
    console.log(`✅ NetMirror returned ${nmStreams.length} streams:`);
    nmStreams.slice(0, 3).forEach((s, i) => console.log(`   [${i + 1}] ${s.name} (${s.quality}) - Subtitles: ${s.subtitles ? s.subtitles.length : 0}`));
  } catch (e) {
    console.error('❌ NetMirror test error:', e.message);
  }

  // 3. 4KHDHub (Interstellar - 157336)
  console.log('\n🧪 [3/5] Testing 4KHDHub Provider Plugin (Interstellar - 157336):');
  try {
    const hub4kStreams = await fourkhdhub.getStreams('157336', 'movie');
    console.log(`✅ 4KHDHub returned ${hub4kStreams.length} streams:`);
    hub4kStreams.slice(0, 3).forEach((s, i) => console.log(`   [${i + 1}] ${s.name} (${s.quality}) - ${s.size}`));
  } catch (e) {
    console.error('❌ 4KHDHub test error:', e.message);
  }

  // 4. HDHub4u (Interstellar - 157336)
  console.log('\n🧪 [4/5] Testing HDHub4u Provider Plugin (Interstellar - 157336):');
  try {
    const hdStreams = await hdhub4u.getStreams('157336', 'movie');
    console.log(`✅ HDHub4u returned ${hdStreams.length} streams:`);
    hdStreams.slice(0, 3).forEach((s, i) => console.log(`   [${i + 1}] ${s.name} (${s.quality}) - ${s.size}`));
  } catch (e) {
    console.error('❌ HDHub4u test error:', e.message);
  }

  // 5. MovieBox Pro (Interstellar - 157336)
  console.log('\n🧪 [5/5] Testing MovieBox Provider Plugin (Interstellar - 157336):');
  try {
    const mbStreams = await moviebox.getStreams('157336', 'movie');
    console.log(`✅ MovieBox returned ${mbStreams.length} streams:`);
    mbStreams.slice(0, 4).forEach((s, i) => console.log(`   [${i + 1}] ${s.name} (${s.quality}) - ${s.size}`));
  } catch (e) {
    console.error('❌ MovieBox test error:', e.message);
  }

  // 6. MovieBox Pro (IMDb ID tt0816692)
  console.log('\n🧪 [MovieBox IMDb] Testing MovieBox with IMDb ID tt0816692:');
  try {
    const mbImdbStreams = await moviebox.getStreams('tt0816692', 'movie');
    console.log(`✅ MovieBox (tt0816692) returned ${mbImdbStreams.length} streams.`);
  } catch (e) {
    console.error('❌ MovieBox IMDb test error:', e.message);
  }

  console.log('\n====================================================');
  console.log('🎉 ALL 5 SCRAPER TESTS COMPLETED');
  console.log('====================================================');
}

testAll();
