<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->

# Lab Report — Page Generation: Quests, Waypoints, and Mission Bits
### Architectural review of the Story-Mode rendering pipeline in `roll2hit-v3.html`

| | |
|---|---|
| **Written** | 2026-07-07 20:28 |
| **Author's build** | `125ef7c` — 36,192 lines, 5,305,672 bytes (both figures byte-exact) |
| **Verified** | 2026-08-18 (§DOC-02ca) against HEAD `a029d5b` — 38,712 lines |
| **Scope** | how a story "page" is produced from `NODE_MAP` + `QUEST_DB`, and how the **quest**, **waypoint** and **mission-bit** subsystems interlock to drive it |
| **Companion** | `worldbuilder.html` (data-layer editor; port-1367 WBAPI) |

---

## Abstract

Story Mode has no templates, no virtual DOM, no router and no server. Every page the player
sees — node prose, action cards, quest panel, exits, minimap — is produced by one imperative
function, `storyRender(node)`, which mutates a fixed set of pre-existing DOM slots in place.
Navigation is not URL-driven; it is a coordinate move on a 90×360 world grid whose destination
cell may or may not carry a named node. This report traces the pipeline
(`cellMove → storyRender → tail synthesis`) and then the three data-driven subsystems that make
the page *stateful*: the Universal Quest Format (UQF-1.0) runtime, the waypoint navigation-target
mechanism, and the mission-bit dual-ontology token system.

**Thesis.** These are not three features. They are three positions in one closed loop —
*completion writes flags → flags open gates → gates activate quests → quests publish waypoints →
travel re-enters the renderer* — and the whole loop is re-evaluated on **every cell step**, inside
one 18-line synthesis block.

**Verdict at 42 days (§DOC-02ca).** The thesis holds and the loop is real. **Four of the report's
five recommendations shipped within 28 days**, one of them (§VM-01-G) cutting `storyRender` from
4,287 lines to 1,490. Every function body, every gate term and the whole 12-entry bit ISA verify
byte-exact against the author's own build; **349/349 acceptance tests green**. What failed is the
report's *arithmetic* — four census figures were copied from older documents and were wrong the
day they were written, one line citation is a digit transposition that lands on a live line, and
the coupling loop it calls typical is authored on **15 of 2,853 quests**. The one recommendation
that did **not** ship — a flag registry — has a bill: **138 quests, ~148,000 characters of
authored prose, are unreachable at HEAD** because 55 gate flags have no writer anywhere in the
file. §VM-01-E's soft-lock prover diagnosed the cause correctly on 2026-07-22, scoped the repair
out, and no row was ever filed; the gate has printed the list on every CI push since **and exited
`0`**.

---

## I. Introduction

### A. The question under review

*"How do we generate an HTML page, with JavaScript, using the mission bits, quests, and
waypoints?"* This is a page-generation review, not a full-system review (see
`lab-report-architecture-full.md` for that). The object of study is the path from a player action
— walk north, click **Navigate →** — to repainted DOM, and the three subsystems whose state that
path reads and writes.

### B. The governing constraint

One HTML file. No build, no modules, no CDN, no server at play time (mesh multiplayer excepted and
out of scope). Every choice below is downstream of that. There is no `<template>` cloning, no JSX,
no `render()` returning markup — because there is no framework to interpret markup. There is a DOM
built once in the static `<body>` and a function that overwrites the mutable parts of it.

### C. The three nouns

| Noun | What it is | Where it lives |
|---|---|---|
| **Quest** | a pure-data record: `{id, type, schema, gate, bits[], completion, onComplete[], activateNode, waypointNode, passText, …}`. Quests *do nothing on their own* — the runtime executes them. | `QUEST_DB` |
| **Waypoint** | one node code, or `null`, plus a per-quest `waypointNode`. A navigation *target*, not an event; travel toward it is a mechanical grid walk. | `S_story.waypoint` |
| **Mission bit** | a `{flag, label}` pair that on grant both sets `S_story[flag] = true` (the *witnessed event*) and pushes a 🪬 inventory token (the *receipt*). | `S_story` + `inventory[]` |

### D. Why the architecture is a *play* feature, not only a code feature

The loop is what lets the game say **"go here"** and mean it. A quest publishes a destination; the
player clicks once; the character walks the road, encounter rates and all; on arrival the quest
notices, completes itself, writes a flag, and the flag may open the next quest's gate **on the same
frame**. Nothing polls, nothing schedules, nothing waits for a cutscene. That is why a 2,853-quest
world is navigable at all: the player is never asked to remember what to do next, because the world
re-derives it every time they take a step.

The mission bit is the same idea made *legible*. A gate reading `S_story.brynnTrusted` is
invisible; a carved bone token in the pack that says **Brynn Trusted** is a souvenir. One ontology,
two audiences — the engine reads the flag, the player reads the token — and §MBIT-02 then made the
token spendable **without** un-witnessing the event behind it, which is the difference between an
inventory and a memory.

---

## II. Method (§DOC-02ca)

