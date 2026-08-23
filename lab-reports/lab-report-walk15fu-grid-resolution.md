<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson and Claude -->
# Lab Report — §WALK-1.5-FU(c): Grid Resolution for Dense Regions

**Track:** §WALK-1.5-FU item (c) · a decision memo, not an implementation spec
**Written:** 2026-06-26 15:58 · **Decision:** Option A — **0.25° rejected**, de-pile at 1° instead
**Shipped:** `ebf88c8`, 2026-06-26 16:44 — **46 minutes later**
**Re-verified against HEAD:** 2026-08-14 (§DOC-02bn)
**Parent:** `lab-reports/lab-report-terrain-field-mover-redesign.md` (the §WALK coordinate system this refuses to change)

---

## Abstract

§WALK-1.5 projected every node onto a 1° equirectangular grid. The projection merged co-located places
into shared cells, and the user's first instinct — issued as a direction, not a question — was to
re-project dense regions at 0.25° so they would separate. This report tests that instinct against the data
and **reverses it**: the piles are not rounding collisions, they are *anchor-chaining* artifacts, and a
finer grid cannot separate coordinates that are identical. A quarter-degree world would cost 16× the cells
and ~4× the steps and encounter rolls, and would still need the same content redistribution afterward.

Re-measured at HEAD ten weeks later: **every quantitative claim in this report replays exactly** — the
409/215/66/260 census, the 17/21/28 separation table, `GEO2` = 155, the 345/64 coordinate split, and four
of the five pile rows byte-for-byte. The conclusion is still true today: re-binning HEAD's 66 shared cells
at 0.25° leaves **28 of them completely unchanged**. One number is wrong by one, and **one sentence is
wrong in a way that mattered** — §4's claim that the surviving clusters were "already handled cost-free by
the locale-list sub-location picker." No such picker existed on the day this was written, and none has
existed since. That sentence cleared the co-location problem for review, and it is now tracked as
**§AUDIT-03x**: 172 of 416 nodes cannot be arrived at.

---

## 1. Method

Every figure replayed against the report's own reference tree (instrument 8 — HEAD cannot adjudicate a
claim about 2026-06-26), reconstructing the projection from `GEO2` + `config/walk-geo-gazetteer.json` with
the server's own resolution order and cycle-safe anchor chaining; `git log -S <symbol> --all` with **no
pathspec** on every symbol the report leans on, to separate RETIRED from NEVER-SHIPPED (instruments 4/67);
and a fresh 0.25° re-bin of HEAD's cells, to ask whether the recommendation still holds rather than merely
whether it was followed.

> **The reference tree is the WORKING tree, and that is why the first replay failed.** Against commit
> `782e4d3` the census reads **409 nodes / 211 cells / 67 shared / 265 piled** — four figures, none
> matching. The report is not wrong: item **(a)** had already been applied through `PUT /api/coords` and
> was still uncommitted at 15:58, landing in `ebf88c8` at 16:44. Re-apply (a) — HKG/BKK/CTU/SJO off
> Samarkand's cell `30,246` — and all four figures resolve **exactly**: 215 cells, 66 shared, 260 piled.
> The gazetteer half of (a) confirms it independently: moving those four from `offEarth` to `anchors`
> **with explicit lat/lon** turns a measured 341/68 own-versus-chained split into the report's **345/64**.
> *A report written mid-increment cites a tree no commit contains; reconcile it by replaying the
> increment's own uncommitted mutations before calling a figure wrong.*

---

## 2. Intent — why grid resolution is a playability question

Nothing here is cartography for its own sake. The grid is the unit of walking, so its resolution sets
three things a player feels directly:

- **How long the world takes to cross.** Movement is one cell N/E/S/W
  (`` `js/mover.js:function moverMove(world, pos, dir)@44` ``) and timeless (§TIMELESS-01). Quartering the
  cell quadruples the keypresses between any two places without adding a single new place to visit.
- **How dangerous the road is.** Each step on an unnamed cell rolls against the terrain's base rate
  (`` `function _enterEmptyCell(r, c)@28420` ``, `` `midlands:0.15@9893` ``). Four times the steps is four
  times the encounters over the same journey — a combat-density change disguised as a coordinate change.
- **Whether two real places feel like two places.** This is the honest half of the ask. London and its
  four neighbours genuinely occupy distinct ground; the 1° grid says otherwise.

