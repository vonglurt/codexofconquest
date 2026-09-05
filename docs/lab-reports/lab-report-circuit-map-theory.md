<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->

# Sparse Node Mesh Reduction via Circuit Corridor Junction Theory

**Lab Report — IEEE Style · CodexOfConquest: The Shattered Codex (`play.html`)**
**Original date:** 2026-05-21 · **Layer:** 9 — Time-Warp Footpaths & Circuit Corridors
**Classification:** World Architecture / Navigation Design
**Verification pass:** 2026-08-11 (§DOC-02f) — every claim re-measured against HEAD and against the
earliest surviving build.

> **HISTORY DOCUMENT.** This is the design record as believed on 2026-05-21, not a description of
> the current engine. Claims that did not ship, or that shipped and were later removed, are marked
> **NOT SHIPPED** / **RETIRED** and **kept** — a silently deleted claim reads like one that held.
> Its node codes are the retired 26×16 space; per §AUDIT-03m, `docs/lab-reports/` is HISTORY —
> **annotate, never rewrite**. Treat no code listing below as live source.

---

## Abstract

The report specified **Circuit Corridors**: a sparse node graph embedded in a dense grid, with the
gaps between nodes rendered as box-drawing wire traces, selected road cells promoted to named
**junction** nodes, and each corridor leg traversed in one of two modes — **Warp** (instant, safe)
or **Hunt** (rolled encounter, probability scaled by the player's active-quest load).

**Verification result: 24 of the 50 symbols it names resolve at HEAD (48%), and 0 of its 26 node
codes resolve to the node they name.** The whole corridor layer was deleted in three passes
between 2026-06-13 and 2026-06-16 (§CELL-05, §CELL-10, §CELL-11A, §CELL-14) and superseded by
§WALK/§NAV-01's 90×360 geo grid. Warp is now a **banned design** (hard invariant #3, *no jump
travel, ever*) and `junction:true` a **CI failure** (`check:invariants` I1/I2).

The finding that matters is not the removal — it is **where inside the document the accuracy
lives.** Its data and build listings (§IV–§V) are *verbatim transcriptions*: `WIRE_GLYPH` shipped
byte-identical in all eleven entries, `_routeSegments()` byte-identical, the junction coordinate
block exact, and both `NODE_MAP` sample entries exact in every content field. Its **execution
traces** (§VII) are *narration*: they name three identifiers with **0 commits in the entire
repository history**, quote an encounter formula missing a whole term, and pivot both traces on a
dialog that was **built, styled, and never once shown to a player**. This refines §DOC-02b's
"the half that points at code is the half that is right" — the real boundary is **copied structure
versus narrated behavior**, and §IV is code that was copied while §VII is code that was imagined.

**Keywords:** sparse graph embedding, corridor routing, travel-mode design, design-record
verification, document-internal accuracy gradient

---

## I. Method

Five measurements, all reproducible (`play.html`, 38,707 lines, coc-3.104.0):

1. **Symbol census.** Every function, constant, state field, DOM id and CSS class the report names,
   batched through one `grep -c` loop — this partitions the document before a line of it is read.
2. **Node-code resolution.** All 26 codes tested against live `NODE_MAP` keys.
3. **History probe.** `git log -S` on every dead symbol, separating **RETIRED** (shipped, later
   removed) from **NOT SHIPPED** (never existed) — the distinction no report can make about itself.
   Mandatory since §DOC-02c.
