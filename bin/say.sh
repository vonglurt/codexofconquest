#!/usr/bin/env bash
# SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
# say.sh — enqueue text for speech and return immediately
# Usage: say.sh "some text"  OR  echo "some text" | say.sh
#
# Voice and rate are configured in sayd.sh (the daemon that does the speaking).

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOG="$ROOT/milepoints/say.log"
QUEUE_DIR="$ROOT/milepoints/say.queue.d"
DAEMON="$ROOT/sayd.sh"

if [[ $# -gt 0 ]]; then
    TEXT="$*"
else
    TEXT="$(cat)"
fi

if [[ -z "$TEXT" ]]; then
    echo "Usage: say.sh <text>  OR  echo <text> | say.sh" >&2
    exit 1
fi

mkdir -p "$QUEUE_DIR"
echo "$TEXT" | tee -a "$LOG"

# sequence counter makes filenames sort in strict call order within the same second
SEQ_FILE="$ROOT/milepoints/say.seq"
SEQ=$(( $(cat "$SEQ_FILE" 2>/dev/null || echo 0) + 1 ))
printf '%d\n' "$SEQ" > "$SEQ_FILE"

printf '%s\n' "$TEXT" > "$QUEUE_DIR/$(date +%Y%m%d-%H%M%S)-$(printf '%06d' "$SEQ").txt"

# use pgrep so the check is reliable even when the daemon was just forked
pgrep -qf "sayd\\.sh" 2>/dev/null || { "$DAEMON" </dev/null &>/dev/null & disown; }
