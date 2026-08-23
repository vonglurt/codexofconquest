#!/usr/bin/env bash
# SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
# api.sh — Codex of Conquest WBAPI wrapper (delegates to api/wb.js)
exec node "$(dirname "$0")/../api/wb.js" "$@"
