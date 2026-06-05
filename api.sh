#!/usr/bin/env bash
# api.sh — Roll2Hit WBAPI wrapper (delegates to api/wb.js)
exec node "$(dirname "$0")/api/wb.js" "$@"
