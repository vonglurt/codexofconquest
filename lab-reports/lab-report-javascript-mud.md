<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->
# Lab Report — The JavaScript of `roll2hit-v3.html`: Layers, Traces, and the MUD Client

**Original:** 2026-07-16 · subject `roll2hit-v3.html` @ `43bd09c` (37,271 lines · `ENGINE_VER = 'r2h-3.104.0'`)
**Verified & rewritten:** 2026-08-21 (§DOC-02cj) against HEAD (38,712 lines) — 623 → 352 lines
**Class:** structural read (whole-file code map). Four execution traces: boot, UI, movement, quest acceptance.

---

## Abstract

The file is one `<style>`, one `<body>`, one `<script>`, no build step and no modules. Read naively it is a
monolith; measured, it is stratified into five layers of sharply different engineering quality, and the
boundary between them is a *purity* boundary, not a file boundary.

The original report's thesis was that **the MUD core is the best-engineered code in the file and the only
code in it that is pure** — `moverMove` / `describeCell` / `DUEL` take an injected `world` and return plain
data, inlined byte-identically from `js/mover.js`, `js/rooms.js`, `js/duel.js` and held there by CI parity
scripts, while everything above them reads and writes two module-global state atoms directly.

**That thesis held, and then it moved.** Thirty-eight days on, every structural reading in this document
survives, all 37 named symbols resolve, and **three of its four open questions have been answered by
shipped work that adopted its diagnosis** (§VI). What did not survive is its arithmetic: **four of eight
census figures are wrong**, two of them by exactly 17, and one absolute negative is false and was false on
the day it was written (§V-C). *The document is more reliable about the engine than it is about itself.*

---

## I. Method

Line numbers in the original were scored against the **parent build**, not HEAD: `43bd09c` is docs-only, so
`git show 43bd09c:roll2hit-v3.html` is byte-identical to the file the author read, and no commit touched the
HTML between 2026-07-13 and 2026-07-18 — the report's stated date (07-16) and its cited commit (07-14) are
the same file. Counts were re-derived with the real parser (`js/wbapi-core.js`, `W.load(...)`), never a line
regex. Behavioural claims were **executed in a browser at both builds**, because reading source cannot tell
a painted branch from an unreached one.

| Instrument | Result |
|---|---|
| Cited line numbers vs parent build | **118 / 119 byte-exact** |
| Named symbols resolving at HEAD | **37 / 37** |
| Census figures vs real parser | **4 / 8 wrong** |
| Behavioural claims re-run in browser | 4 checked — 3 confirmed, 1 refuted |
| Acceptance surface `npm run test:mud` | **RED 267/2** — both in the `[D]` idle-TTL block (§DX-02ca), unrelated to this report |

---

## II. Intent, and what it buys the player

This report was written to answer a question nobody had written down: *how does this thing actually work?*
Its inspiration is the MUD tradition it borrows from — a world you move through by typing `n`, described in
prose, with no map you did not walk. Three of its readings are load-bearing for **playability**, not merely
for architecture:

- **Deterministic rooms.** `describeCell@10150` hashes prose from coordinates via `__roomHash`, so a cell
  looks the same on every visit, on the server, and in tests, and **nothing is stored** for 32,400 cells.
  The player gets a world that remembers itself without a save file that grows.
- **Exits and signage are computed, not authored.** `__roadDestination@10080` walks the road net to yield
  *toward Birka (7)*; `__nearestLandmarks@10115` falls back to *Birka lies 4 steps north of here.* An empty
  field can therefore locate itself, which is what makes free movement legible instead of a void.
- **Roads are terrain, not permissions.** `TERRAIN_ENCOUNTER_RATE@9892` sets `road` and `junction` to `0`,
  so highways are safe *because of what they are*. Hunt Mode doubles the rate and `2 × 0 = 0`, so they stay
  safe even while hunting. **Verified live at both builds** (`road: 0`, `junction: 0`, `_default: 0.15`).
  The player is never fenced in — the §NAV-01 Free-Movement invariant is paid for by data, not by walls.

The 43:1 data-to-engine ratio underneath all of it — **11,106 lines of `QUEST_DB` executed by a 258-line
runtime** — is why 2,850 quests could be authored at all. That number is the design justified in one line.

---

## III. The layer model

