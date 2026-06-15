<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->

# Lab Report — Cell Map & MUD Redesign (§CELL-01 through §CELL-11)

**Sections:** §CELL-01 through §CELL-11  
**Date:** 2026-06-14  
**Status:** ✅ All 11 sections complete

---

## Summary

A complete replacement of the Roll2Hit navigation system. The old corridor-based model — where movement triggered `storyMove(dir)` → corridor prompt → `storyCorridorTravel()` with Manhattan-distance gating — was removed and replaced by a cell-grid model: every keypress moves the player exactly one `(r,c)` cell. The work touched the client HTML, server, API layer, CLI tooling, and documentation.

---

## Why This Was Done

The corridor system created three problems:

1. **Fake topology.** Exits were stored as `node.N/S/E/W` strings — explicit pointers that could go stale and create phantom edges (`brokenEdge` audit checks existed specifically for this). The "highway mesh" of J-nodes auto-generated to fill gaps between cities was a compensating artifact.

2. **Dead startup cost.** `_buildNodeExits()` ran on every page load to re-populate `node.N/S/E/W` in memory from `NODE_COORDS` adjacency. This is exactly what `CELL_GRID` does — but later, faster, without touching node objects.

3. **Non-obvious movement semantics.** Pressing North when the nearest northern neighbor was 5 cells away launched a dialog. New players expected one step = one cell.

The cell system makes topology implicit: two nodes are connected if and only if their `(r,c)` coordinates are adjacent. No stored exit fields. No phantom edges. No audit checks for diagonal exits.

---

## What Changed

### §CELL-01 — N/E/S/W field strip (roll2hit-v3.html)
All `N:`, `E:`, `S:`, `W:` properties removed from NODE_MAP entries in the HTML source. 268 zombie J-stubs (no `r,c`) remained — addressed in §CELL-05b.

### §CELL-02 — CELL_GRID construction (roll2hit-v3.html)
`CELL_GRID` (`"r,c" → nodeCode`) built once at startup from `NODE_COORDS`. This is the single source of truth for all adjacency queries.

### §CELL-03 — cellMove (roll2hit-v3.html)
`cellMove(dir)` replaces `storyMove(dir)`. One keypress = one cell. Named nodes entered when `CELL_GRID["r,c"]` exists; empty cells handled by `_enterEmptyCell` (§CELL-04).

