<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson <paul@roll2hit.com> — Roll2Hit.com -->

# World Reset & Mesh Insertion Cycle — Lab Report

**Roll2Hit World Builder — Engineering Report**
*2026-06-09*

---

## Overview

This report describes the full **world reset → mesh unscramble → insertion cycle** procedure.
It covers the coordinate system, grid resolution, the multi-pass algorithm for reconnecting
the world, and the new API toolchain that automates the process.

---

## 1. The Coordinate System

### Grid

The game uses a flat integer grid: `r` (row, increases southward) × `c` (column, increases eastward).
Range: 0–512 × 0–512. All coordinates are stored in `NODE_COORDS` in `roll2hit-v3.html`.

### Traversal Rule (`_buildNodeExits`)

```javascript
// Probes exactly d = 1..4 in each cardinal direction
for (let d = 1; d <= 4; d++) {
  const key = (r + dr * d) + ',' + (c + dc * d);
  if (coordToCode[key]) return coordToCode[key];
}
```

**Hard constraints per edge:**
1. **Axis-aligned**: N/S edge → same column; E/W edge → same row
2. **Distance ≤ 4**: axis distance must be 1, 2, 3, or 4

Violation = **silent disconnection** at runtime. The edge exists in NODE_MAP but the game ignores it.

### Grid Resolution

| Scale | Description | Use case |
|-------|-------------|----------|
| 1 unit | Minimal step (city interior) | Adjacent rooms, shops within one city block |
| 2 units | Junction rest length | Road junctions between city districts |
| 4 units | Maximum traversal | Long highway segments between junctions |
| 8–32 units | Old/broken scale | Pre-solver coordinate spacing (causes disconnection) |

**Resolution question — do we need another zoom level?**

The current 512×512 grid at step=1–4 gives:
- ~512 rows of usable space
- ~512 cols of usable space
- At step=2 average: ~256 × 256 = ~65,000 addressable cells
- With 600 nodes at step=2: uses ~2.3% of the grid

A zoom level is NOT needed for capacity. However, the `worldmap.js` visualization
currently has three levels:

```
Level 0: World map  96×30 terminal  covers -8°–68°N, -25°–72°E  (lat/lon)
Level 1: Region     88×28 terminal  1/36th of world (one 6×6 cell)
Level 2: City       72×22 terminal  ±4 game units around a node
```

A **Level 1.5 — District map** could be useful: showing 20–50 game units around
a city cluster (showing junctions, sub-nodes, roads) at medium resolution.
This would fill the visual gap between the geographic region view (degrees) and
the single-node city view (game units). Add with: `./api.sh worldmap --district LHR`.

---

## 2. Geographic Seeding & Why It Comes First

Before any mesh work, major cities are anchored to real lat/lon:

```bash
./api.sh geo-seed --execute
```

This converts real-world coordinates:
```
r = gridMin + (maxLat − lat) / (maxLat − minLat) × (gridMax − gridMin)
c = gridMin + (lon − minLon) / (maxLon − minLon) × (gridMax − gridMin)
```

With bounds lat ∈ [−8°, 68°], lon ∈ [−25°, 72°], grid ∈ [8, 500]:
- Iceland: r ≈ 21, c ≈ 21  (top-left)
- London:  r ≈ 55, c ≈ 72  (mid-left)
- Constantinople: r ≈ 104, c ≈ 273  (center)
- Samarkand: r ≈ 102, c ≈ 444  (far right)

**Why first?** Once cities are at geographic positions, the constraint propagation
solver places ALL other nodes (junctions, sub-districts) relative to the anchored
cities. Without geographic seeding, the solver places everything in a compact
topology-driven cluster with no geographic meaning.

---

## 3. The Full Reset & Reconnection Procedure

### Pass 0 — Geographic Reset

```bash
./api.sh geo-seed --execute          # anchor 76 cities to lat/lon
node layout-solve.js --apply         # propagate all nodes from anchors
./api.sh reachability                # baseline: current % connected
./api.sh broken                      # baseline: count broken edges
```

### Pass 1 — Build the Highway (Major Cities)

Connect all major cities to the main mesh using `./api.sh highway`.
The highway rule: go horizontal first, elbow at the turn, fill each
segment with junctions spaced ≤ 4 units apart.

