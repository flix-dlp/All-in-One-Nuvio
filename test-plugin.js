/**
 * Test script for Nuvio Provider Plugins
 */
const { getStreams } = require('./providers/modflix.js');

async function runTest() {
  console.log('🧪 Testing Nuvio Provider Plugin: modflix.js');
  console.log('Querying streams for "Interstellar" (TMDB 157336)...');

  try {
    const streams = await getStreams(157336, 'movie');
    console.log(`\n✅ Success! Received ${streams.length} streams for Nuvio:\n`);
    streams.forEach((s, idx) => {
      console.log(`[${idx + 1}] ${s.name} (${s.quality})`);
      console.log(`    URL: ${s.url.substring(0, 75)}...`);
    });

    if (streams.length === 0) {
      console.error('❌ Warning: No streams returned. Is ModFlix server running on http://localhost:3000?');
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Plugin test failed with error:', err);
    process.exit(1);
  }
}

runTest();