```
L5  WIRING       parse-time tail (storyEnter();@38272) · keydown · d-pad · sheet tabs
                 DOMContentLoaded (combat sheet only) — fires LAST
                     ↓
L4  RENDER/DOM   storyRender@34567 · _enterEmptyCell@28420 · _mkSection@35320 / _mkCard@35333
                 storyUpdateStatus@36058 · storyRenderQuests@30707 · _updateExitLinks@37513
                     ↓
L3  ENGINE       QuestRuntime@22341 · cellMove@28345 · _travelTick@38034
                 storyCheckQuests@30166 · _resolveQuestUQF@6962
                     ↓
L2  STATE        S (combat sandbox) · S_story (MUD world) · _S_DEFAULTS@23062 = canonical shape
                     ↑ injected into (never read by)
L1  PURE KERNELS MOVER:CORE@9914 · ROOMS:CORE@9985 · DUEL:CORE@10238 · QUEST:CORE (NEW, §VI)
                     ↑ reads
L0  DATA         QUEST_DB · NODE_MAP · NODE_COORDS · MONSTER_POOL · WORLD_DB · GEO_PROJ@9902 (90×360)
```

**The rule that holds:** L1 never reads L2. `moverMove@9937` cannot see `S_story`; `describeCell@10150`
cannot see the DOM. **The rule that holds nowhere else:** L3 and L4 read and write `S_story` as a global,
with no accessor layer, no bus, no reducer. `flag_write` sets arbitrary keys on the global state object by
name — the file's core coupling and its core flexibility in the same three lines.

### The parity contract

Three blocks are fenced by sentinel comments and shared with the Node server, with the contract stated in
the file's own header: *"Edit mover.js, not this copy."* `DUEL:CORE` goes furthest — it ships a hand-written
synchronous SHA-256 (`__duelSha256@10242`) rather than use `crypto.subtle`, so that no environment-specific
crypto API can make client and server disagree. **Purity enforced to the point of reimplementing a hash.**

This is the file's most important engineering decision: *duplicate the source, then mechanically assert the
duplicate never drifts.* It is how a single-file client with no build step still shares real code with a
server. **Verified:** all three twins and all three parity scripts existed at the parent build, and
`check:walk` chained **exactly the six checks the report names, in the order it names them**.

---

## IV. The four traces (all confirmed)

**A. Boot — two disjoint wiring phases, in inverted order.** The `<script>` sits at the end of `<body>`, so
every `#id` exists before it runs. `storyEnter();@38272` is a **top-level statement**: the MUD renders
*during parse*. `DOMContentLoaded` — which wires the combat sheet and nothing else — fires afterward. The
world is on screen before the combat panel has a single listener. This is safe only because `storyEnter`
hides `#main-body`, and it is why the repo's test helpers must never click into story mode: the game is
already there. **Proven in the browser at both builds** — at `DOMContentLoaded`, `#story-panel` already
carries `.visible` and `#main-body` is already `display:none`.

**B. The continue fork.** `storyCheckContinue@23827`, guarded by the one-shot `let _continueChecked@23824`,
returns `true` — *suppressing the render* — if it put a modal on screen. A returning player's world is not
rendered at boot; it renders on Continue. A fresh player's renders immediately.

**C. The `_S_DEFAULTS` merge — a scar worth reading.** `storyLoadSave@23813` runs
`Object.assign(S_story, _S_DEFAULTS(), JSON.parse(raw))`. Defaults go **in the middle**: they backfill
fields the save predates, then the save's real values win. The comment records why — *saves written before a
field existed must not leave it undefined; `cellMove` crashed on such saves.* The `S_story` literal is
explicitly demoted to a seed because it and the defaults had drifted, and the drift was the bug.

**D. Movement — the cleanest path in the file.** `cellMove@28345` is a thin caller: the kernel decides
(`Mover.move` → `{ok, destKind, terrain, encounter}`), the caller mutates. `_travelStepping@28347` is the
discriminator that lets one function mean two things — *a user's `N` means "stop", the loop's `N` means
"step"*. Auto-travel (`_travelTick@38034`, a 120 ms `setTimeout` chain) wraps its own step in `try/finally`
so a throw cannot leave the flag set, and **verifies progress positionally** rather than trusting that its
own `cellMove` succeeded. Movement does not advance the clock (§TIMELESS-01): **walking is free.**

---

## V. Delta table — spec → measured

### A. Census (the failure surface)

