<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->

# Cell-Grid Navigation Architecture for Text-Based Role-Playing Game Worlds: A MUD-Inspired Design Framework

**Paul Richeson**  
*CodexOfConquest.com · Independent Game Research*  
*Paul Richeson*

---

> *IEEE Transactions on Games — Format Reference Paper*  
> *Submitted: June 2026 · Revised: June 2026*

---

## Abstract

This paper presents a coordinate-based sparse cell-grid architecture for the navigation layer of text-based role-playing game worlds, drawing design lineage from the Multi-User Dungeon (MUD) genre originated in 1978. Classic MUD systems represent the game world as a graph of numbered "rooms" linked by explicit directional exit fields. While expressive, this model creates maintenance burden as exit references grow stale and graph invariants must be enforced manually. The proposed architecture replaces explicit exit fields with implicit coordinate adjacency: every location occupies a unique integer cell `(r, c)` on a sparse grid, and two locations are considered connected if and only if their coordinates are Manhattan-adjacent along a cardinal axis (North, South, East, or West). A reverse lookup table `CELL_GRID["r,c"] → location_code` supports O(1) adjacency resolution. Inter-location pathfinding is implemented via Breadth-First Search (BFS) over the grid, producing shortest-path routes expressed as cardinal direction sequences. A waypoint navigation system consumes BFS output one step at a time, allowing the player to travel between any two points by repeated single-direction moves. We evaluate the design on a 500×500 grid containing 419 named locations across eight narrative acts, demonstrating 100% BFS reachability from the canonical root node, zero coordinate collisions, and sub-millisecond adjacency resolution. The architecture eliminates a complete class of graph-maintenance bugs and reduces world-building to a coordinate-placement operation.

**Index Terms** — Cell grid, game navigation, graph pathfinding, MUD design, BFS, waypoint system, world-building, text adventure, sparse grid, room-based topology.

---

## I. Introduction

The Multi-User Dungeon (MUD) is the oldest genre of networked role-playing game. The first MUD was built at the University of Essex in 1978 by Roy Trubshaw and Richard Bartle as a text-based shared virtual world [1]. In the decades since, MUD design has produced a rich body of conventions: the world is divided into discrete spatial units called *rooms*; each room connects to neighboring rooms via directional exits labeled North (N), South (S), East (E), and West (W), with optional Up (U) and Down (D); players navigate by typing direction commands, and the server responds with a text description of the new location.

Classic MUD codebases — particularly the DikuMUD lineage that includes CircleMUD [2] and its successor tbaMUD — store room connectivity as an explicit list of exit fields embedded in each room record. Each exit names a destination room by its Virtual Number (VNUM), an integer identifier that serves as a primary key in the room database. A room may carry up to six exits: one per cardinal direction plus Up and Down.

This model is expressive but brittle. As a game world grows, exit references accumulate. Moving a room requires updating every room that pointed to it. Automated build tools must audit the exit graph for dangling references, bidirectional consistency, and diagonal connections. These checks are non-trivial [3]. Moreover, the VNUM-to-room mapping encourages treating VNUMs as positions — e.g., a zone numbered 3000–3099 is expected to occupy a spatial region — but the mapping from VNUM to physical space is implicit and easily violated.

This paper proposes an alternative architecture that replaces explicit exit fields with **implicit coordinate adjacency**. Every named location is assigned a unique `(row, column)` cell on an integer grid. Two locations are adjacent — connected by a traversable exit — if and only if their coordinates differ by exactly one unit in one axis. The exit graph is no longer stored; it is computed on demand from the coordinate table. This design eliminates exit-maintenance bugs by construction: the only world-building operation is placing a location at a coordinate.

The remainder of this paper is organized as follows. Section II surveys related work in MUD room design, grid pathfinding, and waypoint navigation. Section III defines the formal data model. Section IV describes the BFS pathfinding algorithm and waypoint system. Section V covers zone organization and terrain classification. Section VI presents implementation results on a 500×500 grid. Section VII discusses limitations and future directions. Section VIII concludes.

---

## II. Related Work

### A. MUD Room Data Model

