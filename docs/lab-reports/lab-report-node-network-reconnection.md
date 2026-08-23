<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->

# Lab Report: Full Node Network Reconnection — Stray Relocation & Reachability Recovery

### Applied World Architecture — Graph Repair & Structural Integrity

**Project:** play.html — *The Shattered Codex*
**Layer:** Infrastructure — Node Mesh Repair Pass
**Date:** 2026-06-09 · **Author:** CodexOfConquest Engineering
**Verification pass:** §DOC-02at, 2026-08-13 — re-measured against live `play.html` and against the
birth commit `661aa29` (2026-06-09 11:48, one minute after this file's mtime).

> **Status: RETIRED, not wrong.** Every number in the original held at its own commit. The
> *architecture* it repaired — per-node `N`/`S`/`E`/`W` link fields and `J####` elbow junctions — was
> deleted wholesale by §CELL-01/§WALK-1 between 2026-06-16 and 2026-06-25. This edition keeps the
> original claims, marks each **HELD / RETIRED / WRONG-WHEN-WRITTEN**, and adds the one finding the
> original could not make about itself.

---

## Abstract

The world's node connectivity graph had degraded to 89 % reachability (694 of 781 nodes reachable from
the hub city Birka/`LHR`). Three repair tools were applied in sequence — `fix-all-broken`,
a bidirectional batch fix, and `rip-and-connect` — reaching **100 % reachability**. A fourth,
incidental fix repaired a `NaN×NaN` defect in `worldmap --regions`.

Re-measurement confirms the headline outcome and reverses the report's reading of its own cost. The
pass grew the map 781 → 1,684 nodes; a successor pass grew it to **4,429** within seven hours. Across
that entire cascade the number of nodes carrying quests, NPCs or monsters **never moved from 384**.
The report records this as reassurance ("All 383 content nodes are reachable"). It is the diagnosis:
by 2026-06-09 18:17 the map was **91 % scaffolding**.

**Why the work mattered to play.** Reachability is not a graph statistic — it is the difference between a
city that exists and a city a player can walk to. Eighty-seven nodes, including real historical cities and
quest locations, were *dark*: present in the database, listed in the docs, and unreachable by any in-game
route. The invariant this pass defends is the project's first (`prompt.md` §6.1): **the world is always
freely traversable.** That invariant survives today. Only the machinery does not.

---

## I. Intent and Inspiration

The design premise is that a player should never meet an invisible wall. The engine refuses a step for
exactly two reasons — off-grid, or sea. Nothing else: no quest, flag, item or mission bit may refuse
movement. A node the player cannot reach is therefore not a locked door but a **bug**, and 87 of them
were live.

The inspiration for the repair was cartographic rather than algorithmic: treat the map as a mesh to be
*tightened* rather than a database to be edited. Hence the three tools, each named for a physical
gesture — align the broken, close the one-way, rip the stray loose and re-seat it near its neighbours.

The lesson of this verification is that the gesture was the problem. A mesh you tighten by **adding
material** has no natural stopping point.

---

## II. Pre-Repair State — HELD

| Metric | Value |
|---|---|
| Total nodes | 781 |
| Reachable from `LHR` | 694 (89 %) |
| Isolated clusters | 87 |
| Broken edges | 497 (diagonal_and_gap 303 · gap_too_large 102 · diagonal 92) |

A **broken edge** was a directional link `A → B` whose target was diagonal to the source (movement was
strictly N/S/E/W) or more than 4 grid cells away. Both severed navigation: the player stood at A, moved
North, and the engine found no valid adjacent cell.

---

## III. Repair Passes — HELD, with the convergence claim REVERSED

### Pass results as recorded

| Pass | Fixed | Failed | Nodes after | Broken after | Reachability |
|---|---|---|---|---|---|
| 1 | 494 | 3 | ~1,000 | 594 | 93 % |
| 2 | 589 | 5 | ~1,267 | 688 | 93 % |
| 3 | 726 | 9 | 1,683 | 884 | 100 % |

Bidirectional fix: 146 links closed, then 135 — the second batch cycling, because setting `B.W = A`
overwrites whatever occupied `B.W`. Two nodes claiming the same slot cannot both be satisfied by an
overwrite strategy. `rip-and-connect` relocated ~223 strays across six batches with zero placement
failures.

### The convergence argument — **WRONG WHEN WRITTEN**

The original §VIII defends the rising broken count:

> *"The correct convergence metric is broken/total-edges ratio, not absolute count."*

The ratio fell monotonically — 62.4 % → 59.7 % → 53.8 % → 47 % — and was read as convergence. But every
pass spawned elbow junctions, and every junction adds edges to the **denominator**. The metric therefore
*cannot* report divergence: it is driven downward by the very mechanism whose runaway it was chosen to
monitor.

Measured node counts across the cascade:

| Commit | Time | Nodes | `junction:true` | Content nodes |
|---|---|---|---|---|
| `3ac0aed` | 06-09 08:32 | 531 | 166 | 365 |
| **`661aa29`** | **06-09 11:48 — this report** | **1,684** | **1,300** | **384** |
| `9833f48` | 06-09 18:17 | 4,429 | 4,045 | 384 |
| `66e26dd` | 06-10 09:23 | 4,429 | 4,045 | 384 |
| `f1449f5` | 06-10 15:06 | 2,875 | 2,491 | 384 |
| `120d617` | 06-16 | 451 | 42 | 409 |
| `efa8f7a` | 06-25 (§WALK-1) | 410 | **0** | 410 |
| HEAD | 08-13 | 416 | 0 | 416 |

The successor report `lab-report-junction-reweave-overhaul.md`, filed 22 hours later, opens by calling
the same mechanism a cascade failure: *"That new junction was itself slightly misaligned → next pass
found **it** broken and added another junction."* Between the two, the commit log records an
out-of-memory fix (`e04e903`, `e2576f6`). The map ran the tooling out of heap.

> **Instrument (§DOC-02, 39th): a convergence metric whose denominator is grown by the process it
> measures cannot report divergence.** The ratio was honest, monotone, and structurally incapable of
> raising an alarm.

---

## IV. Stray Relocation — the codes HELD, the geography did not

Twelve node codes are named in the original §IV. **All twelve resolve at HEAD, and all twelve are
byte-identical to the birth commit in both `num` and `label`** — the strongest node-code result in the
§DOC-02 corpus to date.

The *glosses* attached to them are another matter. Eight carry a real-world geographic reading; **seven
contradict the `label` sitting on the same source line, at the report's own commit**:

| Code | Report's gloss | `label` at `661aa29` **and** at HEAD | |
|---|---|---|---|
| `HFT` | "isolated on the British Isles mesh" | South Shore — The Fishermen's Village | ✗ |
| `LGW` | "London airports" | Tilbury Market Quarter | ✗ |
| `STN` | "London airports" | The Map Shop | ✗ |
| `SIG` | "Sigtuna" | Siggeir's Hall — Signy's Captivity | ✗ |
| `MAD` | "Madrid" | Shattered Seraph's Spire | ✗ |
| `CONREG` | "its regional node" | Constantinople — Imperial Court Registry | ✗ |
| `HAV` | "Havre" | Admiral's Last Cove | ✗ |
| `NID` | "the Scandinavian coast" | Nidaros — Olaf's Shrine City | ✓ |
| `MSE`·`CHY`·`PCR`·`LRD` | "English Midlands cluster" | Canterbury / Widow's Farmyard / Pilgrims' Camp / Lord's Manor | ✓ |

The pattern is exact: the author read `LGW`, `STN`, `MAD`, `HAV` as **IATA airport codes** and described
the world from the airline atlas rather than from the `label` field on the same line. The two glosses
that hold are the two whose codes are *not* IATA.

> ***A three-letter code is a key, not a place-name. The moment it looks like something you already
> know, you have stopped reading the file.***

**Unverifiable by construction:** the §IV placements describe *intermediate* batch states. `HFT` is
recorded as wired North to `J740`; at the birth commit it is wired North to `J202`, later passes having
rewired it. No artifact preserves the states the evidence section documents.

---

## V. Bonus Fix — `worldmap --regions` NaN — **HELD, and the sole surviving artifact**

`getArg('--regions')` returned the *next token* (`'--port'`), and `+'--port'` is `NaN`, which propagated
into the grid dimensions.

```js
const _nGridRaw = getArg('--regions');
const nGrid = (_nGridRaw && !isNaN(+_nGridRaw)) ? +_nGridRaw
            : (getArg('--grid') && !isNaN(+getArg('--grid')) ? +getArg('--grid') : 6);
```

