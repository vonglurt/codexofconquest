#!/usr/bin/env bash
# SPDX-License-Identifier: MIT — Copyright (c) 2026 PaulRicheson@Roll2Hit.com
# wbapi-toggle.sh — start wbapi-server.js if stopped, stop it if running

SCRIPT="wbapi-server.js"
DIR="$(cd "$(dirname "$0")" && pwd)"

PID=$(pgrep -f "$SCRIPT" | head -1)

if [ -n "$PID" ]; then
  echo "Stopping wbapi-server (PID $PID)…"
  kill "$PID"
  echo "Stopped."
else
  echo "Starting wbapi-server…"
  node "$DIR/$SCRIPT" &
  sleep 0.4
  NEW_PID=$(pgrep -f "$SCRIPT" | head -1)
  if [ -n "$NEW_PID" ]; then
    echo "Started (PID $NEW_PID) — http://localhost:3001"
  else
    echo "ERROR: server did not start. Check $SCRIPT for errors."
    exit 1
  fi
fi