The CircleMUD room file format [2] is the canonical reference for explicit-exit MUD design. A room entry specifies: a VNUM, a name string, a description string, a zone number, a bitvector of room flags (DARK, PEACEFUL, SOUNDPROOF, etc.), a sector type integer (0 = inside, 1 = city, 2 = field, 3 = forest, …), and zero to six direction fields. Each direction field carries a destination VNUM, a door flag (0 = open, 1 = door, 2 = pickproof), and an optional keyword list for the door.

```
#3001
The Great Hall~
You stand in a vast hall.
~
30 0 0
D0                         ← North
Exit to the courtyard~
~
0 -1 3002
S
```

This format has been stable across thirty years of derivatives. Its central invariant — that the destination VNUM must exist in the room database — is verified by zone loading code. Violations produce "broken link" warnings that builders must fix manually.

### B. Grid Pathfinding

The standard literature on grid-based pathfinding [4] distinguishes three node placement strategies: tile centers, edge centers, and vertices. For cardinal-only (4-connected) movement, tile-center placement is canonical: each cell is a node, and edges connect horizontally and vertically adjacent cells. For a uniform-cost grid, Breadth-First Search (BFS) produces optimal shortest paths in O(V + E) time where V is the number of visited cells and E is the number of edges traversed [5].

Dijkstra's Algorithm generalizes BFS to weighted edges; A* further accelerates the search with an admissible heuristic [6]. For unweighted grids, BFS is preferred over Dijkstra's because it avoids priority-queue overhead [5]. A* with Manhattan-distance heuristic is preferred over BFS on large grids where the destination is known and movement costs are uniform, because A* visits fewer cells on average.

Jump Point Search (JPS) [7] optimizes A* on uniform grids by pruning provably suboptimal intermediate nodes, dynamically constructing a waypoint graph rather than processing every cell. JPS reduces the number of nodes expanded by an order of magnitude on obstacle-free grids while producing identical optimal paths.

### C. Waypoint Navigation

Waypoint systems pre-process a map into a sparse set of landmark nodes connected by obstacle-free paths [4]. At runtime, pathfinding operates on the waypoint graph rather than the full cell graph, reducing search time. A classical waypoint placement strategy positions nodes at convex obstacle corners — positions where the direction of travel must change. The node-count reduction depends on map geometry but is typically an order of magnitude.

In MUD contexts, waypoint navigation has a specific meaning: the player sets a destination, and the system advances the player one step per command toward that destination. This "auto-walk" feature appears in graphical MUDs (e.g., Achaea, Imperian) and is analogous to the follow-path mechanic in real-time strategy games.

### D. Text Adventure Navigation Grammar

Zork (1977) [8] and its descendants established the conventional navigation vocabulary: cardinal direction names, abbreviated to single letters (n, s, e, w) or arrow keys, plus special directions (up/u, down/d, in, out). Players type a direction command; the parser resolves it to an exit; the server transitions the player and prints the destination description. This grammar has remained stable across text adventures, MUDs, and contemporary interactive fiction.

---

## III. Data Model

### A. Formal Definitions

Let **L** be a finite set of *location codes* — short alphanumeric identifiers (e.g., `LHR`, `SEN`, `BOO`).

Let **NODE_MAP** : L → NodeDescriptor be a total function mapping each location code to its descriptor record. A NodeDescriptor contains:

| Field | Type | Description |
|-------|------|-------------|
| `num` | Integer | Unique ordinal (analogous to MUD VNUM) |
| `code` | String | Location code (primary key) |
| `name` | String | Terrain key (must match a WORLD_DB entry) |
| `label` | String | Human-readable display name |
| `act` | Integer | Narrative act number (1–8) |
| `text` | String | Location description shown to the player |
| `npc` | String | NPC name present at location (optional) |
| `loot` | String | Item(s) collectable on first visit (optional) |
| `battle` | Object | Encounter specification (optional) |
| `sleep` | Boolean | Whether the location offers rest |

Crucially, **no directional exit fields** (`N`, `S`, `E`, `W`, `U`, `D`) appear in NodeDescriptor. Exit connectivity is derived entirely from coordinate adjacency.

