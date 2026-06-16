#!/usr/bin/env bash
# MIT License — Copyright (c) 2026 Paul Richeson
# scripts/cleanup-cruft.sh — purge accumulated transient artifacts.
#
# Targets timestamped autosave outputs and append-only logs.  Newest entries
# in each category are kept; older ones are archived into a single dated
# tarball at milepoints/archive/cleanup-YYYYMMDD-HHMMSS.tar.gz, then
# removed from their original locations.  Logs above the size cap are
# copied into the same archive before being truncated in place.
#
# Archives themselves are pruned by --archive-keep (default 20).
#
# Usage:
#   scripts/cleanup-cruft.sh              # execute with defaults
#   scripts/cleanup-cruft.sh --dry-run    # print plan, change nothing
#   scripts/cleanup-cruft.sh --keep 50    # override default retention
#   scripts/cleanup-cruft.sh --quiet      # suppress per-file output
#
# Per-category overrides:
#   --patches N        keep most recent N  (default 20)  — milepoints/patches/*.patch[.log]
#   --heatmaps N       keep most recent N  (default 10)  — milepoints/heatmap-*.txt
#   --reweaves N       keep most recent N  (default 10)  — milepoints/reweave-maps-*.txt
#   --snapshots N      keep most recent N  (default 3)   — roll2hit-v3-YYYYMMDD-HHMMSS.html
#   --log-mb N         cap log files at N MB              (default 1)
#   --archive-keep N   keep most recent N archives         (default 20)
#   --no-archive       delete pruned files instead of archiving them
#
# Never touches:  milepoints/patches/_last.html, _last.name, _base.html.gz,
#                 node_modules/, playwright-report/, test-results/, .git/

set -euo pipefail

DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$DIR"

DRY_RUN=0
QUIET=0
NO_ARCHIVE=0
KEEP_PATCHES=20
KEEP_HEATMAPS=10
KEEP_REWEAVES=10
KEEP_SNAPSHOTS=3
KEEP_ARCHIVES=20
LOG_CAP_MB=1

ARCHIVE_DIR="milepoints/archive"
ARCHIVE_TS=$(date +%Y%m%d-%H%M%S)
ARCHIVE_PATH="$ARCHIVE_DIR/cleanup-$ARCHIVE_TS.tar.gz"
STAGING=""        # tmpdir holding files to archive, populated as we go
PRUNE_LIST=()     # original paths to remove after archive is built
LOG_SNAPSHOT_MAP=()  # parallel pairs: "log:original_path"

while [ $# -gt 0 ]; do
  case "$1" in
    --dry-run)      DRY_RUN=1 ;;
    --quiet)        QUIET=1 ;;
    --no-archive)   NO_ARCHIVE=1 ;;
    --keep)         KEEP_PATCHES="$2"; KEEP_HEATMAPS="$2"; KEEP_REWEAVES="$2"; KEEP_SNAPSHOTS="$2"; shift ;;
    --patches)      KEEP_PATCHES="$2";   shift ;;
    --heatmaps)     KEEP_HEATMAPS="$2";  shift ;;
    --reweaves)     KEEP_REWEAVES="$2";  shift ;;
    --snapshots)    KEEP_SNAPSHOTS="$2"; shift ;;
    --archive-keep) KEEP_ARCHIVES="$2";  shift ;;
    --log-mb)       LOG_CAP_MB="$2";     shift ;;
    -h|--help)      sed -n '2,/^$/p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *)              echo "unknown flag: $1" >&2; exit 2 ;;
  esac
  shift
done

say()  { [ "$QUIET" -eq 0 ] && echo "$@" || true; }
note() { [ "$QUIET" -eq 0 ] && echo "  $@" || true; }

# Initialize staging tmpdir (lazy — only when something needs archiving).
init_staging() {
  if [ -z "$STAGING" ] && [ "$DRY_RUN" -eq 0 ] && [ "$NO_ARCHIVE" -eq 0 ]; then
    STAGING=$(mktemp -d "${TMPDIR:-/tmp}/cleanup-cruft.XXXXXX")
    trap 'rm -rf -- "$STAGING"' EXIT
  fi
}

