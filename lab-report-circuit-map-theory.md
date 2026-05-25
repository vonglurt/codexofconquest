# Lab Report: Sparse Node Mesh Reduction via Circuit Corridor Junction Theory
### Applied Computer Science — Traversable World Architecture
**Project:** roll2hit-v3.html — *The Shattered Codex*  
**Layer:** 9 — Time-Warp Footpaths & Circuit Corridors  
**Date:** 2026-05-21  
**Author:** Roll2Hit Engineering

---

## Abstract

This report documents the architectural solution to a fundamental problem in discrete world-map design: how to render, navigate, and interact with a **sparse node graph** embedded in a dense two-dimensional grid, where the graph's edges represent traversable paths of varying length and danger. We introduce the **Circuit Corridor Junction** model — an extension of the classical Traveling Salesman Problem (TSP) reduced to a freeway-style network with typed travel modes. The implementation reduces an infinite-possibility grid to a compact, deterministic, and visually coherent wire mesh. The philosophical significance lies in the mapping between abstract graph theory and experiential user interaction: the same mathematical structure that makes routing tractable also makes navigation intuitive. We further show that the junction insertion concept is not merely geometric — it is an epistemological claim about the nature of named places.

---

## I. Introduction: The Philosophical Problem

A grid is infinite. A world is not.

When a game designer says "the world," they mean a finite set of meaningful places connected by meaningful paths. The grid is the substrate; the world is the selection. The gap between the two — between every possible cell and the 42 that matter — is the fundamental design problem of any tile-based world map.

The naive solution is a dense graph: every cell is a node, every adjacent cell is an edge. This is complete but useless. The player drowns in choice. Pathfinding becomes a cognitive burden rather than a strategic pleasure. Every step is an identical decision between four undifferentiated blank cells.

The opposite extreme — a pure abstract graph with no spatial embedding — solves the cognitive problem but destroys the world's coherence. You cannot feel that Birka is *far* from the Arctic Wastes if there is no visual distance between them.

**The Circuit Corridor model is the middle solution.** The world is a sparse graph (42 named nodes), but it is *embedded* in a real grid with spatial meaning. Corridors are not abstract edges — they are rendered wire traces that the eye can follow. Distance is visible. Direction is visible. The road from `CI` (Birka, row 5 col 16) to `MI` (Plains & Midlands, row 5 col 8) is eight grid cells wide, and you can see all eight.

This is computationally cheap and experientially rich. That is the philosophical achievement.

---

## II. Problem Statement: The Sparse Grid as TSP Variant

### The Classical Traveling Salesman Problem

The Traveling Salesman Problem asks: given N cities and the costs of traveling between each pair, find the minimum-cost Hamiltonian cycle. It is NP-hard in the general case.

Our problem is related but structurally different in three important ways:

| Dimension | Classic TSP | This System |
|-----------|-------------|-------------|
| Graph type | Complete (all pairs connected) | Sparse (hand-authored adjacency only) |
| Objective | Minimize total cost | Maximize interesting encounters en route |
| Player agency | External optimizer | Human in the loop |

The player is not trying to solve TSP. The player is a traveler with goals (active quests) who chooses *when* to be safe and *when* to hunt. The routing problem is not "find the shortest path" — it is "find the path with the right probability of danger for my current goals."

### The Sparse Grid

The world of *The Shattered Codex* occupies a 16-row × 26-column grid. That is 416 possible cells. Of these, exactly **42 are named nodes** (in Layers 1–8, expanding to 49 with junction nodes in Layer 9). The remaining 374+ cells are empty space — or were, until corridors were drawn through them.

The sparsity ratio is **~90%**. Most of the grid is void. This is what creates the traveling salesman subproblem: to get from node A to node F, you must pass through B, C, D, E — but B through E are not nodes. They are road. They are traversable but placeless.

The junction concept resolves this by **promoting selected road cells to named places**. A junction is a waypoint: it is not a destination, but it is a place you can be. It has a name, a signpost, and a terrain type. It makes the road *legible*.

---

## III. The Junction Concept: Named Intersections as Epistemological Objects

### Why Junctions Are Not Just Geometry

In graph theory, a junction is simply a vertex with degree ≥ 3. In this system, a junction is more: it is an **epistemological claim** that a particular point in the road network is *worth knowing about*.

