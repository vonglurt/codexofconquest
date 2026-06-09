# Lab Report: Map Layout Solver — Grid Flattening, Elbow Junctions, and Coordinate Resolution

> **Status:** Active development — `layout-spring.js` + `layout-solve.js` in root.
> **Scope:** Whole-world map shuffle for the 512×512 N/E/S/W node grid.

---

## 1. The Problem

The game's `_buildNodeExits()` function (roll2hit-v3.html:31954) probes exactly 1–4 coordinate cells in each cardinal direction to discover connections:

```javascript
function probe(r, c, dr, dc) {
  for (let d = 1; d <= 4; d++) {
    const key = (r + dr * d) + ',' + (c + dc * d);
    if (coordToCode[key]) return coordToCode[key];
  }
  return null;
}
nm.N = probe(pos.r, pos.c, -1, 0);
nm.S = probe(pos.r, pos.c, +1, 0);
```

**Two hard constraints per edge:**

```
N/S edge A→N→B:  |B.row − A.row| ∈ [1,4]   AND   B.col = A.col  (axis-aligned)
E/W edge A→E→B:  |B.col − A.col| ∈ [1,4]   AND   B.row = A.row  (axis-aligned)
```

If either fails, the connection is **silently dead** at runtime. Nodes more than 4 apart, or off-axis, are unreachable even if NODE_MAP says otherwise.

The original NODE_COORDS had nodes spaced 8–32 units apart with many diagonal connections — both violations.

---

## 2. Sample Data — Two Cities, One Junction (6-cell span)

```
Nodes:
  ALPHA  type=city     label="Alpha City"
  JXN    type=junction label="Crossroads"
  BETA   type=city     label="Beta City"

Connections:
  ALPHA.E = JXN    (ALPHA is west of junction)
  JXN.W   = ALPHA
  JXN.E   = BETA   (BETA is east of junction)
  BETA.W  = JXN
```

### 2a. Broken initial state (off-axis — bendy)

Hypothetical bad coordinates:

```
     col:  0    2    4
row   0:  [ALPHA]
row   1:        [JXN]      ← JXN is 1 row south of ALPHA — bendy!
row   0:              [BETA]
```

```
ALPHA (0,0) --E--> JXN (1,2)    BAD: row mismatch = 1
JXN   (1,2) --E--> BETA (0,4)   BAD: row mismatch = 1
```

Both connections are BENDY_EW (E/W edge, row not matching). `_buildNodeExits` won't
see ALPHA from JXN because the probe goes (1,3),(1,4),(1,5),(1,6) — not finding (0,0).

---

## 3. Algorithm Evolution

### Phase 1: Spring Simulation (layout-spring.js)

**Idea:** Model each edge as two springs:
- **Axial spring** — pulls axis-distance toward rest length (city=1, junction=2)
- **Lateral spring** — very strong, pulls nodes onto the same row (E/W) or column (N/S)

**Spring parameters:**

```
Type       Rest  k(axial)  align_k(lateral)   Character
────────   ────  ────────  ────────────────   ─────────────────
city         1    6.0         30.0            Dense cluster
junction     2    1.2          8.0            Spread out
```

**Simulation steps on the sample:**

```
ITER 0   (initial positions)
  ALPHA (0.0, 0.0)   JXN (1.0, 2.0)   BETA (0.0, 4.0)

  Forces on JXN from ALPHA.E edge (E/W → lateral on row):
    lateralF = align_k × (JXN.row - ALPHA.row) = 19 × (1.0 - 0.0) = +19  ← push rows together
    Forces: ALPHA.row += +19·dt·damping,  JXN.row -= 19·dt·damping

ITER 10  (converging)
  ALPHA (0.08, 0.0)   JXN (0.47, 2.0)   BETA (0.08, 4.0)

ITER 100  (near settled)
  ALPHA (0.02, 0.0)   JXN (0.18, 2.0)   BETA (0.02, 4.0)

ITER 800  (snapped to integer)
  ALPHA (0, 0)         JXN (0, 2)           BETA (0, 4)   ✓ FIXED
```

**What works:**  Perfect for close mismatches (≤4 units off). All 118 bendy
connections in the real map were within 4 units — springs came very close.

**What fails:**  Springs converge to a local minimum, not an integer grid.
At rest=1 with two conflicting forces, the spring settles at row=0.18 instead of 0.0,
and after integer snap, ends up at row=0 (lucky) OR row=1 (1-unit off, still bendy).

**Result on real map:**  800 iterations → 118 BENDY (all ≤4 units off-axis), 0 collisions.

---

### Phase 2: Constraint Propagation (layout-solve.js) — current approach

