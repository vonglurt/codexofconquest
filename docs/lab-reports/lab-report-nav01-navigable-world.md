<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->
# Lab Report — §NAV-01 Navigable World: MUD-Coherent Map + Fungal Road Net

**Date closed:** 2026-07-03 · **Increments:** a–h, all shipped (plan `01c5187` → final `0b341d1`)
**Trigger (Lab Report Policy):** large redesign across game navigation UI, terrain field, road data layer, room-description kernel, MUD server surfaces, worldbuilder and WBAPI.
**Verification pass:** §DOC-02bt, 2026-08-17 — every figure below re-derived against the live file, the archive builds, and the shipped gates. Deltas are marked inline; nothing is deleted.

---

## Abstract

The §WALK series delivered a geometrically correct world — a 90×360 equirectangular 1° grid, a shared `mover.js` kernel, byte-identical client/server parity, 235 of 235 named cells reachable — that was **not navigable as a game**. The space between locations was undifferentiated, dangerous and unsigned. §NAV-01 added five layers *above* the frozen kernel: a fungal road net (`ROAD_RUNS`), a deterministic room-description kernel (`ROOMS:CORE` / `rooms.js`), road-weighted auto-travel, wayfinding UI, and MUD server room parity — plus a worldbuilder surface for editing city placement and the road net itself. The mover kernel was never edited. Roads are *terrain*, not permissions, so the Free-Movement invariant holds by construction.

---

## I. Motivation — why this was a playability problem, not a data problem

The world was correct and unplayable, which is the worst combination because nothing is failing. Every gate was green. The bug was the *experience of distance*: the player had 2,829 quests and no way to reach any of them that felt like travel rather than punishment.

Three specific harms, in the order a player meets them:

1. **The wilderness had nothing to say.** Every unnamed cell printed the same sentence — *"The path continues. No named location marks this ground."* — plus raw `Row r, Col c`. More than 99% of walkable space carried zero information. A MUD's core loop is *read the room, choose an exit*; there was one room, repeated 27,000 times.
2. **Distance was taxed, not rewarded.** Every empty step rolled an encounter. The median named cell sat 33 blind steps from the start, so a routine journey meant five to eight forced battles. Crossing the world was a chore with a combat toll.
3. **Nothing pointed anywhere.** The waypoint button moved one cell per click, and its arrow was computed from the wrong origin, so it lied for the entire wilderness leg of any journey.

The design intent was therefore **legibility before content**: make the space between cities *readable* (rooms), *safer along known lines* (roads), *walkable in one gesture* (auto-travel) and *signposted* (wayfinding UI) — without ever making a road mandatory. **Roads are sugar, not rails.** The open field stays fully walkable; the road is simply the route that costs nothing to take.

> **Root cause in one line:** a MUD is *rooms + exits + descriptions*. We had accurate geography, 235 rooms, and no exits worth describing.

---

## II. Diagnosis (measured 2026-07-01 on the live file)

Re-derived independently on 2026-08-17 from `git show 01c5187:play.html` — BFS over passable cells from the LHR/Birka spawn, and a parse of `QUEST_DB` through `src/js/wbapi-core.js`. **Every figure reproduces exactly.**

| Diagnosed | As written | Re-derived (2026-08-17) | |
|---|---|---|---|
| Nodes / occupied cells | 410 → 235 | 410 → 235 | ✅ |
| Occupancy of passable band | 0.85% of 27,610 | 235/27,610 = 0.851% | ✅ |
| Nearest-neighbour between cities | median 1 step | median 1, mean 2.06 | ✅ |
| Blind steps to a named cell | median 33, p90 66, max 102 (MLN) | median 33, p90 66, max 102 (MLN at 73,220) | ✅ |
| Quests beyond the void | 2,829 across 353 `activateNode`s | 2,829 with `activateNode`; 353 distinct | ✅ |
| Encounter rate range | 0.10–0.35 by terrain | 0.05–0.35 — `city:0.05` is the true floor | ⚠ |

Both diagnosed bugs verify verbatim against the pre-fix build:

- **Stale waypoint origin** — `_bfsGridDir(S_story.currentCode, wp)` at `01c5187` lines 32781 and 33062, resolving through `NODE_COORDS[fromCode]` with `playerR/playerC` only as a fallback. The arrow routed from the last *named node*, not from the player.
- **Pre-§WALK-1.5 bounds** — `_bfsGridPath` still carried `if (nr < 1 || nc < 1 || nr > 500 || nc > 500) continue;`, a 1-indexed 500×500 clamp with no E/W wrap, while the kernel walked 90×360-with-wrap.

`TERRAIN_ENCOUNTER_RATE` already contained `road:0` — the safe-highway rate existed and **no cell could ever resolve to `road`**, because there was no road data. The table is byte-identical from the diagnosis build to HEAD at `const TERRAIN_ENCOUNTER_RATE@9892`; the only correction is that it holds **15** keys, including a `junction:0` the report never named, and `city:0.05` below the stated floor.

---

## III. Layered architecture (as shipped)

```
L8  MUD SERVER      session start/move/look/pos carry the same L4 room object (shared buildLook)
L7  PRESENTATION    exits signage · minimap roads + waypoint ★ · map tab 15×21 · WORLD/GLOBE canvases
L6  QUEST WAYFINDING  Navigate → waypoint + "(n steps, NE)" readouts · arrival detection
L5  ROUTING & TRAVEL  pos-origin geo-BFS (wrap, band clamp) · road-weighted _roadGridPath · _travelTick loop
L4  ROOMS (NEW)     describeCell(world,pos) → room — ROOMS:CORE shared client+server
L3  ROAD GRAPH (NEW)  ROAD_RUNS fungal net — src/scripts/build-roads.js, committed as RLE data (like SEA_RUNS)
L2  TERRAIN FIELD   _inferTerrain / server terrainAt: SEA_LANES→ocean ▸ ROAD_CELLS→road ▸ neighbors ▸ midlands
L1  PASSABILITY     SEA_RUNS→IMPASSABLE_CELLS · SEA_LANES              (FROZEN — untouched)
L0  GEOMETRY        GEO_PROJ 90×360 equirect 1° · mover.js kernel      (FROZEN — untouched)
```

**Layer contract:** each layer reads only layers below it. Roads make travel *safer and more legible*, never *required*.

---

## IV. Locked data shapes

- **`ROAD_RUNS`** — RLE `{row:[[c0,c1],…]}` after `SEA_LANES`, exactly the `SEA_RUNS` shape (`const ROAD_RUNS@9883`); the `ROAD_CELLS` Set is built at load. The server parses the same literal via `getRoadCells()`, the `getSeaLanes()` pattern. **Net at close: 400 road cells (1.4% of passable), 88 intersections/T-junctions** — confirmed by the generator's own header comment in the shipped file at both `7b503d1` and `0b341d1`.
- **Terrain precedence** (both copies plus `src/scripts/check-terrain-parity.js`): `SEA_LANES → 'ocean'` ▸ `ROAD_CELLS → 'road'` (encounter rate 0) ▸ majority-of-named-neighbours ▸ `'midlands'`. Sea lanes deliberately stay `ocean` — crossings keep their 0.10 risk as texture. Boats are never free.
- **`describeCell(world, pos) → room`** (`src/js/rooms.js:function describeCell@192`) returns `{icon, title, sub, terrain, prose, exits, signposts, landmarks}`. Prose variants are keyed by `hash(r,c)` — **no `Math.random` anywhere in the kernel**, which is what makes MUD parity and deterministic tests possible. Road cells name the next settlement along the road in each road direction; every empty cell lists its nearest landmarks (`src/js/rooms.js:__nearestLandmarks(world, pos, 12, 3)@233` — BFS radius 12, top 3). The `ROOMS:CORE` block is inlined byte-identically into the HTML (`check:roomsparity`) and `require()`d by the server — the MOVER:CORE pattern.
- **Routing origin** — `function _playerPos@37749`, the player's cell, never the last named node.
- **`roads-pins.json`** (repo root at the time of writing; user-authored net edits): `{pins:[{r,c}], links:[[cellA,cellB]], locked:['CODE',…]}`. `build-roads.js` consumes pins as mandatory road vertices; `locked` city codes survive geo-seed regeneration.

---

## V. Road generator (`src/scripts/build-roads.js`)