Consider the road from `CI` (Birka) to `MI` (Plains). On the grid, this is a straight horizontal line at row 5, spanning columns 8 to 16 — eight cells of empty road. Without a junction, this is an anonymous corridor: you enter at one end and emerge at the other with no sense of the journey.

With junction `J1` at (row 5, col 12), the road becomes:

```
[ CI ] ─── ─── ─── [ J1: Midlands Road Fork ] ─── ─── ─── [ MI ]
  r5,c16              r5,c12                               r5,c8
```

The player knows they are halfway. They can orient. They can plan. The junction transforms a corridor into a **journey with a midpoint**.

This is the same reason highway engineers place named exits on freeways: not because the road needs an exit there geometrically, but because travelers need cognitive anchors. The junction is both a geometric insertion and a named place.

### Junction as Freeway On-Ramp

The freeway analogy is precise. In this system:

- **Nodes** are cities — you can stop, rest, buy, fight, advance quests
- **Junctions** are on-ramps / interchange signs — named, traversable, but no services
- **Corridors** are the freeway itself — fast (Warp mode), or hunted (Hunt mode)
- **Travel mode** is the choice of whether to use cruise control or hunt the shoulder

The player can travel vast distances instantly (Warp), or they can choose to engage the road as a danger zone (Hunt). This is the **freeway mechanic**: the same physical road, two experiential modes, selected by the player based on their current strategic goals.

---

## IV. Data Architecture

### 4.1 Source Data: `NODE_MAP`

`NODE_MAP` is the authoritative graph definition. Every named node is an entry with a code, grid label, act, directional adjacency, and content fields:

```javascript
// roll2hit-v3.html line 4921
const NODE_MAP = {
  CI:{ num:1, code:'CI', name:'city', label:'City Streets — Birka', act:1,
       N:null, S:'CR', E:'IN', W:'MI',
       text:"The greatest city in the known world...",
       npc:'City Guard Captain', battle:null, loot:'Bloodstained Map', sleep:false },
  MI:{ num:12, code:'MI', name:'midlands', label:'Plains & Midlands', act:3,
       N:'HL', S:null, E:'CI', W:'FO',
       text:"Open road. Wide sky. Farms abandoned...",
       npc:null, battle:{label:'Noonwraith + Field Wraith', key:'noonwraith', count:1},
       loot:'Abandoned Pack', sleep:false },
  // ... 40 more nodes
};
```

`NODE_MAP[code][dir]` gives the neighbor code in that direction, or `null` if no exit. This is the adjacency list of the world graph. It is hand-authored — no automatic generation. Every edge is a deliberate design decision.

### 4.2 Spatial Embedding: `NODE_COORDS`

`NODE_COORDS` maps every node code to a `(row, col)` position in the grid. This is the second layer: the graph given spatial coordinates.

```javascript
// roll2hit-v3.html line 4977
const NODE_COORDS = {
  CI:{r:5,c:16},  MI:{r:5,c:8},   FO:{r:5,c:3},   HL:{r:4,c:3},
  // ... (42 story nodes)
  // Layer 9 — Junction nodes (coords only; NODE_MAP entries added in L9-B)
  J1:{r:5,c:12},  J2:{r:10,c:4},  J3:{r:9,c:3},
  J4:{r:12,c:8},  J5:{r:1,c:10},  J6:{r:5,c:5},   J7:{r:1,c:22},
};
```

The Manhattan distance between two nodes `A` and `B` is:

```
distance(A, B) = |NODE_COORDS[A].r - NODE_COORDS[B].r|
              + |NODE_COORDS[A].c - NODE_COORDS[B].c|
```

If `distance ≤ 1`, the nodes are adjacent on the grid — no corridor is needed because their map cells touch. If `distance ≥ 2`, there is a gap, and the corridor builder draws a wire through it.

The `CI → MI` edge: `distance = |5-5| + |16-8| = 8`. Eight cells of empty road. Corridor required.

### 4.3 Corridor Cells: `CORRIDOR_CELLS`

`CORRIDOR_CELLS` is a dictionary keyed by `"row,col"` string, populated once at startup by `buildCorridorMap()`. It is the **derived graph of road cells** — the complement of `NODE_COORDS` within the wired edges.

