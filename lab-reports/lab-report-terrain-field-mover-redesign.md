<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->

# Lab Report — Terrain-Field Navigation, Unified Mover, Reweave Recast & MUD Harness

**Sections:** §WALK-1 (junction deletion) · §WALK-2 (unified mover) · §WALK-3 (reweave recast) · §WALK-4 (invariant suite) · §WALK-5 (MUD harness)
**Date:** 2026-06-25
**Status:** 🔒 SPEC — data shapes locked, no HTML/server edit yet (per Lab Report Policy "Design review before implementation")
**Trigger:** Large redesign touching multiple systems + design review before implementation.

---

## Abstract

This report locks the data shapes and module boundaries for a redesign of the
Roll2Hit navigation core. The goal is a single source of movement truth shared by the
single-player client and the multiplayer (MUD) server, sitting on top of a **geographic
terrain field** — an equirectangular 1° lat/lon grid (360 cols × 90 rows, band 70°N→20°S,
longitude wrapping E↔W, latitude clamped) where the grid cell *is* the geographic bin — rather
than a graph of stored edges or routing-stub nodes. Sea cells are impassable (land/sea mask +
explicit ferry edges); the canonical reachability hub is **LHR** (Birka start city). See §2 for the
full coordinate spec.
No `roll2hit-v3.html` or `wbapi-server.js` edit is made by this report — it is the contract
the implementation increments must satisfy.

The five steps are sequenced so each makes the next coherent:

1. **§WALK-1** Delete junction nodes — removes the "stop on every signpost" walkability bug at the source.
2. **§WALK-2** Unify the mover into a pure shared module — the keystone for tests and the MUD.
3. **§WALK-3** Recast reweave as a single hub-flood reachability pass over the terrain field; retire the edge-repair endpoints.
4. **§WALK-4** Invariant test suite (reachability proof + walk parity) gated in CI.
5. **§WALK-5** MUD multi-client harness; **instanced** encounters for v1.

---

## 1. Current-State Ground Truth (verified 2026-06-25)

Before specifying, the working tree was inspected. **Two facts contradict the existing
`lab-report-cell-map-mud-redesign.md`, which claims §CELL-05 is "✅ complete" with 0 junctions:**

| Claim in prior report | Actual working-tree state | Source |
|---|---|---|
| §CELL-05 deleted all junctions; `grep -c 'junction:true'` should be 0 | **316 `junction:true` nodes still present** | `grep -c 'junction:true' roll2hit-v3.html` → 316 |
| Junctions are gone, cells are empty | Junctions still occupy `CELL_GRID` cells and render a "Signpost says…" screen when stepped on | `roll2hit-v3.html:8689+` (J14–J31…), `cellMove` renders `destNode` |
| reweave is BFS-clean | `POST /api/graph/reweave-all` returns **410 deprecated** at `wbapi-server.js:5879`, but ~1,200 lines of dead P1/P4/P5 reweave implementation remain below the early return | `wbapi-server.js:5877–7075+` |

**What actually happened since:** the most recent commit (`1872896 … junction-transparent travel`)
tried a *transparency* approach — the mover would skip rendering `junction:true` cells and treat
them as empty. That transparency is **currently reverted in the uncommitted working tree**:
`cellMove` (line 26877) carries the comment `// One cell only — no scanning, no junction skipping`
and calls `storyRender(destNode)` for any named destination, junction or not. Hence the live bug:
**stepping onto any of the 316 junction cells stops the player on a signpost screen.**

This is the open fork the prior session flagged. **§WALK-1 resolves it by deletion, not transparency**
(rationale in §3 below). The uncommitted `roll2hit-v3.html` diff (45 ins / 31 del) is the
transparency revert and is in scope for §WALK-1; the separately-noted GVW node + `clr_01` 5-act
quest chain is unrelated and will not be touched.

### 1.1 The two movers today

**Client — `cellMove(dir)`** (`roll2hit-v3.html:26877`)
- Reads: `S_story.playerR/playerC`, `CELL_GRID`, `NODE_MAP`, `IMPASSABLE_CELLS`, `WORLD_DB`, `TERRAIN_ENCOUNTER_RATE`.
- Bounds: `1 ≤ r,c ≤ 500`, plus `IMPASSABLE_CELLS` set.
- Side effects: mutates `S_story` (position, `log`, `visitedCells`, `hoursElapsed`, `hoursSinceSlept`, `currentCode`); calls `_setActivePath`, `_getFarewell`, `storyRender` **or** `_enterEmptyCell`; rolls encounters via `TERRAIN_ENCOUNTER_RATE` / hunt mode; renders DOM.

