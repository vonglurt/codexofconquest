<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->

# Junction Reduction & Reweave Overhaul — Lab Report

**Date:** 2026-06-10  
**Branch:** main  
**Status:** DESIGN (pre-implementation)

---

## 1. Current State Audit

| Metric | Value |
|--------|-------|
| Total nodes in NODE_MAP | 20,936 |
| J#### junction nodes | 20,493 (97.9%) |
| Named location nodes | 443 (2.1%) |
| NODE_COORDS entries | 7,348 |
| J#### in NODE_COORDS | 6,883 |
| Named nodes in NODE_COORDS | 465 |
| Quest activateNode/waypointNode refs | 2,257 (322 unique nodes) |
| Quests pointing at J#### nodes | **0** |

**The problem stated plainly:** we grew from ~300 named nodes to 20,936 total nodes. 20,493 of those are scaffolding junctions that ballooned via fix-all-broken cascades and rip-and-connect placement chains. They have no quests, no NPCs, no loot — pure traversal plumbing.

---

## 2. Why Junctions Exploded

Each reweave cycle compounded the problem:

1. **fix-all-broken** found a diagonal or gap edge, inserted an L-shaped junction to route around it. That new junction was itself slightly misaligned → next pass found *it* broken and added another junction.
2. **rip-and-connect** placed stray named nodes by attaching them to the nearest slot in the mesh, often via a chain of junctions when the nearest named node was fully occupied (degree 3+).
3. **priority highways** build L-shaped corridor chains of junctions — one corridor of 100 cells = 25 junctions at step=4.
4. **city-mesh MST** repeated the corridor approach for every GEO2 city pair.
5. **wither** only prunes junctions not on *any* quest desire path AND not a structural bridge. With 20,493 junctions, Tarjan bridge-detection became the bottleneck, and many junctions were "structural" because they were the only path between two named nodes — because all the other paths were also made of junctions.

The result: wither can't thin a jungle when every tree is load-bearing.

---

## 3. Is It Safe to Remove All Junctions?

**Yes. Completely safe.**

- **Zero quest refs:** No `activateNode` or `waypointNode` in QUEST_DB points to a J#### code. Confirmed by script scan.
- **No NPC stations:** BIRKA_NPC entries all reference named codes.
- **No gameplay content:** `junction:true` nodes have `npc:null`, `battle:null`, `loot:null` by construction.
- **Coordinates are scaffolding:** J#### NODE_COORDS entries only exist to place the junction on the grid. They have no lore significance.

The *only* risk is graph disconnection: if two named nodes are connected exclusively through a chain of junctions, deleting those junctions leaves them unreachable. The solution is to **re-stitch named neighbors before deleting** — explained in the new P_NUKE phase below.

---

## 4. Existing Reweave Phases — One at a Time

These are the current phases as implemented in `wbapi-server.js`, run sequentially by `POST /api/graph/reweave-all`. Each is described with its role and what it *must not* lose in the new design.

### P_PRE — Junction Straight-Chain Reduction

**What it does:** For each junction J with exactly 2 connections in opposite directions (A←J→B), stitches A↔B directly and deletes J. Runs up to 10 passes until convergence.

**Invariant preserved:** Only removes junctions in a straight A-J-B line. Does not touch L-shaped junctions or junctions with degree ≠ 2.

**Role in new design:** This is the right direction but too conservative. P_NUKE (below) replaces its nuclear scope. P_PRE can remain as a post-build cleanup for any straight chains that A* incidentally leaves behind.

---

### P0 — Geo-Seed (lat/lon → r,c)

**What it does:** Reads the `GEO2` table (76+ named city codes with lat/lon), projects each to Mercator grid coordinates using `r = gridMin + (maxLat - lat) / range * gridSize`, writes to `NODE_COORDS[code] = {r, c}`.

**Invariant preserved:** GEO2 cities land at geographically correct positions relative to each other. This is the stable foundation — all pathfinding distances are meaningful because they reflect real geography.

**Role in new design:** Unchanged. Run first. This defines the anchor points for A* — cities with lat/lon are "pinned" and do not move.

**Gap:** Only 76+ cities have lat/lon. ~367 named nodes lack geo-seeds and have no canonical r,c. The new cell-primary system (§6) addresses this.

---

### P1 — Rip-and-Connect

