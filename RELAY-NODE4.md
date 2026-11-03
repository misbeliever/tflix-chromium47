# C47.3: relay startup on Node 4.4.3

3 November 2026. The TV user reported **Local Relay: Not reachable** and **Failed to fetch** when installing the default/GogoAnime packs. The known LAN health endpoint refused a connection. Earlier diagnostics measured Node 4.4.3 on this TV.

## Reproduced cause

Ran the original relay in a TizenBrew-style VM using the official Node 4.4.3 Darwin x64 runtime on this Mac. It failed before binding HTTP:

```
TFlix-service.js:193
async function fetchJson(url, headers) {
      ^^^^^^^^
SyntaxError: Unexpected token function
```

This reproduces the unavailable-backend failure independently of provider selection. It is not a captured TV stack trace, so other device-specific causes remain possible.

The test runtime archive came from nodejs.org/dist/v4.4.3/, verified against its HTTPS SHASUMS256.txt: Darwin x64 archive SHA256 7cbb9819926d90c9c9f31c3db4c83499a3d9518ad3c7d9915fa4c66d6d5875df. Runtime is temporary and is not bundled in the TV app or Mac remote.

## Fix

- Keep maintainable source in service/hlsRelay.js; build one self-contained **service/hlsRelay-node4.js** and point package.json's serviceFile to it. This matches TizenBrew's single-file VM launcher; no neighboring runtime modules are required.
- Bundle existing core-js URL support and compile newer syntax to ES5 with already-used build dependencies, now explicitly declared. Preserve third-party license notices in the generated script.
- Use legacy Node HTTP request options, explicit Buffer import, recursive directory creation compatible with Node 4, name-based directory enumeration and six-digit padding without newer string APIs.
- Restrict browser CORS origins instead of allowing arbitrary websites; pairing start/status are TV-loopback only. Keep existing loopback-only direct pack install/uninstall gates. Validate provider IDs before constructing local filenames.
- A pack whose code cannot parse gets an explicit **incompatible Node runtime** error. A pack with zero successfully loaded providers no longer reports a successful installation. A missing backend gets a clear relay message in the UI.

External provider scripts are **not** automatically transpiled. The default/GogoAnime packs were not fetched, installed or verified in this work. Do not infer their compatibility from the local synthetic provider passing.

## Validation

`NODE4=/tmp/tflix-node4/node node scripts/check-relay-node4.cjs` runs the actual generated service in a launcher-style VM, with temporary per-test storage, a real localhost listener and synthetic manifest/provider/media responses. No TV requests or external provider traffic are made by that test.

Checks pass for health, URL parsing, pairing code, provider install/load/resolve/uninstall, relative HLS playlist/init URL rewriting, ranged media bytes, incompatible modern-provider errors, invalid provider IDs, rejected external browser origins, and denied LAN pairing/install controls. The test fails against the original async source. Production browser build and ES5 checks also pass.

**Hardware check still needed:** update to this commit, normally restart the TV to clear old service instances, launch TFlix C47, then Settings → Local Relay → Recheck. Expect Reachable. Keep existing TMDB key/history; do not reset data. Retry one pack; report its exact new error if it is still incompatible. Streaming, source availability, provider TLS and codec compatibility remain separate tests. No root, firmware or native executable changes were made.