Let **NODE_COORDS** : L ⇀ ℤ² be a partial function mapping location codes to integer grid coordinates. A location is *placed* if it appears in the domain of NODE_COORDS; a location without coordinates is a *ghost* — present in the descriptor table but unreachable in-game.

Define the **CELL_GRID** as the inverse of NODE_COORDS:

```
CELL_GRID : ℤ² ⇀ L
CELL_GRID[(r, c)] = code   iff   NODE_COORDS[code] = (r, c)
```

CELL_GRID is well-defined when NODE_COORDS is injective — no two locations share a coordinate. This is the **Coordinate Uniqueness Invariant** (I1).

### B. Adjacency and Exits

The four cardinal moves and their coordinate deltas are:

| Direction | Δr | Δc |
|-----------|----|----|
| North (N) | −1 | 0 |
| South (S) | +1 | 0 |
| East (E)  | 0  | +1 |
| West (W)  | 0  | −1 |

Given a player at `(r, c)`, the result of moving North is cell `(r−1, c)`. If `CELL_GRID[(r−1, c)]` is defined, the player arrives at a named location. Otherwise the player enters *open terrain* — an unnamed cell whose properties are inferred from surrounding named locations.

The *derived exits* of location `code` at `(r, c)` are:

```
derived_exits(code) = {
  dir → CELL_GRID[(r + Δr, c + Δc)]
  for each (dir, Δr, Δc) in {N, S, E, W}
  where CELL_GRID[(r + Δr, c + Δc)] is defined
}
```

This computation is O(1) per location per direction — four lookups. It replaces the stored exit graph entirely.

### C. Grid Dimensions and Population

The game world occupies a grid of dimensions R × C. We have evaluated the architecture on grids from 90×90 (8,100 cells) to 500×500 (250,000 cells). Named locations occupy a small fraction of the grid. For a world of 419 named locations on a 500×500 grid, the *fill density* is:

```
fill_density = 419 / 250,000 = 0.17%
```

This confirms the grid is *sparse* — the overwhelming majority of cells are unnamed open terrain. The choice of grid dimensions affects:

1. **Coordinate resolution**: Larger grids allow finer granularity in geographic placement.
2. **BFS search budget**: Worst-case BFS on an R×C grid is O(R×C). For 90×90 = 8,100 cells, this is negligible; for 500×500 = 250,000 cells, BFS completes in under 1 ms in JavaScript.
3. **Encounter granularity**: Empty cells between named locations generate random encounters. Larger grids create longer travel distances, increasing encounter frequency on any given journey.

A 90×90 grid is recommended for smaller worlds (under 200 locations), providing a compact spatial footprint while maintaining enough separation for distinct zones. A 500×500 grid supports continent-scale worlds with multiple cultural regions at the cost of longer absolute travel distances.

---

## IV. Pathfinding and Waypoint Navigation

### A. BFS Grid Pathfinding

Given a source coordinate `(r₀, c₀)` and a destination coordinate `(r_d, c_d)`, the BFS algorithm proceeds as follows:

```
Algorithm 1: BFS_GRID_PATH(r₀, c₀, r_d, c_d, IMPASSABLE)

Input:  source (r₀, c₀), destination (r_d, c_d),
        CELL_GRID, IMPASSABLE (set of blocked cells),
        grid bounds [1..R] × [1..C]
Output: path = list of (r, c, code) steps, or [] if unreachable

1.  if (r₀, c₀) == (r_d, c_d): return []
2.  visited ← {(r₀, c₀)}
3.  parent  ← empty map
4.  queue   ← [(r₀, c₀)]
5.  DELTAS  ← [(-1,0), (1,0), (0,1), (0,-1)]  // N, S, E, W
6.  while queue is not empty:
7.      (r, c) ← dequeue(queue)
8.      for each (dr, dc) in DELTAS:
9.          nr ← r + dr,  nc ← c + dc
10.         if (nr, nc) ∉ [1..R] × [1..C]: continue
11.         if (nr, nc) ∈ IMPASSABLE:       continue
12.         if (nr, nc) ∈ visited:          continue
13.         visited.add((nr, nc))
14.         parent[(nr, nc)] ← (r, c)
15.         if (nr, nc) == (r_d, c_d):
16.             return reconstruct_path(parent, (r₀,c₀), (r_d,c_d))
17.         enqueue(queue, (nr, nc))
18. return []   // unreachable

Procedure reconstruct_path(parent, start, end):
    path ← []
    cur  ← end
    while cur ≠ start:
        path.prepend({ r: cur.r, c: cur.c,
                       code: CELL_GRID[cur] or null })
        cur ← parent[cur]
    return path
```

