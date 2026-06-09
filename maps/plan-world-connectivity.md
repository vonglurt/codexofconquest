# Plan: World Connectivity Fix — Making Every City Reachable

**Date:** 2026-06-09  
**Status:** PLANNED — ready to execute

---

## Problem Statement

The game's `_buildNodeExits()` probes exactly 1–4 cells in each cardinal direction. Two constraints must hold for every N/E/S/W edge:

```
1. AXIS ALIGNMENT:  N/S edges → same column (Δcol = 0)
                    E/W edges → same row    (Δrow = 0)
2. DISTANCE:        axis-distance ∈ [1, 4]
```

**Current violations (2026-06-09):**
- 549 nodes total, only **240 reachable** from LHR (44% disconnected)
- 53 of 76 major geo-referenced cities unreachable
- 196 broken edges — all diagonal (axis-offset > 0)
- 164 disconnected components

**Root cause:** The world was imported in separate story-arc batches. Each arc (Norse, Medieval England, Italy, Byzantine Empire, Middle East, Central Asia) built its own sub-cluster with no inter-cluster links. Additionally, the coordinate solver placed nodes without geographic orientation, creating many off-axis connections.

---

## Design Constraints

### Traversal Rule (hard, game-engine imposed)
```
_buildNodeExits probes d = 1..4 cells per direction.
→ Every edge must be axis-aligned AND within 4 coordinate units.
→ Gaps > 4 require intermediate junction nodes.
→ Off-axis connections require elbow junctions.
```

### Geographic Orientation (design goal)
- Cities anchored to real lat/lon via `./api.sh geo-seed`
- Row increases southward (north = small row)
- Column increases eastward (west = small column)
- Major trade routes follow geographic logic (Rhine corridor, Silk Road, etc.)

### Junction Signpost Requirement
Every junction node must have:
- `label`: "City A ↔ City B Junction" format
- `text`: "Signpost says: The [road name]. [Terrain description]. [Monster warning]."
- `terrain`: inherited from connecting nodes

### api.sh-Only Rule
All changes go through `./api.sh` commands. No direct HTML edits. No curl except where api.sh wraps it.

---

## Cluster Map (current isolated groups)

```
MAIN CLUSTER (240 nodes, reachable from LHR):
  British Isles: LHR, BMA, TLL, KRN, WRO, LDN, LON, BRK, MSE, ACT, YRK,
                 GWN, SHF, HEO, SIG, HHL, EDI*, GLA*
  France:        BDX, FRK, MAR, MTP, AVG, SRL
  Germany:       KOL, WOR, RHN, TVO, GNP
  Norse/Wales:   MGL, HVY, HFD, ACT, GWN, YRK, SHF
  (* GLA, EDI show as isolated — need checking)

ITALIAN CLUSTER (isolated):
  REG, BDA, ETZ, KRK, VEN, BOL, FRR, PRA, PIS, PSA, AOI, ROM, SAU, BAR, PAR,
  SAL, SIB, KLZ, BIS, VAR — connected internally via J-nodes but not to main

BYZANTINE CLUSTER (isolated):
  CON, BTR, VRG, BUR, THA, LMO, PHC, ITH, ORC, MYS, MSN, SIN, TRB — internal
  connections exist but no bridge to Italian or main cluster

MIDDLE EAST CLUSTER (isolated):
  ANT, ALP, ALB, JAR, OLN, BGD — some internal links but cluster is isolated

CENTRAL ASIAN CLUSTER (isolated):
  SAM, MRV, NIS, TBZ, MRG, GNJ, TBZ — partially connected internally

SINGLETON ORPHANS (no connections at all):
  NID, GLA*, EDI*, CVP, MLN, and ~89 others — need wiring first
```

---

## The Fix Strategy (5 Phases)

### Phase 0: Geo-Seed All Major Cities
Anchor all 76 GEO cities to real lat/lon-derived coordinates. This establishes the geographic foundation before doing any edge work.

```bash
./api.sh geo-seed --execute
```

