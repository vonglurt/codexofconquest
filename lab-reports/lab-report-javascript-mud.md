<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->
# Lab Report — The JavaScript of `roll2hit-v3.html`: Layers, Traces, and the MUD Client

**Date:** 2026-07-16 · **Subject:** `roll2hit-v3.html` @ `43bd09c` · `ENGINE_VER = 'r2h-3.104.0'`
**Trigger (Lab Report Policy):** structural read of a system with no existing whole-file code map — four execution traces (program, UI, movement, quest acceptance) requested to explain how the MUD client and its HTML interface actually work.
**Method:** direct read of the single `<script>` block (lines 5271–37247). Every line number, count, and quoted fragment below was read out of the live file, not recalled. Nothing here is a proposal; this is a description of what the code does today.

---

## Abstract

`roll2hit-v3.html` is a **5.3 MB, 37,271-line single file** with no build step, no modules, and no imports: one `<style>`, one `<body>`, one `<script>`. Read naively it looks like a monolith. It is not. Measured, it is **~76% data and ~24% code** — and the code inside it is stratified into five genuinely distinct layers with sharply different engineering quality.

The finding that matters most: **the MUD core is the best-engineered code in the file, and it is the only code in the file that is pure.** Movement (`MOVER:CORE`), room description (`ROOMS:CORE`), and duel resolution (`DUEL:CORE`) are pure, world-injected kernels, inlined byte-identically from `js/mover.js`, `js/rooms.js`, and `js/duel.js`, with CI parity scripts asserting the two copies never drift. They touch no DOM and no global state. Everything else in the file — all rendering, all quest side effects — reads and writes two module-global state atoms directly.

The sharpest structural contrast in the file sits inside one function. `storyRender` (lines 30502–34862, **4,360 lines — the single largest function**) is two programs stacked: **~2,400 lines of hardcoded per-node special cases** (`if (node.code === 'LHR')`, `if (node.code === 'SQ')`, …, ~60 such blocks) followed at line 32918 by a **compact, generic, data-driven section engine** (`_mkSection` / `_mkCard`) that renders every node's Fish/Encounter/Quests/Loot/Rest/World UI from data. The generic engine is what the file was evolving toward; the 2,400 lines above it are what it is evolving away from.

Quest acceptance has **no accept step**. There is no accept button and no dialogue confirmation. Arriving at a node runs `storyCheckQuests`, which scans all 2,850 `QUEST_DB` entries, matches `activateNode === node.code`, evaluates a declarative gate, and writes `S_story.quests[id] = 'active'`. The player is *told* (`📋 <title>`), never *asked*. Consent is implicit in arrival.

---

## I. File geography (measured)

| Region | Lines | Count | % of file |
|---|---|---|---|
| `<style>` CSS | 8–3479 | 3,472 | 9.3% |
| `<body>` HTML markup | 3481–5270 | 1,790 | 4.8% |
| `S` + `ENEMY_DB` | 5277–5350 | 74 | 0.2% |
| `MONSTER_POOL` | 5355–5792 | 438 | 1.2% |
| `MONSTER_DROPS` | 5797–6271 | 475 | 1.3% |
| `WORLD_DB` (terrain) | 6279–6413 | 135 | 0.4% |
| Dice + combat engine | 6417–8021 | 1,605 | 4.3% |
| **Event wiring** (`DOMContentLoaded`) | 8025–8247 | 223 | 0.6% |
| `NODE_MAP` (401 nodes) | 8255–9233 | 979 | 2.6% |
| `NODE_COORDS` | 9238–9665 | 428 | 1.1% |
| Cell grid / sea / road masks | 9671–9716 | 46 | 0.1% |
| **MOVER + ROOMS + DUEL kernels** | 9721–10212 | 492 | 1.3% |
| `NPC_DIALOGUES` | 10215–10431 | 217 | 0.6% |
| **`QUEST_DB` (2,850 quests)** | 10434–21539 | **11,106** | **29.8%** |
| **UQF `QuestRuntime`** | 21540–21797 | 258 | 0.7% |
| Misc registries / NPC profiles | 21798–22405 | 608 | 1.6% |
| `S_story` + `_S_DEFAULTS` | 22409–22809 | 401 | 1.1% |
| Story engine (save/vendor/battle/render) | 22810–37246 | 14,437 | 38.7% |

**Totals:** 425 function declarations. 2,850 `QUEST_DB` entries, of which **2,803 carry `schema:'UQF-1.0'`** (47 legacy stragglers: `quest_math_01–05` plus the 30 dead `blq_05–10` book-stubs, all activate-only, none executable). 401 nodes in `NODE_MAP`. 52 `storyRender(` call sites; 62 `storyAutoSave()` call sites.

The headline: **`QUEST_DB` alone is 11,106 lines — larger than every kernel, every runtime, and every registry in the file combined.** The engine that executes those 2,850 quests (`QuestRuntime`) is **258 lines**. That 43:1 data-to-engine ratio is the file's central design achievement and is discussed in §VI.

---

## II. The layer model

The `// Layer NN:` comments scattered through the file (Layer 39, Layer 44, Layer 51, Layer 78…) are **not architectural layers**. They are chronological feature epochs — "Layer 78: La Riva" is a story arc, not a tier. They are useful as provenance tags and misleading as structure. The real stratification, by data flow and dependency direction, is:

```
L5  WIRING          DOMContentLoaded (8025–8247) · parse-time tail (36831–37246)
                    keydown (36718) · d-pad (36855) · sheet tabs (36842)
                        ↓ calls
L4  RENDER / DOM    storyRender (30502–34862, 4360 lines) · _enterEmptyCell (27664)
                    _mkSection/_mkCard (32919/32932) · _updateExitLinks (36072)
                    storyUpdateStatus (34864) · storyRenderQuests (29901)
                        ↓ reads/writes
L3  ENGINE          QuestRuntime (21610) · cellMove (27589) · _travelTick (36593)
                    storyCheckQuests (29355) · _resolveQuestUQF (6799)
                    combat: doPlayerAttack (7199) · rollMainDamage (7396)
                        ↓ reads/writes
L2  STATE           S (5277) — combat sandbox    ·    S_story (22409) — MUD world
                    _S_DEFAULTS (22470) = canonical shape · localStorage persistence
                        ↑ injected into (never read by)
L1  PURE KERNELS    MOVER:CORE  (9733–9780)  moverMove(world,pos,dir) → MoveResult
                    ROOMS:CORE  (9804–10036) describeCell(world,pos)  → Room
                    DUEL:CORE   (10057–10212) commit-reveal duel resolution
                    ── shared byte-identically with js/{mover,rooms,duel}.js ──
                        ↑ reads
L0  DATA            QUEST_DB · NODE_MAP · NODE_COORDS · MONSTER_POOL · MONSTER_DROPS
                    WORLD_DB · SEA_RUNS/SEA_LANES → IMPASSABLE_CELLS · ROAD_RUNS → ROAD_CELLS
                    NPC_DIALOGUES · BIRKA_NPC_PROFILES · GEO_PROJ 90×360
```

**The dependency rule that holds:** L1 never reads L2. The kernels receive a `world` snapshot as an argument and return plain objects. `moverMove` cannot see `S_story`; `describeCell` cannot see the DOM.

**The dependency rule that does not hold anywhere else:** L3 and L4 both read and write `S_story` directly, as a global. There is no accessor layer, no event bus, no reducer. `QuestRuntime.HANDLERS.flag_write` is, in full:

```js
flag_write(bit) { (bit.set || []).forEach(f => S_story[f] = true); (bit.clear || []).forEach(f => S_story[f] = false); }
```

Quest data writes arbitrary keys onto the global state object by name. This is the file's core coupling and its core flexibility — see §VI.

### The parity contract (L1)

Three blocks are fenced by sentinel comments and shared with the server:

```js
// ◆◆◆ MOVER:CORE:START ◆◆◆   (9733)   ← js/mover.js   · scripts/check-mover-parity.js
// ◆◆◆ ROOMS:CORE:START ◆◆◆   (9804)   ← js/rooms.js   · scripts/check-rooms-parity.js
// ◆◆◆ DUEL:CORE:START ◆◆◆    (10057)  ← js/duel.js    · scripts/check-duel-parity.js
```

The header comment states the contract plainly (9717–9720):

> `The block between the MOVER:CORE sentinels is inlined BYTE-IDENTICALLY from mover.js (the server require()s the same source); §WALK-4 walk-parity asserts the two copies match. Edit mover.js, not this copy, then re-run: node scripts/check-mover-parity.js`

`npm run check:walk` chains six of these checks. This is how a single-file client with no build step still shares real code with a Node server: **duplicate the source, then mechanically assert the duplicate never drifts.** It is the file's most important engineering decision — the whole MUD layer rests on it.

`DUEL:CORE` goes further: it ships a **hand-written synchronous SHA-256** (`__duelSha256`, 10061) rather than use `crypto.subtle`, explicitly so that no environment-specific crypto API can make client and server disagree (10058–10060). Purity is enforced to the point of reimplementing a hash.

---

## III. Program trace — boot

The `<script>` sits at the end of `<body>` (opens 5271, body closes 37270), so the DOM above it is already parsed when the script runs. This detail decides the entire boot order, and produces a result most readers would guess wrong.

```
① Browser parses <style> (8–3479), then <body> (3481–5270) — every #id the script
  will touch now exists in the DOM.

② <script> parse begins (5271). 'use strict'.

③ Top-level consts evaluate in source order. Three IIFEs do real work at parse time:
     CELL_GRID       (9671)  inverts NODE_MAP+NODE_COORDS → {"r,c": [codes]}
     IMPASSABLE_CELLS(9690)  expands SEA_RUNS  RLE → Set of 4,790 cell keys
     ROAD_CELLS      (9703)  expands ROAD_RUNS RLE → Set of 400 road cells
  → The world's passability and road topology are materialized before any handler exists.

④ Line 8025: document.addEventListener('DOMContentLoaded', …) — REGISTERS a handler,
  does not run it. Closes at 8247. This block wires the COMBAT sheet only
  (player-roll-btn, opp-roll-btn, roll-dmg-btn, multi-atk-btn, cond-select…).

⑤ Parse continues through the data mass: NODE_MAP, QUEST_DB (11k lines),
  QuestRuntime, S_story, _S_DEFAULTS, the story engine, the kernels.

⑥ Line 36831 — TOP-LEVEL, NOT in a handler:

      /* ── Auto-enter story mode on load ── */
      storyEnter();

  This EXECUTES DURING PARSE. The MUD renders here — before DOMContentLoaded fires.

⑦ Line 36836: if the continue modal is not up, _mpResume() rejoins a live mesh session.

⑧ Lines 36839–37246 — still top-level, still parse-time: the STORY UI wires itself.
      36839  story-mode-btn        → storyToggle
      36842  sheet tab bar         → switchSheet / storyInventoryToggle / storyQuestToggle …
      36855  d-pad N/S/E/W         → cellMove(d)
      36718  document keydown      → cellMove / storyInventoryToggle / storyQuestToggle …
      36889  waypoint button       → _travelStart / _travelStop / storyWaypoint

⑨ Script ends (37247). ONLY NOW does DOMContentLoaded fire → the ④ handler runs →
  the combat sheet finally wires up.
```

