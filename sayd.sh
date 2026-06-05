#!/usr/bin/env bash
# sayd.sh — say daemon; speaks queued messages one at a time
# Started automatically by say.sh; exits after ~10s of idle queue.
# Kill cleanly: kill $(cat milepoints/sayd.pid)
#
# Configurable constants — uncomment one VOICE and one RATE to use:
#
# VOICE="Samantha"    # American English female (default macOS)
# VOICE="Alex"        # American English male
# VOICE="Daniel"      # British English male
# VOICE="Karen"       # Australian English female
# VOICE="Moira"       # Irish English female
# VOICE="Tessa"       # South African English female
# VOICE="Victoria"    # American English female (older style)
# VOICE="Fred"        # Classic Mac voice
#
# RATE=175            # words per minute — default macOS rate
# RATE=200            # slightly faster
# RATE=220            # noticeably faster
# RATE=150            # slower and clearer
# RATE=130            # deliberate pace

VOICE="Samantha"
RATE=185
MAX_IDLE=34   # polls before exit: 34 × 0.3s ≈ 10s of silence

ROOT="$(cd "$(dirname "$0")" && pwd)"
QUEUE_DIR="$ROOT/milepoints/say.queue.d"
PID_FILE="$ROOT/milepoints/sayd.pid"
LOCK_FILE="$ROOT/milepoints/say.lock"

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
            [[ -n "$TEXT" ]] && flock "$LOCK_FILE" say -v "$VOICE" -r "$RATE" "$TEXT"
        fi
    else
        sleep 0.3
        (( ++idle >= MAX_IDLE )) && break
    fi
done