| Claim | Report | Measured at parent | Verdict |
|---|---|---|---|
| File size | 37,271 lines | 37,271 | ✅ byte-exact |
| `QUEST_DB` entries | 2,850 | 2,850 | ✅ |
| `IMPASSABLE_CELLS` | 4,790 | 4,790 (live run) | ✅ |
| `GEO_PROJ` | 90 × 360 | 90 × 360 | ✅ |
| `storyRender(` · `storyAutoSave()` sites | 52 · 62 | 52 · 62 | ✅ |
| `check:walk` chain | six checks | six, same order | ✅ |
| **`NODE_MAP` nodes** | **401** | **418** | ❌ short by 17 |
| **UQF-1.0 quests** | **2,803** | **2,820** | ❌ short by 17 |
| **Legacy stragglers** | **47** — math_01–05 + 30 blq | **30**, blq only | ❌ and the arithmetic never closed: 5 + 30 = 35 |
| **`ROAD_CELLS`** | **400** | **411** (live run) | ❌ |
| **`DUEL:CORE` end** | 10212 | **10209** | ❌ off by 3 |

**The 17 is a fingerprint.** Two independent figures understated by exactly the same amount is not two
mistakes; it is one stale pair copied forward from an earlier document. The five `quest_math_*` quests do
exist — they simply carry `schema:'UQF-1.0'` like everything else, so they were never stragglers.

### B. The abstract contradicts its own inventory

The abstract's headline is *"~76% data and ~24% code."* Summing the report's own §I geography table gives
**~54% data + markup / ~46% code** (markup 5,262 · data 14,907 · code 17,015 of 37,184 tabulated lines). No
reading of the table produces 76/24. **Believe the section that cites line numbers**: the table is sound and
the abstract's ratio is not. *The inventory earns trust; the summary does not — even one page earlier.*

### C. ❌ The negative that is false, and was false on the day

> *"There is no free-text input anywhere in the story UI — nothing player-typed reaches the DOM at all,
> via `main` or otherwise."*

The author checked exactly one function (`storyCreateCustomQuest@38130`, correctly: it constrains a
`<select>` to a `WORLD_DB` key) and generalised from it. **A negative claim about a resource is a census of
its writers.** The census finds two, and both live *inside `storyRender`*, in the very special-case region
§VII of the original describes — and the report **names both features by name in its own §VII diagram**:

- `entry42-textarea@34647` — *"Write Entry 42, or leave this blank."*
- `sg-secret-input@34778` — *"Type your secret here..."*

The Entry 42 text is not merely read; it round-trips. `entry42-write-btn@34649` stores it to
`S_story.entry42Text`, `storyAutoSave()` persists it to `localStorage`, and `storyJournalToggle@30654`
renders it back through **`e42JovDiv.innerHTML`@30682**, where `entry42Text.replace@30680` converts `\n` to
`<br>` — the tell that the sink is markup, not text.

**Executed in the browser, at the parent build and at HEAD, identically:** with `entry42Text` set to
`<img src=x onerror="window.__PWNED=1">HELLO`, the `<img>` **materialised as a real DOM element** and the
`onerror` handler **ran**. Not a painted branch — a live one, in both builds.

**The verdict is narrow and should stay narrow.** This is a single-player local file: the only person who
can type into that box is the player, and the only DOM they reach is their own, so the original's
*conclusion* — the `_mkCard` `main` path is not an injection path — stands. What fails is the universal
negative used to close the question, and one real player-facing consequence follows from it: **a player who
writes `<` or `&` into Entry 42 has their own journal entry silently mangled**, permanently, in a feature
whose entire point is the byline *"by you"*. Filed as **§DX-02do**.

### D. Softened, not withdrawn

`_rollSkill@22242` is labelled *"Pure roll"* while consuming the one-shot iodine buff. The original called
the file's purity vocabulary "wrong" here. It overstates: the same comment discloses the side effect in its
own next sentence — *"the one-shot iodine buff (consumed here, exactly like the legacy resolver)"*. The word
`Pure` is loose; the comment is not misleading. **The side effect is still there at HEAD**, so the
observation survives — only its severity is corrected.

---

## VI. What shipped because of this report

This is the document's real result, and it is unusual enough to state plainly: **three of its four §IX open
questions were answered by named work tracks, every one of them adopting its diagnosis.**

| §IX question | Answer | Track |
|---|---|---|
| Is the migration front still moving? | **Yes** — per-node blocks became data + registries | §VM-01-G1/G2/G2b/G-FU-a…f2; **G3 is the live branch today** |
| Does the gate language want an expression evaluator? | **Yes, and it got one** | §VM-01-F |
| Is the 2,850-quest scan worth indexing? | **Indexed 8 days later** | §VM-01-F-FU `549d6b4` |
| Should quest acceptance become explicit? | **Still open** — no seam has been added | — |

