#!/bin/bash
# SPDX-License-Identifier: MIT — Copyright (c) 2026 PaulRicheson@Roll2Hit.com

# Function to process input stream
# 1. Removes timestamps (digits:digits)
# 2. Replaces ALL whitespace (newlines, tabs, spaces) with a single space
# 3. Trims leading/trailing whitespace
# 4. Appends a period on its own line at the end
process_input() {
    sed -E 's/[0-9]+:[0-9]+//g' | \
    tr -s '[:space:]' ' ' | \
    sed -E 's/^[[:space:]]+//; s/[[:space:]]+$//' | \
    sed -E '$ a\
.'
}

# Check if stdin has data (is not a terminal)
if [ ! -t 0 ]; then
    # --- CASE 1: Input is piped or redirected ---
    cat | process_input

elif [ $# -ge 1 ]; then
    # --- CASE 2: File argument provided ---
    cat "$1" | process_input

else
    # --- CASE 3: No input and no arguments ---
    # Fallback: Read from clipboard, process, and output to terminal
    pbpaste | process_input
fi   