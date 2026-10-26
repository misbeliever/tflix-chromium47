# TFlix C47 — experimental Tizen 3.0 edition

Target: Samsung UE65MU8002 (2017), Chromium 47. Based on
[Zyrecx/TFlix](https://github.com/Zyrecx/TFlix) commit
`cd25c0c1e4944e8a45a728583a487669e16f1cc0`, version 2.0.5.
MIT attribution is retained. This is a separate compatibility edition, not an
upstream release and not an upgrade of the TV browser.

## Install this edition

In your working TizenBrew → Module Manager → **Add GitHub Module**, enter:

```text
misbeliever/tflix-chromium47@2.0.5-c47.1
```

Launch **TFlix C47**. Do not enter this identifier under npm. The built `dist/`
files must be committed to the repository at this tag. A release attachment alone
is insufficient for TizenBrew's GitHub/CDN loading path.

Keep TizenBrew, TizenTube, BrewDocs C47 and the original TFlix installed unchanged.
Do not enable autostart while testing. Rollback means removing only TFlix C47.

This edition uses a separate local-storage prefix (`tflix_c47_`), relay port
`47994`, and temporary provider directory (`tflix-c47-relay`). It does not migrate
API keys, history or provider packs from the original. Enter your own TMDB key
again in this edition if you want its catalog. No API keys or providers were
added to the repository. Reset clears only this edition's browser data.

The relay's original phone-pairing design binds to LAN interfaces; port 47994 must
be reachable from the phone for QR pairing. Its authentication and provider-pack
execution model are inherited from upstream. Install only provider packs you trust.
No pairing, provider installation, streaming-source access or TV changes were
performed during this work.

## Why the original can show black

There are two independently verifiable packaging/startup blockers:

1. The upstream Git checkout excludes `/dist/`, while package.json points to
   `dist/index.html`. Installing the repository directly can therefore request
   files that are not present. Its published npm package is a different artifact.
2. Even after building upstream, its HTML contains only a `type="module"` entry.
   Chromium 47 ignores module scripts, so the empty `#app` never renders.

The baseline build succeeded, but the startup assertion failed:

```text
AssertionError: BLACK-SCREEN REPRO: Chromium 47 has no executable app entry;
it ignores type=module
```

These are confirmed incompatibilities, not a remotely captured diagnosis of the
exact installed TV revision. Your TV console and installed version were not read.

## Changes

- Vite's official legacy plugin emits classic SystemJS entry/polyfill/lazy chunks.
  Chrome 47 is the target; IE11 is additionally specified to force conservative
  ES5 syntax. This is not a claim of full IE11 support. Modern and legacy bundles
  both ship, using Vite's normal module/nomodule selection; Chrome 47 uses legacy.
- All four legacy chunks, including the lazy player and Hls.js, parse as ES5.
  API polyfills include the used Object/Array and DOM collection methods and URL
  functionality. AbortController/fetch-abort compatibility is included separately.
  On old native fetch, abort rejects the caller but may not stop underlying traffic.
- Startup handles both an early and late DOM-ready state. A legacy loader can
  finish after DOMContentLoaded; only registering a new listener then would miss it.
  Static loading text also makes failed startup more visible than an empty page.
- CSS custom properties become literals at build time. Grid becomes wrapping flex;
  gaps become margins; inset becomes four edges; space-evenly becomes space-around.
  Blur/backdrop-filter and smooth CSS scrolling are omitted. The thumbnail uses
  percentage padding instead of aspect-ratio. Inline template layouts receive the
  same gap/inset/grid treatment. Remote Google Fonts import is omitted; system
  font fallbacks remain. The appearance is approximate, especially wrapped spacing.
- Focus uses ancestor scroll offsets rather than unsupported scrollIntoView options.
  Capture listeners touched by navigation use the older boolean form.
- Hls.js workers are disabled: its embedded worker text is outside the legacy
  transformation pipeline. Transmuxing runs on the main thread, which may be slower.
- The inherited npm-publishing workflow is replaced with build/compatibility checks.
  This repository does not automatically publish an npm package.
- Dist artifacts are included for GitHub installation. Package/UI names are distinct.
  Reset, storage and relay namespaces are isolated to protect existing modules.

The relay still targets the upstream Node service environment (documented in its
source as Node 12.4). Its source passes an ES2019 syntax check, but the actual
Node version/API availability on your TV remains unverified. The browser build
cannot polyfill a native Node service, a decoder, DRM or a blocked iframe provider.
Externally installed provider code and embedded remote websites are not transpiled.

## Checks performed

- `npm run build`: passes, producing both standard and ES5 legacy assets.
- `npm test`: passes. Checks classic startup, all legacy chunks with Acorn ES5,
  relay ES2019 syntax, CSS/asset presence, removed CSS dependencies, absence of
  scrollIntoView in navigation, and reset preservation of unrelated/original data.
- Desktop Chrome, isolated local test server: ignores module scripts, executes
  legacy scripts and removes NodeList.forEach, Object.entries, Array.flatMap,
  URL/URLSearchParams and AbortController before the polyfills load.
- That legacy path renders the sidebar and first-run setup; key-entry columns,
  missing-key screen, Settings, Search, Return and exit confirmation/cancel pass.
- Fixture-only catalog and details render, and the lazy player chunk opens the
  missing-provider screen. Zero captured script errors in those checks. No real
  TMDB key, provider or stream was used. The test does not certify real playback.

**Not tested:** actual Chromium 47, UE65MU8002 firmware, on-screen keyboard and
hardware remote registration, live TMDB, phone pairing, provider packs, relay
startup on TV, HLS/MSE/DRM/codec playback, long sessions or memory/performance.
A modern browser with selected features disabled is not a full old-Tizen emulator.

## Reproduce

On a development computer with current Node (tested 26.12.1):

```sh
npm ci --ignore-scripts
npm run build
npm test
```

For the legacy-path desktop test:

```sh
python3 scripts/legacy-test-server.py
```

Open `http://127.0.0.1:8766/index.html` in a disposable desktop browser profile.
The server deliberately changes only the test HTML to ignore module scripts and
remove selected APIs. Its endpoint is local-only. Evaluate/invoke the function in
`scripts/browser-ui-check.js`, then `scripts/browser-catalog-check.js`.
The catalog check stubs TMDB fetch responses and uses a fake local-only key; it
never sends that key to TMDB. These scripts are test tooling, not shipped entrypoints.

## On-TV test order

1. Launch TFlix C47. Expect the **C47** sidebar badge and Welcome setup, rather than
   black. If stuck at Starting, record that exact screen and the first console error.
2. Try Get Started, Skip Tour, Settings and Search. Back closes a modal; Back at
   the root opens exit confirmation. Select Exit to leave, or Samsung Home if needed.
3. Enter your own TMDB key and test catalog browsing/details separately from video.
   Do not send your key, pairing code, cookies or signed stream URLs in bug reports.
4. If the catalog works but video fails, report the exact playback error and whether
   the relay health check works. Provider/network/TLS/iframe restrictions and older
   MSE/codec support can fail independently of the interface.
5. Test only sources you are authorized to access. If pairing fails, check phone/TV
   LAN reachability on port 47994 without changing working TizenTube settings.

The first desired TV result is **interface starts and navigates**. Actual playback
needs a separate on-device result before being described as supported.
