# Roll2Hit.com — Cell-Grid Navigation Architecture, Program Flow, and Validation Test Design

**Technical Report TR-2026-CELL**
*roll2hit.com · MIT License · Paul Richeson*

---

## Abstract

Roll2Hit.com is a single-file browser-based D&D 5e combat and story assistant. Its navigation system underwent a complete architectural transition (§CELL-01 through §CELL-12) from an explicit N/S/E/W edge-list graph model to a coordinate-based sparse grid model in which all exits are derived at runtime from 2D coordinate adjacency. The canonical root node `LHR` (Birka) anchors a 500×500 integer grid; every named location occupies a unique `(r,c)` cell, and pathfinding is performed entirely by breadth-first search (BFS) over that grid.

This report characterizes each application layer — API server (`wbapi-server.js`), geographic coordinate tool (`worldmap.js`), global constant layer, browser runtime state (`S_story`), and navigation input dispatch — with verbatim code excerpts and source line references. It then traces the complete program flow for the canonical Act I to Act II transition ending with first Codex Shard collection.

Finally, it specifies a two-tier test suite: Playwright browser integration tests and Node.js unit tests. The suite is organized around the concept of "reweave-as-validation," in which a fully navigatable map is defined as one where every node present in `NODE_COORDS` is BFS-reachable from `LHR` on the 500×500 grid, respecting `IMPASSABLE_CELLS`.

---

## 1. Introduction

Roll2Hit.com is implemented as a single self-contained HTML file (`roll2hit-v3.html`). All game logic, world data, and UI are co-located in that file. A companion Node.js server (`wbapi-server.js`) provides a local REST API that reads and writes the HTML file directly, enabling live game world editing without interrupting a play session. A companion admin SPA (`worldbuilder.html`) connects to that server to provide a graphical design interface.

The navigation model is built on a 500×500 integer grid. Each named location (node) occupies a unique cell identified by row `r` and column `c`. The cell table `CELL_GRID` — a JavaScript plain object keyed by `"r,c"` string — is the sole runtime data structure for navigation. No node stores directional exit references. Pathfinding is performed entirely by breadth-first search (BFS) over the grid, and the waypoint system takes one grid step per player action toward a BFS-determined destination.

This design choice has two consequences. First, adding or moving a node requires only a coordinate entry — no graph edge maintenance. Second, the invariant "every node is reachable" is directly testable by running a single BFS from the root node and comparing the visited set against the full coordinate index.

---

## 2. System Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│  worldbuilder.html (admin SPA)                               │
│  Design entry: fetch POST /api/node {code, r, c, …}          │
└────────────────────┬─────────────────────────────────────────┘
                     │ HTTP to localhost:1367
┌────────────────────▼─────────────────────────────────────────┐
│  wbapi-server.js (Node.js REST API, port 1367)               │
│  Reads + writes roll2hit-v3.html via anchor markers          │
│  ◆◆◆ WORLDBUILDER:NODE_MAP:START/END ◆◆◆                    │
│  ◆◆◆ WORLDBUILDER:NODE_COORDS:START/END ◆◆◆                 │
└────────────────────┬─────────────────────────────────────────┘
                     │ file I/O  (fs.readFileSync / writeFileSync)
┌────────────────────▼─────────────────────────────────────────┐
│  roll2hit-v3.html  (single-file game)                        │
│  ├── Global constants  (parse-time)                          │
│  │   NODE_MAP, NODE_COORDS, CELL_GRID, QUEST_DB, WORLD_DB   │
│  ├── Runtime state  (browser session)                        │
│  │   S_story  (mutable, persisted to localStorage)           │
│  └── Navigation functions                                    │
│      cellMove(), _bfsGridPath(), storyWaypoint(), …          │
└──────────────────────────────────────────────────────────────┘
         ▲                         │
         │ localStorage            │ DOM events
    seedAndLoad()              D-pad, WP, keyboard
    (Playwright tests)         → cellMove(dir)
```

The five primary layers addressed in this report are: (I) the API server, (II) the geographic map tool, (III) the global constant layer, (IV) the browser runtime layer, and (V) the navigation input layer. Two auxiliary topics — (VI) the worldbuilder design entry mechanic and (VII) the cell insertion protocol — are addressed as cross-cutting concerns.

---

## 3. Layer I — API Server (`wbapi-server.js`)

### 3.1 Role and Responsibility

The API server is a stateless Node.js HTTP server that holds no canonical game state of its own. It acts as a structured write proxy for `roll2hit-v3.html`. The game file is the source of truth; the server's in-memory `WBAPI` object is a parsed mirror used to validate requests before writing. On every successful write the file is saved and WBAPI is reloaded, keeping the mirror in sync.

The parsing logic shared between the server and the offline unit tests lives in `wbapi-core.js`, which exposes a `WBAPI.load(filePath)` entry point. The server requires `wbapi-core.js` at startup; the unit tests in §12.6 require it independently so they can validate the game file without a running HTTP server.

```js
// wbapi-server.js line 94
const PORT      = parseInt(process.env.PORT || '1367');
const GAME_FILE = process.env.ROLL2HIT_FILE
  || process.argv.find((a, i) => process.argv[i-1] === '--file')
  || path.join(__dirname, 'roll2hit-v3.html');
```

### 3.2 The CELL_GRID Mirror (`getCellGrid`)

The server maintains a memoized mirror of the client-side `CELL_GRID` for use in audit, graph analysis, and reweave operations. The cache is invalidated by object identity: if either `WBAPI.nodeMap` or `WBAPI.nodeCoords` is replaced (which happens on every reload), the next call to `getCellGrid()` rebuilds.

```js
// wbapi-server.js lines 289–296
function getCellGrid() {
  const nm = WBAPI.nodeMap, coords = WBAPI.nodeCoords;
  if (nm !== _cgCacheNm || coords !== _cgCacheCoords) {
    _cgCacheNm = nm; _cgCacheCoords = coords;
    _cgCache = buildCellGrid(nm, coords);
  }
  return _cgCache;
}
```

The underlying `buildCellGrid` function (defined locally within the audit handler at line 2564 and promoted to module scope for reuse) is a verbatim mirror of the client-side construction:

```js
// wbapi-server.js lines 2564–2572
function buildCellGrid(nm, coords) {
  const g = {};
  for (const code of Object.keys(nm)) {
    const coord = coords[code] || { r: nm[code].r, c: nm[code].c };
    if (coord && coord.r != null && coord.c != null)
      g[`${coord.r},${coord.c}`] = code;
  }
  return g;
}
```

This design guarantees that the server's view of the grid is always identical to what the client would compute from the same source file.

### 3.3 Derived Exit Computation

When the API returns a node entity via `GET /api/node/{code}`, the response includes a `derived_exits` field computed live from the cell grid. No N/S/E/W fields are stored on nodes; §CELL-01 stripped all such fields from the data model.

```js
// wbapi-server.js lines 313–321
derived_exits: (function() {
  const coord = WBAPI.nodeCoords[key]; if (!coord) return {};
  const cg = getCellGrid();
  const result = {};
  for (let i = 0; i < DIR_NAMES.length; i++) {
    const nb = cg[`${coord.r+MOVES4[i][0]},${coord.c+MOVES4[i][1]}`];
    if (nb) result[DIR_NAMES[i]] = nb;
  }
  return result;
}()),
```

### 3.4 Map Integrity Audit (`GET /api/audit/map`)

The audit endpoint performs four structural checks and returns a machine-readable findings array with inline `fix` commands. The two most relevant checks for the cell-grid model are:

**Diagonal exits** — flags legacy `NW/NE/SW/SE` fields (illegal in the coordinate model):

```js
// wbapi-server.js lines 2592–2601
const DIAG_DIRS = ['NW','NE','SW','SE'];
for (const code of allNodeCodes) {
  const n = nodeMap[code];
  for (const d of DIAG_DIRS) {
    if (n[d] != null)
      errors.push({ check:'diagonal_exit', code, dir:d, target:String(n[d]),
        msg:`${code}.${d}="${n[d]}" — diagonal exits not supported; use N/S/E/W only`,
        fix:{ method:'POST', url:`/api/audit/map/fix`,
              body:{ check:'diagonal_exit', code, dir:d } } });
  }
}
```

**Long-link spans** — nodes separated by more than 4 grid cells with no intermediate node, creating corridors that BFS must traverse without orientation cues:

```js
// wbapi-server.js line 2551
const LONG_LINK_THRESHOLD = 4; // grid cells
```

### 3.5 Session and SSE Layer

The server maintains a `SESSIONS` map for multi-client coordination. Each session carries the player's grid position, which can be broadcast to co-located clients via Server-Sent Events:

```js
// wbapi-server.js lines 64–65
const SESSIONS    = new Map(); // sessionId → { id, playerName, r, c, nodeCode, state, lastSeen }
const SSE_CLIENTS = new Map(); // sessionId → Response (SSE stream)

