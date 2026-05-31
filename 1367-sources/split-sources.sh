#!/usr/bin/env bash
# split-sources.sh — split large source .txt files into 200k chunks
# Usage: ./split-sources.sh [directory]
# Default directory: same folder as this script

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DIR="${1:-$SCRIPT_DIR}"

node "$SCRIPT_DIR/split-sources.js" "$DIR"
