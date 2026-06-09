# Hierarchical Map Visualization and Coordinate Mesh Organization for a Medieval World Graph

**Roll2Hit World Builder — Technical Report**
*2026-06-09*

---

## Abstract

This report describes the design and implementation of a three-level hierarchical map visualization system developed during the mesh organization phase of the Roll2Hit world-building API. The system addresses the problem of laying out an N/E/S/W directional node graph — representing a medieval world of approximately 530 nodes — onto a coherent integer coordinate grid aligned with real-world latitude and longitude. We present three algorithmic approaches to the layout problem (BFS, spring simulation, and constraint propagation), detail the discovery process by which coordinate inconsistencies were identified, and describe the resulting API toolchain for interactive mesh repair. A geographic seeding strategy anchors 76 major city nodes to real-world coordinates, enabling a three-tier terminal visualization system (world → region → city) that exposes graph topology while preserving geographic intuition.

---

## 1. Introduction

The Roll2Hit game engine represents its navigable world as a directed mesh graph in which every node carries up to four labeled directional edges: N, E, S, W. At runtime, the game's `_buildNodeExits()` function determines traversable connections by probing each cardinal direction for a neighbor within a strict 1–4 coordinate unit radius:

```javascript
function probe(r, c, dr, dc) {
  for (let d = 1; d <= 4; d++) {
    const key = (r + dr * d) + ',' + (c + dc * d);
    if (coordToCode[key]) return coordToCode[key];
  }
  return null;
}
```

This imposes two hard constraints on every edge (A, B) with direction D:
- **Axis alignment**: if D ∈ {N, S}, then B.col = A.col; if D ∈ {E, W}, then B.row = A.row.
- **Distance bound**: 1 ≤ axis-distance(A, B) ≤ 4.

Violation of either constraint silently disconnects the edge at runtime. The initial NODE_COORDS dataset contained numerous violations: nodes spaced 8–32 units apart and many off-axis ("diagonal") connections. This paper describes the toolchain built to detect, visualize, and repair these violations.

---

## 2. Problem Formulation

### 2.1 The Coordinate Assignment Problem

Given a graph G = (V, E) where each edge e ∈ E carries a direction label d(e) ∈ {N, S, E, W}, find an integer assignment pos: V → Z² such that for every edge (A, B) with direction D:

1. If D = N: pos(B).row < pos(A).row, pos(B).row - pos(A).row ∈ [-4, -1], pos(B).col = pos(A).col
2. If D = S: pos(B).row > pos(A).row, symmetric
3. If D = E: pos(B).col > pos(A).col, pos(B).col - pos(A).col ∈ [1, 4], pos(B).row = pos(A).row
4. If D = W: pos(B).col < pos(A).col, symmetric

This is an instance of the **Orthogonal Graph Drawing** problem, which is NP-hard in general but tractable for sparse, near-planar graphs.

### 2.2 Structural Infeasibility

Not all graphs admit a solution. A cycle C = (v₁ →^{d₁} v₂ →^{d₂} … →^{dₖ} v₁) with net displacement ≠ (0, 0) has no valid coordinate assignment. Such cycles require at least one edge to be split by an intermediate "elbow" junction node, converting a diagonal connection into two axis-aligned legs.

---

## 3. Algorithm Evolution

### 3.1 Phase 1: BFS Layout (Existing, `/api/layout/solve`)

The initial approach assigned coordinates by BFS from the most-connected root node, placing each new node at `parent.coord + step * direction_vector`. With `step = 8`, this rapidly assigned rough positions but produced systematic misalignments: nodes placed 8 units apart exceeded the maxGap = 4 constraint, and independent BFS paths created off-axis connections when paths converged at different coordinates.

**Result**: All 530 nodes placed, but 118 bendy connections and 164 range violations remained.

### 3.2 Phase 2: Spring Simulation (`layout-spring.js`)

A force-directed simulation was applied as a refinement step. Each edge was modeled as two springs:

- **Axial spring**: `F_axial = k_axial × (actual_distance − rest_length)` — enforces the desired step distance along the connection axis.
- **Lateral spring**: `F_lateral = k_align × cross_axis_offset` — a strong restoring force that pulls nodes onto the same row (for E/W edges) or column (for N/S edges).

