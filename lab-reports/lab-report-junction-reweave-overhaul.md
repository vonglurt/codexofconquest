<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->

# Junction Reduction & Reweave Overhaul — Lab Report

**Filed:** 2026-06-10 09:34 · **Committed:** `09fa5b2` 2026-06-10 17:20 (repo root)
**Original status:** DESIGN (pre-implementation) · **Verified:** 2026-08-13 (§DOC-02aw)
**Subject:** why the world grew 20,000 routing stubs, and what to do about it

---

## Abstract

The world map had stopped being a map. Named places — Birka, Rome, Constantinople, the
Littoral Courts — were separated by chains of automatically generated **junction nodes**:
rooms with no prose, no people, no loot, whose only purpose was to hold the road together.
Each repair pass created more of them. This report audits the population, argues that the
whole class is safe to delete, and specifies a replacement: one nuclear cull (**P_NUKE**)
followed by **A\*** pathfinding on a cell grid, so that routing is computed rather than
accumulated.

**Verification verdict — the document splits cleanly in half.** The destructive half
(§5, P_NUKE) shipped **3 h 56 m** after filing and is **live at HEAD**, cited by name in
two source files. The constructive half (§6–§7, cell-primary coordinates and A\*) **never
existed**: all ten of its identifiers have exactly one commit in the repository's entire
history — the commit that added this document. The eleven-phase pipeline inventory in §4 is
the most accurate tabulation of that pipeline in the corpus. The §1 census matches nothing.
And §3's safety guarantee — *"junction nodes have `npc:null`, `battle:null`, `loot:null`
by construction"* — was **false the day it was written**, by exactly three nodes.

---

## 1. Method

Every figure below was re-derived by running this report's own rules over `git show`-extracted
archive files, not by reasoning about them. Reference commits: **`66e26dd`** (2026-06-10 09:23,
the commit standing when the report was written) and **`09fa5b2`** (17:20, its birth commit).
Symbol life-and-death by `git log -S`; HEAD state by direct census of `roll2hit-v3.html`.

> **Measurement hazard, recorded because it cost four tool calls.** Junction entries are
> serialised `J3969: { num:…` — with a space between the colon and the brace, where named
> entries use `LHR:{ num:…`. A census regex written for one form silently reports **145**
> nodes where the file holds **4,429**. Always match `^  [A-Za-z0-9_]*: *{`.

---

## 2. Provenance

| Event | Commit | Time | Gap |
|---|---|---|---|
| P_PRE + P6.5 added to pipeline | `94debbd` | 06-10 08:50 | −44 min |
| **Report filed (mtime)** | — | **06-10 09:34** | — |
| Littoral crossings deleted | `a61d6eb` | 06-10 14:22 | +4 h 48 m |
| P_NUKE + `junction-audit` ship | `e2576f6` / `a430748` | 06-10 13:30 / 14:31 | +3 h 56 m |
| **Report committed** | `09fa5b2` | 06-10 17:20 | +7 h 46 m |
| Junctions abolished outright | `6dea804` (§CELL-05) | 06-13 21:00 | +3 days |

The 44-minute gap at the top is load-bearing. `94debbd` — *"add P_PRE straight-chain reduction
+ P6.5 grid-connect"* — landed less than an hour before this was written, and **after** both
sibling reweave reports were filed on 06-09. That is why this is the only document in the
corpus that names those two phases.

---

## 3. As-built inventory — the pipeline had twelve phases

§4 documents eleven phases in this order, and §10 names the twelfth. All twelve verify in
`wbapi-server.js` at the birth commit, and the order §4 uses is the **execution** order —
`phaseBanner` call sites run 5713 → 7012 in exactly this sequence, confirmed by the run banner
`Road: 0/jct-reduce → 1/geo-seed → 2/rip-connect → 3/coord-scan → 4/fix-broken`.