### §CELL-04 — _enterEmptyCell (roll2hit-v3.html)
Empty-cell traversal: terrain inferred from `_inferTerrain(r, c)` (nearest named neighbor's terrain, with road fallback). Encounter roll against `TERRAIN_ENCOUNTER_RATE`. Hunt mode works on any empty cell move.

### §CELL-05 — Junction bulk-delete
All `junction:true` nodes bulk-deleted via `POST /api/admin/delete-junctions`. J13 and WRO promoted to named midlands nodes.

### §CELL-05b — Zombie J-stub purge
268 J-stubs with `junction:false` and no `r,c` deleted. `name:junction` + `junction:false` fields removed from all surviving nodes. Net result: 419 clean named nodes.

### §CELL-06 — Server BFS rewrite (wbapi-server.js)
All server-side graph algorithms (highway, reweave, fill-gap, fix-diagonal, reachability) replaced with cell-grid BFS. `buildCellGrid(nm, coords)` promoted to module scope. `MOVES4 = [[-1,0],[1,0],[0,1],[0,-1]]` and `DIR_NAMES = ['N','S','E','W']` define the four cardinal directions.

### §CELL-07 — MUD multi-session layer (wbapi-server.js)
In-memory `SESSIONS` store (`sessionId → {id, playerName, r, c, nodeCode, state, lastSeen}`). Seven REST endpoints under `/api/session/`: `start`, `move`, `look`, `who`, `say`, `end`, `events`. Server-Sent Events (SSE) broadcast `player_arrived` and `chat` events to co-present players. 30-minute idle TTL.

### §CELL-08 — WBAPI cell endpoints (wbapi-server.js)
Five new read-only endpoints:
- `GET /api/cell/:r/:c` — node at a grid cell
- `GET /api/cell/:r/:c/neighbors` — N/E/S/W neighbors
- `GET /api/grid/region?r1=&c1=&r2=&c2=` — 2D bounding box
- `GET /api/grid/heatmap` — all cells with adjacency heat 0–4
- `GET /api/grid/reachability[?hub=LHR]` — BFS reachable vs unreachable

`POST /api/node` rejects N/E/S/W fields. `PUT /api/node/:code` rejects N/E/S/W/junction fields.

### §CELL-09 — Quest cell triggers (roll2hit-v3.html)
Quest activation and BFS waypoint pathfinding updated to use cell grid, not node edge graph. Hunt mode updated for cell-based encounter roll.

### §CELL-10 — Minimap live cursor + fog-of-war (roll2hit-v3.html)
Minimap shows live player position as a cursor. Visited cells tracked per-cell (not per-node). Fog-of-war reveals cells as the player walks.

### §CELL-11A — Dead-code removal (roll2hit-v3.html)
`storyMove_LEGACY`, `buildCorridorMap`, `_buildNodeExits`, `_showCorridorPrompt`, `storyCorridorTravel`, `_wireGlyph`, `_corridorTerrain`, `_routeSegments`, `CORRIDOR_TERRAIN`, `CORRIDOR_CELLS`, `_corridorPendingFrom/To/Dir`, `<div id="story-corridor-overlay">` HTML and CSS, and the `Object.entries(CORRIDOR_CELLS).forEach(...)` block in `_setActivePath` all removed.

### §CELL-11B — Documentation sync (this report)
All markdown docs updated: `index.md`, `mechanics.md`, `world.md`, `story.md`, `story-flowchart.md`, `docs-node-network.md`, `maps.md`, `wbapi-help.md`, `API-README.md`. `spec-corridors.md` marked superseded. Lab report created.

---

## Non-Obvious Decisions

**`buildCellGrid` rebuilt per-request on the server.** The server-side cell grid is rebuilt from `WBAPI.nodeMap` and `WBAPI.nodeCoords` on each handler invocation. This is acceptable because the server reloads state after every write, and the rebuild is O(n) over ~420 nodes — sub-millisecond.

**Session SSE uses `text/event-stream` over HTTP/1.1.** No WebSocket dependency. Node.js's single-threaded event loop means each `POST /api/session/move` is synchronous — no per-session mutex needed. A WebSocket upgrade would require one.

**N/E/S/W rejection on API, not silent ignore.** Callers that submit direction fields on POST/PUT receive a 400 with a hint to use coordinates instead. Silent ignore would mask bugs in callers that still think direction fields are the way to wire the graph.

**419 vs 420.** The server reports 419 nodes post-§CELL-05b. `docs-node-network.md` had written 420 before the zombie purge. 419 is the authoritative count from `GET /api/ping`.

---

## Files Changed

| File | Change |
|------|--------|
| `roll2hit-v3.html` | §CELL-01 through §CELL-10, §CELL-11A dead-code removal |
| `wbapi-server.js` | §CELL-06 BFS rewrite, §CELL-07 MUD sessions, §CELL-08 cell endpoints |
| `api/wb.js` | `cell` and `grid` commands added |
| `wbapi-help.md` | Session API + cell grid sections |
| `API-README.md` | Session API section |
| `index.md` | Status counts, file descriptions, lab report entry |
| `mechanics.md` | Cell Movement section added |
| `world.md` | Junction node prose updated |
| `story.md` | Road Companion corridor cell → cell |
| `story-flowchart.md` | Grid adjacency note |
| `docs-node-network.md` | Node count updated; §CELL-05b noted |
| `maps.md` | Corridor removal note updated |
| `spec-corridors.md` | Superseded header (already present) |

---

*© 2026 Paul Richeson — MIT License.*