**The load-bearing consequence:** the file has **two disjoint wiring phases in inverted order**. The MUD/story UI is wired *and already rendered* at parse time; the combat sheet is wired afterward, on `DOMContentLoaded`. The world exists on screen before the combat panel has a single listener attached. This is safe only because `storyEnter()` hides `#main-body` (23716) — the unwired combat panel is not reachable while it is unwired.

This is also why the repo's test-helper convention (memory: *"no story-mode-btn click; storyEnter() fires on load"*) exists. Tests must not click into story mode, because the game is already in story mode by the time any test can act.

### `storyEnter` → the continue fork (23714)

```js
function storyEnter() {
  S_story.active = true;
  document.getElementById('main-body').style.display = 'none';
  document.getElementById('practice-badge').style.display = 'none';
  document.getElementById('story-panel').classList.add('visible');
  document.getElementById('story-mode-btn').classList.add('active');
  document.getElementById('story-mode-btn').textContent = '⚔ Battle';
  if (!storyCheckContinue()) {
    storyRender(NODE_MAP[S_story.currentCode]);
    if (S_story.pendingBattle) storyShowOutcome();
  }
}
```

`storyCheckContinue` (23155) is the fork, and it is guarded by a module-global one-shot (`_continueChecked`, 23152) so it can only ever fire once per page life. It reads `localStorage['r2h_autosave']` and returns `true` — *suppressing the render* — if it put a modal on screen:

- `save.hp === 0` → restore state, populate the chronicle, show the **game-over modal**, return `true`.
- otherwise → show the **continue modal** ("Day N of 49 · location · N item(s)"), return `true`.
- no save / parse throw → return `false` → `storyEnter` renders the world directly.

So a returning player's world is *not* rendered at boot; it renders when they click Continue (`storyLoadContinue`, 23269). A fresh player's world renders immediately.

### The `_S_DEFAULTS` merge (the §STATE-INIT lesson)

`storyLoadSave` (23141) carries a scar worth reading:

```js
Object.assign(S_story, _S_DEFAULTS(), JSON.parse(raw));
```

Defaults go **in the middle**, not last: they backfill fields the save predates, then the save's real values win. The comment (23145–23146) records why: *"saves written before a field existed (e.g. pre-§CELL-04 visitedCells) must not leave it undefined — cellMove crashed on such saves."* The `let S_story = {…}` literal at 22409 is explicitly demoted to a seed — *"Do not rely on these values; keep _S_DEFAULTS() authoritative"* — because the literal and the defaults had drifted apart and the drift was the bug.

---

## IV. User interface trace

### The HTML skeleton the JS drives

```
#main-body            (3502)  combat sheet — hidden by storyEnter()
#story-panel          (4149)  the MUD client
  #story-center       (4214)
    #story-sheet-tab-bar (4217)          Story · Inventory · Quests · Map · Journal · Character
    #sheet-story      (4246) .active     ← the room view
      #s-node-num     (4255)   "01"      ← badge / terrain icon
      #s-node-name    (4256)   "City Streets — Birka"
      #s-node-act     (4257)   "Act I"
      #story-text-box (4272)             ← room prose. THE ANCHOR (see below)
      #story-info-row (4277)             ← generated section cards, wiped every render
      #story-move-msg (4281)             ← the message line / travel status strip
    #sheet-inventory  (4352)   #sheet-quests (4485)   #sheet-character (4561)
    #sheet-journal    (4570)   #sheet-map    (4579)
  #story-dpad         (4747)   #btn-N (4749) #btn-W (4751) #btn-E (4753) #btn-S (4755)
  #exit-N/E/W/S       (4799–4802)         ← the MUD exit lines
```

**Sheets are exclusive, modals are a stack.** `switchSheet('sheet-story')` toggles `.active`; overlays use `.visible`. `storyRender` opens by force-closing everything (30525–30528) — every navigation slams the UI back to the room view.

### The two DOM idioms

**1. Fixed slots, overwritten.** The header and prose are static elements the render fills:

```js
document.getElementById('s-node-num').textContent  = String(node.num).padStart(2,'0');
document.getElementById('s-node-name').textContent = node.label + (_terrain ? ' · ' + _terrain : '');
document.getElementById('story-text-box').textContent = _nt;
```

**2. Generated cards, destroyed and rebuilt.** Everything else is torn down each render. Two distinct teardowns run, and the difference between them is the interesting part.

The **sibling sweep** (30547–30552) removes dynamic nodes between the prose box and the info row:

```js
{ let _el = document.getElementById('story-text-box').nextElementSibling;
  while (_el && _el.id !== 'story-info-row') {
    const _next = _el.nextElementSibling; _el.remove(); _el = _next;
  }
}
```

This is a **DOM-position-encoded contract**: "everything physically between `#story-text-box` and `#story-info-row` is transient." It is not expressed in a class, an attribute, or a container — it is expressed in sibling order. Any element inserted into that gap is deleted on the next step, by anyone, forever. `_renderNodeShell` (27652) repeats the identical sweep for empty cells, with a comment recording that a §MATH-01 change once wrote to a `#story-content` that did not exist and *"threw 'Cannot set properties of null' on every empty-cell step."*

The **row wipe** (32961–32962) is blunter: `row.innerHTML = ''`.

### The section engine (32918 — the good part)

Below 32918, the UI is a clean two-primitive builder. `_mkSection(id, icon, label)` returns `{sec, body}`; `_mkCard(opts)` builds a card from a plain options object:

```js
// opts: { lbl, main, sub, hint, tag, tagClass, btn, btnClass, btnClick, done, clickable, click }
```

Sections append in fixed order: **FISH (32964) · ENCOUNTER (32977) · QUESTS (33144) · LOOT (33295) · REST (33320) · TOURNAMENT (33388) · WORLD (33513)**. A whole feature is ~8 lines:

```js
const hasFish = node.isFishingLake;
if (hasFish) {
  const { sec, body } = _mkSection(null, '🎣', 'Fish');
  body.appendChild(_mkCard({
    lbl: 'FISH', main: 'Cast a Line',
    hint: '⏱ 1 hour · fishing session',
    tag: '1h', btn: 'Fish', btnClass: 'btn-hunt',
    btnClick: () => storyFishing()
  }));
  row.appendChild(sec);
}
```

`node.isFishingLake` is data. Add the flag in `NODE_MAP`, the node gets a fishing card. This is the architecture the file wants.

One note on safety: `_mkCard` sets `main` via **`innerHTML`** (32942) while `sub` and `hint` use `textContent` (32945/32948). `main` therefore accepts markup by design (quest titles carry icons/emphasis). Content flows from `QUEST_DB`/`NODE_MAP` — author-controlled, not player-controlled — so this is not an injection path. I checked the one function whose name suggests player-authored content, `storyCreateCustomQuest` (36689): it reads a `<select>` value, constrains it to a `WORLD_DB` key, and derives its label from `WORLD_DB[terrain].label`. **There is no free-text input anywhere in the story UI** — nothing player-typed reaches the DOM at all, via `main` or otherwise.

### Input → the same funnel

Keyboard (36718) and d-pad (36855) converge on one call:

```js
const dirMap = { ArrowUp:'N', ArrowDown:'S', ArrowRight:'E', ArrowLeft:'W',
                 n:'N', s:'S', e:'E', w:'W', N:'N', S:'S', E:'E', W:'W' };
```

Both `nsew` and arrows work — MUD muscle memory and modern habit share a path. `b`/`i`/`q`/`m`/`j` open battle/inventory/quests/map/journal. `Escape` unwinds one layer: active sheet → story, else the topmost visible modal from a fixed list (36747–36754), else `storyExit()`.

Two guards sit at the top, in this order:

```js
if (!S_story.active) return;
if (['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName)) return;
if (_travelActive()) { e.preventDefault(); _travelStop('Travel halted.'); return; }
```

The keystroke that halts auto-travel is **consumed by the halt** — it does not also move you. Any key stops the horse; it takes a second press to walk. The keyboard handler additionally respects the d-pad's disabled state (36730), so a direction blocked in the UI is blocked at the keyboard too.

---

## V. Movement trace — the MUD core

This is the cleanest path in the file. Full trace of one step, `cellMove('N')` (27589):

```
① GUARD — user input during auto-travel halts it and returns (27593):
     if (_travelActive() && !_travelStepping) { _travelStop('Travel halted.'); _navStop(); return; }
   _travelStepping is the discriminator: true ONLY while the travel loop calls
   cellMove itself. Same function, two callers, opposite meanings — a user's N
   means "stop", the loop's N means "step".

② KERNEL — the only decision point (27596):
     const res = Mover.move(_moverWorld(), { r: S_story.playerR || 0, c: S_story.playerC || 0 }, dir);
     if (!res.ok) { storyBlock('No path leads that way.'); return; }

   _moverWorld() (9789) builds the snapshot fresh per move:
     { proj: GEO_PROJ,                    // 90 × 360
       impassable: IMPASSABLE_CELLS,      // 4,790 sea cells
       cellCodes: (r,c) => cellCodes(`${r},${c}`),
       terrainAt: (r,c) => _inferTerrain(r,c),
       encounterRate: (t) => TERRAIN_ENCOUNTER_RATE[t] ?? _default }

   moverMove (9756) is pure:
     - __moverStep: nr = r+dr (clamped, N/S band edge) · nc = ((c+dc)%360+360)%360 (E↔W WRAPS)
     - oob → blocked 'oob' · impassable → blocked 'sea'
     - returns { ok, from, to, via, destCodes, destKind, terrain, encounter:{eligible, baseRate} }

③ SIDE EFFECTS — cellMove applies what the kernel decided (27602–27609):
     storyCheckMissedSleep();
     S_story.log.push(S_story.currentCode);        // breadcrumb, capped at 20
     S_story.playerR = nr; S_story.playerC = nc;
     if (!S_story.visitedCells) S_story.visitedCells = {};   // §STATE-INIT scar
     S_story.visitedCells[`${nr},${nc}`] = true;
     _statTally('exitsTaken', 1);
   NOTE (27610): §TIMELESS-01 — a step does NOT advance the clock. Time passes on
   battle / sleep / fishing / rest only. Walking is free.

④ FORK on destKind:
   ├─ NAMED CELL (destNode):
   │    _getFarewell(from, to) → _pendingFarewell   (NPC goodbye line, consumed by storyRender)
   │    _setActivePath(from, to, dir)               → S_story.lastExitCode/lastExitDir
   │    S_story.currentCode = destCode;
   │    storyRender(destNode);                      → the 4,360-line path (§VI)
   └─ EMPTY CELL:
        _enterEmptyCell(nr, nc);                    → the room layer

⑤ mpBeacon();  // §MESH-01a fire-and-forget presence beacon; no-op unless connected
```

