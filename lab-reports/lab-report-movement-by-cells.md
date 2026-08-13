# Cell-Grid Navigation: Architecture, Program Flow, and Validation Design

**Technical Report TR-2026-CELL** · roll2hit.com · MIT License · Paul Richeson

> **HISTORY DOCUMENT — verified against HEAD 2026-08-13 (§DOC-02az).** Written
> 2026-06-15 (`79b5bee`), archived by `7d3615a`. Claims are annotated, never deleted.
> **Verdict: the client spine survives; the coordinate space it is written in does not.**
> The report described a 500×500 grid with one node per cell. Ten days later §WALK-1.5
> reprojected the world onto a 90×360 equirectangular band and made a cell a *locale*
> that may hold several nodes. Nearly every falsified claim traces to that one change.

---

## Abstract

Roll2Hit.com is a single-file browser D&D 5e combat-and-story engine. Between §CELL-01
and §CELL-12 its navigation model was replaced: an explicit N/S/E/W edge list gave way to
a coordinate grid in which every exit is *derived at runtime from cell adjacency*. This
report characterised five layers of that system — API server, geographic seeding tool,
global constants, browser runtime state, and input dispatch — traced the Act I → Act II
program flow, and specified a two-tier validation suite.

Re-measured at HEAD: **the architectural thesis holds and the arithmetic does not.**
Exits are still derived, no compass field survives anywhere in the world (0 of 416 nodes),
and the deletion is now enforced by two HTTP guards. But the grid is 90×360, not 500×500;
416 nodes occupy **244** cells, not 416; and the report's first invariant — coordinate
uniqueness — was **deliberately repealed** to let neighbouring cities share a degree
square. Of the five test files specified, one existed and was later rewritten *because*
it hardcoded this report's fixtures; four never shipped.

---

## 1. Purpose, and What the Feature Buys the Player

The design question underneath §CELL was not "how do we store exits?" It was **"why does
the map need a second copy of itself?"** A coordinate already says where a place is.
Maintaining a parallel edge list means every new city is two edits, every move is a graph
lookup, and every mistake is a silent one — a link pointing at a node that no longer
exists renders nothing at all.

Deriving exits from adjacency collapses that to one edit. The player-facing dividends are
what justify the work:

- **The space between cities became real.** Under an edge list, everything that is not a
  city does not exist; you jump from node to node. Under a grid, the ~27,600 walkable land
  cells are places you can stand — `function _enterEmptyCell(r, c)@28420` gives each one
  prose, terrain, signposts and an encounter roll. *Distance became travel instead of a
  menu.*
- **Terrain became a real trade-off.** `const TERRAIN_ENCOUNTER_RATE@9892` prices the
  route: `road:0` against `forest:0.25` and `hag_swamp:0.35`. The road is genuinely safer
  and genuinely longer, and neither is a permission — the open field stays walkable.
- **Fog of war is per-cell, not per-node.** `visitedCells` is a record of *where you
  actually walked*, not a checklist of unlocked destinations.
- **Free movement is structurally guaranteed.** A step can be refused for exactly two
  reasons — off-grid or sea. Nothing else is consulted. This is `prompt.md` §6.1, the
  project's first invariant, and §7.3 below records the one time the engine broke it.

---

## 2. Method

Every symbol, count and coordinate below was re-measured against the working tree at HEAD
(`r2h-3.104.0`, 416 nodes, 38,712 lines): symbol census by `grep -c -F`; structural counts
by loading `js/wbapi-core.js` against `roll2hit-v3.html` and walking `nodeMap`/`nodeCoords`
directly; connectivity by re-implementing each of the three live BFS variants offline and
running them on the real data. Line numbers in the original are superseded by
`symbol@line` anchors, which name a symbol first and a line second.

---

## 3. Verification Summary