| Phase | Role | Published mechanic | Measured at `09fa5b2` |
|---|---|---|---|
| **P_PRE** | straight-chain reduction | "up to 10 passes" | `for (let pp = 1; pp <= 10; pp++)` ✅ |
| **P0** | geo-seed lat/lon → r,c | Mercator box-fit, lat −8→68, lon −25→72 | ✅ (see §7) |
| **P1** | rip-and-connect strays | BFS to nearest free slot | ✅ |
| **P1.5** | coord-scan | wire grid-adjacent nodes | ✅ |
| **P4** | fix-all-broken | insert elbow when coord distance > 4 | `axisDistance > 4` ✅ |
| **P5** | fix-bidirectional | repair one-way links | ✅ |
| **P2** | priority highways | L-corridor, `step=4` | `step = 4` ✅ |
| **P3** | city-mesh MST | nearest-first corridors | ✅ |
| **P6** | derelict cleanup | "loops up to 20 passes" | `dp <= 2000` ❌ **100× understated** |
| **P6.5** | junction grid-connect | 2-conn junctions, free cardinals | ✅ |
| **P7** | wither | snail desire paths + Tarjan, 20 passes | `wp <= 20` ✅ |
| **P8** | final reachability check | — | ✅ (`// PHASE 8 — final check`) |

Two notes on the two imperfect rows.

**The P6 cap is wrong by 100× and it is wrong the same way twice.** `lab-report-mega-reweave.md`
published the identical figure under the invented constant name `MAX_CLEANUP: 20`, against the
identical `for (let dp = 1; dp <= 2000; dp++)`. Two reports, two authors' sittings, one wrong
number, and it errs in the direction that makes the system look safer. Nothing in either
document's *behavioural* half is wrong; only the brakes.

**The prose names the wrong graph structure.** §2 and §4 say *"structural bridge"* and
*"Tarjan bridge-detection"* three times. The source says **"Tarjan's articulation-point
algorithm"** — cut *vertices*, not cut *edges*. For a decision about deleting a **node**,
articulation points are the correct structure, so the code is right and only the vocabulary
is wrong. Recorded rather than corrected: it is the fingerprint of a passage written from
memory beside passages that were read off the screen.

---

## 4. The census (§1) — the weakest section in the document

Measured at `66e26dd`, the commit standing when the report was written:

| §1 claim | Published | Measured | Verdict |
|---|---|---|---|
| Total nodes in `NODE_MAP` | 20,936 | **4,429** | ✗ 4.7× over |
| J#### junction nodes | 20,493 (97.9 %) | **3,968** (89.6 %) | ✗ |
| Named location nodes | 443 | **461** | ✗ |
| `NODE_COORDS` entries | 7,348 | **4,495** | ✗ |
| J#### in `NODE_COORDS` | 6,883 | **3,971** | ✗ |
| Named nodes in `NODE_COORDS` | 465 | **524** | ✗ |
| Quest `activateNode`/`waypointNode` refs | 2,257 (322 unique) | **2,489 (358 unique)** | ✗ |
| **Quests pointing at J#### nodes** | **0** | **0** | ✅ **exact** |

The table describes a map that would not exist for three more days. The world first reaches
this scale at **`be046d4` (2026-06-13 17:02): 21,734 nodes / 21,330 junctions** — the true peak
of the cascade, and the state §CELL-05 demolished four hours later. Only the load-bearing row
is exact, and it is exact at every commit checked, including HEAD.

**The table is also internally impossible, and the impossibility understates a real defect.**
443 named nodes cannot host 465 named coordinates. The published arithmetic implies 22 orphan
coordinate entries; the birth commit holds **4,295** — coordinates for nodes that no longer
exist, 71 of them named (`CQ`, `BA`, `DF` and 68 others) — while **0** nodes lacked a
coordinate.

> **This inverts §6.** The cell-primary section opens by stating its goal: *"for **every node**
> (named or junction) to have a canonical `{r, c}` cell coordinate."* That goal was already
> 100 % met. The coordinate table's defect ran entirely the other way, and the design never
> mentions the direction that was broken.

*(Resolved since: `NODE_COORDS` at HEAD holds 416 entries against 416 nodes, zero orphans in
either direction — §WALK-1.5.)*

---

## 5. The safety argument (§3) — false when written, by three nodes

§3 answers *"Is it safe to remove all junctions?"* with **"Yes. Completely safe."** and four
supporting bullets. Measured at `66e26dd`:

1. **Zero quest refs** — ✅ exact. 0 of 2,489 quest node references match `J####`, then and at HEAD.
2. **No NPC stations** — ✅ exact. 0 `BIRKA_NPC` entries reference a J code.
3. **No gameplay content** — ❌ **false.** Of 4,045 nodes carrying `junction:true` or
   `name:'junction'`, **three carried live battles.**
