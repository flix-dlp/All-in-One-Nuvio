/**
 * Test script for Nuvio & Euthopiar Provider Plugins
 * Verifies Castle VIP, NetMirror (Net77) & Bingr Multi-Source Scrapers
 */
try {
  var dns = require('dns');
  if (dns && dns.setDefaultResultOrder) dns.setDefaultResultOrder('ipv4first');
  var undici = require("undici");
  undici.setGlobalDispatcher(new undici.Agent({ connect: { lookup: (hostname, opts, cb) => dns.lookup(hostname, { family: 4 }, (err, address) => cb(err, [{ address, family: 4 }])) } }));
} catch (e) {}

const castle = require('./providers/castle.js');
const net77 = require('./providers/net77.js');
const bingr = require('./providers/bingr.js');

async function testAll() {
  console.log('====================================================');
  console.log('🚀 TESTING CASTLE VIP, NET77 & BINGR PLUGINS');
  console.log('====================================================\n');

  // 1. Castle VIP
  console.log('🧪 [1/3] Testing Castle Provider (Interstellar - 157336):');
  try {
    const castleStreams = await castle.getStreams('157336', 'movie');
    console.log(`✅ Castle returned ${castleStreams ? castleStreams.length : 0} streams:`);
    if (castleStreams && castleStreams.length > 0) {
      castleStreams.slice(0, 3).forEach((s, i) => console.log(`   [${i + 1}] ${s.name} (${s.quality}) - ${s.size}`));
    }
  } catch (e) {
    console.error('❌ Castle error:', e.message);
  }

  // 2. NetMirror (Net77)
  console.log('\n🧪 [2/3] Testing NetMirror Net77 Provider (Interstellar - 157336):');
  try {
    const n77Streams = await net77.getStreams('157336', 'movie', 1, 1);
    console.log(`✅ Net77 returned ${n77Streams ? n77Streams.length : 0} streams:`);
    if (n77Streams && n77Streams.length > 0) {
      n77Streams.slice(0, 3).forEach((s, i) => console.log(`   [${i + 1}] ${s.name} (${s.quality}) - ${s.url}`));
    }
  } catch (e) {
    console.error('❌ Net77 error:', e.message);
  }

  // 3. Bingr Multi-Source
  console.log('\n🧪 [3/3] Testing Bingr Provider (Interstellar - 157336):');
  try {
    const bStreams = await bingr.getStreams('157336', 'movie', 1, 1);
    console.log(`✅ Bingr returned ${bStreams ? bStreams.length : 0} streams:`);
    if (bStreams && bStreams.length > 0) {
      bStreams.slice(0, 3).forEach((s, i) => console.log(`   [${i + 1}] ${s.name} (${s.quality}) - ${s.url}`));
    }
  } catch (e) {
    console.error('❌ Bingr error:', e.message);
  }

  // 4. TV Series test (From S01E01)
  console.log('\n🧪 [TV Series Test] Testing From S01E01 (tt9813792 / 124364):');
  try {
    const cFrom = await castle.getStreams('124364', 'tv', 1, 1);
    console.log(`✅ Castle returned ${cFrom ? cFrom.length : 0} streams for From S01E01`);
    const nFrom = await net77.getStreams('124364', 'tv', 1, 1);
    console.log(`✅ Net77 returned ${nFrom ? nFrom.length : 0} streams for From S01E01`);
    const bFrom = await bingr.getStreams('124364', 'tv', 1, 1);
    console.log(`✅ Bingr returned ${bFrom ? bFrom.length : 0} streams for From S01E01`);
  } catch (e) {
    console.error('❌ TV Series test error:', e.message);
  }

  console.log('\n====================================================');
  console.log('🏁 All Tests Finished!');
  console.log('====================================================');
}

testAll().catch(console.error);
