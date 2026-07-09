<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->

# Lab Report — Page Generation Architecture: Quests, Waypoints, and Mission Bits
### IEEE-Format Architectural Review of the Story-Mode Rendering Pipeline in `roll2hit-v3.html`
**Date:** 2026-07-07
**Source file:** `roll2hit-v3.html` (36,192 lines, ~5.3 MB, single file, no build step)
**Companion tool:** `worldbuilder.html` (data-layer editor; port-1367 WBAPI)
**Scope:** How a story "page" is generated in JavaScript from `NODE_MAP` + `QUEST_DB`, and how the **quest**, **waypoint**, and **mission-bit** subsystems interlock to drive that generation.

---

## Abstract

Roll2Hit's Story Mode has no HTML templates, no virtual DOM, no router, and no server. Every "page" the player sees — node prose, action cards, quest panel, exits, minimap — is produced by a single imperative JavaScript function, `storyRender(node)`, that mutates a fixed set of pre-existing DOM slots in place. Navigation is not URL-driven; it is a coordinate move on a 90×360 world grid whose destination cell may or may not carry a named node. This report traces the end-to-end generation pipeline (`cellMove → storyRender → tail synthesis`), then examines the three data-driven subsystems that make the page *stateful*: the **Universal Quest Format (UQF-1.0)** runtime, the **waypoint** navigation-target mechanism, and the **mission-bit** dual-ontology token system. The central finding is that these three subsystems form a single closed feedback loop — *completion writes flags → flags open gates → gates activate quests → quests publish waypoints → travel re-enters the renderer* — and that the entire loop is re-evaluated on **every cell step** through one synthesis block (`roll2hit-v3.html:34157–34174`). The architecture is assessed against modifiability, testability, performance, and reliability. Its dominant strength is a clean declarative data/imperative-engine split (quests are pure data; the runtime is the only executor). Its dominant risk is `storyRender`'s ~4,200-line body of node-code-conditional injection blocks, which is an Open/Closed violation that grows linearly with narrative content and concentrates fragility in the hottest function in the codebase.

---

## I. Introduction

### A. The Question Under Review

"How do we generate an HTML page, with JavaScript, using the mission bits, quests, and waypoints?" This is a *page-generation* review, not a full-system review (see `lab-report-architecture-full.md` for the latter). The object of study is the pipeline that turns a player action ("walk north," "click Navigate →") into repainted DOM, and the three subsystems whose state that pipeline reads and writes.

### B. The Governing Constraint

One HTML file, no build, no modules, no CDN, no server component (mesh multiplayer excepted, and out of scope here). Every architectural choice examined below is downstream of that constraint. There is no `<template>` cloning, no JSX, no `render()` that returns markup — because there is no framework to interpret markup. There is a DOM built once in the static `<body>` (`roll2hit-v3.html:3382–5119`) and a function that overwrites the mutable parts of it.

### C. The Three Nouns

- **Quest** — a pure-data record in `QUEST_DB` (UQF-1.0 schema): `{id, type, schema, gate, bits[], completion, onComplete[], activateNode, waypointNode, passText, …}`. Quests *do nothing on their own*; the runtime executes them.
- **Waypoint** — a single field, `S_story.waypoint` (one node code, or `null`), plus a per-quest `waypointNode`. It is a navigation *target*, not an event; travel toward it is a mechanical grid walk.
- **Mission bit** — a `{flag, label}` pair that, when granted, both sets `S_story[flag] = true` (the *witnessed event*) and pushes a 🪬 inventory token (the *receipt*). Flags are the currency read by quest gates.

---

## II. Architectural Context: The Data and State Layers

### A. Static Data (file-scope `const`)

All narrative data is top-level `const`, readable by every function (no imports, no scope boundaries):

