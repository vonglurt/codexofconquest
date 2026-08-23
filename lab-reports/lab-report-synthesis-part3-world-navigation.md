<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->

# Lab Report Synthesis — Part 3: World & Navigation

**Original:** 2026-06-16 · cross-reference of 13 World & Navigation lab reports against `roll2hit-v3.html`
**Verified:** 2026-08-14 (§DOC-02bd) · reference commit `89fa13b` (2026-06-16 12:20:47, 33,721 lines) · HEAD 38,712 lines
**Verdict:** every figure it **borrowed** is exact; every figure it **measured for itself** is wrong. Its account of the world is off by a factor of three, and the reason is a space before a brace.

---

## Abstract

This document read thirteen World & Navigation lab reports beside the live HTML and gave each a three-part verdict — what the report said, what the code looks like now, what still applies. Re-measured 59 days later it splits along an unfamiliar seam.

**Nineteen of its twenty-two `symbol@line` citations are line-exact**, and every number it copied out of a source report is byte-perfect: 781 → 1,683 nodes at 89 % reachability, 20,936 total nodes at 97.9 % junction, 268 zombie J-stubs, 419 clean nodes, 20 Epic Battlegrounds, 11×17 minimap, CHA DC 17. Thirteen transcriptions, thirteen hits.

**Every census it performed itself is wrong, and one of them is wrong by 282 nodes.** It reports `NODE_MAP` as *"127 named content nodes"*; the file it was reading held **409**. The 282 it could not see are not scaffolding — they are Aleppo, Burgos and Ankara, each with `num`, `label`, `act`, node text and live quest chains. They differ from the 127 it did count in exactly one respect: a space between the key's colon and its opening brace. The report then explains the resulting gap with a population that does not exist — *"285 intermediate relay nodes… with minimal content"* — and builds two design rules on top of it.

Its most confident sentence is its least true. **"The stalk/hunt duality is fully live"** was written about an engine in which `storyStalk` occurred **0 times**, the Stalk modal existed as CSS and markup with no code that could ever reveal it, and `targetTerrain` — the field its quest-terrain loop is built on — had zero occurrences at that commit and zero in the file's entire history. What *was* live is the mechanic wearing the other one's name: Hunt mode, which sets the encounter rate to **1.0** on every empty cell.

Underneath the arithmetic, the architecture it certifies has held. `cellMove`, `_bfsGridPath`, `visitedCells`, `IMPASSABLE_CELLS` and the twenty Epic Battlegrounds are all live at HEAD, two months and five thousand lines later. The floor it describes is real. The signpost is the part that was markup.

---

## 1. Intent, inspiration, and what it buys the player

**The intent.** In the four weeks before this document, the game's world model failed twice in opposite directions. First it starved — 89 % reachability, 87 isolated clusters, whole historical cities dark and unreachable by any walking route. Then the repair overshot: `fix-all-broken` cascades spawned elbow junctions to bridge the gaps its own previous pass had opened, and the node count went **781 → 1,683 → 20,936**, of which **20,493 (97.9 %) were `J####` scaffolding with no quest, no NPC and no loot.** Thirteen reports were written across that arc. This synthesis exists to answer, once, which of them still described the world.

**The inspiration** is stated in the oldest of the thirteen and is worth quoting because it survived everything built on top of it:

> *The gap between every possible cell and the 42 that matter is the fundamental design problem of any tile-based world map.*

The Circuit Corridor model's answer was a sparse world **embedded in a real grid**, so that distance is visible and direction is legible. Junction chains were the implementation and they collapsed. The framing did not.

**Why a player cares.** This is the most directly player-facing of the seven synthesis parts, because navigation is the verb the player performs most:

- **§CELL is why the world is walkable at all.** Before it, movement consulted a stored edge list, `_buildNodeExits()` ran on every page load, and pressing *North* could open a dialog because the nearest node was five cells away. After it, one keypress is one cell, adjacency is arithmetic on `(r,c)`, and there is no edge graph left to break. `function cellMove@28345` and `function _enterEmptyCell@28420` are live at HEAD.
- **The world remembers your walk.** `visitedCells` records every cell stepped on and drives the 11×17 fog-of-war minimap. Empty ground is not blank: *"The path continues. No named location marks this ground"* — with the terrain named, the exits listed, and a real chance of an encounter.
- **Free movement became an invariant one commit after this was written.** At the reference commit `cellMove` still refused steps for story reasons — the Convergence shard gate, the Damascus blind-days gate, the Antioch commission gate, the Jerusalem vouch gate. `120d617`, two hours and forty minutes later, is titled *"gate removal"*. **This report is a photograph of the last afternoon on which a quest flag could refuse a step**, which is now Invariant #1: a step is refused for exactly two reasons, off-grid or sea.
- **Twenty Epic Battlegrounds are the report's most durable content**, and all twenty are live. Each is a dead-end node where a named person with a visible wound asks for help in their own voice: *"I'm not asking you to be a woodsman. I'm asking you to go where a woodsman can't."* Every profile, every payment, every return beat verified intact at HEAD.
- **The one idea that did not ship is the one the player would have felt most.** The anti-search primitive — *never make a player wander to find monster X* — was specified as Stalk plus a quest→terrain closed loop. Stalk was CSS. `targetTerrain` was never authored. **§DESIGN-04 is open today for precisely this reason:** 398 monsters, 111 terrains, 416 nodes, and nothing that answers *"where do I find one?"*

---

## 2. Method

Ten instruments, in the order they mattered.

1. **Date it.** `git log --diff-filter=A`; the nearest preceding HTML commit is the reference. HEAD cannot adjudicate a claim about 2026-06-16.
2. **Read the sources as they were.** Eight of the thirteen source reports have since been rewritten by this same verification program. Every quotation was checked against `git show 64b526d:<source>`, never against current text.
3. **Resolve every `symbol@line`** against the reference snapshot by line number, not by search.
4. **Re-derive every count with a pattern proved against the whole block** — this is where it broke, and §5 is why the proof step is not optional.
5. **Separate transcribed from measured.** They have opposite error rates here.
6. **Run the delta both ways** — a spec absent from HEAD may be report-rot or engine-rot.
7. **`git log -S` on every dead symbol.** RETIRED and NEVER-SHIPPED are different verdicts, and this report earns both.
8. **Grep for the code that REVEALS a surface, never the surface's own id** (instrument from §DOC-02f). §6 is that instrument firing on a second, independent target.
9. **Check the report against its SIBLINGS.** §5's contradiction is internal *and* corpus-level: the number it needed is printed in its own Report 11 heading.
10. **Execute the world.** Reachability was re-derived by flooding the reference commit's own `NODE_COORDS`, not by trusting the claim.

---

## 3. Dating — twenty-seven seconds, and a mover that was about to change

| Event | Commit | Time | Δ |
|---|---|---|---|
| The `E`/`W` coordinate orphans are born | `30f18b4` | 09:39:10 | — |
| Reference HTML state | `89fa13b` | 12:20:47 | +2 h 41 m |
| Report file mtime | — | 13:50:20 | +1 h 29 m |
| Report committed | `64b526d` | 13:50:47 | **+27 s** |
| Movement gates removed; orphans die | `120d617` | 16:31:20 | **+2 h 40 m 33 s** |

Twenty-seven seconds from mtime to commit; `64b526d` is docs-only, so the HTML the author read is `89fa13b` byte for byte — **33,721 lines, matching the report's stated baseline exactly.**

The morning's own migration (§CELL-14, *"strip-exit-fields — 2,095 dead fields across 404 nodes"*) left two casualties visible only inside this window: `NODE_COORDS` acquired the keys **`E`** and **`W`** — stripped compass fields re-parsed as node codes, `E:{r:63,c:223}` and `W:{r:65,c:225}`. Zero before `30f18b4`, two at the reference commit, zero after `120d617`. **A six-hour-fifty-two-minute defect, and this document is the only artifact written inside it.** It did not notice them; nothing could have, without diffing the two registries. They are the entire real content of the 411-vs-409 gap that §5 is about.

---

## 4. What held

**19 of 22 `symbol@line` citations line-exact** at `89fa13b`.

