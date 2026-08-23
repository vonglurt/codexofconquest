#!/usr/bin/env bash
# SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
# MIT License — Copyright (c) 2026 Paul Richeson
# scripts/publish-bootstrap.sh — §MESH-01-FU 7: snapshot a tracker's live peer
# table in peers.txt format, for MANUAL bootstrap publishing.
#
# Publishing is deliberately manual (lab-report-mesh-sync-architecture.md):
# this script only FETCHES and prints — there is no automatic write path to
# any bootstrap host. The operator reviews the snapshot, then copies it up by
# hand (a GitHub Gist, scp to a static host, any dumb file server). Consumers
# point BOOTSTRAP_URLS at the raw URL, or paste lines straight into peers.txt
# — the formats are identical (`addr engineVer worldHash`, `#` comments;
# parsers take the first whitespace token as the addr and ignore the rest).
#
# Usage:
#   scripts/publish-bootstrap.sh <tracker-url> [options]
#   scripts/publish-bootstrap.sh http://tracker.example:1367 > bootstrap.txt
#
# Options:
#   --wh <hash>    filter: only servers announcing this worldHash
#   --ev <ver>     filter: only servers announcing this engineVer
#   --proto <n>    filter: only servers speaking mesh proto n
#   --no-howto     suppress the publish instructions (stderr)
#
# Snapshot → stdout. Instructions → stderr (so `> file` stays clean).

set -euo pipefail

TRACKER='' WH='' EV='' PROTO='' HOWTO=1
while [ $# -gt 0 ]; do
  case "$1" in
    --wh)       WH="$2"; shift 2 ;;
    --ev)       EV="$2"; shift 2 ;;
    --proto)    PROTO="$2"; shift 2 ;;
    --no-howto) HOWTO=0; shift ;;
    -h|--help)  sed -n '3,26p' "$0"; exit 0 ;;
    -*)         echo "unknown option: $1 (see --help)" >&2; exit 2 ;;
    *)          TRACKER="$1"; shift ;;
  esac
done
[ -n "$TRACKER" ] || { echo "usage: scripts/publish-bootstrap.sh <tracker-url> [--wh h] [--ev v] [--proto n]" >&2; exit 2; }

QS='format=txt'
[ -n "$WH" ]    && QS="$QS&wh=$WH"
[ -n "$EV" ]    && QS="$QS&ev=$EV"
[ -n "$PROTO" ] && QS="$QS&p=$PROTO"
URL="${TRACKER%/}/api/tracker/peers?$QS"

SNAPSHOT=$(curl -fsS --max-time 10 "$URL") || { echo "fetch failed: $URL" >&2; exit 1; }
printf '%s\n' "$SNAPSHOT"

ROWS=$(printf '%s\n' "$SNAPSHOT" | grep -cv '^\s*\(#\|$\)' || true)
if [ "$HOWTO" = 1 ]; then
  cat >&2 <<EOF

# ── manual publish (the bootstrap file is a human-reviewed artifact) ────────
# $ROWS peer row(s) above. Review them, then copy the snapshot up by hand:
#
#   gist:  scripts/publish-bootstrap.sh $TRACKER > bootstrap.txt
#          → paste bootstrap.txt into a GitHub Gist, share the RAW url
#   scp:   scripts/publish-bootstrap.sh $TRACKER > bootstrap.txt
#          → scp bootstrap.txt you@host:/var/www/r2h-bootstrap.txt
#
# Consumers (either works — same format):
#   BOOTSTRAP_URLS=https://…/raw/…/bootstrap.txt ./wbapi-toggle.sh restart
#   …or paste the peer lines into peers.txt next to wbapi-server.js
#
# A 'tracker <url>' line may be added by hand to also hand out the tracker.
EOF
fi