**The scan.** Finding 9 diagnosed a linear pass over all 2,850 quests on every render and recommended *"an
`activateNode → [quests]` index — the same shape `CELL_GRID` already builds for nodes."* On 2026-07-22,
`549d6b4` shipped exactly that. At HEAD, `function storyCheckQuests(node)@30166` opens with
`_uqfActivateAtNode@30137`, whose comment names the track: *"§VM-01-F-FU — `_questsByNode@30135` replaces
the old O(2,850) scan."* The report's §IX had recommended *leaving* it ("leave it, note it"). **Its
diagnosis was adopted and its recommendation overruled** — the right outcome, and worth recording as such.

**The gate language.** Finding 7 observed that the gate had AND-terms plus one OR-group, that `itemsMinAny`
had been minted for exactly one quest (`quest_wm_01`), and that *"if a second single-use term appears, that
is the answer."* §VM-01-F answered without waiting for a second: the evaluators were refactored into a
compiled boolean tree — `{all}` / `{any}` / `{not}` combinators over the same leaf terms — and the
single-use term was **deleted**. `quest_wm_01.completion` at HEAD is literally
`{any:[{flagsAny:[...]},{itemsAll:[...]}]}`. All four surviving `itemsMinAny` hits in the file are comments
recording its removal, so the term is dead by the strictest reading. Guarded by `check:gateast`, a
differential against an independently re-implemented reference interpreter.

**The migration front.** Finding 10 called line 32918 "the migration front" and predicted the per-node
blocks would become node data on the `isFishingLake` pattern. Measured:

| | Parent (2026-07-14) | HEAD (2026-08-21) |
|---|---|---|
| `storyRender` total | 4,361 lines | **1,490** |
| Special-case region | 2,365 lines | **753** |
| `node.code === '` in region | 77 | **25** |
| `node.code === '` file-wide | 130 | **95** |

Stated honestly: of the 52 comparisons that left the region, **35 left the file entirely and ~17 relocated**
into the `const NODE_PANELS@31318` / `const NODE_HOOKS@34190` / `NODE_VERBS@6875` registries. That is migration, not
deletion — which is precisely what the report predicted.

**And a fourth kernel.** The report's central complaint was that only the MUD core is pure. On 2026-07-22 —
six days later — `9f10bfe` added `js/quest.js`: *"§VM-01-D: QUEST:CORE — the fourth kernel, host-injected."*
`createQuestRuntime(host)@22180` now takes an injected host, `_rollSkill@22242` reads state through a
`getState` fence rather than touching `S_story`, its d20 draws a seeded stream so a roll is reproducible
from a save, and `check:questparity` joined `check:walk`. **The report's L1/L3 coupling thesis is now one
layer less true, in the direction it wanted.**

---

## VII. `storyRender` — the file's tension, in one function

Still two programs stacked, still split at one line — `Section-based UI rendering@35319`. Above it, per-node
imperative special cases. Below it, a clean two-primitive builder: `_mkSection@35320` returns `{sec, body}`,
`_mkCard@35333` builds a card from a plain options object, and sections append in fixed order (FISH ·
ENCOUNTER · QUESTS · LOOT · REST · TOURNAMENT · WORLD). A whole feature is about eight lines, because
`node.isFishingLake` is **data** — add the flag, the node gets a fishing card.

The epilogue is the real state machine, and its ordering is load-bearing:
**status → quests → message → journal → save → victory → maps → exits.** Autosave lands *after* quest
mutation and *before* the map redraw, so the save always reflects the quests the arrival just activated.

**DOM contracts encoded in sibling position.** *"Everything physically between `#story-text-box` and
`#story-info-row` is transient"* is expressed in neither a class nor a container — only in sibling order,
enforced by two hand-written sweeps that still exist at HEAD (in `storyRender` and in
`_renderNodeShell@28408`). It has already caused one crash on record (§MATH-01's write to a `#story-content`
that did not exist). This report's own §V-C strengthens the finding: the Entry 42 prompt is inserted with
`insertAdjacentElement('afterend')` on `#story-text-box`, i.e. **live features deliberately write into that
gap**, and rely on being swept. The original proposed a wrapper `<div id="story-dynamic">` to make the
contract explicit and delete both loops. **That suggestion was never filed** and appears nowhere in the repo
but in this document. Filed now as **§DX-02dp**.

---

## VIII. Quest acceptance — the finding that is still true, and still open

**There is no accept step.** No button, no confirmation, no dialogue. Arrival runs `function storyCheckQuests(node)@30166`,
the declarative gate passes, `S_story.quests[id] = 'active'`, and the player learns about it from a
`📋 <title>` fragment in a `·`-joined message strip. *The player is told, never asked. Consent is implicit
in arrival.*