**What it does:** Finds "stray" nodes (unreachable from the hub via BFS), then BFS-searches the existing mesh for the nearest node with a free direction slot, places the stray adjacent to it (or via a junction chain if the slot needs one).

**Invariant preserved:** Every named node should end up reachable. If a stray has no clear BFS path, rip-and-connect fires a junction chain to bridge the gap.

**Role in new design:** Still needed for named nodes that have no lat/lon and end up disconnected after P_NUKE. However, in the new design rip-and-connect should **prefer placing nodes by quest chain order** (the stray's quest predecessor/successor) rather than purely by spatial proximity. If the stray's quest predecessor is already placed, snap the stray near it.

---

### P1.5 — Coord-Scan

**What it does:** Scans all nodes with coordinates; if a node at (r, c) has an empty N/S/E/W slot and a neighbor node exists at exactly (r-1,c), (r+1,c), (r,c-1), (r,c+1), wires them together.

**Invariant preserved:** Derives grid-adjacent connections from coordinate geometry. Complements the explicit direction fields in NODE_MAP.

**Role in new design:** Key phase in the new cell-primary model. After A* places nodes at grid cells, coord-scan automatically wires adjacent placed nodes without needing explicit corridor building.

---

### P4 — Fix-All-Broken

**What it does:** Scans all edges `A.dir = B` where B's reverse direction ≠ A or the Euclidean distance between their r,c coords exceeds 4 cells. Inserts an L-shaped junction chain to bridge the gap.

**The cascade problem:** Inserting a junction at cell (r,c) occupies a grid cell. On the next P4 pass the new junction's neighbors may themselves be "broken" (the junction's opposite side is now pointing nowhere). Fix-all-broken plateau detection (2 consecutive non-improving passes) caps this but doesn't prevent the initial burst.

**Role in new design:** After P_NUKE + A*, there should be far fewer broken edges because A* only creates edges between truly grid-adjacent cells. P4 becomes a final polish pass rather than a mass-builder.

**Change needed:** When P4 inserts a junction, check first whether any unplaced quest node should go in that gap cell instead of a blank junction. If `questCellCandidates` (§6) has a node near the insertion point, promote it there instead.

---

### P5 — Fix-Bidirectional

**What it does:** One pass — for every node A with `A.dir = B`, if `B.OPP(dir) ≠ A`, sets `B.OPP(dir) = A`. Repairs one-way links.

**Role in new design:** Unchanged. Run after every phase that adds edges.

---

### P2 — Priority Highways

**What it does:** Reads `PRIORITY_HIGHWAYS` array of `{from, to}` pairs. For each pair, builds an L-shaped corridor of junctions from `from` to `to` using the longer axis first, spacing junctions at `step=4` cells apart.

**The problem:** Each highway = (distance/4) junctions. A Rome→Constantinople highway at grid distance ~80 cells = 20 junctions. With 10+ priority highways, that's 200+ junctions from highways alone, before any MST or fix-all-broken.

**Role in new design:** Replace the L-shaped corridor approach with **A* path** between the two named endpoints (§7). A* finds the shortest path on the existing grid, inserting junction cells only where no named node exists along the path. If the A* path passes through cells where quest nodes need to be placed, those quest nodes are promoted to the path cells (§7 step 4).

---

### P3 — City Mesh MST

**What it does:** Greedy MST — for each unconnected GEO2 city, finds the nearest already-connected city and builds a junction corridor between them.

**Role in new design:** Replace corridor building with A* path, same as P2 highways. After geo-seed (P0), all GEO2 cities have r,c positions. A* between any two placed cities finds the shortest grid path. MST ordering remains (nearest-first), but the paths are A* paths not L-shapes.

---

### P6 — Derelict Cleanup

**What it does:** Deletes junctions with degree ≤ 1 (dead-ends or fully disconnected) that have no quest/NPC refs. Loops up to 20 passes.

**Role in new design:** Remains as the final safety net. After P_NUKE + A* + P4/P5, very few derelicts should exist, but any that do are caught here.

---

### P6.5 — Grid-Connect

**What it does:** For 2-connected junction nodes at (r,c), checks if any neighbor cell has a node at (r±1, c) or (r, c±1) and wires them together if both have a free direction slot.

**Role in new design:** Folded into coord-scan (P1.5). After the new A* model, every junction has coords and grid-connect logic is subsumed by the coord-scan pass.

---

### P7 — Wither