The report's contribution is to separate the third want from the first two costs, and then to show that
the third want is mostly not about resolution at all.

---

## 3. The premise, restated precisely

> *"Co-located nodes pile onto shared 1° cells; a finer 0.25° grid would separate them."*

True only for nodes whose **true coordinates differ by <1° but ≥0.25°** — real places that binning merged.
False for the far larger group that co-locates because it inherits *one anchor's exact lat/lon*: satellite
and off-Earth nodes chained to a parent, and interiors stamped with their frame city's coordinates.
**Finer bins cannot separate identical coordinates.** The whole result follows from that one sentence.

---

## 4. Measured reality — 2026-06-26 (replayed exact) and at HEAD

| Census | At the report's tree | At HEAD (2026-08-14) |
|---|---|---|
| Nodes | **409** ✅ | 416 |
| Cells occupied | **215** ✅ | 244 |
| Shared cells (≥2 nodes) | **66** ✅ | 66 |
| Nodes in shared cells | **260** ✅ | 238 |
| Own lat/lon · anchor-chained | **345 · 64** ✅ | 345 · 64 (+7 now unresolvable — §9) |
| `GEO2` anchor table | **155** ✅ | 155 |

Re-binning every node's *true* lat/lon at 0.25°:

| Outcome at 0.25° | Report | Replayed | At HEAD |
|---|---|---|---|
| **Fully** separated | 17 | **17** ✅ | 18 |
| Partially separated | 21 | **21** ✅ | 20 |
| **Unchanged** (one bin, or no own coords) | 28 | **28** ✅ | **28** |

The big piles barely move, because they are anchor-chaining artifacts:

| Cell | Nodes | Distinct 0.25° bins | Still piled | Verdict |
|---|---|---|---|---|
| `19,191` Weimar | 21 | 2 | 21 | ✅ exact |
| `32,203` Atlantis | 17 | 1 | 16 → **17** | ⚠ off by one — 17 nodes in 1 bin is 17 piled |
| `18,177` | 13 | 3 | 12 | ✅ exact |
| `26,191` Florence | 13 | 2 | 12 | ✅ exact |
| `25,206` hag arc | 12 | 2 | 11 | ✅ exact |

**Fourteen of fifteen numeric cells replay byte-exact; the fifteenth contradicts its own row.** The
adjacent *cause* column is looser than the numbers beside it: "16 offEarth chain to `ATH`" is 15 off-Earth
plus 1 satellite; "9 coordless satellites → `FLR`" is 9 satellites, of which 6 chain to `FLR` and 3 to
`PRA`; "6 offEarth → `SDQ`" is 6 off-Earth, of which 5 reach `SDQ`. Direction right, arithmetic loose —
and the split runs *inside the table*, between the columns a script produced and the column a hand wrote
beside them.

---

## 5. Cost of going 0.25° (verified at HEAD)

- Content bbox **72 rows × 96 cols = 6,912 cells** at 1° → **288 × 384 = 110,592 at 0.25° (16×)**. Both
  figures still exact: HEAD's nodes span rows 2–73, cols 154–249.
- **~4× the steps** along each axis, and therefore ~4× the per-step encounter rolls unless every rate in
  `` `midlands:0.15@9893` `` is rescaled.
- Touches the whole locked coordinate system: the geo-seed projection
  (`` `js/wbapi-server.js:row(lat) = clamp(floor(LAT_N - lat), 0, ROWS-1)@7804` ``), the grid constants
  (`` `const GEO_PROJ = { ROWS: 90, COLS: 360 }@9902` ``), `` `const CELL_GRID = (() => {@9852` `` and its
  read sites, and a regeneration of `` `const SEA_RUNS = {0:@9867` `` (4,790 sea cells in 286 runs) plus a
  re-carve of all 59 `` `const SEA_LANES = new Set(@9870` `` — which at 4× width would pinch to sub-cell.

> **The cost has since gone up, not down.** §NAV-01b later laid `` `const ROAD_CELLS = (() => {@9884` `` —
> **410 road cells and 89 junctions across all 244 settlement cells** — which would also need a full
> re-lay. Every week Option A holds, Option B gets more expensive.

---

## 6. The lever for each pile type

