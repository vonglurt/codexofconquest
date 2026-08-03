<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->

# Migrating `roll2hit-v3.html` Onto the Cell-Grid Architecture
### A practical companion to `ieee-paper-cell-grid-navigation.md`

**Paul Richeson · roll2hit.com**
*Migration writeup · June 2026*

---

## 0. Scope of this document

The IEEE paper (`ieee-paper-cell-grid-navigation.md`) describes the formal model: a sparse `(r, c)` cell grid, a `CELL_GRID` reverse lookup, BFS pathfinding, and one-step waypoint navigation. This document explains how that model lands inside the single-file game `roll2hit-v3.html` — what data shape replaces what, what functions go away, and what order to do the work in so the game stays playable through every commit.

Two migrations happen in lockstep:

1. **Data migration** — strip explicit `N/S/E/W` exit pointers from `NODE_MAP`; promote `NODE_COORDS` to the single source of truth for adjacency.
2. **Code migration** — delete every helper that resolves exits by reading `node.N` / `node.S` / `node.E` / `node.W`; route all movement, pathfinding, and exit-rendering through `CELL_GRID` adjacency.

The runtime side of this migration is already in flight (§CELL-01 through §CELL-13 in `plan-archive.md`). What remains is finishing the data cleanup, retiring a handful of legacy helpers, and bringing tests onto the new shape.

---

## 1. Why this is the new shape of `roll2hit-v3.html`

The old shape — `NODE_MAP[code].N = "OTHER_CODE"` — is the same data shape CircleMUD used in 1993 [CircleMUD]. It works, but every named location carries up to six edge pointers, and every pointer has to stay in sync with the room it points at. Move a room, and every pointer to it must be rewritten. Forget one, and the next BFS produces a dead link. Zigler's MUD cookbook calls this out as one of the main maintenance taxes of the DikuMUD/Circle lineage [Zigler].

Patel's pathfinding guides at Red Blob Games [RedBlob] and the Stanford Game Programming notes [Stanford] make the alternative explicit: a 4-connected grid does not need stored edges. Adjacency is implicit in the coordinate system — two cells are connected iff their coordinates differ by exactly one along a single axis. The edge graph is *derived*, not stored. There is nothing to keep in sync because there is nothing to store.

The pathfinding comparison literature backs this up. On uniform-cost 4-connected grids, BFS is optimal and trivial to implement; A* with Manhattan heuristic improves average-case cell expansion on large grids but is unnecessary at the scales we operate on [DIVA, ResearchGate]. Talbot's object-oriented Ruby MUD writeup [Talbot] reaches the same conclusion from the opposite direction: when he tries to express MUD topology cleanly in OO Ruby, he ends up reinventing a coordinate system to avoid the edge-bookkeeping problem.

So the new shape of `roll2hit-v3.html` is:

> **`NODE_MAP` holds *what* a location is. `NODE_COORDS` holds *where* it is. `CELL_GRID` is the inverse index used for adjacency. Nothing else stores connectivity.**

Every navigation, exit-rendering, pathfinding, quest-trigger, and minimap function reads from those three structures. Removing the explicit exit fields is not a cosmetic cleanup — it deletes the entire class of "dead link" bugs by construction, and it collapses three different traversal codepaths (story-mode walk, BFS waypoint, map auto-walk) into one primitive: `cellMove(dir)`.

---

## 2. Before / after — the data shape

### 2.1 NODE_MAP entry — old shape

```javascript
// LEGACY — carries explicit exits.
LHR: {
  num: 1, code: 'LHR', name: 'city',
  label: "City Streets — Birka", act: 1,
  N: "J58331", S: "J58332", E: "J68415", W: "J50866",  // ← exit pointers
  text: "...", npc: 'City Guard Captain',
  loot: 'Bloodstained Map', battle: null, sleep: false,
},
```

Three problems with that shape:

1. `J58331` / `J58332` etc. are *junction stubs* — phantom nodes that exist only because two real nodes needed a corridor between them. They have no content, no NPC, no loot. §CELL-05b counted 268 of them.
2. Every entry needs four pointers maintained in two directions. If `LHR.E = "J68415"`, then `J68415.W` must equal `"LHR"` or the move is one-way. There is no language-level enforcement of this.
3. The pointers say nothing about geography. `LHR.N = "J58331"` does not tell you where `J58331` is on the map; you have to chase the chain.

### 2.2 NODE_MAP entry — new shape

```javascript
// CURRENT — no exit fields.
LHR: {
  num: 1, code: 'LHR', name: 'city',
  label: "City Streets — Birka", act: 1,
  text: "...", npc: 'City Guard Captain',
  loot: 'Bloodstained Map', battle: null, sleep: false,
},
```

Adjacency lives in `NODE_COORDS`:

```javascript
NODE_COORDS = {
  LHR: { r: 64, c: 224 },   // primary key for placement
  // ...
};
```

And `CELL_GRID` indexes the inverse, built once at startup (§CELL-02):

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

To answer *"what is north of LHR?"* you do:

```javascript
const { r, c } = NODE_COORDS.LHR;
const northCode = CELL_GRID[`${r - 1},${c}`];   // O(1)
```

If `northCode` is undefined, the cell to the north is open terrain — still walkable, just unnamed. That alone deletes the entire concept of "junction stubs": you don't need a placeholder node to keep a corridor walkable, because the corridor cell does not need to exist in the database at all.

### 2.3 cellMove — the single navigation primitive

Old movement read `node.N` and routed to `NODE_MAP[node.N]`:

```javascript
// LEGACY — gone.
function storyMoveNorth() {
  const node = NODE_MAP[S_story.currentCode];
  if (!node.N) { storyMsg("No path north."); return; }
  S_story.currentCode = node.N;
  storyRender(NODE_MAP[node.N]);
}
```

New movement reads from `CELL_GRID` via `cellMove(dir)` (§CELL-03 — currently at `roll2hit-v3.html:27336`):

```javascript
function cellMove(dir) {
  const DELTAS = { N:[-1,0], S:[1,0], E:[0,1], W:[0,-1] };
  const [dr, dc] = DELTAS[dir];
  const nr = (S_story.playerR || 0) + dr;
  const nc = (S_story.playerC || 0) + dc;

  if (nr < 1 || nc < 1 || nr > 500 || nc > 500) {
    storyMsg('You reach the edge of the known world.'); return;
  }
  if (IMPASSABLE_CELLS.has(`${nr},${nc}`)) {
    storyMsg('The sea is impassable on foot.'); return;
  }

  const destCode = CELL_GRID[`${nr},${nc}`];   // O(1) — may be undefined

  S_story.playerR = nr;
  S_story.playerC = nc;
  S_story.visitedCells[`${nr},${nc}`] = true;
  S_story.hoursElapsed += 1;

  if (destCode && NODE_MAP[destCode]) {
    S_story.currentCode = destCode;
    storyRender(NODE_MAP[destCode]);
  } else {
    _enterEmptyCell(nr, nc);   // open terrain — terrain inferred by majority vote
  }
}
```

Every other navigation entry point — keyboard arrows, the d-pad, waypoint auto-walk, map click-to-walk — funnels into `cellMove(dir)`. There is one place where a step happens, which is the property the whole architecture is built to give us.

### 2.4 BFS and waypoint

BFS runs on the grid, not the node graph (§CELL-09 — `roll2hit-v3.html:34447`):

