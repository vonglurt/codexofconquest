#!/usr/bin/env bash
# MIT License — Copyright (c) 2026 Paul Richeson
# wbapi-toggle.sh — manage wbapi-server.js
#
# Usage: ./wbapi-toggle.sh [start|stop|restart|status|fg]
#        (no arg = toggle between background start/stop)
#
#   start    — run in background (restart-loop, exit code 67 triggers relaunch)
#   stop     — kill background instance
#   restart  — stop + start
#   status   — show PID / port
#   fg       — run in FOREGROUND, terminal attached, full log scrolls
#              Ctrl-C to stop. Restart loop still active on exit code 67.
#   toggle   — start if stopped, stop if running (default)
#
# POST /api/restart → server exits with code 67 → toggle script relaunches it.

SCRIPT="wbapi-server.js"
DIR="$(cd "$(dirname "$0")" && pwd)"
CMD="${1:-toggle}"

PID=$(pgrep -f "$SCRIPT" | head -1)

# ── Run server in a restart loop ─────────────────────────────────────────────
# $1: 'bg' | 'fg'
_run_loop() {
  local mode="${1:-bg}"
  while true; do
    node "$DIR/$SCRIPT"
    CODE=$?
    if [ "$CODE" -eq 67 ]; then
      echo ""
      echo "[wbapi-toggle] ↺  Server requested restart (exit 67) — relaunching…"
      sleep 0.1
    else
      echo "[wbapi-toggle] ⏹  Server exited with code $CODE."
      break
    fi
  done
}

do_start() {
  if [ -n "$PID" ]; then
    echo "Already running (PID $PID) — http://localhost:1367"
    return 0
  fi
  echo "Starting wbapi-server (background)…"
  _run_loop bg &
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
  _run_loop fg
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
