<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->

# Lab Report — Cell Map & MUD Redesign (§CELL-01 – §CELL-11)

**Sections:** §CELL-01 – §CELL-11 · **Authored:** 2026-06-14 · **Verified:** 2026-08-13 (§DOC-02ay)
**Original status claim:** ✅ 11/11 complete · **Measured:** 10 of 11 shipped whole; §CELL-06 shipped for 1 of the 5 subsystems it names.

---

## Abstract

CodexOfConquest's navigation was replaced: stored exits (`node.N/E/S/W`) gave way to *implicit* topology, where two
places are connected if and only if their `(r,c)` grid coordinates are adjacent. One keypress moves one cell.
The change spans client, server, API and CLI, and added a multiplayer MUD session layer on top of the new grid.

Re-measured against live `play.html` (38,707 lines, 416 nodes) and `src/js/wbapi-server.js` two months on:
**the client half is intact and byte-honest** — every symbol §CELL-01 through §CELL-11A claims to have added
resolves, and every symbol it claims to have deleted returns **0 occurrences**. The rot is entirely on the
server, and it has one shape: **§CELL-06 promised to migrate five graph algorithms to the cell grid and
migrated one.** The other four still BFS across `node.N/S/E/W` — *the fields §CELL-01 deleted on the same day,
in the same work order.* They have been answering "is the world connected?" from an edge set that is empty by
construction ever since.

The consolation is that the report's own §CELL-08 guard has been quietly containing the damage. It is proven
below to reject, with a 400, every write those tools attempt.

---

## I. Intention & Inspiration — what this buys the player

The corridor system asked the player to hold a mental model no one outside the codebase had. Pressing **North**
did not move you north; it *proposed* a journey, opened a dialog, checked a Manhattan distance, and either
teleported you five cells or refused. Three concrete failures:

1. **Fake topology.** Exits were strings — `node.N: 'BMA'` — pointers that could outlive the thing they pointed
   at. A whole audit category (`brokenEdge`) existed only to hunt phantom edges, and a "highway mesh" of
   auto-generated J-nodes existed only to paper over gaps between cities.
2. **Dead startup cost.** `_buildNodeExits()` ran on every page load to recompute `N/E/S/W` *from the
   coordinates* — deriving the pointers from the truth, then storing the derivation, then trusting the store.
3. **Non-obvious movement.** Players expected one step = one step. They were right.

The redesign's thesis is one sentence: **the map should not need a second copy of itself.** Coordinates already
say where everything is; adjacency is a question you ask them, not a fact you write down.

**What the player actually gets, and why it matters for playability:**

- **The world became walkable instead of navigable.** Previously the map was ~416 destinations joined by
  invisible rails. Now the space *between* the cities is real: `_enterEmptyCell@28529` gives every blank cell
  prose, a terrain, a signpost toward the next settlement, and an encounter roll. The map went from a menu of
  places to a place.