- **Anchor-chained piles — the big ones, most of the 260.** Resolution does nothing. The fix is **distinct
  coordinates**: items (a) [done] and (b) Weimar redistribution. Content moves, correct at any resolution.
- **Genuine sub-degree clusters (~17 cells, mostly 2–5 European cities).** 0.25° separates these honestly
  (≤28 km error). A 1° nudge to an adjacent free cell separates them too, but misplaces them by ~110 km.

---

## 7. Options and recommendation

| | Option | Verdict |
|---|---|---|
| **A** | **Keep 1°, de-pile by redistribution** (a + b) | **Recommended — and taken.** No map blow-up, no step/encounter inflation, no sea-mask regen, no spec amendment. |
| B | Global 0.25° | 16× cells, ~4× steps, full lane re-carve — **and still requires (a)/(b)**, because it does nothing for anchor-chained piles. High cost, narrow benefit. |
| C | Hybrid 0.25° in dense regions only | A non-uniform grid breaks the kernel's fixed-step assumption (`moverMove(world, pos, dir)`). A large complication fighting the §WALK design. |

**Reframe (c).** The piles the user wants gone are not a resolution problem: 0.25° leaves the 21-node
Weimar and 17-node Atlantis piles intact while quadrupling traversal cost. Treat "de-pile dense regions"
as covered by (a) + (b), and surface this before doing (b), since it removes the (b)-blocked-on-(c)
dependency.

---

## 8. Decision-register outcomes

| Call made 2026-06-26 | Outcome at HEAD |
|---|---|
| 0.25° will not fix the anchor-chained piles | **Correct, and still correct.** Re-binning HEAD's 66 shared cells leaves **28 unchanged** and only 18 fully separated. |
| Redistribution is the right lever | **Correct and adopted 46 minutes later.** `ebf88c8` moved 19 of the 21 Weimar nodes to source-text homes; cell `19,191` holds **2** today. |
| The other four piles need content moves, not resolution | **Correct, and still open.** `32,203` (17), `18,177` (13), `26,191` (13), `25,206` (12) are **byte-identical ten weeks on.** |
| The 1° grid should not change | **Held.** `GEO_PROJ` is still `{ROWS:90, COLS:360}`; no 0.25° work was ever begun. |
| A 1° nudge misplaces by ~110 km; 0.25° errs ≤28 km | **Correct** — 1° of latitude is 111 km, 0.25° is 27.8 km. |
| Option C breaks the mover's fixed-step assumption | **Correct** — `moverMove(world, pos, dir)` still takes one delta from a single `__MOVER_DELTAS` table. |
| ~17 genuine clusters are "already handled by the locale-list sub-location picker" | **❌ FALSE, and false when written.** §9. |

**Six of seven correct.** The failure is not an estimate — it is an assumption about a surface.

---

## 9. The one claim that failed — and it is the origin of §AUDIT-03x

> **⚠ Annotated 2026-08-14 (§DOC-02bn). NOT SHIPPED — never existed.**
>
> §6 dismissed the ~17 genuine European clusters as *"already handled cost-free by the locale-list
> sub-location picker."* **There is no picker.** `git log -S "sub-location picker" --all` returns exactly
> **one commit — `ebf88c8`, the commit that added this file.** The phrase appears nowhere in any engine,
> at any point in the repository's history. `destCodes[1]` has never been read by anything, ever.
>
> The locale list is real: `` `const CELL_GRID = (() => {@9852` `` maps `"r,c"` to an **array**, and its
> own comment states the contract — *"`primaryOf = list[0]` is the node you arrive at, the rest are
> intra-cell sub-locations"* (`` `primaryOf = list[0]@9850` ``). But the single-player client reads only
> the head of that array: `` `const destCode = res.destCodes[0]@28355` ``, on this report's own tree as
> well as at HEAD. `` `const cellCodes  = (key) => CELL_GRID[key]@9862` `` — the full list — had exactly
> **one** consumer on 2026-06-26, the mover kernel that computes `destCodes` and hands back a list nobody
> unpacks. Its first real reader, the MUD room describer, shipped **five days later** (§NAV-01c,
> `3568fcc`), and it describes rooms on the server; it does not let a browser player stand anywhere new.
>
> **So the clusters were not handled cost-free. They were not handled at all.** The four other London
> nodes (`LON`, `BRK`, `LDN`, `AST`) sit behind `LGW`; three Pisa nodes behind `PSA`; seven English
> midlands nodes behind `YRK`; `BK` behind the *starting node* `LHR`. After (b) executed this report's own
> recommendation, even Weimar came out non-primary — `WM` now sits behind `ERF`, carrying 312 quests.
>
> Eleven days later §MATH-01 hit the consequence head-on and named it in a commit message: `EHZ`/`ZERO`/
> `MONS`/`CNTR` *"were unreachable sub-locations of `JRS`'s cell, so `math_02`/`_05` could never
> activate"* — fixed by moving four nodes to their own cells, which is Option A applied one arc at a time.
> Measured at HEAD: **416 nodes occupy 244 cells, so 172 are non-primary**, and 774 quests activate on
> nodes a player cannot reach. Tracked as **§AUDIT-03x** (🟡, design call), with `check:cellprimacy`
> proposed as its gate in **§DX-02w**.
>
> *This is the review that had the co-location problem in its hands and cleared it in half a sentence.*
> Everything measured here was measured; the one clause nobody measured is the one that cost two months.
> **Grep for the code that reveals a surface — never for the surface's own name, and never for a name you
> supplied yourself.**

