#!/usr/bin/env bash
# start-wbapi.sh — Launch and keep the Roll2Hit WBAPI server running
#
# Usage:
#   ./start-wbapi.sh                   # uses roll2hit-v3.html in same dir
#   ./start-wbapi.sh my-save.html      # specify a different game file
#   PORT=3002 ./start-wbapi.sh         # different port
#
# Keeps the server running: restarts automatically if it crashes.
# All output goes to stdout (for your terminal) AND to wbapi-server.log.
# Press Ctrl+C to stop.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

GAME_FILE="${1:-roll2hit-v3.html}"
PORT="${PORT:-3001}"
LOG_FILE="$SCRIPT_DIR/wbapi-server.log"
RESTART_DELAY=2

# ── Require Node.js ─────────────────────────────────────────────────────────
if ! command -v node &>/dev/null; then
  # Try Homebrew locations
  for brewnode in /opt/homebrew/bin/node /usr/local/bin/node; do
    if [ -x "$brewnode" ]; then
      export PATH="$(dirname $brewnode):$PATH"
      break
    fi
  done
fi

if ! command -v node &>/dev/null; then
  echo ""
  echo "  Node.js not found."
  echo "  Install with: brew install node"
  echo "  Then re-run this script."
  echo ""
  exit 1
fi

NODE_VERSION=$(node --version)

# ── Require game file ────────────────────────────────────────────────────────
if [ ! -f "$GAME_FILE" ]; then
  echo ""
  echo "  Game file not found: $GAME_FILE"
  echo "  Place roll2hit-v3.html in the same directory as this script."
  echo ""
  exit 1
fi

# ── Require wbapi-server.js ──────────────────────────────────────────────────
if [ ! -f "$SCRIPT_DIR/wbapi-server.js" ]; then
  echo "  wbapi-server.js not found in $SCRIPT_DIR"
  exit 1
fi

# ── Banner ───────────────────────────────────────────────────────────────────
echo ""
echo "  ════════════════════════════════════════════════════════"
echo "  ◆ ROLL2HIT  World Builder API Server"
echo "  ════════════════════════════════════════════════════════"
echo "  Node:      $NODE_VERSION"
echo "  Game file: $GAME_FILE"
echo "  Port:      $PORT"
echo "  Log file:  $LOG_FILE"
echo "  URL:       http://localhost:$PORT/api"
echo "  ════════════════════════════════════════════════════════"
echo ""
echo "  Press Ctrl+C to stop."
echo ""

# Write session start to log
echo "" >> "$LOG_FILE"
echo "════════════════════════════════════════════════════════" >> "$LOG_FILE"
echo "Session started: $(date)" >> "$LOG_FILE"
echo "Game file: $GAME_FILE  |  Port: $PORT  |  Node: $NODE_VERSION" >> "$LOG_FILE"
echo "════════════════════════════════════════════════════════" >> "$LOG_FILE"

# ── Run loop ─────────────────────────────────────────────────────────────────
CRASHES=0
while true; do
  ROLL2HIT_FILE="$GAME_FILE" PORT="$PORT" node "$SCRIPT_DIR/wbapi-server.js" 2>&1 | tee -a "$LOG_FILE"
  EXIT_CODE="${PIPESTATUS[0]}"

  if [ "$EXIT_CODE" -eq 0 ]; then
    # Clean exit (Ctrl+C propagates SIGINT → node exits 0 via default handler)
    echo ""
    echo "  Server stopped cleanly."
    echo "Session ended: $(date)" >> "$LOG_FILE"
    break
  fi

  CRASHES=$((CRASHES + 1))
  echo "" | tee -a "$LOG_FILE"
  echo "  [!] Server crashed (exit $EXIT_CODE) — restart #$CRASHES in ${RESTART_DELAY}s…" | tee -a "$LOG_FILE"
  echo "" | tee -a "$LOG_FILE"
  sleep "$RESTART_DELAY"
done