| § | Claim | Verdict at HEAD |
|---|---|---|
| Abstract | Exits derived from coordinate adjacency; no stored exits | ✅ **0** N/S/E/W fields and **0** diagonals across 416 nodes |
| Abstract | 500 × 500 integer grid | ❌ **90 × 360** (`const GEO_PROJ = { ROWS: 90, COLS: 360 }@9902`) |
| Abstract | `LHR` anchors the grid; every node a unique `(r,c)` | ⚠️ `LHR` is still the root; **uniqueness repealed** (§5) |
| 3.2 | Server `buildCellGrid` is a verbatim mirror of the client's | ⚠️ Deliberately *not* verbatim — scalar first-wins vs. array (§8) |
| 3.3 | `derived_exits` computed live, nothing stored | ✅ `js/wbapi-server.js:derived_exits@1190` |
| 3.4 | `/api/audit/map` performs **four** structural checks | ❌ **12** check names; **5 of them permanently silent** (§9) |
| 3.5 | `SESSIONS` map + `broadcastCell` SSE fan-out | ✅ `js/wbapi-server.js:const SESSIONS@71`, `js/wbapi-server.js:function broadcastCell@129` |
| 4 | `worldmap.js` seeds coords by lat/lon projection | ⚠️ Now `tools/worldmap.js` (155 GEO rows) — **and it still projects into the retired space** (§10) |
| 5.1 | **Seven** anchor-bounded data sections | ❌ **Eleven** |
| 5.2 | `NODE_MAP` descriptors carry no exit fields | ✅ |
| 5.4 | `CELL_GRID["r,c"]` → a node code | ❌ → an **array** of codes; read via `const cellCode   = (key)@9861` |
| 5.4 | `IMPASSABLE_CELLS` populated at §CELL-10 | ⚠️ Derived from `SEA_RUNS` — **4,790** sea cells, 286 runs |
| 5.5 | Encounter-rate table, roads/junctions at 0 | ✅ verbatim (`junction:0` is unreachable — §DX-02bm) |
| 6.1 | `hoursElapsed` incremented on every `cellMove()` | ❌ Removed by §TIMELESS-01 — movement is free of the clock |
| 6.3 | `storyRender` syncs `playerR/C` from `NODE_COORDS` | ✅ `function storyRender(node, prefix)@34567` |
| 6.4 | The `type === 'shard'` branch is the **only** write to `S_story.shards` | ✅ **Still true** — one write site in 38,712 lines |
| 7.1 | D-pad element ids `#dpad-N/S/E/W` | ❌ `#btn-N/S/E/W` |
| 7.2 | `cellMove` bounds-checks, then applies eight narrative gate-locks | ⚠️ Thin caller over `Mover.move`; **all eight gate-locks deleted** (§7) |
| 7.3 | Encounter roll is `Math.random() < rate`; Hunt forces 1.0 | ❌ `_seededNext()`; Hunt is `min(0.8, rate × 2)` |
| 7.4 | `_bfsGridPath(fromCode, toCode, startR, startC)` | ❌ Two parameters; 0-indexed; **E↔W wrap** |
| 7.5 | WP advances one cell per press; `LHR→SEN` ≈ 55 presses | ❌ One click auto-travels the whole route; `LHR→SEN` is **27** steps |
| 8.2–8.3 | Worldbuilder grid-direct add + ghost list | ❌ Grid tab **deleted** (`fa7fadc`); 0 ghosts at HEAD |
| 9.2 | `serializeNodeLiteral`'s `STR` still lists `N,S,E,W` (dead) | ✅ **Still true, still dead** — see §DX-02bn |
| 10.4 | `LHR → BK → DBV → ISL` is a 3-step south corridor | ❌ `BK` shares `LHR`'s cell; `DBV` is Act III Ragusa; `ISL` is Iceland |
| 10.6 | First shard is a node whose `loot` contains `"Codex Shard #1"` | ❌ Shard #1 is `LCY`'s *"Trade Seal (Shard #1)"* (§11) |
| 11.2 | `/api/graph/reachability` runs the `undirAdj` node BFS | ❌ The code survives as a *shared prelude*; the endpoint does not use it (§8) |
| 11.3 | Reweave complete ⇔ 100% reach, **zero collisions**, 0 diagonals, 0 dangling | ⚠️ 2 of 4 hold; the collision criterion is now **wrong by design** |
| 11.3 | `POST /api/graph/reweave-all` → HTTP 410 | ✅ verbatim, body deleted by §WALK-3 |
| 12 | Five test files; two-tier suite | ❌ **One** shipped (and was rebuilt); `tests/unit/` does not exist (§12) |
| 13 | I1 uniqueness · I2 grid consistency | ❌ Both false at HEAD, by design |
| 13 | I3 player sync · I4 move correctness · I5 reachability · I6 shard idempotence | ✅ All four hold |