- `NODE_MAP` — nodes keyed by code (`LHR`, `FRO`, …): `{num, code, name, label, act, text, npc, battle, loot, sleep, textVariants?}` (`roll2hit-v3.html:8073+`). `name` is the *terrain key* (`city`, `desert`), `label` is display text.
- `QUEST_DB` — ~2,700 UQF quests, wrapped in `◆◆◆ WORLDBUILDER:QUEST_DB:START/END ◆◆◆` markers so `worldbuilder.html` can slice them out.
- `WORLD_DB` — 40 terrain keys → `{label, icon, monsters:[…]}` (`roll2hit-v3.html:6115+`).
- `NODE_COORDS` / `ROAD_CELLS` / `SEA_LANES` — the grid geometry the mover kernel walks.

### B. Mutable State: `S_story`

A single ~107-field object holds *all* narrative progress: `currentCode`, `playerR/playerC`, `visited{}`, `quests{id:status}`, `defeatedBattles{}`, `npcFavorability{}`, `inventory[]`, `waypoint`, `shards`, `xp`, plus a large flat namespace of boolean **flags** (`saulConverted`, `stoningEvent`, `entry42Written`, …). Persistence is `localStorage` via `storyAutoSave()`. There are no getters, no selectors, no invariants — the discipline is entirely in the programmer's head, and the flag namespace is an *implicit global coupling surface* between quests (§VII).

---

## III. The Generation Pipeline

### A. Overview

```
 player input (D-pad / keyboard / exit-link click / Navigate →)
        │
        ▼
 cellMove(dir)                       roll2hit-v3.html:27084
        │  Mover.move(world,pos,dir) → destination cell
        ├─ named node?  ── yes ──►  S_story.currentCode = destCode
        │                            storyRender(destNode)       :27111
        └─ empty cell?  ── yes ──►  _enterEmptyCell(nr,nc)       :27157
                                     (shared shell + encounter roll)
        │
        ▼
 storyRender(node)                   roll2hit-v3.html:29888
   1. sync grid pos + act
   2. paint header slots  (#s-node-num / #s-node-name / #s-node-act)
   3. paint story text    (textVariants flag-substitution + void flavor)
   4. clear stale dynamic siblings
   5. ~4,200 lines of node-code-conditional injection blocks
        if (node.code === 'DAM' && !S_story.saulConverted) { … }
        if (node.code === 'LHR' && ngPlusRun≥1 …)          { … }
   6. TAIL SYNTHESIS  (:34157–34174)  ◄── the load-bearing block
        storyUpdateStatus()
        questMsgs = storyCheckQuests(node)          ◄── QUEST SCAN
        storyMsg([prefix, lootMsg, …questMsgs].join(' · '))
        storyRenderQuests()                         ◄── quest panel + Navigate/Battle buttons
        storyCheckJournal(node)
        storyAutoSave()
        storyCheckVictory(node)
        _render{Mini,World,Globe}Map()
        _updateExitLinks()                          ◄── d-pad exits
        _updateWaypointBtn()                        ◄── WP button state
```

### B. Navigation is Coordinate-Based, Not Route-Based

`cellMove(dir)` (`:27084`) delegates the bounds/wrap/sea decision to a shared kernel `Mover.move()` (`mover.js`, also driving the MUD harness), applies the single-player side effects, and — crucially — **only re-renders when the destination cell carries a named node**. Empty cells route to `_enterEmptyCell`, which paints the *same* header/body slots via `_renderNodeShell` (`:27145`) so the shell is uniform. Movement is "timeless" (§TIMELESS-01): a step no longer advances the day clock; only battle/sleep/fishing/rest do.

### C. The Renderer is an In-Place DOM Mutator

`storyRender` never returns markup. It reads DOM nodes by fixed `id` and overwrites `.textContent` / `.innerHTML`, then *removes and rebuilds* the dynamic sibling range between `#story-text-box` and `#story-info-row` (`:34934`, `:27153`). This is manual double-buffering: the static shell is the frame; the dynamic cards are the swap. `textContent` is used for author prose (XSS-safe, §DATA-01 residual), `innerHTML` only for engine-authored HTML.

### D. The Tail Synthesis Block is the Real Contract

Everything narratively *live* happens in 18 lines (`:34157–34174`). This is where the page stops being "prose on a slot" and becomes "a state machine's current frame": the quest scan runs, its messages merge into the log stream, the quest panel and exits repaint, and the world autosaves. **Every subsystem in this report converges here, on every step.**

