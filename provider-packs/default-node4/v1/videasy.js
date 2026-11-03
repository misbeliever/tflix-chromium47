// Node 4 compatibility build; see ../README.md for origin and limitations.
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i.return) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
/**
 * Videasy resolver. Self-contained (no imports beyond the injected `http`
 * helper) since community/pack providers can't rely on relative imports
 * into the host app's internals — see TFlix's service/hlsRelay.js contract.
 *
 * CommonJS on purpose — TFlix's relay loads provider files with require()
 * inside a bare Node vm sandbox (no import/export, no dynamic import()) on
 * TVs that can run Node as old as v12.4, so no optional chaining (`?.`) or
 * nullish coalescing (`??`) either. let/const/arrow functions/destructuring/
 * template literals are all fine on v12.4, just not those two operators and
 * not import/export. See docs/PROVIDER_PACKS.md in the TFlix repo.
 */

var VIDEASY_API = 'https://api.speedracelight.com';

// --- decryption (reverse-engineered from player.videasy.net's client bundle) ---
var MAGIC = [109, 118, 109, 49]; // "mvm1"
var HASH_TABLE = [1116352408, 1899447441, 3049323471, 3921009573, 961987163, 1508970993, 2453635748, 2870763221, 3624381080, 310598401, 607225278, 1426881987, 1925078388, 2162078206, 2614888103, 3248222580];
function u32x(x) {
  return x >>> 0;
}
function mul32(a, b) {
  return Math.imul(a, b) >>> 0;
}
function rotl32(x, n) {
  x >>>= 0;
  n &= 31;
  return n === 0 ? x : (x << n | x >>> 32 - n) >>> 0;
}
function hash32(x) {
  x = u32x(x);
  x ^= x >>> 16;
  x = mul32(x, 2246822507);
  x ^= x >>> 13;
  x = mul32(x, 3266489909);
  x ^= x >>> 16;
  return u32x(x);
}
function fnv1a(str) {
  var h = 2166136261;
  for (var i = 0; i < str.length; i++) h = mul32(h ^ str.charCodeAt(i), 16777619);
  return hash32(h);
}
function initStream(seed, secondKey) {
  var S = new Array(61);
  var a = u32x(hash32(fnv1a(seed) ^ hash32(u32x(secondKey >>> 0 ^ 2654435769))));
  for (var i = 0; i < 8; i++) {
    if ((i * (i + 1) & 1) === 0) {
      var idx = a % 61;
      a = rotl32(a + u32x(2654435769), 7 + (7 & i));
      S[idx] = u32x(a ^ hash32(a));
      a = hash32(u32x(a + idx));
    } else {
      S[i] = HASH_TABLE[15 & i];
    }
  }
  return {
    S: S,
    acc: u32x(hash32(2779096485 ^ a))
  };
}
function nextByte(st, ctr) {
  var r = st.S;
  var o = st.acc;
  var n = o % 61;
  var inSet = 0 - Number(n in r);
  var d = r[n] >>> 0;
  var x = u32x(d ^ mul32(2654435769, ctr + 1));
  var y = u32x(o ^ x | o & x & inSet);
  var no = hash32(u32x(rotl32(u32x(y + o), 31 & n) ^ rotl32(o, 31 & Math.imul(n, 7))) + 2654435769);
  r[n] = no >>> 0;
  st.acc = no;
  return no >>> 0;
}
function keystream(seed, secondKey, len) {
  var st = initStream(seed, secondKey);
  var out = new Uint8Array(len);
  var ctr = 0;
  for (var i = 0; i < len;) {
    var b = nextByte(st, ctr++);
    out[i++] = 255 & b;
    if (i < len) out[i++] = b >>> 8 & 255;
    if (i < len) out[i++] = b >>> 16 & 255;
    if (i < len) out[i++] = b >>> 24 & 255;
  }
  return out;
}
function decryptPayload(payload, seed, secondKey) {
  var b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  var binaryString = new Buffer(b64, 'base64').toString('binary');
  var data = new Uint8Array(binaryString.length);
  for (var i = 0; i < binaryString.length; i++) data[i] = binaryString.charCodeAt(i);
  var ks = keystream(seed, secondKey, data.length);
  for (var _i = 0; _i < data.length; _i++) data[_i] ^= ks[_i];
  for (var _i2 = 0; _i2 < MAGIC.length; _i2++) {
    if (data[_i2] !== MAGIC[_i2]) throw new Error('Invalid encrypted payload');
  }
  return new Buffer(data.subarray(MAGIC.length)).toString('utf-8');
}
module.exports = {
  id: 'videasy-direct',
  name: 'Videasy Direct [Native HLS Player]',
  description: 'Ultra-fast direct HLS master playlist stream with multi-quality renditions and subtitles',
  resolve: function resolve(_ref, _ref2) {
    return _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee() {
      var tmdbId, title, year, imdbId, isTv, season, episode, fetchJson, fetchText, seedData, seed, SERVERS, lastErr, _i3, _Object$keys, name, sUrl, apiUrl, encText, plain, resData, firstSource, playlistUrl, rawSubs, subtitles, _t;
      return _regenerator().w(function (_context) {
        while (1) switch (_context.p = _context.n) {
          case 0:
            tmdbId = _ref.tmdbId, title = _ref.title, year = _ref.year, imdbId = _ref.imdbId, isTv = _ref.isTv, season = _ref.season, episode = _ref.episode;
            fetchJson = _ref2.fetchJson, fetchText = _ref2.fetchText;
            _context.n = 1;
            return fetchJson("".concat(VIDEASY_API, "/seed?mediaId=").concat(tmdbId));
          case 1:
            seedData = _context.v;
            seed = seedData && seedData.seed;
            if (seed) {
              _context.n = 2;
              break;
            }
            throw new Error('Videasy: no seed returned');
          case 2:
            SERVERS = {
              CDN: "".concat(VIDEASY_API, "/cdn/sources-with-title"),
              LaMovie: "".concat(VIDEASY_API, "/lamovie/sources-with-title")
            };
            lastErr = null;
            _i3 = 0, _Object$keys = Object.keys(SERVERS);
          case 3:
            if (!(_i3 < _Object$keys.length)) {
              _context.n = 10;
              break;
            }
            name = _Object$keys[_i3];
            sUrl = SERVERS[name];
            _context.p = 4;
            apiUrl = "".concat(sUrl, "?title=").concat(encodeURIComponent(title), "&mediaType=").concat(isTv ? 'TV Series' : 'Movie', "&year=").concat(year, "&tmdbId=").concat(tmdbId, "&imdbId=").concat(imdbId, "&enc=2&seed=").concat(seed);
            if (isTv) apiUrl += "&seasonId=".concat(season, "&episodeId=").concat(episode);
            _context.n = 5;
            return fetchText(apiUrl);
          case 5:
            encText = _context.v;
            if (!(!encText || encText.length < 20 || encText.startsWith('<'))) {
              _context.n = 6;
              break;
            }
            return _context.a(3, 9);
          case 6:
            plain = decryptPayload(encText, seed, String(tmdbId));
            resData = JSON.parse(plain);
            firstSource = resData.sources && resData.sources[0];
            playlistUrl = resData.playlist || firstSource && firstSource.url;
            rawSubs = Array.isArray(resData.subtitles) ? resData.subtitles : [];
            subtitles = rawSubs.filter(function (s) {
              return s && s.url;
            }).map(function (s, idx) {
              return {
                src: s.url,
                lang: s.lang || s.language || 'en',
                label: s.label || s.language || "Subtitle ".concat(idx + 1)
              };
            });
            if (!(playlistUrl && playlistUrl.includes('.m3u8'))) {
              _context.n = 7;
              break;
            }
            return _context.a(2, {
              streamUrl: playlistUrl,
              subtitles: subtitles,
              providerName: "Videasy Direct (".concat(name, ")")
            });
          case 7:
            _context.n = 9;
            break;
          case 8:
            _context.p = 8;
            _t = _context.v;
            lastErr = _t;
          case 9:
            _i3++;
            _context.n = 3;
            break;
          case 10:
            throw lastErr || new Error('Videasy: no server returned a playlist');
          case 11:
            return _context.a(2);
        }
      }, _callee, null, [[4, 8]]);
    }))();
  }
};