```javascript
// roll2hit-v3.html line 5038
const CORRIDOR_CELLS = {};
// After buildCorridorMap() runs, each entry looks like:
// "5,15": {
//   dirs:    Set { 'E', 'W' },   // wire runs east-west
//   glyph:   '─',                // box-drawing character
//   terrain: 'midlands',         // WORLD_DB key for encounter rolls
//   edges:   [{ from:'CI', to:'MI' }]  // which edges pass through
// }
```

`CORRIDOR_CELLS` is read-only after construction. The renderer reads it; nothing writes to it at runtime.

### 4.4 Wire Glyph Lookup: `WIRE_GLYPH`

The box-drawing character for each cell is determined by which directions the wire enters and exits. The key is the sorted alphabetical join of the direction set:

```javascript
// roll2hit-v3.html line 4993
const WIRE_GLYPH = {
  'E,W':     '─',   // horizontal wire
  'N,S':     '│',   // vertical wire
  'E,N':     '└',   // bottom-left corner
  'N,W':     '┘',   // bottom-right corner
  'E,S':     '┌',   // top-left corner
  'S,W':     '┐',   // top-right corner
  'E,N,S':   '├',   // T-junction (east branch)
  'N,S,W':   '┤',   // T-junction (west branch)
  'E,N,W':   '┴',   // T-junction (south branch)
  'E,S,W':   '┬',   // T-junction (north branch)
  'E,N,S,W': '┼',   // four-way crossing
};
```

A cell where two wires cross accumulates both direction sets. If `CI→MI` runs east-west through cell (5,9), and some future north-south wire runs through the same cell, that cell's `dirs` set becomes `{N,S,E,W}` → glyph `┼`. The crossing is visible.

### 4.5 Corridor Terrain Map: `CORRIDOR_TERRAIN`

Each edge is assigned a terrain type used to determine which monster pool to draw from in Hunt mode:

```javascript
// roll2hit-v3.html line 5007
const CORRIDOR_TERRAIN = {
  'CI-MI':'midlands',  'MI-CI':'midlands',
  'MI-FO':'forest',    'FO-MI':'forest',
  'HS-BE':'forest',    'BE-HS':'forest',
  'OC-IS':'ocean',     'IS-OC':'ocean',
  'DS-SE':'ocean',     'SE-DS':'ocean',
  'VC-DE':'desert',    'DE-VC':'desert',
  'DC-JU':'jungle',    'JU-DC':'jungle',
  'KT-OP':'heavenly_clouds', 'OP-KT':'heavenly_clouds',
  'HC-AR':'arctic',    'AR-HC':'arctic',
  // ... and junction-split edges
};
// Fallback: 'midlands'
```

Both directions of each edge share the same terrain. A `_corridorTerrain(fromCode, toCode)` lookup handles either order.

---

## V. Mesh Construction: `buildCorridorMap()`

### 5.1 The Algorithm

`buildCorridorMap()` runs once at script load, after `NODE_MAP` and `NODE_COORDS` are defined, before any player interaction. It iterates every directed edge in `NODE_MAP`, deduplicates by sorting the edge pair, computes the L-shaped grid route, and writes intermediate cells to `CORRIDOR_CELLS`.