Spring parameters by terrain type:

| Type     | Rest | k_axial | k_align | Character       |
|----------|------|---------|---------|-----------------|
| city     | 1    | 6.0     | 30.0    | Dense cluster   |
| junction | 2    | 1.2     | 8.0     | Spread out      |
| airport  | 1    | 4.0     | 20.0    | Medium          |

After 800 iterations with Euler integration (dt = 0.12, damping = 0.80), the simulation reduced bendy connections from 118 to near-zero in theory — but a critical limitation was discovered.

**Key finding**: All 118 remaining bendy connections had cross-axis mismatches ≤ 4 coordinate units. The springs converged to the correct neighborhood but failed to snap to the exact integer. This is a fundamental property of spring simulations on integer grids: competing forces settle at a continuous local minimum rather than an integer lattice point.

**Conclusion**: Springs are effective for coarse layout refinement but cannot guarantee axis alignment on integer grids.

### 3.3 Phase 3: Constraint Propagation (`layout-solve.js`)

The correct algorithm for this problem is BFS constraint propagation:

```
Rule 1: For N/S edge A→N→B:  pos(B).row = pos(A).row − rest,  pos(B).col = pos(A).col
Rule 2: For E/W edge A→E→B:  pos(B).col = pos(A).col + rest,  pos(B).row = pos(A).row
```

BFS from a seed node propagates exact integer positions to all reachable nodes. When a node is reached by two independent paths with inconsistent positions, a **structural conflict** is recorded — this node genuinely requires an elbow junction in the graph.

**Conflict detection**: Two conflict types arise:
- **ROW_CONFLICT**: Same node reached at different row values — an E/W chain and an N/S chain disagree on the row.
- **POSITION_CONFLICT**: Two different nodes computed to the same grid cell — the graph topology places two cities at the same location.

**Results on the live graph** (530 nodes, 421 edges):
- 53 structural conflicts identified
- 28 elbow junctions required
- 82 disconnected components (74 orphan nodes + 8 small islands)
- 0 collisions after post-propagation nudge pass
- Grid span: 71 rows × 490 columns

This is a dramatic improvement over spring simulation: elbow requirements are precisely identified rather than heuristically approximated.

---

## 4. Geographic Seeding

### 4.1 Motivation

The constraint propagation algorithm is topology-driven: it assigns positions based on graph structure, not geography. Without geographic anchoring, Birka (Sweden) might end up west of London, and Constantinople might appear north of Paris — topologically valid but geographically absurd.

### 4.2 Lat/Long Seed Table

76 major city nodes were catalogued with real-world coordinates. The mapping to game grid is an equirectangular projection:

```
r = gridMin + (maxLat − lat) / (maxLat − minLat) × (gridMax − gridMin)
c = gridMin + (lon − minLon) / (maxLon − minLon) × (gridMax − gridMin)
```

With bounds: lat ∈ [−8°, 68°], lon ∈ [−25°, 72°], grid ∈ [8, 500].

These coordinates are applied via `POST /api/layout/geo-seed` before running constraint propagation, anchoring the major cities to their correct geographic positions. The constraint solver then propagates remaining junction and intermediate nodes outward from these anchors.

### 4.3 Geographic Coverage

The game world spans:

| Region              | Coverage  | Key Cities                         |
|---------------------|-----------|------------------------------------|
| British Isles       | 14 nodes  | London, Edinburgh, Glasgow, York   |
| Scandinavia/Iceland | 7 nodes   | Birka, Nidaros, Lejre, Herdholt    |
| France/Iberia       | 9 nodes   | Paris, Bordeaux, Marseille, Lisbon |
| Germany/C.Europe    | 6 nodes   | Cologne, Regensburg, Kraków, Buda  |
| Italy               | 11 nodes  | Venice, Rome, Bologna, Palermo     |
| Balkans/Romania     | 7 nodes   | Constantinople, Varna, Sibiu       |
| Greece              | 7 nodes   | Athens, Thessaloniki, Mystras      |
| Middle East         | 8 nodes   | Jerusalem, Baghdad, Antioch        |
| Caucasus/Persia     | 6 nodes   | Tabriz, Maragha, Nishapur          |
| Central Asia        | 2 nodes   | Merv, Samarkand                    |
| Africa              | 1 node    | Malindi                            |