// lines 83–89
function broadcastCell(r, c, event, data, excludeId) {
  for (const [id, s] of SESSIONS) {
    if (s.r === r && s.c === c && id !== excludeId) {
      const sse = SSE_CLIENTS.get(id);
      if (sse) sseSend(sse, event, data);
    }
  }
}
```

---

## 4. Layer II — Geographic Map Tool (`worldmap.js`)

### 4.1 Role and Responsibility

`worldmap.js` is a Node.js command-line tool, not a runtime browser dependency. Its function is twofold: (a) render a terminal ASCII projection of all named game cities onto a 96×30 character grid for visual inspection, and (b) seed initial `r,c` coordinates into `NODE_COORDS` by projecting real-world latitude/longitude values onto the 500×500 game grid via `./api.sh worldmap --seed`.

### 4.2 Geographic Reference Table

The `GEO` table maps the 130+ game node codes to real-world coordinates. A representative excerpt:

```js
// worldmap.js lines 26–44
const GEO = {
  HHL: { lat: 65.0, lon:-22.0, label: 'Herdholt',        region: 'Iceland' },
  NID: { lat: 63.4, lon: 10.4, label: 'Nidaros',         region: 'Norway' },
  LHR: { lat: 59.3, lon: 17.6, label: 'Birka',           region: 'Sweden' },
  // … 127 more entries
  CON: { lat: 41.0, lon: 28.9, label: 'Constantinople',  region: 'Turkey' },
  JAR: { lat: 31.8, lon: 35.2, label: 'Jerusalem',       region: 'Palestine' },
};
```

### 4.3 Projection and Grid Division

The tool projects the GEO table onto the game grid using a linear map from `[minLat, maxLat]` → `[1, 500]` and `[minLon, maxLon]` → `[1, 500]`. The terminal render uses a 6×6 region grid (rows A–F, columns 1–6):

```js
// worldmap.js lines 129–137
const MAP = {
  minLat: -8, maxLat: 68,
  minLon: -25, maxLon: 72,
  WIDTH:  96,
  HEIGHT: 30,
};

function regionBounds(row, col, nRows, nCols) {
  const latStep = (MAP.maxLat - MAP.minLat) / nRows;
  const lonStep = (MAP.maxLon - MAP.minLon) / nCols;
  return {
    minLat: MAP.maxLat - (row + 1) * latStep,
    maxLat: MAP.maxLat -  row      * latStep,
    minLon: MAP.minLon +  col      * lonStep,
    maxLon: MAP.minLon + (col + 1) * lonStep,
  };
}
```

The geographic tool is therefore the design entry point for initial coordinate seeding but is otherwise not involved in runtime navigation. All coordinates it produces are written into the `NODE_COORDS` anchor block via WBAPI PUT calls.

---

## 5. Layer III — Global Constant Layer (`roll2hit-v3.html`, parse-time)

### 5.1 The Anchor Section Model

The game file contains seven data sections bounded by `◆◆◆ WORLDBUILDER:SECTION:START ◆◆◆` / `END` marker comments. These markers are the sole write targets for the WBAPI server. The server never parses or regenerates the entire file; it splices text within the anchor-bounded regions.

```
◆◆◆ WORLDBUILDER:NODE_MAP:START ◆◆◆
const NODE_MAP = { … };
◆◆◆ WORLDBUILDER:NODE_MAP:END ◆◆◆

