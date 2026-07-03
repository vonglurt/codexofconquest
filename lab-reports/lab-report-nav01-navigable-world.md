<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->
# Lab Report — §NAV-01 Navigable World: MUD-Coherent Map + Fungal Road Net

**Date closed:** 2026-07-03 · **Increments:** a–h, all shipped (plan `01c5187` → final `0b341d1`)
**Trigger (Lab Report Policy):** large redesign touching multiple systems — game navigation UI, terrain field, road data layer, room-description kernel, MUD server surfaces, worldbuilder, WBAPI.

---

## Abstract

The §WALK series left a geometrically correct world (90×360 equirectangular 1° grid, shared `mover.js` kernel, byte-identical client/server parity, 235/235 named cells reachable) that was **not navigable as a game**: the space between locations was undifferentiated, dangerous, and unsigned. §NAV-01 added five layers above the frozen kernel — a fungal road net (`ROAD_RUNS`), a deterministic room-description kernel (`ROOMS:CORE` / `rooms.js`), road-weighted auto-travel, wayfinding UI (signage, waypoint ★, distance readouts), and MUD server room parity — plus a worldbuilder editing surface for city placement and the road net itself. The mover kernel was never edited; roads are terrain, not permissions, so the Free-Movement invariant holds by construction.

---

## I. Diagnosis (measured 2026-07-01, live file)

- **410 nodes collapse into 235 occupied cells** — 0.85% of the 27,610 passable band cells. Cities cluster (median nearest-neighbor = 1 step) but the clusters float in a void: from the LHR/Birka start the **median named cell was 33 blind steps away, p90 = 66, max = 102 (MLN)**. 2,829 quests across 353 `activateNode`s sat on the far side of that void.
- **Every empty cell was textually identical** — `_enterEmptyCell` always printed *"The path continues. No named location marks this ground."* plus raw `Row r, Col c`. >99% of walkable space carried zero information.
- **Every empty step rolled an encounter** (0.10–0.35 by terrain) — a 33-step trip ≈ 5–8 forced battles. `TERRAIN_ENCOUNTER_RATE.road = 0` existed but **no cell ever resolved to `road`** — there was no road data.
- **No auto-travel** — the WP button moved exactly one cell per click; `_bfsGridPath` computed a full route and nothing executed it.
- **BUG — stale waypoint origin:** `_bfsGridDir(S_story.currentCode, wp)` routed from the *last named node*, not from `playerR/playerC` — the WP arrow was wrong for the entire wilderness leg of a journey.
- **BUG — pre-§WALK-1.5 bounds:** `_updateExitLinks` and `_bfsGridPath` still clamped to the old 500×500 grid (no E/W wrap) while the kernel walked 90×360-with-wrap.

**Root cause in one line:** a MUD is *rooms + exits + descriptions*; we had accurate geography but only 235 rooms and no exits worth describing.

---

## II. Layered architecture (as shipped)

```
L8  MUD SERVER      session start/move/look/pos carry the same L4 room object (shared buildLook)
L7  PRESENTATION    exits signage · minimap roads + waypoint ★ · map tab 15×21 · WORLD/GLOBE canvases
L6  QUEST WAYFINDING  Navigate → waypoint + "(n steps, NE)" readouts · arrival detection
L5  ROUTING & TRAVEL  pos-origin geo-BFS (wrap, band clamp) · road-weighted _roadGridPath · _travelTick loop
L4  ROOMS (NEW)     describeCell(world,pos) → {icon,title,sub,prose,exits,signposts} — ROOMS:CORE shared client+server
L3  ROAD GRAPH (NEW)  ROAD_RUNS fungal net — scripts/build-roads.js, committed as RLE data (like SEA_RUNS)
L2  TERRAIN FIELD   _inferTerrain / server terrainAt precedence: SEA_LANES→ocean ▸ ROAD_CELLS→road ▸ neighbors ▸ midlands
L1  PASSABILITY     SEA_RUNS→IMPASSABLE_CELLS · SEA_LANES              (FROZEN — untouched)
L0  GEOMETRY        GEO_PROJ 90×360 equirect 1° · mover.js kernel      (FROZEN — untouched)
```

**Layer contract:** each layer reads only layers below it. `mover.js` (L0/L1) was never edited — `__moverBlocked` reasons remain exactly `'oob'`/`'sea'`, 0 gate refs. Roads make travel *safer and legible*, never *required*.

---

## III. Locked data shapes