| Claim | Cited | Result |
|---|---|---|
| `WORLD_DB` | 5,709 | ✅ |
| `NODE_COORDS` | 8,619 | ✅ |
| `CELL_GRID` | 9,057 | ✅ |
| `IMPASSABLE_CELLS` | 9,066 | ✅ |
| `TERRAIN_ENCOUNTER_RATE` | 9,069 | ✅ |
| `HUNTING_GROUNDS` | 9,075 | ✅ |
| `visitedCells` in `_S_DEFAULTS` | 21,184 | ✅ |
| `_sboLog` flashbang line | 22,880 | ✅ (see below) |
| `EPIC_BOSS_POOL` | 23,982 | ✅ |
| `EB_NPC_DIALOGUE` | 24,024 | ✅ |
| `storyPreFinalBattle()` | 25,660 | ✅ |
| `cellMove(dir)` | 26,002 | ✅ |
| `_enterEmptyCell(r,c)` | 26,154 | ✅ |
| minimap glyph table | 32,722 | ✅ |
| `storyPreBattle(node)` | 32,362 | ✅ |
| `_bfsGridPath()` | 33,105 | ✅ |
| `storyWaypoint()` | 33,153 | ✅ |
| `storyToggleHunt()` | 33,180 | ✅ |
| `_stalkedMonsterPick()` | 33,322 | ✅ |
| `_weightedMonsterPick()` | ~33,280 | ⚠️ 33,286, flagged `~` |
| `ebReturnDone` | ~21,200 | ⚠️ 21,176, flagged `~` |
| grid-bound check | 26,009 | ❌ 26,015, **not** flagged |

**And every transcribed figure is exact — thirteen for thirteen.** 781 nodes / 694 reachable / 89 % / 87 clusters / 497 broken edges; 20,936 total / 20,493 junctions / 97.9 % / 443 named; 268 zombie J-stubs; 419 clean nodes; 20 EB bosses; 20 EB profiles; 500×500 grid; 11×17 minimap; CHA DC 17; road/junction encounter rate 0 with wilds 0.15–0.35 (all seven wilderness terrains fall inside that band); *"35+ Playwright tests"* against a real 39. `_enterEmptyCell`'s hunt branch is described correctly down to the function names it dispatches to.

**The reachability claim holds, re-derived rather than repeated.** Flooding the reference commit's own coordinate set four-directionally from `LHR` reaches **411 of 411**. The invariant the report names as the map contract was satisfied on the day it named it.

**One exact citation with a wrong subject.** *"Flashbang is a bonus action, not a free action. This is enforced in `_sboLog()` at line 22,880."* Line 22,880 is exact and is the flashbang string. `_sboLog` is the **logger**; the enforcement is the guard around it — `if (!S_story.usedMainAttack || S_story.usedBonusAction) { … return; }` — inside `_storyUseFlashbang`. The report cited the message and named the messenger as the mechanism. Harmless here; the same slip in a report someone edits from is a bug.

---

## 5. The census that counted a formatting style, and then explained the remainder

Three passages, one page apart:

> Report 11 heading: *"§CELL-01–§CELL-11 — 11-section grid migration, MUD session layer, **419 nodes**, dead code removal"*
> Report 7: *"`NODE_MAP` has **127** named content entries. `NODE_COORDS` has 411 entries"*
> Summary: *"**126 named content nodes** in `NODE_MAP`, 411 in `NODE_COORDS`. The gap (285) consists of intermediate relay nodes — nodes with `r,c` coordinates but minimal content"*

**Measured at `89fa13b`: `NODE_MAP` holds 409 entries. `NODE_COORDS` holds 411. The gap is two, and both are the `E`/`W` parse orphans from §3.**

The 127 is not invented. It is exactly the count of `NODE_MAP` entries written **`CODE:{`**. The other **282 are written `CODE: {`** — one space — and 127 + 282 = 409. The world had been authored in two styles, and a census pattern written against the older one returned the older one's population.

What the 282 invisible entries actually are:

```js
  ALP: { num:304, name:"city", label:"Aleppo — Storytellers' Quarter", act:1, …
  BGZ: { num:420, name:"city", label:"Burgos — Castilian Royal City",  act:1, …
  ANK: { num:548, name:"city", label:"Ankara — Ottoman Medrese District", act:6, …
```

Aleppo carries the `cai_c2*`/`cai_c3*` manuscript chain. Burgos carries the entire seven-quest El Cid arc — the counting house, the vow-cord at Nájera, the bridge. Ankara carries `ada21_act2`–`act4`. **The report describes the majority of the game's authored content as empty scaffolding.**