4. **Coordinates are scaffolding** — ✅ in kind (see §4 for the orphan count).

The three exceptions:

| Node | Label | Battle |
|---|---|---|
| `LJ1` | First Crossing | `Sea Spawn × 2` |
| `LJ2` | Second Crossing | `Deep One × 3` |
| `LJ3` | The Serpent Passage | `The Serpent of the Passage` |

With `LJ0` (*The Littoral Passage*) these are the four sea crossings of **§SIREN-01, The Four
Courts of the Littoral Sea** (`42c2f82`, 2026-05-28) — the arc's entire combat layer, wearing
`name:'junction'` because they are crossings and a crossing is a junction in English.

**All four were deleted at `a61d6eb` (2026-06-10 14:22)** — *"fix: P5 `batchEditNode` O(M)
rewrite + P6.5 DELTA key crash"* — **4 h 48 m after this report certified the class
content-free**, in a commit about two of the phases this report documents. `LC2`/`LC3`/`LC4`,
the named courts, survive; the water between them does not. `sea_serpent` encounters fell 5→3,
`deep_one` 3→2.

> `LJ1:{r:15,c:7}` was still sitting in `NODE_COORDS` at the birth commit with no node attached.
> The First Crossing's grid cell outlived the First Crossing by three hours.

This is the origin of the open row **§SIREN-01-FU**, and the origin is not the deletion commit.
It is this sentence, which pre-authorised it. ***A document's safety guarantees are its
least-copied claims, because the author verified what the system did and imagined what would
stop it.***

---

## 6. The classification rule, and why it is wrong in both directions

Everything in §3 and §5 keys off one regular expression: `/^J\d+$/`. Junction-ness is decided
by **the first character of the key**, never by the `junction:true` flag the data already
carried. The rule fails in both directions, four years' worth of consequence apart.

**Direction one — blind (2026).** At `66e26dd`, **77 scaffolding nodes had no `J` key** and were
therefore invisible to P_NUKE:

- **63 `ELB001`–`ELB063`** — machine-generated elbows minted under a different prefix, carrying
  the runaway concatenated labels the cascade produced: *"Junction near Junction near Junction
  near Izador's Desert Caravan ↔ …"*, and node text opening `▲ The … Road ▲ You stand at a
  crossroads on open road`.
- **13 hand-authored three-letter junctions** with real prose — `ANC` *Sky Gate Spur*,
  `TOS` *Arctic Overpass*, `MMX` *Western Wilds Crossroads* (*"A triple-forked oak at the…"*),
  `LJU` *Southern Road Cross* (*"Cracked stones at the crossing…"*), `SPU`, `TGD`, `AYT`,
  `SKG`, `LDE`, and `LJ0`–`LJ3`.

Had P_NUKE run as specified, it would have deleted ~20,000 nodes, reported success, and left
76 junctions standing — including every one with content on it.

**Direction two — live at HEAD.** `J13` is a **content node**: `name:"midlands"`, label
*The Western Sea Road*, act 4, two paragraphs of prose, placed at cell `19,174`, and the holder
of a `JUNCTION_VIGNETTES` entry — **The Cartographer**, rendered live whenever the player stands
there:

> *"I've been mapping these roads for twelve years. I still find new ones. That used to
> frighten me."*
> — and she tears off a corner of her coastline sheet and gives it to you.

She is the last junction in the game, promoted rather than deleted, and she is deletable.
`POST /api/graph/nuke-junctions {execute:true}` at HEAD prints
`[nuke] safety check PASSED — 0 J#### have quest/NPC refs` and removes her, because
`J13` carries `npc:null` in `NODE_MAP` and the endpoint builds its protection set from
`birkaNpcs[].node` — a registry `JUNCTION_VIGNETTES` is not in. **No gate objects:**
`check:invariants` I1 tests terrain totality (`midlands` resolves), I2 counts `junction:true`
(zero), I3 tests reachability (415 nodes are as reachable as 416). Nothing anywhere classifies
by key prefix except the thing that deletes.

> **§9 of this report specified the fix, and the promotion that actually happened skipped it.**
> The promotion procedure says: assign the node's coordinates, merge its links, **delete the
> junction entry**, and give the result its own terrain key rather than `"junction"`. `J13`
> obeys every field rule — terrain `midlands`, no `junction:true` — and violates the identity
> rule: it was promoted **in place**, keeping the J key. The one step that was skipped is the
> one the live endpoint's guard depends on.

