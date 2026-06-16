<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->

# Lab Report Synthesis — Part 3: World & Navigation
**Cross-Reference of All World & Navigation Lab Reports Against roll2hit-v3.html**
**Date:** 2026-06-16 · **HTML baseline:** 33,721 lines · **Source reports:** 13

---

## Purpose

Each entry reads the lab report against the live HTML and answers: what was documented, what is the current code, what still applies as working design knowledge. Reports are in `lab-reports/` untouched.

---

## Report 1 — `lab-report-circuit-map-theory.md`
**Original scope:** Layer 9 — Circuit Corridor Junction model, sparse node mesh, TSP framing (2026-05-21)
**Status:** Historically foundational — the junction concept was later superseded by §CELL, but the theory explains why

### What the report said

The **Circuit Corridor model** solved the sparse grid problem: a world of 42 named nodes embedded in a real grid so that distance is visible and direction is legible. Junction nodes (`J####`) were inserted to fill coordinate gaps between named cities, creating traversable wire traces. The design insight: two named places should *feel* far apart because the grid cells between them are physically far apart. The junction model also addressed the "lost in a field" problem by making every corridor a directed path with a specific destination.

The report framed the problem as a TSP variant: given N named cities, build the minimum-cost traversable mesh that makes all N reachable from any starting point. The circuit corridor is the solution: L-shaped junction chains between city pairs, with intermediate J-nodes at every grid step.

### Current HTML relevance

The junction model grew catastrophically (see Reports 3–6 below) — from ~300 named nodes to 20,936 total nodes, 97.9% of which were J#### scaffolding. The §CELL redesign (§CELL-01–§CELL-13) replaced it with implicit adjacency: two nodes are connected if and only if their `(r,c)` coordinates are adjacent on the 500×500 grid. No junction nodes. No stored exit edges. The wire trace is now implicit in coordinate proximity.

**The insight survives**: the "sparse world embedded in a real grid" framing is still the architecture. `NODE_COORDS` (line 8,619, 411 entries) + `CELL_GRID` (line 9,057) is the current implementation of that insight. The corridor is no longer a chain of J-nodes — it is simply the coordinate space between two named nodes.

### What still applies

- The design principle: distance should be *visible* in the grid. Don't place two important nodes adjacent to each other if they should feel far apart narratively. Coordinate distance = narrative distance.
- The "sparse world in a real grid" model is the permanent architecture. `NODE_COORDS` is the canonical source; `CELL_GRID` is the derived lookup.

---

## Report 2 — `lab-report-battleground-circuit-path-quest.md`
**Original scope:** Battleground architecture — stalk mechanic, quest-terrain coupling, guaranteed intentional encounters (2026-05-21)
**Still active:** Yes — the battleground model and stalk mechanic are live

### What the report said

**The "lost in a field" problem**: players searching for a specific enemy type in a large world waste time on undifferentiated search. Solution: every terrain type in `WORLD_DB` maps to exactly one named battleground node; the Stalk mechanic at that node provides a *guaranteed* intentional encounter with that terrain's monster pool.

**Stalk vs Hunt**: Hunt (probabilistic corridor encounter, ~25%) vs Stalk (guaranteed intentional encounter at a designated battleground node, 100% chance, costs bonus phase time). The distinction gives players two encounter modes with different risk/reward profiles.

**Quest-terrain coupling**: a quest's `activateNode`, `targetTerrain`, and optimal grinding location are all derivable from a single data structure. The player follows a quest pointer directly to the correct battleground — no search required.

### Current HTML

| Symbol | Line | Current state |
|--------|------|---------------|
| `WORLD_DB` | 5,709 | Active — 66 terrain entries, each with `monsters:[]` pool |
| `HUNTING_GROUNDS` | 9,075 | Active — 42 terrain → displayName for Hunt Mode header |
| `storyToggleHunt()` | 33,180 | Active — enables/disables Hunt Mode |
| `_stalkedMonsterPick(terrain)` | 33,322 | Active — guaranteed pick from terrain's monster pool |
| `_weightedMonsterPick(terrain)` | ~33,280 | Active — probabilistic pick for corridor encounters |
| `TERRAIN_ENCOUNTER_RATE` | 9,069 | Active — per-terrain probability (0 for road/junction, 0.15–0.35 for wilds) |
| `cellMove(dir)` + encounter check | 26,002 | Active — empty cell movement checks encounter rate |

