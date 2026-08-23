<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->

# API Redesign & Worldbuilder Map Repair — Session Summary

**Roll2Hit World Builder — Engineering Report**
*2026-06-09*

---

## Overview

This report documents the complete redesign of the Roll2Hit world-building API,
the addition of map visualization and repair utilities, and the alignment of
Worldbuilder.html with the new api.sh-first workflow.

---

## 1. api.sh — The Single Entry Point

**Directive (enforced everywhere):**
> Use `./api.sh` for all operations. Never use raw curl.  
> If a feature is missing, request an API refactor — do not work around it.  
> Verify, validate, and maintain the node network after every change.

The help system is now organized as a man-page with a 24-section table of contents:

```
§1  THE COMMON CYCLE — search → inspect → edit
§2  COMMAND INDEX
§3  GLOBAL OPTIONS
§4  ping     §5  count    §6  get      §7  list
§8  location  §9  chain   §10 put     §11  post
§12 del      §13 audit    §14 export  §15  import
§16 speak    §17 nonce    §18 ai
§19 MAP VISUALIZATION       (worldmap)
§20 COORDINATE MANAGEMENT   (geo-seed, move, find-open-location)
§21 NETWORK WIRING          (smart-connect, highway, junction, fill-gap, connect)
§22 NETWORK HEALTH & REPAIR (broken, reachability, fix-all-broken, rip-and-connect)
§23 COMMON RECIPES
§24 SERVER LIFECYCLE
```

---

## 2. New Commands Added

### Map Visualization
| Command | Purpose |
|---------|---------|
| `worldmap` | World map (76 cities, lat/lon oriented) |
| `worldmap --regions` | 6×6 region grid overview (A1–F6) |
| `worldmap --region B2` | Zoom into region |
| `worldmap --city LHR` | City-level: connections, terrain, gap/bendy status |
| `worldmap --search "..."` | Search nodes by label/terrain/battle |
| `worldmap --monster skeleton` | Monster-hunt map with ★ markers |
| `worldmap --route LHR --to CON` | BFS navigation with turn-by-turn directions |

### Coordinate Management
| Command | Purpose |
|---------|---------|
| `geo-seed [--execute]` | Anchor 76 cities to real lat/lon positions |
| `move <code> <r> <c> [--swap]` | Relocate node coordinates |
| `find-open-location <city>` | Find open slots in city mesh for new content |

### Network Wiring (in order of preference)
| Command | Purpose |
|---------|---------|
| `smart-connect A B [--execute]` | Mesh-aware: finds open slots, respects deg rules |
| `highway A B [--execute]` | Full L-shaped junction highway |
| `junction <from> <dir> [--execute]` | Single junction with signpost text |
| `fill-gap <from> <dir> <to> [--execute]` | Junction chain for gap > 4 |
| `connect A <dir> B` | Direct wire (warns on deg=3/4) |

### Network Health & Repair
| Command | Purpose |
|---------|---------|
| `broken` | List all broken edges (diagonal or gap > 4) |
| `reachability` | % reachable from hub node |
| `fix-diagonal <code> <dir> [--execute]` | Fix one broken edge |
| `fix-all-broken [--execute]` | Batch-fix all broken edges |
| `rip-and-connect [--execute]` | Auto-relocate stray nodes near quest cities |

---

## 3. WBAPI Server Changes

### Auto-Junction at Degree-3 (PUT handler)
When `PUT /api/node/{code}` sets a directional field (N/E/S/W) on a node
that already has 3 connections:

**Before:** The 4th slot is filled. Node becomes full (deg=4). No capacity left.

**After:** A junction node is automatically created between source and target:
```
source(deg=3) → J{next}(deg=2) → target
```
Source stays at deg=3 (yellow). Junction gets the connection. Capacity preserved.

Override with `autoJunction: false` in the PUT body.

### New Graph Endpoints
- `GET /api/graph/find-open-location/{code}?radius=8` — BFS open slot finder
- `POST /api/graph/smart-connect` — mesh-aware insertion plan (A-mesh → B-mesh)
- `POST /api/graph/spawn-junction` — junction with signpost text + terrain-match
- `POST /api/graph/move` — relocate with collision check / swap
- `POST /api/graph/rip-and-connect` — stray node batch relocation
- `GET /api/layout/worldmap` — geographic reference for 76 cities
- `POST /api/layout/geo-seed` — apply lat/lon coordinates

### TRACE Logging
Ultra-verbose algorithm decision log. Enable with:
```bash
WBAPI_TRACE=1 node wbapi-server.js
```
Traces: PUT field processing, auto-junction trigger + create, fill-gap steps,
rip-and-connect scoring + placement decisions, smart-connect candidate selection,
node creation (code/terrain/coords/connections). Always written to log file.

---

## 4. Connection Rules (Design Constraints)

1. **Max 4 connections** per node.
2. **Degree-3 rule**: inserting into a deg=3 node auto-creates a junction first.
   City interiors may legitimately reach deg=4. Road junctions should stay ≤ deg=3.
