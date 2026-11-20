/**
 * ModFlix Local Bridge Provider for Nuvio
 * Routes queries through the high-performance native Rust engine (http://localhost:3000)
 * Works with both Movies and TV Shows (Castle VIP AES-128 + NetMirror)
 */

(function () {
  'use strict';

  var DEFAULT_SERVER = 'http://localhost:3000';

  function getServerUrl() {
    if (typeof globalThis !== 'undefined' && globalThis.__MODFLIX_SERVER__) {
      return globalThis.__MODFLIX_SERVER__;
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      var saved = window.localStorage.getItem('modflix_server_url');
      if (saved) return saved.replace(/\/+$/, '');
    }
    return DEFAULT_SERVER;
  }

  function getQualityOrder(q) {
    if (!q) return 0;
    var lower = q.toLowerCase();
    if (lower.includes('4k') || lower.includes('2160')) return 4;
    if (lower.includes('1080')) return 3;
    if (lower.includes('720')) return 2;
    if (lower.includes('480')) return 1;
    return 0;
  }

  function getStreams(tmdbId, mediaType, season, episode) {
    var baseUrl = getServerUrl();
    var type = mediaType || 'movie';

    // 1. Fetch title and metadata from Modflix server / TMDB
    var detailsUrl = baseUrl + '/api/details?id=' + encodeURIComponent(tmdbId) + '&type=' + type;

    return fetch(detailsUrl)
      .then(function (res) {
        if (!res.ok) throw new Error('Failed to fetch details from ModFlix server: ' + res.status);
        return res.json();
      })
      .then(function (details) {
        var title = details.title || details.name || '';
        if (!title) {
          title = tmdbId.toString();
        }

        // 2. Query streams endpoint
        var queryParams = [
          'id=' + encodeURIComponent(tmdbId),
          'q=' + encodeURIComponent(title),
          'type=' + encodeURIComponent(type)
        ];

        if (type === 'tv' && season) {
          queryParams.push('season=' + season);
          if (episode) queryParams.push('episode=' + episode);
        }

        var streamsUrl = baseUrl + '/api/streams?' + queryParams.join('&');
        return fetch(streamsUrl).then(function (sRes) {
          if (!sRes.ok) throw new Error('Streams request failed: ' + sRes.status);
          return sRes.json();
        });
      })
      .then(function (streams) {
        if (!Array.isArray(streams) || streams.length === 0) {
          return [];
        }

        // 3. Format streams according to Nuvio specifications
        var formatted = streams.map(function (s) {
          var proxyUrl = baseUrl + '/api/stream/proxy?url=' + encodeURIComponent(s.url);
          return {
            name: (s.provider === 'Castle' ? '🏰 ' : '🎬 ') + s.name,
            title: s.title || (s.provider + ' (' + s.quality + ')'),
            url: proxyUrl, // Proxied for CORS and direct mobile playback
            directUrl: s.url,
            quality: s.quality || 'Auto',
            size: s.size || '',
            headers: s.headers || {
              'User-Agent': 'Mozilla/5.0 (Linux; Android 13; Pixel 7)',
              'Referer': 'https://netmirror.app/'
            },
            subtitles: s.subtitles || []
          };
        });

        // Sort descending by quality (1080p > 720p > 480p)
        formatted.sort(function (a, b) {
          return getQualityOrder(b.quality) - getQualityOrder(a.quality);
        });

        return formatted;
      })
      .catch(function (err) {
        console.error('[ModFlix Nuvio Bridge] Error:', err);
        return [];
      });
  }

  // Export for Nuvio QuickJS, Hermes, CommonJS, and Window
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { getStreams: getStreams };
  }
  if (typeof globalThis !== 'undefined') {
    globalThis.getStreams = getStreams;
  }
  if (typeof window !== 'undefined') {
    window.getStreams = getStreams;
  }
})();