The header comment states the design intent exactly (27594–27595): *"bounds/wrap/sea decisions live in the shared mover kernel (mover.js). cellMove is now a thin caller that applies the SP side effects to the result."* **The kernel decides; the caller mutates.** That separation is what lets the same movement code run headless on the server.

### `_enterEmptyCell` (27664) — where the MUD actually lives

```js
const room = describeCell(_roomWorld(), { r, c });
const body = room.prose +
  (room.signposts.length ? '\n\n' + room.signposts.map(s => '🪧 ' + s).join('\n') : '');
_renderNodeShell(room.icon, room.title, room.sub, '— ' + room.title + ' —', body);
```

`describeCell` (9969) is a pure function returning `{icon, title, sub, terrain, prose, exits, signposts, landmarks}`. Three ideas make it work:

**1. Deterministic prose.** Flavor text must be identical on client, server, and in tests — so it is hashed from coordinates, never randomized:

```js
function __roomHash(r, c) {
  let h = ((r * 73856093) ^ (c * 19349663)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 0x5bd1e995) >>> 0;
  return (h ^ (h >>> 15)) >>> 0;
}
const variants = __ROOM_PROSE[terrain] || __ROOM_PROSE._default;
const prose = variants[__roomHash(r, c) % variants.length].replace(/\{label\}/g, info.label);
```

A cell's description is a **property of its coordinates**, stable forever, free to store (nothing is stored). `__ROOM_PROSE` (9827) holds 2–4 variants for each of ~14 terrains plus a `{label}`-templated `_default` that covers all 60+ terrain keys.

**2. Exits are computed, not authored.** For each of N/S/E/W: `oob` → `'the edge of the known world'`; impassable → `'open sea'`; named neighbour → the node's label; road/lane → BFS to the next settlement; else → the neighbour's terrain label.

**3. Signage via constrained BFS.** `__roadDestination` (9899) walks the road/lane net — never back through the origin, max 40 steps, FIFO with fixed N/S/E/W expansion order for determinism — and yields `toward Birka (7)`. If a cell has no road signage, `__nearestLandmarks` (9934) BFSes open ground (radius 12, sorted by `(steps, code)`) for a fallback: `Birka lies 4 steps north of here.` Empty cells title themselves by terrain and locate themselves by landmark — *"Near Birka · 34,201"* — rather than by raw coordinates.

Then the encounter roll (27676–27691):

```js
let baseRate = _partyEncounterRate(TERRAIN_ENCOUNTER_RATE[terrain] ?? TERRAIN_ENCOUNTER_RATE._default);
if (S_story.huntMode) baseRate = Math.min(0.8, baseRate * 2);
if (Math.random() < baseRate) {
  const monster = _weightedMonsterPick(terrain);
  if (monster) {
    _encounterQueued = true;   // halts auto-travel BEFORE the battle fires
    setTimeout(() => _startStoryBattle(monster, `Wild ${monster.name}`), 300);
  }
}
```

**Roads are terrain, not permissions.** `TERRAIN_ENCOUNTER_RATE.road = 0` and `junction = 0`, so highways are safe *because of what they are*, not because movement is restricted. Hunt Mode doubles the rate — and `2 × 0 = 0`, so roads stay safe even hunting (27682–27683). The open field remains walkable everywhere; this is the §NAV-01 "Free-Movement invariant."

### Auto-travel (`_travelTick`, 36593)

A `setTimeout` loop at **120 ms/step**, not a `requestAnimationFrame` or a `while`:

```js
const dir = _roadGridDir(pos, wp);
if (!dir) { _travelStop('📍 No path to waypoint found. Move manually toward …'); return; }
_travelStepping = true;
try { cellMove(dir); } finally { _travelStepping = false; }
const now = _playerPos();
if ((now.r === pos.r && now.c === pos.c)          // blocked step (kernel refused)
    || _encounterQueued || S_story.pendingBattle  // encounter rolled / battle begun
    || !S_story.active) {                         // left story mode
  _travelStop();
  return;
}
_travelTimer = setTimeout(_travelTick, 120);
```

Two details worth naming. **The `try/finally` is load-bearing**: if `cellMove` throws, `_travelStepping` must still reset, or every subsequent user keypress would be misread as a loop step and the halt-on-input guard would never fire again. **Progress is verified positionally, not trusted**: the loop compares `_playerPos()` before and after and stops if the position did not change — it does not assume its own `cellMove` succeeded. Arrival is checked by **cell**, not by code (36597–36601), because co-located locales share a cell and `currentCode` equality alone would miss it.