```javascript
// roll2hit-v3.html line 6196
function buildCorridorMap() {
  const processed = new Set();
  const nodeSet   = new Set(Object.values(NODE_COORDS).map(p => p.r + ',' + p.c));

  Object.keys(NODE_MAP).forEach(fromCode => {
    const fromCoords = NODE_COORDS[fromCode];
    if (!fromCoords) return;
    const node = NODE_MAP[fromCode];
    if (node.portal) return;                    // portal connections are instant, not routed

    ['N','S','E','W'].forEach(dir => {
      const toCode = node[dir];
      if (!toCode) return;
      const edgeKey = [fromCode, toCode].sort().join('-');
      if (processed.has(edgeKey)) return;       // deduplicate undirected edge
      processed.add(edgeKey);

      const toCoords = NODE_COORDS[toCode];
      if (!toCoords) return;

      const r1 = fromCoords.r, c1 = fromCoords.c;
      const r2 = toCoords.r,   c2 = toCoords.c;
      if (Math.abs(r1 - r2) + Math.abs(c1 - c2) <= 1) return;  // adjacent — no wire

      // Prefer H-first routing; fall back to V-first if H-corner lands on a node
      let first = 'H';
      if (r1 !== r2 && c1 !== c2 && nodeSet.has(r1 + ',' + c2) && !nodeSet.has(r2 + ',' + c1))
        first = 'V';

      const terrain = _corridorTerrain(fromCode, toCode);
      _routeSegments(r1, c1, r2, c2, first).forEach(seg => {
        const key = seg.r + ',' + seg.c;
        if (nodeSet.has(key)) return;           // node cells take precedence — skip

        if (CORRIDOR_CELLS[key]) {
          // Crossing: merge direction sets, recompute glyph
          seg.dirs.forEach(d => CORRIDOR_CELLS[key].dirs.add(d));
          CORRIDOR_CELLS[key].glyph = _wireGlyph(CORRIDOR_CELLS[key].dirs);
          CORRIDOR_CELLS[key].edges.push({ from: fromCode, to: toCode });
        } else {
          CORRIDOR_CELLS[key] = {
            dirs: seg.dirs, glyph: _wireGlyph(seg.dirs),
            terrain, edges: [{ from: fromCode, to: toCode }],
          };
        }
      });
    });
  });
}
```

**Computational complexity:** O(E × L) where E is the number of edges (~60) and L is the maximum corridor length in grid cells (~16). At startup this runs in under 1ms. `CORRIDOR_CELLS` is then a static lookup table — O(1) access per cell.

### 5.2 Route Segment Generator: `_routeSegments()`

The L-shaped route from `(r1,c1)` to `(r2,c2)` with horizontal-first order:

```javascript
// roll2hit-v3.html line 6165
function _routeSegments(r1, c1, r2, c2, first) {
  const cells  = [];
  const hStep  = c2 > c1 ? 1 : (c2 < c1 ? -1 : 0);
  const vStep  = r2 > r1 ? 1 : (r2 < r1 ? -1 : 0);

  if (first === 'H') {
    // Horizontal segment (not including from-node or corner)
    if (hStep !== 0)
      for (let c = c1 + hStep; c !== c2; c += hStep)
        cells.push({ r:r1, c, dirs: new Set(['E','W']) });
    // Corner cell (only when both axes change)
    if (hStep !== 0 && vStep !== 0)
      cells.push({ r:r1, c:c2,
        dirs: new Set([hStep > 0 ? 'W' : 'E', vStep > 0 ? 'S' : 'N']) });
    // Vertical segment (not including to-node)
    if (vStep !== 0)
      for (let r = r1 + vStep; r !== r2; r += vStep)
        cells.push({ r, c:c2, dirs: new Set(['N','S']) });
  } else {
    // Vertical-first: corner at (r2, c1)
    if (vStep !== 0)
      for (let r = r1 + vStep; r !== r2; r += vStep)
        cells.push({ r, c:c1, dirs: new Set(['N','S']) });
    if (vStep !== 0 && hStep !== 0)
      cells.push({ r:r2, c:c1,
        dirs: new Set([vStep > 0 ? 'N' : 'S', hStep > 0 ? 'E' : 'W']) });
    if (hStep !== 0)
      for (let c = c1 + hStep; c !== c2; c += hStep)
        cells.push({ r:r2, c, dirs: new Set(['E','W']) });
  }
  return cells;
}
```

**Corner direction logic:**

The corner cell is the turning point of the L. Its `dirs` set contains exactly two entries: the direction from which the wire arrives, and the direction in which it departs. The box-drawing character follows automatically from the sorted key lookup.

| Route direction | Corner dirs | Glyph |
|----------------|-------------|-------|
| East then South | `{W, S}` | `┐` |
| East then North | `{W, N}` | `┘` |
| West then South | `{E, S}` | `┌` |
| West then North | `{E, N}` | `└` |

**Visual example — `CI(5,16) → MI(5,8)`** (pure horizontal, no corner):

```
Row 5:  [CI]─── ─── ─── ─── ─── ─── ─── [MI]
        c16  15  14  13  12  11  10   9    c8
             ─   ─   ─   ─   ─   ─   ─
```