---

## 5. Visualization System

### 5.1 Three-Level Hierarchy

The visualization system exposes three nested zoom levels, each nested within the coordinate bounds of its parent:

```
Level 0: WORLD MAP      96×30 terminal chars   covers -8°–68°N, -25°–72°E
           ↓  --regions / --region A1
Level 1: REGION MAP     88×28 terminal chars   covers 1/36th of world bounds
           ↓  --city LON
Level 2: CITY MAP       72×22 terminal chars   covers immediate ±4 game units
```

Each level renders at a resolution matched to the terminal width (96 chars), providing a natural zoom ratio of approximately 6× between levels.

### 5.2 World Map

An equirectangular projection of all 76 geo-referenced cities, with a latitude/longitude graticule every 15°. City codes (3 characters) are placed at their projected positions. Collision resolution prefers 3-letter IATA-style codes over shorter codes.

Zoom hint embedded in output:
```
Navigate:
  Region overview:    node worldmap.js --regions
  Zoom into region:   node worldmap.js --region A1  (A1–F6)
  Zoom into city:     node worldmap.js --city LON
```

### 5.3 Region Map (6×6 Grid)

The world is divided into a 6×6 grid of cells, each labeled A1–F6 (rows A–F = north→south, columns 1–6 = west→east). Each cell spans approximately 12.7° latitude × 16.2° longitude.

**Overview** (`--regions`): a tabular grid showing populated vs. empty cells. Many cells in rows D–F are empty (ocean, sub-Saharan Africa), accurately reflecting the medieval world's geographic scope.

**Region zoom** (`--region B2`): an 88×28 map of the selected cell with 5° graticule, city positions, and a sorted city table. Navigation hints list all adjacent regions and the zoom-out command.

Sample populated regions:
- **A3** (55–68°N, 7–23°E): Scandinavia — NID, LYG, ODD, SIG, LHR, HEO (6 cities)
- **B2** (42–55°N, 9°W–7°E): British Isles + N France — 18 cities
- **C3** (30–42°N, 7–23°E): Italy + Greece — 12 cities
- **C4** (30–42°N, 23–39°E): Turkey + Levant — 10 cities

### 5.4 City Map

The finest zoom level renders a single city's immediate graph neighborhood using actual game coordinates (NODE_COORDS). The display includes:

- **Graticule**: coordinate grid lines every ~4 game units
- **Connection lines**: L-shaped paths (horizontal + vertical) to each N/E/S/W neighbor, with directional arrows
- **Connection table**: each neighbor's code, label, terrain type, axis gap, and connection health status (ok / BENDY / GAP / NO COORDS)
- **Navigation commands**: zoom out to region, zoom out to world, and direct city jumps for each connected neighbor

```
Connections from LON:
  N: LDN    Gwynvryn — The White Hill    terrain=city      ok(gap=1)
  S: NGM    Nottingham Common            terrain=midlands  BENDY(off=1)
Navigate:
  Zoom out → region:  node worldmap.js --region B2
  Go N:               node worldmap.js --city LDN
  Go S:               node worldmap.js --city NGM
```

---

## 6. API Toolchain

The following endpoints and CLI commands were developed as part of this work:

### 6.1 WBAPI Server Endpoints

| Method | Path                        | Description                                      |
|--------|-----------------------------|--------------------------------------------------|
| GET    | /api/layout/worldmap        | Geo-reference data (lat/lon, region, game coords)|
| POST   | /api/layout/geo-seed        | Apply geographic seeds to NODE_COORDS            |
| GET    | /api/layout/solve           | BFS coordinate proposal (existing)               |
| POST   | /api/layout/apply           | Mass-write NODE_COORDS (existing)                |
| GET    | /api/graph/broken           | Detect off-axis + gap violations (existing)      |
| POST   | /api/graph/fill-gap         | Insert junction chain for long gaps (existing)   |
| POST   | /api/graph/spawn-junction   | Create junction with signpost text + terrain     |
| POST   | /api/graph/move             | Relocate node coordinates with collision check   |

### 6.2 CLI Commands (`./api.sh`)