- **`ROAD_RUNS`** (game file, after `SEA_LANES`): RLE `{row:[[c0,c1],…]}` exactly like `SEA_RUNS`; builds the `ROAD_CELLS` Set at load. Server parses the literal via `getRoadCells()` (same pattern as `getSeaLanes()`). Shipped net: **400 road cells (1.4% of passable), 88 intersections/T-junctions**.
- **Terrain precedence** (both copies + `scripts/check-terrain-parity.js`): `SEA_LANES → 'ocean'` ▸ `ROAD_CELLS → 'road'` (encounter rate 0) ▸ majority-of-named-neighbors ▸ `'midlands'`. SEA_LANES deliberately stay `ocean` — crossings keep their 0.10 risk as texture.
- **`describeCell(world, pos) → room`**: `{icon, title, sub, body/prose, exits:[{dir, kind:'node'|'road'|'terrain'|'blocked', label, hint}], signposts:[{label, dir, steps}]}`. Prose = 3–5 variants per terrain keyed by `hash(r,c)` — **no `Math.random`**, deterministic for MUD parity + tests. Road cells name the next settlement along the road in each road direction; every empty cell lists nearest landmarks within BFS radius 12. The `ROOMS:CORE` block in `rooms.js` is inlined byte-identically into the HTML (`check:roomsparity`) and `require()`d by the server — the MOVER:CORE pattern.
- **Routing origin:** always `{r:S_story.playerR, c:S_story.playerC}` (`_playerPos()`), **never** `NODE_COORDS[currentCode]`.
- **`roads-pins.json`** (repo root, user-authored net edits): `{pins:[{r,c}], links:[[cellA,cellB]], locked:['CODE',…]}` — build-roads.js consumes pins as mandatory road vertices; `locked` city codes are never moved by geo-seed/regeneration.

---

## IV. Road generator (`scripts/build-roads.js`)

Settlement graph = 235 occupied cells; edges = k-nearest (k≤3, BFS dist ≤ 30) + MST over the cluster graph (guarantees one component) + local loops ≤8. Corridors are carved by trunk-reuse Dijkstra with costs **settlement 2 / existing road 4 / virgin land 10 / sea-lane 14** — reusing existing trunk is what makes the net *fungal*: organic trunks and natural intersections/T-junctions instead of 235² spaghetti. Excludes named cells + sea. Deterministic; committed as data. `--apply` patches the `◆ §NAV-01b` ROAD_RUNS block in the game file in place.

Verification: `scripts/check-roads.js` (in `check:walk` as `check:roads`) — **R1** 235/235 settlements touch the net · **R2** single component (stitched via settlements + lanes) · **R3** 0 overlaps with named/sea cells · **R4** road coverage < 10% of passable (actual 1.4%).

---

## V. Increment record

