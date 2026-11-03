# TFlix C47 Mac companion — experimental first build

This controls TFlix C47 while that app is open. It is not a remote for the entire TV.

## Start

1. Use TFlix C47 version **2.0.5-c47.4**. Install its published GitHub commit in TizenBrew; a source ZIP is not a WGT installer. Keep the working diagnostics module separate.
2. Keep Mac and TV on the same trusted home network. This Mac needs Node.js 18 or newer. No npm installation is needed for the companion.
3. Open **Start.command** in this folder. It selects the Mac's active network address, binds only to that address, and prints a private connection URL. If macOS asks about incoming connections, allow Node only on your trusted home network. Do not configure router port forwarding.
4. Open the printed URL in your Mac browser. In TFlix on the TV, choose **Mac companion**, enter that same URL including its `#` suffix, and select **Connect**.
5. The Mac page should say **TV connected** and show the TV's saved titles. Keep the server Terminal window open and the Mac awake.

Manual start if your network adapter needs an explicit address:

```sh
node server.cjs 192.168.50.MAC_ADDRESS
```

Replace the last address with your Mac's IPv4 address, not the TV's 192.168.50.39. The server rejects wildcard/public/non-local bindings. The TV does not need an inbound companion port.

## Features

- TV: a dedicated Continue Watching entry, available even without a TMDB catalog key. Reuses existing history, progress, resume/details and removal behaviour.
- Mac: view saved-title summaries and open their existing resume/details flow on TV.
- Mac: search the TMDB catalog using the key already configured on the TV; select a result to open its details on TV. Choose Play using the TV remote. The key is never sent to the Mac companion.
- Mac: play, pause, skip backward/forward 10 seconds, close the player. Play/pause/skip require TFlix's built-in HTML5 player. Embedded third-party players are deliberately unsupported; their buttons are disabled and commands are rejected.
- Updates normally appear within a few seconds. Search needs the TV's TMDB key and internet access. Streaming still depends on provider/player support. C47.3 added the Node 4 relay repair; external provider scripts still need separate compatibility checks.

## Stop and privacy

On TV, Mac companion → Disconnect stops further sharing. Closing TFlix also ends its connection. Stop the Mac server with Control+C to invalidate its token and discard the last received history/results. Closing only the Mac browser does not stop the server. Connection credentials are not saved by the TV; reconnect after relaunch. The Mac page shows the complete connection address in a visible read-only field. The TV connection field is also plain text. Copy connection address copies the full value including the access key. Browser-history cleanup still removes the key from the browser address bar; the displayed field stays visible.

Anyone holding the private URL can control this app and read shared title summaries while the server is running. HTTP is unencrypted: use only a trusted home LAN. The server uses an unpredictable 128-bit token, exact Host checks and restricted browser origins. No shell commands, TV file access, provider installation, arbitrary playback URLs, volume, HDMI switching, power control or screen capture are exposed. No new TV-side Node service or independently compiled executable is needed.

Commands expire after ten seconds, have a bounded queue and are delivered at most once. A lost response may lose a command; the companion does not retry potentially disruptive controls. Reconnect after restarting the server because each launch generates a new token. The server keeps its last display state in memory until shutdown even after TV disconnect.

## Checks and limitations

`npm run build` and `npm test` check the legacy browser bundle. `npm run test:companion` checks the actual HTTP server and the TV adapter with controlled network/player fixtures: authorization, Host/Origin, bounds, field redaction, queue, search, open/resume, playback, unsupported players and disconnect.

Desktop Chrome also rendered the ES5 legacy path with selected modern APIs removed, opened the dedicated history screen without a TMDB key, and connected to the real local companion. The Mac page displayed a seeded TV history record. This is browser emulation, not real Chromium 47 or a TV test. Real LAN pairing, TMDB searches with your credentials, actual video playback and macOS double-click startup remain untested. No firmware or root changes were made.


C47.4 input fix: the TV field is plain text with capitalization/correction disabled. The strict private-IPv4 validator no longer depends on the TV browser's URL constructor. It accepts a missing http:// prefix, defaults to port 18768 and reports missing/wrong access keys separately. No authentication was removed. Self-checks run with a deliberately throwing URL constructor to verify that a valid connection still proceeds. Actual SmartThings Done-button behaviour needs a TV check; the original Invalid scheme cause was not captured from the TV.