Note the direction of the error. The reachability claim is *stronger* than the report knew: it is 411 of 411 real places, not 126 places plus 285 pieces of plumbing.

> **51st instrument — a census is only as good as the pattern that took it, and a data section written in two styles will report the older style's count.** Before quoting a count of a data block, **prove the pattern matches the LAST entry as well as the first**. Newest content is the likeliest to be written in the newest style and therefore the likeliest to be invisible — which is exactly backwards from what a census is for.

> **52nd instrument — when a count leaves a gap, the danger is not the gap, it is the EXPLANATION.** *"The gap (285) consists of intermediate relay nodes"* is not a number that can be corrected; it is a **model**, and the report derives design guidance from it (*"New content nodes should be named nodes in `NODE_MAP`"* — they already were). A wrong figure is an erratum. A wrong figure with a story attached is a false map of the world, and the next author inherits the story. **If you cannot name three members of a residual population, you have not found a population.**

This also fires instrument 9 at maximum strength: the corroborating figure was **inside the same document**. Report 11's own heading transcribes **419 clean named nodes** from a sibling written two days earlier. The report holds 419 and 126 on the same page and reconciles neither.

---

## 6. "The stalk/hunt duality is fully live" — measured at the commit it was written against

Report 2 carries the header **"Still active: Yes — the battleground model and stalk mechanic are live"** and closes *"The stalk/hunt duality is fully live."* At `89fa13b`:

| Component as specified | At the reference commit | Verdict |
|---|---|---|
| `storyStalk` / any stalk entry point | **0 occurrences** | never authored under any name here |
| `#story-stalk-modal` | one `<div>`, two bulk close-all arrays, one `classList.remove('visible')` | **nothing ever adds `.visible`** |
| `.stalk-chip` | 4 occurrences, **all CSS** | no JS emits the class |
| `targetTerrain` / `targetKeys` | **0 at the commit and 0 in the file's entire history** | never had data |
| *"Stalk: guaranteed encounter at a designated battleground node"* | no such site | NOT SHIPPED |
| *"Hunt: probabilistic corridor encounter, ~25 %"* | `effectiveRate = S_story.huntMode ? 1.0 : baseRate` | **inverted** |

The last row is the interesting one. The two-mode design was *probabilistic Hunt* against *guaranteed Stalk*. What shipped is a single mode: `S_story.huntMode` sets the encounter rate to **1.0 on every empty cell**, and dispatches to a function literally named `_stalkedMonsterPick`. **The guarantee shipped; the place it was supposed to be anchored to did not.** Hunt is Stalk without the battleground — the anti-search primitive with the anti-search removed.

The corpus agrees independently. §DOC-02c measured the same source report and found `stalkModal` and its two DOM ids at **0 commits ever**, while §TIMELESS-01 (`7952752`, ten days after this synthesis) recorded the shipped Stalk modal as *"already never shown — legacy/dead"* and deleted the whole family. At HEAD both are tombstones: `// §TIMELESS-01: HUNTING_GROUNDS removed with the Hunt/Stalk feature.@10392` and its `_stalkedMonsterPick` twin at 38,269.

This is instrument 8 firing on a second, independent target: **a design doc cannot distinguish a shipped screen from markup that merely exists in the file.** Four stylesheet rules, a `<div>`, and three correctly-labelled buttons read exactly like a feature. Grep for what *reveals* the surface, never for the surface's own id.

---

## 7. One table, two stale numbers, from two different months

Report 2's current-state table opens:

| Symbol | Report | Measured at `89fa13b` | Where the report's number came from |
|---|---|---|---|
| `WORLD_DB` | *66 terrain entries* | **106** | the count at `32c10c5`, **2026-05-24** |
| `HUNTING_GROUNDS` | *42 terrain → displayName* | **66** | the source report's *"all 42 terrain types"*, **2026-05-21** |

Both rows are real measurements of the file — taken three and four weeks earlier. The coincidence is that **the first row's number is the second row's current value**: `WORLD_DB` was 66 in May, and `HUNTING_GROUNDS` is 66 in June. Two rows, two fossils, one month apart, and they cross.

