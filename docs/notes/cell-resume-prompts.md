<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->

# §CELL Redesign — Resume Prompts

> ⚠️ **Historical archive (do not act on verbatim).** These are completed §CELL resume
> prompts preserved as a record. Several reference **Hunt Mode / `S_story.huntMode` /
> guaranteed open-cell encounters** (e.g. §CELL-09's "Hunt Mode guarantees an encounter
> on every open-cell move"). That feature was **removed entirely in §TIMELESS-01** —
> movement is now timeless and empty-cell encounters are a single plain
> `TERRAIN_ENCOUNTER_RATE` roll. Read those Hunt-Mode lines as obsolete.

> One self-contained prompt per section. Paste any block into a fresh Claude Code session
> to resume that exact increment. Each prompt assumes the previous sections are complete
> unless the ordering note says otherwise.
>
> Full design spec: `plan-archive.md §CELL`.
> Implementation order: 02 → 03 → 04 → 01 → 05 → 09 → 10 → **05b → 11A → 06 → 08 → 07 → 11B**.
>
> **Status (2026-06-14):** §CELL-02 ✅ · §CELL-03 ✅ · §CELL-04 ✅ · §CELL-01 ✅ · §CELL-05 ✅ (partial — 268 zombie J-stubs remain, no r/c, inert) · §CELL-09 ✅ · §CELL-10 ✅ · §CELL-05b next (purge zombies) → §CELL-11A (remove corridor dead code + _buildNodeExits) → §CELL-06 (server BFS — URGENT: reweave-all currently broken) → §CELL-08 → §CELL-07 → §CELL-11B
>
> **Code-audit findings (2026-06-14):**
> - `_buildNodeExits()` at HTML:45059 still re-populates node.N/S/E/W in memory every page load (dead weight — cellMove ignores it)
> - Server-side snail `bfsPath` reads `nm[cur]?.[d]` → always undefined after §CELL-01 → reweave-all broken
> - 268 zombie J-stubs: `name:"junction"`, `junction:false`, no r/c → not in CELL_GRID, unreachable
> - `buildCellGrid()` exists in wbapi-server.js at line ~2517; `MOVES4` constant not yet added

---

## §CELL-02 — CELL_GRID Registry (do this first)

```
We are converting roll2hit.com from a custom node-graph navigation system to a 
cell-based MUD coordinate grid. This is the first increment: add CELL_GRID and 
IMPASSABLE_CELLS as computed constants so the new movement engine has what it needs.

Working directory: /Users/user/code/roll2hit.com
Primary file: roll2hit-v3.html (~143,000 lines)
Full design spec: plan-archive.md §CELL-02

The game's NODE_MAP already stores r and c on every node. NODE_COORDS is a parallel 
object that also holds {r,c} per node code. We need a reverse lookup: given a grid 
cell (r,c), what node is there?

TASK: Add two new constants to roll2hit-v3.html, populated at DOMContentLoaded or 
immediately after NODE_MAP is defined (search for the end of the NODE_MAP object):

1. CELL_GRID — Object, keyed "r,c" → node code string (or undefined if empty).
   Built by iterating all NODE_MAP entries and reading node.r / node.c.
   Use NODE_COORDS as the coordinate source if node.r/node.c are absent on some entries
   (NODE_COORDS[code].r / NODE_COORDS[code].c).

2. IMPASSABLE_CELLS — Set of "r,c" strings for water/out-of-bounds cells.
   The world grid is 16 rows × at least 200 columns (the 1367 import expanded it far 
   beyond the original 26×16). Water cells are cells not covered by any node AND not 
   reachable by walking from the start node LHR. For Phase 1, define IMPASSABLE_CELLS 
   as an empty Set — we will fill it in §CELL-10. The blocking rule "if no node and 
   no passage" is handled at move time by checking map bounds instead.

Place the constants just after NODE_COORDS is defined. Search for:
  const NODE_COORDS =
Then add after the closing }; of NODE_COORDS:

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
  const IMPASSABLE_CELLS = new Set(); // populated in §CELL-10

Also add to wbapi-server.js a helper function buildCellGrid(nm, coords) that does 
the same thing for server-side algorithms. Place it near the top of the file with 
the other helper functions (search for "function dist(" or "function terrainCat(").

Verify by opening the browser console and running:
  CELL_GRID["5,16"]   // should return the node code at r=5,c=16
  Object.keys(CELL_GRID).length  // should be ~449 (one per named node)

Do NOT change storyMove, NODE_MAP fields, or any other system yet.
After making changes, commit with message:
"§CELL-02: add CELL_GRID + IMPASSABLE_CELLS constants"
```

---

## §CELL-03 — Movement Engine Rewrite: storyMove → cellMove

```
We are converting roll2hit.com to a MUD-style cell-based navigation system.
§CELL-02 is complete: CELL_GRID and IMPASSABLE_CELLS constants exist.
This increment replaces storyMove with cellMove.

Working directory: /Users/user/code/roll2hit.com
Primary file: roll2hit-v3.html (~143,000 lines)
Full design spec: plan-archive.md §CELL-03

CONTEXT — current system:
- storyMove(dir) is at line ~143168. It reads node[dir] (node.N / node.E / node.S / 
  node.W) to find the destination code, then navigates there.
- At the bottom of storyMove, Manhattan distance >= 3 triggers _showCorridorPrompt().
- CORRIDOR_TERRAIN is at line ~126546. CORRIDOR_CELLS is at line ~126577.
- All N/E/S/W direction buttons call storyMove(dir).

TASK: 

1. Add two new state fields to _S_DEFAULTS() (search for "_S_DEFAULTS"):
     playerR: 0,   // current grid row (synced to node.r on every node entry)
     playerC: 0,   // current grid column (synced to node.c on every node entry)
   Set their initial values in storyInit() from the starting node's coordinates.

2. Write a new function cellMove(dir) that replaces storyMove for all compass movement:

   function cellMove(dir) {
     const DELTAS = { N:[-1,0], S:[1,0], E:[0,1], W:[0,-1] };
     const [dr, dc] = DELTAS[dir];
     const nr = (S_story.playerR || 0) + dr;
     const nc = (S_story.playerC || 0) + dc;

     // Bounds check (grid is at most r=1..300, c=1..300 — anything outside is edge)
     if (nr < 1 || nc < 1 || nr > 300 || nc > 300) {
       storyMsg('You reach the edge of the known world.'); return;
     }
     if (IMPASSABLE_CELLS.has(`${nr},${nc}`)) {
       storyMsg('The sea is impassable on foot.'); return;
     }

     // Preserve gate-lock checks: copy the gate-lock block from storyMove verbatim.
     // The gate checks use S_story.currentCode and dest — map dest to the cell's code.
     const destCode = CELL_GRID[`${nr},${nc}`];

     // Run all gate checks from the old storyMove here, substituting destCode for dest.
     // ... (copy gate lock block verbatim from storyMove) ...

     storyCheckMissedSleep();
     S_story.log.push(S_story.currentCode);
     if (S_story.log.length > 20) S_story.log.shift();
     S_story.playerR = nr;
     S_story.playerC = nc;
     _statTally('exitsTaken', 1);
     S_story.hoursElapsed    = (S_story.hoursElapsed || 0) + 1;
     S_story.hoursSinceSlept = (S_story.hoursSinceSlept || 0) + 1;

     if (destCode && NODE_MAP[destCode]) {
       const _farewell = _getFarewell(S_story.currentCode, destCode);
       _pendingFarewell = _farewell || null;
       _setActivePath(S_story.currentCode, destCode, dir);
       S_story.currentCode = destCode;
       storyRender(NODE_MAP[destCode]);
     } else {
       _enterEmptyCell(nr, nc);   // §CELL-04 — stub for now
     }
   }

   Add a stub for _enterEmptyCell now (just show coordinates):
   function _enterEmptyCell(r, c) {
     storyMsg(`Open terrain. [Row ${r}, Col ${c}] — no named location here.`);
   }

3. Replace every call to storyMove with cellMove. These appear at:
   - The N/E/S/W direction buttons in the HTML (search for "storyMove('N')" etc.)
   - The keyboard handler (search for dirMap[e.key])
   - The exit-waypoint onclick generator (search for "storyMove('" + d + "')")
   - The auto-path walker (search for "storyMove(path[0].dir)")

4. Keep storyMove in the file for now but rename it to storyMove_LEGACY and add a 
   comment: // SUPERSEDED by cellMove — remove after §CELL-05 is complete

5. Do NOT remove CORRIDOR_TERRAIN or CORRIDOR_CELLS yet — they are still referenced 
   by the minimap render. Remove them in §CELL-05.

6. On every storyRender call (the function that displays a node), sync playerR/playerC:
   Locate storyRender and at the top add:
     if (node && NODE_COORDS[node.code]) {
       S_story.playerR = NODE_COORDS[node.code].r;
       S_story.playerC = NODE_COORDS[node.code].c;
     }

Verify: Navigate from starting node LHR. Pressing N/E/S/W should move one cell.
If the neighboring cell has a node, the game renders that node. If not, it shows
the empty-cell stub message with coordinates. Gate locks should still block.

After making changes, commit:
"§CELL-03: cellMove replaces storyMove — one cell per move, no corridor jump"
```

---

## §CELL-04 — Empty Cell Traversal

```
We are converting roll2hit.com to a MUD-style cell-based navigation system.
§CELL-02 and §CELL-03 are complete: CELL_GRID exists and cellMove() is the movement
function. When the player moves to a cell with no named node, _enterEmptyCell(r,c)
is called (currently a stub). This increment implements that function fully.

Working directory: /Users/user/code/roll2hit.com
Primary file: roll2hit-v3.html (~143,000 lines)
Full design spec: plan-archive.md §CELL-04

TASK:

1. Add _inferTerrain(r, c) — looks at the CELL_GRID neighbors of (r,c) and returns
   the majority terrain name (from NODE_MAP[code].name). Fallback: 'midlands'.

   function _inferTerrain(r, c) {
     const neighbors = [[-1,0],[1,0],[0,1],[0,-1]]
       .map(([dr,dc]) => CELL_GRID[`${r+dr},${c+dc}`])
       .filter(Boolean)
       .map(code => NODE_MAP[code]?.name)
       .filter(Boolean);
     if (!neighbors.length) return 'midlands';
     // Return most common terrain among neighbors
     const freq = {};
     let best = 'midlands', bestN = 0;
     for (const t of neighbors) {
       freq[t] = (freq[t]||0) + 1;
       if (freq[t] > bestN) { bestN = freq[t]; best = t; }
     }
     return best;
   }

2. Add TERRAIN_ENCOUNTER_RATE — probability of a random encounter on an empty cell
   move, keyed by terrain name. Safe terrains (road, junction) have 0.
   Add this constant near CORRIDOR_TERRAIN:

   const TERRAIN_ENCOUNTER_RATE = {
     midlands:0.15, forest:0.25, highlands:0.20, swamp:0.30, desert:0.20,
     jungle:0.30, hag_swamp:0.35, ocean:0.10, beach:0.10, road:0, junction:0,
     city:0.05, city_slums:0.10, alley:0.15, _default:0.15
   };

3. Implement _enterEmptyCell(r, c) replacing the stub:

   function _enterEmptyCell(r, c) {
     const terrain  = _inferTerrain(r, c);
     const terrainEntry = WORLD_DB[terrain] || WORLD_DB.midlands;
     // Build exits list: which neighboring cells are passable?
     const DIRS = {N:[-1,0], S:[1,0], E:[0,1], W:[0,-1]};
     const exits = Object.entries(DIRS)
       .filter(([, [dr,dc]]) => {
         const nr=r+dr, nc=c+dc;
         return nr>=1 && nc>=1 && nr<=300 && nc<=300 && !IMPASSABLE_CELLS.has(`${nr},${nc}`);
       })
       .map(([d,[dr,dc]]) => {
         const code = CELL_GRID[`${r+dr},${c+dc}`];
         return code ? `${d} → ${NODE_MAP[code]?.label||code}` : d;
       });

     // Render the empty cell panel (reuse the story panel)
     const html = `
       <div class="story-node-hd">${terrainEntry.icon||'·'} Open Terrain</div>
       <div style="color:var(--dim);font-size:12px;margin-bottom:6px;">
         [Row ${r}, Col ${c}] — ${terrainEntry.label||terrain}
       </div>
       <div class="story-text">The path continues. No named location marks this ground.</div>
       <div style="margin-top:8px;font-size:12px;color:var(--dim);">
         Exits: ${exits.join(' · ')||'none'}
       </div>`;
     document.getElementById('story-content').innerHTML = html;
     document.getElementById('story-move-msg').textContent = '';

     // Random encounter on empty cells
     const rate = TERRAIN_ENCOUNTER_RATE[terrain] || TERRAIN_ENCOUNTER_RATE._default;
     if (Math.random() < rate) {
       // Trigger a wild encounter using the terrain's monster pool
       // Use the same battle-start logic as node battle triggers
       const pool = terrainEntry.monsters || [];
       if (pool.length) {
         const monsterKey = pool[Math.floor(Math.random()*pool.length)];
         const monster = MONSTER_POOL[monsterKey];
         if (monster) {
           setTimeout(() => _startStoryBattle(monster, `Wild ${monster.name}`), 300);
         }
       }
     }
   }

4. Update _S_DEFAULTS() to add visitedCells (used by §CELL-10 minimap):
     visitedCells: {},   // "r,c" → true — all cells the player has stepped on

   In cellMove(), after updating playerR/playerC, add:
     S_story.visitedCells[`${nr},${nc}`] = true;

Verify: Move to an empty cell — should see terrain name, coordinates, and exit list.
Moving repeatedly through open terrain should work. Occasionally a battle triggers.

After making changes, commit:
"§CELL-04: empty cell traversal — terrain inference, encounters, exit compass"
```

---

## §CELL-01 — Strip N/E/S/W Fields from NODE_MAP

```
We are converting roll2hit.com to a MUD-style cell-based navigation system.
§CELL-02, §CELL-03, §CELL-04 are complete and committed. Specifically:
- CELL_GRID ("r,c" → node code) and IMPASSABLE_CELLS exist in roll2hit-v3.html
- cellMove(dir) is the active movement handler — reads CELL_GRID, not NODE_MAP edges
- _enterEmptyCell(r, c) handles open terrain with terrain inference and encounters
- storyMove_LEGACY(dir) is retained but not wired to any UI element

The N/E/S/W direction fields in NODE_MAP are now dead navigation data.
cellMove never reads them. This increment strips them from the data.

Working directory: /Users/user/code/roll2hit.com
Primary file: roll2hit-v3.html (~143,000+ lines)
Server: wbapi-server.js (WBAPI runs on port 1367)
Full design spec: plan-archive.md §CELL-01

=== WHAT EXISTS AND WHAT STILL READS N/E/S/W ===

Fields to strip from NODE_MAP: N, S, E, W, SW, spire
Keep: portal (used by storyPortal() — a distinct mechanic, not a nav edge)
Keep: all other content fields (code, r, c, name, label, act, text, npc, battle,
      loot, sleep, sleepCost, junction, isEpicBattleground, isFishingLake, bossKey)

Remaining readers of node[dir] in roll2hit-v3.html (do NOT modify these —
they are either legacy-guarded or deferred to later §CELL sections):

  storyMove_LEGACY (~line 143192): reads node[dir] — retained until §CELL-05,
    not called by any UI; leave as-is

  _mapAddExits (~line 150012): reads node[dir] for minimap exit arrows —
    leave as-is; will be rewritten in §CELL-10 minimap pass

  _bfsPath (~line 150394): reads NODE_MAP[code][d] over
    ['N','S','E','W','MSY','SFT','NW','NE','spire'] for waypoint pathfinding —
    leave as-is; will be rewritten in §CELL-06 to walk CELL_GRID

  _buildNodeExits (~line 150771): reads node[dir] to build corridor wire-glyph
    map — leave as-is; will be removed in §CELL-05

Readers in wbapi-server.js (do NOT modify the snail/reweave/heatmap algorithms
this session — they are §CELL-06 scope):
  - BFS reachability (~line 4057): for (const d of ['N','S','E','W']) { ... }
  - Degree functions (~lines 5088, 5165, 5358): DIRS4.filter(d => nm[code]?.[d])
  - Reweave/snail (~lines 3070, 3138, 5548, 5716, 6969): node[d] reads
  Add // §CELL-06: replace with CELL_GRID walk comment to each location found,
  but do NOT change the logic.

=== TASK ===

1. Add a bulk-strip endpoint to wbapi-server.js. Find the route() function
   (it's a large if/else chain — search for "pathname === '/api/node/'").
   Add this block near the other /api/admin/* endpoints:

   if (pathname === '/api/admin/strip-edges' && method === 'POST') {
     const nm = WBAPI.nodeMap;
     const STRIP = ['N','S','E','W','SW','spire'];
     let count = 0;
     for (const code of Object.keys(nm)) {
       let changed = false;
       for (const field of STRIP) {
         if (field in nm[code]) { delete nm[code][field]; changed = true; }
       }
       if (changed) count++;
     }
     return saveAndRestart(res, 200, { stripped: count });
   }

   Note: saveAndRestart() persists the source, reloads WBAPI.load(GAME_FILE), and
   sends the JSON response. This is the correct pattern used by all other mutating
   endpoints. (§DX-02k, 2026-08-03: it used to call the argless WBAPI.save() and
   copy the resulting dated snapshot over GAME_FILE — which left a ~5.4 MB file in
   the CWD on every write. It now goes through saveGameFile(): temp + atomic rename.)

2. Restart the WBAPI server to pick up the new endpoint:
   ./wbapi-toggle.sh restart
   (or kill the existing node process and re-run: node wbapi-server.js &)

3. Call the endpoint:
   curl -X POST http://localhost:1367/api/admin/strip-edges
   The response should show { stripped: <nonzero count> }.
   Verify: curl http://localhost:1367/api/node/CI | grep -E '"N"|"S"|"E"|"W"'
   should return nothing (portal is OK).

4. In wbapi-server.js, update the GET /api/node/:code response (~line 258) that
   currently sends linkedNodes: { N:node.N||null, ... }. Either remove the
   linkedNodes field entirely or compute it from CELL_GRID adjacency:
   (For now, removing it is fine — it was used by the old corridor visualizer.)

5. In wbapi-server.js, update the audit broken_exit check (~line 3196):
   The current check is:
     for (const d of DIRS) {
       if (node[d] && !nodeKeys.has(node[d]))
         push('error', 'broken_exit', ...)
     }
   After stripping, node[d] will always be undefined, so this loop will never
   push errors — it is harmless but misleading. Replace the whole broken_exit
   block with a comment:
     // §CELL-01: N/S/E/W fields stripped — exits are derived from CELL_GRID adjacency

6. In wbapi-server.js, add // §CELL-06: replace with CELL_GRID walk comments to
   the BFS/reachability/reweave sections that still iterate node directions:
   - ~line 4057: the undirected adjacency loop in GET /api/graph/reachability
   - ~line 3070, 3138: the junction nuke/repair loops
   - Each DIRS4.filter(d => nm[code]?.[d]) degree function
   Do NOT change logic — just mark them for §CELL-06.

7. Verify storyMove_LEGACY is the only UI-unreachable reader left.
   Run this grep and confirm every line is either in storyMove_LEGACY, _mapAddExits,
   _bfsPath, or _buildNodeExits (all deferred):
   grep -n "node\[dir\]\|node\[d\]\|\bnode\.N\b\|\bnode\.S\b\|\bnode\.E\b\|\bnode\.W\b" \
     roll2hit-v3.html | grep -v "//\|storyMove_LEGACY\|_mapAddExits\|_bfsPath\|_buildNodeExits"

8. Update docs-node-network.md Section 3 (Connection Object).
   The schema block currently shows N/S/E/W fields with the note
   "(legacy — used by _bfsPath only)". Change that note to:
   "(stripped in §CELL-01 — exits derived at runtime from CELL_GRID adjacency)"
   and remove the N/S/E/W lines from the schema example entirely.

=== VERIFY ===

curl http://localhost:1367/api/node/CI
  → response must have no "N", "S", "E", "W" fields (portal is OK)

curl http://localhost:1367/api/audit | grep broken_exit
  → must return nothing (no broken exit errors)

Open the game in browser: N/E/S/W movement must still work via cellMove.
Waypoint button must still navigate (uses _bfsPath — which will now find no
edges in NODE_MAP and therefore return null for all paths). If _bfsPath breaks
because NODE_MAP edges are gone, add a fallback in storyWaypoint():
  if (!path) { storyMsg('Waypoint pathfinding requires §CELL-06 grid BFS.'); return; }

After making changes, commit:
"§CELL-01: strip N/E/S/W edge fields from NODE_MAP — exits now derived from grid"
```

---

## §CELL-05 — Abolish Junction Nodes

```
We are converting roll2hit.com to a MUD-style cell-based navigation system.
§CELL-01 through §CELL-04 are complete: cellMove drives navigation via CELL_GRID,
N/E/S/W fields are stripped, empty cells are traversable.
This increment removes junction nodes — the auto-generated J##### routing stubs.

Working directory: /Users/user/code/roll2hit.com
Primary file: roll2hit-v3.html (~143,000 lines)
Full design spec: plan-archive.md §CELL-05

CONTEXT:
There are thousands of junction nodes in NODE_MAP (J1–J13, J91, J98, J14634, 
J31123, J41658, etc. — grep shows hundreds of entries with junction:true).
These were auto-generated by the wbapi-server snail/reweave system as routing 
glue between named nodes. They served as "road cells" in the old edge-graph system.
In the new cell-based system they are redundant: the CELL_GRID handles routing by
grid adjacency. A junction at (r,c) is now just an empty cell — the player walks 
through it without any special logic.

TASK:

1. Survey what exists:
   grep -c 'junction:true' roll2hit-v3.html
   grep 'junction:true' roll2hit-v3.html | grep -v 'label.*Elbow\|label.*Jct\|label.*Highway' | head -20
   This will reveal any junctions with real narrative text (these may need promotion).

2. Identify junctions with real content (text length > 60 chars that isn't the 
   boilerplate "The road branches here..." or "Highway junction." or "Diagonal-repair elbow."):
   ./api.sh --ai "list all junction nodes that have real story text (not boilerplate)"
   For each such node: decide promote (add a real label, remove junction:true flag) 
   or delete. There are likely < 20 with real text — e.g. J13 (The Western Sea Road),
   WRO (Midlands Road Fork). These should be promoted: remove junction:true, keep text.

3. Add a bulk-delete endpoint to wbapi-server.js:
   POST /api/admin/delete-junctions
   Body: { dryRun: true|false }
   Logic: iterate NODE_MAP, collect all codes where junction:true AND text is 
   boilerplate (check: text.startsWith('The road branches') || 
   text.startsWith('Highway junction') || text.startsWith('Diagonal-repair elbow')).
   If dryRun=false, delete them from NODE_MAP and also delete any QUEST_DB entries
   that reference those codes as activateNode.

4. Run dry run first:
   curl -X POST http://localhost:1367/api/admin/delete-junctions \
     -H 'Content-Type: application/json' -d '{"dryRun":true}'
   Review count. Then run with dryRun:false.

5. In roll2hit-v3.html:
   - Remove storyMove_LEGACY (the old storyMove renamed in §CELL-03)
   - Remove CORRIDOR_TERRAIN constant (line ~126546)
   - Remove buildCorridorMap() function and CORRIDOR_CELLS constant (line ~126577)
   - Remove _showCorridorPrompt() function (line ~150407)
   - Remove storyCorridorTravel() function (line ~150449)
   - Remove the corridor overlay HTML elements (search for story-corridor-overlay)
   - Remove corridor CSS classes (search for .mc-corridor, .mmc-corridor, .wmc-corridor)
   - Remove junction terrain entry from WORLD_DB (search for "junction:" in WORLD_DB)

6. Update the minimap render (_renderMiniMap / _renderWorldMiniMap) to remove all 
   corridor-cell and junction-cell rendering branches. Replace with plain empty-cell
   rendering (dim dot or terrain glyph).

7. Update wbapi-server.js: remove junction:true checks from audit, density, 
   and all heatmap passes.

Verify: 
- Load game in browser — no corridor overlay should ever appear
- Navigating through where junctions used to be now shows empty cell messages
- ./api.sh audit should report 0 junction-related warnings
- grep -c 'junction:true' roll2hit-v3.html should be 0

After making changes, commit:
"§CELL-05: abolish junction nodes — boilerplate J-nodes deleted, corridor system removed"
```

---

## §CELL-09 — Quest System Cell-Driven Triggers

```
We are converting roll2hit.com to a MUD-style cell-based navigation system.
§CELL-02 and §CELL-03 are complete (CELL_GRID exists, cellMove drives movement).
The quest system still uses activateNode which is a node code — that stays. But the
trigger mechanism and the BFS pathfinding for quest waypoints need updating.

Working directory: /Users/user/code/roll2hit.com
Primary file: roll2hit-v3.html (~143,000 lines)
Full design spec: plan-archive.md §CELL-09

CONTEXT:
Quest activation was triggered by storyRender checking S_story.currentCode against
quest.activateNode. This still works because when cellMove lands on a named node,
S_story.currentCode is set to that node's code before storyRender is called.
No schema change is needed for QUEST_DB.

However, there are two things that need updating:

1. The waypoint BFS highlight (which showed a highlighted path to a quest objective)
   walked the old N/E/S/W edge graph. That graph is now gone.

2. Hunt mode (guaranteed encounter on the path to a node) used corridor terrain —
   corridor is gone.

TASK:

1. Find the waypoint BFS function. Search for:
   function _buildWaypointPath or _bfsToNode or waypoint in roll2hit-v3.html
   Also search for "waypoint" in the minimap render function.

2. Replace the edge-graph BFS with a grid BFS:

   function _bfsGridPath(fromCode, toCode) {
     const startCoord = NODE_COORDS[fromCode];
     const endCoord   = NODE_COORDS[toCode];
     if (!startCoord || !endCoord) return [];
     
     const visited = new Set();
     const queue   = [{ r: startCoord.r, c: startCoord.c, path: [] }];
     const key     = ({r,c}) => `${r},${c}`;
     visited.add(key(startCoord));
     
     while (queue.length) {
       const { r, c, path } = queue.shift();
       if (r === endCoord.r && c === endCoord.c) return path;
       for (const [dr,dc] of [[-1,0],[1,0],[0,1],[0,-1]]) {
         const nr=r+dr, nc=c+dc;
         const k=`${nr},${nc}`;
         if (visited.has(k) || IMPASSABLE_CELLS.has(k)) continue;
         if (nr<1||nc<1||nr>300||nc>300) continue;
         visited.add(k);
         queue.push({ r:nr, c:nc, path:[...path,{r:nr,c:nc,code:CELL_GRID[k]||null}] });
       }
     }
     return []; // unreachable
   }

3. Update the minimap waypoint highlighting to use _bfsGridPath(). Cells on the path
   get a "waypoint" CSS class. Named nodes on the path show their code. Empty cells
   on the path show a direction glyph (·, ─, │ etc.).

4. Hunt mode: Remove the corridor-terrain lookup from hunt mode. Instead, when Hunt
   is active, every cellMove through an empty cell checks TERRAIN_ENCOUNTER_RATE 
   at 100% probability (guaranteed encounter). This replaces the old 
   "guaranteed encounter in corridor terrain" behavior.
   Search for huntMode or S_story.huntMode and update the encounter check.

5. Gate locks (GATE_LOCKS): these already check S_story.currentCode === gate.from
   and dest === gate.to in cellMove. The cell-move gate check was preserved verbatim
   from storyMove in §CELL-03. No change needed — verify they still fire correctly.

Verify:
- Activate a quest. The minimap should highlight a path of cells to the objective.
- With huntMode on, every empty cell move should trigger a battle.
- Gate lock nodes should still block passage without the required item.

After making changes, commit:
"§CELL-09: grid BFS for quest waypoints — hunt mode and gates updated for cell system"
```

---

## §CELL-10 — Minimap Live Player Cursor and Visited Fog

```
We are converting roll2hit.com to a MUD-style cell-based navigation system.
§CELL-02 through §CELL-04 are complete. S_story.visitedCells tracks stepped cells.
This increment updates the minimap to show a live player cursor and fog-of-war reveal.

Working directory: /Users/user/code/roll2hit.com
Primary file: roll2hit-v3.html (~143,000 lines)
Full design spec: plan-archive.md §CELL-10

CONTEXT:
There are two minimaps in roll2hit-v3.html:
- _renderMiniMap(): the small HUD minimap shown during play
- _renderWorldMiniMap(): the full world map view (toggled by a button)
Both currently render only named node cells, with corridor wire-glyphs in between.
The corridor system has been removed in §CELL-05.

TASK:

1. Update _renderMiniMap() to render a 11×17 viewport centered on the player's 
   current (playerR, playerC) position. For each cell in the viewport:
   - Player cell: render a bright cursor glyph '@' with highlight styling
   - Named node in CELL_GRID: render node code (2-3 chars), highlight if visited
   - Visited empty cell (in S_story.visitedCells): render terrain glyph (see below)
   - Unvisited cell within 3 cells of player: render dim '?' (partially known)
   - Unvisited cell beyond 3 cells: render nothing / fog background

   Terrain glyphs for empty visited cells:
   { midlands:'·', forest:'♣', highlands:'▲', swamp:'≈', desert:'∴',
     ocean:'~', beach:'░', jungle:'♠', city:'⌂', city_slums:'⌂', 
     road:'─', alley:'│', _default:'·' }

2. Update _renderWorldMiniMap() to render the entire known world at reduced scale.
   Each cell is 1 character. Player position shown as '@'. Named nodes shown as
   their first character of code. Empty visited cells shown as terrain glyph.
   Unvisited cells shown as ' ' (space / fog).
   
   Add a scrollable container — the world is potentially 300×300 cells.
   Center the scroll on the player position when opened.

3. Add CSS for new minimap cell types:
   .mmc-player  { color: #FFD700; font-weight:900; background: #1a0f00; }
   .mmc-visited { color: #8a7050; }
   .mmc-fog     { color: #1a1a1a; }
   .mmc-partial { color: #2a2a3a; }

4. In cellMove() and _enterNode(): after updating playerR/playerC, call 
   _renderMiniMap() to refresh the viewport.

5. S_story.visitedCells persistence: confirm it is included in the save/load system.
   Search for the save serialization (likely JSON.stringify(S_story)) — visitedCells
   will be saved automatically if it is on S_story. On load, ensure it restores.
   If visitedCells has large size (many cells visited), it may inflate saves — 
   that is acceptable for now; optimization is a future task.

6. Remove all corridor-cell CSS and rendering (if any remain after §CELL-05):
   Search for .mc-corridor, .mmc-corridor, .wmc-corridor and remove those classes
   and any rendering code that sets them.

Verify:
- Open the game. Move around. The minimap viewport should follow the player '@'.
- Enter a named node — the node code appears in the minimap.
- Enter an empty cell — the terrain glyph appears after moving there.
- Open the world map — all visited cells should be visible, unvisited should be fog.

After making changes, commit:
"§CELL-10: minimap live cursor + fog-of-war reveal — visitedCells tracked per cell"
```

---

## §CELL-05b — Purge Zombie Junction Stubs

```
We are converting roll2hit.com to a MUD-style cell-based navigation system.
§CELL-05 bulk-deleted junction nodes where junction:true, but 268 J-stubs with
junction:false and no r/c coordinates survived. They're inert (not in CELL_GRID,
unreachable by cellMove) but should be purged before §CELL-06.

Working directory: /Users/user/code/roll2hit.com
Server: wbapi-server.js (WBAPI runs on port 1367)
Full design spec: plan-archive.md §CELL-05b note

TASK:

1. Add endpoint to wbapi-server.js near the other /api/admin/* endpoints:

   if (pathname === '/api/admin/delete-junction-terrain' && method === 'POST') {
     const body = await readBody(req);
     const dryRun = body.dryRun !== false;
     const nm = WBAPI.nodeMap;
     const coords = WBAPI.nodeCoords || {};
     const toDelete = [];
     for (const code of Object.keys(nm)) {
       const node = nm[code];
       const coord = coords[code];
       if (node.name === 'junction' && !coord?.r && !node.r) {
         toDelete.push(code);
       }
     }
     if (dryRun) return respond(res, 200, { dryRun:true, count:toDelete.length, sample:toDelete.slice(0,10) });
     for (const code of toDelete) delete nm[code];
     return saveAndRestart(res, 200, { deleted: toDelete.length });
   }

2. Restart server: ./wbapi-toggle.sh restart

3. Dry run first:
   curl -X POST http://localhost:1367/api/admin/delete-junction-terrain \
     -H 'Content-Type: application/json' -d '{"dryRun":true}'
   Expect count ~268. Review sample codes.

4. Delete:
   curl -X POST http://localhost:1367/api/admin/delete-junction-terrain \
     -H 'Content-Type: application/json' -d '{"dryRun":false}'

5. Verify:
   curl http://localhost:1367/api/audit   # 0 errors expected
   # Count remaining nodes — expect ~420
   node -e "const f=require('fs').readFileSync('roll2hit-v3.html','utf8'); \
     const m=f.match(/^\s{2}[A-Z][A-Z0-9_]{0,7}:\s*\{/gm); console.log(m?.length)"

After making changes, commit:
"§CELL-05b: purge 268 zombie J-stubs — name:junction + no r/c coordinates deleted"
```

---

## §CELL-06 — BFS and Heatmap Grid Walk Rewrite (server-side)

```
We are converting roll2hit.com to a MUD-style cell-based navigation system.
§CELL-05b is complete: 268 zombie J-stubs deleted, NODE_MAP contains only 420 
named nodes, all with r/c coordinates. No nodes have stored N/S/E/W fields 
(stripped in §CELL-01 — confirmed: grep for N/S/E/W in NODE_MAP returns 0 hits
on coordinated nodes). buildCellGrid() exists in wbapi-server.js at line ~2517.

URGENCY: The server-side snail's bfsPath reads nm[cur]?.[d] (node.N/S/E/W).
After §CELL-01 stripped those fields from stored HTML, bfsPath returns [] for
every query. The reweave-all endpoint is currently broken.

Working directory: /Users/user/code/roll2hit.com
Server file: wbapi-server.js (~11,877 lines as of 2026-06-14)
Full design spec: plan-archive.md §CELL-06

EXACT LOCATIONS TO CHANGE (verified by grep 2026-06-14):

A. Near line 2517: buildCellGrid(nm, coords) already exists. Add MOVES4 constant
   immediately after it:
   const MOVES4 = [[-1,0],[1,0],[0,1],[0,-1]]; // N,S,E,W grid steps

B. Lines ~4050–4060 — undirAdj build loop in /api/graph/* section:
   REPLACE:
     for (const [code, node] of Object.entries(nm)) {
       for (const d of ['N','S','E','W']) {
         const nb = node[d]; if (!nb || !nm[nb]) continue;
         undirAdj.get(code).add(nb); undirAdj.get(nb).add(code);
       }
     }
   WITH:
     const cg = buildCellGrid(nm, WBAPI.nodeCoords);
     const co = WBAPI.nodeCoords;
     for (const code of Object.keys(nm)) {
       const pos = co[code]; if (!pos) continue;
       for (const [dr,dc] of MOVES4) {
         const nb = cg[`${pos.r+dr},${pos.c+dc}`];
         if (nb && nm[nb]) { undirAdj.get(code)?.add(nb); undirAdj.get(nb)?.add(code); }
       }
     }

C. Lines ~4061–4070 — degree() and freeDirs() functions:
   REPLACE degree() with:
     function degree(code) {
       const pos = WBAPI.nodeCoords[code]; if (!pos) return 0;
       const cg = buildCellGrid(nm, WBAPI.nodeCoords);
       return MOVES4.filter(([dr,dc]) => cg[`${pos.r+dr},${pos.c+dc}`] && nm[cg[`${pos.r+dr},${pos.c+dc}`]]).length;
     }
   REMOVE freeDirs() entirely (slot concept gone — grid has no empty direction slots).

D. Line ~258 — GET /api/node/:code response, linkedNodes field:
   REPLACE:
     linkedNodes: { N:node.N||null, S:node.S||null, E:node.E||null, W:node.W||null },
   WITH:
     derived_exits: (() => {
       const cg = buildCellGrid(nm, WBAPI.nodeCoords);
       const pos = WBAPI.nodeCoords[key];
       if (!pos) return { N:null, S:null, E:null, W:null };
       const [N,S,E,W] = [[-1,0],[1,0],[0,1],[0,-1]].map(([dr,dc]) =>
         cg[`${pos.r+dr},${pos.c+dc}`] || null);
       return {N,S,E,W};
     })(),

E. Line ~7196 — snail's internal bfsPath(from,to) function:
   This BFS is inside runSnail() → PHASE 7 of reweave-all.
   Search for: const bfsPath=(from,to)=>{
   REPLACE the entire function body with the grid BFS:

   const bfsPath=(from,to)=>{
     if(!nm[from]||!nm[to])return[];
     if(from===to)return[from];
     const coords=WBAPI.nodeCoords;
     const cg=buildCellGrid(nm,coords);
     const startPos=coords[from]; const endPos=coords[to];
     if(!startPos||!endPos)return[];
     const prev=new Map(); prev.set(`${startPos.r},${startPos.c}`,null);
     const q=[startPos];
     while(q.length){
       const {r,c}=q.shift();
       for(const[dr,dc]of MOVES4){
         const nr=r+dr,nc=c+dc,k=`${nr},${nc}`;
         if(prev.has(k)||nr<1||nc<1||nr>300||nc>300)continue;
         prev.set(k,{r,c});
         if(nr===endPos.r&&nc===endPos.c){
           const path=[];let cur={r:nr,c:nc};
           while(cur){const code=cg[`${cur.r},${cur.c}`];if(code)path.unshift(code);cur=prev.get(`${cur.r},${cur.c}`);}
           return path;
         }
         q.push({r:nr,c:nc});
       }
     }
     return[];
   };

F. Lines ~7294–7319 — walk3 in snail (heated junction-node traversal):
   Search for: // Walk 3: hub → ALL named non-junction nodes
   DELETE the entire walk3 block (from that comment through the emit for walk3 done).
   walk3's only purpose was heating junction nodes that no longer exist.

G. Lines ~2466–2476 and ~2584–2587 — bidirectional audit check and fix:
   DELETE: the bidirectional check block in the audit pass (if (!specific || body.check === 'bidirectional'))
   DELETE: the bidirectional entry in the fix-action handler (~line 2940)
   In a coordinate grid, bidirectionality is structural — A→B implies B→A by geometry.

H. Lines ~5087, 5165, 5325, 5359 — reweave-all degree functions:
   These all compute: DIRS4.filter(d => nm[code]?.[d] && nm[nm[code][d]]).length
   They are inside the reweave-all endpoint which is being deprecated.
   Mark the entire POST /api/graph/reweave-all route with a comment at the top:
   // §CELL-06: reweave-all deprecated — junction placement system removed.
   // This endpoint returns 410. Grid-based content placement replaces it.
   Then return json(res, 410, { error: 'reweave-all deprecated — cell grid requires no junction wiring. Use /api/grid/reachability to identify unreachable nodes.' });
   Do NOT delete the function body yet — mark it with // DEAD CODE §CELL-06 for audit.

TASK SUMMARY:
1. Add MOVES4 constant after buildCellGrid() (~line 2527)
2. Replace undirAdj build loop with CELL_GRID neighbor probe (~line 4050)
3. Replace degree() with CELL_GRID version; remove freeDirs() (~line 4061)
4. Replace linkedNodes with derived_exits in GET /api/node/:code (~line 258)
5. Replace snail bfsPath with grid BFS (~line 7196)
6. Delete walk3 from snail (~lines 7294–7319)
7. Delete bidirectional audit check + fix handler (~lines 2466, 2584, 2940)
8. Deprecate reweave-all with 410 response (~line 5779)
9. Add MOVES4 constant near buildCellGrid

Verify:
   curl http://localhost:1367/api/audit              # no bidirectional errors
   curl http://localhost:1367/api/graph/reachability # uses grid BFS, returns 420 reachable
   curl http://localhost:1367/api/node/CI            # derived_exits instead of linkedNodes
   curl -X POST http://localhost:1367/api/graph/reweave-all  # returns 410

After making changes, commit:
"§CELL-06: BFS/reachability/heatmap rewritten as grid walks — reweave-all deprecated, bidirectional removed"
```

---

## §CELL-08 — WBAPI Cell Endpoints

```
We are converting roll2hit.com to a MUD-style cell-based navigation system.
§CELL-06 is complete: server algorithms use grid walks. §CELL-02 is complete:
buildCellGrid() exists in wbapi-server.js.
This increment adds REST endpoints for cell-based queries.

Working directory: /Users/user/code/roll2hit.com
Server file: wbapi-server.js (~8500 lines)
CLI: api.sh
Full design spec: plan-archive.md §CELL-08

TASK:

1. Add these endpoints to the route() function in wbapi-server.js:

   GET /api/cell/:r/:c
   → Returns: { r, c, code, node, terrain, label, exits }
     where exits = { N: 'CODE'|null, S:'CODE'|null, E:'CODE'|null, W:'CODE'|null }
     exits derived from CELL_GRID neighbors. code/node/terrain/label are null if empty cell.

   GET /api/cell/:r/:c/neighbors  
   → Returns: { N:{r,c,code,terrain,passable}, S:{…}, E:{…}, W:{…} }

   GET /api/grid/region?r1=N&c1=N&r2=N&c2=N
   → Returns 2D array (r2-r1+1 rows × c2-c1+1 cols) of cell descriptors.
     Useful for map rendering tools and worldbuilder.html map view.

   GET /api/grid/heatmap
   → Triggers heatmap computation (same as §CELL-06 implementation) and returns
     JSON object: { grid: { "r,c": heatValue }, maxHeat, timestamp }
     Also writes milepoints/heatmap-{timestamp}.txt as before.

   GET /api/grid/reachability
   → BFS from start node (LHR), returns: { reachable: ['CI','LHR',...], 
     unreachable: ['ORP','...'], totalNamed: N, reachableCount: N }

2. Update POST /api/node (node creation):
   - Accept r, c, terrain (name), label, text, act, code
   - Reject if CELL_GRID["r,c"] is already occupied (return 409 with occupant code)
   - Do NOT accept N, S, E, W fields — return 400 if submitted
   - After creating, rebuild CELL_GRID cache

3. Update GET /api/node/:code response to include derived_exits:
   "derived_exits": { "N": "CODE"|null, "S": "CODE"|null, "E": "CODE"|null, "W": "CODE"|null }
   This is computed from CELL_GRID neighbors, not stored data.

4. Add to api.sh:
   ./api.sh cell :r :c           → GET /api/cell/:r/:c
   ./api.sh cell :r :c neighbors → GET /api/cell/:r/:c/neighbors  
   ./api.sh grid region r1=N c1=N r2=N c2=N  → GET /api/grid/region
   ./api.sh grid heatmap         → GET /api/grid/heatmap
   ./api.sh grid reachability    → GET /api/grid/reachability

5. Update wbapi-help.md with the new endpoint section "Cell & Grid Endpoints".
   Document each endpoint with example curl commands.

Verify:
   ./api.sh cell 5 16            # should show CI node info + exits
   ./api.sh cell 5 15            # should show whatever is at r=5,c=15
   ./api.sh grid reachability    # reachable node list
   curl 'http://localhost:1367/api/grid/region?r1=4&c1=14&r2=8&c2=20'  # 5×7 region

After making changes, commit:
"§CELL-08: WBAPI cell and grid endpoints — GET /api/cell/:r/:c, grid heatmap, reachability"
```

---

## §CELL-07 — MUD Server Multi-Session Architecture

```
We are converting roll2hit.com to a MUD-style cell-based navigation system.
§CELL-08 is complete: cell and grid endpoints exist. The server now knows the
coordinate layout. This increment adds multi-player session support to wbapi-server.js.
This is the "multiplayer MUD" layer.

Working directory: /Users/user/code/roll2hit.com
Server file: wbapi-server.js (~8500 lines)
Full design spec: plan-archive.md §CELL-07

TASK:

1. Add in-memory session store near the top of wbapi-server.js:
   const SESSIONS = new Map(); // sessionId → { id, name, r, c, nodeCode, lastSeen, sseRes }

2. Add these routes to route():

   POST /api/session/start
   Body: { name: 'PlayerName' }
   Creates a new session. Assigns UUID sessionId. Places player at the game's
   default start coordinates (look up LHR node in NODE_MAP for r,c).
   Returns: { sessionId, name, r, c, nodeCode, desc }

   POST /api/session/move
   Body: { sessionId, dir: 'N'|'E'|'S'|'W' }
   Computes target (r±1,c) or (r,c±1). Checks bounds (1..300) and IMPASSABLE_CELLS.
   Updates session position. If cell has a named node, sets nodeCode. Else nodeCode=null.
   Returns: { r, c, nodeCode, label, terrain, exits, players }
   'players' = other sessions currently in the same cell.
   Broadcasts { type:'player_moved', id, name, r, c } via SSE to all sessions.

   GET /api/session/look?sessionId=X
   Returns current cell info + list of other players in same cell.
   Same format as /api/cell/:r/:c plus { players: [{id,name}] }.

   GET /api/session/who
   Returns: [ { id, name, r, c, nodeCode, lastSeen } ] for all active sessions.
   Active = lastSeen within 5 minutes.

   POST /api/session/say
   Body: { sessionId, msg }
   Broadcasts { type:'chat', from: name, msg, r, c } via SSE to all sessions in 
   the same cell. Also broadcasts globally to sessions within 2 cells (ambient sound).

   POST /api/session/end
   Body: { sessionId }
   Removes session. Broadcasts { type:'player_left', id, name }.

   GET /api/session/events?sessionId=X   (Server-Sent Events stream)
   Sets Content-Type: text/event-stream. Keeps connection open.
   Stores res in SESSIONS[id].sseRes. On each event, writes:
     `data: ${JSON.stringify(event)}\n\n`
   On client disconnect, clears sseRes.

3. Session expiry: Add a setInterval that runs every 60 seconds and removes sessions
   with lastSeen > 5 minutes ago. Broadcasts player_left for each expired session.

4. Helper function broadcast(event, filter):
   Iterates SESSIONS, sends SSE event to sessions where filter(session) is true.
   Examples: broadcast(event, s => true) sends to all.
   broadcast(event, s => s.r===r && s.c===c) sends to same-cell players.

5. Update wbapi-help.md with a "MUD Session API" section. Document all 6 endpoints.
   Include a curl example for a complete session: start → move → look → say → end.

6. Update API-README.md with a "Multiplayer Session" section.

Verify:
   # Terminal 1 — start a session:
   curl -X POST http://localhost:1367/api/session/start \
     -H 'Content-Type: application/json' -d '{"name":"Alice"}'
   # Save sessionId from response
   
   # Terminal 2 — subscribe to events:
   curl -N 'http://localhost:1367/api/session/events?sessionId=ALICE_ID'
   
   # Terminal 3 — start a second session and move:
   curl -X POST http://localhost:1367/api/session/start \
     -H 'Content-Type: application/json' -d '{"name":"Bob"}'
   curl -X POST http://localhost:1367/api/session/move \
     -H 'Content-Type: application/json' -d '{"sessionId":"BOB_ID","dir":"N"}'
   # Terminal 2 should receive the player_moved SSE event.

After making changes, commit:
"§CELL-07: MUD session layer — multi-player positions, SSE broadcast, WHO/SAY/MOVE"
```

---

## §CELL-11A — HTML Dead-Code Removal (corridor system cleanup)

```
We are converting roll2hit.com to a MUD-style cell-based navigation system.
§CELL-05b is complete (zombie stubs purged). This increment removes the corridor
system remnants still alive in roll2hit-v3.html even though cellMove never calls them.

CRITICAL FINDING: _buildNodeExits() at line 45059 still runs at every page load
and re-populates node.N/S/E/W in memory for every node that has NODE_COORDS coords.
This is invisible to the player (cellMove uses CELL_GRID, not node[dir]) but means
the browser's runtime NODE_MAP always has N/S/E/W present. Removing _buildNodeExits
cleanly severs the last in-memory edge-graph artifact.

Working directory: /Users/user/code/roll2hit.com
Primary file: roll2hit-v3.html (45,495 lines as of 2026-06-14)
Full design spec: plan-archive.md §CELL-11 Part A

CONFIRMED LOCATIONS TO REMOVE (all verified by grep 2026-06-14):

1. storyMove_LEGACY function — line 37413, ~92 lines
   Search for: function storyMove_LEGACY(dir) {
   Delete from that line through its closing brace.
   No UI calls this. Only reference is from _showCorridorPrompt (also being removed).

2. _showCorridorPrompt function — line 44846, ~40 lines
   Search for: function _showCorridorPrompt(fromCode, destCode, dir) {
   Delete through closing brace.

3. storyCorridorTravel function — line 44888, ~80 lines
   Search for: function storyCorridorTravel(fromCode, destCode, dir, forceEncounter) {
   Delete through closing brace.

4. _wireGlyph function — line 44970
   Search for: function _wireGlyph(dirs) {
   Delete (5 lines).

5. _corridorTerrain function — line 44974
   Search for: function _corridorTerrain(fromCode, toCode) {
   Delete (3 lines).

6. _routeSegments function — line 44978, ~30 lines
   Search for: function _routeSegments(r1, c1, r2, c2, first) {
   Delete through closing brace.

7. buildCorridorMap function — line 45009, ~40 lines
   Search for: function buildCorridorMap() {
   Delete through closing brace.

8. _buildNodeExits function — line 45059, ~20 lines
   Search for: function _buildNodeExits() {
   Delete through closing brace.

9. Call sites at lines 45083–45084:
   _buildNodeExits();
   buildCorridorMap();
   Delete both lines.

10. CORRIDOR_TERRAIN constant — line 20788, ~31 lines
    Search for: const CORRIDOR_TERRAIN = {
    Delete through its closing };

11. CORRIDOR_CELLS constant — line 20819
    Search for: const CORRIDOR_CELLS = {};
    Delete the line.

12. _corridorPendingFrom/To/Dir variables — lines 33162–33164
    Search for: let _corridorPendingFrom = null;
    Delete all three let lines.

13. Corridor overlay HTML — line 4331
    Search for: <div id="story-corridor-overlay">
    Delete the div and all its children through its closing </div>.

14. Corridor overlay CSS — line 3143
    Search for: #story-corridor-overlay {
    Delete that rule (2 lines).

15. CORRIDOR_CELLS forEach loop in _setActivePath — line 44783
    Search for: Object.entries(CORRIDOR_CELLS).forEach(([k, corr]) => {
    Delete that block (~8 lines) through its closing });
    Also delete: S_story.lastCorridorCells = cells; and const cells = []; before it.
    Also delete: S_story.lastExitCode = fromCode; S_story.lastExitDir  = dir; only if
    those are only used to feed the corridor cells block (check first).

16. 'story-corridor-overlay' in modal reset arrays:
    Line 35284: inside an array — remove the entry 'story-corridor-overlay'
    Line 44767: inside another array — remove the entry 'story-corridor-overlay'

VERIFY AFTER EACH DELETION:
- The game still loads in browser (open roll2hit-v3.html, no JS errors)
- N/S/E/W movement still works via cellMove
- grep -c "storyMove_LEGACY\|CORRIDOR_CELLS\|story-corridor-overlay\|_buildNodeExits\|buildCorridorMap" roll2hit-v3.html
  Should return 0.

After making changes, commit:
"§CELL-11A: remove corridor dead code — storyMove_LEGACY, buildCorridorMap, _buildNodeExits deleted"
```

---

## §CELL-11B — Documentation Sync Pass

```
We are converting roll2hit.com to a MUD-style cell-based navigation system.
§CELL-01 through §CELL-11A are all complete. This final increment synchronizes
all markdown documentation to reflect the new cell-based architecture.

Working directory: /Users/user/code/roll2hit.com
Full design spec: plan-archive.md §CELL-11

Two-Way Sync Rule (from index.md): every item in the markdown docs traces back to
roll2hit-v3.html. Everything in the HTML has a home doc.

STALE REFERENCE INVENTORY (confirmed by grep 2026-06-14):

index.md:
  Line 6:  "121 nodes" → "420 named nodes"
  Line 16: "121 / 121" → update to actual count
  Line 43: "121-node narrative adventure game" → "cell-based narrative adventure game"
  Line 58: maps.md description mentions "N/E/S/W network, gate locks, corridors" → remove N/E/S/W and corridors
  Line 94: spec-corridors.md listed as active → note as SUPERSEDED
  Line 267: "Corridor system" row in cross-ref table → update to "Cell movement"
  Line 307: "Node map (121 nodes)" → "Cell map (420 named nodes)"

TASK — in order:

1. spec-corridors.md — Add at very top (before any other content):
   > **⚠️ SUPERSEDED by §CELL-03 (2026-06-13).** The corridor system has been
   > replaced by MUD-style cell-based movement. This file is archived for reference.
   > See docs-node-network.md §4 for the current movement system.

2. mechanics.md — grep for "Corridor" section. Remove the Corridor Travel section
   entirely. Add in its place:
   ### Cell Movement
   The player moves one cell at a time on the world grid. Pressing N/E/S/W steps
   one cell in that direction. Named locations (420 nodes) appear at specific (r,c)
   coordinates. Unnamed cells are traversable open terrain where random encounters
   may occur based on terrain type. Hunt Mode (toggle in the HUD) guarantees an
   encounter on every open-cell move.

3. world.md — grep for "junction", "highway mesh", "corridor", "Time-Warp".
   Remove or rephrase each reference. Junction nodes were bulk-deleted in §CELL-05.
   Replace "highway mesh" with "world grid". Replace corridor travel with cell movement.

4. story.md — grep for "junction", "highway", "take the road", "crossroads jct".
   Rephrase junction-based directions as geographic directions. Examples:
   "follow the junction highway west" → "travel west"
   "take the road junction south" → "head south"

5. story-flowchart.md — Add note at top:
   > Edges in this flowchart represent geographic adjacency on the world grid.
   > Connections are derived from (r,c) proximity, not stored link data.
   > See docs-node-network.md §4 (Cell Movement) for implementation.

6. maps.md — Update:
   - Remove "Corridor Travel System" section if present
   - Remove N/E/S/W columns from node legend table (keep Code, Terrain, Act, Grid Cell, Label)
   - Update node count in header from 121 to 420
   - Add "Cell Navigation" paragraph:
     "The player navigates by pressing N/E/S/W. Each press moves one grid cell.
     Named nodes appear at fixed (r,c) coordinates. Empty cells are traversable with
     terrain-based encounter rates. Exits to named nodes are shown in the HUD."

7. index.md — Update the Status line and cross-reference table:
   - "121 nodes" → "420 named nodes"
   - "121-node narrative adventure game" → "cell-based MUD-style narrative adventure"
   - maps.md entry: remove "N/E/S/W network" and "corridors" from description
   - docs-node-network.md entry: "cell grid architecture, MUD movement, BFS pathfinding"
   - spec-corridors.md entry: add "(SUPERSEDED by §CELL-03)"
   - Corridor system cross-ref row: "Cell movement system" → docs-node-network.md

8. wbapi-help.md — Add two new sections (after §CELL-08 and §CELL-07 are done):
   ## Cell & Grid Endpoints
   (document GET /api/cell/:r/:c, GET /api/grid/region, GET /api/grid/reachability)
   ## MUD Session API
   (document POST /api/session/start, move, look, who, say, end, events)
   Mark old "Node connections (N/S/E/W)" help section as removed.

9. docs-node-network.md — Already mostly up-to-date after §CELL-09 and §CELL-10.
   Add Section 10 update: confirm node count is accurate (420 coordinated nodes).
   Remove any remaining "to be removed" language.

10. Write lab-report-cell-map-mud-redesign.md per Lab Report Policy:
    This qualifies as a "Large redesign touching multiple systems."
    Sections:
    - Motivation (why MUD cell grid over node-edge graph)
    - Design Principles (one cell per move; named nodes as landmarks; empty cells traversable)
    - What Changed (§CELL-01 through §CELL-11, one subsection each)
    - What Was Preserved (quests, saves, NPCs, gate locks, epic battlegrounds)
    - Non-Obvious Decisions (why _buildNodeExits survived so long; why walk3 was built then deleted)
    - Performance Notes (buildCorridorMap removal; BFS on 300×300 grid vs 21k-node graph)

After all docs are updated:
- Run ./api.sh audit to confirm 0 errors
- grep -r "121 nodes\|N/E/S/W network\|corridor travel\|junction nodes" docs/ *.md
  → should return only historical lab-report references, not active docs
- Commit:
  "§CELL-11B: doc sync — index/maps/mechanics/world/story/wbapi-help updated for cell system"
- Write the lab report and commit:
  "§CELL-11B: lab-report-cell-map-mud-redesign — full redesign postmortem"
```

---

*Cell redesign prompts — revised 2026-06-14 after code audit.*
*Order: 02 → 03 → 04 → 01 → 05 → 09 → 10 → 05b → 11A → 06 → 08 → 07 → 11B.*
*Full spec: plan-archive.md §CELL.*
