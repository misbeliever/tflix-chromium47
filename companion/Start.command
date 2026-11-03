#!/bin/zsh
cd -- "$(dirname -- "$0")" || exit 1
network_iface=$(/sbin/route -n get default 2>/dev/null | /usr/bin/awk '/interface:/ {print $2; exit}')
mac_address=$(/usr/sbin/ipconfig getifaddr "$network_iface" 2>/dev/null)
if [[ -z "$mac_address" ]]; then
  print 'Could not find the Mac’s Wi-Fi/Ethernet address. Connect to your home network and try again.'
  read 'reply?Press Return to close.'
  exit 1
fi
if ! command -v node >/dev/null; then
  print 'Node.js is needed on this Mac to run the companion.'
  read 'reply?Press Return to close.'
  exit 1
fi
node server.cjs "$mac_address"
