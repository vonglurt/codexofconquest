#!/bin/bash
# say.sh — macOS say wrapper that also appends to say.log
# Usage: say.sh "some text"  (mirrors: say "some text")
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

LOG="/Users/user/code/roll2hit.com/milepoints/say.log"

if [[ $# -gt 0 ]]; then
    TEXT="$*"
else
    TEXT="$(cat)"
fi

if [[ -z "$TEXT" ]]; then
    echo "Usage: say.sh <text>  OR  echo <text> | say.sh" >&2
    exit 1
fi

echo "$TEXT" | tee -a "$LOG"
say -v "$VOICE" -r "$RATE" "$TEXT"