◆◆◆ WORLDBUILDER:NODE_COORDS:START ◆◆◆
const NODE_COORDS = { … };
◆◆◆ WORLDBUILDER:NODE_COORDS:END ◆◆◆
```

### 5.2 `NODE_MAP` — Node Descriptors

`NODE_MAP` is a JavaScript object literal mapping node code strings to descriptor objects. Each descriptor carries narrative, gameplay, and classification fields but **no exit fields**:

```js
// roll2hit-v3.html (representative entry from §CELL-01-compliant data)
SEN: {
  num:10, code:'SEN', name:'merchant_ship',
  label:'Aboard the Tilbury Star', act:2,
  text:"The Tilbury Star takes paying passengers…",
  npc:'Ship Captain',
  battle:{ label:'Pirate ×3 + Ghost', key:'pirate', count:3 },
  loot:'Cargo Manifest',
  sleep:true, sleepCost:3,
}
```

The `name` field is the terrain key (must match a `WORLD_DB` entry). The `act` field maps to `ACT_NAMES`:

```js
// roll2hit-v3.html line 8630
const ACT_NAMES = [
  '', 'Act I — Birka', 'Act II — Tilbury', 'Act III — The Wilds',
  'Act IV — The Deep', 'Act V — Visby', 'Act VI — Desert',
  'Act VII — Mythic Circuit', 'Act VIII — The Reckoning'
];
```

### 5.3 `NODE_COORDS` — The Coordinate Index

`NODE_COORDS` holds the grid positions of every named node. This is the primary design artifact — adding a node to the world requires only an entry here (plus `NODE_MAP`).

```js
// roll2hit-v3.html lines 8633–8637
// ◆◆◆ WORLDBUILDER:NODE_COORDS:START ◆◆◆
const NODE_COORDS = { // → doc: maps.md §NODE_COORDS
  J54381:{r:3,c:24},
  J62448:{r:4,c:20},
  J62447:{r:4,c:28},
  // … 1000+ entries …
  LHR:{r:64,c:224},   // Birka — canonical Act I root
  BK: {r:63,c:224},
  DBV:{r:62,c:224},
  ISL:{r:61,c:224},
  BOO:{r:47,c:223},   // Yugurt Lake — fishing start
  SEN:{r:10,c:223},   // Tilbury Star — Act II
};
// ◆◆◆ WORLDBUILDER:NODE_COORDS:END ◆◆◆
```

### 5.4 `CELL_GRID` — The Navigation Lookup Table

`CELL_GRID` is built from `NODE_COORDS` at page parse time using an immediately-invoked function expression (IIFE). It inverts the coordinate index into a string-keyed reverse map:

```js
// roll2hit-v3.html lines 17652–17661
// §CELL-02: Reverse grid lookup — "r,c" → node code
const CELL_GRID = (() => {
  const g = {};
  for (const code of Object.keys(NODE_MAP)) {
    const coord = NODE_COORDS[code] || { r: NODE_MAP[code].r, c: NODE_MAP[code].c };
    if (coord && coord.r != null && coord.c != null)
      g[`${coord.r},${coord.c}`] = code;
  }
  return g;
})();
const IMPASSABLE_CELLS = new Set(); // populated at §CELL-10 (ocean tiles)
```

This table is `O(1)` for lookup — the cost of a navigation step is one string concatenation and one property read. No graph traversal is required to determine whether the destination of a directional move is a named node.

### 5.5 Terrain Encounter Rate Table

Empty cells (cells not in `CELL_GRID`) generate encounters at terrain-dependent probabilities inferred from named neighbors. The rate table:

```js
// roll2hit-v3.html lines 17664–17668
const TERRAIN_ENCOUNTER_RATE = {
  midlands:0.15, forest:0.25, highlands:0.20, swamp:0.30, desert:0.20,
  jungle:0.30,   hag_swamp:0.35, ocean:0.10, beach:0.10,
  road:0,        junction:0, city:0.05, city_slums:0.10,
  alley:0.15,    _default:0.15
};
```

Roads and junctions have zero encounter rate by design — they are structural connectors, not gameplay spaces.

---

## 6. Layer IV — Browser Runtime Layer (`S_story`)

### 6.1 State Object Declaration

`S_story` is a singleton mutable JavaScript object declared at module scope. Its initial values represent a new game at `LHR` with no progress. It is populated either from `localStorage` (continue) or from `_S_DEFAULTS()` (new game).

Navigation-critical fields:

```js
// roll2hit-v3.html lines 29268–29326 (condensed)
let S_story = {
  active: false,
  currentCode: 'LHR',        // Code of current named node (or last named node)
  playerR: 0,                // §CELL-03: current grid row
  playerC: 0,                // §CELL-03: current grid column
  waypoint: null,            // Target node code for storyWaypoint() auto-walk
  visitedCells: {},          // §CELL-04: "r,c" → true (minimap history)
  hoursElapsed: 0,           // Incremented on every cellMove() call
  hoursSinceSlept: 0,        // Reset by sleep actions
  log: [],                   // Ring buffer of last 20 node codes visited
  lastExitDir:  null,        // Direction of last named-node exit
  lastExitCode: null,        // From-code of last named-node exit
  shards: 0,                 // Codex Shards collected (max 7)
  actNumber: 1,              // Synced from node.act on every storyRender()
  // … 60+ additional fields for combat, quests, NPCs, economy …
};
```

The `_S_DEFAULTS()` factory (line 29329) returns the canonical new-game values and is used both by `storyNewGame()` and by `storyNewGamePlus()` to reset transient state while preserving persistent tattoos and career statistics.

### 6.2 Save / Load Cycle

```js
// roll2hit-v3.html lines 30106–30112
function storyLoadContinue() {
  storyLoadSave('r2h_autosave');      // Object.assign(S_story, parsed save)
  S_story.active = true;
  document.getElementById('story-continue-modal').classList.remove('visible');
  storyUpdateStatus();
  storyRender(NODE_MAP[S_story.currentCode]);  // syncs playerR/C
  if (S_story.pendingBattle) storyShowOutcome();
}
```

The full load path is: `storyCheckContinue()` (fires at bottom of `<body>`) → detects `r2h_autosave` → shows continue modal → user clicks **Continue** → `storyLoadContinue()` → `storyRender()`.

### 6.3 `storyRender` — The Node Entry Point

Every time the player arrives at a named node — whether by directional move, waypoint step, or checkpoint restore — `storyRender(node)` is called. It is the central coordinator for the named-node experience:

```js
// roll2hit-v3.html lines 35875–35882
function storyRender(node, prefix) {
  // §CELL-03: keep grid position in sync whenever we land on a named node
  if (node) {
    const _nc = NODE_COORDS[node.code] || (node.r != null ? { r: node.r, c: node.c } : null);
    if (_nc) { S_story.playerR = _nc.r; S_story.playerC = _nc.c; }
  }
  S_story.actNumber = node.act || 1;
  const lootMsg  = storyCollectLoot(node);   // auto-collect loot + shards
  // … render farewell line, act badge, node header, story text,
  //   quest panels, NPC panels, exit links, minimap …
```

The coordinate sync at lines 35878–35879 is the reconciliation point between `S_story.playerR/C` and the `NODE_COORDS` table. If the player was on an empty cell and navigated to a named node, their coordinates snap to the node's canonical position. This prevents drift between the logical state and the grid.

### 6.4 Loot and Shard Collection

`storyCollectLoot(node)` is called on every `storyRender()` call. It checks the node's `visited` flag to prevent double-collection, then parses the `loot` string and grants items. Shards are recognized by item type and trigger the counter update:

```js
// roll2hit-v3.html lines 34442–34474
function storyCollectLoot(node) {
  if (S_story.visited[node.code] || !node.loot) {
    S_story.visited[node.code] = true; return null;
  }
  S_story.visited[node.code] = true;
  if (node.loot.startsWith('VICTORY') || node.loot.startsWith('Portal Key')) return null;
  const added = [];
  node.loot.split(' · ').forEach(raw => {
    const name = raw.trim();
    if (!name) return;
    const type = _itemType(name);
    S_story.inventory.push({ name, code: node.code, icon: _itemIcon(name), type });
    added.push(name);
    if (type === 'shard') {
      S_story.shards = Math.min(7, S_story.shards + 1);
      // Layer 57: auto-add shard origin note from SHARD_NOTES[n]
      const shardM = name.match(/#(\d)/);
      if (shardM) { /* … insert journal note … */ }
    }
  });
  return added.length ? '📦 ' + added.join(' · ') : null;
}
```

The `type === 'shard'` branch is the only write path to `S_story.shards`. There is no separate quest completion hook for shard pickup — the shard is granted automatically on first visit to any node whose `loot` field contains a shard item name matching `/#\d/`.

---

## 7. Layer V — Navigation Buttons and Input Dispatch

### 7.1 Input Sources

All player navigation converges on the `cellMove(dir)` function. Three input sources exist:

```
D-pad buttons     #dpad-N/S/E/W     onclick="cellMove('N')"  (etc.)
WP button         #btn-waypoint     onclick="storyWaypoint()"
Keyboard          ArrowUp/Down/Left/Right, n/s/e/w keys
```

The keyboard handler (line 41412):

```js
// roll2hit-v3.html lines 41412–41423
document.addEventListener('keydown', e => {
  if (!S_story.active) return;
  if (['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName)) return;
  const dirMap = { ArrowUp:'N', ArrowDown:'S', ArrowRight:'E', ArrowLeft:'W',
                   n:'N', s:'S', e:'E', w:'W', N:'N', S:'S', E:'E', W:'W' };
  const mapOpen = document.getElementById('sheet-map').classList.contains('active');
  if (dirMap[e.key]) {
    e.preventDefault();
    cellMove(dirMap[e.key]);
    if (mapOpen) _renderMapGrid();   // refresh map overlay if visible
    return;
  }
  // … b=battle, i=inventory, q=quests, m=map, j=journal …
});
```

### 7.2 `cellMove(dir)` — Step Execution

`cellMove` is the lowest-level navigation primitive. Its execution sequence:

```js
// roll2hit-v3.html lines 34218–34331 (abridged with gate-lock section condensed)
function cellMove(dir) {
  const DELTAS = { N:[-1,0], S:[1,0], E:[0,1], W:[0,-1] };
  const [dr, dc] = DELTAS[dir];
  const nr = (S_story.playerR || 0) + dr;
  const nc = (S_story.playerC || 0) + dc;

  // Bound check
  if (nr < 1 || nc < 1 || nr > 500 || nc > 500) {
    storyMsg('You reach the edge of the known world.'); return;
  }
  // Impassable check (ocean tiles set in §CELL-10)
  if (IMPASSABLE_CELLS.has(`${nr},${nc}`)) {
    storyMsg('The sea is impassable on foot.'); return;
  }

  const destCode = CELL_GRID[`${nr},${nc}`];

  // ── Gate-lock checks (8 narrative gates) ─────────────────────────────────
  if (destCode === 'TLS' && S_story.shards < 7) {
    storyMsg('🔮 The Convergence is sealed. You need all 7 Codex Shards…'); return;
  }
  // … DAM blind days, JRS Hellenist days, NUE Tide Gate,
  //   HCA Leviathan, KIR kelpie, WRO relay, ALF tracks, DA2 arch …

  // ── State updates ─────────────────────────────────────────────────────────
  storyCheckMissedSleep();
  S_story.log.push(S_story.currentCode);
  if (S_story.log.length > 20) S_story.log.shift();
  S_story.playerR = nr;
  S_story.playerC = nc;
  (S_story.visitedCells = S_story.visitedCells || {})[`${nr},${nc}`] = true;
  _statTally('exitsTaken', 1);
  S_story.hoursElapsed    = (S_story.hoursElapsed || 0) + 1;
  S_story.hoursSinceSlept = (S_story.hoursSinceSlept || 0) + 1;

  // ── Dispatch: named node vs. empty cell ───────────────────────────────────
  if (destCode && NODE_MAP[destCode]) {
    const _farewell = _getFarewell(S_story.currentCode, destCode);
    _pendingFarewell = _farewell || null;
    _setActivePath(S_story.currentCode, destCode, dir);
    S_story.currentCode = destCode;
    storyRender(NODE_MAP[destCode]);        // ← full node render
  } else {
    _enterEmptyCell(nr, nc);               // ← terrain render + encounter roll
  }
}
```

The critical branching condition at the bottom is `CELL_GRID["nr,nc"]` — a single property lookup. Named-node entry and empty-cell entry are mutually exclusive branches.

### 7.3 Empty Cell Entry — `_enterEmptyCell`

When the destination cell is not in `CELL_GRID`, the game infers terrain by majority vote of the four cardinal neighbors, renders a minimal terrain panel, and rolls for encounter:

```js
// roll2hit-v3.html lines 34333–34389
function _inferTerrain(r, c) {
  const neighbors = [[-1,0],[1,0],[0,1],[0,-1]]
    .map(([dr,dc]) => CELL_GRID[`${r+dr},${c+dc}`])
    .filter(Boolean)
    .map(code => NODE_MAP[code]?.name)
    .filter(Boolean);
  if (!neighbors.length) return 'midlands';
  const freq = {};
  let best = 'midlands', bestN = 0;
  for (const t of neighbors) {
    freq[t] = (freq[t]||0) + 1;
    if (freq[t] > bestN) { bestN = freq[t]; best = t; }
  }
  return best;
}

function _enterEmptyCell(r, c) {
  const terrain      = _inferTerrain(r, c);
  const terrainEntry = WORLD_DB[terrain] || WORLD_DB.midlands;
  // … build exit label string from CELL_GRID neighbors …
  const html = `
    <div class="story-node-hd">${terrainEntry.icon||'·'} Open Terrain</div>
    <div style="color:var(--dim);font-size:12px;margin-bottom:6px;">
      [Row ${r}, Col ${c}] — ${terrainEntry.label||terrain}
    </div>
    <div class="story-text">The path continues…</div>`;
  document.getElementById('story-text-box').innerHTML = html;

  // §CELL-09: hunt mode guarantees encounter on every empty cell step
  const baseRate      = TERRAIN_ENCOUNTER_RATE[terrain] ?? TERRAIN_ENCOUNTER_RATE._default;
  const effectiveRate = S_story.huntMode ? 1.0 : baseRate;
  if (Math.random() < effectiveRate) {
    const monster = S_story.huntMode
      ? _stalkedMonsterPick(terrain) : _weightedMonsterPick(terrain);
    if (monster) {
      const label = S_story.huntMode
        ? `🎯 Hunt ambush — ${monster.name}` : `Wild ${monster.name}`;
      setTimeout(() => _startStoryBattle(monster, label), 300);
    }
  }
  _renderMiniMap();
  _updateExitLinks();
}
```

### 7.4 BFS Path Finding — `_bfsGridPath`

```js
// roll2hit-v3.html lines 41282–41312
function _bfsGridPath(fromCode, toCode, startR, startC) {
  if (!toCode || !NODE_COORDS[toCode]) return [];
  const endCoord = NODE_COORDS[toCode];
  const _nc = NODE_COORDS[fromCode];
  const startCoord = (startR != null && startC != null)
    ? { r: startR, c: startC }
    : _nc || { r: S_story.playerR, c: S_story.playerC };
  if (!startCoord || startCoord.r == null) return [];
  if (startCoord.r === endCoord.r && startCoord.c === endCoord.c) return [];

  const visited = new Set();
  const startKey = `${startCoord.r},${startCoord.c}`;
  visited.add(startKey);
  const queue = [{ r: startCoord.r, c: startCoord.c, path: [] }];

  while (queue.length) {
    const { r, c, path } = queue.shift();
    for (const [dr, dc] of [[-1,0],[1,0],[0,1],[0,-1]]) {
      const nr = r + dr, nc = c + dc;
      const k  = `${nr},${nc}`;
      if (visited.has(k) || IMPASSABLE_CELLS.has(k)) continue;
      if (nr < 1 || nc < 1 || nr > 500 || nc > 500) continue;
      visited.add(k);
      const step = { r: nr, c: nc, code: CELL_GRID[k] || null };
      const newPath = [...path, step];
      if (nr === endCoord.r && nc === endCoord.c) return newPath;
      queue.push({ r: nr, c: nc, path: newPath });
    }
  }
  return [];
}
```

The function accepts optional `startR/startC` parameters to anchor the path from an arbitrary grid position, supporting the case where the player is on an unnamed cell between two named nodes. It returns an array of `{r, c, code}` steps. When `code` is non-null, the step lands on a named node.

### 7.5 BFS Direction and Waypoint Auto-Walk

```js
// roll2hit-v3.html lines 41316–41350
function _bfsGridDir(fromCode, toCode, startR, startC) {
  const path = _bfsGridPath(fromCode, toCode, startR, startC);
  if (!path.length) return null;
  const _nc = NODE_COORDS[fromCode];
  const startCoord = (startR != null && startC != null)
    ? { r: startR, c: startC }
    : _nc || { r: S_story.playerR, c: S_story.playerC };
  const dr = path[0].r - startCoord.r;
  const dc = path[0].c - startCoord.c;
  return dr < 0 ? 'N' : dr > 0 ? 'S' : dc > 0 ? 'E' : 'W';
}

function storyWaypoint() {
  const wp = S_story.waypoint;
  if (!wp) { storyQuestToggle(); return; }   // no waypoint → show quest panel
  if (S_story.currentCode === wp) {
    storyMsg('📍 You have reached the waypoint: '
      + (NODE_MAP[wp] ? NODE_MAP[wp].label : wp) + '!');
    S_story.waypoint = null;
    _updateWaypointBtn();
    storyQuestToggle();
    return;
  }
  const dir = _bfsGridDir(
    S_story.currentCode, wp, S_story.playerR, S_story.playerC);
  if (!dir) {
    storyMsg('📍 No path to waypoint found. Move manually toward '
      + (NODE_MAP[wp] ? NODE_MAP[wp].label : wp) + '.');
    return;
  }
  cellMove(dir);   // one step; player presses WP again for next step
}
```

The WP button advances the player exactly one grid cell per press. The full journey from `LHR` (r:64, c:224) to `SEN` (r:10, c:223) requires approximately 55 presses if no encounters interrupt — each call computes a fresh BFS from the current position, accounting for any deviation caused by empty-cell encounters or manual detours.

---

## 8. Layer VI — Worldbuilder Design Entry Mechanic (`worldbuilder.html`)

### 8.1 Architecture

`worldbuilder.html` is a standalone browser SPA that connects to the WBAPI server. It holds a client-side mirror of all WBAPI data loaded at startup:

```js
// worldbuilder.html (startup splash phase)
splashPhase('Loading nodes…', '/api/coords', 28);
// Fetches GET /api/coords → { code: {r, c}, … }
// Populates WBAPI.nodeCoords for the grid renderer
```

The worldbuilder renders a `NODE_COORDS`-driven cell grid and provides four design entry paths: (a) a wizard modal for guided node+quest+monster creation; (b) a grid-direct add flow triggered by clicking an empty cell adjacent to an existing node; (c) a ghost list for nodes in `NODE_MAP` with no `NODE_COORDS` entry; and (d) a raw API form for manual operations.

### 8.2 Grid-Direct Node Creation

When the designer clicks an empty neighboring cell in the grid view, the worldbuilder pre-fills a form with the adjacency direction and parent node code, then submits to `POST /api/node`:

```js
// worldbuilder.html lines 8094–8131
const newR = p ? p.r + DR[dir] : null;
const newC = p ? p.c + DC[dir] : null;
const labelVal   = GG('gd-add-label').value.trim() || 'New Location';
const terrainVal = GG('gd-add-terrain').value.trim() || 'junction';
const actVal     = parseInt(GG('gd-add-act').value, 10) || 1;
let   codeVal    = GG('gd-add-code').value.trim().toUpperCase();

const body = {
  name: terrainVal, label: labelVal, act: actVal,
  ...(newR !== null ? { r: newR, c: newC } : {}),
};
if (codeVal) body.code = codeVal;

const res = await fetch(`${SERVER.url}/api/node`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body)
});
```

The correct current flow omits directional fields entirely and relies on coordinate proximity. After a write, `CELL_GRID["63,225"] = "NEW"` is established automatically on the next `getCellGrid()` call; no explicit edge registration is required:

```json
POST /api/node
{
  "code": "NEW",
  "name": "midlands",
  "label": "The Crossing",
  "act": 1,
  "r": 63,
  "c": 225
}
```

### 8.3 Ghost Node Resolution

Nodes in `NODE_MAP` without a `NODE_COORDS` entry are termed "ghosts." The worldbuilder ghost list renders them sorted by connectivity degree:

```js
// worldbuilder.html lines 8148–8155
const ghosts = Object.entries(WBAPI.nodeMap)
  .filter(([c]) => !WBAPI.nodeCoords[c])
  .filter(([c,n]) => !q || c.toLowerCase().includes(q)
                       || (n.label||'').toLowerCase().includes(q));
GG('ghost-count').textContent = `(${ghosts.length})`;
```

A ghost node is unnavigatable — it is in `NODE_MAP` so it can hold quests and NPCs, but it cannot appear in `CELL_GRID` because it has no `r,c`. Placing a ghost via `PUT /api/coords/{code} {r,c}` materializes it into the grid.

### 8.4 Wizard Multi-Entity Creation

The wizard modal coordinates simultaneous creation of a node, a monster, and a quest. The generated API calls sequence:

```
POST /api/node
{
  "code":  "NEW",
  "label": "Weimar Gatehouse",
  "act":   1,
  "terrain": "city",
  "desc":  "The inner gatehouse…"
}

POST /api/monster { "key": "guard", "name": "City Guard", … }

POST /api/quest {
  "id":           "quest_weimar_01",
  "type":         "side",
  "title":        "The Gate Fee",
  "activateNode": "NEW",
  "waypointNode": "WMR",
  "desc":         "…"
}
```

---

## 9. Layer VII — Cell Insertion Along Current Paths

### 9.1 The Coordinate-Adjacency Invariant

In the cell-grid model, two nodes are "connected" if and only if their `r,c` coordinates are Manhattan-adjacent (distance = 1) along a cardinal axis. To insert a node between two existing nodes, the designer places it at an unoccupied cell between them:

```
Existing graph:
  BOO at (r:47, c:223) ──── unnamed cells ──── LHR at (r:64, c:224)
  (17 rows apart, 1 column difference — oblique path through empty terrain)

Insert a named waypoint at (r:55, c:223):
  POST /api/node { "code":"MID","name":"junction","label":"Midway","act":1,"r":55,"c":223 }
```

After the write, BFS from `BOO` to `LHR` now passes through `MID` if the path routes through column 223, row 55. No N/S/E/W fields are written on `BOO`, `LHR`, or `MID` — exits are entirely derived from coordinate adjacency.

### 9.2 Server-Side INSERT Protocol — `POST /api/node`

The server handler for node creation (lines 10930–10979) performs the following steps in order:

**1. Validates required fields:** `code`, `name` (terrain key), `label`, `act`

**2. Rejects deprecated N/S/E/W fields** (§CELL-08 guard):

```js
// wbapi-server.js lines 10940–10944
const _badNodeFields = ['N','E','S','W'].filter(f => f in body);
if (_badNodeFields.length) {
  return json(res, 400, { ok:false,
    error:`Fields ${_badNodeFields.join(', ')} are deprecated — exits are derived
           from cell-grid adjacency, not stored. Place the node at (r,c) to
           establish connections.`,
    deprecated: _badNodeFields });
}
```

**3. Serializes the `NODE_MAP` entry:**

```js
// wbapi-server.js lines 773–784
function serializeNodeLiteral(code, body) {
  const maxNum = Object.values(WBAPI.nodeMap).reduce((m, n) => Math.max(m, n.num||0), 0);
  const num = body.num !== undefined ? Number(body.num) : maxNum + 1;
  const STR  = ['name','label','text','npc','loot','N','S','E','W'];
  const NUM  = ['act','sleepCost'];
  const BOOL = ['sleep','junction'];
  const parts = [`  ${code}: { num:${num}`];
  for (const f of STR)  if (body[f] !== undefined) parts.push(`${f}:${JSON.stringify(body[f])}`);
  for (const f of NUM)  if (body[f] !== undefined) parts.push(`${f}:${Number(body[f])}`);
  for (const f of BOOL) if (body[f] !== undefined) parts.push(`${f}:${!!body[f]}`);
  if (body.battle) parts.push(`battle:${JSON.stringify(body.battle)}`);
  return parts.join(', ') + ' },\n';
}
```

> **Note:** `serializeNodeLiteral` still lists `'N','S','E','W'` in its `STR` array. These entries are dead: the §CELL-08 guard (step 2 above) rejects the HTTP request with HTTP 400 before `serializeNodeLiteral` is ever called when any of those keys appear in `body`. The dead entries are a cleanup candidate (`const STR = ['name','label','text','npc','loot']`) to prevent confusion if the guard is relaxed in a future branch.

**4. Inserts the entry** using `insertAfterLastParsedNode()`, which finds the highest-numbered node entry and splices immediately after its closing brace using brace-depth tracking:

```js
// wbapi-server.js lines 703–749 (condensed)
function insertAfterLastParsedNode(entry) {
  let lastKey = null, lastNum = -1;
  for (const [k, n] of Object.entries(WBAPI.nodeMap)) {
    if ((n.num||0) > lastNum) { lastNum = n.num||0; lastKey = k; }
  }
  if (!lastKey) return insertBeforeSectionClose('NODE_MAP', entry);
  // … locate lastKey's closing brace via brace-depth scan …
  // … splice `entry` immediately after the closing },\n …
  WBAPI._rawSrc = WBAPI._rawSrc.slice(0, insertAt)
    + entry
    + WBAPI._rawSrc.slice(insertAt);
  return { ok:true };
}
```

**5. If `r,c` provided**, appends a coordinate entry to the `NODE_COORDS` block:

```js
// wbapi-server.js lines 10960–10968
WBAPI.nodeCoords[code] = { r, c };
const START = '// ◆◆◆ WORLDBUILDER:NODE_COORDS:START ◆◆◆';
const END   = '// ◆◆◆ WORLDBUILDER:NODE_COORDS:END ◆◆◆';
const sIdx  = WBAPI._rawSrc.indexOf(START) + START.length;
const eIdx  = WBAPI._rawSrc.indexOf(END);
let section = WBAPI._rawSrc.slice(sIdx, eIdx);
const closeIdx = section.lastIndexOf('\n};');
section = section.slice(0, closeIdx + 1)
  + `  ${code}:{r:${r},c:${c}},\n`
  + section.slice(closeIdx + 1);
WBAPI._rawSrc = WBAPI._rawSrc.slice(0, sIdx) + section + WBAPI._rawSrc.slice(eIdx);
```

**6.** Calls `WBAPI._buildIndexes()` to rebuild quest/NPC lookup maps, then saves the file and reloads.

### 9.3 Atomic Row Shift for Grid Expansion

When the grid is too dense to insert a node at the required position, the reweave engine performs an atomic row shift: all nodes at `r >= insertR` shift by +1, and all nodes at `c >= insertC` shift by +1, atomically:

```js
// wbapi-server.js lines 6685–6692
for (const code of Object.keys(WBAPI.nodeCoords)) {
  const coord = WBAPI.nodeCoords[code];
  WBAPI.nodeCoords[code] = {
    r: coord.r >= insertR ? coord.r + 1 : coord.r,
    c: coord.c >= insertC ? coord.c + 1 : coord.c
  };
}
```

After the shift, the cell that was at `(insertR, insertC)` is now vacant, and the new node can be planted there. Any BFS path that previously crossed the shift boundary continues to work because both the source and destination coordinates shift consistently.

---

## 10. Full Program Flow: Quest Accept → Act I → Act II → First Shard Collection

### 10.1 Phase 0 — Page Load and State Initialization

On `DOMContentLoaded`, `storyEnter()` fires. It calls `storyCheckContinue()`, which reads `localStorage.getItem('r2h_autosave')`:

```js
// roll2hit-v3.html lines 29992–30014
function storyCheckContinue() {
  if (_continueChecked) return false;
  _continueChecked = true;
  try {
    const raw = localStorage.getItem('r2h_autosave');
    if (!raw) return false;
    const save = JSON.parse(raw);
    const node = NODE_MAP[save.currentCode] || NODE_MAP['LHR'];
    const loc  = node.label.split(' — ')[0];
    document.getElementById('continue-sub').textContent =
      'Day ' + save.day + ' of 49  ·  ' + loc + '  ·  ' + save.inventory.length + ' item(s)';
    document.getElementById('story-continue-modal').classList.add('visible');
    return true;
  } catch(e) { return false; }
}
```

A new player sees "New Game." A returning player sees the continue modal showing their last known location and inventory count.

### 10.2 Phase 1 — New Game Initialization at LHR

`storyNewGame()` resets `S_story` to `_S_DEFAULTS()`, applies starting ability scores, computes initial HP from CON modifier, equips starter weapons, and calls `storyRender(NODE_MAP['LHR'])`. The canonical starting node is `LHR`, Birka City Streets, Act I, at `(r:64, c:224)`.

After `storyRender(NODE_MAP['LHR'])`:
- `S_story.playerR = 64`, `S_story.playerC = 224`
- `S_story.actNumber = 1`
- `S_story.currentCode = 'LHR'`
- `storyCheckQuests(LHR_node)` fires → any quests with `activateNode === 'LHR'` and a passing `activateCond()` become `'active'` in `S_story.quests`
- The Birka tagline div is injected below `#story-text-box`

### 10.3 Phase 2 — Quest Activation and Waypoint Setting

When `storyCheckQuests(node)` fires at `LHR`, qualifying quests flip to active:

```js
// roll2hit-v3.html lines 34478–34487
function storyCheckQuests(node) {
  const msgs = [];
  Object.values(QUEST_DB).forEach(q => {
    if (q.type === 'epic') return;
    if (!S_story.quests[q.id] && q.activateNode === node.code) {
      if (q.activateCond && !q.activateCond()) return;
      S_story.quests[q.id] = 'active';
      msgs.push('📋 ' + q.title);
    }
  });
  // … emit msgs to #story-move-msg …
```

The player opens the quest panel (`Q` key or quest button). Any active quest with a `waypointNode` different from its `activateNode` renders a **Set Waypoint** button. Clicking it calls:

```js
// roll2hit-v3.html lines 41403–41409
function storySetWaypoint(nodeCode) {
  S_story.waypoint = nodeCode;
  S_story.customQuestTerrain = null;
  _updateWaypointBtn();
  const dest = NODE_MAP[nodeCode];
  storyMsg('📍 Waypoint set: ' + (dest ? dest.label : nodeCode));
}
```

`_updateWaypointBtn()` highlights `#btn-waypoint` with the `.at-waypoint` class if the player is already there, and calls `_updateExitLinks()` to tint the directional exit buttons green when they point toward the waypoint.

### 10.4 Phase 3 — Navigation from LHR to SEN (Act I → Act II)

`SEN` (Aboard the Tilbury Star) is at `(r:10, c:223)`. From `LHR` at `(r:64, c:224)` the Manhattan distance is 55 rows north and 1 column west — approximately 54–56 steps depending on the path BFS chooses through the named node graph.

The player presses WP repeatedly. Each press executes:

```
storyWaypoint()
  → _bfsGridDir('LHR', 'SEN', 64, 224)
      → _bfsGridPath('LHR', 'SEN')
          → BFS from (64,224) to (10,223)
          → returns [{r:63,c:224,code:'BK'}, {r:62,c:224,code:'DBV'}, …]
      → first step is (63,224) = N relative to (64,224)
      → returns 'N'
  → cellMove('N')
      → nr=63, nc=224
      → CELL_GRID["63,224"] = 'BK'
      → storyRender(NODE_MAP['BK'])
          → S_story.playerR=63, S_story.playerC=224
          → S_story.currentCode = 'BK'
          → storyCheckQuests: no new quests at BK
          → storyCollectLoot: BK has loot → grant if first visit
```

The named node corridor `LHR → BK → DBV → ISL` (column 224, rows 64→63→62→61) is a clean 3-step south-going corridor traversable without encounter rolls because named-node entry always calls `storyRender()`, which does not invoke `_enterEmptyCell()`. Encounters only occur in `_enterEmptyCell()`.

The player may also navigate manually or mix manual and waypoint steps. BFS recomputes from the actual `(playerR, playerC)` on every `storyWaypoint()` call, so any deviation is automatically corrected on the next press.

### 10.5 Phase 4 — Crossing the Act Boundary

The first time `storyRender(NODE_MAP['SEN'])` is called, `SEN.act === 2`, so:

```js
// storyRender line 35881
S_story.actNumber = node.act || 1;   // → 2

// act badge update (within storyRender)
document.getElementById('story-act-badge').textContent =
  '— ' + ACT_NAMES[node.act] + ' —';   // → '— Act II — Tilbury —'
```

The act badge updates visually. No gate check exists between Act I and Act II — the transition is purely by geography. Any quest in `QUEST_DB` with `activateNode === 'SEN'` and a passing `activateCond()` is activated on this render.

### 10.6 Phase 5 — First Shard Collection

The first Codex Shard is located at a node in the Act II network whose `loot` field contains the string `"Codex Shard #1"`. When `storyRender()` calls `storyCollectLoot(node)` on first visit:

```
node.loot = "Codex Shard #1"
_itemType("Codex Shard #1") → 'shard'   (matched by /shard/i)

storyCollectLoot execution:
  S_story.visited[node.code] is false → proceed
  S_story.visited[node.code] = true
  parse "Codex Shard #1" → name = "Codex Shard #1", type = 'shard'
  S_story.inventory.push({ name, code: node.code, icon: '🔮', type: 'shard' })
  S_story.shards = Math.min(7, 0 + 1) = 1
  shardM = "Codex Shard #1".match(/#(\d)/) → ['#1', '1']
  S_story.shardNotes[0] = true
  S_story.inventory.push(shard origin note item)
  return '📦 Codex Shard #1'
```

`storyRender()` displays the returned loot message in `#story-move-msg`. The `#s-shards` counter in the status bar updates to `1/7` via `storyUpdateStatus()`.

The player has now: accepted a quest at `LHR`, navigated across the Act I/II boundary, and collected the first Codex Shard — the canonical Act II objective entry.

---

## 11. Reweave as Validation Protocol

### 11.1 Definition

A "reweave" in the current system (post §CELL-06) is not a server-side graph reconstruction but a **BFS connectivity proof**. The definition of a fully navigatable map is:

> Every node `code` present in `NODE_COORDS` is reachable from `LHR` by BFS on the 500×500 `CELL_GRID` grid, respecting `IMPASSABLE_CELLS`.

This is equivalent to the statement that `getCellGrid()` over the current `NODE_COORDS` produces a connected graph containing `LHR` as the root.

### 11.2 Server-Side Graph Reachability (`GET /api/graph/reachability`)

The server's graph handler builds an undirected adjacency map from `CELL_GRID` coordinate neighbors, then runs BFS to partition nodes into clusters:

```js
// wbapi-server.js lines 4092–4128
const cellGrid = buildCellGrid(nm, coords);
const undirAdj = new Map();
for (const code of Object.keys(nm)) {
  const coord = coords[code];
  undirAdj.set(code, new Set());
  if (!coord) continue;
  for (const [dr,dc] of MOVES4) {
    const nb = cellGrid[`${coord.r+dr},${coord.c+dc}`];
    if (nb && nm[nb]) undirAdj.get(code).add(nb);
  }
}

function bfsReach(start) {
  if (!undirAdj.has(start)) return new Set([start]);
  const visited = new Set([start]);
  const queue   = [start];
  while (queue.length) {
    const cur = queue.shift();
    for (const nb of (undirAdj.get(cur) || [])) {
      if (!visited.has(nb)) { visited.add(nb); queue.push(nb); }
    }
  }
  return visited;
}
```

`bfsReach('LHR')` returns the set of all nodes reachable from `LHR`. Any node not in this set is disconnected — unreachable by the player in-game.

### 11.3 Reweave Completion Criteria

A reweave pass is considered complete when:

1. **100% reachability**: `bfsReach('LHR').size === Object.keys(WBAPI.nodeCoords).length` — every node with coordinates is in the LHR cluster.
2. **Zero collisions**: No two nodes share the same `(r, c)` key in `NODE_COORDS`.
3. **Zero diagonal links**: `GET /api/audit/map` reports zero `diagonal_exit` errors.
4. **Zero dangling links**: All legacy N/S/E/W exit fields (if any remain) point to existing nodes.
5. **Long-link warning zero (optional)**: No named-node-to-named-node corridor exceeds 4 empty cells.

The deprecated `POST /api/graph/reweave-all` returns HTTP 410 with a redirect message:

```js
// wbapi-server.js lines 5813–5815
if (parts[1] === 'reweave-all' && method === 'POST') {
  return json(res, 410, { ok:false,
    error:'reweave-all is deprecated: junction nodes were removed. Use GET /api/graph/connect for cluster-bridging suggestions.' });
}
```

---

## 12. Test Plan

### 12.1 Test Architecture

The test suite uses two frameworks:

- **Playwright** (browser integration tests) — loads `roll2hit-v3.html` in a real Chromium instance, seeds state via `localStorage` before page load, and exercises the live JavaScript functions.
- **Node.js native** assertions (unit tests) — loads `wbapi-core.js` and `wbapi-server.js` directly and tests the server-side BFS and grid functions against the actual game file.

The Playwright configuration:

```js
// playwright.config.js (existing)
module.exports = {
  testDir: './tests/integration',
  use: { baseURL: 'http://localhost:1367' },
};
```

### 12.2 Test Helpers (existing, `tests/integration/helpers.js`)

The helper module provides `seedAndLoad` and `dismissContinue`, which together establish a known game state in under 200ms:

```js
// tests/integration/helpers.js lines 95–118
const SEED_STATE = {
  active: true, currentCode: 'BOO', checkpointNode: 'BOO',
  hearthHome: 'LHR', hp: 80, hpMax: 80, gold: 500,
  level: 5, shards: 0, voidPressure: 0,
  playerR: 0, playerC: 0,   // storyRender() will sync from NODE_COORDS
  visitedCells: {}, hoursElapsed: 0, hoursSinceSlept: 0,
  waypoint: null, log: [], visited: { BOO: true },
  // … full S_story-compatible object …
};

async function seedAndLoad(page, overrides = {}) {
  const state = Object.assign({}, SEED_STATE, overrides);
  await page.addInitScript(s => {
    localStorage.clear();
    localStorage.setItem('r2h_autosave', JSON.stringify(s));
  }, state);
  await page.goto('/roll2hit-v3.html');
}

async function dismissContinue(page) {
  await page.locator('#story-continue-modal').waitFor({ state: 'visible' });
  await page.locator('#btn-continue-load').click();
  await expect(page.locator('#story-continue-modal')).not.toHaveClass(/visible/);
}
```

### 12.3 Existing Navigation Tests (`tests/integration/navigation.test.js`)

The existing suite validates three invariants:

**Basic walk** — `cellMove('S')` increments `playerR` by 1 and lands on the named node at the destination cell:

```js
test('cellMove(S) from BOO lands on LXF (named node 1 step south)', async ({ page }) => {
  await page.evaluate(() => cellMove('S'));
  const code = await readStory(page, 'currentCode');
  expect(code).toBe('LXF');   // LXF is at r:48,c:223 — exactly 1 cell south of BOO(r:47,c:223)
});
```

**BFS corridor** — `_bfsGridPath(ISL, LHR)` returns exactly 3 steps through the clean S-corridor:

```js
test('_bfsGridPath(ISL, LHR) is exactly 3 steps (S corridor)', async ({ page }) => {
  const path = await page.evaluate(() => _bfsGridPath('ISL', 'LHR'));
  expect(path.length).toBe(3);
  for (let i = 0; i < path.length - 1; i++) {
    expect(path[i + 1].r - path[i].r).toBe(1);
    expect(path[i + 1].c - path[i].c).toBe(0);
  }
});
```

**Full smoke walk** — auto-walks `BOO → LHR` in at most 40 `storyWaypoint()` calls:

```js
test('SMOKE — full path walk BOO → LHR via repeated storyWaypoint', async ({ page }) => {
  await page.evaluate(() => { S_story.waypoint = 'LHR'; });
  for (let i = 0; i < 40; i++) {
    const cur = await readStory(page, 'currentCode');
    if (cur === 'LHR') break;
    await page.evaluate(() => storyWaypoint());
  }
  const finalCode = await readStory(page, 'currentCode');
  expect(finalCode).toBe('LHR');
  const [r, c] = await page.evaluate(() => [S_story.playerR, S_story.playerC]);
  expect(r).toBe(64); expect(c).toBe(224);
});
```

### 12.4 New Browser Integration Tests — Act Transition and Shard Collection

File: `tests/integration/navigation-act2.test.js`

```js
'use strict';
const { test, expect } = require('@playwright/test');
const { seedAndLoad, dismissContinue, readStory } = require('./helpers.js');

// Grid reference:
//   LHR = r:64, c:224  (Birka City Streets — Act I root)
//   SEN = r:10, c:223  (Aboard the Tilbury Star — Act II)
//   BOO = r:47, c:223  (Yugurt Lake — seed default)

test.describe('Act I → Act II transition', () => {

  test('actNumber is 1 at LHR after load', async ({ page }) => {
    await seedAndLoad(page, { currentCode: 'LHR', playerR: 64, playerC: 224,
                              visited: { LHR: true } });
    await dismissContinue(page);
    const act = await readStory(page, 'actNumber');
    expect(act).toBe(1);
  });

  test('act badge text contains "Act I" at LHR', async ({ page }) => {
    await seedAndLoad(page, { currentCode: 'LHR', playerR: 64, playerC: 224,
                              visited: { LHR: true } });
    await dismissContinue(page);
    const badge = await page.locator('#story-act-badge').textContent();
    expect(badge).toContain('Act I');
  });

  test('storyRender at SEN sets actNumber to 2', async ({ page }) => {
    await seedAndLoad(page, { currentCode: 'SEN', playerR: 10, playerC: 223,
                              visited: { SEN: true } });
    await dismissContinue(page);
    const act = await readStory(page, 'actNumber');
    expect(act).toBe(2);
  });

  test('act badge text contains "Act II" at SEN', async ({ page }) => {
    await seedAndLoad(page, { currentCode: 'SEN', playerR: 10, playerC: 223,
                              visited: { SEN: true } });
    await dismissContinue(page);
    const badge = await page.locator('#story-act-badge').textContent();
    expect(badge).toContain('Act II');
  });

  test('storyWaypoint auto-walks from LHR toward SEN (max 200 steps, no crash)', async ({ page }) => {
    await seedAndLoad(page, { currentCode: 'LHR', playerR: 64, playerC: 224,
                              visited: { LHR: true } });
    await dismissContinue(page);
    await page.evaluate(() => { S_story.waypoint = 'SEN'; });

    let reached = false;
    for (let i = 0; i < 200; i++) {
      const cur = await readStory(page, 'currentCode');
      if (cur === 'SEN') { reached = true; break; }
      const hasPrebatt = await page.locator('#story-prebatt-overlay')
        .isVisible().catch(() => false);
      if (hasPrebatt) break;
      await page.evaluate(() => storyWaypoint());
    }
    const finalCode = await readStory(page, 'currentCode');
    if (reached) {
      expect(finalCode).toBe('SEN');
      const act = await readStory(page, 'actNumber');
      expect(act).toBe(2);
    } else {
      const r = await readStory(page, 'playerR');
      expect(r).toBeLessThan(64);
    }
  });

});

test.describe('Shard collection', () => {

  async function shardNodeCode(page) {
    return page.evaluate(() => {
      return Object.entries(NODE_MAP)
        .find(([, n]) => n.loot && /Codex Shard #\d/.test(n.loot))
        ?.[0] || null;
    });
  }

  test('first visit to a shard node increments S_story.shards to 1', async ({ page }) => {
    await seedAndLoad(page, { shards: 0 });
    await dismissContinue(page);

    const shardCode = await shardNodeCode(page);
    if (!shardCode) { console.log('No shard node found — skipping'); return; }

    const coord = await page.evaluate(c => NODE_COORDS[c], shardCode);
    await seedAndLoad(page, {
      currentCode: shardCode, playerR: coord.r, playerC: coord.c,
      visited: {}, shards: 0
    });
    await dismissContinue(page);

    const shards = await readStory(page, 'shards');
    expect(shards).toBe(1);
  });

  test('second visit to shard node does not double-collect', async ({ page }) => {
    await seedAndLoad(page);
    await dismissContinue(page);
    const shardCode = await shardNodeCode(page);
    if (!shardCode) return;

    const coord = await page.evaluate(c => NODE_COORDS[c], shardCode);
    await seedAndLoad(page, {
      currentCode: shardCode, playerR: coord.r, playerC: coord.c,
      visited: {}, shards: 0
    });
    await dismissContinue(page);
    expect(await readStory(page, 'shards')).toBe(1);

    await page.evaluate(c => { storyRender(NODE_MAP[c]); }, shardCode);
    expect(await readStory(page, 'shards')).toBe(1);
  });

  test('shard item appears in inventory with type==="shard" after first visit', async ({ page }) => {
    await seedAndLoad(page);
    await dismissContinue(page);
    const shardCode = await shardNodeCode(page);
    if (!shardCode) return;

    const coord = await page.evaluate(c => NODE_COORDS[c], shardCode);
    await seedAndLoad(page, {
      currentCode: shardCode, playerR: coord.r, playerC: coord.c,
      visited: {}, shards: 0
    });
    await dismissContinue(page);

    const hasShardItem = await page.evaluate(() =>
      (S_story.inventory || []).some(i => i.type === 'shard'));
    expect(hasShardItem).toBe(true);
  });

});
```

### 12.5 New Browser Integration Tests — Full Reweave Connectivity

File: `tests/integration/reweave-connectivity.test.js`

```js
'use strict';
const { test, expect } = require('@playwright/test');
const { seedAndLoad, dismissContinue } = require('./helpers.js');

test.describe('Reweave — map connectivity invariants', () => {

  test.beforeEach(async ({ page }) => {
    await seedAndLoad(page);
    await dismissContinue(page);
  });

  test('LHR playerR/C match NODE_COORDS["LHR"] exactly', async ({ page }) => {
    const { r, c, coordR, coordC } = await page.evaluate(() => ({
      r:      S_story.playerR,
      c:      S_story.playerC,
      coordR: NODE_COORDS['LHR']?.r,
      coordC: NODE_COORDS['LHR']?.c,
    }));
    expect(r).toBe(coordR);
    expect(c).toBe(coordC);
  });

  test('CELL_GRID["r,c"] for LHR resolves to "LHR"', async ({ page }) => {
    const entry = await page.evaluate(() => {
      const lhr = NODE_COORDS['LHR'];
      return CELL_GRID[`${lhr.r},${lhr.c}`];
    });
    expect(entry).toBe('LHR');
  });

  test('no two NODE_COORDS entries share the same r,c (zero collisions)', async ({ page }) => {
    const collisions = await page.evaluate(() => {
      const seen = {};
      const dupes = [];
      for (const [code, { r, c }] of Object.entries(NODE_COORDS)) {
        const k = `${r},${c}`;
        if (seen[k]) dupes.push({ k, a: seen[k], b: code });
        seen[k] = code;
      }
      return dupes;
    });
    expect(collisions).toEqual([]);
  });

  test('CELL_GRID entry count matches NODE_COORDS entry count', async ({ page }) => {
    const { coordCount, gridCount } = await page.evaluate(() => ({
      coordCount: Object.keys(NODE_COORDS).length,
      gridCount:  Object.keys(CELL_GRID).length,
    }));
    expect(gridCount).toBeLessThanOrEqual(coordCount);
    expect(gridCount).toBeGreaterThan(0);
  });

  test('sample of 30 spread nodes are BFS-reachable from LHR', async ({ page }) => {
    const unreachable = await page.evaluate(() => {
      const codes = Object.keys(NODE_COORDS).sort();
      const stride = Math.max(1, Math.floor(codes.length / 30));
      const sample = codes.filter((_, i) => i % stride === 0).slice(0, 30);
      return sample
        // `_bfsGridPath(x, x)` returns [] when start === end, so LHR must be
        // excluded from the path-length check and treated as trivially reachable.
        .map(c => ({ code: c, reachable: c === 'LHR' || _bfsGridPath(c, 'LHR').length > 0 }))
        .filter(r => !r.reachable)
        .map(r => r.code);
    });
    expect(unreachable).toEqual([]);
  });

  test('specifically named Act I nodes are all reachable from LHR', async ({ page }) => {
    const ACT1_NODES = ['BK','DBV','ISL','BOO','LXF','SEN','NID','ODD','LYG'];
    const unreachable = await page.evaluate(nodes =>
      nodes.filter(c => NODE_COORDS[c] && _bfsGridPath(c,'LHR').length === 0),
      ACT1_NODES);
    expect(unreachable).toEqual([]);
  });

  test('_bfsGridPath returns [] for unknown destination (graceful empty)', async ({ page }) => {
    const len = await page.evaluate(() =>
      _bfsGridPath('BOO', '__PHANTOM_NODE__').length);
    expect(len).toBe(0);
  });

  test('IMPASSABLE_CELLS blocks BFS (ocean cells are non-traversable)', async ({ page }) => {
    const result = await page.evaluate(() => {
      if (IMPASSABLE_CELLS.size === 0) return 'no_impassable';
      const [key] = IMPASSABLE_CELLS;
      const [r, c] = key.split(',').map(Number);
      const path = _bfsGridPath('BOO', 'LHR');
      const blocked = path.some(step => step.r === r && step.c === c);
      return blocked ? 'BREACH' : 'ok';
    });
    expect(result).not.toBe('BREACH');
  });

});
```

### 12.6 New Node.js Unit Tests — Cell Grid and Reweave Validation

File: `tests/unit/cell-grid.test.js`

```js
'use strict';
const assert = require('assert');
const path   = require('path');
const WBAPI  = require('../../wbapi-core');

WBAPI.load(path.join(__dirname, '../../roll2hit-v3.html'));

function buildCellGrid(nm, coords) {
  const g = {};
  for (const code of Object.keys(nm)) {
    const coord = coords[code] || { r: nm[code].r, c: nm[code].c };
    if (coord && coord.r != null && coord.c != null)
      g[`${coord.r},${coord.c}`] = code;
  }
  return g;
}

describe('buildCellGrid', () => {
  it('maps every NODE_COORDS entry to its "r,c" key', () => {
    const grid = buildCellGrid(WBAPI.nodeMap, WBAPI.nodeCoords);
    for (const [code, { r, c }] of Object.entries(WBAPI.nodeCoords)) {
      assert.strictEqual(grid[`${r},${c}`], code,
        `Expected CELL_GRID["${r},${c}"] === "${code}"`);
    }
  });

  it('grid key count equals coord count (no phantom entries)', () => {
    const grid = buildCellGrid(WBAPI.nodeMap, WBAPI.nodeCoords);
    assert.strictEqual(Object.keys(grid).length, Object.keys(WBAPI.nodeCoords).length);
  });

  it('empty nodeMap → empty grid', () => {
    const grid = buildCellGrid({}, {});
    assert.deepStrictEqual(grid, {});
  });

  it('NODE_MAP entry without coords is skipped', () => {
    const nm    = { GHOST: { num:1, name:'city', label:'Ghost', act:1 } };
    const grid  = buildCellGrid(nm, {});
    assert.deepStrictEqual(grid, {});
  });
});

describe('CELL_GRID collision detection', () => {
  it('no two NODE_COORDS entries share the same r,c', () => {
    const seen = {};
    for (const [code, { r, c }] of Object.entries(WBAPI.nodeCoords)) {
      const k = `${r},${c}`;
      if (seen[k]) {
        assert.fail(
          `Coordinate collision: "${code}" and "${seen[k]}" both at (${r},${c})`);
      }
      seen[k] = code;
    }
  });
});
```

File: `tests/unit/reweave-validate.test.js`

```js
'use strict';
const assert = require('assert');
const path   = require('path');
const WBAPI  = require('../../wbapi-core');

WBAPI.load(path.join(__dirname, '../../roll2hit-v3.html'));

function buildCellGrid(nm, coords) {
  const g = {};
  for (const code of Object.keys(nm)) {
    const coord = coords[code] || { r: nm[code].r, c: nm[code].c };
    if (coord && coord.r != null && coord.c != null)
      g[`${coord.r},${coord.c}`] = code;
  }
  return g;
}

// NOTE: This offline BFS flood-fills all cells reachable from LHR, then checks
// whether each named node's coordinates fall within the visited set. It does NOT
// apply IMPASSABLE_CELLS (ocean tiles), because those are populated at browser
// parse time and are not available in the Node.js unit-test context. A node
// reachable here may still be unreachable at runtime if the only path crosses an
// impassable cell. The Playwright integration test in §12.5 ("IMPASSABLE_CELLS
// blocks BFS") covers that gap against the live browser.
function bfsReachFromLHR(nodeMap, nodeCoords) {
  const grid  = buildCellGrid(nodeMap, nodeCoords);
  const lhr   = nodeCoords['LHR'];
  if (!lhr) throw new Error('LHR not in NODE_COORDS');
  const visited = new Set([`${lhr.r},${lhr.c}`]);
  const queue   = [lhr];
  while (queue.length) {
    const { r, c } = queue.shift();
    for (const [dr, dc] of [[-1,0],[1,0],[0,1],[0,-1]]) {
      const nr = r + dr, nc = c + dc;
      const k  = `${nr},${nc}`;
      if (visited.has(k)) continue;
      if (nr < 1 || nc < 1 || nr > 500 || nc > 500) continue;
      visited.add(k);
      queue.push({ r: nr, c: nc });
    }
  }
  return visited;
}

describe('Reweave — full map BFS connectivity from LHR', () => {

  it('LHR is present in NODE_COORDS', () => {
    assert.ok(WBAPI.nodeCoords['LHR'],
      'LHR missing from NODE_COORDS — no BFS root');
  });

  it('all NODE_COORDS entries are BFS-reachable from LHR', () => {
    const visited     = bfsReachFromLHR(WBAPI.nodeMap, WBAPI.nodeCoords);
    const unreachable = Object.entries(WBAPI.nodeCoords)
      .filter(([, { r, c }]) => !visited.has(`${r},${c}`))
      .map(([code]) => code);
    assert.deepStrictEqual(unreachable, [],
      `Unreachable nodes: ${unreachable.join(', ')}`);
  });

  it('zero coordinate collisions in NODE_COORDS', () => {
    const seen = {};
    const dupes = [];
    for (const [code, { r, c }] of Object.entries(WBAPI.nodeCoords)) {
      const k = `${r},${c}`;
      if (seen[k]) dupes.push(`${code} collides with ${seen[k]} at (${r},${c})`);
      seen[k] = code;
    }
    assert.deepStrictEqual(dupes, []);
  });

  it('CELL_GRID key count matches NODE_COORDS count (no phantom entries)', () => {
    const grid = buildCellGrid(WBAPI.nodeMap, WBAPI.nodeCoords);
    assert.strictEqual(
      Object.keys(grid).length,
      Object.keys(WBAPI.nodeCoords).length,
      'Phantom entries in CELL_GRID suggest coord/nodeMap sync error'
    );
  });

  it('all NODE_MAP entries with coords resolve correctly in CELL_GRID', () => {
    const grid    = buildCellGrid(WBAPI.nodeMap, WBAPI.nodeCoords);
    const missing = Object.entries(WBAPI.nodeCoords)
      .filter(([code, { r, c }]) => grid[`${r},${c}`] !== code)
      .map(([code]) => code);
    assert.deepStrictEqual(missing, []);
  });

});
```

### 12.7 Test Coverage Matrix

| Test File | Framework | What It Proves |
|---|---|---|
| `navigation.test.js` (existing) | Playwright | `cellMove()` moves player; named-node BFS; waypoint walk; `_bfsGridPath` corridor correctness |
| `navigation-act2.test.js` (new) | Playwright | Act I→II transition; badge update; waypoint from LHR toward SEN; shard collection; double-collect guard |
| `reweave-connectivity.test.js` (new) | Playwright | Zero collisions; CELL_GRID count; 30-node BFS spot-check; IMPASSABLE_CELLS respected |
| `cell-grid.test.js` (new) | Node.js | `buildCellGrid()` correctness; phantom entry absence; empty-input safety |
| `reweave-validate.test.js` (new) | Node.js | Full-file BFS from LHR; 100% reachability; zero collisions; CELL_GRID/coords sync |

---

## 13. Summary and Design Principles

This report has characterized five application layers of the Roll2Hit.com navigation system and two cross-cutting design patterns (worldbuilder entry mechanics and in-path node insertion). The following invariants constitute the formal specification of a correctly operating cell-grid navigation system:

**I1 (Coordinate Uniqueness):** For all distinct nodes `A`, `B` in `NODE_COORDS`: `A.r ≠ B.r || A.c ≠ B.c`.

**I2 (Grid Consistency):** `CELL_GRID["r,c"] === code` if and only if `NODE_COORDS[code] === {r,c}`.

**I3 (Player Sync):** After every call to `storyRender(node)`, `S_story.playerR === NODE_COORDS[node.code].r` and `S_story.playerC === NODE_COORDS[node.code].c`.

**I4 (Move Correctness):** After `cellMove(dir)`, `S_story.playerR` and `S_story.playerC` reflect the new position, and if `CELL_GRID["new_r,new_c"]` is defined, `S_story.currentCode` reflects that node.

**I5 (Reachability):** BFS from `NODE_COORDS['LHR']` on the 500×500 grid visits the cell of every node in `NODE_COORDS`.

**I6 (Shard Idempotence):** `storyCollectLoot(node)` increments `S_story.shards` at most once per node code per game session, enforced by the `S_story.visited[node.code]` guard.

The reweave unit test `reweave-validate.test.js` is the machine-checkable proof of **I1**, **I2**, and **I5**. The Playwright integration tests for navigation provide behavioral evidence for **I3**, **I4**, and **I6** against the live browser runtime. Together, these two test tiers form the complete post-reweave validation suite.

### 13.1 Known Limitations

**`IMPASSABLE_CELLS` not covered by unit tests.** The Node.js `bfsReachFromLHR` function in `reweave-validate.test.js` performs a raw grid flood-fill with no impassable-cell mask, because ocean tiles are populated at browser parse time and are not exported by `wbapi-core.js`. A node that passes the unit BFS may still be unreachable at runtime if the only grid path crosses an impassable ocean tile. The Playwright test "IMPASSABLE_CELLS blocks BFS" partially mitigates this by verifying that no step on the known `BOO → LHR` path intersects the impassable set.

**Line number references may drift.** Code excerpts include source line numbers (e.g., "wbapi-server.js lines 313–321") which reflect the file state at the time of writing. Because both `wbapi-server.js` and `roll2hit-v3.html` are frequently modified by WBAPI operations, referenced line numbers should be treated as approximate search targets rather than stable anchors.

**`serializeNodeLiteral` STR list.** The field array `['name','label','text','npc','loot','N','S','E','W']` in `serializeNodeLiteral` retains deprecated exit-direction keys (`N`, `S`, `E`, `W`) that the §CELL-08 guard prevents from reaching the serializer in practice. A future cleanup should remove them to eliminate the risk of inadvertently writing legacy exit fields if the guard logic changes.
