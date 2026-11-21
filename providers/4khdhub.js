"use strict";

/**
 * 4KHDHub Direct High-Speed Download & Streaming Provider for Nuvio
 * Resolves HubCloud, PixelDrain, Cloudflare R2, Workers & Direct CDN downloads.
 * 
 * Features:
 * - GreenMotors 4-step deobfuscation (Base64 -> Base64 -> ROT13 -> Base64 -> JSON)
 * - HubDrive & HubCloud drive resolver
 * - Direct PixelDrain API download extraction (https://pixeldrain.com/api/file/{id}?download)
 * - HubCloud 10Gbps Google Usercontent / R2 / Workers CDN resolver
 * - Strict TV Series & Movie matching (No mismatch)
 * - Multi-Audio & Multi-Quality extraction (4K 2160p, 1080p, 720p, 480p)
 * - Pure ES5 / QuickJS standalone zero-server compatible
 */

var TMDB_API_KEY = "439c478a771f35c05022f9feabcca01c";
var DEFAULT_DOMAINS = ["https://4khdhub.one", "https://4khdhub.click"];
var USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

var cheerio;
try {
  cheerio = require("cheerio-without-node-native");
} catch (e1) {
  try {
    cheerio = require("cheerio");
  } catch (e2) {}
}

// -------------------------------------------------------------
// Base64 & ROT13 Polyfills (ES5 / QuickJS safe)
// -------------------------------------------------------------
function b64Decode(input) {
  if (typeof Buffer !== "undefined") {
    try {
      return Buffer.from(input, "base64").toString("utf-8");
    } catch (_) {}
  }
  var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  var str = String(input).replace(/=+$/, "");
  if (str.length % 4 === 1) return "";
  var output = "";
  for (var bc = 0, bs, buffer, i = 0; (buffer = str.charAt(i++)); ~buffer && ((bs = bc % 4 ? bs * 64 + buffer : buffer), bc++ % 4) ? (output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6)))) : 0) {
    buffer = chars.indexOf(buffer);
  }
  return output;
}