# Queue each file in $@ except the most recent $1 (by filename, which is
# timestamped — newest sorts last under `sort`).  Files are appended to
# PRUNE_LIST; the archive build at end-of-script writes them out and rms them.
prune_keep_newest() {
  local keep=$1; shift
  local label=$1; shift
  local total=$#
  if [ "$total" -le "$keep" ]; then
    note "$label: $total file(s) ≤ keep=$keep — nothing to do"
    return
  fi
  local cull=$((total - keep))
  local fate
  if [ "$NO_ARCHIVE" -eq 1 ]; then fate="deleting"; else fate="archiving+deleting"; fi
  note "$label: $total file(s), $fate $cull oldest, keeping $keep newest"
  local i=0
  for f in "$@"; do
    i=$((i + 1))
    if [ "$i" -le "$cull" ]; then
      if [ "$DRY_RUN" -eq 1 ]; then
        note "  would purge: $f"
      else
        PRUNE_LIST+=("$f")
      fi
    fi
  done
}

cap_log_size() {
  local f=$1
  [ -f "$f" ] || return 0
  local bytes
  bytes=$(stat -f%z "$f" 2>/dev/null || stat -c%s "$f" 2>/dev/null || echo 0)
  local cap=$((LOG_CAP_MB * 1024 * 1024))
  if [ "$bytes" -le "$cap" ]; then
    note "$f: $(echo "scale=1; $bytes/1048576" | bc 2>/dev/null || echo "$bytes B") ≤ ${LOG_CAP_MB}MB — leaving alone"
    return
  fi
  local action
  if [ "$NO_ARCHIVE" -eq 1 ]; then action="truncating"; else action="archiving + truncating"; fi
  note "$f: $(echo "scale=1; $bytes/1048576" | bc 2>/dev/null || echo "$bytes B") > ${LOG_CAP_MB}MB — $action to last ${LOG_CAP_MB}MB"
  if [ "$DRY_RUN" -eq 1 ]; then return; fi
  # Snapshot the full log into staging before truncating.
  if [ "$NO_ARCHIVE" -eq 0 ]; then
    init_staging
    local dest="$STAGING/$f"
    mkdir -p -- "$(dirname "$dest")"
    cp -- "$f" "$dest"
  fi
  tail -c "$cap" -- "$f" > "$f.tmp" && mv "$f.tmp" "$f"
}

