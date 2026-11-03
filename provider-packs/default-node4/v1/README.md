# TFlix Default Pack — Node 4 compatibility build

Contains the Default Pack only: Videasy, VAPlayer and VixSrc. No GogoAnime changes. Use TFlix C47.7 with its working relay; no app update is required for this pack.

Upstream snapshots were downloaded from https://tflix-providers.zyrex.workers.dev/packs/default/ on 2026-11-03. Original provider authorship and comments are retained. The endpoint did not supply a separate provider license; this compatibility build does not claim ownership of upstream code or assign it a new license. Babel-generated helpers use the accompanying MIT notice. Sources and hashes are included for review.

Compatibility changes: Babel emits older syntax with inline async/generator helpers. VAPlayer uses Node’s built-in querystring instead of an unavailable URLSearchParams global. Videasy uses older Buffer construction, explicit Base64 padding and Object.keys instead of Object.entries. No global polyfills or new runtime packages are installed on the TV. Manifest IDs are retained, so avoid simultaneously installing a second pack with the same provider IDs.

Checks completed: all three original sources failed parsing under actual Node 4.4.3; all three built files load and export valid providers. check-node4.cjs tests synthetic success/error responses, VAPlayer query/subtitles, VixSrc playlist handling and Videasy payload/fallback. The relay integration test installs these actual built files through the Node 4 copied-globals launcher, verifies all three registrations and uninstalls the fixture. Fixtures never request media or external provider sites.

Rebuild from this workspace: node work/default-pack-node4/build.cjs
Provider check: /tmp/tflix-node4/node work/default-pack-node4/check-node4.cjs
Integration: set PACK_FIXTURE_DIR to this pack’s absolute dist directory and NODE4 to an official Node 4.4.3 executable, then run work/tflix/scripts/check-relay-node4.cjs.

After hosting dist/manifest.json and its three adjacent scripts on a public HTTP/HTTPS host, use TFlix Settings → Add a Provider Pack (Advanced), start the pairing page, open the shown URL on Mac and submit the manifest URL with the on-screen pairing code. Do not paste a pack manifest into the embed-provider JSON-list field. Retry this compatibility pack rather than the original Default catalog entry. A failed earlier original install that registered no providers need not be removed; remove any successfully installed duplicate Default Pack before using these same IDs.

Unverified: actual TV installation, external provider endpoints, old TLS/certificates, live stream availability, codecs and playback. Local test success establishes runtime/loader compatibility only.