**Idea:** Forget forces. Use BFS to assign exact integer positions deterministically.

```
Rule:
  N/S edge A→N→B:  B.row = A.row − rest,   B.col = A.col      (same column)
  E/W edge A→E→B:  B.col = A.col + rest,    B.row = A.row      (same row)
```

**BFS trace on the sample:**

```
STEP 0  Seed ALPHA at (0, 0).
         Queue: [ {ALPHA, r=0, c=0} ]
         Placed: {}

STEP 1  Pop ALPHA (0,0). Place ALPHA=(0,0).
         Neighbours: ALPHA.E = JXN
         E/W rule: JXN.row = 0, JXN.col = 0 + rest(city→junction=2) = 2
         Queue: [ {JXN, r=0, c=2} ]
         Placed: { ALPHA:(0,0) }

STEP 2  Pop JXN (0,2). Place JXN=(0,2).
         Neighbours: JXN.W = ALPHA (already placed, same pos → ok ✓)
                     JXN.E = BETA
         E/W rule: BETA.row = 0, BETA.col = 2 + 2 = 4
         Queue: [ {BETA, r=0, c=4} ]
         Placed: { ALPHA:(0,0), JXN:(0,2) }

STEP 3  Pop BETA (0,4). Place BETA=(0,4).
         Queue empty.
         Placed: { ALPHA:(0,0), JXN:(0,2), BETA:(0,4) }

RESULT:
     col:  0    2    4
row   0:  [ALPHA]--[JXN]--[BETA]   ✓ perfect axis alignment, gaps=2 ≤ 4
```

**What works:**  Exact integer positions. Zero bendy for all topologically consistent paths.

**Conflict detection:**  If BFS arrives at a node that's ALREADY placed at a different position,
that's a **structural conflict** — the graph has a cycle with non-zero displacement.

**Conflict example (adding a bad edge):**

```
Same sample but add: ALPHA.N = BETA  (BETA is north of ALPHA, but BETA is east!)

BFS places ALPHA=(0,0), JXN=(0,2), BETA=(0,4).
Then processes ALPHA.N → expects BETA at (−1, 0).
But BETA is already at (0, 4).

STRUCTURAL CONFLICT:
  node=BETA  existingPos=(0,4)  proposedPos=(−1,0)
  → BETA must simultaneously be north of ALPHA AND east of JXN → impossible without elbow.
```

**Result on real map:**  53 structural conflicts → 28 elbows needed.
Grid: 71 rows × 490 cols. 0 collisions (with nudge pass).

---

## 4. Elbow Insertion

For each structural conflict, the algorithm inserts a junction node at the **axis intersection**:

```
BENDY E/W edge:  A.row ≠ B.row
  Elbow position: (A.row, B.col)
  Wiring:         A --E→ ELB --N/S→ B   (two axis-aligned legs)

BENDY N/S edge:  A.col ≠ B.col
  Elbow position: (B.row, A.col)
  Wiring:         A --N/S→ ELB --E/W→ B
```

**Sample: bendy E/W case**

```
Before:
  ALPHA (0,0) --E--> BETA (2,4)    ← BENDY: row mismatch = 2

Elbow at (ALPHA.row, BETA.col) = (0, 4):
  ELB001 (0,4)  connect: {W: ALPHA, S: BETA}

Wiring:
  ALPHA.E = ELB001   (was BETA)
  BETA.N  = ELB001   (was nothing)
  ELB001.W = ALPHA,  ELB001.S = BETA

After:
     col:  0         4
row   0:  [ALPHA]--[ELB001]
                     |
row   2:            [BETA]

Both legs axis-aligned. leg_A = |0−0|col = 4 ≤ 4 ✓,  leg_B = |2−0|row = 2 ≤ 4 ✓
```

### Terrain matching and signpost flavor

The elbow junction inherits terrain from connecting nodes:

```
elbowTerrain(typeA, typeB):
  if typeA == typeB  → use typeA
  if one is junction → use the other (junction is neutral)
  else              → prefer city > airport > site hierarchy

Signpost text:
  "▲ The Alpha City–Beta City Road ▲
   You stand at a crossroads on crowded streets and market squares.
   Alpha City lies one way; Beta City the other.
   Beware of pickpockets and city wolves — seasoned hunters find good sport nearby."
```

---

## 5. Algorithmic Comparison

```
                     Spring (800 iter)    Constraint BFS
─────────────────    ─────────────────    ──────────────
Runtime               ~2s                ~0.8s
BENDY connections     118 (all ≤4 off)   0 for consistent nodes
Structural elbows     unclear            28 identified precisely
Collisions            0 (nudge)          0 (nudge)
Grid size             varies             71r × 490c
Deterministic?        No                 Yes
Good for              Local refinement   Full world reshuffle
```