Settlement graph = the occupied cells. Candidate edges come from a capped BFS out of every settlement; a Kruskal MST guarantees one component, and local loops within `LOCAL_MAX = 8` add redundancy. Corridors are then carved by trunk-reuse Dijkstra with integer costs `src/scripts/build-roads.js:const COST = { settlement: 2, road: 4@43` — virgin 10, sea-lane 14. **Reusing existing trunk at 4 against virgin ground at 10 is the whole trick**: it produces organic highways with natural intersections and T-junctions instead of 235² of spaghetti. Hence *fungal*. Named cells and sea are excluded; the output is deterministic and committed as data. `--apply` patches the `◆ §NAV-01b` block in the game file in place.

Verification: `src/scripts/check-roads.js`, wired into `check:walk` as `check:roads` — **R1** every settlement touches the net · **R2** single component (stitched via settlements + lanes) · **R3** zero overlaps with named or sea cells · **R4** road coverage below 10% of passable.

---

## VI. Increment record

| Inc | Commit | Scope | Gates at ship |
|-----|--------|-------|---------------|
| a | `a96d935` | Wayfinding correctness: `_playerPos()`; BFS takes a `{r,c}` origin; geo bounds `0≤r<90` + E/W wrap with antimeridian dir-adjust; `_updateExitLinks` passability = kernel rule | navigation 14/14 · check:walk green |
| b | `7b503d1` | Fungal road net: build-roads.js → `ROAD_RUNS` (400 cells, 88 junctions); terrain override both sides; check:roads R1–R4 into check:walk | check:walk (A3, B 10440/10440) · check:roads |
| c | `3568fcc` | Room layer: `describeCell` (ROOMS:CORE, `rooms.js` + inline + parity check); `_enterEmptyCell` renders it; region name replaces raw coords; local-map terrain recolour | navigation cases · parity |
| e-maps | `f8c341b` | Map tab 15×21 + amenity icons + FULL-world canvas with gold viewport traces (user-directed, pulled ahead of d); GLOBE panel `435cc9f` | map suite green |
| d | `3cd3f62` | Auto-travel: WP = travel loop on road-weighted `_roadGridPath` (Dijkstra/Dial buckets, road+lane cost 1 vs 2; ~120 ms/step); halts on encounter / arrival / any input / blocked; Shift+WP = single step | navigation 29/29 · check:walk · autosave+fishing 13/13 |
| e | `3045727` | Wayfinding UI: exits signage (`E→ road — toward Visby (4)`), waypoint ★ on minimap and both world canvases, `(n steps, NE)` journal readouts | navigation 35/35 · Playwright 376/376 |
| f | `d6f70f4` | MUD server room parity: `require('./rooms')` + `getRoomWorld()`; `room` on all four look surfaces via shared `buildLook`; mud-harness **[M]** asserts server room JSON byte-equal to client `describeCell` against an independently rebuilt world | mud-harness 112/112 · check:walk 6/6 · presence 7/7 |
| g | `66584db` | Worldbuilder drag-&-lock cities: marker drag + lat/lon → `PUT /api/coords` (1-node/cell guard); 🔒 → `GET /api/roads/pins` + `PUT /api/roads/lock` → `roads-pins.json`; geo-seed keeps locked | walk spec +7 hermetic · harness **[N]** → 119 |
| h | `0b341d1` | Worldbuilder road-net editor: ROAD_RUNS chain-link overlay; vertex drag → pin; pin drag re-points links; ✚ intersection / ┬ T-junction palette; 🔗 link toggle; 🗑 delete; **♻ Reweave Net** = `PUT /api/roads` (build-roads.js --apply → check:roads, red check rolls the game file back); `./api.sh roads\|reweave` | walk suite 89/89 · check:walk 6/6 · mud-harness 119 |

All eleven commit hashes resolve at HEAD, in the stated order, on the stated dates.

---

## VII. Verification at 2026-08-17 (46 days on)

**Gates re-run, all green except one known unrelated red:**

