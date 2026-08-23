#!/usr/bin/env bash
# SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
# sayd.sh — say daemon; speaks queued messages one at a time
# Started automatically by say.sh; exits after ~10s of idle queue.
# Kill cleanly: kill $(cat milepoints/sayd.pid)
#
VOICES=(
    "Samantha"          # en_US female
    "Daniel"            # en_GB male
    "Karen"             # en_AU female
    "Moira"             # en_IE female
    "Tessa"             # en_ZA female
    "Rishi"             # en_IN male
    "Fred"              # en_US classic male
    "Eddy (English (US))"
    "Flo (English (US))"
    "Reed (English (US))"
    "Rocko (English (US))"
    "Sandy (English (US))"
    "Shelley (English (US))"
)
RATE=190
MAX_IDLE=34   # polls before exit: 34 × 0.3s ≈ 10s of silence

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
QUEUE_DIR="$ROOT/build/milepoints/say.queue.d"
PID_FILE="$ROOT/build/milepoints/sayd.pid"
LOCK_FILE="$ROOT/build/milepoints/say.lock"

mkdir -p "$QUEUE_DIR"
printf '%d\n' $$ > "$PID_FILE"
trap 'rm -f "$PID_FILE"' EXIT INT TERM

idle=0
while true; do
    NEXT=$(ls "$QUEUE_DIR" 2>/dev/null | grep '\.txt$' | sort | head -1)
    if [[ -n "$NEXT" ]]; then
        idle=0
        FILE="$QUEUE_DIR/$NEXT"
        WORK="${FILE}.speaking"
        # atomic claim: mv ensures only one daemon instance ever processes a file
        if mv "$FILE" "$WORK" 2>/dev/null; then
            TEXT=$(cat "$WORK")
            rm -f "$WORK"
            if [[ -n "$TEXT" ]]; then
                VOICE="${VOICES[RANDOM % ${#VOICES[@]}]}"
                python3 - "$LOCK_FILE" "$VOICE" "$RATE" "$TEXT" <<'PY'
import fcntl, subprocess, sys
lock_file, voice, rate, text = sys.argv[1:]
with open(lock_file, "w") as lf:
    fcntl.flock(lf, fcntl.LOCK_EX)
    subprocess.run(["say", "-v", voice, "-r", rate, text])
PY
            fi
        fi
    else
        sleep 0.3
        (( ++idle >= MAX_IDLE )) && break
    fi
done
