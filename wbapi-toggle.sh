#!/usr/bin/env bash
# SPDX-License-Identifier: MIT — Copyright (c) 2026 PaulRicheson@Roll2Hit.com
# wbapi-toggle.sh — manage wbapi-server.js
# Usage: ./wbapi-toggle.sh [start|stop|restart|status|run]
#        (no arg = toggle)
#
# Exit code 67 from the server signals a self-requested restart.
# Use `./wbapi-toggle.sh run` (or start it via `run` internally) to loop on code 67.
# The API endpoint POST /api/restart triggers this by exiting with code 67.

SCRIPT="wbapi-server.js"
DIR="$(cd "$(dirname "$0")" && pwd)"
CMD="${1:-toggle}"

PID=$(pgrep -f "$SCRIPT" | head -1)

do_start() {
  if [ -n "$PID" ]; then
    echo "Already running (PID $PID) — http://localhost:3001"
    return 0
  fi
  echo "Starting wbapi-server…"
  # Run in restart-loop mode: exit code 67 = restart request
  (
    while true; do
      node "$DIR/$SCRIPT"
      CODE=$?
      if [ "$CODE" -eq 67 ]; then
        echo "[wbapi-toggle] Server exited with code 67 — restarting…"
        sleep 0.3
      else
        echo "[wbapi-toggle] Server exited with code $CODE — stopping."
        break
      fi
    done
  ) &
  sleep 0.4
  NEW_PID=$(pgrep -f "$SCRIPT" | head -1)
  if [ -n "$NEW_PID" ]; then
    echo "Started (PID $NEW_PID) — http://localhost:3001"
  else
    echo "ERROR: server did not start. Check $SCRIPT for errors."
    exit 1
  fi
}

do_stop() {
  if [ -z "$PID" ]; then
    echo "Not running."
    return 0
  fi
  echo "Stopping wbapi-server (PID $PID)…"
  kill "$PID"
  echo "Stopped."
}

case "$CMD" in
  start)   do_start ;;
  stop)    do_stop ;;
  restart) do_stop; sleep 0.3; PID=''; do_start ;;
  status)
    if [ -n "$PID" ]; then echo "Running (PID $PID) — http://localhost:3001"
    else echo "Stopped."; fi ;;
  toggle)
    if [ -n "$PID" ]; then do_stop; else do_start; fi ;;
  *)
    echo "Usage: $0 [start|stop|restart|status]"
    echo "       (no arg = toggle)"
    echo "  POST /api/restart from the server triggers a self-restart via exit code 67."
    exit 1 ;;
esac