**Server — `POST /api/session/move`** (`wbapi-server.js:10798`)
- Reads: `SESSIONS.get(sessionId)` `{id, playerName, r, c, nodeCode, state, lastSeen}`, `buildCellGrid(WBAPI.nodeMap, WBAPI.nodeCoords)`, `MOVES4`, `DIR_NAMES`.
- Bounds: same 4-neighbour delta; no `IMPASSABLE_CELLS`, no 500 clamp verified.
- Side effects: mutates `s.r/s.c/s.nodeCode`; `broadcastCell(... 'player_arrived' ...)` over SSE. **No** encounters, **no** time, **no** sleep, **no** DOM.

The two share the *step kernel* (direction → delta → candidate cell → bounds → grid lookup) but
diverge on every side effect and on the bounds/impassable rules. They drift independently. §WALK-2
extracts the shared kernel as a pure function both call.

---

## 2. The Terrain Field = Geo-Grid (foundational data shape — LOCKED 2026-06-25)

The redesign replaces "navigation = graph of nodes + stored/derived edges" **and** the abstract
`1..500` lattice with a **geographic terrain field**: the grid cell *is* the lat/lon bin. This
unifies the two coordinate systems that exist today — the client's abstract `NODE_COORDS {r,c}`
(up to ~500) and the server-only `GEO2` lat/lon table (`wbapi-server.js:5979`) — into one source
of truth read by algorithm, navigation, mapping, and world data.

### 2.1 Projection (equirectangular / Plate Carrée — NOT Mercator)

Equal degrees per cell. The current geo-seed comment says "Rectangular Mercator"; that is a
**misnomer to fix** — Mercator stretches latitude nonlinearly, which would break equal-degree cells.

```
RES    = 1°            (resolution, locked)
LAT_N  = +70°  (top, row 0)        LAT_S = −20° (bottom, row 89)
ROWS   = (LAT_N − LAT_S)/RES = 90
COLS   = 360/RES = 360             LON origin = −180° (col 0)

row(lat) = clamp(floor(LAT_N − lat), 0, ROWS−1)      // N→S, clamped (no wrap)
col(lon) = mod(floor(lon + 180), COLS)               // wraps E↔W
latOf(r) = LAT_N − r − 0.5         lonOf(c) = c − 180 + 0.5      // cell centres
```

**Topology = cylinder.** Longitude wraps (`col 359` is 4-adjacent to `col 0`); latitude clamps
(rows 0 and 89 are edges). The band stops short of ±90°, so there is no pole singularity and every
`(lat,lon)` in `[−20,70] × [−180,180)` maps to exactly one cell. Hub anchor **LHR (Birka,
59.3°N,17.6°E) → cell (10,197)**.

**Data fit (verified against live GEO2):** latitude data spans −3.2°S … +67.8°N — the 70/−20 band
holds all current anchors with headroom. Longitude data spans −25.7°W … +66.9°E (cols ~154–247);
the remaining ~3/4 of the longitude band is open ocean, and the E↔W wrap joins ocean to ocean
(harmless, reserved for future Atlantic/Pacific content).

### 2.2 Cell occupancy — collision rule (1° merges dense cities)

At 1° resolution multiple named nodes share a cell (e.g. **LDN, LON, BRK all → cell (18,179)**).
Therefore `CELL_GRID` maps to a **list**, and a cell is a *locale* that may contain ≥1 named node:

```
CELL_GRID["r,c"] → [nodeCode, …]   // [] = empty cell;  length>1 = multi-node locale (city districts)
primaryOf(cell)  = list[0]          // the node you "arrive at"; others are intra-cell sub-locations
```

Intra-cell navigation (moving between co-located districts) costs **no grid step** — it is a
sub-location pick within the locale, not a `move(dir)`. This preserves a 360×90 overworld without
losing any of the ~419 nodes, and reads naturally as a MUD (a city cell = a room cluster).

### 2.3 Land / sea passability (sea is impassable)