| Gate | At close | 2026-08-17 | |
|---|---|---|---|
| `navigation.test.js` | 35/35 (Inc e) | **35/35** | ✅ identical |
| `worldbuilder-walk.test.js` | 89/89 (Inc h) | **89/89** | ✅ identical |
| mud-harness **[M]** §NAV-01f room parity | byte-equal | **14/14** incl. every byte-equality assertion | ✅ |
| mud-harness **[N]** §NAV-01g pins/lock | +7 | **7/7** | ✅ |
| `check:roads` R1–R4 | 235/235, 0 overlaps, 1.4% | **244/244, 0 overlaps, 410 cells 1.5%** | ✅ invariants hold, figures grew |
| `check:terrain` | A3 roads, B 10440/10440 | **A3 410 cells client==server, B 10440/10440, diffs 0** | ✅ |
| `check:roomsparity` | inline == `rooms.js` | **identical, 10,836 bytes** | ✅ |
| whole mud-harness | 119 | 267 passed / 2 failed | ⚠ the 2 are `[D]` idle-TTL (§DX-02ca), unrelated |

**The frozen layers stayed frozen.** `src/js/mover.js` and `src/js/rooms.js` have had exactly **one commit each since this report closed**, and it was `cc35c08` (§CLEANUP-02) moving files into `src/js/` — no content edit in 46 days. `__moverBlocked`'s refusal reasons are still exactly `'oob'` and `'sea'`. Guard-rail #1 held absolutely.

**The net grew, and it grew through the sanctioned door.** `fa8f9e4` (§DX-01a, 2026-07-28) took the net from 400/88 to 410/89 by running `build-roads.js --apply` — the do-not-hand-edit path this report mandated — while laying the real Tungas–Station 7 road. Guard-rail #4 held under the one pressure that could have broken it.

**Runtime constants unchanged.** `function _roadGridPathCore@37838` still weights the route at `ROAD_CELLS.has(k) || SEA_LANES.has(k)) ? 1 : 2@37868`; `function _travelTick@38034` still steps at `_travelTimer = setTimeout(_travelTick, 120)@38061` and still halts on all four interrupt classes. `function _enterEmptyCell@28420` renders the room, and the old sentence *"The path continues. No named location marks this ground."* occurs **zero** times in the file.

---

## VIII. Spec → shipped delta table

| § | Claim | Verdict |
|---|---|---|
| V | *"edges = k-nearest (k≤3, BFS dist ≤ 30)"* | ❌ **NOT SHIPPED — and wrong the day it was written.** There is no `k` and no `30` in `build-roads.js` at Inc b's own ship commit or anywhere in the file's history. The shipped candidate step is an uncapped per-settlement BFS at `src/scripts/build-roads.js:const CAP_START = 50@40`, doubled until the MST connects. The phrase comes from the **plan** (`01c5187`), which also specified *"already-roaded cells cost 0.5"* — a cost model that never shipped either. Details below. |
| IV | *"Prose = 3–5 variants per terrain"* | ❌ **NOT SHIPPED.** `src/js/rooms.js:const __ROOM_PROSE@50` holds 14 buckets with **2–4** variants: six have 2, six have 3, two have 4. **No terrain ever had 5**, and the distribution is byte-identical at Inc c's own ship commit `3568fcc`. |
| IV | `exits[].kind` = `'node'\|'road'\|'terrain'\|'blocked'` | ⚠ **Incomplete — five kinds ship.** `'lane'` is emitted for sea-lane crossings and signs as *"The sea-lane runs …"*. The report's own §IV says lanes stay `ocean`; the exit vocabulary that renders them was left out of the list. |
| IV | `describeCell` returns `{icon,title,sub,body/prose,exits,signposts}` | ⚠ **Two keys missing, one hedge.** Shipped: `terrain` and `landmarks` as well. `body` never existed — `prose` is the name, and the `body/prose` slash is an honest marker of where the author stopped copying and started recalling. |
| IV | *"Routing origin: **never** `NODE_COORDS[currentCode]`"* | ⚠ **Overstated.** `_playerPos()` prefers `playerR/playerC` and **falls back** to `NODE_COORDS[S_story.currentCode]` when they are null. The intent — never route from the last named node while a cell position exists — holds; the absolute does not. |
| II | *"encounter (0.10–0.35 by terrain)"* | ⚠ **Floor is 0.05.** `city:0.05` sits below the stated range; `junction:0` is a fifteenth key the report never names, and it is the one field terrain with **no prose bucket**, so junction cells fall through to `_default`. |
| IV | `roads-pins.json` at repo root; `rooms.js` at repo root | ✅ **True for its day**, superseded by `cc35c08` (§CLEANUP-02, 2026-07-09): now `src/config/roads-pins.json` and `src/js/rooms.js`. History, not rot. |
| IV | 400 cells / 88 junctions / 1.4% / 235 settlements | ✅ **Exact at close**, per the generator's own header in the shipped file. **410 / 89 / 1.5% / 244 at HEAD** since `fa8f9e4`. |
| — | Everything else measured | ✅ Cost table, `LOCAL_MAX = 8`, landmark radius 12 / top-3, no `Math.random`, road/lane cost 1 vs 2, 120 ms/step, four interrupt classes, both diagnosed bugs, all six diagnosis statistics, all eleven commit hashes. |