---

## 4. The Coordinate Space the Report Outlived

The report was committed 2026-06-15. Its coordinate space died 2026-06-25/26.

| | Report (2026-06-15) | HEAD |
|---|---|---|
| Grid | 500 × 500, 1-indexed | 90 × 360 equirectangular 1°, 0-indexed |
| Edges | hard bounds at 1 and 500 | rows clamp 0–89; **columns wrap E↔W** at the antimeridian |
| `LHR` | `r:64, c:224` | `r:10, c:197` |
| `SEN` | `r:10, c:223` | `r:18, c:180` |
| `BOO` | `r:47, c:223` | `r:2, c:194` |
| Occupied span | — | rows 2–73, cols 154–249 |

`153a37c` (§WALK-1.5 inc 1–2) introduced the projection and the locale lists; `896846c`
applied it together with the sea mask. **Shelf life of the report's arithmetic: ten days.**

This is worth stating plainly because it is the report's real lesson. Nothing in it was
carelessly written. Every coordinate was correct when the ink dried. What expired was the
*ground*, and a document that cites coordinates inherits the lifetime of the projection it
was measured in.

---

## 5. The Repeal of Coordinate Uniqueness

Invariant **I1** — *for all distinct nodes A, B: `A.r ≠ B.r || A.c ≠ B.c`* — is violated
**172 times** at HEAD, and each violation is intentional.

```
NODE_MAP entries        416      ghosts (NODE_MAP without coords)     0
NODE_COORDS entries     416      orphan coords (no NODE_MAP entry)    0
distinct cells          244      cells holding >1 node               66
extra nodes beyond primary                                          172
largest locale   32,203 — 17 nodes  (DS1 DS0 LC4 SEA LSO LC3 DA0 DSJ HER
                                     LC1 LC2 DA3 DA1 DSF DA2 ATH IST)
```

At a 1° projection, Athens and Istanbul are simply not two squares apart. §WALK-1.5 chose
to keep both cities rather than distort the map, and changed the data structure to say so:

```js
// §WALK-1.5: each cell is a LOCALE that may hold ≥1 node (1° collisions merge close cities).
const CELL_GRID = (() => {                       // roll2hit-v3.html@9852
  const g = {};
  for (const code of Object.keys(NODE_MAP)) {
    const coord = NODE_COORDS[code] || { r: NODE_MAP[code].r, c: NODE_MAP[code].c };
    if (coord && coord.r != null && coord.c != null)
      (g[`${coord.r},${coord.c}`] ??= []).push(code);
  }
  return g;
})();
const cellCode   = (key) => CELL_GRID[key]?.[0] || null;   // the node you "arrive at"
const cellCodes  = (key) => CELL_GRID[key] || [];          // all nodes in the locale
```

So **I2** — `CELL_GRID["r,c"] === code` — is false for all 244 cells, including the 178
that hold exactly one node: the value is an array either way. The correct restatement is
`cellCode(k) === CELL_GRID[k][0]`.

The player-facing consequence is a feature the report could not have described: **Birka
City Streets (`LHR`) and Birka Shore (`BK`) are the same cell.** You do not walk between
them; they are two rooms of one locale. That is why `_bfsGridPath('LHR','BK')` returns no
path — and why §NAV-01a had to redefine waypoint arrival as *standing on the destination's
cell* rather than *matching its code*, or arriving at a shore would never count as arriving.

---

## 6. What Survived Verbatim

Five load-bearing claims re-measured true, and they are the ones that matter:

1. **No stored exits, anywhere.** 0 cardinal and 0 diagonal fields across 416 nodes — and
   the deletion is now *defended*: `js/wbapi-server.js:const _badNodeFields@10145` rejects
   them on create and `js/wbapi-server.js:const _badPutFields@11043` on update, both HTTP
   400. §CELL-01 emptied the fields; §CELL-08 shipped the guard that stops anything
   writing them back. Only one of those two was ever listed as a feature.
2. **`storyRender` is the reconciliation point** (I3). `function storyRender(node, prefix)@34567`
   still snaps `playerR/C` to `NODE_COORDS[node.code]` on every named-node arrival, so
   logical state and grid state cannot drift.
3. **`storyCollectLoot` remains the sole shard writer** (I6). One write to `S_story.shards`
   exists in the entire file — `function storyCollectLoot(node)@30092` — behind the
   `S_story.visited[node.code]` guard. A claim of *uniqueness* is the easiest kind to
   falsify and this one held at 5.5 MB.
4. **`TERRAIN_ENCOUNTER_RATE` is byte-identical** to the excerpt, three months on.
5. **`reweave-all` still answers 410** with the same sentence, and §WALK-3 has since
   deleted its ~3,200-line body — the deprecation the report recorded went all the way.

---

## 7. What Was Deleted, and One Thing Worth Remembering

**The eight gate-locks.** §7.2's excerpt shows `cellMove` consulting quest state before
allowing a step: `TLS` sealed until 7 shards, `DAM` blind days, `NUE` Tide Gate, and five
more. That block was **real** — it is present in the tree at the report's own commit — and
it was **deleted the following day** by `1872896` (2026-06-16). Zero occurrences remain.

This report is therefore the last surviving description of a mechanic that contradicted
the project's first invariant. *No quest, flag, item, or mission bit may ever refuse a
step.* If a place must feel impassable, the terrain becomes sea; the mover never reads
quest state. Today `function cellMove(dir)@28345` is a thin caller over the shared
`Mover.move` kernel, and the only refusals it can produce are off-grid and impassable.

Also gone, with the reason:

| Removed | By | Why it mattered |
|---|---|---|
| `hoursElapsed`/`hoursSinceSlept` per step | §TIMELESS-01 | Walking no longer spends the 49-day clock; battle, rest, sleep and fishing still do |
| `Math.random()` encounter roll | §VM-01-B | Replaced by `_seededNext()`, the same stream the server rolls — replayable from a save |
| Hunt Mode's `effectiveRate = 1.0` | §KG-01 | Now `min(0.8, rate × 2)`; a guaranteed ambush every step was not a hunt, it was a tax |
| `"[Row r, Col c] — terrain"` + *"The path continues…"* | §NAV-01c | Replaced by `describeCell` (ROOMS:CORE): deterministic prose, road signage, nearest landmark, region name. The wilderness stopped being identical to itself |
| Worldbuilder Grid tab (§8.2–8.3) | `fa7fadc` | The grid-direct add flow and ghost list are gone; the Wizard (§8.4) survives |

---

## 8. Server Side: One Prelude, Three Different Answers

§11.2 attributed the `undirAdj` / `bfsReach` construction to `GET /api/graph/reachability`.
The **code still exists, verbatim** — `js/wbapi-server.js:const undirAdj = new Map()@5374` —
but it is now a *prelude shared by every `/api/graph/*` sub-route*, and the reachability
endpoint no longer uses it. Three live endpoints answer "is the world connected?" and they
disagree:

| Endpoint | Graph it walks | Answer |
|---|---|---|
| `GET /api/graph/reachability` | 90×360 **terrain-field land flood** (sea impassable, columns wrap) | **416 / 416**, one component |
| the §11.2 prelude (`connect`, `junction-audit`) | **named-node** 4-adjacency over the cell grid | **2 / 416** |
| `POST /api/graph/cluster-bridge` | its own BFS over `node.N/S/E/W` — of which there are 0 | 1 / 416 |

