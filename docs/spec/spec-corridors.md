<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson and Claude -->

# spec-corridors.md — Layer 9 Circuit Corridors

> ⚠️ **SUPERSEDED by §CELL-03 (cellMove).**  
> The corridor travel system described below — `CORRIDOR_CELLS`, `buildCorridorMap()`, `storyCorridorTravel()`, the Hunt/Warp overlay, and the ≥ 3 Manhattan-distance trigger in `storyMove()` — is **no longer the active navigation path**. `storyMove` has been renamed `storyMove_LEGACY` and is retained only until §CELL-05 removes all junction nodes.  
>
> **Active navigation as of §CELL-03:** `cellMove(dir)` moves the player exactly one grid cell per keypress. Named nodes are entered when a cell has an entry in `CELL_GRID`. Empty cells are handled by `_enterEmptyCell(r, c)` (§CELL-04). There is no corridor dialog, no Manhattan-distance gating, and no "Hunt/Warp" choice on movement.  
>
> For the current movement spec see: `spec-engine.md` §Navigation / `docs-node-network.md`.  
> For the §CELL redesign plan see: `plan-archive.md §CELL`.  
> This document is kept as a historical reference for the corridor grid CSS, HTML overlay markup, and `_setActivePath` — all still present in the HTML — and for context on why the old system was replaced.

---

**Depends on:** `plan-archive.md` (architecture), `maps.md` (NODE_COORDS), existing `_renderMapGrid()`  
**Status:** ✅ COMPLETE — All L9-A through L9-H implemented (2026-05-21)  
**Navigation status:** ⚠️ SUPERSEDED — `storyMove_LEGACY` retained until §CELL-05; `cellMove` is the live movement function  
**File target:** `index.html` (single-file rule)

---

## What changed and why

The corridor system required the player to jump node-to-node, with corridor animation only for non-adjacent pairs (Manhattan distance ≥ 3). The §CELL redesign replaces this with a MUD-style grid: pressing N/E/S/W always moves exactly one cell, every cell is reachable, and named nodes are encountered when the player's cell matches a `CELL_GRID` entry.

Key differences:

| Old (storyMove + corridors) | New (cellMove) |
|---|---|
| Reads `NODE_MAP[code][dir]` for destination | Reads `CELL_GRID[r,c]` — pure coordinate lookup |
| Manhattan ≥ 3 → Hunt/Warp overlay | No overlay — one cell per keypress, always |
| Can only reach named nodes | Can enter any passable cell (§CELL-04 handles empty cells) |
| Junction nodes required as routing waypoints | Junction nodes replaced by traversable empty cells (§CELL-05) |
| CORRIDOR_TERRAIN drives encounter selection | TERRAIN_ENCOUNTER_RATE + `_inferTerrain()` (§CELL-04) |

---

## 0. Prerequisites & Key Decisions (historical)

- Corridors were **visual only** — travel was node-to-node; corridors rendered the road between nodes.
- Hunt/Warp dialog fired for any connection where the two nodes were **≥ 3 Manhattan grid cells apart**.
- Adjacent connections (`|Δr| + |Δc| ≤ 2`) travelled directly — no dialog.
- Corridor cells were built **once at startup** (`buildCorridorMap()`) and stored in `CORRIDOR_CELLS`.

---

## 1. Data Structures (retained in HTML for minimap rendering)

### 1-A. `CORRIDOR_CELLS`

```js
/**
 * @type {Object.<string, CorridorCell>}
 * key: "r,c"  (e.g. "5,12")
 *
 * @typedef {Object} CorridorCell
 * @property {Set<string>}          dirs    — which sides have wire: 'N'|'S'|'E'|'W'
 * @property {string}               glyph   — box-drawing char derived from dirs
 * @property {string}               terrain — WORLD_DB key for encounter rolls
 * @property {Array<{from:string, to:string}>} edges — which NODE_MAP edges pass through
 */
const CORRIDOR_CELLS = {};
```

Still populated by `buildCorridorMap()` at startup. Used by `_renderMapGrid()` for the minimap wire glyphs. Will be removed in §CELL-05 when junction nodes and the corridor overlay are retired.

### 1-B. `S_story` fields (retained)

```js
lastCorridorCells: [],   // Array<{r:number, c:number}> — cells of last-traveled corridor
lastExitDir:       null, // string|null — 'N'|'S'|'E'|'W' — direction taken from last node
lastExitCode:      null, // string|null — node code of previous node (for exit-arrow highlight)
```

`_setActivePath()` still writes these (called from `cellMove`). `_renderMapGrid()` still reads them for the gold highlight. Both retained until §CELL-10 rewrites the minimap.