- **Movement became legible.** One key, one cell, no dialog. A player can form a plan ("go west four, then
  north") and have it be true.
- **Roads became a real decision.** `const TERRAIN_ENCOUNTER_RATE@9905` sets `road:0` while `forest:0.25` and
  `hag_swamp:0.35`. The road is *safe and slow*; the wilderness is *fast and expensive*. That trade-off was
  impossible when travel was a teleport.
- **Discovery became a mechanic.** Fog-of-war is tracked per **cell**, not per node (`visitedCells@23126`), so
  the map fills in as a record of where you have physically been — not a checklist of nodes you have unlocked.
- **The world became shareable.** §CELL-07's session layer put other live players on the same grid, in the same
  cell, with chat and arrival events. A MUD is only possible once "where you are" is a coordinate.

> The old system's most honest artifact was the name of its repair tool: `fill-gap`. It bridged holes in a
> topology that only existed because someone had written it down.

---

## II. Method

Per §DOC-02 house method: batch-`grep` every symbol the report names *before* reading it; separate **RETIRED**
(shipped, later removed) from **NOT SHIPPED** (never existed) with `git log -S`; and — new for this pass —
**boot the server and issue the exact request the suspect code issues.** Static reading suggested the §CELL-08
guard defused `cluster-bridge`; a live 400 proved it. All probes ran against a byte-verified working tree
(`md5` before and after: `ce492bacf634e5580e5664827eaf599e`, unchanged).

---

## III. As-Built Inventory (verified at HEAD, 2026-08-13)

### Client — `play.html`

| § | Claim | Anchor | Verdict |
|---|---|---|---|
| CELL-01 | All `N:`/`E:`/`S:`/`W:` stripped from `NODE_MAP` | — | ✅ **0** in `NODE_MAP`. The 4 surviving hits are direction-*name* lookups (`_MAP_OPP@36818`, `ARROWS@37484`) — not edges. |
| CELL-02 | `CELL_GRID` built once from `NODE_COORDS` | `const CELL_GRID@9865` | ✅ live, single source of adjacency truth |
| CELL-03 | `cellMove(dir)` replaces `storyMove(dir)` | `function cellMove@28495` | ✅ live; `storyMove` **0 occurrences** |
| CELL-04 | Empty-cell traversal + terrain inference + encounter roll | `_enterEmptyCell@28529`, `_inferTerrain@28535`, `const TERRAIN_ENCOUNTER_RATE@9905` | ✅ shipped — precedence since revised, see Δ4 |
| CELL-05 | Junctions bulk-deleted; `J13`/`WRO` promoted | `POST /api/graph/nuke-junctions` | ✅ done — **and it is the origin of a live hazard**, see Finding 3 |
| CELL-05b | Zombie J-stubs purged; `junction` field removed | — | ✅ `junction:true` **0**, `junction:false` **0**, `name:'junction'` **0** |
| CELL-09 | Quest triggers + waypoints on the cell grid | `_enterEmptyCell@28529` (§CELL-09 encounter block) | ✅ live |
| CELL-10 | Per-cell fog-of-war + live minimap cursor | `visitedCells@23126` (3 render sites) | ✅ live |
| CELL-11A | 13 corridor symbols deleted | — | ✅ **all 13 return 0**, incl. `buildCorridorMap`, `_buildNodeExits`, `storyCorridorTravel`, `CORRIDOR_CELLS`, `story-corridor-overlay` |

**A clean sweep on the client.** For a 2-month-old report describing a 5.4 MB single-file engine, 13 deletions
with a 13/13 confirmation rate is the strongest as-built result the §DOC-02 program has recorded on a *removal*
claim. §CELL-11A was written from the diff, and it shows.

### Server — `src/js/wbapi-server.js` (was `wbapi-server.js`; moved by `cc35c08` §CLEANUP-02, 2026-07-09)

| § | Claim | Anchor | Verdict |
|---|---|---|---|
| CELL-06 | 5 graph algorithms → cell-grid BFS | `src/js/wbapi-server.js:function buildCellGrid@951`, `src/js/wbapi-server.js:const MOVES4@947`, `src/js/wbapi-server.js:const DIR_NAMES@948` | ⚠️ **1 of 5** — see Δ1 |
| CELL-07 | MUD session layer, 7 endpoints, SSE, 30-min TTL | `src/js/wbapi-server.js:const SESSIONS@71` | ✅ shipped, now **9** endpoints (Δ3) |
| CELL-08 | 5 read-only cell/grid endpoints | `src/js/wbapi-server.js:→ node at grid cell@11555` (help table `@11532`–`@11536`) | ✅ all 5 live |
| CELL-08 | `POST`/`PUT /api/node` reject direction fields | `src/js/wbapi-server.js:_badNodeFields@10157`, `src/js/wbapi-server.js:_badPutFields@11066` | ✅ **live and load-bearing — empirically proven below** |

---

## IV. Spec → Shipped Delta Table

| # | Report says | HEAD does | Class |
|---|---|---|---|
| **Δ1** | "All server-side graph algorithms (highway, reweave, fill-gap, fix-diagonal, reachability) replaced with cell-grid BFS." | **One** was: `GET /api/graph/reachability` (src/js/wbapi-server.js:parts[1] === 'reachability' && method === 'GET'@5501), and it went further than promised — it floods the **90×360 terrain field**, not the cell grid. `fill-gap` · `rip-and-connect` · `reweave-all` were **retired to 410** by §WALK-3. `cluster-bridge`, `junction-audit` and `smart-connect` still walk `node.N/S/E/W`. `highway` and `fix-diagonal` do not exist at HEAD under those names. | **PARTIAL — the report's headline defect** |
| **Δ2** | (unstated) `POST /api/graph/cluster-bridge --execute` bridges isolated clusters. | It **cannot**. Its two writes are `PUT /api/node/:code {N:…}` (`src/js/wbapi-server.js:const putA = await httpReq@7048`) — rejected 400 by §CELL-08's own guard. See Finding 2. | **INERT — contained by this report** |
| **Δ3** | Seven session endpoints: `start`, `move`, `look`, `who`, `say`, `end`, `events`. | **Nine.** `POST /api/session/pos` (src/js/wbapi-server.js:POST /api/session/pos@8918) and `GET /api/session/chat` (src/js/wbapi-server.js:§MESH-02(h) chat history@8718) (§MESH-02h chat history) were added later. | GROWTH — report accurate when written |
| **Δ4** | `_inferTerrain` = "nearest named neighbor's terrain, with road fallback". | Road is a **precedence rule, not a fallback** — and it is now third: `SEA_LANES → 'ocean'` (§WALK-1.5), then `ROAD_CELLS → 'road'` (§NAV-01b), then a **plurality vote** across the 4 orthogonal neighbours. "Nearest" was never the algorithm. | STALE + imprecise-when-written |
| **Δ5** | "Net result: **419** clean named nodes… 419 is the authoritative count from `GET /api/ping`." | **416** nodes / 416 coords. The report's care here was right and its number aged. | STALE (world drift) |
| **Δ6** | §CELL-05b removed the `junction` field from all surviving nodes. | True — but `const TERRAIN_ENCOUNTER_RATE@9905` still carries the key `junction:0`, now **unreachable**: `_inferTerrain` can only return `'ocean'`, `'road'`, or a live `NODE_MAP.name`, and `name:'junction'` is **0**. The engine even documents the removal 3,400 lines earlier (`@6402`) without removing the key. | **DEAD KEY** → §DX-02bm |
| **Δ7** | "Files Changed" lists 13 paths at repo root. | 4 moved (`wbapi-server.js` → `src/js/`, `wbapi-help.md`/`API-README.md` → `docs/api/`, `spec-corridors.md` → `docs/spec/`, `docs-node-network.md` → `docs/notes/`). Content claims hold. | STALE (path only) |

---

## V. Findings

### Finding 1 — Three endpoints answer "is the world connected?", and they disagree because two of them are reading a deleted graph

Measured live, same server, same second:

| Endpoint | Answer | What it actually walks |
|---|---|---|
| `GET /api/graph/reachability` (src/js/wbapi-server.js:parts[1] === 'reachability' && method === 'GET'@5501) | **416 / 416 reachable · 1 component · 0 clusters** ✅ | the **terrain field** — an 8-way-clamped land flood over 90×360 with E↔W wrap |
| `GET /api/grid/reachability` (src/js/wbapi-server.js:if (sub === 'reachability')@8623) | **2 / 416 reachable · 414 unreachable** | `CELL_GRID` **named-node** adjacency — a node counts only if another *named node* touches it orthogonally |
| `POST /api/graph/cluster-bridge` (src/js/wbapi-server.js:parts[1] === 'cluster-bridge'@6919) | **1 / 416 reachable · 415 isolated clusters** | `node.N/S/E/W` — **deleted by §CELL-01** |
| `GET /api/graph/junction-audit` (src/js/wbapi-server.js:parts[1] === 'junction-audit'@7060) | `namedReachable: 2`, `namedUnreachable: 413` | same deleted edge set |

Only the first is the player's world. `cellMove` walks *land*, not node-to-node hops, so 416/416 is correct and
the other three are artifacts. But note the second row carefully: `grid/reachability` **did** get its §CELL-06
migration — it BFSes the cell grid exactly as promised. It is not stale. It is **asking a different question
under the same name**: "which named nodes are orthogonally touching?" In a world of 416 nodes scattered across
32,400 cells, the honest answer to that question is *almost none*, and it always will be. §CELL-06's migration
succeeded and produced a meaningless metric, which is a distinct and more interesting failure than rot.

> A repair tool that diagnoses from fields the repair is forbidden to write will always find work to do, and
> will never finish any of it.

### Finding 2 — The report's own guard has been silently containing the blast radius for two months

`cluster-bridge --execute` bridges clusters by issuing two writes per cluster:

```js
const putA = await httpReq(`/api/node/${aCode}`,'PUT',{[dir]:bCode});          // @7036
const putB = await httpReq(`/api/node/${bCode}`,'PUT',{[OPP4cb[dir]]:aCode});
```

That is a direction field on a node PUT — precisely what §CELL-08 forbids. **Proven against the live server:**

```
PUT /api/node/WRO  {"N":"J13"}  →  400  "Fields N are deprecated on node PUT.
                                          Exits are derived from cell-grid adjacency…"
PUT /api/node/J13  {"S":"WRO"}  →  400  (same)
POST /api/node     {…,"N":"WRO"} →  400  "…not stored. Place the node at (r,c)…"
```

`play.html` was byte-identical before and after. With 415 clusters reported, an `--execute` run would
attempt **830 PUTs and land 0**, printing `✗ put failed` 415 times. The §CELL-08 decision the original report
filed under *"Non-Obvious Decisions"* — **reject, don't silently ignore** — is the reason a stale repair tool
has never once corrupted the world file. It is the single most valuable line in the original document, and its
author justified it in one sentence about masking caller bugs. They were more right than they knew.

**Corollary defect:** the 68-line **auto-junction rule** (`src/js/wbapi-server.js:const autoJunctionEnabled@11077`) — which mints new `J\d+`
nodes when a 4th direction is set — is **unreachable**. Its trigger requires `body[dirField]` to be truthy;
the guard eight lines above returns 400 on exactly that condition. It is live-looking code that re-creates the
entities §CELL-05 was written to destroy, and it cannot run. → §DX-02bn.

### Finding 3 — §CELL-05 promoted `J13` to a real node and left it wearing a junction's name

§CELL-05 promoted two junction stubs to named midlands nodes: `WRO` and **`J13`**. `WRO` got a real code.
`J13` did not. It is now the **only** `J`-prefixed node in the world — `The Western Sea Road`, and the home of
**The Cartographer**, one of the game's seven roadside vignette NPCs.

`POST /api/graph/nuke-junctions` (src/js/wbapi-server.js:parts[1] === 'nuke-junctions'@6643) selects by *code pattern* — `src/js/wbapi-server.js:const jCodeRe@6668` (`/^J\d+$/`) — and guards
with two reference sets: quest `activateNode`/`waypointNode`, and `WBAPI.birkaNpcs[].node`. Live dry-run:

```
[nuke] questRefNodes=388  npcRefNodes=121
[nuke] safety check PASSED — 0 J#### have quest/NPC refs
[nuke] classified: safe=1  straight=0  L-shaped=0  dead-end=1
```

The safety check passes because The Cartographer is not in either set. She lives in
`const JUNCTION_VIGNETTES@26687` — a map keyed **by node code**, with **no `node:` field on any entry** — and
`nuke-junctions` reads `BIRKA_NPC_PROFILES` instead. The guard is not reading the wrong field; it is reading a
different map. This pins the mechanism behind §DX-02bk.

The counterpoint is instructive. `POST /api/admin/delete-junctions` (src/js/wbapi-server.js:parts[1] === 'delete-junctions'@8337) gates on `if (!node.junction) continue`
— and §CELL-05b deleted that field from every node, so it returns `toDelete: 0`. **The verb that checks what a
junction *is* is inert; the verb that checks what a junction is *called* is armed.** Naming a promoted node
after the thing it stopped being is the whole bug.

---

## VI. Risk Register — Outcome

| Original decision | Outcome |
|---|---|
| `buildCellGrid` rebuilt per-request ("sub-millisecond over ~420 nodes") | ✅ Held. Still per-request at `@948`; 416 nodes. |
| SSE over HTTP/1.1, no WebSocket; single-threaded ⇒ no per-session mutex | ✅ Held. `text/event-stream` still the only transport; the session layer has since grown 2 endpoints without needing a lock. |
| Reject direction fields rather than silently ignore | ✅✅ **Held, and it is the reason Finding 2 is a curiosity and not an incident.** |
| "419 vs 420 — 419 is authoritative from `/api/ping`" | ⚠️ Method right, number aged: 416 today. The instinct to name the authority outlived the figure. |

---

## VII. Defects Filed

| Row | Sev | Defect |
|---|---|---|
| **§DX-02bl** (sharpened) | 🟠 | Three connectivity endpoints, three answers (416 · 2 · 1). Mechanism now pinned: only `graph/reachability` is correct; `cluster-bridge`/`junction-audit` read `N/S/E/W` (deleted §CELL-01); `grid/reachability` reads the right graph but reports a meaningless metric. |
| **§DX-02bk** (mechanism pinned) | 🟠 | `nuke-junctions` deletes `J13`/The Cartographer. Confirmed by live dry-run (`safe=1 dead-end=1`). Cause: safety net reads `BIRKA_NPC_PROFILES`; the vignette lives in `JUNCTION_VIGNETTES@26687`, which has no `node:` field and is never consulted. |
| **§DX-02bm** *(new)* | 🟢 | `const TERRAIN_ENCOUNTER_RATE@9905` key `junction:0` is unreachable — `_inferTerrain` cannot return `'junction'` (`name:'junction'` = 0). Delete the key; the removal is already documented at `@6402`. |
| **§DX-02bn** *(new)* | 🟡 | The 68-line auto-junction rule (`@11054`) is dead code behind the §CELL-08 PUT guard (`@11043`) — and it mints `J\d+` codes, the exact hazard class of §DX-02bk. Delete with the retirement sweep. |
| **§AUDIT-03az** (unchanged) | 🟡 | Re-code `J13` to a non-`J` key — the permanent close for §DX-02bk. This report is its origin: §CELL-05 promoted the node and kept the name. |

---

## VIII. Conclusion

§CELL-01 – §CELL-11 did what it set out to do. The client is exactly as described, two months and thousands of
commits later, and the world it produced is the one the player walks: 416 of 416 nodes reachable, one component,
one keypress per cell, roads that are safe and forests that are not. Deleting the stored graph did not break
the map — it revealed that the map had never needed one.

What the pass found is that **deleting a data structure does not delete its readers.** Four server tools have
spent two months answering questions about a graph that no longer exists, reporting 415 isolated clusters in a
world with one component, and the only thing standing between that diagnosis and a corrupted world file is a
400 the same report installed on the same day.

> The system that stopped storing exits shipped the guard that stops anything from writing them back. Both
> halves of that sentence are §CELL-08, and only one of them was listed as a feature.

---

*© 2026 Paul Richeson — MIT License.*
*Verified §DOC-02ay, 2026-08-13, against `play.html` @ `985505c` + live `src/js/wbapi-server.js` (port 1367).*
