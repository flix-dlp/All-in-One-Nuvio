/**
 * Test script for Nuvio & Euthopiar Provider Plugins
 */
const castle = require('./providers/castle.js');
const modflix = require('./providers/modflix.js');

async function testAll() {
  console.log('🧪 Testing Standalone Castle Provider Plugin:');
  try {
    const castleStreams = await castle.getStreams('157336', 'movie');
    console.log(`✅ Castle standalone returned ${castleStreams.length} streams:`);
    castleStreams.forEach((s, i) => console.log(`   [${i + 1}] ${s.name} (${s.quality})`));
  } catch (e) {
    console.error('❌ Castle test error:', e);
  }

  console.log('\n🧪 Testing ModFlix Bridge Provider Plugin:');
  try {
    const bridgeStreams = await modflix.getStreams('157336', 'movie');
    console.log(`✅ ModFlix bridge returned ${bridgeStreams.length} streams:`);
    bridgeStreams.slice(0, 3).forEach((s, i) => console.log(`   [${i + 1}] ${s.name} (${s.quality})`));
  } catch (e) {
    console.error('❌ ModFlix bridge error:', e);
  }
}

testAll();
