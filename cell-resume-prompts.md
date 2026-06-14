<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->

# §CELL Redesign — Resume Prompts

> One self-contained prompt per section. Paste any block into a fresh Claude Code session
> to resume that exact increment. Each prompt assumes the previous sections are complete
> unless the ordering note says otherwise.
>
> Full design spec: `plan.md §CELL` (lines 2165–2576).
> Implementation order: 02 → 03 → 04 → 01 → 05 → 09 → 10 → 06 → 08 → 07 → 11.
>
> **Status (2026-06-14):** §CELL-02 ✅ · §CELL-03 ✅ · §CELL-04 ✅ · §CELL-01 ✅ · §CELL-05 next

---

## §CELL-02 — CELL_GRID Registry (do this first)

```
We are converting roll2hit.com from a custom node-graph navigation system to a 
cell-based MUD coordinate grid. This is the first increment: add CELL_GRID and 
IMPASSABLE_CELLS as computed constants so the new movement engine has what it needs.

Working directory: /Users/user/code/roll2hit.com
Primary file: roll2hit-v3.html (~143,000 lines)
Full design spec: plan.md §CELL-02

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
Full design spec: plan.md §CELL-03

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
Full design spec: plan.md §CELL-04

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
Full design spec: plan.md §CELL-01

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

   Note: saveAndRestart() is defined at line ~510 — it calls WBAPI.save(), copies
   the file to GAME_FILE, reloads WBAPI.load(GAME_FILE), and sends the JSON response.
   This is the correct pattern used by all other mutating endpoints.

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
Full design spec: plan.md §CELL-05

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
Full design spec: plan.md §CELL-09

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
Full design spec: plan.md §CELL-10

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

## §CELL-06 — BFS and Heatmap Grid Walk Rewrite (server-side)

```
We are converting roll2hit.com to a MUD-style cell-based navigation system.
§CELL-02 is complete: CELL_GRID and buildCellGrid() exist in wbapi-server.js.
§CELL-01 is complete: N/E/S/W fields are stripped from NODE_MAP.
This increment rewrites all graph algorithms in wbapi-server.js to walk the 2D
grid instead of the old N/E/S/W edge graph.

Working directory: /Users/user/code/roll2hit.com
Server file: wbapi-server.js (~8500 lines)
Full design spec: plan.md §CELL-06

CONTEXT:
wbapi-server.js has these graph-walk algorithms that use N/E/S/W edges:
- wither-snail BFS (walks node.N/E/S/W to find reachable nodes from a hub)
- double-snail BFS (walk1, walk2, walk3 passes — all read node[dir])
- Heatmap generation (counts BFS traversal; outputs per-node heat scores)
- Reachability check (/api/audit → unreachable nodes)
- Bidirectional check (verifies A→B implies B→A — no longer meaningful)
- Density check (already has spatial grid — §CELL-02 helper exists)

All of these currently do:
  for (const d of DIRS4) {          // DIRS4 = ['N','E','S','W']
    const nxt = nm[cur]?.[d];       // reads node.N / node.E
    if (!nxt || !nm[nxt]) continue;
    queue.push(nxt);
  }

The new pattern uses the cell grid:
  const MOVES = [[-1,0],[1,0],[0,1],[0,-1]];
  const {r, c} = coords[cur];
  for (const [dr,dc] of MOVES) {
    const nr=r+dr, nc=c+dc;
    const nxt = cellGrid[`${nr},${nc}`];
    if (!nxt || !nm[nxt]) continue;  // only step to named nodes
    if (!visited.has(nxt)) { visited.add(nxt); queue.push(nxt); }
  }
  // To also traverse empty cells (for heat counting), skip the nm[nxt] check

TASK:

1. Add a module-level buildCellGrid(nm, coords) function (may already exist from 
   §CELL-02 task — confirm). Also add a MOVES constant:
   const MOVES4 = [[-1,0],[1,0],[0,1],[0,-1]]; // N,S,E,W grid steps

2. Rewrite the wither-snail BFS walk (search for "wither-snail" or "walk1" / "walk2"):
   Replace the DIRS4 edge walk with MOVES4 grid walk as shown above.
   walk3 (the bridge-junction heating walk added in the last commit) is now 
   DELETED — its entire purpose was heating junction nodes that no longer exist.
   Remove walk3 from both wither-snail and double-snail.

3. Rewrite the reachability check (/api/audit unreachable-node scan):
   Same replacement: grid BFS from the start node, collect reachable node codes.
   Unreachable = named nodes not reached.

4. Remove the bidirectional check entirely. In a coordinate grid, if A is at (r,c)
   and B is at (r-1,c), then A can go N to B and B can go S to A by definition.
   There is no asymmetric edge to check. Delete the bidirectional audit endpoint
   and remove it from ./api.sh.

5. Rewrite the heatmap output: instead of per-node heat scores, output a 2D grid.
   Format: tab-separated values, one row per r, one column per c, value = heat count.
   Named nodes show their code + heat. Empty cells show heat count only.
   Save output to milepoints/heatmap-{timestamp}.txt as before.

6. The density check already uses a spatial grid (added in last session). Confirm
   it uses CELL_GRID coordinates (r,c) not edge distances — it should already be
   correct. If it still references node edges, update to purely use r/c positions.