---

## 10. Defects found → BACKLOG

- **§AUDIT-03x — extended, not re-filed.** This report is its **origin document**: the 2026-06-26 review
  that considered 66 shared cells and dismissed the reachability question by citing a picker that did not
  exist. The cluster examples §6 named are still stranded at HEAD — `LGW` holds `LON`/`BRK`/`LDN`/`AST`,
  `PSA` holds `PIS`/`PISNOT`/`PISGAT`, `YRK` holds seven. Added to the row as the fix's earliest
  provenance.
- **§DX-02cb 🟢 NEW — the geo gazetteer has drifted 7 nodes behind `NODE_MAP`, and geo-seed says so only
  in a field nobody reads.** `DNF`, `TGS`, `SPB`, `KMS`, `ZVD`, `FBR`, `TVR` (§CELL-14-FU and the §KG
  Russia corridor) have live `NODE_COORDS` but **no resolvable lat/lon in any source** — not `GEO2`, not
  `realPlaces`, not `anchors`, and no chain. `` `js/wbapi-server.js:if (!ll) { skipped.push(code)@7909` ``
  drops each into a `skipped` array returned in the dry-run JSON; nothing fails, warns or counts. Because
  the apply path merges rather than clears, those seven keep their coordinates — so the world is fine and
  the *derivation* is not: **the projection can no longer be re-derived for 409 of 416 nodes and no gate
  says which seven are missing.** Adjacent to §DX-02bo, which asks whether geo-seeding should be repaired
  or retired; if repaired, gazetteer coverage is the acceptance test.

---

## 11. Ship record

| Commit | Time | What |
|---|---|---|
| — | 15:58 | This report. (a) already applied in the working tree, uncommitted. |
| `ebf88c8` | **16:44** | §WALK-1.5-FU (a) + (b) — 4 realms de-piled off Samarkand; 21-node Weimar pile redistributed to source-text homes at 1°; gazetteer rewritten; two mislabels corrected (`GLD` is a Goose-Girl court, not Florence; `CNTR` is §MATH-01, not a Weimar interior). 23 coordinate moves, reachability 409/409, `check:walk` green, diff coords-only. |

**46 minutes from analysis to shipped reversal** — and the analysis reversed a direction the user had
already given. (d) followed the same day: browser navigation **14/14**, including a new positive sea-lane
walkability test.

---

## 12. Notes for the next reader

- **A finer grid cannot separate identical coordinates.** The one-line form of this whole report.
- **Anchor chaining is a content decision wearing a coordinate's clothes.** A node inherits its parent's
  lat/lon because nobody decided where it *is*. That is authoring work, and no projection substitutes.
- **Every week Option A holds, Option B gets dearer.** The 2026-06 estimate omitted a road net that did
  not exist yet.
- **A locale list is a data structure, not a feature.** `CELL_GRID` gained its array shape in one commit
  and its second consumer five days later; the browser has never had a third. Shipping the container is
  not shipping the door.

---

*§DOC-02bn re-verification, 2026-08-14. HISTORY document — deltas are annotated, never deleted.*