1. **Parent build first.** Line citations were read against `125ef7c` (2026-07-07 20:16, twelve
   minutes before the file's mtime), not HEAD. The report's stated 36,192 lines / ~5.3 MB match
   that tree byte-for-byte, which fixes the reference frame.
2. **Census by parser, never by regex** — `js/wbapi-core.js` (`W.load(GAME)`), cross-checked by a
   live browser assertion. Two hand-rolled line-shape greps in this pass returned 22/81 for
   `NODE_PANELS`/`NODE_HOOKS` against a true **29/61**; the engine is the authority.
3. **`git log -S <symbol> --all`, no pathspec**, on every symbol the census marks dead — the only
   thing separating RETIRED from NEVER SHIPPED.
4. **Deltas run both ways.** A behaviour the report specified and HEAD lacks is an engine defect,
   not report rot.
5. **Acceptance tests executed**, not cited: `uqf-activatenode-index` · `uqf-node-panels` ·
   `quest-runtime-uqf` · `navigation` — **349/349 green in 3.9 min**.

---

## III. Architectural context

### A. Static data (file-scope `const`)

All narrative data is top-level `const`, readable by every function — no imports, no scope
boundaries.

| Structure | Anchor | At the author's build | At HEAD |
|---|---|---|---|
| `NODE_MAP` — nodes keyed by code: `{num, code, name, label, act, text, npc, battle, loot, sleep, textVariants?}`. `name` is the *terrain key* (`city`, `desert`); `label` is display text. | `const NODE_MAP = {@8425` | 410 | 416 |
| `QUEST_DB` — UQF quests, fenced by `◆◆◆ WORLDBUILDER:QUEST_DB:START/END ◆◆◆` so the editor can slice them out | `const QUEST_DB = {@10615` | 2,839 (2,809 UQF-1.0) | 2,853 (2,823) |
| `WORLD_DB` — terrain key → `{label, icon, monsters:[…]}` | `const WORLD_DB = {@6279` | 106 | 111 |
| `NODE_COORDS` / `ROAD_CELLS` / `SEA_LANES` — the geometry the mover kernel walks | — | live | live |

> **Correction (ledger 13–14).** The original said *"40 terrain keys"* and *"~2,700 UQF quests"*
> (three times). Both were already wrong on 2026-07-07, and both trace to the 2026-05-22
> architecture report — one sentence, copied forward twice. *A number you must derive is a claim,
> whoever writes it.*

### B. Mutable state: `S_story`

One object holds all narrative progress: `currentCode`, `playerR/playerC`, `visited{}`,
`quests{id:status}`, `defeatedBattles{}`, `npcFavorability{}`, `inventory[]`, `waypoint`, `shards`,
`xp` — plus a large flat namespace of boolean **flags** (`saulConverted`, `stoningEvent`,
`entry42Written`, …). Persistence is `localStorage` via `storyAutoSave()`. There are no getters, no
selectors, no invariants: the discipline is entirely in the programmer's head, and the flag
namespace is an *implicit global coupling surface* between quests (§X.B.2, §XII).

> **Correction (ledger 15).** The original said *"a single ~107-field object."*
> `const _S_DEFAULTS = () => ({@23062` returns **485 fields (368 boolean) at the author's build and
> 493 (370) at HEAD** — off by 4.5×, confirmed twice, once in Node and once in the live browser.
> Already tracked as §AUDIT-03bf, which caught `index.md` advertising "All 193" for the same
> function: **the undercount is an artifact of counting keys with a line-anchored regex, and this
> file declares many keys per line.**

---

## IV. The generation pipeline

### A. Overview

```
 player input (D-pad / keyboard / exit-link click / Navigate →)
        │
        ▼
 cellMove(dir)                          function cellMove(dir) {@28345
        │  Mover.move(world,pos,dir) → destination cell
        ├─ named node?  ─ yes ─►  S_story.currentCode = destCode → storyRender(destNode)
        └─ empty cell?  ─ yes ─►  _enterEmptyCell(nr,nc)   (shared shell + encounter roll)
        │
        ▼
 storyRender(node)                      function storyRender(node, prefix) {@34567
   1. sync grid pos + act
   2. paint header slots  (#s-node-num / #s-node-name / #s-node-act)
   3. paint story text    (textVariants flag-substitution + void flavor)
   4. clear stale dynamic siblings between #story-text-box and #story-info-row
   5. per-node presentation: NODE_PANELS (data) → NODE_HOOKS (dispatch) → residual inline blocks
   6. TAIL SYNTHESIS  ◄── the load-bearing block
        storyUpdateStatus()
        questMsgs = storyCheckQuests(node)   ◄── QUEST SCAN
        storyMsg([prefix, lootMsg, …questMsgs].join(' · '))
        storyRenderQuests()                  ◄── quest panel + Navigate/Battle buttons
        storyCheckJournal(node) · storyAutoSave() · storyCheckVictory(node)
        _render{Mini,World,Globe}Map()
        _updateExitLinks()                   ◄── d-pad exits
        _updateWaypointBtn()                 ◄── WP button state
```

### B. Navigation is coordinate-based, not route-based

`cellMove(dir)` delegates the bounds/wrap/sea decision to the shared kernel `Mover.move()`
(`mover.js`, which also drives the MUD harness), applies the single-player side effects, and —
crucially — **only re-renders when the destination cell carries a named node**. Empty cells route
to `function _enterEmptyCell(@28420`, which paints the *same* slots via
`function _renderNodeShell(@28408` so the shell is uniform. Movement is "timeless"
(§TIMELESS-01): only battle, sleep, fishing and rest advance the day clock.

### C. The renderer is an in-place DOM mutator

`storyRender` never returns markup. It reads DOM nodes by fixed `id`, overwrites
`.textContent`/`.innerHTML`, then *removes and rebuilds* the dynamic sibling range between
`#story-text-box` and `#story-info-row` (`// Clear all stale dynamic siblings@34625`) — manual
double-buffering, static shell as frame, dynamic cards as swap. `textContent` carries author prose
(XSS-safe, §DATA-01 residual); `innerHTML` only engine-authored markup.

> **Correction (ledger 16).** The original cited this loop at `:34934`; at the author's own build
> it was at **29934** — a digit transposition onto a live `_mapIcon` line, so *an existence check
> passes while the pointer is wrong*. Precisely what the later `symbol@line` convention (§DX-01e)
> makes impossible: a bare number can be wrong and still resolve; a symbol cannot.

### D. The tail synthesis block is the real contract

Everything narratively *live* happens in eighteen lines, beginning at
`const questMsgs = storyCheckQuests(node);@36041`. This is where the page stops being "prose in a
slot" and becomes "a state machine's current frame": the quest scan runs, its messages merge into
the log stream, the quest panel and exits repaint, the world autosaves. **Every subsystem in this
report converges here, on every step.** Verified unchanged in composition at 42 days.

---

## V. The quest subsystem (UQF-1.0)

### A. Data/engine split

A quest is inert data; `QuestRuntime` is the sole executor. This is the architecture's cleanest
decision: content authors — and `worldbuilder.html` — touch data, never control flow. The legacy
`completeFn` / `completeItems` closures were retired by §ARCH-01 W7d; completion is now
declarative and the runtime is the only code path.

> **Correction (ledger 17).** The original swept a third term into that retirement. `activateCond`
> was **not** retired and is not now — **46 quest entries carry it at both builds**, with two live
> evaluation sites (the activation pass and the Warrant's Board eligibility check). The engine's
> own comment names exactly the two terms that went; the report widened it to three.

### B. The per-arrival scanner

`function storyCheckQuests(node) {@30166` runs two passes inside the tail synthesis:

1. **Activation** — for each not-yet-started quest with `activateNode === node.code`, activate iff
   the declarative gate passes. Emits `📋 {title}`.
2. **Completion** — for each `active` quest with a `completion` clause, complete iff
   `canComplete(id)`. On completion: set status, run `execBits(q.onComplete)`, apply `itemChain`,
   push `✓ {title}` and `passText`, award XP.

It returns a `msgs[]` array the renderer joins into the log. **The engine never touches the DOM —
it produces text; the renderer surfaces it.** That separation is why the runtime is
headless-testable at all.

> **Correction (ledger 20).** The original said the scanner *"iterates all of `QUEST_DB` twice on
> every render (`Object.values(QUEST_DB).forEach` / `Object.keys(S_story.quests).forEach`)."* The
> sentence contains its own refutation — the second expression walks **started quests**, not
> `QUEST_DB`. The risk was real; the multiplier was not.

### C. Declarative gates

`canActivate(questId) {@22193` and `canComplete(questId) {@22205` evaluate objects of typed terms
against state, replacing arbitrary predicates with a fixed vocabulary: `flags` (AND), `flagsAny`
(OR), `notFlags` (NONE), `flagEquals`, `nodes`/`sleptAt`, `questsAttempted`/`questsDone`/
`questsComplete`, `favorMin`, `battles`/`notBattles`, `shardsMin`, `restedAtMin`, `flagsPath`,
`countMin`, `atNode`, `items`/`itemsAll`/`itemsMinAny`. The OR-group inside `canComplete` models
the *"AND(prereqs) ∧ (flag OR battle)"* shape without a boolean-expression language — a deliberate,
legible constraint. All terms verified live; `itemsMinAny` was later superseded by the
`{any}` + `itemsAll` AST form (§VM-01-F) and its acceptance test pins the same truth table.

### D. The bit interpreter

`*execBits(bits, ctx) {@22223` iterates an ordered bit chain, dispatches each `bit.kind` to a bound
handler (`HANDLERS: {@22264`) and warns-and-skips unknowns. The instruction set as the report found
it — **all twelve verified byte-exact at the author's build**:

| kind | effect | 2026-08-18 |
|---|---|---|
| `skill_check` | roll `d20+mod+prof(+iodine+lakeMagic)` vs `dc`; branch to `onPass`/`onFail` | live · 2,635 uses |
| `flag_write` | set/clear `S_story` flags | live · 46 |
| `reward` | xp (→ `_checkLevelUp`), gold, items (→ `mpMintStamp`), knowledge | live · 159 |
| `combat` | `storyPreBattle` with a battle spec | live |
| `narrative` | push a message (`ctx.pushMsg` or `storyMsg`) | live · 120 |
| `item_remove` / `item_check` | remove first exact-name item / record count in ctx | live · 7 |
| `favor` | set/increment NPC favorability (cap default 3) | live · 16 |
| `unlock` | activate listed quest ids | live · 18 (**0 at the author's build** — §BOARD-01-FU6) |
| `mission_bit` | → `_grantMissionBit(flag, label)` (§VI) | live · 2,449 |
| `choice` | Phase-2 stub | **RETIRED as a stub** — implemented `*choice(bit, ctx) {@22319` |
| `_legacy_fn` | escape-hatch closure | live · 124 |
| — | — | **NEW: `cost(bit, ctx) {@22288`** (13th kind, `b905733`, 2026-08-04) |

Two of those rows are the report aging *well*. It called `execBits` "a tiny virtual machine" as a
metaphor; §VM-01 turned it into a literal one — the handlers are generators, `choice` yields
`{ask:'choice'}` to a scheduler, and the ISA grew a `cost` opcode so a branch can be refused for
lack of coin. **Neither `choice` nor `cost` is authored by a single `QUEST_DB` entry yet** (both
appear only in `NODE_HOOKS` chains): the mechanism shipped, the content has not.

### E. The cross-file contract

The worldbuilder mirrors the registry so the editor can only author real, executable bits —
`worldbuilder.html:const OPERAND_CONTRACTS = {@1373` and
`worldbuilder.html:const UQF_BIT_FIELDS = {@1402`, both still exact at HEAD.

> **Correction (ledger 18).** The original called it *"a byte-for-byte mirror of
> `const BIT_CONTRACTS = {@21970`."* Measured: **11 of 12 kinds shared, `required`/`optional`
> identical on all 11 with zero mismatches**, `_legacy_fn` deliberately editor-excluded,
> declaration order different, and the editor carries prose where the engine carries a `validate`
> predicate. The *contract* is exact; the *bytes* are not. Compare contracts before comparing code.

---

## VI. The mission-bit subsystem

### A. Dual ontology on grant

`function _grantMissionBit(@26109` makes a mission bit two things at once, deliberately:

1. **The event** — `S_story[flag] = true`. This is what quest gates read: the fact that something
   happened.
2. **The receipt** — a 🪬 token `{name:'{label} Token', type:'mission_bit', flagRef:flag, sell:0}`,
   idempotent by `flagRef` (re-grant is a no-op). This is the player-visible artifact, and the
   `sell:0` means it can never be vendored into a soft-lock.

> **Correction (ledger 19).** The original said the grant *"is reached only via the `mission_bit`
> handler."* There were **two** call sites at the author's build and **three** at HEAD — the
> handler, the declarative `itemChain` `grantBit` action, and later a VM adapter. The spirit holds
> (every route originates in quest data) and so does the practical claim, because **zero quests
> author `grantBit` even today**: the report described the executed reality and missed the
> authored surface.

### B. Asymmetric spend

`function _takeMissionBit(@26153` is not the inverse of granting. The token always leaves inventory;
the flag is cleared **only if no quest gate depends on it**, determined by
`function _gateFlagSet() {@26133`, a lazily-cached scan of every `QUEST_DB` gate's
`flags`/`flagsAny`/`notFlags`. The rationale (§MBIT-02-E) is that a witnessed event which unlocks a
downstream mission can never be *un*-witnessed, or spending a token could silently re-close an arc.

The report's strongest observation, aged perfectly: **a safety invariant enforced in code rather
than by convention**, with four acceptance tests pinning it — including one asserting the guard
*warns and keeps the flag* on a gate-referenced bit. Byte-exact, comments included, at 42 days.

### C. Role in the system

Mission bits are the **coupling medium** between quest completion and future quest activation.
`execBits` writes flags; `canActivate`/`canComplete` read them. The ontology exists precisely to
make that write/read edge durable and player-legible. §XII is what happens when the edge has a
reader and no writer.

---

## VII. The waypoint subsystem

### A. Publication

`function storyRenderQuests() {@30707` renders, for each active quest carrying a `waypointNode`,
either a **Battle** button if the destination is a combat node or a **Navigate →** button wired to
`storySetWaypoint(code)`, annotated with a live distance/bearing tag —
`const distTag = _wpDistTag(q.waypointNode);@30751`, whose own comment gives the format as
*"(12 steps, NE)"*. The quest *publishes* a target; the player *subscribes* by clicking. **161
quests carry a `waypointNode` at HEAD** (150 at the author's build).

### B. Target state

`S_story.waypoint` — a single node code, or `null`. `function storySetWaypoint(@38146` sets it,
surfaces the story sheet and calls `_travelStart()`.

### C. The auto-travel loop

`function _travelStart() {@38025` → `function _travelTick() {@38034` is a **non-blocking
setTimeout chain** — `_travelTimer = setTimeout(_travelTick, 120);@38061` — never a blocking loop,
which is the only correct pattern on a single-threaded UI. Each tick:

1. **Arrival test** — standing on the waypoint's *cell* (co-located locale nodes share a cell, so
   cell-equality, not just `currentCode`, is checked) → stop, clear waypoint, announce, open the
   quest panel.
2. `_roadGridDir(pos, wp)` picks the next direction by the same **road-weighted routing** as manual
   travel (roads have encounter rate 0 — the road is the safe path, and the loop knows it).
3. `cellMove(dir)` — which **re-runs the entire §IV pipeline**, quest scan included.
4. **Halt** on: blocked step (kernel refused), queued encounter or begun battle, or leaving story
   mode. Any user-initiated `cellMove` also halts travel, at the first line of the function.

Travel state (`_travelTimer`, `_travelStepping`, `_encounterQueued`) is transient module state,
**never persisted** — a reload resumes standing still. A save that resumed walking would be a save
that moved you while you were not there.

### D. Arrival → completion closure

Where a quest's completion gate uses the `atNode` term
(`if (g.atNode && st.currentCode !== g.atNode) return false;@22124` — "completes only while
standing here"), *arriving is completing*: the final `cellMove` re-enters `storyCheckQuests`,
`canComplete` sees `currentCode === atNode`, the quest flips, its `onComplete` bits fire, and any
`mission_bit`/`flag_write` among them may open the next quest's gate **on the same frame**. The
loop closes.

> **Correction (ledger 21) — the report's largest.** It said `waypointNode` completion gates
> *"typically use the `atNode` term."* Measured: **150 quests carried a `waypointNode`, 19 used
> `completion.atNode`, and only 12 had both — 8 %** (15 of 161, 9 %, at HEAD). The mechanism is
> real, correct, tested and *rare*. Not report rot but a **content gap in the game's most
> satisfying interaction** — the click that ends with the journal ticking over by itself. Filed as
> §AUDIT-03bk.

---

## VIII. The coupling model — why these three are one system

```
   ┌──────────────────────────────────────────────────────────────┐
   │  storyCheckQuests (scan)                                     │
   │       │ canActivate(gate reads FLAGS) ───── activate         │
   │       │ canComplete(gate reads FLAGS, atNode) ── complete    │
   │       ▼                                                      │
   │  execBits(onComplete)                                        │
   │       │ flag_write / mission_bit ── WRITES FLAGS ────────────┤ (back to gates)
   │       │ reward / favor / combat / unlock                     │
   │       ▼                                                      │
   │  quest publishes waypointNode                                │
   │       │ storyRenderQuests → "Navigate →"                     │
   │       ▼                                                      │
   │  storySetWaypoint → _travelTick loop                         │
   │       │ cellMove(dir) ── re-enters storyRender ──────────────┘ (re-scan on arrival)
   │
   └── every edge re-evaluated inside the tail-synthesis block, per cell step ──
```

- **Flags** are the shared state — written by mission bits and `flag_write`, read by gates.
- **Quests** are the transition function — gate = guard, `onComplete` bits = action.
- **Waypoints** are the actuator that moves the player so the *next* transition's
  `atNode`/`nodes`/`sleptAt` term can fire.

The synthesis block is the clock edge on which the machine advances — eighteen lines of plumbing,
and the reason the world feels like it is paying attention.

---

## IX. Verification ledger (§DOC-02ca)

Every substantive claim, measured. **34 of 38 named symbols resolve (89 %)**; the four that do not
are the report's own proposals (§XI).

| # | Claim | Measured | Verdict |
|---|---|---|---|
| 1 | 36,192 lines, ~5.3 MB | 36,192 / 5,305,672 bytes at `125ef7c` | **EXACT** |
| 2 | pipeline `cellMove → storyRender → tail synthesis` | all four line citations exact at the parent build | **EXACT** |
| 3 | tail synthesis is 18 lines, `:34157–34174` | exact; composition unchanged at HEAD | **EXACT** |
| 4 | `storyRender` body ~4,200 lines of node-code blocks | 4,287-line function; 123 `node.code === '` tests inside it | **EXACT** |
| 5 | 12-kind bit ISA + effects table | all 12 verbatim, effects correct | **EXACT** |
| 6 | full gate-term vocabulary (18 terms) | all present | **EXACT** |
| 7 | `_grantMissionBit` dual ontology, `flagRef` idempotence | byte-exact, comments included | **EXACT** |
| 8 | `_takeMissionBit` guarded by `_gateFlagSet()` | byte-exact; 4 acceptance tests pin it | **EXACT** |
| 9 | travel = setTimeout chain, ~120 ms/step, 4 halt conditions | `setTimeout(_travelTick, 120)`, all four | **EXACT** |
| 10 | `_wpDistTag` renders "(12 steps, NE)" | verbatim in the source comment | **EXACT** |
| 11 | worldbuilder citations `:1373` / `:1402` / `:1468` | all three exact **at HEAD**, six weeks on | **EXACT** |
| 12 | `choice` is a Phase-2 stub | true then; implemented 2026-08-04 | **RETIRED** |
| 13 | `WORLD_DB` — 40 terrain keys | **106** at the author's build, 111 at HEAD | **WRONG WHEN WRITTEN** |
| 14 | `QUEST_DB` — ~2,700 UQF quests (×3) | **2,809** at the author's build, 2,823 at HEAD | **WRONG WHEN WRITTEN** |
| 15 | `S_story` is a ~107-field object | **485** fields / 368 boolean; 493 / 370 at HEAD | **WRONG WHEN WRITTEN** |
| 16 | sibling-clear at `:34934` | real line **29934**; 34934 is a live `_mapIcon` line | **WRONG WHEN WRITTEN** |
| 17 | `activateCond` retired with `completeFn`/`completeItems` | 46 entries + 2 live readers, then and now | **WRONG WHEN WRITTEN** |
| 18 | worldbuilder registry is a byte-for-byte mirror | 11 of 12 kinds, 0 field mismatches, `_legacy_fn` excluded on purpose | **OVERSTATED** |
| 19 | grant reached only via the `mission_bit` handler | 2 call sites then, 3 now; 0 quests use the alternate | **OVERSTATED** |
| 20 | scanner iterates `QUEST_DB` **twice** per render | once; the second pass walks `S_story.quests` | **OVERSTATED** |
| 21 | `waypointNode` gates *typically* use `atNode` | **12 of 150** (8 %), 15 of 161 at HEAD | **WRONG — and a content gap** |
| 22 | `NODE_MAP` at `:8073+` | declaration at 8070 | **off by 3** |
| 23 | acceptance state of the whole pipeline | **349/349 green, 3.9 min** | **GREEN** |

**The pattern.** Nineteen of twenty-three claims that could be *copied* — function bodies, tables,
the ISA, the gate grammar, the halt conditions, three worldbuilder line numbers still exact six
weeks later — are exact. Every claim that had to be *derived* — a count, a proportion, a line
number reconstructed from memory — is wrong, and wrong on the day it was written. The report's
prose is a reliable witness to code it could see and an unreliable one to arithmetic it could not.

---

## X. Assessment

### A. Strengths (all four confirmed at HEAD)

1. **Declarative data / imperative engine.** Quests are pure data with a fixed bit ISA and a single
   executor. Authors and the editor touch data, never control flow. This is the load-bearing good
   decision and it survived a total format migration.
2. **One executor, one message contract.** The engine emits `msgs[]`; the renderer surfaces them.
   Quest logic never touches the DOM, which is why the runtime is headless-testable and why the
   acceptance suite exists at all.
3. **Cross-file contract integrity.** The editor cannot author a bit the engine cannot execute
   (11/12 kinds, 0 field drift). The `◆◆◆` markers make the data extractable.
4. **Safety invariants in code, not comments.** The `_gateFlagSet` guard and the idempotent
   `flagRef`/`mpMintStamp` grants prevent whole classes of arc corruption structurally.
5. **Non-blocking travel.** No frame is ever starved.

### B. Risks, and what became of them

| # | Risk as filed | Status 2026-08-18 |
|---|---|---|
| 1 | `storyRender` is an Open/Closed violation, ~4,200 lines, hottest function in the file | **LARGELY RETIRED** — §VM-01-G: 4,287 → **1,490 lines**, node-code tests inside it 123 → **27** |
| 2 | the flag namespace is an unbounded implicit coupling surface | **LIVE, AND IT HAS A BILL** — see §XII |
| 3 | full re-scan of the quest DB per cell step | **RETIRED** — §VM-01-F-FU, `549d6b4`; the activation pass is now O(quests-at-node) |
| 4 | idempotency is load-bearing but ambient | **PARTLY FENCED** — `once:` is now a declared field, and a re-render test pins it |
| 5 | presentation/logic interleave: `DAM` sets `saulConverted` during paint | **RETIRED** — the write is now `once:'saulConverted'@31332`, a declared property of the panel |

### C. Quality attributes

| Attribute | Then | Now | Why it moved |
|---|---|---|---|
| Modifiability (data) | ★★★★☆ | ★★★★★ | `NODE_PANELS` extends the data surface from quests to presentation |
| Modifiability (renderer) | ★★☆☆☆ | ★★★★☆ | 4,287 → 1,490 lines; 103 registry entries replace inline blocks |
| Testability | ★★★★☆ | ★★★★★ | 349 acceptance checks across four specs on this pipeline alone |
| Performance | ★★★☆☆ | ★★★★☆ | per-step scan indexed by `activateNode` |
| Reliability | ★★★★☆ | ★★★☆☆ | risk 2 realised: 138 quests unreachable (§XII) |
| Portability | ★★★★★ | ★★★★★ | one file, no build, works offline wherever HTML5 does |

---

## XI. Recommendation outcomes — four of five shipped in 28 days

None of the five required a framework or a build step, and that was the point.

| # | Recommendation | Outcome | Shipped as |
|---|---|---|---|
| 1 | Extract a `nodeCards` data schema — `{when, html\|text, onShow}` evaluated by one loop | ✅ **SHIPPED** (+21 d) | §VM-01-G1/G2 — `const NODE_PANELS = [@31318` (**29 entries**: `when`/`once`/`css`/`html`/`text`) + `const NODE_HOOKS = [@34190` (**61 entries**) behind `function _runNodeHook(@34253` |
| 2 | Index quest activation by node, mirroring the editor's `_questsByNode` | ✅ **SHIPPED** (+15 d) | §VM-01-F-FU `549d6b4` — `function _questsByNode(@37015`, consumed by `function _uqfActivateAtNode(node) {@30137` |
| 3 | A flag registry `FLAG_OWNERS` + collision assertion | ❌ **NOT SHIPPED** — 0 commits, any path, ever | see §XII |
| 4 | Move state mutation out of `storyRender` into a declarative hook | ✅ **SHIPPED IN SUBSTANCE** (+21 d) | the `once:` field; the report's named example (`DAM`) is now `once:'saulConverted'@31332` |
| 5 | A renderer idempotency test | ✅ **SHIPPED** (+21 d) | `tests/integration/uqf-node-panels.test.js:gone on re-render@28`, guarded at ship by a 24-combo golden-DOM diff |

**None of the four shipped under the name the report proposed.** `nodeCards`, `FLAG_OWNERS`,
`_questsByActivateNode` and `onArrive` have **zero commits in any file, ever** — they exist only in
this document. Score the property, not the token: four of five recommendations are in the engine,
and a name census alone would have called all five dead.

> This is the inverse of the failure mode the verification programme usually finds. The report's
> *predictions* are its best section; its *measurements* are its worst. A design document is
> trusted for the wrong half by default.

---

## XII. The recommendation that did not ship, and what it cost

Recommendation 3 asked for a flag registry because *"nothing prevents two arcs from colliding on a
flag name, and nothing documents which quest owns which flag."*

**The collision hazard turned out to be nearly imaginary.** Across 2,495 quest-written flags there
are exactly **two** flags written by more than one quest, and both look like intentional cross-arc
handshakes. The token count is large — **2,615 distinct quest-authored flag names**, against the
report's "~hundreds" — and it has caused no name clash worth a row.

**The ownership hazard was the real one, and it fires in the opposite direction: not two writers,
but none.**

Measured at HEAD, by three independent instruments (a `wbapi-core` walk, a live browser assertion,
and the project's own CI gate):

- **55 gate flags have no writer anywhere in 38,712 lines** — no quest bit, no `_legacy_fn` body,
  no engine assignment, no `once:` panel.
- Transitively, **138 of 2,853 quests (4.8 %) can never activate**, carrying **690 authored text
  fields / ~148,000 characters ≈ 29,000 words** of prose the player cannot reach.
- Four whole arc families collapse: **`nwi` 40 of 45 · `crl` 35 of 40 · `waw` 32 of 40 ·
  `mla` 30 of 35**, plus one `d0209` act already tracked as §DX-02u.

Two failure shapes, both one token wide:

1. **Intra-chain (`waw`, 32 quests).** Every act gates on `wawNNNa<K>`; every act *writes*
   `wawNNNAct<K>Passed`. `waw001_act2: {@14900` waits for `waw001a1`, which nothing sets. Its
   structural twin `cph001_act2: {@15540` gates on `cph001Act1Passed` — the flag act 1 actually
   writes — and chains correctly, which is the proof the convention is right and only the `waw`
   family departed from it.
2. **Inter-chain (`nwi`/`mla`/`crl`, 21 heads).** Each chain's internal rungs are correct; the
   chain-to-chain edges gate on `<chain>Complete`, and **no quest and no engine line ever writes a
   `<chain>Complete` flag**.

**None of that diagnosis is new, and the credit belongs elsewhere.** Recommendation 3 was answered
by something better than it asked for: §VM-01-E built `scripts/check-questgraph.js`, the soft-lock
prover, on 2026-07-22 (`354b20a`, +15 d). `lab-reports/lab-report-vm01e-softlock-prover.md` names
the root cause in one sentence — *"`waw` ×25 / `crl` ×7 / `nwi` ×8 / `mla` ×6 — a systemic
step-to-step flag handoff mismatch… after the first step, the arcs are unreachable and
uncompletable"* — and identifies `voidFluxCleared` and `innDeparted` besides. It was right on
2026-07-22 and it is right today.

**What happened instead is that nothing happened.** That report scoped content repair out
explicitly — *"Fixing the quest CONTENT … is the content-triage pass §6 named as separate — now
scoped to a concrete, deduped list of six items"* — and **no BACKLOG row was ever opened for it**;
`waw`, `nwi`, `mla` and `crl` appear nowhere in `BACKLOG.md`. Meanwhile the gate prints
`written-by-nothing : 50` with the full family breakdown on every `check:walk` and every CI push
**and returns exit 0**, by design: the host-writer fold *"can only ever shrink the candidate list
(never invent a soft-lock)"*, so the survivors are stated to be genuine and the build passes anyway.
For 27 days the prover has been proving the world is not finishable and reporting success. *A
correct, specific, deferred finding with no row against it ages into a live defect.*

**Three things this verification does add.**

1. **The blast radius.** The gate and the report both count *heads* — 47–50. The transitive closure
   is **138 quests and ~29,000 words**, 2.8× larger, and nobody had computed it.
2. **The prover under-counts by seven.** Its host-writer scan credits
   `scripts/check-questgraph.js:// NPC/data mission-bit grant@309` — a regex lifting `missionBit:`
   out of the NPC dialogue data — as a real writer, *"(→ `_grantMissionBit` → `S_story[flag]=true`)"*.
   That call does not exist: **`meta.missionBit` has 209 declarations across 203 distinct flags
   (first at `rinaldo_sau: {@10461`, born 2026-06-04) and zero readers in the engine.** Disabling
   that one regex moves the gate's own output from `written-by-nothing : 50` to **57** and
   `waw ×25` to **`waw ×32`**, reproducing this census exactly. It is a false **negative** in a
   soft-lock detector, one array element from the false **positive** §DX-02bs already filed against
   the same scanner (`once:` unknown → `saulConverted` wrongly listed).
3. **A correction to the prover's own report, caused by that false negative.** It states
   *"`waw001a1` only survives play because an NPC `missionBit` coincidentally grants it — the chain
   stalls at act 3."* It does not and it stalls at **act 2**: `waw001_act2: {@14900` is the first
   dead rung in all eight `waw` chains, which is why the family's true count is 32 and not 25. The
   author trusted the analyser's own over-approximation about the analyser's own blind spot.
   *A corrective instrument needs its own witness.*

All three are filed as §AUDIT-03bj.

---

## XIII. Conclusion

The page-generation architecture is best understood not as a renderer plus three features but as
**one closed-loop state machine with a rendering side effect**. Flags are its memory, quests are
its transition function, waypoints are its actuator, mission bits are the durable write-edge from
completion back to activation, and the tail-synthesis block is the clock.

Forty-two days on, the great success is confirmed and extended. The declarative-data /
single-executor split made 2,853 quests authorable, editor-verifiable and headless-testable without
a framework — and the report's own prescription for the presentation layer, *push logic into data*,
was carried out. `storyRender` is a third of its former size; the per-step scan is indexed; the
renderer no longer mutates state mid-paint. Four recommendations, twenty-eight days, no framework.

The liability moved. It is no longer the renderer; it is the **flag namespace**, exactly where the
report said it would be. 2,615 flag names, no registry, no ownership, no assertion — and 138 quests
with roughly 29,000 words of prose behind a gate whose key was never cut. The engine has never been
in better shape and the world has never been less finishable, and both sentences are consequences
of the same design decision: *make the coupling medium a bare string, and nothing will ever tell you
when you misspell one.*

The prover for this already exists, was built fifteen days after the report asked for it, named
the four broken arcs by name, and has been reporting `exit 0` ever since. The next move is small
and it is not architectural. **Make the prover fail.**

---

## Appendix A — Code anchor index

| Concern | Anchor |
|---|---|
| Navigation kernel | `function cellMove(dir) {@28345` |
| Empty-cell shell | `function _renderNodeShell(@28408` · `function _enterEmptyCell(@28420` |
| The page generator | `function storyRender(node, prefix) {@34567` |
| Dynamic-sibling clear | `// Clear all stale dynamic siblings@34625` |
| Tail synthesis (the clock edge) | `const questMsgs = storyCheckQuests(node);@36041` |
| Per-arrival quest scan | `function storyCheckQuests(node) {@30166` |
| Activation pass (indexed) | `function _uqfActivateAtNode(node) {@30137` · `function _questsByNode(@37015` |
| Activation / completion gates | `canActivate(questId) {@22193` · `canComplete(questId) {@22205` |
| The `atNode` term | `if (g.atNode && st.currentCode !== g.atNode) return false;@22124` |
| Bit interpreter | `*execBits(bits, ctx) {@22223` · `HANDLERS: {@22264` |
| Bit contract registry | `const BIT_CONTRACTS = {@21970` |
| Opcodes added after the report | `cost(bit, ctx) {@22288` · `*choice(bit, ctx) {@22319` |
| Mission-bit grant | `function _grantMissionBit(@26109` |
| Mission-bit spend (guarded) | `function _takeMissionBit(@26153` · `function _gateFlagSet() {@26133` |
| Quest panel (waypoint publish) | `function storyRenderQuests() {@30707` · `const distTag = _wpDistTag(q.waypointNode);@30751` |
| Waypoint set | `function storySetWaypoint(@38146` |
| Auto-travel loop | `function _travelStart() {@38025` · `function _travelTick() {@38034` · `_travelTimer = setTimeout(_travelTick, 120);@38061` |
| Presentation registries (Rec 1) | `const NODE_PANELS = [@31318` · `const NODE_HOOKS = [@34190` · `function _runNodeHook(@34253` |
| Declared render-time write (Rec 4) | `once:'saulConverted'@31332` |
| Data sections | `const NODE_MAP = {@8425` · `const QUEST_DB = {@10615` · `const WORLD_DB = {@6279` · `const _S_DEFAULTS = () => ({@23062` |
| Broken chain / working twin | `waw001_act2: {@14900` · `cph001_act2: {@15540` |
| Inert NPC grant field | `rinaldo_sau: {@10461` |
| Editor bit-contract mirror | `worldbuilder.html:const OPERAND_CONTRACTS = {@1373` · `worldbuilder.html:const UQF_BIT_FIELDS = {@1402` · `worldbuilder.html:_questsByNode: {},@1468` |
| Soft-lock prover's over-credit | `scripts/check-questgraph.js:// NPC/data mission-bit grant@309` |
| Idempotency acceptance (Rec 5) | `tests/integration/uqf-node-panels.test.js:gone on re-render@28` |

## Appendix B — Defects filed by this verification

| Row | Severity | Summary |
|---|---|---|
| **§AUDIT-03bj** | 🟡 | 55 gate flags with no writer strand **138 quests / ~29,000 words**. Diagnosed by §VM-01-E on 2026-07-22, deferred, never filed; `check:questgraph` names them on every CI push and exits 0, and its `missionBit:` pattern hides 7 more (so the prover's own report says the `waw` chains stall at act 3 — they stall at act 2). Repair for `waw`/`crl` is mechanical; `nwi`/`mla` cross-links need one authoring call. |
| **§AUDIT-03bk** | 🟢 | The waypoint→`atNode` closure — the report's central play mechanic — is authored on **15 of 161** waypoint quests. Content gap, not a bug. |
| **§DX-02cx** | 🟢 | `NPC_DIALOGUES[*].meta.missionBit`: 209 declarations, 203 distinct flags, **zero readers** since 2026-06-04. Wire it or delete it — but a CI gate is currently trusting it. |

**Corroborated, not re-filed:** §AUDIT-03bf (the 493-field count) · §DX-02bs (the `once:`
false positive in the same scanner) · §DX-02u (`voidFluxCleared`) · §AUDIT-03x (four of the dead
families activate on non-primary nodes, so the flag repair is necessary and not sufficient).