7. Update /api/fix-bidirectional in api.sh to /api/grid/reachability or remove it.
   Add new commands:
   ./api.sh grid reachability   → lists unreachable named nodes
   ./api.sh grid heatmap        → runs heatmap and saves to milepoints/

Verify:
   curl http://localhost:1367/api/audit  # should run without error
   ./api.sh grid reachability            # lists unreachable nodes
   ./api.sh grid heatmap                 # writes heatmap file
   The heatmap file should be a 2D grid, not a node list.

After making changes, commit:
"§CELL-06: BFS/heatmap/reachability rewritten as grid walks — edge graph removed from server"
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
Full design spec: plan.md §CELL-08

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
Full design spec: plan.md §CELL-07

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

## §CELL-11 — Documentation Sync Pass

```
We are converting roll2hit.com to a MUD-style cell-based navigation system.
§CELL-01 through §CELL-10 are all complete. This final increment synchronizes
all markdown documentation to reflect the new cell-based architecture.

Working directory: /Users/user/code/roll2hit.com
Full design spec: plan.md §CELL-11

Two-Way Sync Rule (from index.md): every item in the markdown docs traces back to
roll2hit-v3.html. Everything in the HTML has a home doc. After this sync pass,
verify world map consistency across maps.md, story.md, world.md.

TASK — Files to rewrite:

1. docs-node-network.md — FULL REWRITE. Replace all 5 existing sections with:
   §1 Grid System (same as before but now authoritative)
   §2 Node Types (remove junction row; keep epic, fishing, story, etc.)
   §3 Node Record Schema (new schema without N/E/S/W; show derived_exits concept)
   §4 Cell Movement (cellMove function design; CELL_GRID lookup; IMPASSABLE_CELLS)
   §5 Empty Cell Traversal (_enterEmptyCell; terrain inference; encounter rates)
   §6 MUD Session API (link to wbapi-help.md §MUD Session API)
   §7 BFS Pathfinding (_bfsGridPath; waypoint highlighting; heatmap grid format)

2. maps.md — Update:
   - Header note: change "Node connections are governed by the Node Network section"
     to "Connections are derived at runtime from grid adjacency — see docs-node-network.md"
   - Remove the "Corridor Travel System" section if present
   - Remove N/E/S/W columns from the full node legend table (keep Code, Node#, Terrain, Act, Grid Cell, Story Description)
   - Add a paragraph "Cell Navigation" explaining that the player moves one cell at
     a time via N/E/S/W, empty cells are traversable, named node cells trigger content

3. spec-corridors.md — Add at top:
   > **⚠️ SUPERSEDED by §CELL-03.** The corridor system has been replaced by
   > cell-based movement. This file is archived for historical reference.

4. mechanics.md — Remove the "Corridor Travel" section. Replace with:
   "### Cell Movement
   The player moves one cell at a time on the world grid. Pressing N/E/S/W steps
   to the adjacent cell in that direction. Named locations appear at specific (r,c)
   coordinates. Unnamed cells are open terrain where random encounters may occur.
   Hunt Mode guarantees an encounter on every open-cell move."

5. world.md — Remove any sentence referencing junction nodes, corridor travel,
   Time-Warp Footpath, or "highway mesh." These concepts are removed.

6. story.md — Search for junction-based directions ("follow the highway west",
   "take the junction road south"). Rephrase as geographic directions 
   ("travel west through the midlands", "head south into the forest").

7. story-flowchart.md — Add a note at the top:
   "Edges in this flowchart represent geographic adjacency on the world grid.
   Connections are derived from (r,c) proximity, not stored link data.
   See docs-node-network.md §Cell Movement for implementation."

8. index.md — Update:
   - "Node map (121 nodes)" → "Cell map (~449 named locations on a coordinate grid)"
   - docs-node-network.md description: update from "adjacency, code conventions, 
     N/E/S/W graph structure" to "cell grid architecture, MUD movement, session API"
   - maps.md description: remove "N/E/S/W network" from description
   - Add §CELL lab report entry when lab report is written

9. wbapi-help.md — Add sections:
   "## Cell & Grid Endpoints" (from §CELL-08)
   "## MUD Session API" (from §CELL-07)
   Mark old "Node connections" section as removed.

10. Write lab-report-cell-map-mud-redesign.md per Lab Report Policy:
    This qualifies as a "Large redesign touching multiple systems."
    Sections: Motivation, Design Principles, What Changed (11 sections), 
    What Was Preserved, Non-Obvious Decisions, Performance Notes.

After all docs are updated:
- Run ./api.sh audit to confirm 0 errors
- Verify the index.md status line is accurate (node count, layer count)
- Commit:
  "§CELL-11: doc sync — maps/docs-node-network/mechanics/world/story updated for cell system"
- Write the lab report and commit:
  "§CELL-11: lab-report-cell-map-mud-redesign — full redesign postmortem"
```

---

*Cell redesign prompts — 11 of 11. Implementation order: 02 → 03 → 04 → 01 → 05 → 09 → 10 → 06 → 08 → 07 → 11.*
*Full spec: plan.md §CELL (lines 2165–2576).*