```
City A ──E──▶ J1 ──E──▶ J2 ──E──▶ Elbow ──N──▶ J3 ──N──▶ City B
              (+4)      (+4)      (A.row,B.col)  (-4)
```

**Priority order** (geographic logic):
```bash
# Norse / North Sea
./api.sh highway HEO NID --execute       # Denmark → Norway
./api.sh highway LHR HEO --execute       # Sweden → Denmark

# British Isles chain
./api.sh highway GLA EDI --execute       # Glasgow → Edinburgh
./api.sh highway GLA YRK --execute       # Scotland → England

# Rhine Corridor (Main → Italy)
./api.sh highway KOL REG --execute       # Cologne → Regensburg
./api.sh highway REG VEN --execute       # Regensburg → Venice

# France → Italy
./api.sh highway MAR SAL --execute       # Marseille → Saluzzo
./api.sh highway SAL ROM --execute       # Saluzzo → Rome

# Balkan / Byzantine chain
./api.sh highway VEN THA --execute       # Venice → Thessaloniki
./api.sh highway THA CON --execute       # Thessaloniki → Constantinople

# Anatolia → Middle East
./api.sh highway CON SIN --execute       # Constantinople → Sinope
./api.sh highway SIN TRB --execute       # Sinope → Trebizond
./api.sh highway TRB ANT --execute       # Trebizond → Antioch
./api.sh highway ANT JAR --execute       # Antioch → Jerusalem

# Silk Road
./api.sh highway CON TBZ --execute       # Constantinople → Tabriz
./api.sh highway TBZ BGD --execute       # Tabriz → Baghdad
./api.sh highway BGD NIS --execute       # Baghdad → Nishapur
./api.sh highway NIS SAM --execute       # Nishapur → Samarkand

# Iberian
./api.sh highway MAR CVP --execute       # Marseille → Lisbon (Atlantic route)
```

After each batch:
```bash
./api.sh geo-seed --execute          # re-anchor (highways may drift cities)
node layout-solve.js --apply         # recompute all coordinates
./api.sh reachability                # check progress
```

### Pass 2 — Smart-Connect for City-to-Mesh Wiring

Use `smart-connect` for any remaining cities that are still isolated.
This finds the best insertion point in each city's mesh:

```bash
./api.sh smart-connect LHR CON --execute   # finds open slot in each mesh
./api.sh smart-connect KOL SAM --execute   # handles degree-3 junction rule
```

**Connection rules enforced by smart-connect:**
- Degree ≤ 2: connect directly
- Degree = 3: spawn junction first (preserve last slot)
- Degree = 4: walk deeper into mesh

### Pass 3 — Rip-and-Connect (Stray Nodes)

Once the highway is complete, auto-relocate all unreachable nodes near their
most quest-associated city:

```bash
./api.sh rip-and-connect --limit 50     # dry-run: see what would move
./api.sh rip-and-connect --execute --limit 50  # apply
```

**Algorithm:**
1. BFS from hub to find all unreachable (stray) nodes
2. For each stray, score every reachable city:
   - Quest cross-references (activateNode, waypointNode) — highest weight
   - Geographic proximity (smaller coordinate distance = higher score)
   - Open slot availability
3. Walk the best city's mesh to find the nearest open slot (degree ≤ 3)
4. Move the stray's coordinates adjacent to that slot
5. Wire it in (respecting the degree-3 junction rule)

**Placement semantics** (by node type):
| Node type | Target location |
|-----------|----------------|
| City sub-district (market, docks) | 1–2 hops from parent city |
| Inn, shop, tavern | 1 hop from city, inside city cluster |
| Wilderness (forest, ruins) | 2–4 hops, on a road junction |
| Dungeon | 1 hop from nearest city or road junction |
| Remote (mountain pass, desert) | Junction midpoint between two cities |
| Quest-start node | Adjacent to city where quest activates |

Run multiple passes until convergence:
```bash
./api.sh reachability                   # check after each pass
./api.sh rip-and-connect --execute --limit 100   # repeat
```

### Pass 4 — Fix Broken Edges

```bash
./api.sh broken                         # remaining diagonal/gap issues
./api.sh fix-all-broken --execute       # auto-fix (move or elbow)
```

### Pass 5 — Final Validation

