/**
 * NetMirror Provider for Nuvio
 * Extracts Netflix, Prime, Hotstar & Disney content with Multi-Audio
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

  function getStreams(tmdbId, mediaType, season, episode) {
    var baseUrl = getServerUrl();
    var type = mediaType || 'movie';

    // 1. Resolve title from TMDB
    var detailsUrl = baseUrl + '/api/details?id=' + encodeURIComponent(tmdbId) + '&type=' + type;

    return fetch(detailsUrl)
      .then(function (res) {
        if (!res.ok) throw new Error('Details fetch failed');
        return res.json();
      })
      .then(function (details) {
        var title = details.title || details.name || tmdbId.toString();

        var params = [
          'q=' + encodeURIComponent(title)
        ];
        if (type === 'tv' && season) {
          params.push('season=' + season);
          if (episode) params.push('episode=' + episode);
        }

        // Direct Netmirror stream endpoint on ModFlix server
        var url = baseUrl + '/api/netmirror/streams?' + params.join('&');
        return fetch(url).then(function (r) {
          if (!r.ok) return [];
          return r.json();
        });
      })
      .then(function (streams) {
        if (!Array.isArray(streams)) return [];
        return streams.map(function (s) {
          var proxyUrl = baseUrl + '/api/stream/proxy?url=' + encodeURIComponent(s.url);
          return {
            name: '🎬 ' + s.name,
            title: s.title || ('NetMirror (' + s.quality + ')'),
            url: proxyUrl,
            directUrl: s.url,
            quality: s.quality || 'Auto',
            size: s.size || '',
            headers: s.headers || {},
            subtitles: s.subtitles || []
          };
        });
      })
      .catch(function (err) {
        console.error('[NetMirror Provider] Error:', err);
        return [];
      });
  }

  // Export for Nuvio
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