Then propagate all connected nodes to new positions:
```bash
node layout-solve.js --apply
```

**Expected:** City positions become geographically coherent. Many diagonal edges become fixable by simple coordinate nudge.

---

### Phase 1: Fix Diagonal Edges (196 broken)
Every broken edge is diagonal (axis-offset > 0). Fix strategy per edge:

**Strategy A — Move the lighter node** (if it has only 1–2 connections):
```bash
./api.sh move <CODE> <new_r> <new_c>
```
Use `./api.sh worldmap --city <CODE>` to inspect before moving.

**Strategy B — Insert elbow junction** (if both nodes are heavily connected):
```bash
./api.sh junction <from> <dir> --execute
```
Elbow goes at axis intersection: (A.row, B.col) for E/W bendy, (B.row, A.col) for N/S bendy.

**Strategy C — fill-gap** (if axis-aligned but gap > 4):
```bash
curl -sX POST http://localhost:1367/api/graph/fill-gap \
  -d '{"from":"A","dir":"E","to":"B","maxGap":4,"step":4,"dryRun":false}'
```

**Triage order:** Fix the 135 `diagonal_and_gap` edges first (worst violations), then the 61 `diagonal` edges.

---

### Phase 2: Wire the Isolated Clusters

The clusters must be connected along geographically sensible routes. Each inter-cluster link needs a chain of junction nodes spaced 1–4 coordinate units apart.

**Required inter-cluster connections (geographic trade routes):**

```
A. Rhine Corridor (Main → Italy):
   KOL (Cologne) ─S→ ??? ─S→ REG (Regensburg) ─S→ ??? ─S→ VEN (Venice)
   Geographic: ~800km, ~60 coordinate units → needs ~15 junction nodes

B. France → Italy (Alpine route):
   MAR (Marseille) ─E→ ??? ─E→ SAL (Saluzzo) ─E→ ??? ─E→ ROM (Rome)
   Geographic: ~600km, ~50 units → needs ~12 junction nodes

C. Italy → Balkans (Adriatic crossing):
   AOI (Ancona) or BAR (Bari) ─E→ ??? ─E→ VAR (Varna) or THA (Thessaloniki)
   Geographic: ~600km, ~50 units → needs ~12 junction nodes

D. Balkans → Byzantine (already partially connected):
   VAR ─E→ CON (Constantinople) — check if coordinates align

E. Byzantine → Middle East (Anatolian route):
   CON ─S→ ??? ─S→ BTR ─E→ ??? ─E→ SIN ─E→ TRB ─S→ ANT ─E→ ALP ─S→ JAR
   Most of these are already connected internally — need E/W chain to bridge gap

F. Middle East → Central Asia (Silk Road):
   BGD ─E→ ??? ─E→ NIS ─E→ MRV ─E→ SAM
   Most connected internally — need coord alignment

G. Singleton wiring:
   NID (Nidaros): wire to HEO (Lejre/Denmark) via N chain
   GLA/EDI: wire to YRK via N chain  
   CVP (Lisbon): wire to MAR or BDX via W chain
   MLN (Malindi): isolated (East Africa) — flag as intentionally separate
```

**Spawn-junction workflow for each route:**
```bash
# Example: extend KOL southward toward REG
./api.sh junction KOL S --execute     # creates J_new at KOL.S position
./api.sh junction J_new S --execute   # extend further south
# ... repeat until close enough to REG, then wire final node
./api.sh put node J_final S REG
./api.sh put node REG N J_final
```

---

### Phase 3: Fix Remaining Coordinate Misalignments

After all cluster wiring is done, re-run the broken-edge check:
```bash
curl -s 'http://localhost:1367/api/graph/broken' | python3 -c "..."
```

For any remaining diagonal edges, use the validate tool to get specific fix commands:
```bash
./api.sh worldmap --city <CODE>    # see connection status
curl -s 'http://localhost:1367/api/graph/validate/<CODE>'  # get move suggestions
```