The stalk/hunt duality is fully live. `_enterEmptyCell()` (line 26,154) checks `S_story.huntMode` to decide between `_stalkedMonsterPick` and `_weightedMonsterPick`.

### What still applies

- **Every terrain type should have exactly one battleground node.** The quest-terrain coupling invariant: if a quest targets terrain X, the player should be able to navigate to a named node with terrain X and use Hunt/Stalk there.
- **`TERRAIN_ENCOUNTER_RATE` road/junction = 0** is intentional and must be preserved. Roads are safe passage. Wilds are dangerous.
- The stalk mechanic is the anti-search primitive. Any new "find N of monster type X" quest should point to a battleground node, not ask the player to wander.

---

## Report 3 — `lab-report-plan-cleanup-v13.md`
**Original scope:** plan.md compaction — Layers 9–13 archived (2026-05-21)
**Status:** Historical record — all Layer 9–13 features are implemented; the compaction discipline is the living lesson

### What the report said

After Layers 9–13 were implemented, plan.md held 1,223 lines of now-redundant specification. The report archived the specs and reduced plan.md to 85 lines. Key implemented items: corridor system (L9), Hunt Mode (L9), Stalk mechanic (L9), poison/bleed conditions (L11), death saves (L11), XP awards from quest completion (L12), gold/loot drop (L12), vendor system (L13).

### Current HTML relevance

All Layer 9–13 systems are live. The corridor system has been fully replaced by §CELL, but all the *behaviors* it enabled (Hunt, Stalk, terrain encounters) are still present under the new coordinate model.

The compaction discipline — "once a layer is verified, the spec is redundant noise; archive it to a lab report" — is the standing rule for plan.md maintenance.

---

## Report 4 — `lab-report-plan-cleanup-v17.md`
**Original scope:** plan.md compaction — Layers 14–17 archived, 6 bug corrections documented (2026-05-21)
**Status:** Historical record — all Layer 14–17 features implemented

### What the report said

Layers 14–17: conditions/Flashbang (L14), shield items (L15), flee mechanic (L16), 1.5 AP action economy (L17). Six post-implementation bug corrections are documented here — including the offhand dagger slot enforcement fix and the Flashbang bonus-action cost assignment. These are the kinds of bugs that are hard to see in a plan but obvious in live code.

### Current HTML relevance

All Layer 14–17 systems are live. The 6 bug corrections are preserved in the code (not in comments, but the fixed behavior is present). The report is the only surviving record of *why* those specific constraints exist.

### What still applies

- Shield + offhand dagger are mutually exclusive. This was a bug fix, not an original design. Do not re-introduce dual equip.
- Flashbang is a bonus action, not a free action. This is enforced in `_sboLog()` at line 22,880.

---

## Report 5 — `lab-report-map-audit-layout-tooling.md`
**Original scope:** 5 interlocking systems — TTS queue, patch sidecar, monitor improvements, map graph validation with auto-fix, BFS layout solver (2026-06-04/05)
**Status:** The tooling systems are developer infrastructure; the graph repair outcomes are in the current map

### What the report said

**`say.sh`/`sayd.sh` TTS queue**: serialized speech output without daemon lock races. Monotonic sequence counter + `mv FILE.txt FILE.speaking` atomic claim. Queue-file-based, uses `pgrep` not PID file.

**Map graph validation**: diagonal exit detection, bidirectional repair, two grid-placement rules (alignment, axis distance). `GET /api/layout/solve` (BFS layout solver) + `POST /api/layout/apply` (mass coordinate update).

The session produced the first systematic graph repair tooling — running before the junction explosion (see Reports 6–9).

### Current HTML relevance

The graph repair validated that the node network is 100% reachable (BFS from LHR touches all 411 `NODE_COORDS` entries). The `say.sh`/`sayd.sh` scripts are developer tooling, not in the HTML.