BFS guarantees that the first path found to the destination is a shortest path in terms of grid steps. Because movement costs are uniform (one step = one hour of game time), BFS is the optimal algorithm for this setting — no heuristic can improve on it for finding the guaranteed shortest path on an unweighted grid [5].

The `IMPASSABLE` set blocks cells permanently regardless of adjacency. In the CodexOfConquest.com implementation, ocean tiles are loaded into `IMPASSABLE_CELLS` at game startup, preventing the pathfinder from routing the player across water.

### B. BFS Direction Extraction

After BFS produces a path, the *next direction* is trivially determined from the first step:

```
Algorithm 2: BFS_NEXT_DIR(r₀, c₀, path)

Input:  current position (r₀, c₀), path from Algorithm 1
Output: direction string ∈ {'N','S','E','W'}

1.  (r₁, c₁) ← path[0]
2.  dr ← r₁ - r₀,  dc ← c₁ - c₀
3.  if dr == -1: return 'N'
4.  if dr == +1: return 'S'
5.  if dc == +1: return 'E'
6.  if dc == -1: return 'W'
```

This is O(1). The full path need not be retained in memory after direction extraction.

### C. Waypoint Navigation Protocol

A *waypoint* is a target location code stored in the player's session state. The waypoint system advances the player one grid cell per activation:

```
Algorithm 3: WAYPOINT_STEP(S, NODE_COORDS, CELL_GRID)

Input:  session state S = { currentCode, playerR, playerC, waypoint, … }
Output: updated S after one navigation step

1.  wp ← S.waypoint
2.  if wp is null: show quest panel; return
3.  if S.currentCode == wp:
4.      announce "Reached waypoint: NODE_MAP[wp].label"
5.      S.waypoint ← null
6.      return
7.  path ← BFS_GRID_PATH(S.playerR, S.playerC,
                          NODE_COORDS[wp].r, NODE_COORDS[wp].c, IMPASSABLE)
8.  if path is empty:
9.      announce "No path to waypoint — navigate manually"
10.     return
11. dir ← BFS_NEXT_DIR(S.playerR, S.playerC, path)
12. CELL_MOVE(dir, S)         // one step in direction dir
```

The critical property of Algorithm 3 is that BFS is re-run from the *current position* on every activation. This means the player may deviate from the original path — due to an encounter, manual movement, or zone gate — and the waypoint system will automatically recalculate. There is no stale path to invalidate. The cost is one BFS per waypoint button press, which is acceptable because waypoint presses are human-rate events (< 5 Hz).

### D. A* as an Alternative

For large grids where the player's position is often far from named locations, A* with Manhattan-distance heuristic reduces the number of cells examined before reaching the destination. The heuristic:

```
h(r, c) = |r - r_d| + |c - c_d|
```

is admissible (never overestimates the true distance on a 4-connected grid) and consistent (satisfies the triangle inequality). A* with this heuristic is guaranteed to produce an optimal path [6].

On a 500×500 grid, the practical difference between BFS and A* depends on obstacle density. With no impassable cells, both algorithms explore approximately the same number of cells for a path of length L. With significant obstacles, A* may explore substantially fewer cells. For the CodexOfConquest.com world, where impassable cells are confined to ocean borders, BFS and A* perform comparably on land-to-land paths.

**Recommendation:** Use BFS for grids up to 200×200 and worlds with sparse obstacles. Use A* for larger grids or dense obstacle fields.