The middle row is the subtle one, and it is not stale code: the named-node BFS is *correct*
and got its §CELL-06 migration. It asks whether cities are orthogonally adjacent — and
with 416 nodes scattered over 32,400 cells the honest answer is permanently ≈0. **"Reads a
deleted structure" and "reads the right structure and asks the wrong question" are
different defects with different fixes.** Only the land flood answers the question a player
would recognise: *can I walk there?* It says yes, 416 times out of 416.

Invariant **I5** therefore holds — under an algorithm this report does not describe.
Under the algorithm it *does* describe, the world is 2/416 disconnected.

**§3.2's mirror claim needs one correction.** The module-level
`js/wbapi-server.js:function buildCellGrid(nm, coords)@948` is no longer a verbatim copy of
the client's; it deliberately returns a **scalar first-wins** grid so the primary at a
collided cell matches `CELL_GRID[key][0]`. Same primary, different shape — the parity is
stated, not accidental.

---

## 9. `/api/audit/map`: Twelve Checks, Five of Them Silent, One Shadowed Grid

Three corrections to §3.4, all new:

1. **Twelve check names, not four:** `alignment`, `axis_distance`, `bidirectional`,
   `corner_misalign`, `dangling_link`, `density`, `diagonal_exit`, `direction_sign`,
   `long_link`, `market_proximity`, `max_connections`, `missing_coords`.
2. **Five of the twelve read compass fields that number zero** — `diagonal_exit`,
   `dangling_link`, `bidirectional`, `direction_sign`, `max_connections`. They cannot fire
   and cannot fail. Their perpetual green is not evidence of a healthy map; it is evidence
   of an empty field. §11.3's completion criteria 3 and 4 inherit this: both are satisfied
   permanently and structurally, so neither measures anything.
3. **The handler shadows the promoted grid.** §3.2 recorded that `buildCellGrid` was
   "promoted to module scope for reuse". The promotion happened; the local copy was not
   removed. `js/wbapi-server.js:const DENSITY_THRESH = { road:3, market:8, _default:6 }@3802`
   opens a handler that redeclares `buildCellGrid` **last-wins**, while
   `js/wbapi-server.js:// §WALK-2: first-wins (not last-wins)@952` is first-wins. They
   disagree at **all 66 shared cells** — including `10,197`, where the audit believes
   Birka's cell holds `BK` (the shore) and the client, the mover and the server's own
   module-level grid all say `LHR` (City Streets, the canonical Act I root). Filed as
   **§DX-02bq**.

---

## 10. The Seeding Tool That Still Speaks the Old Space

`worldmap.js` moved to `tools/worldmap.js` (155 GEO rows, up from the "130+" claimed) and
its ASCII projection is unchanged. §4.3's description of the seeding path is also unchanged
— **and that is the problem**:

```js
// tools/worldmap.js:const GRID_MIN = 8, GRID_MAX = 500@1124
function geoToGrid(lat, lon) {
  const r = Math.round(GRID_MIN + (MAP.maxLat - lat) / (MAP.maxLat - MAP.minLat) * (GRID_MAX - GRID_MIN));
  const c = Math.round(GRID_MIN + (lon - MAP.minLon) / (MAP.maxLon - MAP.minLon) * (GRID_MAX - GRID_MIN));
  …
}
```

`./api.sh worldmap --seed` writes rows in **8–500** into a world whose mover clamps at
**row 89**, and `PUT /api/coords/{code}` performs no bounds validation of any kind — any
numeric `r,c` is accepted. A node seeded at row 300 is off the band: unreachable, and once
you are on it, unleavable. Filed as **§DX-02bo**.

The instrument here is worth keeping: **a claim can stay true while becoming wrong.** The
tool did not drift. The world drifted out from under it, and the report's most faithful
layer is the one that now documents live danger.

**A second write-path defect, in the other direction.** The locale model the client
requires cannot be authored through the API. `PUT /api/coords/{code}` returns **409 on any
collision**, and `POST /api/node` with colliding `r,c` is worse: it creates the `NODE_MAP`
entry, *silently drops the coordinates*, and returns **201 `ok:true`**. The result is a
ghost — §8.3's own term for a node that can hold quests and NPCs but can never appear in
`CELL_GRID`. There are 0 ghosts at HEAD, so the roster is clean; the manufacturing line is
still running. Filed as **§DX-02bp**.

