<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->

# spec-corridors.md — Layer 9 Function Implementation Spec
### Roll2Hit — Time-Warp Footpaths & Circuit Corridors

**Depends on:** `plan.md` (architecture), `maps.md` (NODE_COORDS), existing `_renderMapGrid()`  
**Status:** ✅ COMPLETE — All L9-A through L9-H implemented  
**File target:** `roll2hit-v3.html` (single-file rule)

---

## 0. Prerequisites & Key Decisions

Before coding, confirm these decisions from `plan.md`:

- Corridors are **visual only** — they do not require per-cell navigation. Travel is always node-to-node; corridors render the road between nodes.
- Hunt/Warp dialog fires for any connection where the two nodes are **2+ Manhattan grid cells apart** (`|Δr| + |Δc| ≥ 2`).
- Adjacent connections (`|Δr| + |Δc| ≤ 1`) travel directly — no dialog.
- If the L-shaped grid path passes through an existing NODE_COORDS cell (not the from/to nodes), that cell is treated as a node by the map renderer — the corridor does not write to it.
- Corridor cells are built **once at startup** (`buildCorridorMap()`) and stored in `CORRIDOR_CELLS`.
- Active-path highlight state lives on `S_story` and resets on each move.

---

## 1. Data Structures

### 1-A. `CORRIDOR_CELLS` — Global const, built at startup

```js
/**
 * @type {Object.<string, CorridorCell>}
 * key: "r,c"  (e.g. "5,12")
 *
 * @typedef {Object} CorridorCell
 * @property {Set<string>}          dirs    — which sides have wire: 'N'|'S'|'E'|'W'
 * @property {string}               glyph   — box-drawing char derived from dirs
 * @property {string}               terrain — WORLD_DB key for encounter rolls
 * @property {Array<{from:string, to:string}>} edges — which NODE_MAP edges pass through
 */
const CORRIDOR_CELLS = {};
```

`CORRIDOR_CELLS` is populated once by `buildCorridorMap()` before any story function runs. It is **read-only** after that.

### 1-B. `S_story` additions

Add these three fields to the `S_story` defaults object **and** to `_S_DEFAULTS()`:

```js
lastCorridorCells: [],   // Array<{r:number, c:number}> — cells of last-traveled corridor
lastExitDir:       null, // string|null — 'N'|'S'|'E'|'W' — direction taken from last node
lastExitCode:      null, // string|null — node code of previous node (for exit-arrow highlight)
```

### 1-C. Wire Glyph Lookup

```js
const WIRE_GLYPH = {
  'E,W':     '─',
  'N,S':     '│',
  'E,N':     '└',   // open to east and north
  'N,W':     '┘',   // open to north and west
  'E,S':     '┌',   // open to east and south
  'S,W':     '┐',   // open to south and west
  'E,N,S':   '├',
  'N,S,W':   '┤',
  'E,N,W':   '┴',
  'E,S,W':   '┬',
  'E,N,S,W': '┼',
};
// Derive key: [...dirs].sort().join(',')
```

### 1-D. Corridor Terrain Map

```js
/**
 * Maps a directed edge key "FROM-TO" to a WORLD_DB terrain string.
 * Both directions of each edge share the same terrain.
 * Used by triggerCorridorEncounter().
 */
const CORRIDOR_TERRAIN = {
  'CI-MI': 'midlands',  'MI-CI': 'midlands',
  'CI-J1': 'midlands',  'J1-CI': 'midlands',
  'J1-MI': 'midlands',  'MI-J1': 'midlands',
  'MI-FO': 'forest',    'FO-MI': 'forest',
  'MI-J6': 'forest',    'J6-MI': 'forest',
  'J6-FO': 'forest',    'FO-J6': 'forest',
  'MI-HL': 'highlands', 'HL-MI': 'highlands',
  'HS-BE': 'forest',    'BE-HS': 'forest',
  'OC-IS': 'ocean',     'IS-OC': 'ocean',
  'IS-AT': 'ocean',     'AT-IS': 'ocean',
  'OC-DS': 'ocean',     'DS-OC': 'ocean',
  'DS-SE': 'ocean',     'SE-DS': 'ocean',
  'VC-DE': 'desert',    'DE-VC': 'desert',
  'DC-JU': 'jungle',    'JU-DC': 'jungle',
  'JU-BQ': 'jungle',    'BQ-JU': 'jungle',
  'KT-OP': 'heavenly_clouds', 'OP-KT': 'heavenly_clouds',
  'OP-HC': 'heavenly_clouds', 'HC-OP': 'heavenly_clouds',
  'HC-AR': 'arctic',    'AR-HC': 'arctic',
  'AR-CO': 'arctic',    'CO-AR': 'arctic',
};
// Fallback: 'midlands'
```