### The interesting failure: a spliced sentence

§V's opening line is a single sentence containing both halves of the delta table's best and worst rows:

> *"edges = k-nearest (k≤3, BFS dist ≤ 30) + MST … corridors are carved by trunk-reuse Dijkstra with costs settlement 2 / existing road 4 / virgin land 10 / sea-lane 14"*

The cost table is **byte-exact** with `const COST` in the generator. The k-nearest clause has **never existed in any version of the file**. Both halves came from `plan.md`, which archives the pre-build *spec* and the as-built *increment row* a few hundred lines apart — the spec says k≤3 and cost 0.5; the increment row says MST, loops ≤8 and 2/4/10/14. The author read both and merged them into one sentence describing "the generator", and the seam is invisible because both sources are the same document.

**The rule this yields:** when a track archives its plan beside its own increment table, a later summary can splice the forecast into the record. *Prefer the increment row; it was written after the code existed.* Where the two disagree, the code is the tiebreak — and here the code was two directories away the entire time.

---

## IX. Guard-rails (outcome, not intention)

| # | Guard-rail | 2026-08-17 |
|---|---|---|
| 1 | mover.js untouched; refusal reasons `'oob'`/`'sea'` | ✅ **Zero content commits in 46 days.** |
| 2 | Roads are terrain, never permissions (Free-Movement) | ✅ No gate references; `road` is a terrain key with rate 0, nothing more. |
| 3 | No stored node-to-node edge lists | ✅ Roads are cells. No §CELL-era pointer graph resurrected. |
| 4 | Never hand-edit `ROAD_RUNS`; regenerate via ♻ Reweave | ✅ **Tested and held** — the one net change since close went through `--apply`. |
| 5 | No re-projection; §NAV-01g moves individual cities only, via API | ✅ Passable band still **27,610** cells, identical to the diagnosis build. |

Five for five, and #4 was the one that mattered: a guard-rail is only proven by the change that wanted to break it.

---

## X. Follow-up register (outcome)

Three of five closed within four days. The two that stayed open are where the cost landed.

| # | Follow-up | Outcome |
|---|---|---|
| 1 | `_renderMiniMap`'s *"Void's First Sign"* special case targets pre-§WALK-1.5 cell (4,3) — re-anchor or retire | ✅ **RETIRED** `b872b8c` (2026-07-07, 4 days). Zero occurrences at HEAD. |
| 2 | `_questNodes()` built once per session — invalidate if `QUEST_DB` mutates live | ❌ **STILL OPEN.** `function _questNodes@36995` is still `if (!_questNodeSet)`, no invalidation. Its sibling index `_questsByNode` (§VM-01-F-FU) solved exactly this with an entry-count guard and documented the reasoning — **the answer was written one function below and never applied upward.** → **§DX-02cl**. |
| 3 | Map-tab hover for road cells could name the road's destinations (reuse `__roadDestination`) | ✅ **DONE** `51bc5c7` (2026-07-07, 4 days), reusing `function __roadDestination@10080` precisely as proposed. |
| 4 | GLOBE panel click → jump map tab / world panel to that region (read-only aid) | ⚠ **Superseded.** §MAP-NAV wired the globe canvas to `function _navClickCell@37991`, which **travels** there — auto-walk via `_navTravelTo`, never a warp, so invariant #3 is intact. The read-only *centering* variant was ruled out of scope pending a pannable-view design and is recorded deferred in BACKLOG. |
| 5 | Migrate older worldbuilder specs to the Inc g hermetic pattern; **`worldbuilder-crud-arrays.test.js` itemChain tests still need the live server to dismiss the welcome screen** | ❌ **NOT DONE — and this sentence is the most expensive one in the report.** One of seven worldbuilder specs carries the `page.route` firewall (the one Inc g wrote). Two others dismiss the welcome screen by hand. `worldbuilder-crud-arrays.test.js` does **neither** — and that is the verbatim root cause of **§DX-02d**, four Playwright reds filed 2026-07-29 and left undiagnosed until 2026-08-17. **This report named the defect on 2026-07-03, twenty-six days before the row existed and forty-five before anyone diagnosed it.** |