**Key insight:** Springs are good at refinement (fixing near-aligned connections).
Constraint propagation is good at global layout (exact positions from the graph topology).
The optimal pipeline is: **constraint propagation first → elbows for conflicts → fill-gap for long legs**.

---

## 6. API Map Fix Integration Plan

The layout tools should live as WBAPI server endpoints alongside the existing graph tools:

```
Existing:
  GET  /api/graph/broken           → detect off-axis / gap violations
  POST /api/graph/fill-gap         → insert junction chain for long gaps
  GET  /api/graph/validate/{code}  → diagnose one node
  GET  /api/layout/solve           → BFS coordinate suggestion
  POST /api/layout/apply           → mass-write NODE_COORDS

Proposed additions:
  GET  /api/layout/validate        → full world scan: bendy + range + collision report
  POST /api/layout/solve-exact     → constraint propagation layout (this tool)
  POST /api/layout/insert-elbows   → auto-insert elbow junctions for all conflicts
  GET  /api/layout/components      → list disconnected components with sizes
```

### Validator

`GET /api/layout/validate` — reads current NODE_COORDS, checks every edge:

```json
{
  "ok": true,
  "summary": { "bendy": 118, "range_viol": 164, "collisions": 0, "orphans": 74 },
  "edges": [
    { "from":"LHR","dir":"N","to":"BMA","status":"bendy_ns","colMismatch":3,
      "fix":"move BMA.col from 316 to 314, OR insert elbow at (296,316)" },
    ...
  ]
}
```

### Suggest Improver

`GET /api/layout/suggest` — for each broken edge, rank fixes by invasiveness:

```json
{
  "fixes": [
    { "rank":1, "type":"nudge_coord",   "node":"BMA", "from":{r:300,c:316}, "to":{r:300,c:314},
      "cmd":"PUT /api/coords/BMA {r:300,c:314}", "ripple": 0 },
    { "rank":2, "type":"insert_elbow", "code":"ELB099", "r":296,"c":314,
      "connects":{"S":"LHR","W":"BMA"}, "ripple": 1 },
    { "rank":3, "type":"fill_gap",     "from":"LHR","to":"BMA","junctions": 2,
      "ripple": 2 }
  ]
}
```

### World Shuffle

`POST /api/layout/solve-exact` — runs the constraint propagation solver on the full world,
returns proposed coords for every node + elbow specs. Accepts `dryRun:true` for preview.

```bash
# Dry run — see what would change
node layout-solve.js | jq .stats

# Apply full world reshuffle
node layout-solve.js --apply

# Apply with elbow insertion
node layout-solve.js --apply --insert-elbows
```
> Note: these operations will be wrapped as `./api.sh layout-solve` in a future API refactor.

---

## 7. Current State & Next Steps

```
Completed:
  ✓ layout-spring.js  — spring simulation + elbow suggestions + --apply
  ✓ layout-solve.js   — constraint propagation + terrain-matched elbows + --insert-elbows
  ✓ WBAPI: fill-gap, corner-junction, graph/broken, layout/solve, layout/apply

Known remaining issues (real map):
  • 82 disconnected components (74 orphan nodes + 8 small islands)
    → Wire at least one node of each island to the main network
  • 28 structural conflicts → elbows proposed but blocked by existing ELB001-063
    → Clear stale ELBs or use sequential naming from max existing ELB number
  • 164 RANGE_VIOL → use fill-gap after elbows are clean
  • Junction nodes need text/label audit to verify signpost text quality

Next actions:
  1. Move layout-solve.js logic into WBAPI as /api/layout/solve-exact endpoint
  2. Add /api/layout/validate as a standalone health-check endpoint
  3. Clear stale ELB nodes (or rename to avoid collision with existing codes)
  4. Wire 8 disconnected non-orphan components into main network
  5. Run constraint solve → apply → insert elbows → fill-gap in one pass
```

---

## 8. Files

```
/Users/user/code/roll2hit.com/
  layout-spring.js   — spring simulation (heuristic, good for local refinement)
  layout-solve.js    — constraint propagation (exact, good for full reshuffle)
  wbapi-server.js    — WBAPI server (fill-gap, layout/solve, layout/apply, graph/broken)
```

Usage:

```bash
# Dry run — see structural analysis
node layout-solve.js | jq .stats

# Apply coordinates (no elbows)
node layout-solve.js --apply

# Apply + auto-insert elbow junctions with terrain-matched signposts
node layout-solve.js --apply --insert-elbows

# Compare broken edges before/after
./api.sh broken
```