---

## VI. Quest acceptance trace

**There is no accept step.** No button, no confirmation, no dialogue. Acceptance is a side effect of arrival — and it is the tail of `storyRender`, not `cellMove`, that performs it:

```
cellMove('N') → storyRender(destNode) → … 4,300 lines … → storyCheckQuests(node)   [34847]
```

`storyCheckQuests` (29355) runs in three passes over `QUEST_DB`:

### Pass 1 — activation (29358–29366)

```js
Object.values(QUEST_DB).forEach(q => {
  if (q.type === 'epic') return;                                    // epics activate via modal/defeat
  if (!S_story.quests[q.id] && q.activateNode === node.code) {
    if (q.activateCond && !q.activateCond()) return;                // legacy closure gate
    if (q.schema === 'UQF-1.0' && !QuestRuntime.canActivate(q.id)) return;   // declarative gate
    S_story.quests[q.id] = 'active';
    msgs.push('📋 ' + q.title);
  }
});
```

This is a **linear scan of all 2,850 quests on every single render** — and `storyRender` runs on every named-node arrival, every quest resolution, every battle outcome. `Object.values(QUEST_DB)` allocates a 2,850-element array each time. It is not a measured problem (a scan of 2,850 objects is sub-millisecond, and the file has no complaint on record about it), but it is the file's most obvious hot-loop-by-accident: the cost scales with *total quests authored*, not with quests near the player. An `activateNode → [quests]` index built once at parse time — exactly the shape `CELL_GRID` (9671) already builds for nodes — would make it scale with the node instead.

Note the **dual-gate dispatch**: `activateCond` (a legacy closure) and `canActivate` (declarative) are both consulted, in that order, and either can veto. This is the migration seam between the old and new quest systems, still visible in the live path.

### The declarative gate — `QuestRuntime.canActivate` (21617)

The heart of the UQF design. A quest's gate is **data**, and the runtime interprets ~14 term types, all AND-composed:

| Term | Meaning |
|---|---|
| `flags` / `notFlags` / `flagsAny` | `S_story` booleans: all / none / any |
| `flagEquals` | strict equality on a field (branch/role state) |
| `flagsPath` | dot-paths, all truthy (`yugurtTourBeat.pip`) |
| `nodes` | all listed nodes visited |
| `questsAttempted` / `questsDone` | arc chaining: non-empty status / terminal pass |
| `favorMin` | `{ npcKey: minFavor }` thresholds |
| `battles` / `notBattles` | defeated-combat prerequisites |
| `shardsMin` · `restedAtMin` · `sleptAt` | resource / rest / sleep gates |
| `countMin` | `[{path, min}]` — number → itself · array → length · object → key count · missing → 0 |

