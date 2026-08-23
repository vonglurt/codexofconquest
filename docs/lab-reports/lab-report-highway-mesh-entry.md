<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->
# Lab Report — Highway Mesh-Entry Selection & Same-Component Skip

**Subsystem:** `buildHighway`, the corridor builder inside `POST /api/graph/reweave-all` (MegaReWeave P2/P3)
**Filed:** 2026-06-10 11:10 · **Shipped:** `e2576f6` (2026-06-10 13:30) — *the same commit added this document and its code*
**Verified:** 2026-08-13 (§DOC-02ax) · **Status at HEAD:** subject RETIRED (`reweave-all` → HTTP 410, §WALK-3 Inc 3)

---

## Abstract

MegaReWeave built highways between named cities by walking a straight corridor and dropping a
junction node every four grid cells. Two behaviours wasted junctions: the builder never asked
whether the endpoints were *already* connected, and it always routed to the named node's own cell
even when that node sat deep inside an established mesh. This report specified two guards — an
early-exit **same-component skip** and a **mesh-entry reroute** to the nearest border cell — and
both shipped.

Re-measured against the archive fourteen months later, the *guards* verify and the *description of
them* does not. The report attributes to `buildHighway` an O(n²) minimum-Manhattan closest-pair
search; the shipped function performs **two sequential linear scans** and carries a comment saying
so three lines above. The O(n²) closest-pair the report describes is real, but it lives in the
**caller** (P3), where it predates this change and was not touched by it. Separately, on the world
that stood when the code shipped, the skip guard fires on **7 of the 8** configured priority
highways and the eighth bails earlier — so P2 became a complete no-op, and two of the report's three
published traces document a branch that pair could never reach.

---

## 1. Intention, inspiration, and what it bought the player

A junction is a room with no reason to be entered. It has no NPC, no battle, no loot and a
machine-written label; its entire purpose is to be *walked through* so that two real places are
connected. Every junction the highway builder created without needing to was a keystroke the player
would pay forever, on every crossing, for the rest of the game's life.

That is the whole design argument, and it is the one the reweave era kept relearning: **distance
should mean travel, not typing.** The invariant underneath is the project's first — *the world is
always freely traversable* (`prompt.md` §6.1), a step refused only for off-grid or sea. Reachability
is not a graph statistic; it is the difference between a city that exists and a city you can walk
to. The pipeline's job was to guarantee every named place walkable from Birka **without littering
the map with empty routing stubs** — and by 2026-06-10 the litter was the emergency: the map had
grown 1,684 → 4,429 nodes in seven hours while the content column sat flat at 384, and the session
carried two out-of-memory fixes.

This change is one of the two brakes filed that morning. Its instinct is exactly right: *don't build
a road to a place you can already reach, and when you must build one, aim at the near edge of the
mesh rather than its middle.* The instinct survived. The accounting did not.

## 2. Verification method

1. **Dating (instrument 18).** `git log -S` on every named symbol, then census at the commit
   standing when the report was written — not at HEAD.
2. **Symbol census** across four archive copies of `wbapi-server.js` (`66e26dd`, `e2576f6`,
   `09fa5b2`, `a61d6eb`) plus HEAD.
3. **Re-implementation (§DOC-02av method note).** The report publishes its algorithm, so the
   algorithm was re-run: the `NODE_MAP` N/E/S/W graph and `NODE_COORDS` were extracted from
   `62a4023:play.html` and BFS'd directly to reproduce every component size and distance.
4. **Live probe at HEAD** of the three endpoints that descend from this code.

> *Path hazard (§DOC-02au) applied:* at all of these commits the server lived at repo root as
> `wbapi-server.js`, not `src/js/wbapi-server.js`. A wrong path yields a 0-byte file and a census of
> zero for every symbol, which reads exactly like "nothing shipped."

## 3. The problem as filed — one claim holds, one does not

