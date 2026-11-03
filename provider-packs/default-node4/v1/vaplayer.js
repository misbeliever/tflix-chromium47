// Node 4 compatibility build; see ../README.md for origin and limitations.
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i.return) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
var VAPLAYER_API = 'https://streamdata.vaplayer.ru/api.php';

// CommonJS on purpose — TFlix's relay loads provider files with require()
// inside a bare Node vm sandbox (no import/export, no dynamic import()) on
// TVs that can run Node as old as v12.4, so no optional chaining (`?.`) or
// nullish coalescing (`??`) either. See docs/PROVIDER_PACKS.md in the TFlix
// repo for the full contract.
module.exports = {
  id: 'vaplayer-direct',
  name: 'VAPlayer Direct [Native HLS Player]',
  description: 'High-speed 1080p BluRay HLS master playlist stream with fast CDN delivery',
  resolve: function resolve(ctx, http) {
    return _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee() {
      var imdbId, isTv, season, episode, params, json, streamUrls, rawSubs, subtitles;
      return _regenerator().w(function (_context) {
        while (1) switch (_context.n) {
          case 0:
            imdbId = ctx.imdbId;
            isTv = ctx.isTv;
            season = ctx.season;
            episode = ctx.episode;
            if (imdbId) {
              _context.n = 1;
              break;
            }
            throw new Error('VAPlayer: no imdb id available');
          case 1:
            params = {
              imdb: imdbId,
              type: isTv ? 'tv' : 'movie'
            };
            if (isTv) {
              params.season = String(season);
              params.episode = String(episode);
            }
            _context.n = 2;
            return http.fetchJson(VAPLAYER_API + '?' + require('querystring').stringify(params));
          case 2:
            json = _context.v;
            streamUrls = json && json.data ? json.data.stream_urls : null;
            if (Array.isArray(streamUrls) && streamUrls.length > 0) {
              _context.n = 3;
              break;
            }
            throw new Error('VAPlayer: no stream_urls returned');
          case 3:
            rawSubs = Array.isArray(json.default_subs) ? json.default_subs : [];
            subtitles = rawSubs.map(function (s, idx) {
              return {
                src: s.url || s.src || s,
                lang: s.lang || 'en',
                label: s.label || s.language || 'Subtitle ' + (idx + 1)
              };
            });
            return _context.a(2, {
              streamUrl: streamUrls[0],
              subtitles: subtitles,
              providerName: 'VAPlayer Direct HLS'
            });
        }
      }, _callee);
    }))();
  }
};