After L9-B inserts `J1` at (5,12), the route splits:

```
        [CI]─── ─── ─── [J1]─── ─── ─── [MI]
        c16  15  14  13   c12  11  10   9  c8
```

**Visual example — `OC(13,1) → DS(14,4)`** (L-shaped, H-first):

```
Row 13: [OC]─── ─── ─┐
        c1    2    3  c4
Row 14:              [DS]
                     c4
```
Corner at (13,4) has `dirs={W,S}` → `┐`. Then one vertical cell at (14,4) has `dirs={N,S}`... but that is `DS` itself — a node — so the vertical segment has zero intermediate cells. Net result: one horizontal run + one corner cell.

### 5.3 Glyph Derivation: `_wireGlyph()`

```javascript
// roll2hit-v3.html line 6157
function _wireGlyph(dirs) {
  return WIRE_GLYPH[[...dirs].sort().join(',')] || '·';
}
```

The fallback `'·'` is a dot — visible but non-directional. It indicates a crossing combination not in the lookup table (e.g., a single isolated direction `{N}` only, which should not occur in a valid route but is rendered gracefully).

---

## VI. Travel Mode Theory

### 6.1 The Three Modes

The system implements three travel modes for corridor traversal. Two are coded; the third (Sneak) is a design extension:

| Mode | Name | Trigger | Encounter Roll | Day Cost | Notes |
|------|------|---------|----------------|----------|-------|
| **Run** | Warp | `btn-corridor-warp` | None (0%) | 0 | Instant teleport to destination |
| **Hunt** | Hunt | `btn-corridor-hunt` | Yes — quest-scaled | 0 | Optional battle at corridor terrain |
| **Sneak** | *(planned)* | *(future)* | Reduced chance | 0 | Lower encounter rate, slower |

The Hunt/Warp dialog (`#story-corridor-overlay`) fires whenever the Manhattan distance between current node and destination is ≥ 2 — i.e., whenever a corridor exists between them.

### 6.2 Quest-Probability Coupling

The central design insight of the Hunt/Warp system is that **the player's quest load is both a goal counter and a risk multiplier**. The more quests a player has active, the higher the encounter rate while traveling Hunt mode.

```javascript
const activeQuestCount = Object.values(S_story.quests).filter(s => s === 'active').length;
const encounterChance  = Math.min(0.9, 0.1 + activeQuestCount * 0.05);
```

| Active Quests | Encounter Chance |
|:---:|:---:|
| 0 | 10% |
| 2 | 20% |
| 4 | 30% |
| 8 | 50% |
| 16 | 90% (cap) |

**The philosophical reading:** A player carrying many active quests is a person in motion — they have enemies, obligations, and a reputation. Their presence on the road is conspicuous. The formula quantifies conspicuousness as a monotone linear function of commitment, capped at 90% because even the most wanted person can catch a lucky break.

**The hunt-optimization reading:** The formula also makes Hunt mode *more efficient* when you are already doing many quests. If you have 8 active quests and need to grind XP in a forest corridor, a 50% encounter rate means roughly one fight per two traversals — predictable grinding. The player who plans this is rewarded with efficiency; the player who hunts with no quests gets 10%, which is exploratory randomness.

This is the precise inverse of how most games work: usually more quests = more complexity = more danger. Here, more quests = more conspicuousness = more encounter = more XP per mile. The quests *pull* the world toward you.

---

## VII. Execution Traces

### Trace A: Hunt Mode

**Scenario:** Player is at `MI` (Plains & Midlands, r5,c8) with 4 active quests. They press `E` to move toward `CI` (r5,c16). Manhattan distance = 8 ≥ 2.