---

## 2. Junction Node Definitions (L9-B)

Insert into `NODE_MAP` after existing nodes. Insert into `NODE_COORDS` alongside them.

```js
// NODE_MAP additions — add immediately after the CO entry
J1: { num:43, code:'J1', name:'junction', label:'Midlands Road Fork',       act:3,
      N:null, S:null, E:'CI',  W:'MI',  text:'A stone post at a crossroads. Carved arrows: East — Birka (2 leagues). West — Forest Road (3 leagues). The road is packed dirt, well-traveled.', npc:null, battle:null, loot:null, sleep:false, junction:true },
J2: { num:44, code:'J2', name:'junction', label:'Southern Road Cross',       act:5,
      N:null, S:null, E:'DE',  W:'JU',  text:'Cracked stones in the shape of a crossroads marker. East — Desert Wastes. West — Jungle Road. A vulture circles above. No shade.', npc:null, battle:null, loot:null, sleep:false, junction:true },
J3: { num:45, code:'J3', name:'junction', label:'Coastal Fork',              act:4,
      N:'HS', S:'BE', E:null,  W:null,  text:'A driftwood post driven into the cliff path. North — Crones\' Swamp. South — Beach. The sea is audible in both directions.', npc:null, battle:null, loot:null, sleep:false, junction:true },
J4: { num:46, code:'J4', name:'junction', label:'Deep Road Split',           act:4,
      N:null, S:null, E:'SE',  W:'DS',  text:'A sunken road through packed sand. Saltwater marks on the stone walls. East — Visby sewers entrance. West — Deep sea trench coast road.', npc:null, battle:null, loot:null, sleep:false, junction:true },
J5: { num:47, code:'J5', name:'junction', label:'Arctic Overpass',           act:7,
      N:null, S:null, E:'CO',  W:'AR',  text:'The sky road above the clouds. Permanent frost underfoot. East — Cosmic Realm spire. West — Arctic Pass and the mountain road. Visible for fifty leagues in clear weather.', npc:null, battle:null, loot:null, sleep:false, junction:true },
J6: { num:48, code:'J6', name:'junction', label:'Western Wilds Crossroads',  act:3,
      N:null, S:null, E:'MI',  W:'FO',  text:'A triple-forked oak, each fork pointing a direction. East — Midlands plains. West — Aldric\'s Forest. Nothing to the north or south but open ground.', npc:null, battle:null, loot:null, sleep:false, junction:true },
J7: { num:49, code:'J7', name:'junction', label:'Sky Gate Spur',             act:7,
      N:'HC', S:null, E:'OP',  W:null,  text:'The eastern branch of the sky road. North — Heavenly Clouds entrance. East — Oriental Dragon Palace. Clouds below. Nothing for hundreds of leagues.', npc:null, battle:null, loot:null, sleep:false, junction:true },
```

```js
// NODE_COORDS additions — add alongside node definitions
J1:{r:5,c:12},  J2:{r:10,c:4},  J3:{r:9,c:3},
J4:{r:12,c:8},  J5:{r:1,c:10},  J6:{r:5,c:5},   J7:{r:1,c:22},
```

**NODE_MAP edges that must be updated when junctions are inserted:**

| Original edge | Replaced by |
|---|---|
| `CI.W = 'MI'` | `CI.W = 'J1'` |
| `MI.E = 'CI'` | `MI.E = 'J1'` |
| `J1.E = 'CI'`, `J1.W = 'MI'` | (already in definition) |
| `MI.W = 'FO'` | `MI.W = 'J6'` |
| `FO.E = 'MI'` | `FO.E = 'J6'` |
| `J6.E = 'MI'`, `J6.W = 'FO'` | (already in definition) |
| `HS.S = 'BE'` | `HS.S = 'J3'` |
| `BE.N = 'HS'` | `BE.N = 'J3'` |
| `J3.N = 'HS'`, `J3.S = 'BE'` | (already in definition) |
| `DS.E = 'SE'` | `DS.E = 'J4'` |
| `SE.W = 'DS'` | `SE.W = 'J4'` (verify SE has W connection) |
| `J4.W = 'DS'`, `J4.E = 'SE'` | (already in definition) |
| `HC.W = 'AR'` | `HC.W = 'J5'` |
| `AR.E = 'CO'` | `AR.E = 'J5'` |
| `J5.W = 'AR'`, `J5.E = 'CO'` | (already in definition) |
| `KT.E = 'OP'` and `OP.N = 'HC'` via J7 | Insert J7 between OP and HC |