Most cells are ocean. A static **`SEA_MASK`** (1° land/sea raster over the active region) makes
reachability mean "the road network," not "walk the Atlantic":

```
passable(r,c) = inBounds(r,c) ∧ ¬SEA_MASK.has("r,c") ∧ ¬IMPASSABLE_CELLS.has("r,c")
```

Water crossings are **explicit ferry edges** — a small, hand-authored set (English Channel,
Gibraltar, Bosphorus, Baltic, Iceland approaches). This is the *only* sanctioned re-introduction of
stored edges, and it is bounded and water-only — not the old highway/junction mesh:

```
FERRY_EDGES = Set of { a:"r,c", b:"r,c" }   // bidirectional land↔land crossings over sea cells
neighbours(r,c) = ({(r±1,c),(r,c±1)} with col wrapped) ∩ passable   ∪   ferryNeighbours(r,c)
```

### 2.4 The field both movers read

```
terrainAt(r,c):
  list = CELL_GRID["r,c"]
  if list?.length:        return NODE_MAP[list[0]].name      // locale → primary node's terrain
  if SEA_MASK.has("r,c"): return 'sea'                       // new terrain key
  else:                   return inferTerrain(r,c)           // land empty cell → majority vote of named 4-neighbours, fallback 'midlands'
```

Invariants the field must satisfy (proved by §WALK-4):
- **I1 (totality):** `terrainAt` is defined for every in-bounds cell (land, sea, or locale).
- **I2 (no routing stubs):** no `node.junction === true`; every named cell is a *destination*. (§WALK-1)
- **I3 (reachability):** every named node is reachable from hub **LHR** by a 4-connected **land** walk
  plus ferry edges. (§WALK-3 + §WALK-4)
- **I4 (on-land):** every named node sits on a non-sea cell; ferries connect only land↔land.

Terrain keys are the existing 40 in `WORLD_DB` plus `sea`. The `junction` terrain entry is removed
by §WALK-1.

### 2.5 Migration consequence

All `NODE_COORDS` are **re-projected** from the abstract grid to geo cells. GEO2 covers 74 cities;
the remaining named nodes (dungeon/story nodes, Birka sub-locations like BMA, etc.) must either get
a lat/lon and project, or be assigned as sub-locations of a GEO2 cell (§2.2). This is a one-time
batch via an extended geo-seed (equirectangular). Tracked as §WALK-1.5 in the order below.

---

## 3. §WALK-1 — Delete Junction Nodes (resolves the walkability bug)

**Decision: delete, do not restore transparency.** Both make the signpost screens stop appearing,
but they differ structurally:

| | Transparency (rejected) | Deletion (chosen) |
|---|---|---|
| Mechanism | Mover special-cases `node.junction` and renders empty cell instead | 316 junction nodes removed from `NODE_MAP`/`NODE_COORDS` |
| Residual state | 316 dead nodes persist in grid, audits, exports, heatmaps | none — cells become genuinely empty, `terrainAt` infers |
| Invariant I2 | violated (stubs still exist) | satisfied |
| Mover complexity | +1 branch in the kernel (poisons §WALK-2) | kernel stays branch-free |
| Reversibility | trivial | git revert; nodes are reconstructable by reweave if ever needed |

