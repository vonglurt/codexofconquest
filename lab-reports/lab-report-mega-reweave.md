<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson and Claude -->

# Lab Report: MegaReWeave — Procedure & Configuration Guide

### Applied World Architecture — Automated Graph Construction Pipeline

**Project:** roll2hit-v3.html — *The Shattered Codex*
**Command:** `./api.sh reweave --execute` · **Endpoint:** `POST /api/graph/reweave-all` (streaming, no timeout)
**Date:** 2026-06-09 · **Author:** Roll2Hit Engineering
**Verification pass:** §DOC-02au, 2026-08-13 — re-measured against live `roll2hit-v3.html` and against
the birth commit `1bfe7a6` (2026-06-09 17:36), ~2 h after this file's mtime.

> **Status: RETIRED as a procedure, and its safety table was never true.** The ~3,200-line pipeline
> was deleted by §WALK-3 Inc 3; the endpoint returns **HTTP 410**. Every *behavioural* description
> below held at the birth commit. Every *numeric bound* in §IV did not — six of the seven limits are
> understated by four orders of magnitude. Claims are marked **HELD / RETIRED / WRONG-WHEN-WRITTEN**
> and kept, never deleted.

---

## Abstract

MegaReWeave was a single server-side loop that built and repaired the entire world node network in one
streaming pass, running nine phases from geographic seeding through junction pruning. This guide
documented how to run it, how to extend its two configuration tables, and what bounded each loop.

Re-measurement finds the *description* accurate and the *guarantees* fictional. The phase behaviours,
the algorithms, and both configuration-table file locations verify exactly. The "Loop limits reference"
table — closing with the sentence **"All limits prevent runaway"** — understates every genuine bound by
**10,000×** (`--max-rip` documented 5, actual **50000**; `--limit` documented 100, actual **1000000**;
`--radius` documented 6, actual **60000**), names two constants that have **never existed in any `.js`
or `.sh` file in the repository's history**, and misstates a third by 100×.

The consequence is on record. The sibling report `lab-report-node-network-reconnection.md` (§DOC-02at)
measured this pipeline taking the map from 1,684 to **4,429 nodes in seven hours**, with two
out-of-memory fixes in the commit log — while the content-node count never moved from 384.

> ***The caps were effectively infinite. The document published caps of five.***

---

## I. Intent and Inspiration

The premise was automation over attrition. Repairing a world graph by hand — aligning one edge,
relocating one stray, deleting one dead-end at a time — does not scale past a few hundred nodes. So the
seven separate repair verbs were fused into **one loop that runs to convergence**, streaming a line per
operation so the author could watch it think.

The inspiration is visible in the vocabulary: phases named **Wither** and **Derelict**, a pathfinder
called the **snail** that walks every quest's desire path and marks the junctions it actually touches.
The idea is genuinely elegant — *let the quests decide which roads exist.* A junction no quest ever
walks through is scaffolding, and scaffolding should come down.

**Why it mattered to play.** Every node in this game is a place the player can stand: a city, a shrine,
a tavern with a name. The pipeline's job was to guarantee that all of them were **walkable from
Birka**, and to do it without leaving the map littered with empty routing stubs the player would
stumble into. Phase 7's bridge check is the load-bearing promise — *prune aggressively, but never
disconnect a named node.* That promise was kept. What failed was everything meant to stop the loop
before it exhausted the machine.

---

## II. The Pipeline — HELD

The opening sentence says **"seven phases"** and the table lists **nine** (P0–P8). The table is correct.

