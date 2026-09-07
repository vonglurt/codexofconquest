#!/usr/bin/env bash
# SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
# procmatch.sh — PIDs whose command line matches a pattern, never the caller's own.
#
# `pgrep -f` and `pkill -f` match the WHOLE command line, and the shell that invoked them
# is in the process table too — so a caller whose own argv happens to name the file it is
# asking about matches itself. `pgrep` then reports a process that is not running; `pkill`
# kills the caller. Source this file and use match_pids in place of both.
#
# Ancestors are what a shell invocation actually produces, and they are what is excluded:
# a process the caller STARTED is a descendant and is deliberately still matched.

match_pids() {           # match_pids <extended-regex over the full command line>
  local pat="$1" anc=" " p="$$" pid
  while [ -n "$p" ] && [ "$p" != "0" ] && [ "$p" != "1" ]; do
    anc="$anc$p "
    p="$(ps -o ppid= -p "$p" 2>/dev/null | tr -d ' ')"
  done
  for pid in $(pgrep -f "$pat" 2>/dev/null); do
    case "$anc" in *" $pid "*) continue ;; esac
    printf '%s\n' "$pid"
  done
}
