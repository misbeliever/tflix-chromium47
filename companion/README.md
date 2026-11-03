# TFlix companion C47.5 — remembered pairing

The companion controls TFlix while that app is open. The separate native TV Remote Mac controls the TV independently.

1. Update TFlix C47 to version 2.0.5-c47.6 without resetting data.
2. Stop the old Mac companion with Control+C. Unzip this package and open Start.command. The companion requires Node 18+ on Mac; no npm install is needed.
3. Open the private **Mac** URL printed in Terminal. Enter the plain **TV address** shown on that page in TFlix → Mac companion. There is no key to type.
4. Select Connect / Pair on TV. Compare its six-digit code with the Mac page's request, then click Approve on Mac.
5. Pairing is saved automatically on both sides. Reopening TFlix or restarting the Mac companion reconnects without entering another key. Keep the Mac server running and Mac awake while using the companion.

The Mac keeps its own private admin URL in a user-owned file under `~/Library/Application Support/TFlix Companion/pairing.json` with directory mode 700/file mode 600. Only a hash of the TV credential is saved there. The TV stores its credential in this C47 edition's local storage. The Mac admin page remembers its private URL token for the current browser tab/session. C47 modules share a browser origin with other TizenBrew modules, so saved browser credentials should not be treated as isolated from other trusted modules in that same origin.

Disconnect pauses the TV connection and keeps pairing for the next app launch. Forget pairing on TV clears its saved connection; Forget paired TV on Mac revokes its credential. A new approval replaces the previously paired TV. Closing a pending TV pairing cancels it when the Mac is reachable; requests otherwise expire after two minutes. If the Mac's IP changes, enter its new address and pair again. Settings corruption or unsafe file permissions fail visibly instead of silently replacing credentials.

The private Mac admin URL still contains an internal access key; keep that URL private. The **TV address** copied by the page is plain, visible and contains no key. Old full-key addresses are accepted for compatibility, but the approve-on-Mac flow gives the TV a separate credential limited to reporting/polling commands.

Use only a trusted home network: companion HTTP is unencrypted. No router forwarding, TV filesystem access, shell commands, power, HDMI switching or provider installation is exposed by this companion. Commands have a bounded queue, expire after ten seconds and are delivered at most once; a lost response may lose a command rather than replay it. Shared history/results are held in Mac memory, not saved to the pairing file.

Features: TMDB search using the key already configured on TV (key not sent to Mac), saved-title summaries, open details/resume on TV, built-in-player play/pause and ±10 seconds, close player. Embedded-player controls remain unsupported. Pick Play with the TV remote after opening title details. Native TV Remote Mac is separate and requires none of this pairing/address setup.

Tests cover real localhost approval, wrong/missing pairing keys, persisted settings, server restart, TV credential scope/revocation, browser adapter approval, saved auto-reconnect/forget, authorization/Host/Origin, queue/input limits and playback fixtures. Browser/VM checks do not establish actual TV exit, phone keyboard acceptance, streaming, or playback controls; these still need a device test.
