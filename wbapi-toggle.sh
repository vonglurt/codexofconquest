#!/usr/bin/env bash
# MIT License — Copyright (c) 2026 Paul Richeson
# wbapi-toggle.sh — manage wbapi-server.js
#
# Usage: ./wbapi-toggle.sh [start|stop|restart|status|fg]
#        (no arg = toggle between background start/stop)
#
#   start    — run in background (one-shot; server does not self-restart)
#   stop     — kill background instance
#   restart  — stop + start
#   status   — show PID / port
#   fg       — run in FOREGROUND, terminal attached, full log scrolls
#   toggle   — start if stopped, stop if running (default)
#
# The server never self-restarts. Relaunch is handled by monitor-snapshots.py
# or by running this script again. POST /api/restart exits the server cleanly
# (exit 0); this script does NOT auto-relaunch on that.

SCRIPT="wbapi-server.js"
DIR="$(cd "$(dirname "$0")" && pwd)"
CMD="${1:-toggle}"

# ── Load .env if present (secrets — gitignored) ───────────────────────────────
ENV_FILE="$DIR/.env"
if [ -f "$ENV_FILE" ]; then
  while IFS='=' read -r key value; do
    # Skip comments and blank lines
    [[ "$key" =~ ^[[:space:]]*# ]] && continue
    [[ -z "$key" ]] && continue
    # Skip placeholder value
    [[ "$value" == *"PASTE-YOUR-KEY-HERE"* ]] && continue
    export "$key"="$value"
  done < "$ENV_FILE"
fi

PID=$(pgrep -f "$SCRIPT" | head -1)

# ── Run server once (no restart loop) ────────────────────────────────────────
# The server never self-restarts. Relaunch is handled by monitor-snapshots.py
# or by the caller. This function starts the server and returns when it exits.
#
# Conflict rule: if monitor-snapshots.py is already running AND this shell was
# NOT spawned by it (WBAPI_MANAGED_BY_MONITOR unset), defer to it and exit.
# monitor-snapshots.py sets WBAPI_MANAGED_BY_MONITOR=1 in the Terminal window
# it opens, so its own spawned toggles are always allowed through.
_monitor_running() {
  pgrep -f "monitor-snapshots.py" > /dev/null 2>&1
}

_run_once() {
  if _monitor_running && [ -z "$WBAPI_MANAGED_BY_MONITOR" ]; then
    echo "[wbapi-toggle] monitor-snapshots.py is running and owns the server lifecycle."
    echo "[wbapi-toggle] Deferring — not starting."
    return 0
  fi
  if lsof -ti tcp:1367 >/dev/null 2>&1; then
    echo "[wbapi-toggle] Port 1367 already in use — another instance owns it. Not starting."
    return 0
  fi
  node --max-old-space-size=4096 "$DIR/$SCRIPT"
  CODE=$?
  echo "[wbapi-toggle] ⏹  Server exited with code $CODE."
  return $CODE
}

do_start() {
  if [ -n "$PID" ]; then
    echo "Already running (PID $PID) — http://localhost:1367"
    return 0
  fi
  echo "Starting wbapi-server (background)…"
  _run_once &
  sleep 0.5
  NEW_PID=$(pgrep -f "$SCRIPT" | head -1)
  if [ -n "$NEW_PID" ]; then
    echo "Started (PID $NEW_PID) — http://localhost:1367"
  else
    echo "ERROR: server did not start. Check $SCRIPT for errors."
    exit 1
  fi
}

do_fg() {
  if [ -n "$PID" ]; then
    echo "Stopping background instance (PID $PID) before entering foreground mode…"
    do_stop
    sleep 0.5
  fi
  echo ""
  echo "  ┌─────────────────────────────────────────────────────────┐"
  echo "  │  wbapi-server  —  FOREGROUND MODE  (verbose)           │"
  echo "  │  Full request + response bodies logged here.           │"
  echo "  │  Ctrl-C to stop. POST /api/restart to reload.          │"
  echo "  └─────────────────────────────────────────────────────────┘"
  echo ""
  export WBAPI_VERBOSE=1
  _run_once
  return $?
}

do_stop() {
  if [ -z "$PID" ]; then
    echo "Not running."
    return 0
  fi
  echo "Stopping wbapi-server (PID $PID)…"
  # Kill the whole process group to also stop the shell loop wrapper
  kill -- -$(ps -o pgid= "$PID" | tr -d ' ') 2>/dev/null || kill "$PID"
  echo "Stopped."
}

case "$CMD" in
  start)   do_start ;;
  stop)    do_stop ;;
  restart) do_stop; sleep 0.4; PID=''; do_start ;;
  status)
    if [ -n "$PID" ]; then echo "Running (PID $PID) — http://localhost:1367"
    else echo "Stopped."; fi ;;
  fg|foreground) do_fg ;;
  toggle)
    if [ -n "$PID" ]; then do_stop; else do_start; fi ;;
  *)
    echo "Usage: $0 [start|stop|restart|status|fg]"
    echo "       (no arg = toggle)"
    echo ""
    echo "  fg   — foreground mode: terminal stays attached, log scrolls live"
    echo "  start — background mode: runs silently, log goes to milepoints/wbapi-server.log"
    exit 1 ;;
esac