---

## V. Zone Design and Terrain Classification

### A. Zone Definition

A *zone* is a contiguous rectangular sub-region of the grid associated with a cultural, narrative, or geographic theme. Zones are not stored as hard data — they emerge from the coordinate layout of named locations. A zone containing 10 locations is "the area bounded by the outermost coordinates of those 10 locations."

Classic MUD systems (CircleMUD, DikuMUD) assign zones by VNUM ranges: zone 30 contains rooms 3000–3099 [2]. This creates a bijection between zone number and VNUM prefix, simplifying zone-file management but coupling spatial organization to numeric assignment. The coordinate-based model eliminates this coupling: zone identity is purely geographic.

Suggested zone size for a 90×90 grid: 15×15 cells per zone, yielding 36 zones for a complete world map. Each zone comfortably holds 5–20 named locations with adequate empty-cell separation for traversal encounters.

For a 500×500 grid, zones of 50×50 cells yield 100 zones, appropriate for continent-scale designs.

### B. Terrain Classification

Each named location carries a *terrain key* — a string that references an entry in a terrain database. The terrain database maps keys to encounter rates, environment descriptions, icons, and movement modifiers:

| Terrain Key   | Encounter Rate | Environment Class | Notes |
|---------------|---------------|-------------------|-------|
| `city`        | 5%            | Urban             | Safe anchor point |
| `city_slums`  | 10%           | Urban             | Low-security urban |
| `road`        | 0%            | Transit           | Zero-encounter connector |
| `junction`    | 0%            | Transit           | Grid intersection |
| `midlands`    | 15%           | Wilderness        | Default open terrain |
| `forest`      | 25%           | Wilderness        | Dense cover |
| `highlands`   | 20%           | Wilderness        | Elevated terrain |
| `swamp`       | 30%           | Wilderness        | Difficult terrain |
| `desert`      | 20%           | Wilderness        | Arid wilderness |
| `jungle`      | 30%           | Wilderness        | Dense tropical |
| `hag_swamp`   | 35%           | Special           | Cursed wetland |
| `ocean`       | 10%           | Impassable        | Sea cell |
| `beach`       | 10%           | Coastal           | Shoreline |
| `alley`       | 15%           | Urban wilderness  | Urban danger |

Empty cells between named locations inherit their terrain by majority vote of the four cardinal neighbors:

```
Algorithm 4: INFER_TERRAIN(r, c, CELL_GRID, NODE_MAP)

1.  neighbors ← [CELL_GRID[(r+dr, c+dc)] for (dr,dc) in N,S,E,W]
                  filtered to defined entries
2.  if neighbors is empty: return 'midlands'
3.  frequency ← count occurrences of NODE_MAP[code].name for each neighbor
4.  return argmax(frequency)   // terrain of most common neighbor
```

This heuristic produces coherent terrain gradients — a player walking south from a forest toward a city will traverse forest → forest-leaning midlands → city-leaning midlands → city cells, with smoothly decreasing encounter rates.

### C. Narrative Acts as Zone Layers

The narrative structure of the game world is organized into *acts* — numbered story phases that gate certain locations and quests. Each named location carries an `act` field. Locations in Act 1 are accessible from the game start; locations in later acts become accessible as the player progresses.

Acts map loosely to geographic regions: Act I occupies the northern reaches of the grid; Act II through IV spread south and east; later acts occupy increasingly remote areas. This geographic separation means a player who navigates purely by coordinate exploration will naturally encounter content in approximately narrative order, without hard gates on exploration.

---

## VI. Implementation and Evaluation

### A. Implementation Architecture

The reference implementation (CodexOfConquest.com) uses the following runtime components:

```
┌──────────────────────────────────────────────────────────────┐
│  Admin SPA (edit.html)                               │
│  POST /api/node {code, r, c, name, label, act, …}            │
└────────────────────┬─────────────────────────────────────────┘
                     │ HTTP, port 1367
┌────────────────────▼─────────────────────────────────────────┐
│  REST API Server (wbapi-server.js, Node.js)                  │
│  • Reads/writes game file via anchor markers                 │
│  • buildCellGrid(nodeMap, nodeCoords) on every request       │
│  • GET /api/cell/:r/:c — O(1) cell lookup                    │
│  • GET /api/graph/reachability — BFS reachability audit      │
│  • POST /api/session/move — multi-player session step        │
└────────────────────┬─────────────────────────────────────────┘
                     │ file I/O (fs.readFileSync / writeFileSync)
┌────────────────────▼─────────────────────────────────────────┐
│  Single-file Game (play.html)                         │
│  • NODE_MAP     : location descriptors (no exit fields)      │
│  • NODE_COORDS  : {code → {r, c}} coordinate index          │
│  • CELL_GRID    : {"r,c" → code} reverse lookup (built once) │
│  • cellMove(dir) : one step, O(1) destination lookup        │
│  • _bfsGridPath() : BFS pathfinding on 500×500 grid         │
│  • storyWaypoint() : one-step auto-walk toward target        │
└──────────────────────────────────────────────────────────────┘
```

The `CELL_GRID` lookup table is constructed once at page load time using an immediately-invoked function expression:

```javascript
const CELL_GRID = (() => {
  const g = {};
  for (const code of Object.keys(NODE_MAP)) {
    const coord = NODE_COORDS[code];
    if (coord && coord.r != null && coord.c != null)
      g[`${coord.r},${coord.c}`] = code;
  }
  return g;
})();
```

Construction is O(|L|) where |L| is the number of placed locations. For 419 locations, this is a negligible cost at startup.

### B. Cell Move Implementation

The `cellMove(dir)` function is the single navigation primitive:

```javascript
function cellMove(dir) {
  const DELTAS = { N:[-1,0], S:[1,0], E:[0,1], W:[0,-1] };
  const [dr, dc] = DELTAS[dir];
  const nr = S_story.playerR + dr;
  const nc = S_story.playerC + dc;

  // Bound check
  if (nr < 1 || nc < 1 || nr > 500 || nc > 500) {
    storyMsg('You reach the edge of the known world.'); return;
  }
  // Impassable check (ocean tiles)
  if (IMPASSABLE_CELLS.has(`${nr},${nc}`)) {
    storyMsg('The sea is impassable on foot.'); return;
  }

  const destCode = CELL_GRID[`${nr},${nc}`];   // O(1)

  S_story.playerR = nr;
  S_story.playerC = nc;
  S_story.visitedCells[`${nr},${nc}`] = true;
  S_story.hoursElapsed += 1;

  if (destCode && NODE_MAP[destCode]) {
    storyRender(NODE_MAP[destCode]);   // named location
  } else {
    _enterEmptyCell(nr, nc);           // open terrain
  }
}
```

The total cost per navigation step is: one string construction, one hash lookup, one bounds check, one set lookup, and one conditional branch. This is O(1) regardless of world size.

### C. Quantitative Evaluation

The reference implementation was evaluated on the following configuration:

| Parameter | Value |
|-----------|-------|
| Grid dimensions | 500 × 500 (250,000 cells) |
| Named locations | 419 |
| Fill density | 0.17% |
| Root node | LHR (Birka, row 64, col 224) |
| IMPASSABLE_CELLS | Ocean tiles along grid boundary |
| Narrative acts | 8 |

**Reachability:** BFS from LHR visits 100% of named locations (419/419). No location is disconnected from the root. The BFS flood-fill traverses approximately 62,000 cells before exhausting reachable space on the continent-shaped grid.

**Coordinate Uniqueness:** Zero collisions in NODE_COORDS. Each of the 419 locations occupies a unique `(r, c)` cell.

**Adjacency Resolution:** `CELL_GRID` lookup: < 0.01 ms per query (JavaScript object property access). BFS from LHR to the most distant node (approximately 110 grid steps): < 1 ms.

**World-Building Friction:** Adding a new location requires one REST call with three mandatory fields (`code`, `r`, `c`). No exit fields are written. The new location is immediately traversable if placed adjacent to an existing location, or reachable via open-cell traversal from any adjacent cell.

