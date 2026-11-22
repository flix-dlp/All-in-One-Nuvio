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

  // 5. One Piece Anime vs Live-Action Verification
  console.log('\n🧪 [Anime vs Live Action Test] Testing One Piece Anime S01E01 (TMDB 37854):');
  try {
    const cAnime = await castle.getStreams('37854', 'tv', 1, 1);
    console.log(`✅ Castle Anime returned ${cAnime ? cAnime.length : 0} streams`);
    if (cAnime && cAnime.length > 0) {
      console.log(`   Sample: ${cAnime[0].name} (${cAnime[0].quality}) - ${cAnime[0].size}`);
    }
    const bAnime = await bingr.getStreams('37854', 'tv', 1, 1);
    console.log(`✅ Bingr Anime returned ${bAnime ? bAnime.length : 0} streams`);
    if (bAnime && bAnime.length > 0) {
      console.log(`   Sample: ${bAnime[0].name} (${bAnime[0].quality}) - ${bAnime[0].url.substring(0, 80)}`);
    }
  } catch (e) {
    console.error('❌ Anime test error:', e.message);
  }

  console.log('\n🧪 [Anime vs Live Action Test] Testing One Piece Live Action S01E01 (TMDB 111110):');
  try {
    const cLive = await castle.getStreams('111110', 'tv', 1, 1);
    console.log(`✅ Castle Live Action returned ${cLive ? cLive.length : 0} streams`);
    if (cLive && cLive.length > 0) {
      console.log(`   Sample: ${cLive[0].name} (${cLive[0].quality}) - ${cLive[0].size}`);
    }
    const nLive = await net77.getStreams('111110', 'tv', 1, 1);
    console.log(`✅ Net77 Live Action returned ${nLive ? nLive.length : 0} streams`);
    if (nLive && nLive.length > 0) {
      console.log(`   Sample: ${nLive[0].name} (${nLive[0].quality}) - ${nLive[0].url.substring(0, 80)}`);
    }
  } catch (e) {
    console.error('❌ Live Action test error:', e.message);
  }

  console.log('\n====================================================');
  console.log('🏁 All Tests Finished!');
  console.log('====================================================');
}

testAll().catch(console.error);