Resolution runs through `_rollCeremonia@7024` → `_resolveQuestUQF@6962`, with the math in one place. Either
way **effort XP is paid once** — `EFFORT_XP_PCT@24426` at `0.25`, guarded so retryables cannot farm it:
*"The attempt was not wasted."* Four statuses exist and two of them mean success: `'done'` (skill-check
pass) and `'complete'` (declarative gate), unified only at the gate.

Both paths end by re-entering the render, so **every quest resolution re-runs the render, which re-runs the
activation pass**. That is the file's fundamental loop shape — *state changes → render everything → rescan
everything* — immediate-mode rendering by hand. It is also why quest chains work with no chaining code: a
quest that unlocks another gets the successor activated by the very render its own resolution triggered.

Whether implicit acceptance is a feature (frictionless) or a gap (the player never agrees to anything)
remains a **design call**, and the code still has no opinion and no seam where consent could be inserted.
Adding it means adding a stage, not editing a line. This is the one open question the report left that the
repo has not answered.

---

## IX. Findings (verdicts)

1. ✅ **The kernels are the file's best code**, shared by byte-identical inlining plus CI parity assertions.
   **Now four, not three** — `QUEST:CORE` joined them six days after this was written.
2. ✅ **`cellMove` is the model the rest of the file does not follow.** Thin caller, kernel decides.
3. ✅ **Two disjoint wiring phases, in inverted order.** Proven in the running game at both builds.
4. ✅ **Two disjoint state atoms**, bridged only at `_startStoryBattle@38259`. *Two games in a trench coat,
   and the trench coat is that bridge.*
5. ✅ **`_S_DEFAULTS@23062` is authoritative; the `S_story` literal is a demoted seed.**
6. ✅ **The 43:1 data-to-engine ratio is the central achievement** — though the *file-wide* 76/24 split
   quoted in the abstract is contradicted by the report's own table (§V-B).
7. ✅→**ANSWERED.** The gate language had no boolean nesting. §VM-01-F gave it `{all}/{any}/{not}` and
   deleted the single-use term.
8. ✅ **Quest acceptance is implicit and unconsented.** Unchanged; still a design call (§VIII).
9. ✅→**FIXED.** The 2,850-quest per-render scan was real, and was indexed 8 days later by §VM-01-F-FU.
10. ✅→**MOVING.** `storyRender` is still two programs; the front has advanced 77 → 25 comparisons.
11. ✅ **DOM contracts are encoded in sibling position.** Both sweeps still live; **NOT FILED until now**
    (§DX-02dp).
12. 🟡 **`_rollSkill` is labelled "Pure roll" and consumes the iodine buff.** True at HEAD; the original's
    severity is corrected — the comment discloses it (§V-D).
13. ❌ **NOT SHIPPED — retained.** *"No free-text input anywhere in the story UI."* False on the day, in two
    places the report itself names, and disproven by execution (§V-C). → **§DX-02do**.
14. ❌ **Four census figures wrong**, two by exactly 17 (§V-A).

---

## X. Reading map

| To understand | Read |
|---|---|
| Boot order | `storyEnter();@38272` → `storyEnter@24386` → `storyCheckContinue@23827` |
| MUD movement | `MOVER:CORE@9914` → `_moverWorld@9970` → `cellMove@28345` |
| Room description | `ROOMS:CORE@9985` → `describeCell@10150` → `_enterEmptyCell@28420` |
| Auto-travel | `_travelTick@38034` → the halt guard at `_travelStepping@28347` |
| Quest engine | `BIT_CONTRACTS@21970` → `createQuestRuntime(host)@22180` → `QuestRuntime@22341` |
| Quest activation | `_questsByNode@30135` → `_uqfActivateAtNode@30137` → `function storyCheckQuests(node)@30166` |
| Quest resolution | `_rollCeremonia@7024` → `_resolveQuestUQF@6962` · retry `_ceremoRetryBlocked@6806` |
| UI generation | `Section-based UI rendering@35319` → `_mkSection@35320` / `_mkCard@35333` |
| State shape | `_S_DEFAULTS@23062` (authoritative) |
| The free-text path | `entry42-textarea@34647` → `entry42Text.replace@30680` → `e42JovDiv.innerHTML@30682` |

**Parity commands:** `npm run check:walk` (now **16** gates, not the six of 2026-07) ·
`npm run check:duelparity` · `npm run test:mud`.

---

*Report ends. Verified §DOC-02cj, 2026-08-21 — 118/119 line numbers byte-exact, 37/37 symbols live,
four census figures wrong, one negative refuted in the running game, and three recommendations shipped.*