The `42` has a longer life than the table. It is the source report's node count *and* its terrain count (*"exactly 42 are named nodes"*, *"all 42 terrain types in `WORLD_DB` are covered"*) from a 6,330-line file on a 26×16 grid. **It is also still in the game.** Yael's Level-1 tutorial monologue — the first paragraph of instruction a new player reads — opens `known world has forty-two nodes@10397`, and the Map Shop hands over the Real Map *"all forty-two nodes"*. The world has **416**. Both strings are unchanged since the earliest surviving build, and both are already filed as **§AUDIT-03u**.

So the doc-side symptom and the engine-side symptom are the same fossil: **a constant that was true when it was written, in a document that outlived the world it counted.**

---

## 8. What is RETIRED — the guidance, not the facts

Reports 5–9 describe the graph-repair toolchain accurately. Every claim checks out in `wbapi-server.js` at the reference commit — `fix-all-broken` (5 sites), `fix-bidirectional` (3), `rip-and-connect` (9), `reweave-all` (7), `layout/solve` (4), `layout/apply` (4), `wither` (56), `derelict` (14), the P0–P8 phase banners (21), and even the `--no-wither` flag, which is real: `emit('[p7] skipped (--no-wither)')`. **Instrument 7's verdict is RETIRED, not NOT SHIPPED**, and the distinction matters — these reports were true.

They are no longer usable, and the failure mode is loud:

| Guidance | At HEAD |
|---|---|
| *"Run MegaReWeave after any bulk node addition"* | `POST /api/graph/reweave-all` → **HTTP 410**, body deleted §WALK-3 Inc 3 |
| *"`rip-and-connect` for stray node relocation"* | **HTTP 410** — *"reachability is now a terrain-field land flood"* |
| *"The three repair tools still exist in `wbapi-server.js`"* | `fix-all-broken` **0**, `fix-bidirectional` **0**, `rip-and-connect` 410 |
| *"The wither-pass lives in MegaReWeave Phase P7"* | `wither` **0**, `derelict` **0**, P0–P8 **0** |
| *"Coordinates should stay well within (10–490, 10–490)"* | `const GEO_PROJ@9902` = `{ ROWS: 90, COLS: 360 }` — **row 490 does not exist** |
| *"`_enterEmptyCell` rolls `Math.random()`"* | `_seededNext()` since §VM-01-B — invariant #6 |

The 500×500 row is the one that would actively mislead. The report's own world occupied rows 10–188 and columns 207–230 — a 179×24 sliver of a 250,000-cell grid — and the advice to leave headroom to row 490 is now a coordinate that cannot be represented.

Report 13's node codes fail the same way, and the §DOC-02d/§AUDIT-03m lesson applies exactly: **the codes are shorthand, the content is the identifier.** *"Nine new nodes"* names seven, of which only `DFL` and `DA3` existed at the reference commit; `OW`, `SK`, `SB`, `LD` and `BN` are **0 there and 0 at HEAD**. But Saltwick, Dunfall, the Bilge Mystery and Roen's escort **all shipped** — as `MME`, `DNF`, `MS` and the ALP/NIS/TIF chain. *"Ben Barleigh"* is the one name with 0 occurrences anywhere, ever.

---

## 9. What still applies