function rot13(str) {
  if (!str) return "";
  return str.replace(/[a-zA-Z]/g, function (c) {
    return String.fromCharCode((c <= "Z" ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26);
  });
}

function levenshtein(s, t) {
  if (s === t) return 0;
  var n = s.length;
  var m = t.length;
  if (n === 0) return m;
  if (m === 0) return n;
  var d = [];
  for (var i = 0; i <= n; i++) {
    d[i] = [];
    d[i][0] = i;
  }
  for (var j = 0; j <= m; j++) {
    d[0][j] = j;
  }
  for (var i = 1; i <= n; i++) {
    for (var j = 1; j <= m; j++) {
      var cost = s.charAt(i - 1) === t.charAt(j - 1) ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
    }
  }
  return d[n][m];
}

function formatBytes(val) {
  if (!val || val === 0) return "";
  if (typeof val === "string") return val;
  var k = 1024;
  var sizes = ["B", "KB", "MB", "GB", "TB"];
  var i = Math.floor(Math.log(val) / Math.log(k));
  if (i < 0) i = 0;
  return parseFloat((val / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function parseBytes(val) {
  if (typeof val === "number") return val;
  if (!val) return 0;
  var match = String(val).match(/([0-9.]+)\s*([a-zA-Z]+)/);
  if (!match) return 0;
  var num = parseFloat(match[1]);
  var unit = match[2].toLowerCase();
  var multiplier = 1;
  if (unit.indexOf("k") === 0) multiplier = 1024;
  else if (unit.indexOf("m") === 0) multiplier = 1024 * 1024;
  else if (unit.indexOf("g") === 0) multiplier = 1024 * 1024 * 1024;
  else if (unit.indexOf("t") === 0) multiplier = 1024 * 1024 * 1024 * 1024;
  return num * multiplier;
}

// -------------------------------------------------------------
// HTTP Utilities with IPv4 / Retries / Headers
// -------------------------------------------------------------
function fetchText(url, options) {
  options = options || {};
  var headers = Object.assign({
    "User-Agent": USER_AGENT,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5"
  }, options.headers || {});

  var retries = options.retries !== undefined ? options.retries : 2;
  var timeout = options.timeout || 12000;

  return new Promise(function (resolve) {
    function attempt(n) {
      var controller = (typeof AbortController !== "undefined") ? new AbortController() : null;
      var timer = controller ? setTimeout(function () { controller.abort(); }, timeout) : null;

      fetch(url, {
        method: options.method || "GET",
        headers: headers,
        redirect: options.redirect || "follow",
        signal: controller ? controller.signal : undefined
      }).then(function (res) {
        if (timer) clearTimeout(timer);
        if (!res.ok) {
          if (n < retries) {
            setTimeout(function () { attempt(n + 1); }, 600);
          } else {
            resolve(null);
          }
          return;
        }
        return res.text();
      }).then(function (body) {
        if (body !== undefined) resolve(body);
      }).catch(function () {
        if (timer) clearTimeout(timer);
        if (n < retries) {
          setTimeout(function () { attempt(n + 1); }, 600);
        } else {
          resolve(null);
        }
      });
    }
    attempt(0);
  });
}

// -------------------------------------------------------------
// TMDB & Cinemeta Metadata Extraction
// -------------------------------------------------------------
function getTmdbDetails(tmdbId, type) {
  return new Promise(function (resolve) {
    var isSeries = type === "series" || type === "tv";
    var endpoint = isSeries ? "tv" : "movie";
    var isImdb = typeof tmdbId === "string" && tmdbId.indexOf("tt") === 0;

    // 1. If IMDb ID, Cinemeta first (handles tt... in ~100ms)
    if (isImdb) {
      var cUrl = "https://v3-cinemeta.strem.io/meta/" + (isSeries ? "series" : "movie") + "/" + tmdbId + ".json";
      fetch(cUrl).then(function (res) {
        return res.ok ? res.json() : null;
      }).then(function (data) {
        if (data && data.meta && data.meta.name) {
          var y = parseInt(data.meta.year) || (data.meta.releaseInfo ? parseInt(data.meta.releaseInfo) : 0);
          resolve({ title: data.meta.name, year: y });
          return;
        }
        fallbackTmdb();
      }).catch(function () {
        fallbackTmdb();
      });
      return;
    }

    fallbackTmdb();

    function fallbackTmdb() {
      var mirrors = [
        "https://api.tmdb.org/3/" + endpoint + "/" + tmdbId + "?api_key=" + TMDB_API_KEY,
        "https://api.themoviedb.org/3/" + endpoint + "/" + tmdbId + "?api_key=" + TMDB_API_KEY
      ];
      if (isImdb) {
        mirrors.unshift("https://api.tmdb.org/3/find/" + tmdbId + "?external_source=imdb_id&api_key=" + TMDB_API_KEY);
      }

      function tryMirror(idx) {
        if (idx >= mirrors.length) {
          resolve(null);
          return;
        }
        fetch(mirrors[idx]).then(function (res) {
          return res.ok ? res.json() : null;
        }).then(function (data) {
          if (!data) {
            tryMirror(idx + 1);
            return;
          }
          if (data.tv_results || data.movie_results) {
            var item = isSeries ? (data.tv_results && data.tv_results[0]) : (data.movie_results && data.movie_results[0]);
            if (item) {
              var yr = parseInt((isSeries ? item.first_air_date : item.release_date || "").split("-")[0]) || 0;
              resolve({ title: isSeries ? item.name : item.title, year: yr });
              return;
            }
          } else if (data.name || data.title) {
            var year = parseInt((isSeries ? data.first_air_date : data.release_date || "").split("-")[0]) || 0;
            resolve({ title: isSeries ? data.name : data.title, year: year });
            return;
          }
          tryMirror(idx + 1);
        }).catch(function () {
          tryMirror(idx + 1);
        });
      }
      tryMirror(0);
    }
  });
}

// -------------------------------------------------------------
// Search & Catalog Matching on 4KHDHub
// -------------------------------------------------------------
function search4KHdHub(title, year, isSeries) {
  return new Promise(function (resolve) {
    var queries = year ? [title + " " + year, title] : [title];
    var domainIdx = 0;

    function tryDomain() {
      if (domainIdx >= DEFAULT_DOMAINS.length) {
        resolve(null);
        return;
      }
      var domain = DEFAULT_DOMAINS[domainIdx];
      var queryIdx = 0;

      function tryQuery() {
        if (queryIdx >= queries.length) {
          domainIdx++;
          tryDomain();
          return;
        }
        var q = queries[queryIdx];
        var searchUrl = domain + "/?s=" + encodeURIComponent(q);

        fetchText(searchUrl).then(function (html) {
          if (!html) {
            queryIdx++;
            tryQuery();
            return;
          }

          var cardMatches = [...html.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*class=["'][^"']*movie-card[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi)];
          if (cardMatches.length === 0) {
            // Alternative match: class before href
            cardMatches = [...html.matchAll(/<a[^>]+class=["'][^"']*movie-card[^"']*["'][^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)];
          }

          var bestMatch = null;
          var lowestDistance = 999;

          for (var i = 0; i < cardMatches.length; i++) {
            var href = cardMatches[i][1];
            var innerHtml = cardMatches[i][2];

            // Distinguish TV series vs Movies
            var isSeriesHref = href.indexOf("-series-") !== -1 || innerHtml.indexOf("• S") !== -1;
            if (isSeries && !isSeriesHref) continue;
            if (!isSeries && isSeriesHref) continue;

            // Extract card title
            var titleMatch = innerHtml.match(/class=["']movie-card-title["'][^>]*>([\s\S]*?)<\/h\d>/i);
            var cardTitle = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "").replace(/\[.*?\]/g, "").trim() : "";
            if (!cardTitle) continue;

            // Extract card year
            var metaMatch = innerHtml.match(/class=["']movie-card-meta["'][^>]*>([\s\S]*?)<\/p>/i);
            var metaText = metaMatch ? metaMatch[1].replace(/<[^>]+>/g, "").trim() : "";
            var cardYearMatch = metaText.match(/\b(19\d\d|20\d\d)\b/);
            var cardYear = cardYearMatch ? parseInt(cardYearMatch[1]) : 0;

            var cleanCardTitle = cardTitle.toLowerCase().replace(/[^a-z0-9]/g, "");
            var cleanTargetTitle = title.toLowerCase().replace(/[^a-z0-9]/g, "");

            var isExact = cleanCardTitle === cleanTargetTitle;
            var isSub = cleanCardTitle.indexOf(cleanTargetTitle) !== -1 || cleanTargetTitle.indexOf(cleanCardTitle) !== -1;
            var dist = levenshtein(cleanCardTitle, cleanTargetTitle);

            var yearOk = !year || !cardYear || Math.abs(cardYear - year) <= 2;

            if (yearOk && (isExact || isSub || dist <= 3)) {
              if (dist < lowestDistance) {
                lowestDistance = dist;
                var fullUrl = href.indexOf("http") === 0 ? href : domain + (href.indexOf("/") === 0 ? "" : "/") + href;
                bestMatch = { url: fullUrl, domain: domain };
                if (isExact) break; // Exact match found
              }
            }
          }

          if (bestMatch) {
            resolve(bestMatch);
          } else {
            queryIdx++;
            tryQuery();
          }
        }).catch(function () {
          queryIdx++;
          tryQuery();
        });
      }
      tryQuery();
    }
    tryDomain();
  });
}

// -------------------------------------------------------------
// Mirror Resolvers (GreenMotors, HubDrive, HubCloud, PixelDrain)
// -------------------------------------------------------------
function resolveGreenMotors(url) {
  return new Promise(function (resolve) {
    if (!url || (url.indexOf("greenmotors.") === -1 && url.indexOf("greenmountmotors.") === -1)) {
      resolve(url);
      return;
    }
    fetchText(url, { headers: { "Referer": url } }).then(function (html) {
      if (!html) {
        resolve(null);
        return;
      }
      // Match s('o', 'PAYLOAD') or s("o", "PAYLOAD")
      var m = html.match(/s\(\s*['"]o['"]\s*,\s*['"]([^'"]+)['"]/);
      if (!m) {
        resolve(null);
        return;
      }
      try {
        var step1 = b64Decode(m[1]);
        var step2 = b64Decode(step1);
        var step3 = rot13(step2);
        var step4 = b64Decode(step3);
        var obj = JSON.parse(step4);
        if (obj && obj.o) {
          var target = b64Decode(obj.o);
          resolve(target);
          return;
        }
      } catch (err) {}
      resolve(null);
    }).catch(function () {
      resolve(null);
    });
  });
}

function resolveHubDrive(url) {
  return new Promise(function (resolve) {
    if (!url || url.indexOf("hubdrive.") === -1) {
      resolve(url);
      return;
    }
    fetchText(url, { headers: { "Referer": url } }).then(function (html) {
      if (!html) {
        resolve(null);
        return;
      }
      var m = html.match(/href=["']([^"']*hubcloud\.[^"']*\/drive\/[^"']*)["']/i);
      if (m) {
        resolve(m[1]);
      } else {
        resolve(null);
      }
    }).catch(function () {
      resolve(null);
    });
  });
}

function resolveHubCloudDirectStreams(hubCloudUrl, baseMeta) {
  return new Promise(function (resolve) {
    if (!hubCloudUrl || (hubCloudUrl.indexOf("hubcloud.") === -1 && hubCloudUrl.indexOf("hubdrive.") === -1)) {
      resolve([]);
      return;
    }

    fetchText(hubCloudUrl, { headers: { "Referer": hubCloudUrl } }).then(function (driveHtml) {
      if (!driveHtml) {
        resolve([]);
        return;
      }

      // Look for download resolver button on HubCloud drive page
      var resolverUrl = null;
      var btnMatch = driveHtml.match(/<a[^>]+id=["']download["'][^>]+href=["']([^"']+)["']/i) ||
                     driveHtml.match(/<a[^>]+href=["']([^"']*(?:hubcloud\.php|gamerxyt\.com|\/download\/)[^"']*)["']/i) ||
                     driveHtml.match(/var\s+url\s*=\s*['"]([^'"]+)['"]/i);
      if (btnMatch) {
        resolverUrl = btnMatch[1];
      }
      if (!resolverUrl) {
        resolve([]);
        return;
      }

      // Fetch the actual resolver page
      fetchText(resolverUrl, { headers: { "Referer": hubCloudUrl } }).then(function (resolverHtml) {
        if (!resolverHtml) {
          resolve([]);
          return;
        }

        var streams = [];

        // 1. PixelDrain Direct Downloads (Fastest & Resume supported)
        var pdMatches = [...resolverHtml.matchAll(/https?:\/\/pixeldrain\.(?:com|dev)\/(?:u|api\/file)\/([a-zA-Z0-9_-]+)/g)];
        var seenPd = {};
        for (var i = 0; i < pdMatches.length; i++) {
          var fileId = pdMatches[i][1];
          if (!seenPd[fileId]) {
            seenPd[fileId] = true;
            streams.push({
              source: "PixelDrain",
              name: "📥 PixelDrain [Fast Download]",
              url: "https://pixeldrain.com/api/file/" + fileId + "?download",
              quality: baseMeta.quality || "1080p",
              size: baseMeta.size || "",
              meta: baseMeta
            });
          }
        }

        // 2. HubCloud 10Gbps Server & Cloudflare R2 / Workers.dev / Google Cloud Usercontent
        var linkMatches = [...resolverHtml.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)];
        var seenUrls = {};

        var redirectPromises = [];

        for (var j = 0; j < linkMatches.length; j++) {
          var rawHref = linkMatches[j][1];
          var linkText = linkMatches[j][2].replace(/<[^>]+>/g, "").trim();

          if (!rawHref || !rawHref.startsWith("http") || rawHref.indexOf("t.me") !== -1 || rawHref.indexOf("admin") !== -1 || rawHref.indexOf("login") !== -1) {
            continue;
          }

          var isFastServer = linkText.indexOf("10Gbps") !== -1 ||
                             linkText.indexOf("PixelServer") !== -1 ||
                             linkText.indexOf("Download File") !== -1 ||
                             rawHref.indexOf("pixel.hubcloud") !== -1 ||
                             rawHref.indexOf("gpdl.hubcloud") !== -1 ||
                             rawHref.indexOf("workers.dev") !== -1 ||
                             rawHref.indexOf("r2.dev") !== -1 ||
                             rawHref.indexOf("cloudflarestorage") !== -1;

          if (isFastServer && !seenUrls[rawHref]) {
            seenUrls[rawHref] = true;

            var label = "🚀 HubCloud 10Gbps [Fast Download]";
            if (rawHref.indexOf("workers.dev") !== -1 || linkText.indexOf("Download File") !== -1) {
              label = "⚡ Cloudflare Fast-DL";
            }

            (function (href, streamLabel) {
              // Check if gpdl redirect can be resolved directly to Google Usercontent CDN
              if (href.indexOf("gpdl.hubcloud") !== -1) {
                var p = fetch(href, { method: "GET", redirect: "manual" }).then(function (headRes) {
                  var loc = headRes.headers.get("location");
                  var finalUrl = loc || href;
                  if (finalUrl.indexOf("dl.php?link=") !== -1) {
                    try {
                      finalUrl = decodeURIComponent(finalUrl.split("dl.php?link=")[1]);
                    } catch (_) {}
                  }
                  streams.push({
                    source: "HubCloud 10Gbps",
                    name: streamLabel,
                    url: finalUrl,
                    quality: baseMeta.quality || "1080p",
                    size: baseMeta.size || "",
                    meta: baseMeta
                  });
                }).catch(function () {
                  streams.push({
                    source: "HubCloud 10Gbps",
                    name: streamLabel,
                    url: href,
                    quality: baseMeta.quality || "1080p",
                    size: baseMeta.size || "",
                    meta: baseMeta
                  });
                });
                redirectPromises.push(p);
              } else {
                streams.push({
                  source: "HubCloud",
                  name: streamLabel,
                  url: href,
                  quality: baseMeta.quality || "1080p",
                  size: baseMeta.size || "",
                  meta: baseMeta
                });
              }
            })(rawHref, label);
          }
        }

        if (redirectPromises.length > 0) {
          Promise.all(redirectPromises).then(function () {
            resolve(streams);
          }).catch(function () {
            resolve(streams);
          });
        } else {
          resolve(streams);
        }
      }).catch(function () {
        resolve([]);
      });
    }).catch(function () {
      resolve([]);
    });
  });
}

// -------------------------------------------------------------
// Quality, Codec & Language Detectors
// -------------------------------------------------------------
function detectQuality(text) {
  var lower = String(text || "").toLowerCase();
  if (lower.indexOf("2160p") !== -1 || lower.indexOf("2160") !== -1 || lower.indexOf("4k") !== -1 || lower.indexOf("uhd") !== -1) {
    return "2160p";
  } else if (lower.indexOf("1080p") !== -1 || lower.indexOf("1080") !== -1 || lower.indexOf("fhd") !== -1) {
    return "1080p";
  } else if (lower.indexOf("720p") !== -1 || lower.indexOf("720") !== -1 || lower.indexOf("hd") !== -1) {
    return "720p";
  } else if (lower.indexOf("480p") !== -1 || lower.indexOf("480") !== -1 || lower.indexOf("sd") !== -1) {
    return "480p";
  }
  return "1080p";
}

function detectLanguages(text) {
  var lower = String(text || "").toLowerCase();
  var langs = [];
  if (lower.indexOf("hindi") !== -1 || lower.indexOf("hin") !== -1) langs.push("Hindi");
  if (lower.indexOf("english") !== -1 || lower.indexOf("eng") !== -1) langs.push("English");
  if (lower.indexOf("tamil") !== -1 || lower.indexOf("tam") !== -1) langs.push("Tamil");
  if (lower.indexOf("telugu") !== -1 || lower.indexOf("tel") !== -1) langs.push("Telugu");
  if (lower.indexOf("kannada") !== -1) langs.push("Kannada");
  if (lower.indexOf("malayalam") !== -1) langs.push("Malayalam");
  if (lower.indexOf("dual") !== -1 || lower.indexOf("multi") !== -1) {
    if (langs.length === 0) langs.push("Dual/Multi");
  }
  return langs.length > 0 ? langs.join(", ") : "Multi-Audio";
}

// -------------------------------------------------------------
// Main getStreams Entry Point
// -------------------------------------------------------------
function getStreams(tmdbId, type, season, episode) {
  return new Promise(function (resolve) {
    getTmdbDetails(tmdbId, type).then(function (details) {
      if (!details || !details.title) {
        resolve([]);
        return;
      }

      var title = details.title;
      var year = details.year;
      var isSeries = type === "series" || type === "tv";

      search4KHdHub(title, year, isSeries).then(function (match) {
        if (!match || !match.url) {
          resolve([]);
          return;
        }

        var pageUrl = match.url;

        fetchText(pageUrl, { headers: { "Referer": pageUrl } }).then(function (pageHtml) {
          if (!pageHtml) {
            resolve([]);
            return;
          }

          var itemsToProcess = [];

          if (cheerio) {
            try {
              var $ = cheerio.load(pageHtml);
              if (isSeries && season && episode) {
                var sNum = parseInt(season);
                var eNum = parseInt(episode);
                var sRegex = new RegExp("S0*" + sNum + "[^a-zA-Z0-9]*E0*" + eNum + "\\b", "i");
                var epRegex = new RegExp("(?:Episode|EP)[^a-zA-Z0-9]*0*" + eNum + "\\b", "i");

                $(".episode-download-item").each(function (_, el) {
                  var epHtml = $(el).html() || "";
                  var epText = $(el).text() || "";
                  var epTitle = $(el).find(".episode-file-title, .file-title").text().trim();
                  var isMatch = sRegex.test(epTitle) || sRegex.test(epText) || (epRegex.test(epText) && epHtml.indexOf("S0" + sNum) !== -1);
                  if (isMatch) {
                    itemsToProcess.push({
                      title: epTitle || (title + " S" + sNum + "E" + eNum),
                      html: epHtml
                    });
                  }
                });
              } else {
                $(".download-item").each(function (_, el) {
                  var mHtml = $(el).html() || "";
                  var mTitle = $(el).find(".file-title, .download-header").text().trim() || title;
                  itemsToProcess.push({
                    title: mTitle,
                    html: mHtml
                  });
                });
              }
            } catch (_) {}
          }

          // Fallback if cheerio was unavailable or returned 0 items
          if (itemsToProcess.length === 0) {
            if (isSeries && season && episode) {
              var sNum = parseInt(season);
              var eNum = parseInt(episode);
              var sRegex = new RegExp("S0*" + sNum + "[^a-zA-Z0-9]*E0*" + eNum + "\\b", "i");
              var epBlocks = [...pageHtml.matchAll(/<div[^>]*class=["'][^"']*episode-download-item[^"']*["'][^>]*>([\s\S]*?)<\/div>\s*(?=<div[^>]*class=["'][^"']*episode-download-item|<div[^>]*class=["'][^"']*season-item|<\/section|<\/main|$)/gi)];
              for (var i = 0; i < epBlocks.length; i++) {
                var blockHtml = epBlocks[i][1];
                var titleMatch = blockHtml.match(/class=["'][^"']*(?:episode-file-title|file-title)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
                var epTitle = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "").trim() : "";
                if (sRegex.test(epTitle) || sRegex.test(blockHtml)) {
                  itemsToProcess.push({
                    title: epTitle || (title + " S" + sNum + "E" + eNum),
                    html: blockHtml
                  });
                }
              }
            } else {
              var dlBlocks = [...pageHtml.matchAll(/<div[^>]*class=["'][^"']*download-item[^"']*["'][^>]*>([\s\S]*?)<\/div>\s*(?=<div[^>]*class=["'][^"']*download-item|<\/section|<\/main|$)/gi)];
              for (var j = 0; j < dlBlocks.length; j++) {
                var mBlockHtml = dlBlocks[j][1];
                var mTitleMatch = mBlockHtml.match(/class=["'][^"']*file-title[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
                var mTitle = mTitleMatch ? mTitleMatch[1].replace(/<[^>]+>/g, "").trim() : title;
                itemsToProcess.push({
                  title: mTitle,
                  html: mBlockHtml
                });
              }
            }
          }

          if (itemsToProcess.length === 0) {
            resolve([]);
            return;
          }

          // Parse file size & quality for EVERY release item
          itemsToProcess.forEach(function (cand) {
            var candTitle = cand.title;
            var candHtml = cand.html;

            // Extract file size
            var sizeMatch = candHtml.match(/class=["'][^"']*badge-size[^"']*["'][^>]*>([\s\S]*?)<\/span>/i) ||
                            candHtml.match(/class=["'][^"']*badge[^"']*["'][^>]*>([\d.]+ ?[GM]B)<\/span>/i) ||
                            candHtml.match(/([\d.]+ ?[GM]B)/i);
            var sizeStr = sizeMatch ? sizeMatch[1].replace(/<[^>]+>/g, "").trim() : "";
            cand.sizeStr = sizeStr;
            cand.bytes = parseBytes(sizeStr);
            cand.quality = detectQuality(candTitle + " " + candHtml);
            cand.languages = detectLanguages(candTitle + " " + candHtml);
          });

          // Sort ascending by size so 1GB - 2GB compact files are prioritized
          itemsToProcess.sort(function (a, b) {
            return (a.bytes || 0) - (b.bytes || 0);
          });

          // Select diverse candidates across all size categories:
          // 1. Compact / Mobile (< 2.5 GB: ~1GB - 2GB)
          // 2. Medium (2.5 GB - 6 GB)
          // 3. High (6 GB - 18 GB)
          // 4. Ultra 4K / Remux (> 18 GB)
          var candidates = [];
          var sizeBuckets = { compact: [], medium: [], high: [], ultra: [] };

          itemsToProcess.forEach(function (item) {
            var gb = (item.bytes || 0) / (1024 * 1024 * 1024);
            if (gb > 0 && gb < 2.5) {
              sizeBuckets.compact.push(item);
            } else if (gb >= 2.5 && gb < 6) {
              sizeBuckets.medium.push(item);
            } else if (gb >= 6 && gb < 18) {
              sizeBuckets.high.push(item);
            } else {
              sizeBuckets.ultra.push(item);
            }
          });

          // Pick up to 2 items from each bucket
          ["compact", "medium", "high", "ultra"].forEach(function (bName) {
            var bucket = sizeBuckets[bName];
            for (var b = 0; b < bucket.length && b < 2; b++) {
              candidates.push(bucket[b]);
            }
          });

          // If some buckets were empty, top up to 6 releases from itemsToProcess
          if (candidates.length < 4) {
            itemsToProcess.forEach(function (it) {
              if (candidates.indexOf(it) === -1 && candidates.length < 6) {
                candidates.push(it);
              }
            });
          }

          var releasePromises = [];

          candidates.forEach(function (cand) {
            var candTitle = cand.title;
            var candHtml = cand.html;
            var sizeStr = cand.sizeStr || "";
            var q = cand.quality || "1080p";
            var langs = cand.languages || "Multi-Audio";

            var meta = {
              title: candTitle,
              quality: q,
              size: sizeStr,
              bytes: cand.bytes || 0,
              languages: langs
            };

            // Extract all mirror links from this release block
            var links = [...candHtml.matchAll(/href=["'](https?:\/\/[^"']+)["']/gi)];

            links.forEach(function (l) {
              var mirrorUrl = l[1];
              if (mirrorUrl.indexOf("greenmotors.") !== -1 || mirrorUrl.indexOf("greenmountmotors.") !== -1) {
                var p = resolveGreenMotors(mirrorUrl).then(function (target1) {
                  if (!target1) return [];
                  if (target1.indexOf("hubdrive.") !== -1) {
                    return resolveHubDrive(target1).then(function (target2) {
                      return target2 ? resolveHubCloudDirectStreams(target2, meta) : [];
                    });
                  }
                  return resolveHubCloudDirectStreams(target1, meta);
                });
                releasePromises.push(p);
              } else if (mirrorUrl.indexOf("hubcloud.") !== -1) {
                releasePromises.push(resolveHubCloudDirectStreams(mirrorUrl, meta));
              } else if (mirrorUrl.indexOf("hubdrive.") !== -1) {
                var p2 = resolveHubDrive(mirrorUrl).then(function (target) {
                  return target ? resolveHubCloudDirectStreams(target, meta) : [];
                });
                releasePromises.push(p2);
              }
            });
          });

          Promise.all(releasePromises).then(function (nestedArrays) {
            var allStreams = [];
            var seenStreamUrls = {};

            nestedArrays.forEach(function (arr) {
              if (Array.isArray(arr)) {
                arr.forEach(function (item) {
                  if (item && item.url && !seenStreamUrls[item.url]) {
                    seenStreamUrls[item.url] = true;

                    var qTag = "[" + (item.quality || "1080p") + "]";
                    var sizeTag = item.size ? " (" + item.size + ")" : "";
                    var langTag = item.meta && item.meta.languages ? " • [" + item.meta.languages + "]" : "";

                    allStreams.push({
                      name: "📥 4KHDHub - " + (item.name || "Fast Download") + " " + qTag + sizeTag,
                      title: (item.meta ? item.meta.title : title) + "\n" + (item.size ? item.size + " • " : "") + "Direct Download" + langTag,
                      url: item.url,
                      quality: item.quality || "1080p",
                      size: item.size || "",
                      bytes: (item.meta && item.meta.bytes) ? item.meta.bytes : parseBytes(item.size),
                      provider: "4khdhub",
                      headers: {
                        "User-Agent": USER_AGENT,
                        "Referer": pageUrl
                      },
                      behaviorHints: {
                        bingeGroup: "4khdhub-" + (item.source || "download")
                      }
                    });
                  }
                });
              }
            });

            // Sort streams ascending by size so 1GB - 2GB compact files appear first
            allStreams.sort(function (a, b) {
              var bytesA = a.bytes || 0;
              var bytesB = b.bytes || 0;
              if (bytesA && bytesB) {
                return bytesA - bytesB;
              }
              return (bytesA ? 1 : 0) - (bytesB ? 1 : 0);
            });

            resolve(allStreams);
          }).catch(function () {
            resolve([]);
          });
        }).catch(function () {
          resolve([]);
        });
      }).catch(function () {
        resolve([]);
      });
    }).catch(function () {
      resolve([]);
    });
  });
}

// -------------------------------------------------------------
// Module Exports (CommonJS, QuickJS globalThis & Window)
// -------------------------------------------------------------
if (typeof module !== "undefined" && module.exports) {
  module.exports = { getStreams: getStreams };
}
if (typeof globalThis !== "undefined") {
  globalThis.getStreams = getStreams;
}
if (typeof window !== "undefined") {
  window.getStreams = getStreams;
}