```
1. User presses E (keyboard) or clicks D-pad East button
   │
   └─► storyMove('E')                              [line 5441]
         node = NODE_MAP['MI']                     → { ..., E:'CI', ... }
         dest = 'CI'
         next = NODE_MAP['CI']                     → { label:'City Streets — Birka', ... }
         [gate lock checks — none apply]
         [shard gate check — not CO, skip]
         storyCheckMissedSleep()                   → no missed sleep
         S_story.log.push('MI')
         S_story.log.length = 7 (< 20, no shift)

         fromCoords = NODE_COORDS['MI']            → { r:5, c:8 }
         toCoords   = NODE_COORDS['CI']            → { r:5, c:16 }
         manhattan  = |5-5| + |8-16|              = 8  ≥  2
         ↓
         storyCorridorTravel('MI', 'CI', 'E')      [planned L9-E]

2. storyCorridorTravel('MI', 'CI', 'E')
         fromNode = NODE_MAP['MI']                 → label: 'Plains & Midlands'
         toNode   = NODE_MAP['CI']                 → label: 'City Streets — Birka'
         terrain  = _corridorTerrain('MI','CI')    → 'midlands'
         activeQs = Object.values(S_story.quests)
                      .filter(s => s==='active').length  → 4
         chance   = Math.min(0.9, 0.1 + 4×0.05)   → 0.30  (30%)
         pct      = 30

         DOM updates:
           corridor-from     ← 'Plains & Midlands'
           corridor-to       ← 'City Streets'
           corridor-terrain  ← 'midlands'
           corridor-quest-count ← 4
           corridor-pct      ← '30%'

         btn-corridor-hunt.onclick = doTravel(true)
         btn-corridor-warp.onclick = doTravel(false)
         story-corridor-overlay.classList.add('visible')
         → Dialog renders:
           ⚡ Time-Warp Footpath
           Plains & Midlands → City Streets
           Road: midlands
           4 active quest(s) → 30% encounter chance
           [⚡ Warp — instant, safe]
           [🎯 Hunt — roll encounter]
           [✕ Cancel]

3. User clicks "🎯 Hunt — roll encounter"
         doTravel(true) fires

4. doTravel(true)
         story-corridor-overlay.classList.remove('visible')
         _setActivePath('MI', 'CI', 'E')          [planned L9-H]
           S_story.lastExitCode = 'MI'
           S_story.lastExitDir  = 'E'
           S_story.lastCorridorCells = [
             {r:5,c:9}, {r:5,c:10}, {r:5,c:11},
             {r:5,c:12}, {r:5,c:13}, {r:5,c:14}, {r:5,c:15}
           ]                                       (from CORRIDOR_CELLS lookup)
         S_story.currentCode = 'CI'
         triggerCorridorEncounter('midlands', () => storyRender(NODE_MAP['CI']))

5. triggerCorridorEncounter('midlands', cb)       [planned L9-F]
         activeQs = 4
         chance   = 0.30
         roll     = Math.random()                  → e.g. 0.21  (< 0.30)
         ENCOUNTER TRIGGERED

         pool     = WORLD_DB['midlands'].monsters
         monster  = _weightedMonsterPick(pool)

6. _weightedMonsterPick(pool)
         WEIGHTS = { trivial:35, easy:35, medium:25, hard:4, deadly:1 }
         Build weighted array (~100 entries):
           [wolf×35, goblin×35, bandit×25, troll×4, ogre×1, ...]
         pick random index → e.g. wolf
         return { name:'Wolf', tier:'trivial', hp:11, ac:13, ... }

7. triggerCorridorEncounter (continued)
         _corridorOnComplete = cb                  (the storyRender callback)
         S_story.pendingBattle = {
           nodeCode: '_corridor',
           name: 'Wolf',
           label: 'Corridor — midlands',
           isCorridor: true,
         }
         loadWorldMonster(wolf)                    → loads wolf stats into S.opp
         S.player.hp    = S_story.hp
         S.player.maxHp = S_story.hpMax
         refreshLeftPanel()
         _renderPreBatt()
         story-prebatt-overlay.classList.add('visible')
         → Pre-battle screen: "Corridor — midlands" · "Wolf"

8. [Battle occurs in Battle Mode]
         Player defeats wolf
         btn-outcome-win clicked

9. storyApplyOutcome(true)
         pb = S_story.pendingBattle
         pb.isCorridor === true  ✓
         _corridorOnComplete !== null  ✓
         cb = _corridorOnComplete
         _corridorOnComplete = null
         [player survived — hp > 0]
         cb()
           → storyRender(NODE_MAP['CI'])

10. storyRender(NODE_MAP['CI'])
          Renders City Streets — Birka panel
          Map overlay (if open) shows:
            Corridor cells (5,9)–(5,15): class mc-corridor-active  (gold wire)
            Node MI (5,8): exit arrow ▶ has class mc-exit-active   (gold)
            Node CI (5,16): mc-current  (◉ gold)
```

