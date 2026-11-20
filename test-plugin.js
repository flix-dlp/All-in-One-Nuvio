/**
 * Comprehensive Test script for Nuvio & Euthopiar Provider Plugins
 * Verifies Castle VIP, NetMirror, 4KHDHub, and HDHub4u Standalone Scrapers
 */
const castle = require('./providers/castle.js');
const netmirror = require('./providers/netmirror.js');
const fourkhdhub = require('./providers/4khdhub.js');
const hdhub4u = require('./providers/hdhub4u.js');

async function testAll() {
  console.log('====================================================');
  console.log('🚀 TESTING ALL 4 STANDALONE NUVIO SCRAPERS');
  console.log('====================================================\n');

  // 1. Castle VIP (Interstellar - 157336)
  console.log('🧪 [1/4] Testing Castle Provider Plugin (Interstellar - 157336):');
  try {
    const castleStreams = await castle.getStreams('157336', 'movie');
    console.log(`✅ Castle returned ${castleStreams.length} streams:`);
    castleStreams.slice(0, 3).forEach((s, i) => console.log(`   [${i + 1}] ${s.name} (${s.quality}) - ${s.size}`));
  } catch (e) {
    console.error('❌ Castle test error:', e.message);
  }

  // 2. NetMirror (Interstellar - 157336)
  console.log('\n🧪 [2/4] Testing NetMirror Provider Plugin (Interstellar - 157336):');
  try {
    const nmStreams = await netmirror.getStreams('157336', 'movie');
    console.log(`✅ NetMirror returned ${nmStreams.length} streams:`);
    nmStreams.slice(0, 3).forEach((s, i) => console.log(`   [${i + 1}] ${s.name} (${s.quality}) - Subtitles: ${s.subtitles ? s.subtitles.length : 0}`));
  } catch (e) {
    console.error('❌ NetMirror test error:', e.message);
  }

  // 3. 4KHDHub (Interstellar - 157336)
  console.log('\n🧪 [3/4] Testing 4KHDHub Provider Plugin (Interstellar - 157336):');
  try {
    const hub4kStreams = await fourkhdhub.getStreams('157336', 'movie');
    console.log(`✅ 4KHDHub returned ${hub4kStreams.length} streams:`);
    hub4kStreams.slice(0, 3).forEach((s, i) => console.log(`   [${i + 1}] ${s.name} (${s.quality}) - ${s.size}`));
  } catch (e) {
    console.error('❌ 4KHDHub test error:', e.message);
  }

  // 4. HDHub4u (Interstellar - 157336)
  console.log('\n🧪 [4/4] Testing HDHub4u Provider Plugin (Interstellar - 157336):');
  try {
    const hdStreams = await hdhub4u.getStreams('157336', 'movie');
    console.log(`✅ HDHub4u returned ${hdStreams.length} streams:`);
    hdStreams.slice(0, 3).forEach((s, i) => console.log(`   [${i + 1}] ${s.name} (${s.quality}) - ${s.size}`));
  } catch (e) {
    console.error('❌ HDHub4u test error:', e.message);
  }

  // 5. IMDb ID Test (tt0816692) across 4KHDHub & HDHub4u
  console.log('\n🧪 [IMDb Test] Testing 4KHDHub & HDHub4u with IMDb ID tt0816692 (Interstellar):');
  try {
    const s1 = await fourkhdhub.getStreams('tt0816692', 'movie');
    console.log(`✅ 4KHDHub (tt0816692) returned ${s1.length} streams.`);
    const s2 = await hdhub4u.getStreams('tt0816692', 'movie');
    console.log(`✅ HDHub4u (tt0816692) returned ${s2.length} streams.`);
  } catch (e) {
    console.error('❌ IMDb resolution test error:', e.message);
  }

  // 6. tt13901986 check (He Who Must Die 1957)
  console.log('\n🧪 [User Case] Testing tt13901986 (He Who Must Die 1957):');
  try {
    const cStreams = await castle.getStreams('tt13901986', 'movie');
    console.log(`✅ Castle found ${cStreams.length} streams for tt13901986 (He Who Must Die 1957).`);
  } catch (e) {
    console.error('❌ Castle tt13901986 test error:', e.message);
  }

  console.log('\n====================================================');
  console.log('🎉 ALL SCRAPER TESTS COMPLETED');
  console.log('====================================================');
}

testAll();