---

## IV. The Quest Subsystem (UQF-1.0)

### A. Data/Engine Split

A quest is inert data; `QuestRuntime` (`:21278`) is the sole executor. This is the architecture's cleanest decision. The legacy `activateCond`/`completeFn`/`completeItems` closures were retired (§ARCH-01 W7d); gates are now **declarative** and the runtime is the only code path.

### B. The Per-Arrival Scanner: `storyCheckQuests(node)` (`:28741`)

Two passes over `QUEST_DB`, run inside the tail synthesis:

1. **Activation** — for each quest not yet started with `activateNode === node.code`, activate iff `QuestRuntime.canActivate(id)` passes the declarative gate. Emits `📋 {title}`.
2. **Completion** — for each `active` quest with a `completion` gate, complete iff `QuestRuntime.canComplete(id)`. On completion: run `execBits(q.onComplete)`, apply `itemChain`, push `passText`, award XP, set status `complete`. Emits `✓ {title}`.

Returns a `msgs[]` array the renderer joins into the log — the engine never touches the DOM directly; it produces text, the renderer surfaces it. Good separation.

### C. Declarative Gates: `canActivate` / `canComplete` (`:21285`, `:21339`)

Gates are objects of typed terms evaluated against `S_story`, replacing arbitrary predicates with a fixed vocabulary: `flags` (AND), `flagsAny` (OR), `notFlags` (NONE), `flagEquals`, `nodes`/`sleptAt`, `questsAttempted`/`questsDone`/`questsComplete`, `favorMin`, `battles`/`notBattles`, `shardsMin`, `restedAtMin`, `flagsPath` (dot-path), `countMin` (coerced count ≥ n), `atNode`, `items`/`itemsAll`/`itemsMinAny`. The OR-group in `canComplete` (`flagsAny ∪ battles ∪ questsComplete ∪ items ∪ itemsMinAny`) models the "AND(prereqs) ∧ (flag OR battle)" shape without a boolean-expression language — a deliberate, legible constraint.

### D. The Bit Interpreter: `execBits` + `HANDLERS` (`:21390`, `:21423`)

`execBits(bits, ctx)` is a tiny virtual machine: iterate an ordered bit chain, dispatch each `bit.kind` to a bound handler, warn-and-skip unknowns. The instruction set (`HANDLERS`):

| kind | effect |
|---|---|
| `skill_check` | roll `d20+mod+prof(+iodine+lakeMagic)` vs `dc`; branch to `onPass`/`onFail` bits |
| `flag_write` | set/clear `S_story` flags |
| `reward` | xp (→ `_checkLevelUp`), gold, items (→ `mpMintStamp`), knowledge |
| `combat` | `storyPreBattle` with a battle spec |
| `narrative` | push a message (into `ctx.pushMsg` or `storyMsg`) |
| `item_remove` / `item_check` | remove first exact-name item / record count in ctx |
| `favor` | set/increment NPC favorability (cap default 3) |
| `unlock` | activate listed quest ids |
| `mission_bit` | **→ `_grantMissionBit(flag, label)`** (§V) |
| `choice` | (Phase-2 stub) |
| `_legacy_fn` | escape hatch closure |

`worldbuilder.html` mirrors this table exactly (`OPERAND_CONTRACTS`, `UQF_BIT_FIELDS`, `:1373`/`:1402`) so the editor can only author real, executable bits — a strong cross-file contract.

---

## V. The Mission-Bit Subsystem

### A. Dual Ontology (grant): `_grantMissionBit(flag, label)` (`:24916`)

A mission bit is deliberately *two things at once*:

1. **The event** — `S_story[flag] = true`. This is what quest gates read. It is the fact that something happened.
2. **The receipt** — a 🪬 inventory token `{name:'{label} Token', type:'mission_bit', flagRef:flag, …}`, idempotent by `flagRef` (re-grant is a no-op). This is the player-visible artifact.

The grant is reached only via the `mission_bit` handler (`:21437`), i.e. only from a quest's bit chain. There are no hardcoded call sites by design.