**Total function calls in Hunt mode trace:** 10 major calls, with `_weightedMonsterPick` as the deepest internal computation.

---

### Trace B: Warp Mode (Story Mode Travel)

**Scenario:** Same player, same starting position `MI`, same destination `CI`. Player chooses Warp.

```
1. storyMove('E')                                 [as in Trace A, steps 1–2]
   manhattan = 8 ≥ 2
   → storyCorridorTravel('MI', 'CI', 'E')

2. storyCorridorTravel('MI', 'CI', 'E')
   [Dialog renders — identical to Trace A]

3. User clicks "⚡ Warp — instant, safe"
   doTravel(false) fires

4. doTravel(false)
   story-corridor-overlay.classList.remove('visible')
   _setActivePath('MI', 'CI', 'E')               [same as Trace A step 4]
     S_story.lastExitCode = 'MI'
     S_story.lastExitDir  = 'E'
     S_story.lastCorridorCells = [ {r:5,c:9}, ..., {r:5,c:15} ]
   S_story.currentCode = 'CI'
   storyRender(NODE_MAP['CI'])                    [DIRECT — no encounter step]

5. storyRender(NODE_MAP['CI'])
   Renders City Streets panel
   Map overlay shows gold corridor trace (same visual as Hunt mode outcome)
```

**Total function calls in Warp mode trace:** 5 major calls. Steps 5–9 of Hunt mode (encounter roll, monster pick, battle, outcome) are entirely absent. The corridor is traversed, the highlight is applied, the world renders. Done.

**The asymmetry is the design:** Warp mode is mechanically trivial. Its value is purely navigational. Hunt mode is mechanically rich — it engages the entire battle subsystem — but only because the player chose it. The choice is the mechanic.

---

## VIII. Mesh Creation: How to Build It From Scratch

### Step 1 — Define Named Places

Every named place is an entry in `NODE_MAP`. Each entry needs: a unique code, a grid label, directional neighbors (or `null`), and content fields (npc, battle, loot, sleep).

```javascript
const NODE_MAP = {
  A: { code:'A', label:'Town Alpha', N:null, S:null, E:'B', W:null, ... },
  B: { code:'B', label:'Town Beta',  N:null, S:null, E:null, W:'A', ... },
};
```

**Rule:** every directional edge must be bidirectional in the data. If `A.E = 'B'`, then `B.W = 'A'`.

### Step 2 — Assign Grid Positions

Every node gets a `(row, col)` coordinate. Coordinates are design choices: they determine visual distance and which cells corridors pass through.

```javascript
const NODE_COORDS = {
  A: { r:5, c:3 },
  B: { r:5, c:9 },  // 6 columns apart — corridor will have 5 intermediate cells
};
```

**Rule:** no two nodes should share the same `(r, c)` — the renderer places one node per cell.

### Step 3 — Declare Terrain

Add each edge to `CORRIDOR_TERRAIN` with a `WORLD_DB`-valid terrain key. Both directions.

```javascript
const CORRIDOR_TERRAIN = {
  'A-B': 'forest', 'B-A': 'forest',
};
```

### Step 4 — Call `buildCorridorMap()`

Call once after both data structures are defined. It populates `CORRIDOR_CELLS` automatically from the two source structures.

```javascript
buildCorridorMap();
// CORRIDOR_CELLS is now populated with all intermediate grid cells
// e.g., CORRIDOR_CELLS["5,4"] = { dirs: Set{E,W}, glyph:'─', terrain:'forest', edges:[{from:'A',to:'B'}] }
```

### Step 5 — Insert Junctions Where Needed

For corridors longer than ~4–5 cells, add a junction node at the midpoint. The junction is a NODE_MAP entry with `junction: true`:

```javascript
NODE_MAP.J1 = {
  code:'J1', label:'Forest Road Junction', junction:true,
  N:null, S:null, E:'B', W:'A',
  text:'A signpost. East: Town Beta. West: Town Alpha.',
  npc:null, battle:null, loot:null, sleep:false,
};
NODE_COORDS.J1 = { r:5, c:6 };
```