### What still applies

- `GET /api/layout/solve` + `POST /api/layout/apply` are the correct tools for bulk node repositioning. Use them rather than hand-editing coordinates.
- The **reachability invariant**: every node in `NODE_COORDS` must be BFS-reachable from `LHR` on the `CELL_GRID`. Run `GET /api/reachability` after any major coordinate change.

---

## Report 6 — `lab-report-node-network-reconnection.md`
**Original scope:** Full node network repair — 89% → 100% reachability, 781 → 1683 nodes during repair (2026-06-09)
**Status:** Historical — documents the peak of the junction-explosion problem before §CELL redesign

### What the report said

Pre-repair state: 781 nodes, 694 reachable (89%), 87 isolated clusters, 497 broken edges. Three tools in sequence: `fix-all-broken` (coordinate alignment), bidirectional batch fix (one-way link repair), `rip-and-connect` (stray node relocation). Result: 100% reachability across 1,683 nodes. The node count grew from 781 to 1,683 during repair because `fix-all-broken` cascades spawned elbow junctions to bridge coordinate gaps.

### Current HTML relevance

This represents the pre-§CELL state. The current `NODE_MAP` (127 named content nodes) + `NODE_COORDS` (411 entries) is dramatically smaller than the 1,683 nodes at this report's close, because §CELL-05b purged 268 zombie J-stubs, and the §CELL redesign eliminated the need for junction chains entirely.

The three repair tools (`fix-all-broken`, bidirectional fix, `rip-and-connect`) still exist in `wbapi-server.js` and are still valid for the post-§CELL world.

### What still applies

- The **three-step repair sequence** is still correct when reachability drops: `fix-all-broken` → bidirectional → `rip-and-connect`. Run `GET /api/reachability` before and after.
- The broken edge categories (diagonal, gap, diagonal_and_gap) are still the diagnostic vocabulary.

---