```javascript
function _bfsGridPath(fromCode, toCode) {
  if (!toCode || !NODE_COORDS[toCode]) return [];
  const endCoord   = NODE_COORDS[toCode];
  const startCoord = NODE_COORDS[fromCode]
                  || { r: S_story.playerR, c: S_story.playerC };
  if (!startCoord || startCoord.r == null) return [];
  if (startCoord.r === endCoord.r && startCoord.c === endCoord.c) return [];

  const visited = new Set([`${startCoord.r},${startCoord.c}`]);
  const queue   = [{ r: startCoord.r, c: startCoord.c, path: [] }];

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

Waypoint is one BFS, one direction, one `cellMove`:

```javascript
function storyWaypoint() {
  const wp = S_story.waypoint;
  if (!wp) return storyQuestToggle();
  if (S_story.currentCode === wp) {
    storyMsg('📍 Reached: ' + (NODE_MAP[wp]?.label || wp));
    S_story.waypoint = null;
    return _updateWaypointBtn();
  }
  const dir = _bfsGridDir(S_story.currentCode, wp);
  if (!dir) return storyMsg('📍 No path — move manually.');
  cellMove(dir);
}
```

Critically, BFS is re-run from the *current* position on every waypoint press. If the player veers off, the next press recalculates from wherever they are. There is no stale path to invalidate — exactly the property Patel calls out as the reason BFS-per-press is preferable to cached paths on small worlds [RedBlob].

---

## 3. Functions to remove

These are the dead helpers that read or wrote explicit exit fields. They either no longer exist or are still hanging around the codebase as no-ops. Every grep should come back empty after the migration is finished.

| Function / symbol | Why it goes | Replacement |
|---|---|---|
| `storyMoveN()` / `storyMoveS()` / `storyMoveE()` / `storyMoveW()` | Per-direction wrappers around `NODE_MAP[code].N` etc. | `cellMove('N' \| 'S' \| 'E' \| 'W')` |
| `storyMove(dir)` (legacy, exit-reading) | Read `node[dir]` to resolve destination | `cellMove(dir)` |
| `_findExit(code, dir)` | Returned `NODE_MAP[code][dir]`. Used by waypoint and quest triggers. | `CELL_GRID[\`${r+dr},${c+dc}\`]` |
| `_calcDir(fromCode, toCode)` | Walked the node graph to find a connecting direction | `_bfsGridDir(fromCode, toCode)` |
| `_renderExitRow(node)` | Read `node.N/S/E/W` to emit exit chips | `_updateExitLinks()` (derives exits from `CELL_GRID`) |
| `_validateExitGraph()` | Audited bidirectional consistency of exit fields | Deleted entirely — invariant is structural |
| `_bfsNodePath(fromCode, toCode)` (graph-mode) | BFS over node-edge graph | `_bfsGridPath(fromCode, toCode)` |
| `JNCT_*` / `J*` junction stubs in `NODE_MAP` (data) | Phantom corridor nodes | Empty cells (no DB entry needed) |
| `node.N`, `node.S`, `node.E`, `node.W` (data) | Explicit exit pointer fields | `NODE_COORDS[code]` + `CELL_GRID["r,c"]` adjacency |
| `node.portal` / `node.spire` (legacy long-jump exits) | Stripped at §CELL-13 per `index.md:418` | If a long-jump exit is genuinely needed, use an *override-exit table* keyed by `(fromCode → toCode)` |
| `storyTravel(code)` / `storyGoto(code)` | Teleport that didn't increment hours or visit cells | Waypoint + repeated `cellMove(dir)` |
| `WORLD_DB.junction` | Terrain key that existed solely for junction stubs | Delete entry; nothing references it once stubs are gone |
| Tests: `expect(NODE_MAP.LHR.N).toBe(...)` | Asserted on exit fields | `expect(CELL_GRID[\`\${NODE_COORDS.LHR.r-1},\${NODE_COORDS.LHR.c}\`]).toBe(...)` |

> A grep that confirms no code still reads exits:
>
> ```sh
> grep -nE "\.[NSEW]\b" roll2hit-v3.html | grep -v "//\|cellMove\|DELTAS"
> ```
>
> This should print nothing once the migration is finished. (As of this writing, the *runtime* side already passes this check; the *data* side still has ~1,693 dead exit lines inside `WORLDBUILDER:NODE_MAP`.)

---

## 4. Task list

Tasks are ordered so that the game is playable and tests pass after each batch.

### Phase A — data audit (read-only)

- [ ] **A1.** Snapshot a known-good run of the BFS reachability audit (`./api.sh fix-bidirectional` then GET `/api/graph/reachability`) and store the expected reachable count.
- [ ] **A2.** Run `grep -cE "^\s*[NSEW]:" roll2hit-v3.html` and record the dead-line count. (Currently ~1,693.)
- [ ] **A3.** Confirm zero code paths read `node.N/S/E/W`. The grep in §3 should already print nothing — if it doesn't, finish §B before touching data.
- [ ] **A4.** Confirm every named node has an entry in `NODE_COORDS`. `node ./scripts/audit-coords.js` (or one-liner `Object.keys(NODE_MAP).filter(c => !NODE_COORDS[c])`).

### Phase B — code migration (retire dead helpers)

- [ ] **B1.** Delete `storyMoveN/S/E/W` if still present. Replace any caller with `cellMove(dir)`.
- [ ] **B2.** Delete `_findExit`, `_calcDir`, `_renderExitRow`, `_validateExitGraph`, `_bfsNodePath` (graph variant). Verify with grep.
- [ ] **B3.** Delete `storyTravel` / `storyGoto` (instant teleport). Replace any quest script that called them with `storySetWaypoint(code)` so the player walks the path.
- [ ] **B4.** Confirm `_updateExitLinks()` derives all exits from `CELL_GRID` and ignores `node.N/S/E/W`.
- [ ] **B5.** Remove `WORLD_DB.junction` terrain entry once no junction stubs remain in NODE_MAP.

### Phase C — data migration (strip exit fields from NODE_MAP)

The strip pass is built into the API as §CELL-14. It runs through the worldbuilder parsing pipeline (`findEntryBounds` + a string/comment-aware walker in `WBAPI.stripExitFields`), so prose containing `"N:"` or `"go S"` inside `text:` fields is never matched. The endpoint is `POST /api/migrate/strip-exit-fields`; the CLI wrapper is `./api.sh migrate strip-exit-fields`.

- [ ] **C1.** Dry-run the strip and verify per-field counts look sane:
  ```bash
  ./api.sh migrate strip-exit-fields
  # → 404 nodes / 2095 fields  (N:514 S:519 E:536 W:524 portal:1 spire:1)
  ```
- [ ] **C2.** Apply the strip. `saveAndRestart` persists the new source and reloads in-process. *(§DX-02k, 2026-08-03: it used to write a dated snapshot and copy that over `roll2hit-v3.html`, leaving the ~5.4 MB snapshot behind on every write; it now writes a temp beside the game file and renames it into place.)*
  ```bash
  ./api.sh migrate strip-exit-fields --execute
  ```
- [ ] **C3.** Re-run the dry-run — it must report `0 nodes / 0 fields` (idempotency check).
- [ ] **C4.** Reload the game. Run the smoke path: new game → walk north 3 → south 3 → open map → click a distant node → waypoint auto-walks → reaches destination.
- [ ] **C5.** Re-run the BFS reachability audit from §A1. Reachable count must match the snapshot.
- [ ] **C6.** Purge any remaining `J*` junction stubs from NODE_MAP (`./api.sh post admin/delete-junction-terrain dryRun=false` if any survived §CELL-05b). Confirm with `Object.keys(NODE_MAP).filter(c => /^J\d+$/.test(c)).length === 0`.

> **Why the API, not a one-shot script.** Putting the strip behind `WBAPI.stripExitFields()` reuses the same brace-tracking primitive (`findEntryBounds`) that every other write goes through, so it composes with the existing patch queue, snapshotting, and reload pipeline. A one-shot `scripts/strip-exit-fields.js` would have re-invented those guarantees and drifted from the parser used by every other endpoint.
>
> **Why this fixes a latent no-op.** `POST /api/admin/strip-edges` shipped with §CELL-01 but only deleted fields from `WBAPI.nodeMap` in memory — `WBAPI.save()` writes `_rawSrc` (raw text), so the next reload re-parsed the dead fields straight back in. `index.md:418` claimed the fields were stripped; the data shows they survived. §CELL-14 fixes that endpoint to call `stripExitFields()` and adds the migration-scoped `/api/migrate/strip-exit-fields` route with `dryRun:true` by default.

### Phase D — tests onto new shape

- [ ] **D1.** Replace every `expect(NODE_MAP.X.N)` style assertion with `CELL_GRID[adjacent-coord-key]`.
- [ ] **D2.** Add an invariant test: for every `code` in `NODE_MAP`, either `NODE_COORDS[code]` is defined or the code is on the explicit "ghost" allow-list.
- [ ] **D3.** Add a coordinate-uniqueness test: `new Set(Object.values(NODE_COORDS).map(c => \`${c.r},${c.c}\`)).size === Object.keys(NODE_COORDS).length`.
- [ ] **D4.** Add a BFS reachability test from `LHR`: every named node must be reachable, given `IMPASSABLE_CELLS`.
- [ ] **D5.** Update Playwright tests — `SEED_STATE` must seed `playerR`, `playerC`, and `visitedCells: {}` (see memory: dismissContinue pattern).

### Phase E — server + worldbuilder

- [ ] **E1.** Confirm `POST /api/node` no longer accepts `N/S/E/W` (they're stripped server-side anyway, but the API surface should reject them).
- [ ] **E2.** Confirm `GET /api/cell/:r/:c` returns `{ code, node }` for a placed cell and `{ code: null, terrain }` for an empty cell.
- [ ] **E3.** Worldbuilder UI (`worldbuilder.html`) — verify the editor never asks the human for exit fields. Placing a node is `(code, r, c, name, label, act)` and nothing else.

### Phase F — docs

- [ ] **F1.** Update `maps.md §NODE_MAP` to describe the new shape (no exit fields).
- [ ] **F2.** Update `index.md §II` to point to this document.
- [ ] **F3.** Move `spec-corridors.md` to `archive/` (per `index.md:94` it's already marked superseded).
- [ ] **F4.** Add a §CELL-14 entry to `BACKLOG.md` if there's residual data-cleanup work post-§CELL-13.

---

## 5. Codebase migration — narrative

### 5.1 What was already in place before this pass

§CELL-01 through §CELL-13 (June 13–14, 2026 — see `index.md:129`) did the runtime side: `cellMove`, `_enterEmptyCell`, `_inferTerrain`, `_bfsGridPath`, `_bfsGridDir`, `storyWaypoint`, `IMPASSABLE_CELLS`, the visited-cell minimap, MUD-style session endpoints (`/api/session/*`), and the cell REST endpoints (`/api/cell/:r/:c`, `/api/grid/*`). The d-pad and keyboard arrows are wired to `cellMove`. The reachability audit walks `CELL_GRID`, not `NODE_MAP` exits.

In other words: the runtime no longer needs the exit fields. The exit fields are still in the data only because the strip-pass was deferred.

### 5.2 What this migration finishes

Three things.

**First: kill the dead data.** The 1,693-ish `N:`/`S:`/`E:`/`W:` lines inside `WORLDBUILDER:NODE_MAP` are no-ops — nothing reads them. They mislead anyone reading the source (suggesting they're load-bearing), they bloat diffs every time a node's text is edited, and they make the file ~3% larger than it needs to be. Phase C strips them. The strip-pass MUST go through the worldbuilder parsing pipeline (comment-aware brace counting; see memory:feedback_worldbuilder_parsing) — naïve regex on `^\s*[NSEW]:` will corrupt text fields that contain "N:" mid-sentence.

**Second: retire the helpers nobody calls anymore.** There are still a few legacy functions that were left in place to avoid breakage during §CELL-01–§CELL-13. Phase B deletes them. None should have callers; the grep checks in §A confirm this before the deletions.

**Third: bring the tests onto the new shape.** Several older tests still assert on `NODE_MAP[code].N === "OTHER"`. After Phase C those assertions evaluate to `undefined === "OTHER"` and the tests fail. Phase D rewrites them in terms of `CELL_GRID` adjacency, and adds three new invariants (coord uniqueness, full reachability, no-ghost-nodes) that the old data shape couldn't easily express.

### 5.3 Order and risk

The order matters. **Do not strip exit data before retiring readers.** If any code still reads `node.N`, stripping the data turns it into `undefined` reads, which the d-pad will silently absorb (disabling N/S/E/W buttons) and which BFS will turn into "no path" results. The result looks like a game that mostly works but mysteriously cannot navigate certain areas. Phase B before Phase C, always.

The strip-pass itself is reversible — `git stash` covers it. The risky step is C5 (purging J-stubs), which deletes entire nodes from `NODE_MAP`. Before C5, verify by `grep -E "[\"']J\d+[\"']" roll2hit-v3.html` that no remaining code or quest spec references those junction codes by string.

### 5.4 Per-feature impact

| Feature | Old (exit-field) code path | New (cell-grid) code path |
|---|---|---|
| Story-mode walk (arrow keys) | `storyMove(dir)` → `node[dir]` → `storyRender` | `cellMove(dir)` → `CELL_GRID["r,c"]` → `storyRender` or `_enterEmptyCell` |
| Map click-to-walk | `storyTravel(code)` (teleport) | `storySetWaypoint(code)` + repeated `cellMove(dir)` (walks every cell) |
| Quest activation | "currentCode === quest.activateNode" | "CELL_GRID[`${playerR},${playerC}`] === quest.activateNode" (cell-driven, §CELL plan-archive.md) |
| Encounters in transit | Only on named nodes with `battle:` | On every empty cell, weighted by inferred terrain (`TERRAIN_ENCOUNTER_RATE`) |
| Minimap | Drawn from `NODE_MAP` edges | Drawn from `CELL_GRID` + `visitedCells` fog |
| Reachability audit | Walked `node.N/S/E/W` graph | Walks `CELL_GRID` 4-neighbors |
| World-building | Add node + write ≤4 reciprocal exits | `POST /api/node {code, r, c, name, label, act}` |

---

## 6. Data migration — narrative

### 6.1 Inputs and outputs

**Input:** `roll2hit-v3.html` containing a `WORLDBUILDER:NODE_MAP` block where each entry has up to four exit pointer fields and may have `portal` / `spire` long-jump fields.

**Output:** Same file, same block, with all exit pointer fields removed. Every entry is reduced to the fields actually consumed by `storyRender` and the game systems: `num`, `code`, `name`, `label`, `act`, `text`, `npc`, `loot`, `battle`, `sleep`, plus any per-node feature flags (`sleepCost`, `vendorId`, etc.).

**Adjacency moves** from the per-entry fields into `NODE_COORDS` (already populated for all 422 nodes — see `index.md:416`) plus the derived `CELL_GRID` (built once at startup).

### 6.2 The strip operation, concretely

The script `scripts/strip-exit-fields.js` looks roughly like this:

```javascript
import fs from 'fs';

const path = 'roll2hit-v3.html';
const src = fs.readFileSync(path, 'utf8');

const START = '// ◆◆◆ WORLDBUILDER:NODE_MAP:START ◆◆◆';
const END   = '// ◆◆◆ WORLDBUILDER:NODE_MAP:END ◆◆◆';
const i0 = src.indexOf(START) + START.length;
const i1 = src.indexOf(END);
if (i0 < 0 || i1 < 0) throw new Error('NODE_MAP anchors not found');

const head  = src.slice(0, i0);
const block = src.slice(i0, i1);
const tail  = src.slice(i1);

// Comment-aware line scan: only strip lines that are *entire* `N:`/`S:`/`E:`/`W:`
// definitions, never substrings inside the `text:` field.
// Use the worldbuilder parsing pipeline to walk node entries with brace counting,
// then for each parsed entry delete its N/S/E/W/portal/spire keys.
const stripped = stripExitsFromNodeMap(block);

fs.writeFileSync(path, head + stripped + tail);
```

Two non-obvious rules from prior incidents:

- **Use the parsing pipeline, not regex.** `text:` fields contain prose like `"go North"` or `"S: scribbled in the margin"`. A regex like `/^\s*[NSEW]:/m` will mangle them. Use `extractObj` + comment-aware brace counting (memory:feedback_worldbuilder_parsing).
- **Strip `portal` and `spire` too.** Per `index.md:418`, those were also long-jump edge fields that §CELL-13 removed at runtime. If they're still in data, drop them in the same pass.

After the strip, the diff should consist exclusively of removed lines — no additions, no modifications to text or other fields. If the diff shows anything else, the parser is wrong.

### 6.3 What `NODE_COORDS` does NOT migrate

`NODE_COORDS` was hand-curated during §CELL-01 with a layout pass — nodes were placed so that narrative neighbors (e.g., `LHR ↔ TLL ↔ MHQ`) end up Manhattan-adjacent on the grid. That layout work is done and should not be regenerated from the old exit fields. The exit fields are not authoritative for layout; the coordinates are.

If a node has `NODE_COORDS[code] = { r: 64, c: 224 }` but its old `N:` pointed at a code whose coordinate is *not* `(63, 224)`, the old `N:` field is wrong (or was a long-jump). Either way, **trust the coordinates**, not the old exits. This is the migration's whole point.

### 6.4 Junction stubs

Per `index.md:129`, §CELL-05b purged 268 junction stubs. If any `J*`-prefixed entries remain in `NODE_MAP`, they're either:

1. Forgotten — delete them in Phase C5.
2. Promoted to real nodes with content — rename them and keep them.

A junction stub is identifiable by: numeric code (`J12452`, `J58332`), empty `text`, no `npc`, no `loot`, no `battle`, often `name: 'junction'`. The CircleMUD builder manual [CircleMUD] explicitly recommends junction rooms in exit-graph designs; the cell-grid model deletes the need for them, because the corridor cells they used to occupy can stay empty.

### 6.5 Invariants after migration

After Phase C completes, three invariants from the IEEE paper (§III.A, §III.B) must hold:

- **I1 — Coordinate Uniqueness.** No two entries in `NODE_COORDS` share a coordinate. Tested by Phase D3.
- **I2 — Grid Consistency.** `CELL_GRID` is the exact inverse of `NODE_COORDS`. Built at startup; structurally cannot diverge.
- **I3 — Reachability.** Every named node is reachable from the root (`LHR`) by 4-connected grid BFS, given `IMPASSABLE_CELLS`. Tested by Phase D4.

If any of those fails, the migration is not complete — fix the data, do not weaken the test.

---

## 7. Summary — why this is the new shape

The case for replacing explicit exit fields with implicit coordinate adjacency is not a stylistic one. It is the same shape recommended across three decades of pathfinding and MUD-design literature:

- **CircleMUD's builder manual** [CircleMUD] documents the explicit-exit model as the canonical MUD shape, while simultaneously documenting the maintenance taxes (dead-link audits, bidirectional consistency checks, zone-file validation) that the model requires. The migration removes the model and removes the taxes with it.
- **Stanford's Game Programming notes** [Stanford] lay out the alternative: tile-center cells with derived edges. For 4-connected uniform grids, this is the canonical shape — there is no edge graph because adjacency is implicit.
- **Red Blob Games' pathfinding pages** [RedBlob] make BFS the default algorithm on uniform-cost grids and explicitly recommend re-running BFS per waypoint press at the scales we operate at, rather than caching paths. That's exactly the shape of `storyWaypoint` after this migration.
- **GameDev.net's MUD-pathfinding thread** [GameDev] and **the DIVA Portal multi-target study** [DIVA] both end up at BFS for sparse-obstacle uniform grids, with A* only winning at much larger scales than ours.
- **The ResearchGate comparative analysis** [ResearchGate] confirms BFS is optimal for unweighted single-source shortest paths and that A*'s advantage diminishes as obstacle density drops — which describes our world (impassable cells are ocean borders only).
- **Talbot's OO Ruby MUD writeup** [Talbot] is the most instructive: he tries to express a clean MUD topology in OO Ruby, runs into edge-bookkeeping pain, and ends up modeling rooms by coordinate. That's the same destination this migration arrives at, just from the other side.

Once Phases A through F land, every fact about the world map has exactly one home:

- **What a node is** → `NODE_MAP[code]`.
- **Where a node is** → `NODE_COORDS[code]`.
- **What is at (r, c)** → `CELL_GRID["r,c"]`.
- **What connects to what** → derived, never stored.

The d-pad, the keyboard, the waypoint button, the map click handler, the quest activator, and the multi-player session move endpoint all funnel into one function — `cellMove(dir)` — which does one lookup in `CELL_GRID` and either renders a named node or enters an open cell. That convergence is the new shape of `roll2hit-v3.html`: one navigation primitive, one source of truth for adjacency, and a class of bugs that can no longer be written.

---

## Sources

- **CircleMUD Builder's Manual — Room Files.** J. Elson, *University of Maryland*, 1993. https://www.circlemud.org/cdp/building/building-3.html — canonical reference for the explicit-VNUM/exit-field MUD design that this migration replaces. [CircleMUD]
- **Stanford Game Programming — Map Representations.** A. Patel, *Stanford Theory Group*. https://theory.stanford.edu/~amitp/GameProgramming/MapRepresentations.html — the formal foundation for tile-center 4-connected grids and the case for implicit adjacency. [Stanford]
- **Red Blob Games — Grid Pathfinding Optimizations.** A. Patel. https://www.redblobgames.com/pathfinding/grids/algorithms.html — practical guide for BFS vs. Dijkstra vs. A* on uniform grids; informs the per-press BFS in `storyWaypoint`. [RedBlob]
- **GameDev.net — Pathfinding in a MUD.** Community discussion thread on MUD pathfinding strategies — supports BFS as the default on sparse uniform grids. [GameDev]
- **DIVA Portal — Multi-Target Pathfinding: A\* vs BFS.** Linköping University, 2024. https://www.diva-portal.org/smash/get/diva2:1897067/FULLTEXT02.pdf — empirical comparison; confirms BFS is sufficient at our scales. [DIVA]
- **ResearchGate — Comparative Analysis of Pathfinding Algorithms (A\*, Dijkstra, BFS).** *International Journal of Research and Practical Research*, 2018. https://www.researchgate.net/publication/325368698 — supports BFS-as-default for unweighted single-source shortest paths. [ResearchGate]
- **Medium — A Dive into the MUD (OO Ruby).** M. Talbot, 2019. https://medium.com/@mdtalbot/a-dive-into-the-mud-a-series-on-text-based-games-using-object-oriented-ruby-d4be41c3d12a — independent arrival at coordinate-based room modeling from an OO-design starting point. [Talbot]
- **MUD Cookbook: Design Meets Implementation.** A. Zigler, 2019. https://www.andrewzigler.com/blog/mud-cookbook-design-meets-implementation/ — modern critique of explicit-exit MUD design and the maintenance taxes it imposes. [Zigler]

Companion technical paper: `ieee-paper-cell-grid-navigation.md` (this repo) — formal model, invariants, BFS proofs, and quantitative evaluation on the 500×500 / 419-node reference world.

---

*© 2026 Paul Richeson — MIT License.*
*Correspondence: ubermicrouser@gmail.com*