| Phase | Name | What happens |
|---|---|---|
| P0 | Geo-seed | Locks GEO2 cities to Mercator lat/lon grid coordinates. Run before building highways. |
| P1 | Rip-and-connect | Relocates stray (unreachable) nodes near their quest cities; stops when strays = 0. |
| P2 | Priority highways | Builds L-shaped junction chains between named city pairs, in order. |
| P3 | City mesh MST | Greedy MST: connects every GEO2 city to the reachable mesh, nearest-first. |
| P4 | Fix-all-broken | Repairs diagonal and gap edges; stops when broken count plateaus for 2 passes. |
| P5 | Fix-bidirectional | One pass: clears diagonal exits, wires one-way `A→B` links back to `B→A`. |
| P6 | Derelict cleanup | Deletes junctions with no quests/NPCs and degree ≤ 1. Loops until none remain. |
| P7 | Wither | Snail-traverses every quest path; prunes junctions on no desire path and not structural bridges. |
| P8 | Final check | Reports reachability %, broken count, unreachable count. Declares MAP IS STABLE at 100 % / 0. |

**Wither (P7) — algorithm HELD in full.** Collect every `activateNode`/`waypointNode`; BFS from the hub
to each; increment a traversal count on every junction walked; any junction at count 0 is a candidate;
**bridge-check** each candidate by removing it and re-running BFS, keeping it if any *named* node
becomes unreachable; delete the safe remainder; repeat until stable. All five steps verify against
`srv.js` at the birth commit, including the guarantee that matters — named nodes stay reachable.

**Derelict (P6) — definition HELD.** `junction:true`, unreferenced by any quest, no NPC, degree ≤ 1;
cascading across passes as each deletion exposes new dead ends; degree-2+ derelicts deliberately spared
for manual review via `./api.sh audit --map` (**still a live command at HEAD**).

---

## III. Configuration Surfaces — both file pointers HELD

**`GEO2`** — *"edit the table in `wbapi-server.js` inside the `reweave-all` handler."* Correct at the
birth commit (21 hits). **Still live at HEAD** — but the `reweave-all` body was deleted, and `GEO2` now
sits in the **geo-seed** handler, so the search instruction is stale while the table works. It is no
longer the only source: `./api.sh geo-seed` now resolves lat/lon by priority **GEO2 → gazetteer
`realPlaces` → gazetteer `anchors`**, with satellites chaining to their parent.

**`PRIORITY_HIGHWAYS`** — *"edit the array in `api/wb.js`."* Correct (3 hits, CLI-side). But **only 2 of
the 4 entries shown are in the code**:

| Report's entry | At `1bfe7a6` | |
|---|---|---|
| `CVP → SAM` *"Iberia to Central Asia"* | ✅ present — *"Southern silk road: Lisbon → Samarkand"* | ✓ |
| `HHL → GEDI` *"Iceland to Horn of Africa"* | ✅ present — *"Iceland → Horn of Africa **(if GEDI exists)**"* | ✓ |
| `MLN → TRB` *"Mombasa to Black Sea coast"* | ❌ not present (code has `HHL→MLN` and `LHR→TRB`) | ✗ |
| `HEO → TUNPAR` *"Denmark to unknown"* | ❌ not present (code has `NID→TUN`) | ✗ |

Two details are worth preserving. First, **`GEDI` did not exist** — 0 `NODE_MAP` entries at the birth
commit and none at HEAD — so the shipped array contained a highway to nowhere, and the engineer wrote
the doubt into the note rather than resolving it. The report copied the entry and dropped the doubt.

Second, **`TUNPAR` is a chimera.** It is not a node and never was; `TUN` (Tunis) and `PAR` (Paris) are
both live. The reconstruction fused two real codes into one imaginary one — and then annotated its own
destination:

> *"Denmark to unknown."*

**Node codes elsewhere fare well: 9 of 11 resolve at HEAD, and 9 of 10 geographic glosses are correct**
(`CVP`→Lisbon ✓, `SAM`→Samarkand ✓, `TRB`→Trebizond ✓, `HHL`→Herdholt, Iceland ✓, `HEO`→Lejre,
Denmark ✓, `ROM` ✓, `CON` ✓, `FRK`→Paris ✓; only `MLN` is off — it is **Malindi**, not Mombasa, ~120 km
along the same coast). This is a sharp contrast with the same author's same-day sibling, where 7 of 8
glosses were wrong. The difference is exactly instrument 9's predictor: **here the geography was copied
out of a config table; there it was reconstructed from a batch log.**