- **Coordinate distance is narrative distance.** The report's best sentence and its most durable: do not place two nodes adjacent if they should feel far apart. `NODE_COORDS` is canonical; `CELL_GRID` is derived.
- **§CELL is the navigation architecture and has not moved.** `cellMove` is the only movement primitive, `_bfsGridPath` the only pathfinder, adjacency is arithmetic. No junctions, no stored exits, no `N/S/E/W` — and `check:invariants` I1/I2 now *fails the build* if a junction node reappears.
- **`IMPASSABLE_CELLS` is a Set, not a node.** Blocking a cell means adding its `"r,c"` string. Never a node with `battle:null` — and never quest state, which is Invariant #1.
- **Terrain inference by majority vote of named neighbours** (`§CELL-04`) is the fallback for empty ground and drives encounter rate and monster pool. It is not authoritative for content: authored content is a `NODE_MAP` entry.
- **`road`/`junction` encounter rate 0 is intentional.** Roads are safe passage; wilds are not. Preserved at HEAD.
- **The five-part Epic Battleground pattern is canonical**: a named person with a visible wound → an honest warning → a payment → one deadly-tier boss → a return beat. All 20 live. The moral holds — *the NPC tells you the risk accurately, and paying more does not make it safer.* One correction to the spec: the negotiation is a real CHA DC 17 check, but `const canNegotiate@30268` is `paymentCeiling > paymentFloor`, and **16 of 20 contracts have ceiling == floor**, so the button renders at four battlegrounds (→ **§EPIC-03**).
- **Reachability is the map contract, and the tool changed.** `./api.sh reachability` (BFS from `LHR`) is the authority. The report's `GET /api/…` curl forms are historical; author through `./api.sh` (CONTRIBUTING Hazard #7).
- **The three arc templates are live and still the right models** — §SPARK (5-step friendship chain to a mechanical payoff), §WHODUNIT (evidence accumulation at one place), §ALCHEMY (escort along the existing graph, no new nodes). Read them by name, not by node code.
- **RETIRED — do not run:** MegaReWeave, `rip-and-connect`, `fix-all-broken`, `fix-bidirectional`, the wither and derelict passes, and any coordinate advice framed against a 500×500 grid.

---

## 10. Delta table

| # | Claim | Verdict | Evidence |
|---|---|---|---|
| 1 | 22 `symbol@line` citations | ✅ **19 exact**, 2 near-miss (flagged `~`), 1 unflagged | resolved at `89fa13b` |
| 2 | HTML baseline 33,721 lines | ✅ exact | `git show 89fa13b` |
| 3 | 13 transcribed source figures | ✅ **13/13 exact** | 781/694/89 %/87/497/1683 · 20,936/20,493/97.9 %/443 · 268 · 419 · 20 · 20 · 11×17 · DC 17 |
| 4 | `NODE_COORDS` 411 entries | ✅ exact (stated twice) | — |
| 5 | 100 % reachable from `LHR` | ✅ **411/411**, re-derived by flood | stronger than claimed |
| 6 | `NODE_MAP` "127 named content nodes" | ❌ **409** | 127 `CODE:{` + 282 `CODE: {` |
| 7 | Summary "126 named content nodes" | ❌ **409**; contradicts its own body | 126 vs 127 vs 419, one document |
| 8 | "The gap (285) is intermediate relay nodes" | ❌ **gap is 2**, both `E`/`W` parse orphans | the population does not exist |
| 9 | `WORLD_DB` "66 terrain entries" | ❌ **106** | 66 is the 2026-05-24 value |
| 10 | `HUNTING_GROUNDS` "42 terrain entries" | ❌ **66** | 42 is the source report's 2026-05-21 value |
| 11 | "stalk mechanic is live" / "duality fully live" | ❌ **`storyStalk` 0; modal is CSS + markup only** | nothing adds `.visible` |
| 12 | Quest-terrain coupling via `targetTerrain` | ❌ **NOT SHIPPED** — 0 at commit, 0 in all history | corroborates §DOC-02c |
| 13 | "Hunt ~25 % probabilistic" | ❌ **`huntMode` sets rate to 1.0** | the guarantee is Hunt's |
| 14 | `_enterEmptyCell` dispatches on `huntMode` | ✅ exact, incl. both function names | — |
| 15 | `TERRAIN_ENCOUNTER_RATE` road/junction 0, wilds .15–.35 | ✅ exact | 7/7 wilderness terrains in band |
| 16 | EB "5-field NPC profile" | ⚠️ **13 fields**; the five named are the first five | prose says "…", table says "5 fields each" |
| 17 | EB negotiation floor/ceiling on each | ⚠️ **4 of 20**; 16 have ceiling == floor | `const canNegotiate@30268` → §EPIC-03 |
| 18 | Flashbang "enforced in `_sboLog()` @22,880" | ⚠️ **line exact, wrong function** | guard is in `_storyUseFlashbang` |
| 19 | Report 13's "nine new nodes" (7 named) | ❌ **5 of 7 codes never existed**; content shipped elsewhere | Saltwick=`MME`, Dunfall=`DNF`, Bilge=`MS` |
| 20 | "Ben Barleigh" | ❌ **0 occurrences, ever** | — |
| 21 | MegaReWeave / repair toolchain | ⚠️ **accurate then, RETIRED now** | `reweave-all` + `rip-and-connect` → **410** |
| 22 | `--no-wither` flag | ✅ **real at the reference commit** | `emit('[p7] skipped (--no-wither)')` |
| 23 | 500×500 grid, "stay within 10–490" | ⚠️ **true then; now `{ROWS:90, COLS:360}`** | `const GEO_PROJ@9902` |
| 24 | "35+ Playwright tests in navigation.test.js" | ✅ **39** | — |
| 25 | Movement gates in `cellMove` | ❌ **NOT MEASURED** — the mover consulted quest state | removed by `120d617`, +2 h 40 m |
| 26 | `E`/`W` orphan `NODE_COORDS` keys | ❌ **NOT MEASURED** — live for 6 h 52 m | born `30f18b4`, died `120d617` |

