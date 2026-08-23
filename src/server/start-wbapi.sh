#!/usr/bin/env bash
# SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
#
# start-wbapi.sh — launch the WBAPI node server, and say plainly where it runs.
#
# Node resolves modules from the directory of the ENTRY FILE, and resolves
# node_modules by walking UP from there. The entry file is src/js/wbapi-server.js
# and node_modules lives at the repo root, so this script always cd's to the
# repo root first and launches with a root-relative path. Launching from any
# other working directory is the usual way this breaks.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

ENTRY="src/js/wbapi-server.js"
PORT="${WBAPI_PORT:-1367}"

printf '\033[1m── WBAPI server ───────────────────────────────────────────\033[0m\n'
printf '  node binary   : %s (%s)\n' "$(command -v node)" "$(node --version)"
printf '  working dir   : %s\n' "$ROOT"
printf '  entry file    : %s\n' "$ENTRY"
printf '  node_modules  : %s\n' "$ROOT/node_modules"
printf '  listening on  : http://localhost:%s\n' "$PORT"
printf '  health check  : curl -s http://localhost:%s/api/ping\n' "$PORT"
printf '  stop with     : make stop   (or Ctrl-C in this window)\n'
printf '\033[1m───────────────────────────────────────────────────────────\033[0m\n\n'

exec node "$ENTRY" "$@"