`canComplete` (21671) adds the completion side, and its comment (21665–21670) is candid about the one real constraint: `flags` are AND, while `flagsAny` + `battles` + `questsComplete` + `items` + `itemsMinAny` form **a single OR-group**. That models *"AND(pages) ∧ (flag OR defeated-battle)"* — but only that one shape. The comment says why plainly: *"without a boolean-expression language."* Arbitrary nesting is not expressible; each new OR-position need has historically been met by adding a *term* (`itemsMinAny` was added for exactly one quest — `quest_wm_01`'s "archive letter OR ≥3 Seals" — because it was *"inexpressible in OR position by any prior term"*).

That is the honest tradeoff of this design: **2,803 quests are data instead of code, and the price is that the gate language grows a new term whenever a quest needs a shape it lacks.** The alternative (an expression evaluator) was not taken. Given 2,850 quests against a 258-line runtime, the trade has clearly paid.

### Pass 2 — completion (29376–29402)

```js
const done = q.schema === 'UQF-1.0' && q.completion && QuestRuntime.canComplete(id);
if (done) {
  S_story.quests[id] = 'complete';
  if (Array.isArray(q.onComplete)) QuestRuntime.execBits(q.onComplete, { questId: id, pushMsg: m => msgs.push(m) });
  else if (q.onComplete) q.onComplete();
  msgs.push(..._applyItemChain(q));
  msgs.push('✓ ' + q.title);
  …
}
```

`onComplete` is **polymorphic**: an array is a UQF bit chain executed through the registry; a function is a legacy closure. The `ctx.pushMsg` callback is how a data bit gets its narration into the render's message stream without touching the DOM — the bit pushes a string, `storyRender` joins and prints it. The comment at 29391–29393 flags a known presentation-only regression from that fold: those messages now print *before* the `✓ title` line instead of after.

### Pass 3 — the messages surface

Back in `storyRender` (34847–34849):

```js
const questMsgs = storyCheckQuests(node);
const parts = [prefix, lootMsg, ...questMsgs].filter(Boolean);
storyMsg(parts.join('  ·  '));
```

Loot, activations, and completions collapse into one `·`-joined line in `#story-move-msg`. The player learns they took a quest from a `📋 <title>` fragment in that strip.

### Resolution — the roll (`_resolveQuestUQF`, 6799)

The QUESTS section (33144) reads the quest's own `skill_check` bit to build its card — data drives presentation:

```js
const scBit = (q.schema === 'UQF-1.0') ? (q.bits || []).find(b => b.kind === 'skill_check') : null;
```

Tapping accordions the card open (§CEREMO-ACC — vignette, roll breakdown, odds); confirming inside fires `_rollCeremonia` (6854) → `_resolveQuestUQF`. The math lives in one place (`QuestRuntime._rollSkill`, 21734):

```js
const mod  = Math.floor((abilityVal - 10) / 2);
const prof = 2 + Math.floor(((S_story.level || 1) - 1) / 4);
const d20  = Math.ceil(Math.random() * 20);
const iodineBonus = S_story.iodineBuffActive ? (S_story.iodineBuffBonus || 3) : 0;
if (S_story.iodineBuffActive) { S_story.iodineBuffActive = false; S_story.iodineBuffBonus = 0; }
```

Note `_rollSkill` is documented as *"Pure roll"* (21730) but **consumes the iodine buff as a side effect** — the one place the file's own purity vocabulary overstates the code. It is deliberate (it mirrors the legacy resolver exactly, per the comment) but the label is wrong; "pure" here means "single source of the math," not "no side effects."

Pass → `quests[id]='done'` + `execBits(sc.onPass)`. Fail → `execBits(sc.onFail)`, then either a retry stamp (`skillCheckAttempts[id] = {lastDay, failures}`, gated by `_ceremoRetryBlocked`, 6786) or `quests[id]='failed'`. Either way **effort XP is paid once** (`EFFORT_XP_PCT = 0.25`, guarded by `effortXpQuests[id]` so retryables cannot farm it): *"The attempt was not wasted."*

Both paths end by re-entering the render:

```js
storyUpdateStatus();
storyRender(NODE_MAP[S_story.currentCode]);
```

**Every quest resolution re-runs the full 4,360-line render, which re-runs the 2,850-quest scan.** That is the file's fundamental loop shape: *state changes → render everything → rescan everything.* It is immediate-mode rendering by hand, and it is why quest chains work — a quest that unlocks another quest gets the next one activated by the very render its own resolution triggered, with no explicit chaining code.

The `msgs` array is also the design's neat trick for chaining: a completion bit pushes narration, the render prints it, and the render's own `storyCheckQuests` pass may activate the successor quest in the same frame.

### The four quest statuses

`'active'` → `'done'` (skill-check pass) · `'complete'` (declarative gate) · `'failed'` (non-retryable fail). Both `'done'` and `'complete'` count as terminal for `questsDone` gating (21634) — two success states from two different code paths, unified only at the gate.

---

## VII. `storyRender` — the file's tension, in one function

4,360 lines (30502–34862), split at 32918:

```
30502 ┌─ storyRender(node, prefix)
      │  30503–30552  PROLOGUE — sync grid pos · collect loot · farewell line ·
      │               close all sheets/overlays · fill header slots · prose +
      │               textVariants · sibling sweep
      │
      │  30553–32917  ══ ~2,400 LINES OF PER-NODE SPECIAL CASES ══
      │               76 `node.code === '…'` comparisons across ~40 commented blocks:
      │               if (node.code === 'LHR') … 'SQ' … 'CO' … 'CQ' …
      │               Intro tagline · Entry 42 · name-change notice · conversion ·
      │               Weimar Scholar Gate · Void Archaeology · Secret Gate ·
      │               Tilbury Harbor · Visby Underground · Void Shaman · Corelli ·
      │               Memory Gate · Codex Core · Prior Carrier · Inquisitor ·
      │               Ally Cat · La Riva · Birka NPC cards (31810–32917, ~1,100 lines)
      │
32918 │  ══ SECTION-BASED UI RENDERING ══  ← the generic engine
      │  _mkSection / _mkCard  →  FISH · ENCOUNTER · QUESTS · LOOT · REST ·
      │                           TOURNAMENT · WORLD · EB chips · Key Events
      │
      │  34844–34861  EPILOGUE — the cycle closes:
      │     storyUpdateStatus() · storyCheckQuests(node) · storyMsg(parts.join(' · '))
      │     storyRenderQuests() · storyCheckJournal(node) · storyAutoSave()
      │     storyCheckVictory(node) · _renderMiniMap() ×3 · _updateExitLinks()
      │     _updateWaypointBtn() · _updateHuntBtn()
34862 └─
```

The epilogue is the real state machine: **status → quests → message → journal → save → victory → maps → exits.** Autosave lands *after* quest mutation and *before* the map redraw, so the save always reflects the quests the arrival just activated. `storyCheckJournal` is deliberately second-to-last (34852: *"must come last — may overwrite any message visually but modal covers it"*).

The 2,400-line middle and the 200-line section engine do the same job — put cards on screen for this node — by opposite means. The middle hardcodes per-node behavior in imperative blocks; the engine derives it from node data. The file is mid-migration and the migration is visible as a horizontal line at 32918. Every `if (node.code === 'XX')` block above it is a feature that could not yet be spelled in node data — the same pattern as the quest gate language, one layer up: **when the data language lacks a shape, the file grows imperative code instead of vocabulary.**

---

## VIII. Findings

1. **The MUD kernels are the file's best code and its only pure code.** `moverMove`, `describeCell`, and `DUEL` take a `world` and return plain data. They are shared with the server by byte-identical inlining plus CI parity assertions — a genuinely clever answer to "no build step, but I need code reuse." Everything above them reads and writes `S_story` as a global.

2. **`cellMove` is the model the rest of the file does not follow.** Thin caller, kernel decides, caller mutates. 36 lines. Compare `storyRender`: 4,360.

3. **Two disjoint wiring phases, in inverted order.** MUD wires and renders at *parse time* (36831); combat wires at *`DOMContentLoaded`* (8025, fires last). Safe only because `storyEnter()` hides the combat panel. Non-obvious, load-bearing, and the reason for the repo's test-helper convention.

4. **Two disjoint state atoms.** `S` (combat sandbox, 5277) and `S_story` (MUD world, 22409) share no fields and are bridged only at `_startStoryBattle` (36818) → `loadWorldMonster` → `storyExit`. The file is two games in a trench coat, and the trench coat is that bridge.

5. **`_S_DEFAULTS()` is authoritative; the `S_story` literal is a demoted seed.** The middle-position `Object.assign(S_story, _S_DEFAULTS(), JSON.parse(raw))` is the load-bearing line for save compatibility. The §STATE-INIT scars (`if (!S_story.visitedCells)` in the hot path) are what drift cost.

6. **The 43:1 data-to-engine ratio is the file's central achievement.** 11,106 lines of `QUEST_DB` (2,850 quests, 2,803 UQF) execute through a 258-line runtime. That is the whole design justified in two numbers.

7. **The gate language has no boolean nesting, by explicit choice.** AND-terms plus one OR-group. Each new OR shape has historically meant a new *term* (`itemsMinAny` was added for exactly one quest). Worth watching: a term added per quest is the language telling you it wants an expression evaluator.

8. **Quest acceptance is implicit and unconsented.** No accept button anywhere. Arrival + gate = `'active'`, announced in a `·`-joined message strip. Whether that is a feature (frictionless) or a gap (the player never agrees to anything) is a design question, not a code question — but the code has no opinion and no hook where consent could be inserted.

9. **`storyCheckQuests` linearly scans all 2,850 quests on every render.** Not currently a measured problem, but it scales with *quests authored*, not *quests nearby*. An `activateNode → [quests]` index — the same shape `CELL_GRID` already builds for nodes — would fix it if it ever bites.

10. **`storyRender` is two programs.** ~2,400 lines of per-node special cases above line 32918 (76 `node.code === '…'` comparisons); a compact data-driven section engine below it. The engine is where the file is going. The line at 32918 is the migration front.

11. **DOM contracts are encoded in sibling position.** "Everything between `#story-text-box` and `#story-info-row` is transient" is expressed only as sibling order, enforced by two hand-written sweeps (30547, 27652), and has already caused one crash on record (§MATH-01's write to a nonexistent `#story-content`). A wrapper `<div id="story-dynamic">` would make the contract explicit and delete both loops.

12. **`_rollSkill` is labelled "Pure roll" but consumes the iodine buff.** Deliberate legacy-parity, but the label overstates it. The file's purity vocabulary is precise everywhere else; this is the one place it is not.

---

## IX. Open questions

- **Is the 32918 migration front still moving?** ~40 per-node blocks (76 code comparisons) remain above it. Each is a candidate for a `NODE_MAP` flag + a `_mkCard` call (the `isFishingLake` pattern). Is there a live plan track for this, or has the front stalled?
- **Should quest acceptance become explicit?** There is currently no seam for an accept prompt — `storyCheckQuests` writes `'active'` and returns a string. Adding consent means adding a stage, not editing a line.
- **Does the gate language want an expression evaluator yet?** `itemsMinAny` was added for exactly one quest. If a second single-use term appears, that is the answer.
- **Is the 2,850-quest scan worth indexing now, or is it a "when it bites" item?** Recommend: leave it, note it. It is O(quests) per render with a tiny constant, and premature indexing would add a cache to invalidate.

---

## X. Reading map

| To understand | Read |
|---|---|
| Boot order | 36831 (parse-time `storyEnter`) → 23714 → 23155, then 8025–8247 |
| MUD movement | 9733–9780 (`MOVER:CORE`) → 9789 (`_moverWorld`) → 27589 (`cellMove`) |
| Room description | 9804–10036 (`ROOMS:CORE`) → 9969 (`describeCell`) → 27664 (`_enterEmptyCell`) |
| Auto-travel | 36593 (`_travelTick`) → 36577/36584 → 27593 (the halt guard) |
| Quest engine | 21556 (`BIT_CONTRACTS`) → 21610 (`QuestRuntime`) → 21617/21671 (gates) |
| Quest acceptance | 29355 (`storyCheckQuests`) ← called from 34847 |
| Quest resolution | 33144 (card) → 6854 (`_rollCeremonia`) → 6799 (`_resolveQuestUQF`) |
| UI generation | 32918–32959 (`_mkSection`/`_mkCard`) → 32964+ (the sections) |
| The render cycle | 34844–34861 (the epilogue — the real state machine) |
| State shape | 5277 (`S`) · 22409 (`S_story` seed) · 22470 (`_S_DEFAULTS`, authoritative) |
| Input | 36718 (keydown) · 36855 (d-pad) · 36842 (sheet tabs) |

**Parity commands:** `npm run check:walk` (invariants · mover parity · mover behaviour · terrain · roads · rooms parity) · `npm run check:duelparity` · `npm run test:mud`.

---

*Report ends.*