| Inc | Commit | Scope | Gates at ship |
|-----|--------|-------|---------------|
| a | `a96d935` | Wayfinding correctness: `_playerPos()`; BFS takes `{r,c}` origin; geo bounds `0≤r<90` + E/W wrap with antimeridian dir-adjust; `_updateExitLinks` passability = kernel rule | navigation 14/14 · check:walk green |
| b | `7b503d1` | Fungal road net: build-roads.js → `ROAD_RUNS` (400 cells, 88 junctions); terrain override both sides; check:roads R1–R4 into check:walk | check:walk (A3, B 10440/10440) · check:roads |
| c | `3568fcc` | Room layer: `describeCell` (ROOMS:CORE, `rooms.js` + inline + parity check); `_enterEmptyCell` renders it; region name replaces raw coords; local-map terrain recolor | navigation cases (deterministic prose, signposts) · parity |
| e-maps | `f8c341b` | Map tab 15×21 + amenity icons + FULL-world canvas with gold viewport traces (user-directed, pulled ahead of d); GLOBE panel `435cc9f` | map suite green |
| d | `3cd3f62` | Auto-travel: WP = travel loop on road-weighted `_roadGridPath` (Dijkstra/Dial buckets, road+lane cost 1 vs 2; ~120 ms/step); halts on encounter (`_encounterQueued`) / arrival / any input / blocked; Shift+WP = single step | navigation 29/29 · check:walk · autosave+fishing 13/13 |
| e | `3045727` | Wayfinding UI: exits signage (`E→ road — toward Visby (4)`), waypoint ★ on minimap + both world canvases, `(n steps, NE)` journal readouts | navigation 35/35 · Playwright 376/376 |
| f | `d6f70f4` | MUD server room parity: `require('./rooms')` + `getRoomWorld()`; `room` on all four look surfaces via shared `buildLook`; mud-harness [M] asserts server room JSON **byte-equal** to client `describeCell` against an independently rebuilt world | mud-harness 112/112 · check:walk 6/6 · presence 7/7 |
| g | `66584db` | Worldbuilder drag-&-lock cities: marker drag + lat/lon → `PUT /api/coords` (1-node/cell guard); 🔒 → `GET /api/roads/pins` + `PUT /api/roads/lock` → `roads-pins.json`; geo-seed keeps locked | walk spec +7 hermetic · harness [N] → 119 |
| h | `0b341d1` | Worldbuilder road-net editor: ROAD_RUNS chain-link overlay; vertex drag → pin (wired through the corridor's two BFS settlement anchors); pin drag re-points links; ✚ intersection / ┬ T-junction palette (4/3 nearest-city links); 🔗 link toggle; 🗑 delete; **♻ Reweave Net** = `PUT /api/roads` (build-roads.js --apply → check:roads, red check rolls the game file back); `GET /api/roads`; `./api.sh roads\|reweave` | walk suite 89/89 · check:walk 6/6 · mud-harness 119 · empty-pins reweave byte-identical · pinned corridor 400→412 cells/88→93 junctions then restored clean |

---

## VI. What the player got

- **Roads are safe, legible highways:** `road` terrain has encounter rate 0; road cells describe the highway and signpost the next settlement in each road direction. The open field remains fully walkable — roads are sugar.
- **Every cell is a room:** deterministic terrain prose, region-name title, nearest-landmark line, exits with signage — identical text in the single-player client and on the MUD server (`session/start|move|look|pos`).
- **One-click journeys:** WP button auto-travels the road-weighted route (~120 ms/step), halting on encounter roll, arrival, any input, or block. Quest "📍 Navigate →" starts travel; the journal shows `(n steps, NE)`.
- **Authoring:** worldbuilder drags cities (with 🔒 lock against geo-seed) and edits the road net itself (pins, junction palette, ♻ Reweave) — all mutations API-first, every reweave gated by check:roads with automatic rollback on red.

---

## VII. Guard-rails (still in force)

1. **mover.js untouched** — step refusal reasons remain exactly `'oob'` / `'sea'`.
2. **Roads are terrain, never permissions** — Free-Movement invariant (plan.md §I) preserved by construction.
3. **No stored node-to-node edge lists** — roads are cells; no §CELL-era pointer graph resurrected.
4. **Never hand-edit ROAD_RUNS** — regenerate via ♻ Reweave (`PUT /api/roads`); the on-disk game always passes `check:roads`.
5. **No re-projection** — coordinates are settled; §NAV-01g moves individual cities only, via API.

---

## VIII. Open follow-ups (tracked in plan.md §NAV-01)

1. `_renderMiniMap`'s "Void's First Sign" special case still targets pre-§WALK-1.5 cell `(4,3)` — now a real North Atlantic band cell; re-anchor or retire.
2. `_questNodes()` built once per session — invalidate if QUEST_DB ever mutates live.
3. Map-tab hover for road cells could name the road's destinations (reuse `__roadDestination`).
4. GLOBE panel click → jump map tab / world panel to that region (read-only aid).
5. Migrate older worldbuilder describe blocks to the Inc g hermetic pattern (`page.route` firewall on `:1367` before `page.goto`); `worldbuilder-crud-arrays.test.js` itemChain tests still need the live server to dismiss the welcome screen.

**Test-run rules learned this arc (promoted to plan.md §I):** never trust a piped test run's exit code; stop the WBAPI server before Playwright suites.

---

## IX. References

- plan-archive.md §"Archived 2026-07-03" — §NAV-01 full section (diagnosis, mermaid flows, increment table, checkpoint).
- `lab-reports/lab-report-cell-map-mud-redesign.md`, `lab-report-terrain-field-mover-redesign.md`, `lab-report-walk5-mud-harness.md` — the §WALK substrate.
- Docs synced at close: `maps.md` (road net + room layer), `docs-node-network.md` §13 (L0–L8 stack), `mechanics.md` (Roads, Rooms & Auto-Travel), `index.md` registry row, `wbapi-help.md` (roads endpoints, synced at Inc g/h).

*© 2026 Paul Richeson — MIT License.*