Filed as **§DX-02bk** (endpoint) and **§AUDIT-03az** (re-code the node).

---

## 7. Spec → shipped

| § | Specified | Outcome | Evidence |
|---|---|---|---|
| §5 | **P_NUKE** nuclear cull, 6 phases | ✅ **SHIPPED `e2576f6`, live at HEAD** | `js/wbapi-server.js:6629–6882`; `api/wb.js:1416`; both cite this file by name |
| §5 | straight-stitch A↔J↔B on OPP4 match | ✅ faithful | `liveDirs.length === 2 && OPP4n[liveDirs[0]] === liveDirs[1]` |
| §5 | L-shaped pairs → deferred, rebuilt by A\* | ⚠️ **half shipped** | pairs are collected and deferred; nothing rebuilds them |
| §11 Step 1 | `GET /api/graph/junction-audit` | ✅ **SHIPPED, live at HEAD** | `a430748` |
| §6 | cell-primary coordinates, `buildCellMap` | ❌ **NOT SHIPPED** — 0 commits ever | |
| §7 | `astarGrid`, `buildAstarPath`, `P_ASTAR` | ❌ **NOT SHIPPED** — 0 commits ever | |
| §7 | `questCellCandidates`, `findNearestOnPath`, `bestEstimate` | ❌ **NOT SHIPPED** — 0 commits ever | |
| §8 | `maxQuestHop` long-hop re-queue, `P_PLACE` | ❌ **NOT SHIPPED** — 0 commits ever | |
| §13 | `./api.sh reweave --execute --nuke` | ❌ flag **never existed**; capability shipped as the separate verb `./api.sh nuke-junctions [--execute]` | |
| §13 | `--no-nuke`, `--no-highways` | ❌ 0 commits outside this document | |

**Checklist score: 2 of 10 steps shipped as written, 1 achieved by other means, 7 never
existed — and the two that shipped are the two that delete.**

Ten identifiers appear exactly once in the repository's entire history, in `09fa5b2`, the
commit that added this file. Yet both live call sites still promise they are coming:

> `// Phase 2  L-shaped deferred: … (dangling refs cleaned in Phase 3; A* reconnects them later)`
> — `js/wbapi-server.js:6636`
>
> `//   After running, deferred L-shaped pairs need A* reconnect (future step).`
> `//   See: lab-report-junction-reweave-overhaul.md §5`
> — `api/wb.js:1421`

**A shipped destructive phase, in production for fourteen months, whose in-source comment defers
its repair step to a phase that has never existed — and cites this document as the reason.**

**And the A\* would not have run as published.** §7's cost model assigns *"0 if cell is empty"*
and, two lines later, *"1 for all other empty cells (standard step cost)"* — two costs for one
condition. A uniform zero-cost step over open grid makes every candidate path tie at cost 0
and hands the search entirely to the heuristic. This is the composed half of the document, and
because §7 never shipped, nothing ever caught it.

---

## 8. The forecast (§12) — the most accurate table in the document

| Metric | Predicted | Actual | By what |
|---|---|---|---|
| Total nodes | ~600–800 | **688** | `6dea804` §CELL-05 ✅ inside range |
| Junction nodes | ~150–300 | **284** | same commit ✅ inside range |
| Named nodes | 443, unchanged | **76 named codes died** | ❌ (63 `ELB`, `LJ0`–`LJ3`, 9 others) |
| Quest chain validity | 100 % | **100 %** | ✅ 0 J-refs, then and now |
| Reweave runtime | fast | pipeline retired to HTTP 410 | §WALK-3 |

Both numeric predictions landed inside their stated ranges. **Neither P_NUKE nor A\* produced
them.** `6dea804` — *"§CELL-05: abolish junction nodes"* — did, three days later, by deleting the
concept rather than optimising it; `6a2a18c` (§CELL-05b) then purged 268 zombie stubs to 420/16,
and §WALK-1.5 replaced the whole edge graph with a terrain field. HEAD: **416 nodes, 0
`junction:true`, one surviving J key.**