Then update the original edge: `A.E = 'J1'` and `B.W = 'J1'`. The corridor `A→B` is now split into `A→J1` and `J1→B`. `buildCorridorMap()` draws two shorter wires instead of one long one, with the junction node as a named midpoint visible on the map.

### Step 6 — Render

The map renderer iterates `CORRIDOR_CELLS` for every visible cell in the 11×11 viewport. Each corridor cell renders its glyph in the appropriate color (dim/visited/active). Junction nodes render as `✛` with their code label. The result is a PCB-style wire diagram overlaid on the sparse node grid.

---

## IX. Architectural Summary

```
DATA LAYER (static, defined at load)
├── NODE_MAP          — graph adjacency + content
├── NODE_COORDS       — spatial embedding (row, col)
├── WIRE_GLYPH        — direction set → box-drawing char
├── CORRIDOR_TERRAIN  — edge → WORLD_DB terrain key
└── CORRIDOR_CELLS    — derived; built by buildCorridorMap()

BUILD LAYER (runs once at startup)
├── buildCorridorMap()
│     ├── _routeSegments()   — L-shaped intermediate cell list
│     ├── _wireGlyph()       — glyph from direction Set
│     └── _corridorTerrain() — terrain lookup
└── → CORRIDOR_CELLS populated; ~1ms; read-only thereafter

RUNTIME LAYER (per player action)
├── storyMove(dir)
│     ├── if manhattan ≥ 2 → storyCorridorTravel()
│     └── if manhattan ≤ 1 → storyRender() [direct]
│
├── storyCorridorTravel(from, to, dir)
│     ├── computes encounter % from active quest count
│     ├── renders Hunt/Warp dialog
│     └── on choice:
│           Warp → _setActivePath() → storyRender()
│           Hunt → triggerCorridorEncounter() → [battle] → storyRender()
│
├── triggerCorridorEncounter(terrain, onComplete)
│     ├── rolls Math.random() vs encounterChance
│     ├── if hit: _weightedMonsterPick() → loadWorldMonster() → prebattle UI
│     └── if miss: onComplete() immediately
│
└── _renderMapGrid()   [map overlay]
      ├── first pass:  render node cells (NODE_COORDS)
      ├── second pass: render corridor cells (CORRIDOR_CELLS)
      │     ├── mc-corridor-dim     (unvisited endpoint)
      │     ├── mc-corridor-visited (both endpoints visited)
      │     └── mc-corridor-active  (last-traveled corridor — gold)
      └── exit-arrow highlight:  mc-exit-active on lastExitCode+lastExitDir
```

---

## X. Conclusion: The Traversable World

The sparse node mesh, before Layer 9, was a **point graph**: nodes floating in void. Players knew logically that Birka was "west" of the Plains, but the map showed a dot at column 16 and a dot at column 8 with nothing between them. The distance was encoded as data; it was not felt.

After Layer 9, the map shows a wire running eight cells from dot to dot. You can see the road. You can see how far you have to go. You can see which roads you have traveled before (bright wire) and which are still unknown (dim wire). You can see where you just came from (gold wire, pulsing arrow).

The junction concept makes long roads navigable — not by shortening them, but by naming the midpoint. A junction is an act of declaration: *this place, this road-crossing, is worth knowing about*. The Midlands Road Fork (J1) is not a city. It has no inn, no NPC, no battle. But it has a name, and a name is enough to make a place real.

The Hunt/Warp duality makes the road itself a game resource. A road is not just connection — it is potential danger, potential XP, potential encounter. The player's decision to Warp or Hunt is a strategic choice about risk/reward that is directly coupled to their current quest state. The world *responds* to the player's commitments.

This is the philosophical conclusion: by reducing the infinite grid to a sparse mesh of named places, connected by rendered wires, navigated through typed travel modes, the system transforms geography into *experience*. Distance becomes risk. Roads become decisions. Junctions become knowledge. The map is no longer a lookup table — it is a world.

---

*File: `lab-report-circuit-map-theory.md`*  
*Companion code: `roll2hit-v3.html` — Layer 9-A (L9-A through L9-H)*  
*Implementation spec: `spec-corridors.md`*  
*Feature plan: `plan.md`*  
*Last updated: 2026-05-21*