### B. Asymmetric Spend: `_takeMissionBit(flag)` (`:24960`)

Spending is *not* the inverse of granting. The token always leaves inventory, but the flag is cleared **only if no quest gate depends on it** — determined by `_gateFlagSet()` (`:24940`), a lazily-cached scan of every `QUEST_DB` gate's `flags`/`flagsAny`/`notFlags`. Rationale (§MBIT-02-E): a witnessed event that unlocks a downstream mission can never be *un*-witnessed, or spending a token could silently re-close an arc. This is a genuine architectural safety invariant, enforced in code rather than by convention — a notable design maturity point.

### C. Role in the System

Mission bits are the **coupling medium** between quest completion and future quest activation. `execBits` writes flags (via `flag_write` or `mission_bit`); `canActivate`/`canComplete` read them. The mission-bit ontology exists precisely to make that write/read edge durable and player-legible.

---

## VI. The Waypoint Subsystem

### A. Publication: `quest.waypointNode` → the Quest Panel

`storyRenderQuests()` (`:29287`) renders, for each active quest with a `waypointNode`, either a **Battle** button (`storyPreBattle`) if the destination is a combat node, or a **Navigate →** button wired to `storySetWaypoint(code)`, annotated with a live distance/bearing tag `_wpDistTag` ("(12 steps, NE)"). The quest thus *publishes* a target; the player *subscribes* by clicking.

### B. Target State: `S_story.waypoint`

A single node code (or `null`). `storySetWaypoint(nodeCode)` (`:35677`) sets it, surfaces the story sheet, and calls `_travelStart()`.

### C. Auto-Travel Loop: `_travelStart` / `_travelTick` (`:35577`, `:35586`)

Travel is a **non-blocking setTimeout chain** (~120 ms/step), never a blocking loop — critical for a single-threaded UI. Each tick:

1. Arrival test: standing on the waypoint's *cell* (co-located locale nodes share a cell, so cell-equality, not just `currentCode`, is checked) → stop, clear waypoint, announce, open quest panel.
2. `_roadGridDir(pos, wp)` picks the next direction using the same **road-weighted routing** as manual travel (roads have encounter rate 0).
3. `cellMove(dir)` — which **re-runs the entire §III pipeline**, including the quest scan.
4. Halt on: blocked step (kernel refused), queued encounter / begun battle, or leaving story mode.

Travel state (`_travelTimer`, `_travelStepping`, `_encounterQueued`) is transient module state, **never persisted** — a reload resumes standing still. Any user-initiated `cellMove` halts travel (`:27087`).

### D. Arrival → Completion Closure

Because `waypointNode` completion gates typically use the `atNode` term (`canComplete`, `:21365` — "completes only while standing at this node"), *arriving is completing*: the final `cellMove` of the travel loop re-enters `storyCheckQuests`, `canComplete` sees `currentCode === atNode`, the quest flips to `complete`, its `onComplete` bits fire, and — if any is a `mission_bit`/`flag_write` — new flags are written that may open the *next* quest's gate on the *same* frame. The loop closes.

---

## VII. The Coupling Model — Why These Three Are One System

```
   ┌─────────────────────────────────────────────────────────────┐
   │                                                             │
   │   storyCheckQuests (scan)                                   │
   │        │ canActivate(gate reads FLAGS) ─── activate         │
   │        │ canComplete(gate reads FLAGS, atNode) ─ complete   │
   │        ▼                                                    │
   │   execBits(onComplete)                                      │
   │        │ flag_write / mission_bit ── WRITES FLAGS ──────────┤ (back to gates)
   │        │ reward / favor / combat / unlock                   │
   │        ▼                                                    │
   │   quest publishes waypointNode                              │
   │        │ storyRenderQuests → "Navigate →"                   │
   │        ▼                                                    │
   │   storySetWaypoint → _travelTick loop                       │
   │        │ cellMove(dir) ── re-enters storyRender ────────────┘ (re-scan on arrival)
   │
   └── every edge is re-evaluated inside the tail-synthesis block, per cell step ──
```

The three nouns are not independent features; they are three positions in one cycle:

- **Flags** are the shared state (written by mission bits / `flag_write`, read by gates).
- **Quests** are the transition function (gate = guard, `onComplete` bits = action).
- **Waypoints** are the actuator that moves the player so the *next* transition's `atNode`/`nodes`/`sleptAt` term can fire.

The synthesis block (`:34157–34174`) is the clock edge on which the whole machine advances.

---

## VIII. Architectural Assessment

### A. Strengths

1. **Declarative data / imperative engine split.** Quests are pure data with a fixed bit ISA and a single executor (`QuestRuntime`). This is the load-bearing good decision: content authors (and `worldbuilder.html`) touch data, never control flow.
2. **One executor, one message contract.** The engine emits `msgs[]`; the renderer surfaces them. Quest logic never touches the DOM. This keeps the runtime headless-testable (it is exposed on `window` for Playwright, `:21458`).
3. **Cross-file contract integrity.** The worldbuilder's operand registry is a byte-for-byte mirror of `BIT_CONTRACTS`; the `◆◆◆` markers make the data extractable. Editor and engine cannot drift on the bit vocabulary.
4. **Safety invariants in code, not comments.** `_takeMissionBit`'s gate-flag guard and the idempotent `flagRef`/`mpMintStamp` grants prevent whole classes of arc-corruption bugs structurally.
5. **Non-blocking travel.** The setTimeout-chain auto-walk with explicit halt conditions is the correct pattern for a single-threaded UI; no frame is ever starved.

### B. Tensions and Risks

1. **`storyRender` is an Open/Closed violation and the hottest function in the file.** Its body is ~4,200 lines of `if (node.code === 'XXX' && flag) { build & inject DOM }` blocks (`:29939–34155`). Every new narrative beat *edits the renderer*. Cost grows linearly with content; the function is re-run on every cell step; and node-specific DOM injection is exactly the logic that should live *in data* (the `textVariants` mechanism at `:29925` and the injected-card pattern show the shape a general `nodeCards[]` schema would take). **This is the review's primary recommendation target.**
2. **The flag namespace is an unbounded implicit coupling surface.** ~hundreds of boolean flags in a flat `S_story` with no registry, no typing, no ownership. `_gateFlagSet()` mitigates the *spend* hazard, but nothing prevents two arcs from colliding on a flag name, and nothing documents which quest owns which flag. This is the same "any function can silently mutate state" tradeoff called out in the full-architecture report, concentrated at its most dangerous point.
3. **Full re-scan of ~2,700 quests per cell step.** `storyCheckQuests` iterates all of `QUEST_DB` twice on every render (`Object.values(QUEST_DB).forEach` / `Object.keys(S_story.quests).forEach`). Currently acceptable (single-digit-ms), but it scales with the quest count and runs inside the travel loop's per-step budget. An `activateNode → [questId]` index (the worldbuilder already computes `_questsByNode`, `:1468`) would make activation O(quests-at-node).
4. **Idempotency is load-bearing but ambient.** Correctness under re-render (WP loop re-enters `storyCheckQuests` every step) depends on guards like `flagRef` dedup, `visited[code]` first-arrival checks, and status-string transitions being genuinely idempotent. These are correct today but distributed across many hand-written blocks; a single non-idempotent injection block (e.g. one that `push`es without a guard) would double-fire during travel.
5. **Presentation/logic interleave in the injection blocks.** Some `node.code` blocks *mutate state* mid-render (e.g. `DAM` sets `S_story.saulConverted = true` during paint, `:30007`). Rendering with side effects makes the renderer non-reentrant in principle and blurs the otherwise-clean "engine produces, renderer surfaces" contract.

### C. Quality-Attribute Summary

| Attribute | Rating | Rationale |
|---|---|---|
| **Modifiability (data)** | ★★★★☆ | New quests are pure data; gates/bits are declarative and editor-backed. |
| **Modifiability (renderer)** | ★★☆☆☆ | New per-node presentation edits the 4,200-line `storyRender`. |
| **Testability** | ★★★★☆ | Headless `QuestRuntime` + msg-array contract; travel loop is deterministic modulo RNG. |
| **Performance** | ★★★☆☆ | Per-step full-DB scan + full repaint; fine now, index-free and content-linear. |
| **Reliability** | ★★★★☆ | Strong spend/grant invariants; risk localized to renderer idempotency and flag-name collisions. |
| **Portability** | ★★★★★ | One file, no build, works offline everywhere HTML5 does. |