Live today at **`src/tools/worldmap.js:1201–1202`**, byte-identical to the published patch (the file moved
from the repo root to `src/tools/`; the original's line hint 1107 has drifted, per §DX-01e). Run at HEAD it
renders `World Region Grid  6×6  (lat -8°–68°  lon -25°–72°)` — the same bounds the original printed.

*Two hundred lines of graph surgery were deleted. The four-line argument-parsing fix at the bottom of
the page is still running.*

---

## VI. Final State — as recorded, and as it stands

| Metric | Report: before | Report: after | **HEAD (2026-08-13)** |
|---|---|---|---|
| Total nodes | 781 | 1,683 | **416** |
| Content nodes | 383 | 383 | **415 or 416** — see §AUDIT-03ax |
| Junction nodes | ~398 | 1,300 | **0** by `junction:true`; **1** by `J`-prefix (`J13`) |
| Reachable from `LHR` | 694 (89 %) | 1,683 (100 %) | **416 / 416 (100 %)** |
| Isolated clusters | 87 | 0 | **0** |
| `N`/`S`/`E`/`W` link fields | — | 1,017 / 1,015 / 918 / 915 | **0 / 0 / 0 / 0** |

**The thesis outlived the architecture.** 100 % reachability from Birka is still true — but it is now
established by a terrain-field land flood (§WALK-1.5), in which empty land cells are walkable and
node-adjacency strays cannot exist. The goal survived; every mechanism used to reach it was removed.

### The 1,683 / 383 discrepancy — the report was right, for a reason it could not see

The source text at `661aa29` contains **1,684** `NODE_MAP` entries and **384** non-junction entries. Both
published figures are one lower, because both were read from the *parsed* model — and the parser silently
dropped one entry:

```
ZRH:{ num:143, ... label:'Dunfall — The Loch Harbor', act:3 ... }   ← line 8024
ZRH:{ num:72,  ... label:'The Unbanked Quarter',      act:1 ... }   ← line 8068
```

`ZRH` is declared **twice**; last key wins. Dunfall — its NPC Mairén Fionn, its harbor, its `sleep:true`
checkpoint — existed in the file and in no runtime model, from `e339aeb` (2026-05-28) until `291c82a`
(2026-06-26), when §CELL-14-FU re-coded it to **`DNF`**. The repair pass ran squarely inside that window
and certified 100 % reachability over a census that had already lost the node.

> ***A duplicate key does not break reachability. It removes the node from the denominator, so the
> reachability check passes — and passes because the node is gone.*** This is the rot class
> `check:dupkeys` (gate #11) was built for on 2026-07-28, seven weeks later.

---

## VII. Remaining Work — every row now measures an undefined quantity

| Original issue | Count | Status at HEAD |
|---|---|---|
| Broken edges (diagonal/gap) | 884 | **Undefined** — the check required `N`/`S`/`E`/`W`; `./api.sh broken` now reports isolated *cells* (93) |
| Cycling bidirectional conflicts | ~135 | **Undefined** — `./api.sh fix-bidirectional` reports *"0 violations"* over an empty field set |
| Direction-sign violations | 682+ | **Undefined** — no direction fields exist |
| Degree-1 dead ends | 149 | **Re-based** — 148 at HEAD, but degree now counts adjacent occupied cells, not links |

The proximity of 149 and 148 is coincidence across incompatible denominators, and is recorded here so the
next reader does not mistake it for continuity.

**§VII's recommended next step — `geo-seed --execute` then `layout-solve.js --apply` — was never executed
and can no longer be executed.** `src/tools/layout-solve.js` (604 lines) is a constraint solver for
"N/E/S/W networks," and there are none. It is still recommended at **eight live sites**, including inside
`src/api/wb.js`'s *"Full world reset sequence (cell-first, §WALK-1.5 geo flood)"* — a cell-first procedure
prescribing the edge-graph solver, five lines above the note explaining that the edge graph is retired.
Filed as **§DX-02bf**.

---

## VIII. Tooling Notes — retained, corrected

**`fix-all-broken` is greedy.** Each pass fixed edges in insertion order; moving B to satisfy A broke B's
constraints for C. **HELD** — and the honest statement of it is what makes §III's convergence defence a
reasoning error rather than a reporting one. The mechanism was described correctly and its consequence
was measured with the wrong instrument.

**Ordering: `rip-and-connect` first.** A stray in the wrong region generates many broken edges as
alignment tries to reconcile it with distant neighbours; relocating first gives alignment a smaller
problem. **Sound, and moot** — both tools now return HTTP 410 (§WALK-3 Inc 2).

**Bidirectional cycling.** The proposed fix — check occupancy before overwriting, and clear the source
side when the target's opposite slot is legitimately taken — was never built. **NOT SHIPPED**, and now
unbuildable.

---

## IX. Defects Filed

| Row | Severity | Premise |
|---|---|---|
| **§DX-02bf** | 🟢 no design call | Eight live sites route authors to `layout-solve --apply`, `fix-bidirectional` and `junction-audit`, all keyed to link fields that are `0` at HEAD. `fix-bidirectional` returns a green *"0 violations"* over an empty set — a passing badge for a subsystem that no longer exists. |
| **§AUDIT-03ax** | 🟢 no design call | `J13` is the last reweave-era elbow, re-terrained to `midlands` and re-labelled *The Western Sea Road*. It carries node text but **0 quests, 0 NPCs, 0 loot, no `junction:true`**. `./api.sh junction-audit` counts by key prefix and reports **1**; `check:invariants` I1/I2 count by flag and report **0**. Two instruments, one node, two answers. |

---

## X. Conclusion

The repair achieved what it set out to achieve, and the invariant it defended is intact two months and
one architecture later: every node in the world is reachable on foot from Birka, and no quest state can
refuse a step. That is the finding that matters for play.

What the report could not tell itself is that it was measuring the wrong thing. It watched a ratio fall
while the map inflated eightfold around a content set that never grew by one node, and it recorded the
flat content column — *"383 → 383"* — as proof of safety. The number was correct. The reassurance was
backwards.

> *All 383 content nodes are reachable.* — and by the following evening, so were the 4,045 junctions
> standing between them.

---

*Original report generated 2026-06-09 against snapshot series `20260609-18####`. Verified and rewritten
2026-08-13 (§DOC-02at) against HEAD and the birth commit `661aa29`. Legacy node codes throughout are
history and are annotated, never rewritten (§AUDIT-03n / `src/scripts/legacy-codes.js` HISTORY class).*