4. **Archive read.** For claims about the past, the report was diffed against `32c10c5`
   (2026-05-24, the earliest surviving build — three days after the report's own date), not against
   HEAD. **HEAD cannot adjudicate a claim about 2026-05-21; the archive can.**
5. **Corpus cross-check.** Compared against its Layer-9 sibling, `lab-report-battleground-circuit-
   path-quest.md` (§DOC-02c) — same date, same layer, overlapping node tables (§DOC-02e).

---

## II. As-Built Inventory — What Survives

| Claim | Status at HEAD | Anchor |
|---|---|---|
| `NODE_MAP` flat, keyed by code; `name` is the terrain key; content fields `npc`/`battle`/`loot`/`sleep` | **exact** | `const NODE_MAP@8437` |
| `NODE_COORDS` maps every node code to `{r, c}` | **exact shape**, different grid — see delta 8 | `const NODE_COORDS@9434` |
| `WORLD_DB` terrain table drives the corridor monster pool | **live**; still the encounter pool, reached from terrain not corridor | `const WORLD_DB@6280` |
| `_weightedMonsterPick(terrain)` — tier-weighted pool draw | **live**, signature intact; body now notoriety-scaled + seeded | `function _weightedMonsterPick@38433` |
| `_setActivePath(fromCode, toCode, dir)` | **live** — the last surviving line of the runtime layer, see §IV-B | `function _setActivePath@38396` |
| `S_story.lastExitCode` / `lastExitDir`; the `mc-exit-active` gold exit arrow | **live**, still wired exactly as §IX describes | `mc-exit-active@36911` |
| Battle pipeline `loadWorldMonster` → `pendingBattle` → `#story-prebatt-overlay` → `storyApplyOutcome` → `btn-outcome-win` | **live** | `function _startStoryBattle@38455` |
| `storyRender`, `_renderPreBatt`, `_renderMapGrid`, `refreshLeftPanel`, `storyCheckMissedSleep` | **live** | — |
| `S_story.quests` key→status map; `.log`; `.currentCode`; `.hp`/`.hpMax` | **live** | — |
| `mc-current` map cursor class | **live** | — |

**Live: 24 of 50.**

---

## III. Spec → Shipped Delta Table

Twelve deltas. Each is **NOT SHIPPED** (never existed), **RETIRED** (shipped, later removed), or
**CHANGED** (survived under an altered contract).

| # | Report claim | Outcome | Measured |
|---|---|---|---|
| 1 | **The corridor mesh** — `CORRIDOR_CELLS`, `CORRIDOR_TERRAIN`, `WIRE_GLYPH`, `buildCorridorMap()`, `_routeSegments()`, `_wireGlyph()`, `_corridorTerrain()` | **RETIRED — all 7** | Present and correct at `32c10c5`; `grep -c` = **0** at HEAD. Deleted by **§CELL-11A** (`85cc43e`, 2026-06-14, *"remove corridor dead code"*). Superseded by the §WALK/§NAV-01 geo grid + `const ROAD_RUNS@9896`. |
| 2 | **The Hunt/Warp dialog** — `#story-corridor-overlay` fires whenever Manhattan distance ≥ 2; player picks Warp or Hunt | **RETIRED, and never functional — see §III-A** | The markup, CSS and all three buttons shipped verbatim. **No code ever showed it.** |
| 3 | **`corridor-from` · `corridor-to` · `corridor-terrain` DOM writes** (§VII Trace A) | **NOT SHIPPED as named** | Shipped ids are `corridor-from-name`, `corridor-to-name`, `corridor-terrain-name`. The report drops the suffix on all three. |
| 4 | **`corridor-quest-count` · `corridor-pct`** DOM writes | **NOT SHIPPED** | `git log -S` returns **0 commits ever** for both. The shipped card has one readout, `corridor-encounter-rate`. |
| 5 | **`_corridorOnComplete`** — the callback threaded through `triggerCorridorEncounter` and consumed by `storyApplyOutcome` (Trace A steps 7 and 9) | **NOT SHIPPED** | **0 commits ever.** The shipped `triggerCorridorEncounter(terrain, destCode, questHunt)` takes no callback and calls `storyRender(destNode)` directly. Trace A's step 9 describes a resumption mechanism that never existed. |
| 6 | **Encounter formula** `min(0.90, 0.10 + activeQuestCount × 0.05)`, and the 10/20/30/50/90% table of §VI-2 | **CHANGED — a whole term is missing** | Shipped: `Math.min(0.95, 0.1 + notoriety * 0.015 + activeQuestCount * 0.04)`. Three of four constants differ **and** conspicuousness is a function of **notoriety as well as quests**. Every row of the report's table is wrong; at the level-1 notoriety of 3 the real values are 14.5 / 22.5 / 30.5 / 46.5 / 78.5%, and the 0.95 cap is unreachable by quest load alone. *(§DOC-02c's delta 10 called this expression nonexistent "at HEAD and in history" — correct about the literal, too strong about the mechanism: see §V.)* |
| 7 | **`pendingBattle` shape** `{nodeCode:'_corridor', name, label:'Corridor — midlands', isCorridor:true}` | **NOT SHIPPED — 3 of 4 fields** | Shipped: `{nodeCode: destCode, name: pick.name, label: destNode.label, corridor: true}`. `isCorridor` and the `'_corridor'` sentinel have **0 commits ever**. The real path also sets `S_story.surpriseAdvantage`, which the report does not mention. |
| 8 | **The grid** — 16 rows × 26 columns = 416 cells, **42 named nodes**, ~90% sparsity | **CHANGED, all three** | A **90×360** geo grid (equirectangular, sea-masked) with a 15×21 window (§NAV-01e), and **416 nodes** — *the world now has as many named places as the original grid had cells.* The "42" was already stale at `32c10c5` three days later: **67** nodes. |
| 9 | **Junction nodes `J1`–`J7`** with `junction:true`; "named, traversable, no services" | **RETIRED, then made a CI failure** | All 7 shipped exactly as specified, `J1` included (`num:43`, `label:'Midlands Road Fork'`, all content fields `null`). Purged by **§CELL-05** (`6dea804`, *"abolish junction nodes"*) and **§CELL-14** (`30f18b4`). **0** carry `junction:true` at HEAD; the two later strays (J14/J15) failed `check:invariants` I1/I2 and the tool that minted them is deprecated and refused (§DX-01d). |
| 10 | **Warp mode** — "instant teleport to destination", encounter 0% | **RETIRED, then forbidden** | Hard invariant #3 is now **"No jump travel, ever"**, stated in source: `no jump travel. checkpointNode@26181`. Warp is not merely removed — it is a **banned design**. *(It also never was a choice: see delta 11.)* |
| 11 | **Travel mode is chosen per leg**, in the dialog, against the alternative | **NOT SHIPPED** | The shipped `storyCorridorTravel` branches on the *persistent* `S_story.huntMode` toggle and emits a `storyMsg` either way. There was no per-leg choice, no cancel, and no moment at which the two modes were offered side by side. **The report's central mechanic — "the choice is the mechanic" (§VII-B) — is the one thing the layer never implemented.** |
| 12 | **`Math.random()`** drives the encounter roll and the monster pick; **`node.portal`** short-circuits corridor routing; **`storyMove(dir)`** intercepts non-adjacent destinations | **CHANGED / RETIRED** | Both draws moved to the seeded stream `_seededNext()` (§VM-01-B, now hard invariant #6). `portal` was removed by §CELL-13 — the 3 remaining hits are tombstone comments. `storyMove` = **0**; movement is `cellMove` over the `MOVER:CORE` kernel. |

### III-A. The dialog that was built and never shown

The report's §VI and both execution traces turn on a modal the player opens, reads, and clicks. At
`32c10c5` that modal exists in full — `#story-corridor-overlay`, `#corridor-card`, the header
*"⚡ Time-Warp Footpath"*, the From/To/Road rows, and three buttons whose labels the report quotes
correctly down to the emoji (`🎯 Hunt — roll encounter`, `⚡ Warp — instant, safe`, `✕ Cancel`).

Every JavaScript reference to it in that build is one of three things: two bulk *close-all* arrays,
and a single `classList.remove('visible')`. **Nothing ever adds `visible`.** No handler is bound to
any of the three buttons; `corridor-from-name` and `corridor-encounter-rate` are never written.

The overlay was therefore dead markup from the first surviving commit. This is the same verdict
§TIMELESS-01 later recorded for the Stalk modal — *"already never shown — legacy/dead"* — reached
here independently, in the sibling report, about a different screen. *Durable lesson: a design
document cannot distinguish a screen that ships from a screen that is merely **present in the
file**. Only a search for the code that reveals it can.*

### III-B. Node-code resolution — 0 of 26

All 26 codes were written in the retired 26×16 space. **25 are cleanly dead. One is worse:**

| Code | Report says | HEAD says |
|---|---|---|
| `CI` | `num:1`, `city`, "City Streets — Birka", Act 1 | **`num:429`, "Chancery Court — The Officer's Pen"**, `act:NaN` — a live but *entirely different* node |

`CI` passes any *"does this code exist?"* check while every sentence containing it stays wrong —
the §AUDIT-03m hazard class. **Never read a node code off a doc table**; `npm run nodes` →
`docs/maps/node-index.md` is the live reference.

---

## IV. Where the Accuracy Lives

### IV-A. §IV–§V were transcribed; §VII was narrated

The two halves of this document have opposite error rates, and the split is clean:

**Transcribed (§IV Data Architecture, §V Mesh Construction) — no measured error.**

- `WIRE_GLYPH` — all **eleven** entries byte-identical to the shipped table, same order, same glyphs.
- `_routeSegments()` — byte-identical, including the H-first/V-first branch and the corner-`dirs`
  construction.
- The `NODE_COORDS` junction block — all seven coordinates exact, comment structure and all.
- Both `NODE_MAP` sample entries — `CI` (`num:1`) and `MI` (`num:12`) match the shipped file in
  **every** field except the rewritten prose `text` and one compass value (`CI.W`, which the
  report's own §V-2 correctly predicts will be repointed to `J1` when the junction lands).

**Narrated (§VII Execution Traces) — five distinct failures.** Deltas 3, 4, 5, 6 and 7 are all in
the traces: three identifiers with zero commits, a formula missing its notoriety term, a
`pendingBattle` wrong in three of four fields, and a control flow (callback threading) that no
version of the code ever used.

§DOC-02b concluded that *"the half of a document that points at code is the half that is right."*
This report shows the boundary is finer. **§VII points at code too — it names functions, line
numbers, and DOM ids — and it is the wrong half.** The predictor is not whether a passage cites
code; it is whether the author could **copy** it. A table and a function body can be pasted. A
ten-step call sequence must be reconstructed from memory, and memory supplies plausible names
(`corridor-pct`, `isCorridor`, `_corridorOnComplete`) that the file never contained.

*Durable rule for the program: when verifying a design document, weight its tables and function
bodies as evidence and its traces, walkthroughs and sequence diagrams as claims.*

### IV-B. The one surviving line of the runtime layer

`_setActivePath` outlived every other function in §IX. It shipped as a three-field write; at HEAD
it is two lines, `lastCorridorCells` dropped with the mesh:

```js
function _setActivePath(fromCode, toCode, dir) {   // @38195
  S_story.lastExitCode = fromCode;
  S_story.lastExitDir  = dir;
}
```

Its only consumer is the map overlay's gold exit arrow (`mc-exit-active@36911`) — the last item in
the report's own §IX runtime diagram, and the only one still running. The parameter `toCode` is now
unused: a **dead parameter** left by the amputation, and a minor member of the §DX-02n dead-code
family.

---

## V. Corpus Cross-Check — the `CI` Disagreement, Settled

§DOC-02e established that lab reports are a **corpus**: two reports can disagree, and the
disagreement is invisible to any single-report pass. This report and its Layer-9 sibling
(`lab-report-battleground-circuit-path-quest.md`, §DOC-02c) share the same date, the same layer and
an overlapping node table. On `MI`, `J1` and the junction set they agree. On `CI` they do not:

| Source | `CI` is… |
|---|---|
| This report (§IV-1) | `num:1`, `name:'city'`, **"City Streets — Birka"** |
| §DOC-02c's report (Appendix A) | **"The Thieves' Den"** |
| `32c10c5` (2026-05-24) | `CI:{ num:1, code:'CI', name:'city', label:'City Streets — Birka' }` |

**This report is right.** "The Thieves' Den" was never a node label — it was
`HUNTING_GROUNDS['city'].displayName`, an entry in the very table §DOC-02c's report calls "the
architectural backbone." Its Appendix A is a **mixture**: mostly node labels, at least one
loosely reworded (`AL` "Visby Dark Alleys" vs the shipped "Visby Approach Alley"; `BQ` "Weimar
Forge District" vs "Blacksmith Quarter — Weimar"), and `CI` taken from the parallel terrain table
altogether. §DOC-02c's verification pass reported the conflict faithfully — *report says Thieves'
Den, HEAD says Chancery Court* — but had no second source to resolve it, so the conflation survived
into a shipped §DOC-02 output.

Two program corrections follow:

1. **§DOC-02c delta 7 is too strong.** It states the quest→target coupling "has no data to run on
   and never did." Correct about the *fields*: `targetTerrain` and `targetKeys` have 0 hits, ever.
   But the **mechanism shipped**, deriving its data instead of declaring it —
   `_getQuestTargetKeys()` at `32c10c5` walks active quests to `NODE_MAP[q.activateNode].battle.key`
   and `_stalkedMonsterPick` applies a `BOOST = 6` to those keys. Principle 3 ran; it just never had
   an authored surface. *A missing field is not a missing feature.*
2. **HEAD is the wrong instrument for a claim about the past.** Both corrections above came from
   reading `32c10c5`, not HEAD. §DOC-02e taught that the delta table runs both ways; this pass adds
   that it also runs **backwards in time** — and that `git log -S` finding zero commits proves
   non-existence, while a symbol being absent at HEAD proves nothing about 2026-05-21.

---

## VI. Defects Filed

1. **§AUDIT-03x — 172 of 416 nodes can never be arrived at, blocking 774 quests.** Traced from this
   report's §VIII Step 2 rule, *"no two nodes should share the same (r, c)."* That rule was
   **deliberately retired** by §WALK-1.5, which merged 1°-collided cities into shared **locales**:
   `const CELL_GRID@9865` maps each cell to an *array* of codes, `list[0]` being "the node you
   arrive at" and the rest "intra-cell sub-locations." Measured: **416 nodes occupy 244 cells**, so
   **172 are non-primary** (worst cell `32,203` holds **17**). `S_story.currentCode` is assigned at
   exactly two sites — `S_story.currentCode = destCode@28525`, where `destCode = res.destCodes[0]`,
   and the respawn line `checkpointNode || 'LHR'@26142` — so **a non-primary code can never become
   `currentCode`**, and its `text`/`npc`/`battle`/`loot`/`sleep` never render. Because
   `_uqfActivateAtNode(node, indexFresh)@30293` keys on `node.code`, **1,260 quests carry an `activateNode` on a
   non-primary node; 486 are already held by the §AUDIT-03e guard, leaving 774 across 135 nodes that
   would activate on arrival and cannot.** Affected nodes include `BK` (89 quests, sharing a cell
   with the starting node `LHR`), `WM` (312, behind `ERF`) and `HCA` (behind `WG0`). The waypoint
   system already knows — `storyWaypoint`/`_travelTick` accept arrival **by cell** precisely because
   "co-located locale nodes share a cell" — so the player is told *"You have reached the waypoint:
   \<label\>"* for a node the engine then declines to render. The MUD path is honest about it
   (`locales share this ground@10220`); the browser path is not. **Design call:** aggregate
   sub-location quests into the primary's arrival, or give the primary a surface for entering its
   locale siblings. Overlaps §AUDIT-03d — that row's staging decision should be made knowing 774 of
   its quests are unreachable for a second, independent reason.

2. **§DX-02n (new member) — `_setActivePath`'s `toCode` parameter is dead.** Passed at the single
   call site, never read in the two-line body (§IV-B). One-line cleanup; belongs with the
   `check:deadconsts` phase.

---

## VII. What the Report Got Right

- **Every data structure and algorithm it specified shipped exactly as written** (§IV-A). For a
  pre-implementation design document that is the strongest possible result, and it held for the
  subsystem's entire 24-day life.
- **The junction-as-cognitive-anchor argument.** J1–J7 shipped as specified — named, contentless,
  purely orienting. The *design* was abandoned, not disproved: §NAV-01's road net solved the same
  legibility problem with continuous roads instead of named midpoints.
- **`NODE_MAP.name` is the terrain key.** The single link between place and monster pool, preserved
  by every later navigation track — the same claim §DOC-02c independently confirmed.
- **Spatial embedding beats a pure abstract graph** (§I). Vindicated far past its own scope: the
  world went from a 26-column abstraction to a real equirectangular projection with a coastline
  raster. The report argued distance should be *felt*; §WALK made it geographic.
- **`_setActivePath` and the gold exit arrow** — specified in §IX, still running unchanged at HEAD.

---

## VIII. Scope Note

Retained as the design record for a subsystem that no longer exists. Its value at HEAD is threefold:
it is the **most accurate surviving specification in the §DOC-02 corpus** at the level of data
structures; it is the corpus's clearest natural experiment in *where* a design document goes wrong,
because the transcribed and narrated halves sit in one file by one author on one day (§IV-A); and
it is the document that settles the `CI` label its Layer-9 sibling got wrong (§V).

---

## References

[1] §CELL-05 / §CELL-10 / §CELL-11A / §CELL-14 — junction abolition and corridor removal
    (`6dea804`, `4207552`, `85cc43e`, `30f18b4`; 2026-06-13 … 2026-06-16).
[2] §WALK / §NAV-01 — navigation-core redesign (90×360 geo grid, `MOVER:CORE`, `ROAD_RUNS`);
    supersedes Layer 9 entirely. `docs/lab-reports/lab-report-nav01-navigable-world.md`.
[3] §DOC-02c — `docs/lab-reports/lab-report-battleground-circuit-path-quest.md`, verified 2026-08-11.
    The Layer-9 sibling; source of the `CI` disagreement resolved in §V.
[4] §DOC-02b — `docs/lab-reports/lab-report-architecture-full.md`, verified 2026-08-11. Origin of the
    "the half that points at code is the half that is right" lesson refined in §IV-A.
[5] §TIMELESS-01 — `docs/lab-reports/lab-report-timeless-movement-hunt-removal.md`, 2026-06-26.
    Records the shipped Stalk modal as never shown — the §III-A verdict, reached independently.
[6] §AUDIT-03l / §AUDIT-03m — dead node codes in docs; `docs/maps/node-index.md` is the live
    reference. Source of the `CI` finding in §III-B.
[7] §CELL-13 / hard invariant #3 — no jump travel; `checkpointNode` respawn is the only warp.

---

## Appendix A — The 26 Node Codes (RETIRED, kept)

Retained verbatim as the 2026-05-21 record. **None resolves to the node named**; `CI` resolves to a
different live node.

**Story nodes (19):** `CI` City Streets — Birka · `MI` Plains & Midlands · `FO` Forest ·
`HL` Highlands · `OC` Open Ocean · `DS` Deep Sea · `IS` Island Shore · `SE` Sewer ·
`VC` Mourne's Castle · `DE` Desert · `DC` Caravan Route · `JU` Jungle · `KT` Camelot ·
`OP` Dragon Palace · `HC` Heavenly Cloud Road · `AR` Arctic Wastes · `HS` Crones' Domain ·
`BE` Beach · `CO` Cosmic Convergence.

**Junctions (7):** `J1` Midlands Road Fork (r5,c12) · `J2` (r10,c4) · `J3` (r9,c3) · `J4` (r12,c8) ·
`J5` (r1,c10) · `J6` (r5,c5) · `J7` (r1,c22). All shipped with `junction:true`; all purged by
§CELL-05/§CELL-14.

---

*© 2026 Paul Richeson — MIT License. See [LICENSE](../LICENSE) for full text.*
