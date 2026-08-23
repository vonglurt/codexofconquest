#!/usr/bin/env bash
# SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
# MIT License — Copyright (c) 2026 Paul Richeson
# Archive dated roll2hit-v3 snapshots as a patch chain.
#
# Usage: ./archive-snapshots.sh
#
# Picks up roll2hit-v3-YYYYMMDD-HHMMSS.html from:
#   ./ (root)
#   ./milepoints/ (uncompressed stragglers)
#
# Patch store: milepoints/patches/
#   _base.html.gz   — first snapshot, gzip base
#   _last.html      — most recent, kept for next diff
#   _last.name      — filename of _last.html
#   *.patch         — unified diff for each subsequent snapshot
#
# All patch files are plain text — git-trackable and diffable.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ROOT_DIR="$SCRIPT_DIR"
MILEPOINTS="$ROOT_DIR/milepoints"
PATCHES="$MILEPOINTS/patches"
LAST_HTML="$PATCHES/_last.html"
LAST_NAME="$PATCHES/_last.name"

mkdir -p "$PATCHES"

shopt -s nullglob
ROOT_SNAPS=("$ROOT_DIR"/roll2hit-v3-????????-??????.html)
MP_SNAPS=("$MILEPOINTS"/roll2hit-v3-????????-??????.html)
ALL_NEW=(
    "${ROOT_SNAPS[@]+"${ROOT_SNAPS[@]}"}"
    "${MP_SNAPS[@]+"${MP_SNAPS[@]}"}"
)

if [[ ${#ALL_NEW[@]} -eq 0 ]]; then
    echo "No dated snapshot files found."
    exit 0
fi

# Sort alphabetically (= chronologically by timestamp)
IFS=$'\n' SORTED=($(printf '%s\n' "${ALL_NEW[@]}" | sort))
unset IFS

echo "Found ${#SORTED[@]} snapshot(s) to patch-archive."

for f in "${SORTED[@]}"; do
    fname="$(basename "$f")"
    stem="${fname%.html}"

    if [[ -f "$LAST_HTML" ]]; then
        prev_label="$(cat "$LAST_NAME" 2>/dev/null || echo '_last.html')"
        patch_out="$PATCHES/${stem}.patch"
        # diff exits 1 when files differ (normal) — suppress that with || true
        diff -U2 --label "$prev_label" --label "$fname" "$LAST_HTML" "$f" > "$patch_out" || true
        echo "  patch:  $fname  ($(wc -l < "$patch_out") lines)"
    else
        # first snapshot: save as gzip base
        gzip -9 -c "$f" > "$PATCHES/_base.html.gz"
        echo "  base:   $fname"
    fi

    cp "$f" "$LAST_HTML"
    echo "$fname" > "$LAST_NAME"
    rm "$f"
done

patch_count=$(ls -1 "$PATCHES"/*.patch 2>/dev/null | wc -l | tr -d ' ')
echo "Done. Patches stored: $patch_count  (base + _last.html kept)"
