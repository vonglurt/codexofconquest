<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson and Claude -->
# tools/ — Standalone dev & CLI utilities

Helper scripts that are **not** part of the game runtime or the WBAPI server
bundle. Nothing in `roll2hit-v3.html` or `wbapi-server.js` depends on these.

| File | What it does |
|------|--------------|
| `worldmap.js` | Terminal ASCII world-map views. Spawned by `./api.sh worldmap [--city/--region/--search/--route]` (path wired in `../api/wb.js`); also runnable directly: `node tools/worldmap.js --regions`. |
| `layout-solve.js` | Propagates node coordinates from geo anchors: `node tools/layout-solve.js --apply`. |
| `layout-spring.js` | Force-directed layout experiment (standalone). |
| `wbapi-cli.js` | Legacy WBAPI CLI (superseded by `../api/wb.js` / `./api.sh`). |
| `parse-nodes.js` | One-off node-parsing helper. |
| `remove-times.sh` | Old one-shot text-cleanup utility (strips `digits:digits` timestamps, collapses whitespace). |

Snapshot/lifecycle scripts (`monitor-snapshots.py`, `watch-snapshots.sh`,
`archive-snapshots.sh`) stay at the repo **root** — they anchor to the root
directory and manage the live server + snapshot pipeline.
