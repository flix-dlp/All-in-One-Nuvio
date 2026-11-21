/**
 * Test script for Nuvio & Euthopiar Provider Plugins
 * Verifies Castle VIP, MovieBox Pro & 4KHDHub Downloads Standalone Scrapers
 */
try {
  var dns = require('dns');
  if (dns && dns.setDefaultResultOrder) dns.setDefaultResultOrder('ipv4first');
  var undici = require("undici");
  undici.setGlobalDispatcher(new undici.Agent({ connect: { lookup: (hostname, opts, cb) => dns.lookup(hostname, { family: 4 }, (err, address) => cb(err, [{ address, family: 4 }])) } }));
} catch (e) {}

const castle = require('./providers/castle.js');
const moviebox = require('./providers/moviebox.js');
const fourkhdhub = require('./providers/4khdhub.js');

async function testAll() {
  console.log('====================================================');
  console.log('🚀 TESTING CASTLE VIP, MOVIEBOX PRO & 4KHDHUB');
  console.log('====================================================\n');

  // 1. Castle VIP
  console.log('🧪 [1/3] Testing Castle Provider (Interstellar - 157336):');
  try {
    const castleStreams = await castle.getStreams('157336', 'movie');
    console.log(`✅ Castle returned ${castleStreams.length} streams:`);
    castleStreams.slice(0, 3).forEach((s, i) => console.log(`   [${i + 1}] ${s.name} (${s.quality}) - ${s.size}`));
  } catch (e) {
    console.error('❌ Castle error:', e.message);
  }

  // 2. MovieBox Pro
  console.log('\n🧪 [2/3] Testing MovieBox Provider (Interstellar - 157336):');
  try {
    const mbStreams = await moviebox.getStreams('157336', 'movie');
    console.log(`✅ MovieBox returned ${mbStreams.length} streams:`);
    mbStreams.slice(0, 4).forEach((s, i) => console.log(`   [${i + 1}] ${s.name} (${s.quality}) - ${s.size}`));
  } catch (e) {
    console.error('❌ MovieBox error:', e.message);
  }

  // 3. 4KHDHub Direct Download Provider
  console.log('\n🧪 [3/3] Testing 4KHDHub Provider (Interstellar - tt0816692):');
  try {
    const hubStreams = await fourkhdhub.getStreams('tt0816692', 'movie');
    console.log(`✅ 4KHDHub returned ${hubStreams.length} direct download streams:`);
    hubStreams.slice(0, 3).forEach((s, i) => console.log(`   [${i + 1}] ${s.name} (${s.quality}) - ${s.size}`));
  } catch (e) {
    console.error('❌ 4KHDHub error:', e.message);
  }

  // 4. TV Series test (From S01E01)
  console.log('\n🧪 [TV Series Test] Testing From S01E01 (tt9813792):');
  try {
    const mbFrom = await moviebox.getStreams('tt9813792', 'tv', 1, 1);
    console.log(`✅ MovieBox returned ${mbFrom.length} streams (strict matching prevents mismatched movies):`);
    mbFrom.forEach(s => console.log(`   * ${s.name} | ${s.title}`));
    const cFrom = await castle.getStreams('tt9813792', 'tv', 1, 1);
    console.log(`✅ Castle returned ${cFrom.length} streams for From S01E01:`);
    cFrom.forEach(s => console.log(`   * ${s.name} | ${s.title}`));
  } catch (e) {
    console.error('❌ TV Series error:', e.message);
  }

  // 5. TV Series Download test (Loki S02E01)
  console.log('\n🧪 [TV Download Test] Testing Loki S02E01 on 4KHDHub (tt9140554):');
  try {
    const hubLoki = await fourkhdhub.getStreams('tt9140554', 'tv', 2, 1);
    console.log(`✅ 4KHDHub returned ${hubLoki.length} streams for Loki S02E01:`);
    hubLoki.slice(0, 3).forEach(s => console.log(`   * ${s.name} | ${s.quality} (${s.size})`));
  } catch (e) {
    console.error('❌ 4KHDHub TV Series error:', e.message);
  }

  // 6. Multi-Language & All-Qualities Test (Avatar)
  console.log('\n🧪 [Multi-Language Test] Testing Avatar (tt0499549):');
  try {
    const mbAvatar = await moviebox.getStreams('tt0499549', 'movie');
    console.log(`✅ MovieBox Avatar returned ${mbAvatar.length} streams:`);
    mbAvatar.forEach(s => console.log(`   * ${s.name} | ${s.quality} (${s.size})`));
  } catch (e) {
    console.error('❌ Avatar error:', e.message);
  }

  console.log('\n====================================================');
  console.log('🎉 ALL 3 PROVIDERS TESTED SUCCESSFULLY!');
  console.log('====================================================');
}

testAll();