> **Caution:** Modifying CI.W, MI.E, and other core edges changes the D-pad navigation for existing saves. Junction nodes are new waypoints the player must now pass through. This is intentional — junctions are real nodes, not shortcuts.

---

## 3. `buildCorridorMap()` — L9-A

**When:** Called once at script init, after NODE_MAP and NODE_COORDS are defined, before `storyCheckContinue()`.

**Contract:**

```js
function buildCorridorMap() {
  // Iterates every (nodeCode, direction, destCode) in NODE_MAP.
  // For non-adjacent pairs (Manhattan distance ≥ 2), computes an
  // L-shaped grid route and writes intermediate cells to CORRIDOR_CELLS.
  // Adjacent pairs (distance ≤ 1) are skipped — no corridor cells needed.
  // Portal connections (node.portal) are also skipped — portals are instant.
  //
  // De-duplicates: each undirected edge (A,B) is processed once.
  // Crossings: if a cell already exists, merge dirs sets and recompute glyph.
  // Node collision: if an intermediate cell matches an existing NODE_COORDS
  //   entry (other than from/to), skip writing to that cell.
}
```

**Internal helpers:**

```js
/**
 * Returns array of intermediate {r,c,dirs} objects for the L-shaped route
 * from (r1,c1) to (r2,c2), horizontal-first.
 * Does NOT include the endpoint cells.
 *
 * @param  {number} r1, c1 — start grid pos
 * @param  {number} r2, c2 — end grid pos
 * @param  {'H'|'V'} first — horizontal-first or vertical-first
 * @returns {Array<{r:number, c:number, dirs:Set<string>}>}
 */
function _routeSegments(r1, c1, r2, c2, first = 'H') { ... }

/**
 * Given a Set of direction strings, returns the WIRE_GLYPH character.
 * Derives key by sorting dirs alphabetically and joining with ','.
 *
 * @param  {Set<string>} dirs
 * @returns {string}
 */
function _wireGlyph(dirs) {
  return WIRE_GLYPH[[...dirs].sort().join(',')] || '·';
}

/**
 * Returns the terrain string for a corridor edge, or 'midlands' as fallback.
 *
 * @param  {string} fromCode
 * @param  {string} toCode
 * @returns {string}
 */
function _corridorTerrain(fromCode, toCode) {
  return CORRIDOR_TERRAIN[fromCode + '-' + toCode] || 'midlands';
}
```

**`_routeSegments` algorithm (horizontal-first):**

```
Given (r1,c1) → (r2,c2) with first='H':
  Corner is at (r1, c2).
  
  Horizontal segment: row r1, cols from c1+hStep to c2-hStep (exclusive of c2)
    Each cell: dirs = { E, W }   (wire runs east-west)
    Except the last H cell before the corner: dirs = { depending on hStep, E or W }
    
  Corner cell (r1, c2):
    entering dir = opposite of hStep direction
      (coming from c1 side: if c2>c1, entering from W; if c2<c1, entering from E)
    leaving dir = going toward r2
      (if r2>r1, leaving S; if r2<r1, leaving N)
    dirs = { entering, leaving }
    
  Vertical segment: col c2, rows from r1+vStep to r2-vStep (exclusive of r2)
    Each cell: dirs = { N, S }   (wire runs north-south)
    
  If r1 === r2: no vertical segment (pure horizontal)
  If c1 === c2: no horizontal segment (pure vertical), corner omitted
```

**Routing preference:**

Try horizontal-first. If the horizontal-first corner cell `(r1, c2)` lands on an existing NODE_COORDS cell (other than from/to), try vertical-first (corner at `(r2, c1)`) instead. If both corners land on nodes, use horizontal-first and accept the node collision (the node renders on top; the corridor passes around it visually).

---

## 4. `_renderMapGrid()` modifications — L9-D

**Location:** existing function in the Map Overlay section.