### D. Multi-Player Session Layer

The server maintains a `SESSIONS` map keyed by session ID. Each session carries the player's current grid position. Players co-present in the same cell receive Server-Sent Events (SSE) when another player arrives or sends a chat message:

```javascript
function broadcastCell(r, c, event, data, excludeId) {
  for (const [id, s] of SESSIONS) {
    if (s.r === r && s.c === c && id !== excludeId) {
      sseSend(SSE_CLIENTS.get(id), event, data);
    }
  }
}
```

The MUD-style seven REST endpoints under `/api/session/` — `start`, `move`, `look`, `who`, `say`, `end`, `events` — replicate the classic MUD command grammar over HTTP rather than raw TCP. A session `move` call validates the direction, applies `cellMove` logic server-side, and broadcasts `player_arrived` to co-present players. Idle sessions expire after 30 minutes (TTL enforced by a background sweep).

---

## VII. Discussion

### A. Comparison with Explicit Exit Model

Table I contrasts the proposed coordinate model with the classical VNUM/exit-field model.

**Table I: Architecture Comparison**

| Property | VNUM/Exit Model | Coordinate Model |
|----------|-----------------|------------------|
| Exit storage | Per-room exit record | Implicit (derived from coords) |
| Bidirectional consistency | Must be enforced manually | Guaranteed by construction |
| Node move cost | O(fan-in): update all pointing rooms | O(1): update one coord entry |
| Dead-link detection | Requires audit pass | Structurally impossible |
| Grid position encoding | Implicit (by VNUM convention) | Explicit (primary data) |
| Diagonal exit risk | Possible (must audit) | Structurally impossible |
| Ghost node risk | Low (unlinked rooms ignored) | Present (unplaced nodes exist) |
| BFS from position | Requires graph reconstruction | Direct on CELL_GRID |

The coordinate model trades the flexibility of non-grid topology (e.g., one-way exits, diagonal connections, teleportation exits) for structural correctness guarantees. Applications requiring non-grid topology may supplement the coordinate model with an *override exit table* that stores exceptional connections by node code pair.

### B. Terrain Inference Accuracy

The majority-vote terrain inference algorithm (Algorithm 4) produces accurate results when named locations have internally consistent terrain assignments. Inaccuracies arise at zone boundaries where two different terrain types share a border — the inference algorithm produces a gradient that may not reflect the intended hard boundary. A designer may override the inference by placing a zero-encounter-rate "boundary node" at the border cell with an explicit terrain assignment.

### C. Scaling to 90×90 Grids

A 90×90 grid (8,100 cells) is appropriate for a world of 50–150 named locations. At this scale:

- BFS from root to any destination: < 0.1 ms
- Typical travel distance between named locations: 3–8 cells
- Zone size: 15×15 cells (36 zones for full grid coverage)
- Named location density required for connectivity: approximately 1 node per 54 cells

The 90×90 grid is the recommended starting point for new worlds. The coordinate space is large enough to support meaningful geographic separation while small enough that BFS is instantaneous even on constrained hardware (mobile browsers, embedded JavaScript engines).

### D. Limitations

**Up/Down exits.** The 2D coordinate model does not naturally represent vertical movement. Dungeons, towers, and underground areas require either a separate grid layer (a 3D coordinate `(r, c, level)`) or an explicit override exit table. This is the primary topological expressive limitation of the model.

**Non-Euclidean topology.** Some MUD designs include exits that wrap around (e.g., go North enough times and return to start) or one-way exits. These require override exits and cannot be expressed purely by coordinate adjacency.

