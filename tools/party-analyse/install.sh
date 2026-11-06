#!/bin/zsh
# Installerer automatisk henting av Party-analysen: macOS kjører sync.py hvert minutt.
# Den gjør ingenting når telefonen ikke er koblet til. Avinstaller: ./install.sh --remove
set -e
LABEL="no.espen.bilnett.partyanalyse"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
SCRIPT="$(cd "$(dirname "$0")" && pwd)/sync.py"
DATA="$HOME/Vibe-kode/Projects/Bilnett-AA-assets/party-analyse"

launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
if [[ "$1" == "--remove" ]]; then rm -f "$PLIST"; echo "Fjernet."; exit 0; fi

mkdir -p "$DATA" "$HOME/Library/LaunchAgents"
cat > "$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key><array><string>/opt/homebrew/bin/python3</string><string>$SCRIPT</string></array>
  <key>StartInterval</key><integer>60</integer>
  <key>RunAtLoad</key><true/>
  <key>StandardOutPath</key><string>$DATA/launchd.log</string>
  <key>StandardErrorPath</key><string>$DATA/launchd.log</string>
</dict></plist>
EOF
launchctl bootstrap "gui/$(id -u)" "$PLIST"
echo "Installert. Data og rapport: $DATA"
