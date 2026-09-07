#!/usr/bin/env bash
# SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
#
# run.sh — the one entry point. Every `make` target calls into here.
#   ./run.sh server | monitor | play | landing | edit | status
#   ./run.sh stop [api|monitor] | restart      — restart is the API server alone
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

PORT="${WBAPI_PORT:-1367}"
SERVER_PAT="src/js/wbapi-server.js"
MONITOR_PAT="src/bin/monitor-snapshots.py"
. "$ROOT/src/bin/procmatch.sh"

open_url()  { command -v open >/dev/null && open "$1" || echo "open $1"; }
in_term()   { # run a command in its own Terminal window (macOS), else background it
  if [ "$(uname)" = "Darwin" ] && [ -z "${NO_TERM:-}" ]; then
    osascript -e "tell application \"Terminal\" to do script \"cd '$ROOT' && $1\"" >/dev/null
  else
    ( eval "$1" & )
  fi
}
server_up() { curl -sf "http://localhost:$PORT/api/ping" >/dev/null 2>&1; }

stop_api()     { local p; p="$(match_pids "$SERVER_PAT")";  [ -n "$p" ] && { kill $p 2>/dev/null; echo "API stopped"; }     || echo "API not running"; }
stop_monitor() { local p; p="$(match_pids "$MONITOR_PAT")"; [ -n "$p" ] && { kill $p 2>/dev/null; echo "monitor stopped"; } || true; }

wait_for_server() {
  for _ in $(seq 1 40); do server_up && return 0; sleep 0.25; done
  echo "warning: API server did not answer on :$PORT" >&2; return 0
}

case "${1:-help}" in
  server)
    server_up && { echo "API already up on :$PORT"; exit 0; }
    in_term "./src/server/start-wbapi.sh" ; wait_for_server ; echo "API server → :$PORT" ;;
  monitor)
    in_term "python3 src/bin/monitor-snapshots.py" ; echo "monitor started" ;;
  play)      open_url "$ROOT/play.html" ;;
  landing)   open_url "$ROOT/index.html" ;;
  edit)      open_url "$ROOT/edit.html" ;;
  stop)
    case "${2:-all}" in
      api)     stop_api ;;
      monitor) stop_monitor ;;
      *)       stop_api ; stop_monitor ;;
    esac ;;
  restart)
    stop_api
    for _ in $(seq 1 40); do server_up || break; sleep 0.25; done
    in_term "./src/server/start-wbapi.sh" ; wait_for_server
    server_up && echo "API server → :$PORT (restarted)" || echo "API server did not come back on :$PORT" ;;
  status)
    server_up && echo "API   : UP   (:$PORT)" || echo "API   : down"
    [ -n "$(match_pids "$MONITOR_PAT")" ] && echo "monitor: UP" || echo "monitor: down" ;;
  *) sed -n '4,6p' "$0" ;;
esac