**What it does:** Snail-traverses every quest's desire path (BFS hub→activateNode, hub→waypointNode). Counts traversal for every junction visited. Junctions with traversal=0 that are not structural bridges (Tarjan) are deleted. Multi-pass until stable.

**The bottleneck:** Tarjan on 20,493 junctions is expensive. With ~20K junctions, most are structural (they're the only path between two named nodes via other junctions), so wither eliminates very few per pass.

**Role in new design:** After P_NUKE, the junction count drops to near zero (only A*-placed path junctions remain). Wither on 500 junctions runs in milliseconds. Keep wither as Phase 7 unchanged.

---

## 5. P_NUKE — Nuclear Junction Cull (New Phase)

This replaces the slow many-pass reduction with a single aggressive pass.

### Algorithm

```
1.  Build questRefs: Set of all activateNode + waypointNode codes
    (verified: zero J#### codes appear here)

2.  Build npcNodes: Set of all BIRKA_NPC node fields

3.  Build safeToDelete: all J#### nodes where:
    - !questRefs.has(code)
    - !npcNodes.has(code)
    (= essentially all J#### nodes)

4.  For each J#### in safeToDelete:
    a.  Collect its live neighbor codes (N/S/E/W targets that exist in NODE_MAP)
    b.  For each pair (neighborA, neighborB) of its neighbors:
        - If neighborA and neighborB are directly opposite (OPP4 match): stitch A↔B
        - If L-shaped: record the pair as a "deferred link" (named nodes that need to be
          connected, handled by A* in the next phase)
    c.  Delete the junction from NODE_MAP and NODE_COORDS

5.  After all deletions, run fix-bidirectional (P5) to clean one-way links

6.  Save intermediate snapshot: "p_nuke-done"

7.  Report: N junctions deleted, M deferred pairs (named nodes now disconnected)
```

### What about L-shaped junctions?

An L-shaped junction J connects A→J in direction X and J→B in direction Y (X ≠ OPP4[Y]). This means A and B are not on the same axis. There is no direct grid connection possible between them in one step.

**Do not try to stitch them directly.** Instead, record (A, B) as a deferred pair. After P_NUKE, phases P2 (highways) and P3 (city mesh) will rebuild the connection using A* pathfinding, which will correctly route through intermediate grid cells with new, minimal junctions.

---

## 6. Cell-Primary Coordinate System

The goal is for **every node** (named or junction) to have a canonical `{r, c}` cell coordinate, and for A* to operate exclusively on the cell grid.

### Priority order for assigning r,c:

1. **GEO2 lat/lon → r,c** (P0 geo-seed) — highest authority. These positions do not move.
2. **Existing NODE_COORDS entry** for the node code — trusted if it was set by geo-seed.
3. **Quest chain proximity** — if a node C is quest-linked (C is waypointNode of quest N, which has activateNode at node B), C should land near B on the grid. Place C at the nearest unoccupied cell adjacent to B in the direction of C's other quest successor.
4. **Rip-and-connect spatial nearest** — existing behavior, used as fallback.

### Grid representation

The grid bounds are already defined in P0:
- lat: −8 → 68 (N→S rows 8→500)
- lon: −25 → 72 (W→E cols 8→500)

A "cell" is one grid unit `{r, c}`. Nodes may share a cell *only* if they are linked (the cell contains the named node and its exits lead to adjacent cells). Junctions are placed at intermediate cells only when no named node belongs there.

### Cell occupancy map

Before A* runs, build a `cellMap: Map<"r,c", nodeCode>` from all placed named nodes. A* uses this map as "occupied" during pathfinding — it routes *through* occupied cells when the occupant is a named waypoint, and *around* them when they are unrelated. When A* traverses an occupied named cell, it wires an edge to that node rather than creating a junction there.

---

## 7. A* Path Building (Replaces L-Shaped Corridors)

### The algorithm for connecting node A to node B

```
Given: A at (ra, ca), B at (rb, cb). Both have r,c in NODE_COORDS.

1. A* on the grid from (ra,ca) to (rb,cb):
   - Manhattan distance heuristic: |r2-r1| + |c2-c1|
   - Cost to enter a cell:
     * 0   if cell is empty (no node there, no coord)
     * 0   if cell holds a named node that is in the same quest chain as A→B
     * 1   if cell holds a named node (unrelated — prefer to avoid)
     * 1   for all other empty cells (standard step cost)

2. Walk the path cells [p0=(ra,ca), p1, p2, ..., pN=(rb,cb)]

3. For each intermediate cell pi:
   a. If cellMap[pi] is already a named node: wire the chain through it
      (create edges ..prev→namedNode→next..) — this is a promotion
   b. If cellMap[pi] is a quest node that needs placement (has no r,c yet):
      assign r,c = pi and wire it in (quest chain promotion — see §7 step 4)
   c. Otherwise: create a junction at pi, wire it into the chain

4. Quest chain placement preference:
   Before step 3, collect questCellCandidates: nodes that:
   - Have no r,c yet (unplaced)
   - Belong to the same quest arc as A or B
   - Would logically appear between A and B in quest sequence
   For each path cell pi, check if any questCellCandidate has the nearest
   A* distance to pi. If distance ≤ 3 cells, snap the candidate to pi
   (assign r,c=pi, add to cellMap, promote it as a named waypoint on this path).

5. Wire the final path segment: first cell → last cell, each step as a directed edge
6. Run coord-scan (P1.5) to pick up any adjacencies created by snapping
```

### Find-nearest for unplaced quest nodes

```
findNearestOnPath(questNode, pathCells):
  for each pi in pathCells:
    dist = manhattan(pi, questNode.bestEstimate || {r:hub.r, c:hub.c})
    if dist < threshold:
      return pi
  return null
```

`bestEstimate` for an unplaced quest node is derived from:
- Its lat/lon if it has one (geocoded but not yet placed)
- Its quest predecessor's r,c + one step in the direction of its successor
- The hub coordinates as a last resort

---

## 8. Quest Chain Re-Stitching

After P_NUKE, all quest activateNode/waypointNode references still point to valid named node codes (confirmed: zero J#### refs). Quest chains do not break from junction deletion.

What *may* happen is that two quest nodes in sequence (A → B) end up spatially distant because the junctions between them are gone and no A* path has been built yet. The game's BFS pathfinding for storyMove will try all exits recursively, so even a long A→B link works — but the player experience is jarring (they cross a continent in one step).

**Fix:** After P_NUKE + A*, verify quest chain spatial coherence:
1. For each quest with `waypointNode` = W and the *next* quest in the chain with `activateNode` = A:
   - If `BFS distance(W, A) > maxQuestHop` (suggest: 20 cells), flag as a "long hop"
   - Add (W, A) to the priority highways list for A* path building
2. Process long-hop pairs in A* phase *first* (before city-mesh MST), so quest paths get filled in before geographic infill.

This ensures quest chain traversal is the primary driver of junction placement. Geographic infill (city MST) fills the remaining grid after quest paths are laid.

---

## 9. Promotion: Junction → Named Location

A junction can be promoted to a named location when:
- The junction sits at a cell where a quest node should logically land
- The junction is on an A* path between two quest-chain neighbors
- The findNearest check (§7) finds this cell is the best available for the unplaced node

**Promotion procedure:**
1. Take the unplaced named node code `C` (no r,c yet, has quest refs)
2. Assign `C` the junction's r,c coordinates
3. Merge the junction's directional links into `C`'s NODE_MAP entry
4. Delete the junction entry
5. Add `C` to NODE_COORDS
6. Run fix-bidirectional for the links transferred to `C`

**Rules:**
- `C` gets the terrain key from its existing NODE_MAP entry, not `"junction"`
- `C` keeps its quest refs, label, text, NPC, battle, loot fields
- The `junction:true` flag is NOT set on `C`

---

## 10. Revised Phase Order

```
P_NUKE    Nuclear junction cull: delete all J####, stitch straight chains,
           record L-shaped deferred pairs for A*
P0        Geo-seed: lock GEO2 cities to Mercator lat/lon → r,c (unchanged)
P_PLACE   Quest chain placement: assign r,c to unplaced quest nodes using
           quest predecessor proximity + findNearest
P1        Rip-and-connect: place remaining stray named nodes near mesh
           (quest-chain-order preference over spatial-only)
P_ASTAR   A* path build: connect all deferred pairs (from P_NUKE) + priority
           highways + city-mesh MST. Promote quest nodes to path cells.
           Uses cellMap occupancy to avoid overwriting placed nodes.
P1.5      Coord-scan: derive additional edges from r,c adjacency
P4        Fix-all-broken: final polish (should be minimal after A*)
P5        Fix-bidirectional (unchanged)
P6        Derelict cleanup (unchanged, catches any leftover degree≤1 junctions)
P7        Wither (unchanged, runs fast on small junction set)
P8        Final reachability check (unchanged)
```

---

## 11. Implementation Checklist

These are ordered steps for the coding pass. Each step is independently testable.

- [ ] **Step 0 — Snapshot**: Take a `.html` backup before any changes (already automated via `archive-snapshots.sh`).

- [ ] **Step 1 — Audit endpoint**: Add `GET /api/graph/junction-audit` returning `{ total, junctionCount, namedCount, junctionsWithQuestRefs, coordsCoverage }`. Run it now to confirm the 0-quest-ref finding.

- [ ] **Step 2 — P_NUKE implementation**: Add `POST /api/graph/nuke-junctions` (streaming, no timeout). Dry-run mode by default (`execute=false`). Stitch straight chains, record deferred pairs, delete J####, save snapshot.

- [ ] **Step 3 — Cell occupancy map**: Extract `buildCellMap(nm, coords)` as a shared utility in `wbapi-core.js`. Returns `Map<"r,c", code>` for all placed nodes.

- [ ] **Step 4 — A* on grid**: Implement `astarGrid(from, to, cellMap, nm)` in `wbapi-core.js`. Returns `Array<{r,c, nodeCode|null}>` path. `nodeCode` is set when the cell is already occupied by a named node.

- [ ] **Step 5 — Quest placement pass**: Add `P_PLACE` logic: iterate quests in chain order, assign r,c to unplaced quest nodes using predecessor proximity. Uses `buildCellMap` + `astarGrid` to find cell.

- [ ] **Step 6 — A* highway builder**: Replace `buildCorridor()` (L-shaped) with `buildAstarPath(from, to, cellMap)`. For each intermediate cell: if occupied by named node, wire through it; if empty, create junction. Add cell to `cellMap` after placement.

- [ ] **Step 7 — Integrate into reweave-all**: Wire the new phases into the existing `POST /api/graph/reweave-all` handler in the order from §10. Keep `--no-nuke` flag to skip P_NUKE for incremental runs on a clean map.

- [ ] **Step 8 — Quest coherence check**: After A*, scan for "long hop" quest pairs (BFS distance > 20 cells) and re-add them to the A* queue.

- [ ] **Step 9 — Wither remains unchanged**: Verify wither works correctly on a small junction set (expected: < 500 remaining after A* + derelict cleanup).

- [ ] **Step 10 — CLI flag**: Add `./api.sh reweave --execute --nuke` to trigger the new full pipeline. Without `--nuke`, existing behavior is preserved.

---

## 12. Expected Outcome

| Metric | Before | After |
|--------|--------|-------|
| Total nodes | 20,936 | ~600–800 |
| Junction nodes | 20,493 | ~150–300 |
| Named nodes | 443 | 443 (unchanged) |
| File size (HTML) | large | ~30–40% smaller |
| Reweave runtime | slow (Tarjan on 20K) | fast (< 5s) |
| Quest chain validity | 100% | 100% (no J#### refs to break) |
| A* traversal (game) | slow BFS through 20K nodes | fast BFS through ~800 nodes |

The junction count after A* will be non-zero because:
- Some named nodes are far apart on the grid and require intermediate path cells
- The step-4 size grid (1 cell = ~5km at Europe scale) means a Paris→Rome path needs ~30 intermediate cells

But these will be *intentional* junctions, each on a named quest or geographic path, not cascaded scaffolding.

---

## 13. Flags Reference for New reweave-all

```bash
# Full new pipeline (nuclear + A* + wither)
./api.sh reweave --execute --nuke

# Skip nuclear cull (map already clean, just run A* + normal phases)
./api.sh reweave --execute --no-nuke

# Dry-run: report what would be nuked without deleting
./api.sh reweave --no-nuke   # (default: dry-run)

# Nuclear cull only (audit first run)
./api.sh reweave --execute --nuke --no-highways --no-city-mesh --no-wither

# A* highways only (after manual nuke confirmation)
./api.sh reweave --execute --no-nuke --no-wither
```

---

## See Also

- `lab-report-mega-reweave.md` — original MegaReWeave design (phases P0–P8)
- `lab-report-node-network-reconnection.md` — history of 89%→100% repair
- `docs-node-network.md` — node network architecture
- `wbapi-server.js` §`reweave-all` — current implementation
- `API-README.md §Validation` — individual repair commands