**3.1 Over-building when a route already existed. — HALF CORRECT.**
The report says *"Phase 2 (priority highways) and Phase 3 (city mesh MST) called `buildHighway`
without first checking whether the two nodes were already reachable."*

- **P2: confirmed.** The pre-change loop (`wbapi-server.js:6176–6186` at `66e26dd`) guards only on
  node existence and coords — no reachability test of any kind.
- **P3: false, and the inverse of false.** P3 selects `bU` from `unreach` and `bR` from `reach3`,
  recomputing both after every successful build. **By construction it only ever hands `buildHighway`
  a pair that is in two different components.** The new skip guard is unreachable from P3.

**3.2 Routing deep into the mesh instead of to its border. — CONFIRMED.**
`buildHighway` did route to `toCode`'s own cell. The worked example is sound in shape and loose in
units: *"a junction 3 cells away … saving 12 junction creations."* Junctions are placed every `step`
cells and `step` defaults to **4**, so twelve *cells* is three *junctions*. The report counts cells
and calls them junctions — a 4× overstatement of its own benefit.

## 4. As-built inventory (at `e2576f6`, the birth commit)

| Element | Site | Verdict |
|---|---|---|
| Same-component early return | `wbapi-server.js:5525–5529` | ✅ exact — `bfsReach(fromCode).has(toCode)`, returns `shape:'already-connected', skipped:true`, no writes |
| Mesh-entry selection | `:5531–5548` | ⚠️ shipped, but **not the published algorithm** — see §6 |
| `fc`/`tc` from `actualFrom`/`actualTo` | `:5550` | ✅ exact |
| `walkLeg` / corridor emits / `editField` rewired | `:5630–5654` | ✅ all three legs and both corridor emits use `actualFrom`/`actualTo` |
| Return carries original codes | `:5631, :5648, :5655` | ✅ `from:fromCode, to:toCode` on all three shapes |
| SKIP trace line | `:5527` | ✅ byte-identical to the published template |
| `net=` / `direct-dist=` trace | `:5544` | ✅ template exact |
| reroute / already-optimal traces | `:5546, :5548` | ✅ templates exact |
| `corridor(dir): A(r,c)→B(r,c)` | `:5630, :5637` | ✅ template exact |
| **`netNodes(hub)`** | — | ❌ **never existed** |

**`netNodes` has zero occurrences in any `.js` file in the repository's entire history.** Its only
appearance anywhere is this page, where it is listed as implementation step 2 and again as the
subject of the performance recommendation. The work it names is done inline by two `for` loops that
filter with `if(!co)continue`. This is §DOC-02au's `MAX_CLEANUP`/`MAX_WITHER` shape exactly: *a
document dignifying an unnamed expression with a constant name, and then reasoning about the name.*

## 5. Spec → shipped delta

| # | Report says | Measured | Verdict |
|---|---|---|---|
| 1 | Skip guard before any corridor work | present, exact | ✅ |
| 2 | `netNodes(hub)` helper | 0 occurrences, ever | ❌ NEVER SHIPPED |
| 3 | Closest-pair loop, `O(|fromNet| × |toNet|)`, minimum Manhattan | two sequential O(n) scans; greedy, not minimal | ❌ WRONG ALGORITHM |
| 4 | `fc`/`tc` from the rerouted pair | exact | ✅ |
| 5 | All `walkLeg`/emit/`editField` sites rewired | exact | ✅ |
| 6 | Return keeps `from`/`to` | exact | ✅ |
| 7 | Trace: `LHR(net=312)→BGD(net=28) direct-dist=87` | one component of 4,428; real distance **148** | ❌ fabricated |
| 8 | Trace: `SKIP … (same component, 847 nodes)` | correct branch, wrong size — **4,428** | ⚠️ |
| 9 | Trace: `J4421 → J18203` | highest junction in the world was **J3977** | ❌ fabricated |
| 10 | Trace: `CVP→SAM … already optimal dist=144` | real distance **18**, and the pair skips first | ❌ unreachable branch |
| 11 | *"the graph has 440 named nodes"* | **461** named (384 non-junction) | ❌ |
| 12 | *"Post-nuke, networks are small"* | forward reference — P_NUKE shipped in this same commit | ⚠️ unverifiable when written |
| 13 | *"Callers (P2, P3) already emit their own `highway: X→Y` line"* | P2 yes; P3 emits `[mesh N] …` | ⚠️ half |
| 14 | Skip means *"no junctions created, no writes"* | true of the function, **false of the operation** — see §7 | ❌ |