**New behavior — corridor cell rendering:**

After the main node-rendering loop (which processes the 11×11 grid cells), add a second pass over `CORRIDOR_CELLS`:

```js
// Inside _renderMapGrid(), after the main grid loop:

const activeSet = new Set((S_story.lastCorridorCells || []).map(p => p.r + ',' + p.c));
const nodeCoordSet = new Set(Object.values(NODE_COORDS).map(p => p.r + ',' + p.c));

for (let dr = -5; dr <= 5; dr++) {
  for (let dc = -5; dc <= 5; dc++) {
    const r = cr + dr, c = cc + dc;
    const key = r + ',' + c;
    const corr = CORRIDOR_CELLS[key];
    if (!corr) continue;
    if (nodeCoordSet.has(key)) continue;  // node takes precedence

    const cell = grid.children[(dr + 5) * 11 + (dc + 5)];  // reuse existing cell
    if (!cell || cell.classList.contains('mc-current') || cell.classList.contains('mc-node')
               || cell.classList.contains('mc-visited') || cell.classList.contains('mc-trail')) {
      continue;  // don't overwrite a rendered node cell
    }

    const isActive = activeSet.has(key);
    cell.classList.add('mc-corridor');
    if (isActive) cell.classList.add('mc-corridor-active');

    // Check if both endpoint nodes of any edge through this cell are visited
    const anyVisited = corr.edges.some(e =>
      S_story.visited[e.from] && S_story.visited[e.to]);
    if (anyVisited) cell.classList.add('mc-corridor-visited');
    else            cell.classList.add('mc-corridor-dim');

    cell.innerHTML = '<div class="mc-wire">' + corr.glyph + '</div>';
  }
}
```

**Junction node rendering:**

Junction nodes have `node.junction === true`. In the existing node-rendering block, add a branch:

```js
if (node.junction) {
  cell.classList.add('mc-junction');
  cell.innerHTML = '<div class="mc-icon">✛</div><div class="mc-code">' + code + '</div>';
}
```

**Active exit arrow highlight (L9-H):**

In the section that renders the previous node cell (the `mc-trail` cell matching `S_story.lastExitCode`), after `_mapAddExits(cell, code)`, mark the exit arrow span:

```js
if (code === S_story.lastExitCode && S_story.lastExitDir) {
  const exitSpan = cell.querySelector('.dir-' + S_story.lastExitDir.toLowerCase());
  if (exitSpan) exitSpan.classList.add('mc-exit-active');
}
```

---

## 5. `_setActivePath(fromCode, toCode, dir)` — L9-H

**When:** Called in `storyMove()` and `storyCorridorTravel()` immediately before `storyRender()`.

**Contract:**

```js
/**
 * Records the corridor cells between fromCode and toCode as the active
 * (last-traveled) path. Sets S_story.lastCorridorCells, lastExitDir,
 * lastExitCode. These are used by _renderMapGrid() to apply the gold
 * highlight to the wire and the exit arrow.
 *
 * @param {string} fromCode — node the player just left
 * @param {string} toCode   — node the player is moving to
 * @param {string} dir      — 'N'|'S'|'E'|'W' — direction taken
 */
function _setActivePath(fromCode, toCode, dir) {
  S_story.lastExitCode      = fromCode;
  S_story.lastExitDir       = dir;

  // Collect corridor cells between from and to
  const from = NODE_COORDS[fromCode], to = NODE_COORDS[toCode];
  if (!from || !to) { S_story.lastCorridorCells = []; return; }

  const cells = [];
  const key = (r, c) => r + ',' + c;

  // Walk all cells in CORRIDOR_CELLS that belong to this edge
  Object.entries(CORRIDOR_CELLS).forEach(([k, corr]) => {
    if (corr.edges.some(e =>
      (e.from === fromCode && e.to === toCode) ||
      (e.from === toCode   && e.to === fromCode))) {
      const [r, c] = k.split(',').map(Number);
      cells.push({ r, c });
    }
  });

  S_story.lastCorridorCells = cells;
}
```

---

## 6. `storyMove()` modifications — L9-G

**Location:** existing `storyMove(dir)` function.

**Change:** After the gate lock checks and shard gate check, and before calling `storyRender(next)`, intercept non-adjacent moves:

```js
function storyMove(dir) {
  // ... existing gate lock logic unchanged ...

  const fromCoords = NODE_COORDS[S_story.currentCode];
  const toCoords   = NODE_COORDS[dest];
  const manhattan  = fromCoords && toCoords
    ? Math.abs(fromCoords.r - toCoords.r) + Math.abs(fromCoords.c - toCoords.c)
    : 0;

  storyCheckMissedSleep();
  S_story.log.push(S_story.currentCode);
  if (S_story.log.length > 20) S_story.log.shift();

  if (manhattan >= 2) {
    // Non-adjacent — show Hunt/Warp corridor dialog
    storyCorridorTravel(S_story.currentCode, dest, dir);
    return;
  }

  // Adjacent — move directly (existing behavior)
  _setActivePath(S_story.currentCode, dest, dir);
  S_story.currentCode = dest;
  storyRender(next);
}
```

---

## 7. `storyCorridorTravel(fromCode, toCode, dir)` — L9-E

**Contract:**

```js
/**
 * Shows the Hunt/Warp corridor travel dialog.
 * Called by storyMove() when the destination is 2+ cells away on the grid.
 *
 * @param {string} fromCode — current node code
 * @param {string} toCode   — destination node code
 * @param {string} dir      — direction taken
 */
function storyCorridorTravel(fromCode, toCode, dir) {
  const fromNode = NODE_MAP[fromCode];
  const toNode   = NODE_MAP[toCode];
  const terrain  = _corridorTerrain(fromCode, toCode);
  const notoriety      = _notoriety();   // level*3 + floor(battlesWon/2)
  const activeQs       = Object.values(S_story.quests).filter(s => s === 'active').length;
  const encounterPct   = Math.min(95, Math.round(10 + notoriety * 1.5 + activeQs * 4));

  document.getElementById('corridor-from').textContent  = fromNode ? fromNode.label.split(' — ')[0] : fromCode;
  document.getElementById('corridor-to').textContent    = toNode   ? toNode.label.split(' — ')[0]   : toCode;
  document.getElementById('corridor-terrain').textContent = terrain;
  document.getElementById('corridor-quest-count').textContent = activeQs;
  document.getElementById('corridor-pct').textContent   = encounterPct + '%';
  document.getElementById('corridor-encounter-rate').textContent =
    encounterPct + '% — notoriety ' + notoriety + ' · ' + activeQs + ' active quests';

  // Wire the two action buttons for this specific travel (use closure)
  const doTravel = (hunt) => {
    document.getElementById('story-corridor-overlay').classList.remove('visible');
    _setActivePath(fromCode, toCode, dir);
    S_story.currentCode = toCode;
    if (hunt) {
      triggerCorridorEncounter(terrain, () => storyRender(NODE_MAP[toCode]));
    } else {
      storyRender(NODE_MAP[toCode]);
    }
  };

  document.getElementById('btn-corridor-warp').onclick = () => doTravel(false);
  document.getElementById('btn-corridor-hunt').onclick = () => doTravel(true);
  document.getElementById('btn-corridor-cancel').onclick = () => {
    document.getElementById('story-corridor-overlay').classList.remove('visible');
  };

  document.getElementById('story-corridor-overlay').classList.add('visible');
}
```

---

## 8. `triggerCorridorEncounter(terrain, onComplete)` — L9-F

**Contract:**