## Report 7 — `lab-report-junction-reweave-overhaul.md`
**Original scope:** Design document — junction explosion audit (20,936 nodes, 97.9% J####) and proposed cleanup strategy (2026-06-10)
**Status:** This report diagnosed the crisis that motivated §CELL

### What the report said

At the time of writing: 20,936 total nodes, 20,493 J#### junctions (97.9%), 443 named locations (2.1%). Quest references to J#### nodes: 0. The junction inflation was caused by cascading `fix-all-broken` passes each spawning new elbow nodes to bridge gaps created by prior passes.

The proposed solution: wither pass (delete junctions not on any quest desire path and not structural bridges), derelict cleanup (delete degree-≤1 junctions), and ultimately a coordinate redesign.

### Current HTML relevance

The §CELL redesign (§CELL-01 through §CELL-13) implemented the clean solution: strip all `N/S/E/W` fields, remove all J#### nodes, derive adjacency from coordinates. The junction problem is fully resolved.

Current state: `NODE_MAP` has 127 named content entries. `NODE_COORDS` has 411 entries (some are intermediate relay nodes that replaced J#### chains but have quest/NPC content). Zero J#### nodes remain.

### What still applies

- **Never use `fix-all-broken` on a large map without a junction budget cap.** The cascade is self-compounding. The §CELL model eliminates the need for junction repair because exits are implicit.
- The wither-pass concept lives in MegaReWeave Phase P7 (`wbapi-server.js`) — it deletes structurally unnecessary junctions after each rebuild. Still valid.

---

## Report 8 — `lab-report-mega-reweave.md`
**Original scope:** MegaReWeave procedure — 9-phase server-side loop for building/repairing the full node network (2026-06-10+)
**Still active:** Yes — MegaReWeave is the canonical world-rebuild tool

### What the report said

MegaReWeave (`POST /api/graph/reweave-all`) runs 9 phases: P0 (geo-seed GEO2 cities to Mercator coordinates), P1 (rip-and-connect stray nodes), P2 (priority highway chains between named city pairs), P3 (city mesh MST), P4 (fix-all-broken), P5 (fix-bidirectional), P6 (derelict cleanup — delete dead-end scaffolding), P7 (wither — delete junctions not on any quest desire path), P8 (final reachability check). Streaming output. No timeout.

### Current HTML relevance

MegaReWeave is developer tooling in `wbapi-server.js` — not in the HTML. It is the correct tool to run after adding many new nodes or after a coordinate migration.

The phases map cleanly to the current §CELL world: P0–P3 build connectivity, P4–P5 repair it, P6–P7 prune scaffolding, P8 verifies. The `--no-wither` flag skips P7 when building a new arc (before quests are added to pin the junction nodes).

### What still applies

- Run MegaReWeave after any bulk node addition or major coordinate change. The 9 phases are the correct order.
- Always run P8's reachability check manually (`GET /api/reachability`) before committing a world change to the HTML.
- `--no-wither` during arc construction; remove it for cleanup passes.

---

## Report 9 — `lab-report-highway-mesh-entry.md`
**Original scope:** Two `buildHighway()` fixes — same-component skip guard, mesh-entry selection (closest-pair routing) (2026-06-10+)
**Still active:** Yes — both fixes are in `wbapi-server.js`

### What the report said

**Problem 1 — over-building**: `buildHighway(from, to)` built a highway even when `from` and `to` were already in the same connected component. Fix: BFS check at the top of `buildHighway`; return `{skipped:true}` if already connected.

**Problem 2 — routing to city center**: Highway was routed all the way to the target city's coordinate, potentially deep inside an existing mesh. Fix: BFS both components, find the closest-pair of nodes one from each component, route between those instead. Saves many unnecessary junction creations.

### Current HTML relevance

Developer tooling in `wbapi-server.js`. These fixes make MegaReWeave Phase P2/P3 significantly more efficient — highways connect at mesh borders rather than punching through existing connectivity.

### What still applies

- The same-component skip guard is essential. Any highway-building code must check reachability before building.
- The closest-pair entry selection is the correct approach for all MST-style highway building. The city's content coordinates are the anchor; the mesh-entry coordinates are the connection point.

---

## Report 10 — `lab-report-movement-by-cells.md`
**Original scope:** §CELL-01–§CELL-12 architectural transition — full program flow, BFS, 2-tier test suite spec (2026-06-13/14)
**Still active:** Yes — this is the definitive description of the current navigation architecture

### What the report said

Complete architectural transition from N/S/E/W edge-list graph to coordinate-based sparse grid:

- **`CELL_GRID`** (`"r,c"` → nodeCode): built once at startup from `NODE_COORDS`. The single source of truth for adjacency.
- **`cellMove(dir)`**: one keypress = one cell. Named nodes entered when `CELL_GRID["r,c"]` exists; empty cells handled by `_enterEmptyCell`.
- **`_bfsGridPath(fromCode, toCode)`**: BFS over the 500×500 grid for waypoint navigation.
- **`visitedCells`**: `"r,c"` → true for every cell stepped on — drives §CELL-10 minimap shading.
- **`IMPASSABLE_CELLS`**: Set of `"r,c"` strings for sea cells — blocks movement.

The report also specified a 2-tier test suite: Playwright browser integration tests (navigation flow, BFS correctness, `storyWaypoint`, exit link consistency) and Node.js unit tests (BFS correctness, parity checks). The Playwright tests run with `npm test` at `localhost:7654`.

### Current HTML

| Symbol | Line | Current state |
|--------|------|---------------|
| `NODE_COORDS` | 8,619 | Active — 411 entries |
| `CELL_GRID` | 9,057 | Active — built from NODE_COORDS at startup |
| `IMPASSABLE_CELLS` | 9,066 | Active — `new Set()`, populated by §CELL-10 minimap init |
| `cellMove(dir)` | 26,002 | Active |
| `_enterEmptyCell(r, c)` | 26,154 | Active |
| `_bfsGridPath(fromCode, toCode)` | 33,105 | Active |
| `storyWaypoint()` | 33,153 | Active |
| `storyToggleHunt()` | 33,180 | Active |
| `visitedCells: {}` in `_S_DEFAULTS` | 21,184 | Active |

The §CELL architecture is fully live and stable. The test suite spec was implemented as 35+ Playwright tests in `tests/integration/navigation.test.js`.

### What still applies

- **The reachability invariant**: every `NODE_COORDS` entry must be BFS-reachable from `LHR` via `CELL_GRID`. This is tested by the Playwright suite.
- **The 500×500 grid boundary**: `nr < 1 || nr > 500 || nc < 1 || nc > 500` blocks movement at grid edges (line 26,009). Coordinates should stay well within `(10–490, 10–490)` to give room for expansion.
- **`IMPASSABLE_CELLS`** is a Set, not part of `NODE_MAP`. Blocking a cell means adding its `"r,c"` string to this Set — do not add a node with battle:null.
- **Empty cells**: `_enterEmptyCell` infers terrain by majority vote of named neighbors (§CELL-04). New content nodes should be named nodes in `NODE_MAP`; don't rely on terrain inference for quest content.

---

## Report 11 — `lab-report-cell-map-mud-redesign.md`
**Original scope:** §CELL-01–§CELL-11 — 11-section grid migration, MUD session layer, 419 nodes, dead code removal (2026-06-14)
**Still active:** Yes — summary of all §CELL implementation decisions

### What the report said

Section-by-section: §CELL-01 (N/E/S/W field strip), §CELL-02 (CELL_GRID construction), §CELL-03 (cellMove), §CELL-04 (empty cell traversal with terrain inference), §CELL-05a/b (268 zombie J-stubs purged), §CELL-06 (exit links derived from CELL_GRID), §CELL-07/08 (BFS + heatmap for waypoint + minimap), §CELL-09 (BFS path function `_bfsGridPath`), §CELL-10 (minimap with visited-cell fog), §CELL-11 (MUD session layer `/api/session/*`). Also: quest triggers become cell-driven, dead corridor code removed.

**Three problems the old corridor system created**: fake topology (stale edge pointers), dead startup cost (`_buildNodeExits()` on every load), non-obvious movement semantics (pressing North launched a dialog if the nearest node was 5 cells away).

### What still applies

- **§CELL-04 terrain inference (majority vote of named neighbors)** is the fallback for empty cells. The result is used for encounter rate and monster pool selection. It is not authoritative for named content.
- **§CELL-06 exit links**: exit links in the story UI are derived at render time from `CELL_GRID` adjacency — not stored in `NODE_MAP`. Do not add `N/S/E/W` fields back to NODE_MAP entries.
- **§CELL-10 minimap**: `visitedCells` drives fog-of-war shading. The minimap renders an 11×17 window centered on the player. The glyph table is at line 32,722.

---

## Report 12 — `lab-report-epic-battlegrounds.md`
**Original scope:** Layer 39 — 20 Epic Battleground dead-end nodes, `EB_NPC_DIALOGUE`, payment negotiation, return beats (2026-05-22)
**Still active:** Yes — all 20 EBs are live

### What the report said

**Epic Battlegrounds** are dead-end nodes — attached to parent terrain nodes as single-exit locations. Each has: a named NPC with a personal reason and visible wound; a warning; a negotiation (floor/ceiling gold range); one deadly-tier boss; a return quest. The boss is singular — no tier selection, no warm-up. The pre-battle screen shows `DANGER: EPIC` in deep red. 20 EB nodes added to the map mesh.

The **5-field NPC profile** structure: `{npc, occupation, wound, opening, warning, ...}`. The payment negotiation uses a CHA DC 17 check to push above the floor offer. Return quests gate on `ebReturnDone[ebCode]`.

### Current HTML

| Symbol | Line | Current state |
|--------|------|---------------|
| `EPIC_BOSS_POOL` | 23,982 | Active — 20 deadly-tier bosses |
| `EB_NPC_DIALOGUE` | 24,024 | Active — 20 quest-giver profiles (5 fields each) |
| `storyPreBattle(node)` | 32,362 | Active — pre-battle overlay with EPIC banner |
| `storyPreFinalBattle()` | 25,660 | Active — final boss (Auros) special path |
| `ebReturnDone` in `_S_DEFAULTS` | ~21,200 | Active |

### What still applies

- **The 5-structure EB pattern** (named NPC with wound → warning → negotiation → boss → return) is canonical for any new Epic Battleground.
- **Dead-end topology**: EB nodes connect to exactly one parent node and to nothing else. `CELL_GRID` enforces this by coordinate placement — put the EB node adjacent to the parent and far from everything else.
- **The negotiation mechanic**: CHA DC 17, floor offer shown first, ceiling offer unlocked on pass. The moral: the NPC tells you the risk accurately. Paying more doesn't make it safer.

---

## Report 13 — `lab-report-naval-campaign-layer.md`
**Original scope:** Design session — ports (§PORT-01/02), naval intercepts (§NAVAL-01), harmony chain (§SPARK-02), whodunit (§WHODUNIT-01), alchemy (§ALCHEMY-01); 9 new nodes, 34 new quests (2026-05-28)
**Still active:** Yes — all named arcs are implemented

### What the report said

Four source transcripts (Flutes Loot, World Anvil, naval campaigns, Ben Byrne) were processed via a three-stage pipeline: principle extraction → selection → sequential implementation. Three arc templates emerged: §SPARK (friendship arc with 5 quest steps), §WHODUNIT (mystery arc with evidence accumulation), §ALCHEMY (world-spanning escort arc). Nine new nodes added: OW (Open Water), SK (Saltwick), SB (Saltwick Bay), DF → now DFL (Dunfall), LD (Loch Dunfall), BN (Ben Barleigh), DA3/§LXXIII (tidal chain). 34 quests across all arcs.

### Current HTML relevance

All nodes and quests are live. The DF node was renamed DFL in §DATA-01 (2026-06-16) — see Part 1 of this synthesis and `lab-report-quest-data-code-separation.md`.

The three arc templates (§SPARK, §WHODUNIT, §ALCHEMY) remain the canonical patterns for new friendship/mystery/escort content.

### What still applies

- **§SPARK template**: 5-quest friendship arc culminating in a mechanical payoff (the Harmony Chain). Structure: hook → investigate → obstacle → resolution → reward. The Dunfall Harmony Chain (Bram/Oat/Commissioner Fehn) is the model.
- **§WHODUNIT template**: clue accumulation arc at a single location. Structure: discovery → witness → evidence → confrontation → resolution. The Bilge Mystery at MS_SPARK is the model.
- **§ALCHEMY template**: world-spanning escort following a named NPC through multiple existing nodes. No new nodes required — the NPC moves through the existing graph. Roen at ALP/NIS/TIF is the model.

---

## World & Navigation Summary — What Is Structurally True Right Now

**The §CELL coordinate model is the navigation architecture.** `NODE_COORDS` (411 entries, line 8,619) + `CELL_GRID` (line 9,057) replace all `N/S/E/W` edge fields. `cellMove(dir)` is the only movement primitive. `_bfsGridPath()` is the only pathfinding primitive. No junction nodes.

**126 named content nodes in `NODE_MAP`, 411 in `NODE_COORDS`.** The gap (285) consists of intermediate relay nodes — nodes with `r,c` coordinates but minimal content, used to create traversable paths between major named locations.

**The reachability invariant is the map contract.** Every `NODE_COORDS` entry must be BFS-reachable from `LHR`. Run `GET /api/reachability` after any major coordinate change.

**20 Epic Battlegrounds**, all dead-end topology, all attached to parent terrain nodes. The `EPIC_BOSS_POOL` (line 23,982) and `EB_NPC_DIALOGUE` (line 24,024) are the canonical EB data sources.

**Three arc templates**: §SPARK (5-quest friendship chain), §WHODUNIT (evidence accumulation), §ALCHEMY (world-spanning escort). All three are live in the world and serve as models for new narrative content.

**MegaReWeave (`POST /api/graph/reweave-all`)** is the canonical world-rebuild tool. Run it after bulk node additions. The 9-phase sequence (geo-seed → rip → highways → MST → fix-broken → fix-bidirectional → derelict-cleanup → wither → check) is the correct order.

---

*Synthesis Part 3 of 7 · Next: Part 4 — Monsters & Fishing · 2026-06-16*