---

## IX. Recommendations

Ordered by leverage. None require a framework or a build step.

1. **Extract a `nodeCards` data schema.** Generalize the injection-block pattern into `NODE_MAP[code].cards = [{when:{gate}, html|text, onShow:[bits]}]`, evaluated by one loop in `storyRender`. This converts the largest, most-edited region of the renderer into data the worldbuilder can author — the same win UQF gave quests. Migrate incrementally (the `textVariants` term is the beachhead).
2. **Index quest activation by node.** Build `_questsByActivateNode` once at load (mirroring the worldbuilder's `_questsByNode`) and iterate only quests for `node.code` in the activation pass. Keeps the travel loop's per-step cost flat as `QUEST_DB` grows.
3. **Introduce a flag registry.** A `FLAG_OWNERS = {flagName: questId}` (derivable by static scan, like `_gateFlagSet`) plus a dev-mode assertion on collision would make the implicit coupling surface explicit and catch cross-arc name clashes at load.
4. **Move state mutation out of `storyRender`.** Relocate the "fires on first arrival" state writes (e.g. `DAM` conversion, `:30006`) into `storyCheckQuests`/a dedicated `onArrive(node)` hook so the renderer becomes a pure function of `(node, S_story)`. This restores full reentrancy and hardens the travel loop against double-fire.
5. **Add a renderer idempotency test.** A Playwright check that renders the same node twice and asserts identical DOM + no state delta would lock in the invariant the WP travel loop silently depends on.

---

## X. Conclusion

The page-generation architecture is best understood not as a renderer plus three features, but as **one closed-loop state machine with a rendering side effect**. Flags are its memory, quests are its transition function, waypoints are its actuator, mission bits are the durable write-edge from completion back to activation, and `storyRender`'s tail-synthesis block (`:34157–34174`) is the clock. The design's great success is the declarative-data / single-executor split embodied by UQF-1.0 and the `execBits` ISA — it makes ~2,700 quests authorable, editor-verifiable, and headless-testable without a framework. Its great liability is that the *presentation* layer never received the same treatment: `storyRender` remains an imperative, content-linear, occasionally state-mutating monolith that is re-run on every cell step. The highest-leverage next move is to extend the game's own proven pattern — push logic into data — from the quest layer up into the node-rendering layer. Everything the game already knows how to do (declarative gates, a bit interpreter, an editor mirror) is directly reusable to do it.

---

### Appendix A — Code Anchor Index

| Concern | Symbol | Location |
|---|---|---|
| Navigation kernel | `cellMove` | `roll2hit-v3.html:27084` |
| Empty-cell shell | `_renderNodeShell` / `_enterEmptyCell` | `:27145` / `:27157` |
| The page generator | `storyRender` | `:29888` |
| Tail synthesis (the clock edge) | — | `:34157–34174` |
| Per-arrival quest scan | `storyCheckQuests` | `:28741` |
| UQF runtime | `QuestRuntime` | `:21278` |
| Activation gate | `canActivate` | `:21285` |
| Completion gate (`atNode`) | `canComplete` | `:21339` / `:21365` |
| Bit interpreter | `execBits` / `HANDLERS` | `:21390` / `:21423` |
| Mission-bit grant | `_grantMissionBit` | `:24916` |
| Mission-bit spend (guarded) | `_takeMissionBit` / `_gateFlagSet` | `:24960` / `:24940` |
| Quest panel (waypoint publish) | `storyRenderQuests` | `:29287` |
| Waypoint set | `storySetWaypoint` | `:35677` |
| Auto-travel loop | `_travelStart` / `_travelTick` | `:35577` / `:35586` |
| Editor bit-contract mirror | `OPERAND_CONTRACTS` | `worldbuilder.html:1373` |
