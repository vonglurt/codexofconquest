#!/usr/bin/env bash
# SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
#
# run.sh — the one entry point. Every `make` target calls into here.
#   ./run.sh server | monitor | play | landing | edit | status | procs
#   ./run.sh stop [api|monitor|every] | restart — restart is the API server alone
#
# `server` and `restart` are one code path (`start_api`): both drain the old process
# before launching, both bound the launch, and both exit non-zero when nothing answered.
# WBAPI_PORT picks the port; it is exported as PORT, the name the server reads. `stop`
# stops the server answering on that port, by the pid its /api/ping reports, so a second
# world on another port survives it. `stop every` stops every WBAPI server on the machine.
# WBAPI_START_CMD overrides the launcher so the failed-start path is assertable
# (src/scripts/check-restart.js); nothing else sets it.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

export PORT="${WBAPI_PORT:-1367}"
SERVER_PAT="src/js/wbapi-server.js"
MONITOR_PAT="src/bin/monitor-snapshots.py"
START_CMD="${WBAPI_START_CMD:-./src/server/start-wbapi.sh}"
LAUNCH_TIMEOUT="${WBAPI_LAUNCH_TIMEOUT:-10}"
SETTLE_TIMEOUT="${WBAPI_SETTLE_TIMEOUT:-10}"
LAUNCH_LOG="$ROOT/build/milepoints/wbapi-server.log"
. "$ROOT/src/bin/procmatch.sh"

open_url()  { command -v open >/dev/null && open "$1" || echo "open $1"; }
in_term()   { # run a command in its own Terminal window (macOS), else background it
  if [ "$(uname)" = "Darwin" ] && [ -z "${NO_TERM:-}" ]; then
    # `alarm` survives the exec, so a blocked osascript dies by signal instead of
    # hanging the caller — the consent dialog for Terminal automation never returns.
    perl -e 'alarm shift; exec @ARGV or exit 127' "$LAUNCH_TIMEOUT" \
      osascript -e "tell application \"Terminal\" to do script \"cd '$ROOT' && $1\"" >/dev/null \
      || { echo "osascript did not return within ${LAUNCH_TIMEOUT}s — Terminal may be waiting on an Automation consent dialog" >&2; return 1; }
  else
    # A backgrounded launch that keeps the caller's stdout open hangs any caller
    # reading that pipe, long after the shell itself has exited.
    mkdir -p "$(dirname "$LAUNCH_LOG")"
    ( eval "$1" >>"$LAUNCH_LOG" 2>&1 & )
  fi
}
server_up() { curl -sf "http://localhost:$PORT/api/ping" >/dev/null 2>&1; }
api_count() { match_pids "$SERVER_PAT" | wc -l | tr -d ' '; }
mon_count() { match_pids "$MONITOR_PAT" | wc -l | tr -d ' '; }

port_pid()     { curl -sf "http://localhost:$PORT/api/ping" 2>/dev/null | sed -n 's/.*"pid": *\([0-9][0-9]*\).*/\1/p'; }
stop_every()   { local p; p="$(match_pids "$SERVER_PAT")";  [ -n "$p" ] && { kill $p 2>/dev/null; echo "API stopped ($(echo $p | wc -w | tr -d ' ') server(s), every port)"; } || echo "API not running"; }
stop_api() {
  server_up || {
    local n; n="$(api_count)"
    echo "API not running on :$PORT"
    [ "$n" = "0" ] || echo "  $n wbapi-server process(es) on other ports; ./run.sh stop every stops them all"
    return 0
  }
  local p; p="$(port_pid)"
  [ -n "$p" ] || { echo "the server on :$PORT does not report its pid (started before §DX-02ks-FU); stopping every server"; stop_every; return 0; }
  match_pids "$SERVER_PAT" | grep -qx "$p" || { echo "pid $p on :$PORT is not a wbapi-server; not killing it" >&2; return 1; }
  kill "$p" 2>/dev/null
  for _ in $(seq 1 $((SETTLE_TIMEOUT * 4))); do kill -0 "$p" 2>/dev/null || { echo "API stopped (:$PORT)"; return 0; }; sleep 0.25; done
  echo "pid $p on :$PORT still alive after ${SETTLE_TIMEOUT}s" >&2; return 1
}
stop_monitor() { local p; p="$(match_pids "$MONITOR_PAT")"; [ -n "$p" ] && { kill $p 2>/dev/null; echo "monitor stopped"; } || true; }

drain_api() { # wait for the port to stop answering, so no launch doubles up on it
  for _ in $(seq 1 $((SETTLE_TIMEOUT * 4))); do
    server_up || return 0; sleep 0.25
  done
  echo "a server still answers on :$PORT after ${SETTLE_TIMEOUT}s; not starting another" >&2
  return 1
}

wait_for_server() {
  for _ in $(seq 1 $((SETTLE_TIMEOUT * 4))); do server_up && return 0; sleep 0.25; done
  echo "API server did not answer on :$PORT within ${SETTLE_TIMEOUT}s" >&2; return 1
}

start_api() {
  drain_api      || return 1
  in_term "WBAPI_PORT=$PORT $START_CMD" || return 1
  wait_for_server || return 1
}

case "${1:-help}" in
  server)
    server_up && { echo "API already up on :$PORT"; exit 0; }
    start_api && echo "API server → :$PORT" ;;
  monitor)
    in_term "python3 src/bin/monitor-snapshots.py" ; echo "monitor started" ;;
  play)      open_url "$ROOT/play.html" ;;
  landing)   open_url "$ROOT/index.html" ;;
  edit)      open_url "$ROOT/edit.html" ;;
  stop)
    case "${2:-all}" in
      api)     stop_api ;;
      monitor) stop_monitor ;;
      every)   stop_every ;;
      *)       stop_api ; stop_monitor ;;
    esac ;;
  restart)
    stop_api
    start_api && echo "API server → :$PORT (restarted)" ;;
  status)
    server_up && echo "API   : UP   (:$PORT)" || echo "API   : down"
    echo "procs : $(api_count) api · $(mon_count) monitor" ;;
  procs)
    echo "$(api_count)" ;;
  *) sed -n '4,6p' "$0" ;;
esac