# Build the dated tarball from PRUNE_LIST + staged log snapshots, then
# remove originals.  No-op if nothing was queued.
finalize_archive() {
  if [ "$DRY_RUN" -eq 1 ]; then return; fi

  if [ "$NO_ARCHIVE" -eq 1 ]; then
    for f in "${PRUNE_LIST[@]}"; do rm -f -- "$f"; done
    return
  fi

  local pruned=${#PRUNE_LIST[@]}
  local has_log_snapshots=0
  [ -n "$STAGING" ] && [ -d "$STAGING" ] && [ -n "$(ls -A "$STAGING" 2>/dev/null)" ] && has_log_snapshots=1

  if [ "$pruned" -eq 0 ] && [ "$has_log_snapshots" -eq 0 ]; then
    return
  fi

  init_staging
  mkdir -p -- "$ARCHIVE_DIR"

  # Stage the prune-list files alongside the log snapshots (preserving paths).
  for f in "${PRUNE_LIST[@]}"; do
    local dest="$STAGING/$f"
    mkdir -p -- "$(dirname "$dest")"
    mv -- "$f" "$dest"
  done

  # tar from inside STAGING so paths in the archive are relative to repo root.
  ( cd "$STAGING" && tar -czf "$DIR/$ARCHIVE_PATH" . )

  local archived_count
  archived_count=$(tar -tzf "$DIR/$ARCHIVE_PATH" 2>/dev/null | grep -v '/$' | wc -l | tr -d ' ')
  local archive_size
  archive_size=$(du -h "$DIR/$ARCHIVE_PATH" 2>/dev/null | awk '{print $1}')
  note "archive: $ARCHIVE_PATH ($archived_count files, $archive_size)"
}

# Prune old archives themselves so they don't grow without bound.
prune_old_archives() {
  [ -d "$ARCHIVE_DIR" ] || return 0
  local arcs=()
  while IFS= read -r line; do arcs+=("$line"); done < <(find "$ARCHIVE_DIR" -maxdepth 1 -name 'cleanup-*.tar.gz' -print0 | xargs -0 -n1 echo 2>/dev/null | sort)
  if [ "${#arcs[@]}" -le "$KEEP_ARCHIVES" ]; then
    note "$ARCHIVE_DIR: ${#arcs[@]} archive(s) ≤ keep=$KEEP_ARCHIVES — nothing to do"
    return
  fi
  local cull=$((${#arcs[@]} - KEEP_ARCHIVES))
  note "$ARCHIVE_DIR: ${#arcs[@]} archive(s), deleting $cull oldest, keeping $KEEP_ARCHIVES newest"
  local i=0
  for a in "${arcs[@]}"; do
    i=$((i + 1))
    if [ "$i" -le "$cull" ]; then
      if [ "$DRY_RUN" -eq 1 ]; then
        note "  would delete archive: $a"
      else
        rm -f -- "$a"
      fi
    fi
  done
}

say "── cleanup-cruft ($([ "$DRY_RUN" -eq 1 ] && echo DRY-RUN || echo execute)) ──"

# 1. milepoints/patches/*.patch (+ matching .patch.log)
if [ -d milepoints/patches ]; then
  patches=()
  while IFS= read -r line; do patches+=("$line"); done < <(find milepoints/patches -maxdepth 1 -name 'roll2hit-v3-*.patch' -print0 | xargs -0 -n1 echo 2>/dev/null | sort)
  if [ "${#patches[@]}" -gt 0 ]; then
    prune_keep_newest "$KEEP_PATCHES" "milepoints/patches/*.patch" "${patches[@]}"
  else
    note "milepoints/patches/*.patch: 0 files"
  fi
  # Always sweep .patch.log alongside their .patch (if they outnumber retention)
  logs=()
  while IFS= read -r line; do logs+=("$line"); done < <(find milepoints/patches -maxdepth 1 -name 'roll2hit-v3-*.patch.log' -print0 | xargs -0 -n1 echo 2>/dev/null | sort)
  if [ "${#logs[@]}" -gt 0 ]; then
    prune_keep_newest "$KEEP_PATCHES" "milepoints/patches/*.patch.log" "${logs[@]}"
  fi
fi

# 2. milepoints/heatmap-*.txt
if [ -d milepoints ]; then
  heat=()
  while IFS= read -r line; do heat+=("$line"); done < <(find milepoints -maxdepth 1 -name 'heatmap-*.txt' -print0 | xargs -0 -n1 echo 2>/dev/null | sort)
  if [ "${#heat[@]}" -gt 0 ]; then
    prune_keep_newest "$KEEP_HEATMAPS" "milepoints/heatmap-*.txt" "${heat[@]}"
  else
    note "milepoints/heatmap-*.txt: 0 files"
  fi
fi

# 3. milepoints/reweave-maps-*.txt
if [ -d milepoints ]; then
  rw=()
  while IFS= read -r line; do rw+=("$line"); done < <(find milepoints -maxdepth 1 -name 'reweave-maps-*.txt' -print0 | xargs -0 -n1 echo 2>/dev/null | sort)
  if [ "${#rw[@]}" -gt 0 ]; then
    prune_keep_newest "$KEEP_REWEAVES" "milepoints/reweave-maps-*.txt" "${rw[@]}"
  else
    note "milepoints/reweave-maps-*.txt: 0 files"
  fi
fi

# 4. root-level stamped HTML snapshots (saveAndRestart leftovers)
snaps=()
while IFS= read -r line; do snaps+=("$line"); done < <(find . -maxdepth 1 -name 'roll2hit-v3-*.html' -print0 | xargs -0 -n1 echo 2>/dev/null | sort)
if [ "${#snaps[@]}" -gt 0 ]; then
  prune_keep_newest "$KEEP_SNAPSHOTS" "roll2hit-v3-*.html" "${snaps[@]}"
else
  note "roll2hit-v3-*.html: 0 files"
fi

# 5. Cap log sizes (truncate, don't delete — the files are referenced)
cap_log_size milepoints/api-cli.log
cap_log_size milepoints/wbapi-server.log
cap_log_size milepoints/npc-speak.log
cap_log_size milepoints/say.log

# 6. Build the dated archive from the queued files, then remove originals.
finalize_archive

# 7. Prune old archives so milepoints/archive/ stays bounded.
prune_old_archives

say "── done ──"