---

## 11. Program Flow at HEAD

The §10 walkthrough is structurally intact and numerically obsolete. Corrected:

- **Phase 0–2** hold: `storyCheckContinue` → continue modal → `storyLoadContinue` →
  `storyRender`. Quest activation moved into `_uqfActivateAtNode` (§VM-01-G3), which runs
  at the *start* of `storyRender` so per-node UI keyed on `'active'` renders in the same
  arrival; `storyCheckQuests` re-runs it idempotently.
- **Phase 3.** `LHR (10,197) → SEN (18,180)` is **27** steps, not ~55. And it is one
  click, not 27 presses: `storySetWaypoint` calls `_travelStart()`, and `storyWaypoint`
  routes with `_roadGridDir` — the *road-weighted* router, so auto-travel prefers the safe
  highway. Any keypress halts it and keeps the waypoint. The report's "player presses WP
  again for the next step" is retired UX.
- **Phase 4** holds. `SEN.act === 2`; the badge updates; there is still **no gate between
  Act I and Act II**. The act boundary is purely geographic — which is exactly the free-
  movement invariant showing through the narrative layer.
- **Phase 5** needs a correction. There is no node whose loot reads `"Codex Shard #1"`.
  Shards are typed by `_itemType`'s regex `/shard #|\(shard|tidal rune|grove token|trade
  seal|crimson warrant|sand cipher|highspire fragment/`, and the seven shard-bearing nodes
  are one per act:

  | Shard | Node | Act | Loot string |
  |---|---|---|---|
  | #1 | `LCY` | 2 | Trade Seal (Shard #1) |
  | #2 | `FRO` | 3 | Grove Token (Shard #2) |
  | #3 | `RAI` | 4 | Tidal Rune (Shard #3) |
  | #4 | `TRD` | 5 | Crimson Warrant (Shard #4) |
  | #5 | `DOH` | 6 | Sand Cipher (Shard #5) |
  | #6 | `BKK` | 7 | Codex Shard #6 |
  | #7 | `NUE` | 6 | Weimar Fragment (Shard #7) |

  The mechanism the report describes is right; the string it searched for belongs to shard
  **#6**. `const SHARD_NOTES@27159` covers all seven (its own comment says five — stale).

---

## 12. The Test Plan: One of Five, and It Was Rewritten Because of This Report

`tests/unit/` does not exist. Of the five files in §12, four never shipped:

| File | Tier | Status |
|---|---|---|
| `navigation.test.js` | Playwright | ✅ exists — **rebuilt**, see below |
| `navigation-act2.test.js` | Playwright | ❌ never shipped |
| `reweave-connectivity.test.js` | Playwright | ❌ never shipped |
| `cell-grid.test.js` | Node | ❌ never shipped |
| `reweave-validate.test.js` | Node | ❌ never shipped |

This is not simply an unbuilt plan. The surviving file carries the epitaph in its own
header:

> *"The previous version hardcoded pre-§WALK-1.5 coords/adjacencies (BOO 47,223;
> BOO→LXF→SEN corridor) and a since-removed `hoursElapsed += 1` on movement… This rebuild
> ground-truths every fixture against the CURRENT geo and the post-§TIMELESS-01
> timeless-movement model."* — §WALK-4 Inc 3

Those are §12.3's three tests, named and dated. The suite was not abandoned; it was
**written, invalidated by the reprojection, and rebuilt against the live geo** — 25 tests
covering one-cell movement, timeless movement, the empty-cell shell, the room layer,
D-pad buttons, sea blocking, sea lanes, BFS, waypoints and auto-travel.

Two of the unbuilt files were unbuildable as specified, and the reason is §5: their central
assertions were *"zero coordinate collisions"* and *"grid key count equals coord count"*.
Both are false at HEAD by design. A test suite written to a repealed invariant is not a gap
in coverage — it is a specification that would now fail correctly.

**One live defect found in the rebuilt file.** Its `moveNoEncounter` helper suppresses the
step's encounter by stubbing `Math.random`, but §VM-01-B moved that roll to
`_seededNext()`, which never touches `Math.random`. The stub controls nothing (and is
restored before the deferred battle fires anyway), so several tests are one unlucky seed
from a red. This is the **third** recurrence of the same lesson in this repo — §DX-02e
pinned generated coordinates, §DX-02f stubbed the wrong RNG stream, and now this. *A test
that stubs an RNG must stub the stream the code actually draws.* Filed as **§DX-02br**.

---

## 13. Invariants, Restated for the Locale Grid

The original I1–I6 are kept below with their corrections, because the two that broke are
more instructive than the four that held.

| | Original | At HEAD |
|---|---|---|
| **I1** | Coordinate uniqueness | ❌ **Repealed.** 172 nodes share a cell with another; a cell is a locale, not a slot |
| **I2** | `CELL_GRID["r,c"] === code` | ❌ **Reshaped.** `cellCode(k) === CELL_GRID[k][0]`; the value is always an array |
| **I3** | Player sync after `storyRender` | ✅ Holds |
| **I4** | Move correctness after `cellMove` | ✅ Holds — now via the shared `Mover.move` kernel |
| **I5** | BFS from `LHR` reaches every node's cell | ✅ Holds, **416/416**, on the terrain-field land flood (not the node graph, which is 2/416) |
| **I6** | Shard idempotence via `S_story.visited` | ✅ Holds — still exactly one write site |

Two new invariants the locale model requires, neither yet enforced:

- **I7 (Band containment):** every `NODE_COORDS` entry satisfies `0 ≤ r < 90`. True at HEAD
  (rows 2–73); no write path checks it (§DX-02bo).
- **I8 (Primary agreement):** every server-side reader of the cell grid resolves the same
  primary as the client. False at 66 cells today (§DX-02bq).

---

## 14. Findings Filed

| Row | Sev | Summary |
|---|---|---|
| **§DX-02bo** | 🟠 | `tools/worldmap.js --seed` still projects into the retired 500×500 space; `PUT /api/coords` has no bounds guard |
| **§DX-02bp** | 🟡 | `POST /api/node` returns 201 and silently drops colliding coords, minting a ghost; `PUT /api/coords` 409s the locale model the client requires |
| **§DX-02bq** | 🟢 | `/api/audit/map` shadows the promoted `buildCellGrid` last-wins, disagreeing with the client's primary at all 66 shared cells; 5 of its 12 checks are permanently silent |
| **§DX-02br** | 🟢 | `navigation.test.js` suppresses encounters by stubbing `Math.random`, which the roll no longer draws |

Corroborated from prior passes: **§DX-02bm** (`junction:0` unreachable in
`TERRAIN_ENCOUNTER_RATE`), **§DX-02bn** (`serializeNodeLiteral`'s dead `N,S,E,W` — this
report's own §9.2 note, still open at HEAD).

---

## 15. Known Limitations of the Original

Retained from §13.1, with verdicts.

**"Line number references may drift."** Correct, and understated: the drift is not noise
but a whole change of units. Superseded by `symbol@line` anchors (§DX-01e) — the symbol is
the pointer, the number a hint.

**"`IMPASSABLE_CELLS` not covered by unit tests."** Still true in the sense that no unit
tier exists. But the underlying worry was inverted by §WALK-1.5: the sea is no longer a
sparse afterthought populated at parse time, it is 4,790 cells in 286 runs derived from a
Natural Earth coastline raster, and the live `navigation.test.js` asserts both directions —
a sea step is refused *and* a carved lane cell is walkable.

**"`serializeNodeLiteral` STR list."** Still true, still dead, now tracked as §DX-02bn.
The report called it "a cleanup candidate… if the guard is relaxed in a future branch."
Three months later the guard has not been relaxed, no compass field has returned, and the
prediction is the most durable sentence in the document.

---

*© 2026 Paul Richeson — MIT License. Verified §DOC-02az, 2026-08-13.*