**One arithmetic claim fails against the report's own bounds.** §12 explains the residual
junction count with *"1 cell = ~5 km at Europe scale … a Paris→Rome path needs ~30 intermediate
cells."* From §6's own grid (lat −8→68 across rows 8→500; lon −25→72 across cols 8→500) the
projection is **6.47 cells/° latitude and 5.07 cells/° longitude** — so one cell is ≈ **17 km**,
not 5, and Paris→Rome (≈1,100 km) is ≈ **65 cells**, not 30. Those two densities are the exact
figures §WALK-1.5's replacement comment later cites to condemn the projection as *"NOT
equal-degree"*: the numbers that retired the grid were derivable from this page all along.

---

## 9. Risk register outcome

The report filed one risk, in §3: *"The only risk is graph disconnection."* It was the wrong
one. Disconnection never occurred — `./api.sh reachability` at HEAD reports **416/416, 0
clusters**. The two failures both came from the classifier the report treated as too obvious to
state: three encounters lost in 2026 (§5), one NPC scene still exposed today (§6).

***The risk was named at the level of the graph. The damage happened at the level of the key.***

---

## 10. Why this mattered to play — restated

None of this is a feature. All of it defends the project's first invariant (`prompt.md` §6.1):
**the world is always freely traversable.** But traversable is not the same as worth traversing,
and that is the argument this report was actually making.

A junction is a room with no reason to be entered. Twenty thousand of them meant that walking
from Birka to Rome was dozens of keystrokes through unnamed stubs whose labels had degenerated
into *"Junction near Junction near Junction near Izador's Desert Caravan ↔ …"* — the map
narrating its own machinery at the player. Distance stopped meaning travel and started meaning
typing. The fix that eventually shipped (§CELL-05 → §WALK-1.5: walk the terrain field, let empty
land be walkable, keep nodes for places worth stopping at) is the same idea this report reached
first and stated best:

> *"wither can't thin a jungle when every tree is load-bearing."*

And the design's other insight, the one still worth carrying: ***let the quests decide which
roads exist.*** P7's snail walks every desire path; whatever it never touches is scaffolding.

**The durable lesson is the one the document got wrong.** Routing is not content — but *content
must never be inferred from a key prefix*. Naming is not classification. Three characters at the
front of a key cost this game the Littoral Sea's combat layer in 2026, and they are currently
pointed at a cartographer who has spent twelve years mapping roads that keep changing.

---

## 11. Defects filed

- **§DX-02bk** 🟠 — `POST /api/graph/nuke-junctions` is live at HEAD and classifies by key
  prefix. Against HEAD's data it selects exactly one node, `J13`, passes its own safety check,
  and deletes a content node with a live NPC vignette. Persistence is via `saveStamped()`
  (§DX-02k), so the call writes a gitignored dated sibling and leaves `roll2hit-v3.html`
  untouched — but the **running server's in-memory model is mutated**, and the next endpoint
  that calls `saveGameFile()` commits the loss to the real file. Silent by construction: git
  stays clean until an unrelated save lands it.
- **§AUDIT-03az** 🟡 — re-code `J13` to a non-`J` key, completing the §9 promotion its content
  fields already followed. Closes §AUDIT-03ax's classification split and defuses §DX-02bk at
  the data rather than the endpoint. Needs the §EPIC-01 grep first — `J13` is referenced by
  `NODE_MAP`, `NODE_COORDS` and `JUNCTION_VIGNETTES`.
- **§SIREN-01-FU** (open, 🟠) — this report is its **origin document**; §5 above records the
  mechanism and the exact deletion commit.
- **§DX-02bg / §AUDIT-03ax** (open) — `./api.sh reweave` and `./api.sh junction-audit`, the two
  survivors of this pipeline, filed by the sibling increments.

---

## See Also

- `lab-report-mega-reweave.md` — the pipeline this one proposes to replace (§DOC-02au); shares
  the 100× derelict-cap error
- `lab-report-node-network-reconnection.md` — the cascade this one diagnoses, measured
  from inside it (§DOC-02at)
- `lab-report-map-audit-layout-tooling.md` §11 — the third tabulation of the same pipeline
  (§DOC-02av)
- `lab-report-cell-map-mud-redesign.md` — §CELL-05, which delivered §12's forecast by a
  different route
- `js/wbapi-server.js:6629` · `api/wb.js:1416` — P_NUKE as shipped, both citing this file