---

## IV. Loop Limits — **WRONG WHEN WRITTEN, and the finding of this pass**

The table below closed with *"All limits prevent runaway."* Measured against the CLI body at the
report's own birth commit (`api/wb.js`, the values actually sent to the server on every invocation):

| Parameter | Report | **Actual at `1bfe7a6`** | Error |
|---|---|---|---|
| `--max-rip` | 5 | **50000** | **10,000×** |
| `--max-fix` | 5 | **50000** | **10,000×** |
| `--limit` | 100 | **1000000** | **10,000×** |
| `--radius` | 6 | **60000** (`meshRadius`) | **10,000×** |
| `--step` | 4 | **4** | ✅ exact |
| `MAX_MESH` | city count **+10** | `geoCities.length` **+1000** | 100× |
| `MAX_CLEANUP` | 20 | **2000**, and the name has **0 commits in any `.js`/`.sh` file, ever** | 100× + fictional |
| `MAX_WITHER` | 20 | **20**, but the name has **0 commits in any `.js`/`.sh` file, ever** | name fictional |

The P6 loop is literally `for (let dp = 1; dp <= 2000; dp++)` and P7 is `for (let wp = 1; wp <= 20; wp++)`
— **hardcoded literals**, not named constants. An author who greps `MAX_WITHER` to tune the pipeline
finds nothing; the only appearance of that identifier in the repository's entire history is this
document. Its single commit, `09fa5b2`, is a docs sweep.

**Two structural observations, not scolding.**

1. **The one row that is exact is the one that is not a limit.** `--step` (junction spacing) is a
   *shape* parameter the author typed on a command line. Every row that bounds a *loop* is wrong.
2. **The errors are uniform and one-directional.** Four rows off by exactly 10,000×, two by exactly
   100×, all in the direction that makes the pipeline look safer. This is not arithmetic drift; it
   reads as the caps having been widened during the session — to let the loops run to completion —
   while the guide kept publishing the pre-widening numbers.

> **Instrument (§DOC-02, 40th): a document's SAFETY GUARANTEES are its least-copied and most-assumed
> claims, because the author verified what the system DID and imagined what would stop it.** Here the
> behavioural half — nine phases, five wither steps, four derelict conditions, two file pointers — is
> essentially perfect, and the bounding half is wrong in seven rows out of eight. Audit the numbers
> that promise *safety* before the numbers that describe *function*.

---

## V. Status at HEAD

| Surface | State |
|---|---|
| `POST /api/graph/reweave-all` | **HTTP 410** — *"junction nodes were removed"* (§CELL-06; ~3,200-line body deleted §WALK-3 Inc 3) |
| `junction:true` | **0** in `NODE_MAP` (was 4,045 at the cascade peak) |
| `PRIORITY_HIGHWAYS`, `MAX_MESH`, all six `--` flags | **0 occurrences** anywhere — RETIRED |
| `GEO2` | **live**, moved to the geo-seed handler; now first in a three-tier gazetteer |
| `./api.sh audit --map` | **live** |
| `./api.sh reweave` | **live — and it is a different command** (see below) |

### The name collision — `reweave` still runs, and does something else

`./api.sh reweave` at HEAD regenerates `ROAD_RUNS` from `roads-pins.json` (§NAV-01h): it issues
`PUT /api/roads`, which shells out to **`scripts/build-roads.js --apply`**. It is the §DOC-02c
retired-vocabulary hazard in its most expensive form — not a dead doc reference that errors out, but a
**live command that succeeds and writes**.

The guide's own §Running it says:

```bash
# Dry-run (reports only, no writes)
./api.sh reweave
```

