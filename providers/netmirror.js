/**
 * NetMirror Provider for Nuvio & Euthopiar
 * Standalone Client-Side Provider - Zero Server / Localhost Required
 * Fetches High-Speed Streams with Multi-Audio & Subtitles (Hindi, English, etc.)
 */

(function () {
  'use strict';

  var BASE = 'https://net52.cc';
  var TMDB_KEY = '439c478a771f35c05022f9feabcca01c';
  var APP_USER_AGENT = 'Mozilla/5.0 (Linux; Android 13; Pixel 5 Build/TQ3A.230901.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/147.0.7727.55 Mobile Safari/537.36 /OS.Gatu v3.0';

  var PLAYBACK_HEADERS = {
    'User-Agent': APP_USER_AGENT,
    'Referer': BASE + '/mobile/home?app=1',
    'X-Requested-With': 'app.netmirror.netmirrornew',
    'Accept': '*/*',
    'Cookie': 'hd=on; user_type=vip'
  };

  function request(url, options) {
    options = options || {};
    options.headers = options.headers || {};
    if (!options.headers['User-Agent']) {
      options.headers['User-Agent'] = APP_USER_AGENT;
    }
    if (!options.headers['X-Requested-With']) {
      options.headers['X-Requested-With'] = 'app.netmirror.netmirrornew';
    }
    return fetch(url, options);
  }

  function resolveTitle(tmdbId, mediaType) {
    var isTv = mediaType === 'tv' || mediaType === 'series';
    var tmdbType = isTv ? 'tv' : 'movie';
    var cinemetaType = isTv ? 'series' : 'movie';

    // 1. Try standard TMDB API
    var tmdbUrl = 'https://api.themoviedb.org/3/' + tmdbType + '/' + tmdbId + '?api_key=' + TMDB_KEY;
    return request(tmdbUrl).then(function (res) {
      if (!res.ok) throw new Error('TMDB returned ' + res.status);
      return res.json();
    }).then(function (data) {
      var title = isTv ? data.name : data.title;
      var dateStr = isTv ? data.first_air_date : data.release_date;
      var year = dateStr ? parseInt(dateStr.split('-')[0]) : null;
      return { title: title, year: year, id: tmdbId };
    }).catch(function () {
      // 2. Try api.tmdb.org mirror
      var mirrorUrl = 'https://api.tmdb.org/3/' + tmdbType + '/' + tmdbId + '?api_key=' + TMDB_KEY;
      return request(mirrorUrl).then(function (res) {
        if (!res.ok) throw new Error('TMDB mirror error');
        return res.json();
      }).then(function (data) {
        var title = isTv ? data.name : data.title;
        var dateStr = isTv ? data.first_air_date : data.release_date;
        var year = dateStr ? parseInt(dateStr.split('-')[0]) : null;
        return { title: title, year: year, id: tmdbId };
      }).catch(function () {
        // 3. Fallback to Cinemeta if tmdbId is an IMDb ID
        if (typeof tmdbId === 'string' && tmdbId.startsWith('tt')) {
          var cUrl = 'https://v3-cinemeta.strem.io/meta/' + cinemetaType + '/' + tmdbId + '.json';
          return request(cUrl).then(function (res) {
            return res.json();
          }).then(function (cData) {
            if (cData && cData.meta && cData.meta.name) {
              return { title: cData.meta.name, year: parseInt(cData.meta.year) || null, id: tmdbId };
            }
            throw new Error('Cinemeta not found');
          });
        }
        throw new Error('Could not resolve title for TMDB ' + tmdbId);
      });
    });
  }

  function normalize(str) {
    return String(str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function parsePlaylistData(text) {
    try {
      return JSON.parse(text);
    } catch (e) {
      try {
        var fn = new Function('return ' + text);
        return fn();
      } catch (e2) {
        return null;
      }
    }
  }

  function getQualityValue(q) {
    if (!q) return 0;
    var s = q.toString().toLowerCase().replace(/^(sd|hd|fhd|uhd|4k)\s*/i, '').replace(/p$/, '').trim();
    var map = { '4k': 2160, '2160': 2160, '1440': 1440, '1080': 1080, '720': 720, '480': 480, '360': 360 };
    if (map[s]) return map[s];
    var n = parseInt(s);
    return isNaN(n) ? 0 : n;
  }

  function fetchPrimeVideo(title, year, mediaType, season, episode) {
    var searchUrl = BASE + '/mobile/pv/search.php?s=' + encodeURIComponent(title) + '&t=' + Math.floor(Date.now() / 1000);
    return request(searchUrl, {
      headers: {
        'Referer': BASE + '/mobile/home?app=1'
      }
    }).then(function (r) {
      if (!r.ok) return [];
      return r.json();
    }).then(function (data) {
      var results = Array.isArray(data.searchResult) ? data.searchResult : [];
      if (results.length === 0) return [];

      var wanted = normalize(title);
      results.sort(function (a, b) {
        var normA = normalize(a.t || a.title);
        var normB = normalize(b.t || b.title);
        var scoreA = normA === wanted ? 0 : (normA.includes(wanted) ? 1 : 2);
        var scoreB = normB === wanted ? 0 : (normB.includes(wanted) ? 1 : 2);
        return scoreA - scoreB;
      });

      var match = results[0];
      if (!match || !match.id) return [];

      var plUrl = BASE + '/mobile/pv/playlist.php?id=' + encodeURIComponent(match.id) + '&t=' + encodeURIComponent(title) + '&tm=' + Math.floor(Date.now() / 1000);
      return request(plUrl, {
        headers: {
          'Referer': BASE + '/mobile/home?app=1'
        }
      }).then(function (plRes) {
        if (!plRes.ok) return [];
        return plRes.text();
      }).then(function (rawText) {
        var pl = parsePlaylistData(rawText);
        if (!pl) return [];
        var entries = Array.isArray(pl) ? pl : [pl];
        var streams = [];

        for (var i = 0; i < entries.length; i++) {
          var item = entries[i];
          var sources = item.sources || [];
          var subs = [];

          if (Array.isArray(item.tracks)) {
            for (var t = 0; t < item.tracks.length; t++) {
              var tr = item.tracks[t];
              if (tr && tr.file) {
                var subUrl = tr.file.startsWith('http') ? tr.file : (tr.file.startsWith('//') ? 'https:' + tr.file : BASE + tr.file);
                var subLang = 'en';
                var lbl = (tr.label || '').toLowerCase();
                if (lbl.includes('hindi') || lbl.includes('हिन्दी')) subLang = 'hi';
                else if (lbl.includes('tamil') || lbl.includes('தமிழ்')) subLang = 'ta';
                else if (lbl.includes('telugu') || lbl.includes('తెలుగు')) subLang = 'te';

                subs.push({
                  name: tr.label || 'Subtitle',
                  language: subLang,
                  url: subUrl
                });
              }
            }
          }

          for (var s = 0; s < sources.length; s++) {
            var src = sources[s];
            if (!src || !src.file) continue;

            var streamUrl = src.file.startsWith('http') ? src.file : (src.file.startsWith('//') ? 'https:' + src.file : BASE + (src.file.startsWith('/') ? '' : '/') + src.file);
            streamUrl = streamUrl.replace(/hd=off/g, 'hd=on');
            var label = src.label || 'Auto';
            var quality = '1080p';
            if (label.includes('720') || /mid\s*hd/i.test(label)) quality = '720p';
            else if (label.includes('480') || /low\s*hd/i.test(label)) quality = '480p';
            else if (label.includes('1080') || /full\s*hd/i.test(label)) quality = '1080p';

            var streamTitle = title;
            if (mediaType === 'tv' && season && episode) {
              streamTitle += ' S' + String(season).padStart(2, '0') + 'E' + String(episode).padStart(2, '0');
            }
            streamTitle += ' - ' + label;

            streams.push({
              name: 'NetMirror (Prime) - ' + quality,
              title: streamTitle,
              url: streamUrl,
              quality: quality,
              headers: PLAYBACK_HEADERS,
              provider: 'netmirror',
              subtitles: subs,
              behaviorHints: {
                notWebReady: false
              }
            });
          }
        }

        return streams;
      });
    }).catch(function (err) {
      console.error('[NetMirror Provider] Error:', err.message);
      return [];
    });
  }

  function getStreams(tmdbId, mediaType, season, episode) {
    mediaType = mediaType || 'movie';

    return resolveTitle(tmdbId, mediaType).then(function (info) {
      if (!info || !info.title) throw new Error('Could not resolve title');

      return fetchPrimeVideo(info.title, info.year, mediaType, season, episode).then(function (streams) {
        if (streams && streams.length > 0) {
          streams.sort(function (a, b) {
            return getQualityValue(b.quality) - getQualityValue(a.quality);
          });
          return streams;
        }
        return [];
      });
    }).catch(function (e) {
      console.error('[NetMirror Provider] Failed:', e.message);
      return [];
    });
  }

  // Exports for QuickJS, Hermes, CommonJS, and Window
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