***A follow-up register is not a wish list; it is a set of predictions with expiry dates.*** Item 5 was correct, specific, and unread for six weeks. Nothing filed it as a row, so nothing scheduled it, so a green feature carried four red tests through three sessions of "baseline reds".

---

## XI. What the player got

- **Roads are safe, legible highways.** `road` terrain has encounter rate 0; road cells describe the highway and signpost the next settlement in each direction. The open field remains fully walkable — the road is an offer, not a corridor.
- **Every cell is a room.** Deterministic terrain prose, a region-name title, a nearest-landmark line and signed exits — the same text in the single-player client and on the MUD server. Two players in different clients read the same sentence about the same patch of ground, and that is what makes a shared world feel like one place.
- **One-click journeys.** The WP button walks the road-weighted route at ~120 ms/step, halting on an encounter roll, arrival, any input, or a blocked step. A quest's *"📍 Navigate →"* starts the walk; the journal reports `(n steps, NE)`. **The 33-step median journey went from five-to-eight forced battles and 33 clicks to one click and, along the road, none.**
- **Authoring is API-first.** The worldbuilder drags cities (with 🔒 lock against geo-seed) and edits the road net itself — pins, junction palette, ♻ Reweave — and every reweave is gated by `check:roads` with automatic rollback on red. **A designer can redraw the world's highways and cannot commit a disconnected one.**

The measured payoff, 46 days on: the net covers 1.5% of walkable ground and touches **244 of 244** settlements in a single component. One and a half percent of the map carries the entire connective tissue of the game — which is exactly what a road is supposed to be.

---

## XII. Defects filed by this verification pass

- **§DX-02ck** 🟢 — the road-net figure `400 cells / 88 junctions / 1.4% / 235 settlements` is stale in **five maintained documents** (`index.md`, `maps.md` ×2, `mechanics.md`, `docs/notes/docs-node-network.md`) twenty days after `fa8f9e4` made it 410/89/1.5%/244; two of those lines also carry pre-§CLEANUP-02 paths (`rooms.js`, `roads-pins.json`). Two documents already carry the corrected figure, so the correction exists and simply never propagated.
- **§DX-02cl** 🟢 — `_questNodes()` has no cache invalidation while its sibling `_questsByNode` has an entry-count guard and a comment explaining why one is needed. Follow-up #2, unactioned for 46 days.
- **§DX-02d — extended** with this report's §X.5 as the provenance of its root cause.

---

## XIII. References

- `plan-archive.md` §"Archived 2026-07-03" — the full §NAV-01 section (diagnosis, flows, increment table, checkpoint). **Note the spec/increment-row disagreement documented in §VIII.**
- `docs/lab-reports/lab-report-cell-map-mud-redesign.md`, `lab-report-terrain-field-mover-redesign.md`, `lab-report-walk5-mud-harness.md` — the §WALK substrate.
- Docs synced at close: `maps.md` (road net + room layer), `docs/notes/docs-node-network.md` §13 (L0–L8 stack), `mechanics.md` (Roads, Rooms & Auto-Travel), `index.md` registry row, `docs/api/wbapi-help.md` (roads endpoints).
- Server-side road surfaces: `src/js/wbapi-server.js:function roadJunctionCount@1055`.

**Test-run rules learned this arc (promoted to plan.md §I):** never trust a piped test run's exit code; stop the WBAPI server before Playwright suites.

*© 2026 Paul Richeson — MIT License.*