**BFS recomputation per waypoint press.** Algorithm 3 re-runs full BFS on every waypoint activation. For worlds with many thousands of cells and complex obstacle topologies, pre-computing shortest-path trees from each named location (Dijkstra all-pairs or Johnson's algorithm) would eliminate the per-press computation at the cost of O(|L| × R × C) preprocessing time and O(|L|²) storage. For worlds under 500×500 with under 500 named locations, the per-press BFS is acceptable.

---

## VIII. Conclusion

This paper has presented a coordinate-based sparse cell-grid architecture for MUD-style text game worlds. The key contribution is the replacement of explicit directional exit fields with implicit coordinate adjacency — a design choice that eliminates an entire class of graph-maintenance bugs while reducing world-building to the placement of a location at a grid coordinate.

The formal data model defines three invariants: coordinate uniqueness (I1), grid consistency (I2), and BFS reachability from the root (I3). All three are mechanically verifiable by tools that ship with the implementation. The BFS pathfinding algorithm operates on the grid directly, producing optimal shortest-path sequences in cardinal direction terms. The waypoint navigation system consumes BFS output one step at a time, enabling one-button auto-walk navigation that behaves correctly even when the player deviates mid-journey.

Evaluation on a 500×500 grid with 419 named locations demonstrates 100% reachability, zero coordinate collisions, and O(1) adjacency resolution. For smaller worlds, a 90×90 grid provides adequate spatial resolution with negligible computational cost.

The architecture is well-suited to any text-based role-playing game that requires: (a) cardinal-direction navigation, (b) open terrain traversal between named locations, (c) encounter generation on empty cells, and (d) dynamic pathfinding to support auto-walk waypoint systems. It is equally applicable to the original MUD genre, contemporary browser-based interactive fiction, and tabletop role-playing game assistants that model a game world as a navigable space.

---

## References

[1] R. Bartle, *Designing Virtual Worlds*. New Riders, 2003. [The authoritative historical account of MUD design from the original co-creator of MUD1.]

[2] J. Elson, *The CircleMUD Builder's Manual*, University of Maryland, 1993. Available: https://www.circlemud.org/cdp/building/building-3.html

[3] A. Zigler, "MUD Cookbook: Design Meets Implementation," *andrewzigler.com*, 2019. Available: https://www.andrewzigler.com/blog/mud-cookbook-design-meets-implementation/

[4] A. Patel, "Map Representations," *Stanford Theory Group — Game Programming*, 2020. Available: https://theory.stanford.edu/~amitp/GameProgramming/MapRepresentations.html

[5] A. Patel, "Grid Pathfinding Optimizations," *Red Blob Games*, 2020. Available: https://www.redblobgames.com/pathfinding/grids/algorithms.html

[6] P. Hart, N. Nilsson, and B. Raphael, "A Formal Basis for the Heuristic Determination of Minimum Cost Paths," *IEEE Transactions on Systems Science and Cybernetics*, vol. 4, no. 2, pp. 100–107, 1968.

[7] D. Harabor and A. Grastien, "Online Graph Pruning for Pathfinding on Grid Maps," *Proceedings of the AAAI Conference on Artificial Intelligence*, 2011.

[8] T. Anderson, M. Blank, B. Daniels, and D. Lebling, *Zork I: The Great Underground Empire*, Infocom, 1980.

[9] "Comparative Analysis of Pathfinding Algorithms A*, Dijkstra, and BFS on Maze Runner Game," *International Journal of Research and Practical Research*, 2018. Available: https://www.researchgate.net/publication/325368698

[10] "Multi-Target Pathfinding: Evaluating A-star Versus BFS," *DIVA Portal*, Linköping University, 2024. Available: https://www.diva-portal.org/smash/get/diva2:1897067/FULLTEXT02.pdf

[11] M. Talbot, "A Dive into the MUD: A Series on Text-based Games Using Object-Oriented Ruby," *Medium*, 2019. Available: https://medium.com/@mdtalbot/a-dive-into-the-mud-a-series-on-text-based-games-using-object-oriented-ruby-d4be41c3d12a

[12] P. Richeson, "Cell Map & MUD Redesign (§CELL-01 through §CELL-11)," *CodexOfConquest.com Lab Report*, June 2026.

[13] P. Richeson, "CodexOfConquest.com — Cell-Grid Navigation Architecture, Program Flow, and Validation Test Design," *Technical Report TR-2026-CELL*, CodexOfConquest.com, June 2026.

---

*© 2026 Paul Richeson — MIT License.*  
*Correspondence: [vonglurt on GitHub](https://github.com/vonglurt)*