```js
/**
 * Rolls encounter chance and optionally starts a corridor battle.
 * If no encounter, calls onComplete() immediately.
 * If encounter, picks a random monster from WORLD_DB[terrain] weighted by tier,
 * then triggers storyPreBattle()-equivalent flow. onComplete() is called
 * by the existing post-battle outcome path.
 *
 * @param {string}   terrain    — WORLD_DB terrain key
 * @param {Function} onComplete — called when travel resolves (encounter beaten, fled, or no encounter)
 */
function triggerCorridorEncounter(terrain, onComplete) {
  const notoriety    = _notoriety();
  const activeQs     = Object.values(S_story.quests).filter(s => s === 'active').length;
  const encounterPct = Math.min(95, Math.round(10 + notoriety * 1.5 + activeQs * 4));
  const chance       = encounterPct / 100;

  if (Math.random() >= chance) {
    // No encounter — continue travel
    onComplete();
    return;
  }

  // Pick monster weighted by tier
  const pool = (WORLD_DB[terrain] || WORLD_DB['midlands']).monsters;
  const monster = _weightedMonsterPick(pool);
  if (!monster) { onComplete(); return; }

  // Store callback so post-battle outcome can fire it
  _corridorOnComplete = onComplete;

  // Synthesise a minimal node-battle context
  const fakeNode = {
    code: '_corridor',
    label: 'Corridor — ' + terrain,
    battle: { label: monster.name, key: monster.key },
    num: 0, act: 0, text: '', npc: null, loot: null, sleep: false,
  };
  _preBattNode = fakeNode;
  _selectedConds = new Set();
  _availableConds = [];
  CONDITION_ITEMS.forEach(ci => {
    const inv = S_story.inventory.find(it => it.name.toLowerCase().includes(ci.match.toLowerCase()));
    if (inv) _availableConds.push({ ...ci, invName: inv.name });
  });

  loadWorldMonster(monster);
  S.player.hp    = S_story.hp;
  S.player.maxHp = S_story.hpMax;
  refreshLeftPanel();

  // Mark as corridor battle (so storyApplyOutcome knows to fire _corridorOnComplete)
  S_story.pendingBattle = {
    nodeCode: '_corridor',
    name: monster.name,
    label: 'Corridor — ' + terrain,
    isCorridor: true,
  };
  _renderPreBatt();
  document.getElementById('story-prebatt-overlay').classList.add('visible');
}

// Module-level: holds the callback for corridor battle resolution
let _corridorOnComplete = null;
```

**`_weightedMonsterPick(pool)` helper:**

```js
/**
 * Picks one monster from pool using tier weights:
 *   trivial+easy: 70%, medium: 25%, hard: 4%, deadly: 1%
 *
 * @param  {MonsterEntry[]} pool
 * @returns {MonsterEntry|null}
 */
function _weightedMonsterPick(pool) {
  const WEIGHTS = { trivial:35, easy:35, medium:25, hard:4, deadly:1 };
  const weighted = [];
  pool.forEach(m => {
    const w = WEIGHTS[m.tier] || 10;
    for (let i = 0; i < w; i++) weighted.push(m);
  });
  if (!weighted.length) return null;
  return weighted[Math.floor(Math.random() * weighted.length)];
}
```

**`storyApplyOutcome()` modification (existing function):**

Add at the end of `storyApplyOutcome(won)`, before the final `storyRender()` call:

```js
// If this was a corridor battle, fire the corridor callback instead of re-rendering
if (pb && pb.isCorridor && _corridorOnComplete) {
  const cb = _corridorOnComplete;
  _corridorOnComplete = null;
  if (hp === 0) { storyAutoSave(); storyGameOver(); return; }
  cb();
  return;
}
```

---

## 9. CSS Rules — L9-C

Add to the `<style>` block, inside the `/* Map Overlay */` section:

```css
/* ── Corridor Cells ── */
.mc-corridor {
  display: flex; align-items: center; justify-content: center;
  background: transparent;
}
.mc-wire {
  font-size: 16px; line-height: 1; font-family: monospace;
  color: #4a4a8a; opacity: 0.85;
}
.mc-corridor-dim .mc-wire {
  color: #2a2a4a; opacity: 0.5;
}
.mc-corridor-visited .mc-wire {
  color: #5a5aaa; opacity: 0.9;
}
.mc-corridor-active .mc-wire {
  color: var(--gold-lt);
  text-shadow: 0 0 6px var(--gold);
  font-weight: 900;
  opacity: 1.0;
}

/* ── Junction Cells ── */
.mc-junction {
  border: 1px solid #4a3a7a;
  background: #0f0a1a;
}
.mc-junction .mc-icon { color: var(--purple); font-size: 11px; }
.mc-junction .mc-code { color: #7a6aaa; font-size: 8px; }

/* ── Active Exit Arrow ── */
.mc-exit-active {
  color: var(--gold-lt) !important;
  text-shadow: 0 0 5px var(--gold);
  font-weight: 900 !important;
}
```

---

## 10. HTML — Hunt/Warp Corridor Overlay (L9-E)

Add after the `#story-npc-modal` div:

```html
<!-- ── Corridor Travel overlay (Layer 9) ── -->
<div id="story-corridor-overlay">
  <div id="corridor-card">
    <div id="corridor-hd">⚡ Time-Warp Footpath</div>
    <div id="corridor-route">
      <span id="corridor-from"></span>
      <span class="corridor-arrow"> → </span>
      <span id="corridor-to"></span>
    </div>
    <div id="corridor-terrain-row">Road: <span id="corridor-terrain"></span></div>
    <div id="corridor-risk">
      <span id="corridor-quest-count"></span> active quest(s) →
      <span id="corridor-pct"></span> encounter chance
    </div>
    <div id="corridor-actions">
      <button id="btn-corridor-warp">⚡ Warp — instant, safe</button>
      <button id="btn-corridor-hunt">🎯 Hunt — roll encounter</button>
      <button id="btn-corridor-cancel">✕ Cancel</button>
    </div>
  </div>
</div>
```

Add CSS for the overlay card alongside the other story modals:

```css
#story-corridor-overlay {
  position: fixed; inset: 0; z-index: 200;
  background: rgba(0,0,0,0.78); display: none;
  align-items: center; justify-content: center; padding: 20px;
}
#story-corridor-overlay.visible { display: flex; }
#corridor-card {
  background: var(--panel); border: 2px solid #4a6a8a;
  border-radius: 8px; padding: 24px 28px; max-width: 440px; width: 100%;
  display: flex; flex-direction: column; gap: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.6);
}
#corridor-hd {
  font-size: 11px; font-weight: 700; letter-spacing: 1.5px; color: #6ab4d4;
  text-transform: uppercase; border-bottom: 1px solid var(--border); padding-bottom: 8px;
}
#corridor-route { font-size: 14px; font-weight: 700; color: var(--text); }
.corridor-arrow { color: var(--dim); }
#corridor-terrain-row { font-size: 11px; color: var(--dim); }
#corridor-risk {
  font-size: 12px; color: var(--gold); background: #1a1a10;
  border: 1px solid #3a3a10; border-radius: 4px; padding: 6px 10px;
}
#corridor-actions { display: flex; flex-direction: column; gap: 8px; }
#btn-corridor-warp {
  padding: 9px 14px; font-size: 13px; font-weight: 700; border-radius: 5px;
  background: #0a1a2a; border: 1px solid #4a8aaa; color: #80c4e0; cursor: pointer;
}
#btn-corridor-warp:hover { background: #102a3a; }
#btn-corridor-hunt {
  padding: 9px 14px; font-size: 13px; font-weight: 700; border-radius: 5px;
  background: #1a0a0a; border: 1px solid var(--red); color: var(--red-lt); cursor: pointer;
}
#btn-corridor-hunt:hover { background: #2a0a0a; }
#btn-corridor-cancel {
  align-self: flex-end; padding: 5px 14px; font-size: 11px; border-radius: 4px;
  background: transparent; border: 1px solid var(--border); color: var(--dim); cursor: pointer;
}
#btn-corridor-cancel:hover { border-color: var(--dim); color: var(--text); }
```

---

## 11. Escape Key & storyExit Integration

Add `'story-corridor-overlay'` to:
- The Escape key handler's `for (const id of [...])` list
- The `storyExit()` cleanup array

---

## 12. Implementation Order Checklist

| Step | What to do | Done |
|------|-----------|------|
| L9-A | Add `WIRE_GLYPH`, `CORRIDOR_TERRAIN` consts; write `buildCorridorMap()`, `_routeSegments()`, `_wireGlyph()`, `_corridorTerrain()`; J1–J7 NODE_COORDS entries; call `buildCorridorMap()` at startup | ✅ |
| L9-B | Add J1–J7 NODE_MAP entries; update the 12 existing node edges listed in §2 | ✅ |
| L9-C | Add all CSS rules from §9 to the style block | ✅ |
| L9-D | Modify `_renderMapGrid()` per §4 | ✅ |
| L9-E | Add HTML from §10; write `storyCorridorTravel()` per §7 | ✅ |
| L9-F | Write `triggerCorridorEncounter()`, `_weightedMonsterPick()`; patch `storyApplyOutcome()` per §8 | ✅ |
| L9-G | Modify `storyMove()` per §6; write `_setActivePath()` per §5 | ✅ |
| L9-H | Add `lastCorridorCells`, `lastExitDir`, `lastExitCode` to `S_story` and `_S_DEFAULTS()`; Escape + storyExit wiring from §11 | ✅ |

---

*Last updated: 2026-05-21*  
*Status: ✅ COMPLETE — L9-A through L9-H all implemented (6,700 lines, 2026-05-21)*


---
*© 2026 Paul Richeson — MIT License. See [LICENSE](LICENSE) for full text.*