3. **A→B = A-mesh → B-mesh**: `smart-connect` finds the nearest open slot in each
   city's reachable mesh, not the city node itself.
4. **Dead ends** (deg=1) should be extended when surrounding cells allow.
5. **Traversal rule** (hard game constraint): axis-aligned, gap ≤ 4 coordinate units.

---

## 5. Worldbuilder.html Changes

### 🔲 Grid Tab (complete rewrite)

**Canvas:**
- Nodes rendered at actual NODE_COORDS positions (not force-directed)
- Degree color coding: green (open), yellow (one slot left), red (full)
- Edge colors: blue solid (good), red dashed (broken diagonal/gap)
- Orange halo: unreachable from hub (stray nodes)
- Direction arrows on selected node showing free/used slots

**Drag-to-Move:**
- Mousedown on node → drag → mouseup calls `POST /api/graph/move`
- Shift = row-lock (force E/W axis alignment)
- Alt = col-lock (force N/S axis alignment)
- Snap to integer grid; confirms swap if destination is occupied
- Canvas reloads fresh NODE_COORDS from server after every move

**Quick filter bar:**
All | Broken Edges | Stray | Deg-4 Full | Dead Ends | Open

**Quick action buttons:**
Refresh | Fit | Fix Broken | Rip+Connect | Geo-Seed

**Node Detail Panel:**
- Per-connection health indicator (✓ good, ✗ broken)
- [Add N] [Add E] [Add S] [Add W] → inline create form
- Junction toggle + auto-junction warning at deg=3
- [View Map] [Edit] [Find Open Slots] quick links

**Add-direction form:**
- Opens when clicking direction button on a selected node
- Pre-fills terrain, act, coordinates from parent node
- Shows "junction auto-created first" warning when parent is at deg=3
- Calls `POST /api/node` + `PUT /api/node/{parent}` on submit

**Not-on-Grid sidebar:**
- Lists all nodes without NODE_COORDS
- Searchable; click to jump to Map tab
- [Place All] → runs rip-and-connect

### ⚙ API Tab — Server Help Section
New section at bottom of API tab:
- Topic selector (24 topics: overview, nonce, read, write, quest, node, etc.)
- [Load] fetches `/api/help/{topic}?format=text` from server
- [Load All] fetches all topics concatenated, separated by headers
- ANSI codes stripped for clean browser display

### Node Editor Alignment
The Map tab node editor now shows:
- **Degree badge**: "X/4 connections — junction-first rule applies" when deg ≥ 3
- **Junction checkbox**: marks node as junction type
- **N/S/E/W inputs**: red border + ⚠ indicator for broken edges; ✓ for good edges
- **Text field**: prominently displayed for junction signpost content

---

## 6. World Mesh Construction Procedure

The correct order for building or repairing the coordinate mesh:

```bash
# Phase 0: Geographic reset
./api.sh geo-seed --execute
node layout-solve.js --apply

# Phase 1: Highway between all major city clusters
./api.sh highway LHR CON --execute      # main → Byzantine
./api.sh highway KOL REG --execute      # Germany → Italy
./api.sh highway REG VEN --execute      # Rhine → Adriatic
./api.sh highway VEN CON --execute      # Italy → Byzantine
./api.sh highway CON ANT --execute      # Byzantine → Levant
./api.sh highway ANT JAR --execute      # Syria → Jerusalem
./api.sh highway BGD SAM --execute      # Iraq → Silk Road

# Phase 2: Smart-connect remaining isolated cities
./api.sh smart-connect GLA NID --execute
./api.sh smart-connect MAR CVP --execute
./api.sh smart-connect LHR HHL --execute

# Phase 3: Relocate stray nodes near quest cities
./api.sh rip-and-connect --execute --limit 100

# Phase 4: Fix remaining broken edges
./api.sh fix-all-broken --execute

# Phase 5: Validate
./api.sh broken        # target: 0
./api.sh reachability  # target: 100%
./api.sh audit --map
```

---

## 7. Current State (2026-06-09)

| Metric | Value |
|--------|-------|
| Total nodes | 597 |
| Reachable from hub | 510 (85%) |
| Unreachable (stray) | 87 |
| Broken edges | 213 |
| Major GEO cities connected | 29/29 |
| Lab reports written | 6 |
| New api.sh commands | 14 |
| New WBAPI endpoints | 8 |

---

## 8. Files Created / Modified This Session

```
New files:
  layout-spring.js              Spring simulation layout tool
  layout-solve.js               Constraint propagation solver + elbow insertion
  worldmap.js                   Terminal world map (3 zoom levels + geo-seed)
  maps/lab-report-*             6 lab reports (algorithms, UI, procedures, IEEE)
  maps/plan-world-connectivity.md  5-phase connectivity plan

Modified files:
  src/api/wb.js                     14 new commands, ToC help, man-page reorganization
  wbapi-server.js               8 new endpoints, auto-junction, TRACE logging
  worldbuilder.html             Grid tab rewrite, node editor alignment, API How-To
  API-README.md                 Complete rewrite (api.sh only, no curl)
  wbapi-help.md                 Compact quick-reference
```