Transparency keeps a class of node that exists only to be ignored — it would have to be
special-cased in the mover (defeating §WALK-2's pure kernel), in audits, in reachability, and in
the MUD `buildLook`. Deletion removes the category.

**Data operation (API-first, per policy):**
- Endpoint already exists: `POST /api/admin/delete-junctions` (`dryRun` body). Confirm it still
  matches the boilerplate predicate, extend if the 316 include non-boilerplate text.
- Promote any junction carrying real narrative text to a named node (drop `junction:true`, keep `text`, give a real `label`); the prior pass promoted J13/WRO — re-audit the current 316.
- Delete `QUEST_DB` entries whose `activateNode` points at a deleted code (none expected).
- Remove the `junction` terrain entry from `WORLD_DB` and any `junction:true`/`name:"junction"` residue.

**Acceptance:** `grep -c 'junction:true' roll2hit-v3.html` → 0; `./api.sh audit` reports 0
junction warnings; walking through former junction cells shows the empty-cell screen; no signpost stop.
**Status: ✅ DONE (commit efa8f7a, 2026-06-25)** — 316 deleted, predicate extended to `"Signpost says:"`, audit clean.

---

## 3.5 §WALK-1.5 — Geo Re-Projection (data substrate) — SCOPED 2026-06-25

The mover (§WALK-2) and reachability (§WALK-3) assume every node lives on the geo-grid of §2. Today
it does not. This step builds that substrate. Ground truth (post-§WALK-1, measured against the live
file + GEO2):

| Fact | Value |
|---|---|
| NODE_MAP entries | **409** |
| NODE_COORDS entries | **409** (every node has abstract `{r,c}`; **0** missing) |
| Nodes with authoritative lat/lon (GEO2) | **~84** |
| Nodes needing geographic placement | **~325** |
| GEO2 cities that **collide** at 1° | **23 cities across 11 cells** (e.g. (18,179)=LDN/LON/BRK; (5,158)=HHL/ISL; (26,190)=PIS/PSA) |
| Current geo-seed projection | linear fit into an 8–500 box, **6.47 cells/° lat vs 5.07 cells/° lon** (not equal-degree, not Mercator despite the comment) |
| Current collision handling | `c++` nudge east (wrong at 1° — pushes nodes into the sea) |
| `CELL_GRID` build | last-write-wins (`g[key]=code`) — silently orphans collided nodes |
| `CELL_GRID` read sites in client | **10** |

### 3.5.1 Projection rewrite (mechanical)
Replace the geo-seed box-fit with the §2.1 equirectangular formula:
```
row(lat) = clamp(floor(70 − lat), 0, 89)      col(lon) = mod(floor(lon + 180), 360)
```
Remove the `c++` nudge — collisions are now *expected* and handled by locale lists (§2.2), not by
relocating cities.

### 3.5.2 CELL_GRID → locale lists (client, ~10 sites)
`g[key] = code` → `(g[key] ??= []).push(code)`. The 10 read sites switch to `primaryOf(cell)` /
array-aware logic (`roll2hit-v3.html:9134` build; reads at 25680, 25708, 25732, 32199, 32279, 32283,
32319, 32398, 32476, 32697). Sub-location navigation within a multi-node cell costs no grid step.

### 3.5.3 Geocoding the ~325 (the bulk — mostly mechanical)
Inspection shows the non-GEO2 nodes are overwhelmingly **real-place satellites** of GEO2 cities,
following a `CityName — Specific Place` label form:
- `PSAGLD` "Florence — Guild Counting House", `CONREG` "Constantinople — Imperial Court Registry",
  `BOLSAC` "Bologna — San Petronio", `VENCTR` "Venice — Ca Tron", `PISGAT` "Pistoia — Eastern Gate"…
- The dense Italian/Tuscany campaign (Florence/Pisa/Pistoia/Prato/Fiesole) + Norse farmsteads
  (Starkad's, Laugar, Saelingsdals Ford) + passes/roads (Carpathian, Apennine, Black Sea Road).

**Decision: offset to own cell via true coords** (not inherit-parent). **Method (validated 2026-06-25):
invert-and-reproject**, not label-matching. Label-matching only resolves 22/228 (most satellites are
labeled by district/feature, not "City —", and a large fantasy/dungeon tail — "Leviathan's Eye",
"Sunken God's Throne" — has no real place name). Instead:

1. Every node already carries an abstract `{r,c}` that reweave placed *near its geographic
   neighbors* — measured median distance to nearest GEO2 anchor = **3 cells** (203/325 within 5,
   none beyond 40). The abstract grid is geographically faithful.
2. The old geo-seed was a global linear map `abstract = linear(lat,lon)` with
   `minLat=-8,maxLat=68,minLon=-25,maxLon=72,gridMin=8,gridMax=500`. **Invert it** to recover an
   approximate `(lat,lon)` from any node's abstract `{r,c}`:
   `lat = 68 − (r−8)/492·76`, `lon = −25 + (c−8)/492·97`. Verified exact on GEO2 (LHR `{64,224}` →
   59.35,17.6 = its true coords).
3. **Re-project** that `(lat,lon)` equirectangular (§2.1). GEO2 nodes override step 2 with their
   authoritative lat/lon; the ~325 others use the inverted-approximate lat/lon.

Fully mechanical, global, no new data, no per-node decisions. Caveat: non-GEO2 nodes inherit any
reweave distortion — acceptable given the 3-cell median fidelity; a handful of real cities missing
from GEO2 (Genoa, Lübeck, Danzig, Riga, Bruges, Naples) should be *added* with true coords first so
their satellites anchor correctly.

Project at 1° so each lands on its (approx) true cell, spreading naturally wherever real separation ≥ ~1°.

**Unavoidable 1° consequence (flagged):** satellites that are genuinely < 1° (~110 km) from each
other — the entire Tuscany campaign (Florence/Pisa/Pistoia/Prato/Fiesole interiors), London's
districts — *cannot* be placed on distinct cells without lying about geography by ≥110 km. For that
residue, offset degrades to **co-location** (locale list, §2.2): the cell carries several
sub-locations. Offset wins where the grid can express it; co-location is the only honest fallback
below 1°. **Open: revisit resolution (e.g. 0.25°) for dense regions, or accept co-located clusters?**

The `camelot` terrain key is a **misnomer** for court/monastery/interior scenes — most (`AIX`
Aix-la-Chapelle, `AUG` Augsburg, `LGE` Liège, `STR` Strasbourg, `TIF` Tbilisi, `YAZ` Yazd) are at
**real places** and geocode normally. Only a handful are genuinely off-Earth (see §3.5.6).

### 3.5.4 SEA_MASK authoring
**Decision: coastline raster (Natural Earth 1:110m → 1°).** Downsample a public coastline to a static
1° land/sea mask over the active window (rows for lat 70..−20, cols ~154–247 for lon −26..+67 ≈ an
90×94 region of interest, ~8.5k cells). **Alignment risk (flagged):** stylized/approximate GEO2
coords may land a coastal city in a raster *sea* cell, violating I4 (on-land). Mitigation: a
reconciliation pass after re-projection — snap any node on a sea cell to its nearest land cell, then
hand-verify. The raster is committed as a generated data blob (the single-file game inlines it).

### 3.5.5 FERRY_EDGES authoring
Some water crossings already exist as nodes — `FRRFRY` "Ferrara — Po River Ferry", `MESFRY`
"Mestre — Mainland Ferry Landing", `LXF` "Saelingsdals Ford" — and inform the edge set. Add sea
straits: English Channel, Gibraltar, Bosphorus, Baltic approaches, Iceland approach, Aegean island
hops (e.g. `NXS` Naxos). Each is a bidirectional land↔land edge over sea cells (§2.3).

### 3.5.6 Off-Earth nodes (the one real fork)
A small set has **no real-Earth coordinate**: Norse divine halls (`ASG` Ásgarðr/Frigg's Hall, `AEG`
Ægir's Feast Hall), the cosmic/math realm (Event Horizon `EHZ`, Monster group `MONS` — see
`project_math_world`), and abstract dream/grief interiors. These cannot project.

**Decision: sub-location of an Earth anchor.** Each off-Earth node co-locates on the cell of a chosen
Earth anchor (Norse halls → the nearest Norse city cell, e.g. Birka/Iceland; cosmic/math realm →
the anchor of the quest that enters it; dream/grief interiors → their framing city). They thus get a
real cell and appear in reachability via the anchor. Anchor selection is derived from the
`activateNode`/entry quest of each. (Trade-off accepted: mythic realms nominally sit "inside" an
Earth cell; acceptable since they are entered via quest transition, not by walking the map.)

**Acceptance:** geo-seed emits equirectangular 1° coords for all geocodable nodes; `CELL_GRID` holds
locale lists; every Earth node sits on a land cell (I4); `SEA_MASK` + `FERRY_EDGES` authored;
off-Earth nodes resolved per the chosen policy; `reachability(LHR)` (§WALK-3) returns one component.

---

## 4. §WALK-2 — Unified Mover Module (the keystone)

Extract the shared step kernel as a **pure function** — no DOM, no SSE, no `Math.random` inside the
kernel (randomness is injected). Both client and server call it and then apply their own side effects
to the returned intent.

### 4.1 Signature (locked)

```js
// world: read-only geo-grid snapshot:
//   { cellGrid,        // "r,c" → [nodeCode,…]   (§2.2 locale list)
//     nodeMap,
//     proj,            // { ROWS:90, COLS:360, LAT_N:70, LAT_S:-20, RES:1 }  (§2.1)
//     seaMask,         // Set "r,c"               (§2.3)
//     ferryEdges,      // Set "r,c|r,c"           (§2.3)
//     impassable,      // IMPASSABLE_CELLS Set
//     terrainAt }      // (§2.4)
// pos:   { r, c }
// dir:   'N' | 'S' | 'E' | 'W'
//
// returns a MoveResult — a *description* of what the move means; the caller performs effects.
move(world, pos, dir) -> MoveResult

MoveResult = {
  ok:        boolean,                  // false ⇒ blocked, pos unchanged
  reason:    null | 'oob' | 'sea' | 'impassable',   // 'oob' only for N/S edge (E/W wraps, never oob)
  from:      { r, c },
  to:        { r, c },                 // === from when !ok;  col wrapped via proj.COLS;  ferry-resolved if crossing
  via:       null | 'step' | 'ferry',  // how `to` was reached
  destCodes: string[],                 // CELL_GRID list at `to` ([] = empty)
  destKind:  'named' | 'empty' | 'sea',
  terrain:   TerrainKey,               // terrainAt(to)
  encounter: { eligible:boolean, baseRate:number }  // caller rolls; kernel only reports eligibility+rate
}
```

The kernel is **deterministic and side-effect free**. It applies the §2.1 wrap/clamp (E/W moves
`mod COLS`, so they never go out of bounds; N/S clamp and can return `reason:'oob'`), rejects sea
cells (`reason:'sea'`) unless a `ferryEdge` bridges `from→to`, and reports the locale list at the
destination (caller resolves `primaryOf`/sub-location, §2.2). Encounter *resolution* (RNG roll,
hunt-mode override, monster pick) stays with the caller because it touches `Math.random` and
game-specific pools; the kernel only reports `{eligible, baseRate}` from `TERRAIN_ENCOUNTER_RATE`.

### 4.2 Module placement

A standalone ES/CommonJS-dual module `mover.js` (sibling of `wbapi-core.js`). The server `require`s it.
The client loads it via a `<script>` whose body is **also** the source of truth — to keep the
"single-file game" guarantee (`roll2hit-v3.html` is the whole game), the build/CI step inlines
`mover.js` into the HTML and a §WALK-4 test asserts the inlined copy is byte-identical to `mover.js`
(walk-parity's structural half).

### 4.3 Caller responsibilities (unchanged behaviour, now thin)

- **Client `cellMove(dir)`** becomes: call `move(...)`; if `!ok` → `storyBlock`; else mutate `S_story`
  (position, log, visited, time, sleep, currentCode), `_setActivePath`/`_getFarewell`, then
  `storyRender(destNode)` if `destKind==='named'` else `_enterEmptyCell`, then roll the encounter
  using `MoveResult.encounter`.
- **Server `session/move`** becomes: call `move(...)`; if `!ok` → 400/200-noop; else mutate `s.r/s.c/s.nodeCode`,
  `broadcastCell('player_arrived')`. (Encounters per §WALK-5.)

**Acceptance:** a single `move()` definition; both callers contain zero duplicated bounds/grid logic;
behaviour-identical to today for the SP client (proved by §WALK-4 walk-parity).

---

## 5. §WALK-3 — Reweave Recast: Single Hub-Flood Reachability

Retire the edge-repair family — `POST /api/graph/fill-gap`, `rip-and-connect`, `fix-all-broken`,
`fix-bidirectional`, and the already-410'd `reweave-all` (including its ~1,200 lines of dead P1/P4/P5
body at `wbapi-server.js:5891–7075+`). These all exist to patch a *stored-edge* graph that no longer
drives navigation (topology is implicit in cell adjacency since §CELL).

**Replacement: one read-only pass.**

```
GET /api/graph/reachability[?hub=<code>]   (already exists at wbapi-server.js:4271 — becomes the only graph tool)

reachability(hub = 'LHR'):              // default hub = LHR (Birka start city) → cell (10,197)
  start = projectToCell(hub)            // §2.1 row(lat)/col(lon)
  flood = BFS over neighbours()         // §2.3: 4-connected LAND (col-wrapped) + ferryEdges only
  reachable   = { land cells visited }
  unreachable = { named nodes } \ reachable
  return { hubCode, reachableCount, unreachableCount,
           unreachable: [{code,r,c,terrain}], components:int }
```

Because sea cells are impassable (§2.3), the flood walks the road network + ferries — it cannot
"swim" across ocean, so `components` and `unreachableCount` are now meaningful. If `unreachable` is
non-empty, the fix is a content decision (re-anchor a node's lat/lon, or add a `ferryEdge`) made via
`PUT /api/node/:code` or the ferry table — **never** by auto-generating junction stubs (that class
is gone, §WALK-1). Reweave becomes a *diagnosis*, not a *mutation*.

**Acceptance:** the four edge-repair endpoints return 410 with a pointer to `/api/graph/reachability`;
dead reweave body removed; `./api.sh` loses `fill-gap`/`reweave-all`, keeps `reachability`.

---

## 6. §WALK-4 — Invariant Test Suite (CI-gated)

Two proofs, run in CI on every change to `mover.js`, `roll2hit-v3.html`, or `wbapi-server.js`.

### 6.1 Reachability proof
- Build the terrain field from the committed `NODE_MAP`/`NODE_COORDS`.
- Assert **I3**: `reachability(hub).unreachableCount === 0` and `components === 1`.
- Assert **I2**: no `junction:true` node; no `WORLD_DB.junction` entry.
- Assert **I1**: `terrainAt` defined for every named cell + its passable 4-neighbours.

### 6.2 Walk parity
- **Structural:** the `mover.js` block inlined in `roll2hit-v3.html` is byte-identical to `mover.js`.
- **Behavioural:** a fixed seed + scripted dir sequence run through `move()` produces an identical
  `MoveResult` trace whether invoked as (a) the client's extracted kernel or (b) the server's kernel.
  This is the regression lock that lets §WALK-2 refactor `cellMove` without behaviour drift.

Test runner reuses the existing `tests/` harness conventions (see memory: `feedback_test_dismissContinue` —
`storyEnter()` fires on load; `SEED_STATE` needs `visitedCells:{}`).

**Acceptance:** CI job red on any I1/I2/I3 violation or parity mismatch; green on current main after §WALK-1–3.

---

## 7. §WALK-5 — MUD Multi-Client Harness (instanced encounters, v1)

**Decision: instanced encounters for v1.** Each session resolves its own encounter when it steps onto
a cell. Co-presence is *social* (chat, `player_arrived`, `who`, shared `look`) but **not** combat-shared.

| | Instanced (chosen, v1) | Shared (deferred) |
|---|---|---|
| Encounter state | per-session, lives in `SESSIONS[id].state` | per-cell live encounter object, contended |
| Concurrency | none — Node single-thread, one synchronous `move` per session | needs per-cell mutex / turn queue |
| Testability | a harness can drive N independent clients deterministically | requires modelling interleavings |
| MUD feel | weaker (you see arrivals/chat, fight alone) | stronger, but out of scope for v1 |

This matches the existing §CELL-07 design note ("Node.js single-threaded… no per-session mutex
needed"). Shared encounters would require that mutex and a cell-scoped combat object — explicitly v2.

### 7.1 Session move + encounter (locked shape)

```
POST /api/session/move {sessionId, dir}
  res = move(world, {r:s.r,c:s.c}, dir)
  if !res.ok: 200 { ok:false, reason, look }
  s.r,s.c,s.nodeCode = res.to..., res.destCode
  broadcastCell(res.to, 'player_arrived', {...}, sessionId)
  // INSTANCED encounter:
  if res.encounter.eligible:
     roll = seededRandom(s)          // per-session RNG stream, reproducible in harness
     if roll < (s.huntMode ? 1 : res.encounter.baseRate):
        s.state.encounter = pickMonster(res.terrain, s)   // stored on the session, not the cell
  return 200 { look: buildLook(s), encounter: s.state.encounter || null }
```

### 7.2 Test harness

A multi-client driver (`tests/mud-harness.*`) that:
- spins the server, starts K sessions at the hub,
- issues scripted move/say sequences per client with a per-client seed,
- asserts: (a) `player_arrived` SSE delivered to co-present sessions only; (b) each client's encounter
  trace is a pure function of its own seed + path (instancing — client A's fight never appears in B);
  (c) `who`/`look` reflect co-presence; (d) idle TTL prunes sessions.

**Acceptance:** K-client harness green; instancing property (b) holds; no cross-session encounter bleed.

---

## 8. Migration Order & Risk

Strictly sequential — each step is a green-CI checkpoint:

1. **§WALK-1** delete junctions (API-first; commit) → walkability bug fixed immediately.
2. **§WALK-1.5 (geo re-projection)** switch geo-seed to equirectangular (§2.1); re-project all `NODE_COORDS` onto the 360×90 / 70N–20S grid; convert `CELL_GRID` to locale lists (§2.2); author `SEA_MASK` + `FERRY_EDGES` (§2.3). This is the data substrate §WALK-2/3 assume — it must land before the mover is unified.
3. **§WALK-2** extract `mover.js` (wrap/clamp/sea/ferry/locale per §4.1), rewire both callers (behaviour-locked by §WALK-4 parity).
4. **§WALK-3** retire edge-repair endpoints, delete dead reweave body, keep `reachability` (land+ferry flood from LHR).
5. **§WALK-4** wire CI gate (reachability proof I1–I4 + walk parity).
6. **§WALK-5** MUD harness + instanced encounter resolution on `session/move`.

**Risks:**
- *1° city collisions:* LDN/LON/BRK → cell (18,179). Resolved by locale lists (§2.2), but every render/quest/`buildLook` path must read `primaryOf` + sub-locations, not assume one node per cell.
- *SEA_MASK authoring:* a wrong land/sea cell silently strands a coastal node (fails I3/I4). Mitigation: seed the mask from a public 1° coastline raster, then hand-verify the ~10 named straits/crossings against FERRY_EDGES.
- *Re-projection drift:* non-GEO2 nodes (dungeon/story, Birka sub-locations) have no lat/lon; they must be geocoded or assigned as sub-locations before §WALK-2 (§2.5). A node left on old `1..500` coords lands far off-grid.
- *Equirectangular distance:* 1° cell at 60°N ≈ ½ E–W width of one at the equator; do not derive travel time from cell count near the top edge.
- *Promoting vs. deleting the 316:* J14–J31 are boilerplate "Signpost says…"; re-audit before bulk delete (dry-run + AI text classification per §CELL-05 task script).
- *Single-file guarantee vs. shared module:* resolved by inline-and-verify (§WALK-2.2 / §WALK-4.2).
- *Server bounds drift:* server `session/move` lacks the client's bounds/impassable rules; unifying via `move()` closes this gap (a latent server bug fixed for free).

## 9. Open Decisions

**Resolved this session:**
- **Next artifact:** this lab report (over executing §WALK-1 directly). ✅
- **Encounter model:** instanced for v1. ✅
- **Junction fork:** delete, not transparency. ✅ (uncommitted transparency revert folds into §WALK-1)
- **Coordinate system:** geo-grid, equirectangular, 1° / 360×90, band 70°N→20°S. ✅
- **City collisions @ 1°:** locale lists — a cell holds ≥1 node; intra-cell moves are sub-location picks. ✅
- **Sea:** impassable land/sea mask + explicit ferry edges (only sanctioned stored edges). ✅
- **Canonical hub:** **LHR** (Birka, the `currentCode:'LHR'` start node) → cell (10,197). ✅
- **§WALK-1 executed:** 316 junctions deleted, commit efa8f7a. ✅

**Resolved for §WALK-1.5 (2026-06-25):**
- **City satellites:** offset to own cell via *true* lat/lon; sub-degree residue (Tuscany, London) co-locates as locale lists — offset cannot beat the 1° floor. ✅
- **Off-Earth nodes (ASG/AEG/EHZ/MONS/dream):** sub-location of an Earth anchor derived from their entry quest. ✅
- **SEA_MASK source:** Natural Earth 1:110m coastline → 1° raster, committed as a generated blob; reconciliation pass snaps sea-cell nodes to nearest land (I4). ✅

**Remaining for implementation time:**
- Whether to revisit resolution (e.g. 0.25°) for dense regions vs. accept co-located sub-degree clusters at 1° (§3.5.3).
- Ferry-edge inventory (some already exist as nodes: FRRFRY, MESFRY, LXF).
- Exact Earth anchor for each off-Earth node (derive from `activateNode`/entry quest).

---

*© 2026 Paul Richeson — MIT License.*
