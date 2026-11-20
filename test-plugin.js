/**
 * Test script for Nuvio & Euthopiar Provider Plugins
 * Verifies both Castle VIP and NetMirror Standalone Scrapers
 */
const castle = require('./providers/castle.js');
const netmirror = require('./providers/netmirror.js');

async function testAll() {
  console.log('🧪 Testing Standalone Castle Provider Plugin:');
  try {
    const castleStreams = await castle.getStreams('157336', 'movie');
    console.log(`✅ Castle standalone returned ${castleStreams.length} streams:`);
    castleStreams.forEach((s, i) => console.log(`   [${i + 1}] ${s.name} (${s.quality}) - ${s.size}`));
  } catch (e) {
    console.error('❌ Castle test error:', e);
  }

  console.log('\n🧪 Testing Standalone NetMirror Provider Plugin:');
  try {
    const nmStreams = await netmirror.getStreams('157336', 'movie');
    console.log(`✅ NetMirror standalone returned ${nmStreams.length} streams:`);
    nmStreams.forEach((s, i) => console.log(`   [${i + 1}] ${s.name} (${s.quality}) - Subtitles: ${s.subtitles.length}`));
  } catch (e) {
    console.error('❌ NetMirror test error:', e);
  }
}

testAll();