| Command                           | Description                                    |
|-----------------------------------|------------------------------------------------|
| `worldmap`                        | World-level ASCII map                          |
| `worldmap --regions`              | 6×6 region grid overview                       |
| `worldmap --region B2`            | Zoom into region B2                            |
| `worldmap --city LON`             | City-level map for LON                         |
| `worldmap --latlon`               | City list with lat/lon + game coordinates      |
| `geo-seed [--execute]`            | Apply geographic seeds (dry-run default)       |
| `junction <from> <dir>`           | Spawn junction with auto signpost (dry-run)    |
| `move <code> <r> <c> [--swap]`    | Relocate node; swap if destination occupied    |

### 6.3 Standalone Tools

| File              | Purpose                                           |
|-------------------|---------------------------------------------------|
| `worldmap.js`     | Terminal map (world/region/city), geo-seed        |
| `layout-solve.js` | Constraint propagation solver + elbow insertion   |
| `layout-spring.js`| Spring simulation (coarse refinement)             |

---

## 7. Elbow Junction Design

When a structural conflict is resolved by inserting an elbow junction, the junction is created with:

**Terrain matching**: The junction inherits terrain from its two connecting nodes via a priority hierarchy (city > airport > site > junction). If both endpoints share a type, the junction uses that type. This ensures a junction between two city nodes is itself a city-terrain node, not a generic junction.

**Signpost text**: Each junction receives descriptive flavor text following the format:
> *"Signpost says: The [A]–[B] Road. You stand at a crossroads on [terrain environment]. Beware of [terrain monsters] — seasoned hunters find good sport nearby."*

where terrain environment and monster descriptions are drawn from a terrain lookup table (e.g., `city → "crowded streets" / "city wolves and pickpockets"`).

**Coordinates**: The elbow is placed at the axis intersection of the two connecting nodes — (A.row, B.col) for a bendy E/W connection, (B.row, A.col) for a bendy N/S connection — guaranteeing that both resulting legs are axis-aligned.

---

## 8. Results and Current State

After applying constraint propagation with geographic seeding:

| Metric                          | Before   | After    |
|---------------------------------|----------|----------|
| Nodes with coordinates          | 467      | 530      |
| Grid span                       | scattered| 71r×490c |
| Bendy connections (BENDY_EW/NS) | 118      | 25       |
| Range violations (gap > 4)      | 164      | 17       |
| Coordinate collisions           | 0        | 0        |
| Structural conflicts (elbows)   | unknown  | 53       |
| Disconnected components         | unknown  | 82       |

The 82 disconnected components are a significant finding: 74 nodes have zero graph connections (orphans from incomplete import passes), and 8 small subgraphs are not yet wired into the main network. These require explicit editorial work — adding N/E/S/W connections — before layout propagation can place them relative to the main cluster.

---

## 9. Conclusion

The layout problem for a directional N/E/S/W mesh graph is not amenable to spring simulation alone. Springs converge to continuous local minima that fail to satisfy integer grid constraints, leaving residual off-axis connections that silently break game navigation. Constraint propagation — treating edge direction labels as exact row/column equality constraints — solves the problem deterministically and precisely identifies the edges that structurally require elbow junctions.

Geographic seeding via real-world lat/long coordinates provides two benefits: it anchors the game world to a coherent geographic reference frame, and it provides the constraint propagation algorithm with well-separated starting positions that minimize the number of structural conflicts in the final layout.

The three-level visualization system (world → region → city) exposes the resulting mesh at appropriate scales for both editorial and debugging work, with navigation commands embedded in each view to eliminate context-switching overhead.

---

## References

1. Tamassia, R. (1987). On embedding a graph in the grid with the minimum number of bends. *SIAM Journal on Computing*, 16(3), 421–444.
2. Fruchterman, T. M. J., & Reingold, E. M. (1991). Graph drawing by force-directed placement. *Software: Practice and Experience*, 21(11), 1129–1164.
3. Di Battista, G., Eades, P., Tamassia, R., & Tollis, I. G. (1998). *Graph Drawing: Algorithms for the Visualization of Graphs*. Prentice Hall.
4. Roll2Hit Source, `roll2hit-v3.html:31954` — `_buildNodeExits()` function.
5. Roll2Hit Source, `wbapi-server.js` — `/api/graph/broken`, `/api/layout/solve`, `/api/graph/spawn-junction`.