```bash
./api.sh reachability                   # target: 100%
./api.sh broken                         # target: 0
./api.sh audit --map                    # full integrity scan
./api.sh worldmap --route LHR --to SAM  # test long-range navigation
./api.sh worldmap --route LON --to JAR  # test another route
```

---

## 4. The Full API Toolchain (Quick Reference)

### Viewing the Map

```bash
./api.sh worldmap                       # world overview (lat/lon oriented)
./api.sh worldmap --regions             # 6×6 region grid (A1–F6)
./api.sh worldmap --region B2           # zoom: Britain + N France
./api.sh worldmap --city LHR            # zoom: Birka + its connections
./api.sh worldmap --search "crypt"      # search by label/terrain/battle
./api.sh worldmap --monster skeleton    # monster-hunt map
./api.sh worldmap --route LHR --to CON # navigation: BFS A→B
```

### Coordinate Management

```bash
./api.sh geo-seed --execute             # anchor 76 cities to lat/lon
node layout-solve.js --apply            # propagate from geo anchors
./api.sh move LHR 12 18                # move one node's coordinates
./api.sh move LHR 12 18 --swap         # swap with occupier
./api.sh find-open-location LHR        # find open slots near Birka
```

### Network Wiring

```bash
./api.sh smart-connect LHR CON --execute    # mesh-aware: finds best slots
./api.sh highway LHR SAM --execute          # full junction highway
./api.sh connect WOR E SAL                  # direct wire (warns on deg issues)
./api.sh junction LHR S --execute           # single junction
./api.sh fill-gap WOR E SAL --execute       # fill long gap
```

### Network Repair

```bash
./api.sh broken                             # list broken edges
./api.sh reachability                       # % reachable
./api.sh rip-and-connect --execute          # auto-relocate stray nodes
./api.sh fix-all-broken --execute           # batch fix broken edges
./api.sh fix-diagonal LHR S --execute       # fix one edge
```

### Inspection

```bash
./api.sh get node LHR                       # node detail
./api.sh location LHR                       # composite: node + quests + NPCs
./api.sh list node --no-coords              # nodes without coordinates
./api.sh list quest --node LHR             # quests at a city
./api.sh audit --map                        # integrity scan
```

---

## 5. The Insertion Cycle — Adding New Content

When adding a new location (dungeon, tavern, road junction) to the world:

```bash
# 1. Find the nearest city for the new content
./api.sh find-open-location <city> --radius 8

# 2. Inspect the best candidate slot
./api.sh worldmap --city <slot-node>

# 3a. If slot has deg ≤ 2: connect directly
./api.sh connect <slot-node> <dir> <new-node>

# 3b. If slot has deg = 3: spawn junction first
./api.sh junction <slot-node> <dir> --execute
./api.sh connect <new-junction> <dir> <new-node>

# 4. Verify no new broken edges
./api.sh broken

# 5. Update the map view
./api.sh worldmap --city <new-node>
```

---

## 6. Current State (2026-06-09)

| Metric | Value |
|--------|-------|
| Total nodes | 597 |
| Reachable from hub | 510 (85%) |
| Unreachable (stray) | 87 |
| Broken edges | 213 |
| Grid span | ~107r × ~497c |
| Major GEO cities connected | 29/29 |

**Remaining work:**
1. Run `rip-and-connect --execute --limit 87` to relocate all stray nodes
2. Run `fix-all-broken --execute` for remaining 213 broken edges
3. Re-run `geo-seed + layout-solve` after rip-and-connect
4. Target: 597/597 reachable, 0 broken edges

---

## 7. Improvements Under Consideration

### District Map (Level 1.5 Zoom)
A new view between region (degrees) and city (game units):
```bash
./api.sh worldmap --district LHR    # 30×30 game-unit area around LHR
```
Would show: all nodes within ~15 hops of the city, road structure, junction
density, dead ends. Useful for understanding the mesh around a city before
adding new content.

### Auto-Highway from Quest Order
Walk through quests in act order; for each quest's `activateNode`, ensure
that city is connected to all adjacent quest cities in the same arc. This
ties the highway-building pass to the narrative structure.

### One-Shot Server Endpoint
`POST /api/world/reset-and-repair` — runs all 5 passes in sequence:
geo-seed → layout-solve → highway → smart-connect → rip-and-connect → fix-broken.
Returns a progress report at each phase. Requires `--force` flag to prevent
accidental execution.
