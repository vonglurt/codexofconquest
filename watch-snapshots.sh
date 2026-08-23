#!/usr/bin/env bash
# SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson and Claude
# MIT License — Copyright (c) 2026 Paul Richeson
# Watches for new roll2hit-v3-YYYYMMDD-HHMMSS.html files and archives them
# once fully written (no open file handles).
#
# Usage: ./watch-snapshots.sh
#        Ctrl-C to stop.
#
# macOS FSEvents has no CloseWrite event, so we simulate it:
#   1. fswatch fires on Updated/Created
#   2. poll lsof until no handles are open
#   3. wait SETTLE_SECS (grace period)
#   4. re-verify no handles
#   5. run archive-snapshots.sh (serialized via flock)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOCK="$SCRIPT_DIR/.archive-lock"
SETTLE_SECS=2   # grace period after handles close
MAX_WAIT_SECS=30

command -v fswatch >/dev/null 2>&1 || { echo "fswatch not found — install via: brew install fswatch"; exit 1; }

is_closed() {
    [[ -z "$(lsof -t "$1" 2>/dev/null)" ]]
}

handle_file() {
    local f="$1"
    [[ -f "$f" ]] || return 0

    local basename
    basename="$(basename "$f")"

    # Poll until all handles close
    local ticks=0
    local max_ticks=$(( MAX_WAIT_SECS * 2 ))
    while ! is_closed "$f"; do
        sleep 0.5
        (( ticks++ )) || true
        if (( ticks > max_ticks )); then
            echo "$(date '+%H:%M:%S') TIMEOUT: handles still open on $basename — skipping" >&2
            return 1
        fi
    done

    # Grace period
    sleep "$SETTLE_SECS"

    # Re-verify
    if ! is_closed "$f"; then
        echo "$(date '+%H:%M:%S') REOPEN: $basename was reopened after settle — skipping" >&2
        return 1
    fi

    echo "$(date '+%H:%M:%S') READY: $basename — handles closed, archiving..."

    # Serialize: only one archive-snapshots.sh at a time (it globs all ready files)
    (
        flock -x 9
        "$SCRIPT_DIR/archive-snapshots.sh"
    ) 9>"$LOCK"
}

trap 'echo; echo "Watcher stopped."; rm -f "$LOCK"' EXIT INT TERM

echo "$(date '+%H:%M:%S') Watching $SCRIPT_DIR"
echo "Pattern: roll2hit-v3-YYYYMMDD-HHMMSS.html"
echo "Settle:  ${SETTLE_SECS}s after handles close"
echo "Press Ctrl-C to stop."
echo "---"

fswatch \
    --zero \
    --latency 1 \
    --event Updated \
    --event Created \
    --event MovedTo \
    --include 'roll2hit-v3-[0-9]{8}-[0-9]{6}\.html' \
    --exclude '.*' \
    "$SCRIPT_DIR" \
| while IFS= read -r -d '' file; do
    handle_file "$file" &
done