---

## 11. Defects — one filed, three corroborated

**§DX-02bf EXTENDED 🟢 — two more retired repair commands, and the retirement note sits three lines under a runnable block of them.**
That row names `layout-solve --apply`, `fix-bidirectional` and `junction-audit`. Measured here: **`fix-all-broken` and `fix-diagonal` belong to the same set and are documented at 9 live sites** — `docs/api/API-README.md:65`, `:66`, `:282`–`:287`, `:401` and `docs/api/wbapi-help.md:89`–`:90`. Both are **0 occurrences in `js/wbapi-server.js`** while still carried in `api/wb.js` (4 sites each), so the CLI accepts the command and the route is gone. The sharpest site is `docs/api/API-README.md:280–290`: a fenced, copy-pasteable block prescribing `fix-diagonal`, `fix-all-broken` and `fix-bidirectional`, closed **three lines later** by the doc's own paragraph headed *"Retired (§WALK-3)"* — which retires their three siblings and not them. Same class as §DX-02l-FU: a runnable shape inside a fence is what an author copies. **Fix with the parent row:** annotate or delete all five, and 410 the routes that still answer.

**Corroborated, not re-filed:**
- **§AUDIT-03u** — the two player-facing *"forty-two nodes"* strings. §7 traces their provenance to the same 2026-05-21 count this report transcribed.
- **§EPIC-03** — the EB negotiation. Delta #17 independently re-measures the 16-of-20 dominance the row already names.
- **§DESIGN-04** — *"where do I find monster X?"* §6 is the origin story: the anti-search primitive was CSS, so the question has never had an answer.
- **§DX-02m** — the EB negotiation's `Math.random()` d20 is already a named instance.

---

## 12. Conclusion

Part 1 of this series failed by counting its own table. Part 3 fails one step earlier: **it counted the file, with a pattern that matched two-thirds of the file's own formatting.** Thirteen numbers copied out of sibling reports are exact. Five of the seven it measured for itself are wrong, one of them by 282 nodes, and the largest is wrong in the *modest* direction — the world was three times bigger and healthier than the document claims.

The instructive part is not the arithmetic but what came after it. Faced with a 285-entry residue it could not name, the report did not flag it; it **explained** it, and turned the explanation into design guidance. A wrong number is an erratum. A wrong number with a plausible story attached is a map, and the next author walks on it.

It is worth being fair about what it got right, because the list is long: nineteen exact citations, thirteen exact transcriptions, a reachability claim that re-derives *stronger* than stated, an encounter-rate table verified band by band, and an account of `_enterEmptyCell` correct down to both dispatch targets. Nothing about the toolchain chapters was wrong when written — they are retired, which is a fate, not a defect.

And the one certainty it stated most loudly is the one that was never there. *"The stalk/hunt duality is fully live"* was written about four stylesheet rules and a `<div>` nothing could reveal. The mechanic meant to stop a player wandering in search of a monster was itself the thing that was never found — a joke the engine has been telling at our expense for eighty-four days, since **§DESIGN-04 is still open and still asks the same question.**

The floor held. `cellMove` still moves one cell. The minimap still remembers where you walked. Four hundred and sixteen places, and Yael still tells every new player there are forty-two.

---

*§DOC-02bd · verified against `89fa13b` (33,721 lines) and HEAD (38,712 lines) · 2026-08-14*
*Synthesis Part 3 of 7 · Next: Part 4 — Monsters & Fishing*