**That exact string is now an unconditional write to the game file.** The HEAD implementation takes
`flags` and never reads them, so `--execute` is accepted and ignored — the dry-run/execute distinction
this guide is built around is silently gone. Filed as **§DX-02bg**.

---

## VI. The Grid Projection — SUPERSEDED, and the engine says why

The documented formula — `r = gridMin + (maxLat - lat) / range * gridSize`, bounds lat −8→68,
lon −25→72, grid 8→500 — was replaced by §WALK-1.5 with an equirectangular 1°-per-cell projection:

```
row(lat) = clamp(floor(LAT_N - lat), 0, ROWS-1)     // N→S, clamped, no wrap
col(lon) = mod(floor(lon + 180), COLS)              // wraps E↔W
                                    // defaults latN=70, latS=-20, rows=90, cols=360
```

The replacing comment states the defect in the original: *"Replaces the old linear 8–500 box-fit (which
was NOT equal-degree: **6.47 cells/° lat vs 5.07 cells/° lon**)."* The report's own projection stretched
the world ~28 % in one axis.

**The old bounds did not all retire.** `tools/worldmap.js:224–227` still carries
`minLat:-8, maxLat:68, minLon:-25, maxLon:72` and buckets the region overview with them, while nodes are
now *placed* on the 90×360 full-globe grid. Measured at HEAD: of the 155 cities in worldmap's `GEO`
table, exactly one falls outside that box — **`PDL`, Ponta Delgada, lat 37.7 lon −25.7**, missing the
western edge by **0.7°**. `citiesInRegion` filters on strict bounds with no clamp, so Ponta Delgada
appears in **zero** regions; confirmed by running `./api.sh worldmap --regions` at HEAD (0 occurrences
across 19 populated cells). Filed as **§DX-02bh**.

There is a pleasing symmetry here. The sibling report's one surviving contribution was a fix that made
`worldmap --regions` render at all, turning `NaN×NaN` into `6×6`. Two months later the same overview is
quietly dropping a city. ***`NaN×NaN` fails loudly; `6×6` fails silently — making a broken surface
render is not evidence that it renders everything.***

---

## VII. Defects Filed

| Row | Severity | Premise |
|---|---|---|
| **§DX-02bg** | 🟡 small design call | `./api.sh reweave` is a live, writing command sharing its name with a retired nine-phase pipeline. The guide documents the bare invocation as *"Dry-run (reports only, no writes)"*; at HEAD it runs `build-roads.js --apply` unconditionally. `flags` is destructured and never read, so `--execute` is accepted and ignored. |
| **§DX-02bh** | 🟢 no design call | `tools/worldmap.js`'s `MAP` bounds are a fossil of the retired 8–500 box-fit projection. `PDL` (Ponta Delgada, lon −25.7) is 1 of 155 `GEO` cities outside `minLon:-25` and is silently dropped from every region of `worldmap --regions`. |

---

## VIII. Conclusion

MegaReWeave is the best-described dead subsystem in this corpus. Its nine phases, its snail, its bridge
check and both of its configuration tables verify against the code that ran them — a genuinely
well-observed piece of engineering writing.

It is also the corpus's clearest case of a document being accurate about *what a system does* and wrong
about *what holds it back*. The loop caps published here were four orders of magnitude tighter than the
ones in the file, two of the three named constants have never existed, and the table carrying them ends
with the words **"All limits prevent runaway."** Seven hours after this was written, the map had 4,429
nodes and the tooling was out of heap.

The phases were right. The brakes were prose.

---

*Original guide generated 2026-06-09. Verified and rewritten 2026-08-13 (§DOC-02au) against HEAD and the
birth commit `1bfe7a6`. Cross-reference: `lab-report-node-network-reconnection.md` (§DOC-02at) measures
this pipeline's output; `docs/notes/docs-node-network.md` and `docs/api/API-README.md §Validation` both
remain live. Legacy node codes throughout are history and are annotated, never rewritten
(§AUDIT-03n / `scripts/legacy-codes.js` HISTORY class).*