## 6. Finding 1 — the algorithm described is in the caller, not in the code

The report's implementation step 3 and its entire closing Performance note rest on one claim:

> *"Closest-pair loop — O(|fromNet| × |toNet|), finds `actualFrom`/`actualTo` with minimum Manhattan
> distance."*

The shipped function, in the same commit, is headed:

```
// ── mesh-entry selection: O(n) per side, not O(n²) ───────────────────────
// Find the node in toCode's network closest to origFc (source pos),
// and the node in fromCode's network closest to origTc (dest pos).
// Two linear scans — safe on large (15k+) components.
```

It is a two-step greedy. Scan 1 picks `actualTo` as the node in the far component nearest **the
original source cell**; scan 2 then picks `actualFrom` as the node in the near component nearest
**that already-chosen `actualTo`**. This is not the minimum pair, and the gap is unbounded. Take
component A = {a₁(0,0), a₂(0,10)}, component B = {b₁(0,11), b₂(5,1)}, named pair a₁→b₁: scan 1
prefers b₂ (distance 6 from a₁ vs 11), scan 2 then keeps a₁ (6 beats a₂'s 14), and the builder walks
a 6-cell corridor. **The true nearest pair is a₂↔b₁ at distance 1.** Six times the road, two junctions
that need not exist.

The failure is structural, not arithmetic: scan 1 is anchored at `origFc` — *the very cell the
report's own §3.2 argues is the wrong place to measure from.* The from-side optimisation is
conditioned on a to-side choice made before it.

And the O(n²) closest-pair does exist in the file, twenty lines below the caller — P3's own selection
loop (`wbapi-server.js:6203–6205` at `66e26dd`), a full double loop over `unreach × reach3` picking
the minimum Manhattan pair. It is **byte-identical before and after this commit**. The author
documented the neighbour and filed it as the change.

> ***The instrument: when a report's algorithm does not match its code, check whether it matches the
> code next to it.*** A description that is wrong about the diff is often right about the file — which
> is precisely why it survived review. Both halves were true; only the attribution was invented.

## 7. Finding 2 — the guard disabled the phase it was written to optimise

Re-running the report's algorithm over `62a4023` (the world standing when this shipped):

| Priority highway | Same component? | Skip fires? |
|---|---|---|
| `HHL→MLN` · `EDI→CVP` · `NID→TUN` · `CVP→SAM` · `LHR→TRB` · `GLA→SIN` · `ACT→BGD` | **yes, all seven** | ✅ |
| `HHL→GEDI` | `GEDI` is not a node — never was | bails one guard earlier |

Every one of the 4,428 linked nodes was in **one component** (§DOC-02at's repair had just certified
100 % reachability). So P2 skipped every highway it was configured to build and built nothing. The
report presents the guard as removing *redundant parallel routes*; on the only world it ever ran
against, it removed the phase.

That is arguably the correct outcome — the roads genuinely were not needed. But two consequences went
unrecorded, and the second is the expensive one:

- **Two of the three published traces cannot occur for the pairs they name.** `LHR→BGD` and `CVP→SAM`
  are both same-component, so control never reaches the reroute or already-optimal branch. The only
  trace consistent with its own inputs is the SKIP line.
- **"No junctions created, no writes" is true of the function and false of the operation.** The skip
  returns `ok:true`, and P2's caller (`:6516`) tests only `r.ok` — so on every skip it still runs
  `rewriteCoords()` (re-serialising all 4,495 coordinate entries), `WBAPI._buildIndexes()`, and
  `batchSave()`, which writes a ~9 MB stamped file, copies it over the game file, and re-parses it.
  Seven times, for zero graph change. In a commit whose own subject line is *"fix OOM."*

> The guard skipped the corridor walk — the cheap part, since the pairs were already joined — and paid
> the full save cycle regardless. *The brake was fitted to the wheel that was not turning.*

## 8. Trace forensics — real inputs, invented numbers

The sample traces are not careless. Every **input** is real and copied: `LHR→TRB`, `CVP→SAM` and
`ACT→BGD` are three of the eight literal entries in `PRIORITY_HIGHWAYS` (`src/api/wb.js:1070–1082` at
`e2576f6`), and the one geographic gloss the report offers — *"`BGD` (Baghdad)"* — is correct, matching
both the gazetteer (`lat 33.3, lon 44.4`) and the node's own label, *Baghdad — Sufi Scholar Quarter*.

Every **output** is composed. `J18203` names a junction 4.6× higher than the highest that existed
(`J3977`) and 4.1× the entire node count; the world would not reach that scale until `be046d4`, three
days later. `net=312`, `net=28` and `847` are three different sizes for components that were all
4,428. `direct-dist=87` for a pair 148 apart; `dist=144` for a pair 18 apart. The one internally
consistent detail is the arithmetic: `saved = 87 − 12 = 75` ✓, and the corridor endpoints `(44,18)→(44,30)`
are indeed 12 apart ✓ — *the numbers were made to agree with each other rather than with the map.*

This is instrument 9 at its cleanest, inside a single short document: **the tables and code paths were
copied and are exact; the traces were reconstructed and are fiction.** The predictor is not whether a
passage looks technical — these traces carry node codes, coordinates and matching arithmetic — it is
whether the author could paste it. A run's output cannot be pasted from a file you are reading; it has
to be remembered, and memory supplies plausible numbers.

**Node codes (instrument 31): 5 of 5 byte-identical in `num` and `label`, archive → HEAD.**
`LHR`(1) *City Streets — Birka* · `TRB`(187) *Trebizond — Genoese Registry Quarter* · `BGD`(190)
*Baghdad — Sufi Scholar Quarter* · `CVP`(465) *Copyist's Quarter — Lisbon Archive District* ·
`SAM`(191) *Samarkand — Silk Road Scholar District*.

**Incidental corroboration.** At `62a4023` the source holds 4,429 `NODE_MAP` keys but only 4,428
distinct ones: **`ZRH` is declared twice.** §DOC-02at found the same duplicate one commit earlier. It
is the reason every parsed census that week ran one low, and it is why the class `check:dupkeys`
(gate #11) exists — built seven weeks later.

## 9. Risk register outcome

One risk was filed, in the Performance note: that the O(n²) closest-pair loop would not scale to a
large mesh, mitigated in a future pass by capping `netNodes` at the 200 nearest cells.

**All three of its terms are wrong.** The loop is not O(n²); `netNodes` does not exist; and the cap
was never needed, because the code already ran two linear scans and said as much. The one real
performance hazard in the change — that a skip still triggers a full serialise-save-reparse cycle at
the call site — is not mentioned. *The author audited the function they wrote and imagined the one
that would stop it* (instrument 40, a third confirmed instance in this cluster).

## 10. Status at HEAD (2026-08-13)

`POST /api/graph/reweave-all` returns **410** (`src/js/wbapi-server.js:reweave-all is deprecated@6912`);
its ~3,200-line body was deleted by §WALK-3 Inc 3. `NODE_MAP` carries **0** `N:`/`S:`/`E:`/`W:` link
fields, **0** `junction:true`, 416 nodes. `netNodes`, `mesh-entry`, `already-connected`, `actualFrom`,
`actualTo`, `walkLeg`, `PRIORITY_HIGHWAYS`: **0 occurrences anywhere.** `buildHighway` survives as one
word in a tombstone comment (`src/js/wbapi-server.js:Historically this reused buildHighway@6993`), and that
comment is accurate for the site it annotates — the standalone endpoint always used its own inline
bridge; it was the in-pipeline P5.5 phase (`f1449f5`, three hours after this shipped) that called
`buildHighway`, and that phase went with the body.

**What did not go with the body is the finding of §11.** Three descendants of this code are live at
HEAD, and they do not agree about the world:

| Surface | Reachability model | Answer |
|---|---|---|
| `GET /api/graph/reachability` | §WALK-1.5 land flood over passable cells | **416 / 416, 0 clusters** |
| `GET /api/graph/junction-audit` | BFS over *cell-touching* adjacency | **2 of 415** named reachable |
| `POST /api/graph/cluster-bridge` | BFS over `node.N/S/E/W` — of which there are none | **1 of 416**, 415 clusters |

Same server, same file, same minute. *The one that is correct is the one that refuses to repair
anything; the two that are wrong are both wired to write.*

## 11. Defects filed

**§DX-02bl (🟠) — `cluster-bridge` and `junction-audit` read the retired edge graph and report a
shattered world; one of them can act on it.** `POST /api/graph/cluster-bridge`
(`src/js/wbapi-server.js:const cbAdj = new Map()@6930`) builds its adjacency from `node[d]` for
`N`/`S`/`E`/`W`. There are zero such fields at HEAD, so every adjacency set is empty and
`bfsReach('LHR')` returns `{LHR}`. Live dry-run confirms: `hub=LHR reachable=1/416 unreachable=415`,
**415 isolated clusters of one node each.** With `{execute:true}` it iterates all 415, calling
`POST /api/graph/smart-connect` and then **two `PUT /api/node/<code>` writes per cluster — up to 830
writes that re-introduce the exact `N`/`S`/`E`/`W` link fields §CELL-01/§WALK-1 stripped to zero.**
It is published as a green CLI verb under *"§22 NETWORK HEALTH & REPAIR"* (`src/api/wb.js:3153`,
`docs/api/API-README.md:295`) and shares its no-timeout streaming path with `nuke-junctions`.
`junction-audit` is the second site, reporting 413 of 415 named nodes unreachable from a
cell-touching BFS (`src/js/wbapi-server.js:function degree(code)@5385`); it also disagrees with itself
inside one response — `junctionDegreeDist` puts `J13` at degree 2 while `nukePreview` classifies the
same node `deadEndDelete` (degree ≤ 1), because the two figures are computed from different graphs.
**Recommend 410 for `cluster-bridge`; teach `junction-audit` to source reachability from the
land-flood endpoint, or to refuse over an empty field set.** Closes as one retirement sweep with
**§DX-02bf**, **§DX-02bi** and **§DX-02bk** — all four are the same defect: *a repair tool that
outlived the breakage it repaired, still confidently measuring a graph that no longer exists.*

---

## Verdict

**RETIRED, not wrong — with one review defect and one accounting defect.** Both specified guards
shipped and both work. The report's structural claims about the file it edits are exact down to the
byte in every place the author could copy, and wrong in every place they had to recall: the algorithm,
the traces, and the node count. Its one filed risk described code that was never written, about a
complexity the shipped function did not have, mitigated by a helper that does not exist.

The durable lesson is not that the numbers were invented — that is ordinary. It is **where** they
were invented: *a report will be most confident precisely where the file could not check it.* The
sample trace is the least verifiable artifact a design document can publish and the most persuasive
one it can print, because a plausible run reads as a run that happened.

And the design instinct outlived every line of its implementation. `reweave-all` is a 410 and the
junctions are gone, but the argument this page makes — **don't build a road to a place you can already
reach** — is the one §CELL-05 and §WALK-1.5 eventually executed, by removing the concept of a routing
stub altogether. *The brake was right. It was fitted to the wrong wheel, and described as a third
wheel that was never there.*