Apply coordinate moves one at a time:
```bash
./api.sh move <CODE> <r> <c>       # move to axis-aligned position
./api.sh move <CODE> <r> <c> --swap  # swap if slot occupied
```

---

### Phase 4: Verify Full Connectivity

Run connectivity check — should be 0 unreachable:
```bash
curl -s 'http://localhost:1367/api/graph/reachability' | python3 -c "
import json,sys; d=json.load(sys.stdin); c=d['counts']
print(f'Reachable: {c[\"reachable\"]} / {c[\"total\"]}')
print(f'Unreachable: {c[\"unreachable\"]}')
"
```

Test specific routes:
```bash
./api.sh worldmap --route LHR --to CON    # Birka → Constantinople
./api.sh worldmap --route LHR --to JAR    # Birka → Jerusalem
./api.sh worldmap --route LHR --to SAM    # Birka → Samarkand
./api.sh worldmap --route LON --to ROM    # London → Rome
```

---

### Phase 5: Final Validation Pass

```bash
curl -s 'http://localhost:1367/api/graph/broken'         # should be 0
./api.sh audit --map                                       # full integrity scan
./api.sh worldmap --regions                               # visual confirmation
```

---

## New api.sh Features Needed

| Command | Purpose | Status |
|---------|---------|--------|
| `./api.sh geo-seed --execute` | Anchor cities to lat/lon | ✅ exists |
| `./api.sh move <CODE> <r> <c>` | Move coordinates | ✅ exists |
| `./api.sh junction <from> <dir> --execute` | Spawn junction | ✅ exists |
| `./api.sh worldmap --city <CODE>` | Inspect + navigate | ✅ exists |
| `./api.sh worldmap --route A --to B` | Test connectivity | ✅ exists |
| `./api.sh connect <A> <dir> <B>` | Wire two existing nodes | ❌ need to add |
| `./api.sh fill-gap <from> <dir> <to>` | Fill gap with junctions | ❌ need to add |
| `./api.sh fix-diagonal <CODE>` | Auto-fix one diagonal edge | ❌ need to add |
| `./api.sh fix-all-broken` | Batch fix all broken edges | ❌ need to add |

The three missing commands are critical for Phase 1 and 2 efficiency.

---

## Progress Tracker

| Phase | Task | Status | Notes |
|-------|------|--------|-------|
| 0 | Geo-seed all 76 cities | PENDING | `./api.sh geo-seed --execute` |
| 0 | layout-solve propagate | PENDING | `node layout-solve.js --apply` |
| 1 | Fix 135 diagonal+gap edges | PENDING | Need fill-gap wrapper |
| 1 | Fix 61 diagonal edges | PENDING | Need fix-diagonal wrapper |
| 2A | Rhine Corridor (KOL→VEN) | PENDING | ~15 junctions |
| 2B | France→Italy (MAR→ROM) | PENDING | ~12 junctions |
| 2C | Italy→Balkans (AOI→THA) | PENDING | ~12 junctions |
| 2D | Balkans→Byzantine (VAR→CON) | PENDING | Check coords |
| 2E | Byzantine→Middle East | PENDING | SIN→TRB→ANT chain |
| 2F | Silk Road (BGD→SAM) | PENDING | Check coords |
| 2G | Wire NID, GLA/EDI, CVP | PENDING | Simple N/S chains |
| 3 | Re-validate broken edges | PENDING | Target: 0 |
| 4 | Connectivity check | PENDING | Target: 549/549 |
| 5 | Final audit | PENDING | `./api.sh audit --map` |

---

## Expected Outcome

```
Before:  240/549 reachable  (44%)   196 broken edges   164 components
After:   549/549 reachable (100%)     0 broken edges     1 component

New nodes needed:
  ~50 elbow junctions (Phase 1 diagonal fixes)
  ~60 route junctions (Phase 2 cluster wiring)
  Total new: ~110 junction nodes
  Final node count: ~660
```

Every junction node will have terrain-matched type and a signpost description indicating the road it marks, its terrain environment, and nearby hunting opportunities.