### 1-C. Wire Glyph Lookup (retained)

```js
const WIRE_GLYPH = {
  'E,W':     '─',  'N,S':     '│',
  'E,N':     '└',  'N,W':     '┘',
  'E,S':     '┌',  'S,W':     '┐',
  'E,N,S':   '├',  'N,S,W':   '┤',
  'E,N,W':   '┴',  'E,S,W':   '┬',
  'E,N,S,W': '┼',
};
```

### 1-D. `CORRIDOR_TERRAIN` (retained for storyMove_LEGACY only)

```js
const CORRIDOR_TERRAIN = { ... };
// fallback: 'midlands'
```

Only read by `_corridorTerrain()`, which is only called from `storyMove_LEGACY` / `storyCorridorTravel()`. Replaced by `TERRAIN_ENCOUNTER_RATE` + `_inferTerrain()` for live navigation. Removed in §CELL-05.

---

## 2. Junction Node Definitions (L9-B) — will be removed in §CELL-05

J1–J7 and later thousands of auto-generated J##### nodes exist in `NODE_MAP` and `NODE_COORDS`. They were navigation waypoints for the corridor system. `cellMove` does not need them — the player walks through the cells they occupied as ordinary empty cells. §CELL-05 will bulk-delete all J##### nodes via a WBAPI endpoint.

---

## 3–11. Historical spec (L9-A through L9-H)

The original spec sections for `buildCorridorMap()`, `_renderMapGrid()` modifications, `_setActivePath()`, `storyMove()` modifications, `storyCorridorTravel()`, `triggerCorridorEncounter()`, CSS, HTML overlay, and escape-key wiring are preserved below for reference. All implementations are ✅ complete in the HTML.

### 3. `buildCorridorMap()` — L9-A (still called at startup)

Iterates every `(nodeCode, direction, destCode)` in `NODE_MAP`. For non-adjacent pairs (Manhattan distance ≥ 2), computes an L-shaped grid route and writes intermediate cells to `CORRIDOR_CELLS`. Adjacent pairs (distance ≤ 1) are skipped. Portal connections are also skipped.

### 5. `_setActivePath(fromCode, toCode, dir)` — L9-H (still called by cellMove)

Records `S_story.lastExitCode`, `lastExitDir`, and `lastCorridorCells` for the minimap gold-path highlight. Called by `cellMove` after every named-node entry.

### 9. CSS Rules — L9-C (retained)

`mc-corridor`, `mc-wire`, `mc-corridor-dim`, `mc-corridor-visited`, `mc-corridor-active`, `mc-junction`, `mc-exit-active` — all still in the `<style>` block and used by `_renderMapGrid()`.

### 10. HTML — Hunt/Warp Corridor Overlay (retained but hidden)

`#story-corridor-overlay` and `#corridor-card` remain in the DOM. Used by `storyMove_LEGACY` / `storyCorridorTravel()`. The overlay is never shown in normal play now that `cellMove` is the movement handler. Removed in §CELL-05.

---

## 12. Implementation Status

| Step | What | Status |
|------|------|--------|
| L9-A | `buildCorridorMap()`, `WIRE_GLYPH`, `CORRIDOR_TERRAIN` | ✅ Complete |
| L9-B | J1–J7 NODE_MAP/NODE_COORDS entries | ✅ Complete — to be removed in §CELL-05 |
| L9-C | CSS wire/junction rules | ✅ Complete |
| L9-D | `_renderMapGrid()` corridor second pass | ✅ Complete |
| L9-E | HTML overlay + `storyCorridorTravel()` | ✅ Complete — superseded by `cellMove` |
| L9-F | `triggerCorridorEncounter()`, `_weightedMonsterPick()` | ✅ Complete — superseded by `_enterEmptyCell` |
| L9-G | `storyMove()` corridor dispatch | ✅ Complete — renamed `storyMove_LEGACY` |
| L9-H | `_setActivePath()`, corridor state fields | ✅ Complete — still called by `cellMove` |
| §CELL-03 | `cellMove()` replaces `storyMove` for all navigation | ✅ Complete |
| §CELL-04 | `_enterEmptyCell()` / `_inferTerrain()` for open cells | ✅ Complete |
| §CELL-05 | Remove junction nodes + corridor overlay | ⚠️ PLANNED |

---

*Last updated: 2026-06-13 — marked SUPERSEDED after §CELL-03/04 completion*  
*© 2026 Paul Richeson — MIT License. See [LICENSE](LICENSE) for full text.*
