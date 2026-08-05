<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->
# prompt.md — Operating Directive for Building roll2hit.com

> **What this file is.** The one-page onboarding + operating prompt for an agent (human or model) picking up work on this repo. It tells you **how to take a work item from BACKLOG.md, build it with the game's own mechanics through the API, sync the docs, and close it** — without re-learning the project from scratch or breaking a load-bearing invariant.
>
> **This file is orientation, not law.** The binding rules live in **[CONTRIBUTING.md](CONTRIBUTING.md)** (how we work) and the outstanding work lives in **[BACKLOG.md](BACKLOG.md)**. Read those two first; this file wires them together and points at the rest. Where this file and CONTRIBUTING.md ever disagree, CONTRIBUTING.md wins.

---

## 0. The 60-second orientation

- **The product is one file:** `roll2hit-v3.html` *is* the game — combat engine, world map, hundreds of nodes and monsters, thousands of quests across multiple acts, save system — one large static HTML file (tens of thousands of lines, several MB). Exact live totals rot when hardcoded, so this line no longer carries them: **run `npm run stats`** for the real counts (nodes · monsters · terrains · quests · NPCs · acts · lines · bytes, parsed from the data sections by the same `wbapi-core` the `:1367` server uses — §DX-01g). No server and no build step at **play** time: the shipped game is static HTML you open in a browser, and the WBAPI server is an **authoring-time** tool. (Parity modules do carry one author-time step — re-inlining a `js/*.js` twin back into the HTML after editing it, §6.5.) Everything else in the repo exists to **author, document, test, and host** that one file.
- **You do not hand-edit tens of thousands of lines.** You author through the **WBAPI** — a local REST server (`js/wbapi-server.js` on `:1367`) driven by `./api.sh`, which reads the HTML's data sections and writes mutations back in place.
- **Docs mirror the HTML two ways.** Every data structure has a home doc; every doc entry traces to a line in the HTML. When you change the game, you sync the doc in the same increment.
- **Work is one increment per "continue."** Pick a `§`-tagged item from BACKLOG.md, ship the smallest coherent slice, verify it, mark it done, and stop. Append new ideas to BACKLOG.md rather than doing them inline.

**Read-order for a cold start:** `README.md` (what/how-to-run) → `CONTRIBUTING.md` (policies) → `BACKLOG.md` §"Open at a Glance" + §RESUME (what's active) → `index.md` (doc map + design constants) → this file (how to execute).

---

## 1. The three governing files

| File | Role | You use it to… |
|------|------|----------------|
| **CONTRIBUTING.md** | The *how-we-work* rules (policies + hazards). | Learn the hard invariants before touching anything. |
| **BACKLOG.md** | The list of outstanding work; `§`-tagged items with `[ ]`/`[~]`/`[x]` status; a §RESUME "Continue Here" log at the top of the newest work. | Pick your task, or append a new one. |
| **index.md** | Master doc index + cross-reference table + Design Constants / State Fields quick reference + doc-health badge. | Find the home doc for a thing; look up a constant or `S_story` field. |

> `plan.md` no longer exists at the repo root — it was split into CONTRIBUTING.md + BACKLOG.md on 2026-07-09. (`1367-sources/plan.md` is a *different*, still-live importer tracker.) Closed/shipped work migrates to **`plan-archive.md`**.

---

## 2. The work loop — how a BACKLOG item becomes shipped code

This is "the processing of BACKLOG.md" the project runs on. Every increment follows it:

**1. Pick or append the work item.**
- Open BACKLOG.md → §"Open at a Glance" for the genuinely-open tracks, then the item's own `§` section for detail.
- If you're *adding* an idea rather than building one: append a `§`-tagged row to BACKLOG.md (or a seed to `potential.md` / `docs/notes/brainstorm-one-liners.md` if it's unscoped). **New scoped work is a spec, not code** — assign a `§ID`, mark it `⚠️ PLANNED`, do not touch the HTML yet.

**2. Grep before building. This is the single most expensive recurring lesson in the repo.** Six arcs were "planned as new work" and closed as *already shipped*. Before you build anything, prove it doesn't already exist:
```bash
./api.sh ping                       # server alive + up to date?
./api.sh list quest --q "keyword"   # does this quest exist?
./api.sh audit                      # what's actually there vs. what the plan assumes
grep -n "yourIdentifier" roll2hit-v3.html
```
Confirm current state from the live file, never from memory or a "DONE" claim.

**3. Lab-report gate (conditional).** If the item is a major collection, a multi-system redesign, a new arc of 3+ nodes, or a pre-implementation design review, write `lab-reports/lab-report-<title>.md` **locking the data shapes before any HTML edit** (Lab Report Policy, CONTRIBUTING.md). A single quest/monster/value edit does *not* need one.

**4. Ask vs. Loop.** If the item needs a user design decision (e.g. "keep 100% gold or drop 50%?"), present the choice and wait — don't default it. If the next step is unambiguous, state it in one sentence and proceed. (Loop-vs-Ask Rule.)

**5. Author through the API.** See §3–§5 below. If the API can't yet express the operation, **add the endpoint to `wbapi-server.js` first, restart, then author** — do not fall back to raw `curl` or a blind hand-edit of the data section.

**6. Sync the docs in the same increment.** Every changed structure updates its home doc (§1 table in index.md maps structure→doc). Two-way sync is a hard rule, not a courtesy: `quest.md` for quests, `monsters.md` for monsters, `world.md`/`maps.md`/`story.md` for world/nodes, `mechanics.md` for systems. Verify world-map consistency across `maps.md`/`story.md`/`world.md` on each pass.

**7. Verify.** Run the relevant checks (§7). At minimum `npm run check:walk` for world/quest changes and the item's own integration test. Parse the server (`node --check js/wbapi-server.js`) — note this does *not* cover the HTML's inline `<script>`, which is validated only when the Playwright suite loads the page (a syntax error there fails every test). Know the **pre-existing baseline reds** so you can tell a real regression from noise (§7).

**7½. Eyeball it in the running game (when the change is player-visible).** Tests don't catch UX regressions — a mis-wired button, a screen that returns to the wrong tab, node text that reads wrong after an event. For anything a player would *see* or *click*, open `roll2hit-v3.html` in a browser (the `/run` skill launches it) and watch the actual behavior before you commit. Editing a `*:CORE` parity module? **Re-inline the `js/*.js` twin into the HTML first** (§6.5) — otherwise you're eyeballing the old inlined copy.

**8. Commit + speak, then mark done.** Commit only when the work is verified, on the track's branch (§8). After every `git commit`, run `./say.sh "<subject>"` — and the call must **speak what changed** (what's being fixed/reviewed/added: city, node, quest ID, chain, source book, verbatim quote, property name), never a bare status word (Commit + Speak / say-narration rules; use `./say.sh`, never raw macOS `say`). This is the single source for the narration spec — §6.8 just points here. Then flip the BACKLOG row to `[x]` **with the commit hash and the evidence** (test counts, greps, green gates) — the house style is a one-paragraph ship record, not a bare checkmark. **Mark done only after verified.**

**9. The finishing discipline (this is the intent of this whole file).**
- **Single agent, no fan-out.** Do all work inline in **one** agent — never spawn sub-agents (Agent tool, Explore, Workflow orchestration). Every step stays visible in the main conversation.
- **Work the main directive to completion.** Don't scatter effort across the side tangents you notice on the way.
- **Every side task you notice becomes a BACKLOG item, not a detour.** Saw a stale count, a broken helper, a refactor worth doing? Append it as a `§`-row to BACKLOG.md and keep going. That is how the main task *finishes* instead of fraying.
- **Any unaccomplished work on your path goes to BACKLOG.md too.** If you cannot finish, say so and leave a trail: append your recent actions + the exact next step to the item's §RESUME "Continue Here" entry in BACKLOG.md and state plainly that it is **incomplete**. Never report a half-done item as done.

**10. Hand the session off (the context-window contract — user directive 2026-08-04).**
A session ends when its context runs out, not when the work does, so **every increment must be resumable by a cold agent that has only this repo.** The rules:
- **Take the work as far as you can before switching context or aspect.** Finish the row you picked — don't stop mid-slice to start a second one, and don't spread one "continue" across three tracks. Depth on one row beats breadth across four, because only a *finished* row survives a context switch intact.
- **Every task must be summarizable.** If you cannot state what a row did in one paragraph — what was measured, what shipped, what proves it — the slice was scoped too wide. Split it and ship the half you can describe.
- **Close the loop in this order, every time:** verify → **commit** → `./say.sh "<what changed>"` (§2 step 8 — narrate the change, never a bare status word) → flip the BACKLOG row to `[x]` with hash + evidence → write the §RESUME entry.
- **Then hand off in the conversation itself.** End your reply with: (a) what shipped, in a few lines; (b) confirmation that the durable context was **saved to memory**; and (c) the **numbered next steps** — the specific rows a fresh session should pick up, each with its one-line premise and whether it needs a design call. The user starts the next conversation from that list, so it is the only bridge between two context windows. Ask them to continue when they're ready.

---

## 3. Using the API (WBAPI)

**Golden rule:** all world-building goes through `./api.sh`. It handles nonces, retries, error formatting, and pipe-safe JSON. Never use raw `curl` for authoring; if `./api.sh` lacks a command you need, add the endpoint + a named `./api.sh` wrapper. Full reference: **`docs/api/API-README.md`** + `docs/api/wbapi-help.md`; day-to-day: `./api.sh help`.

```bash
# Server lifecycle
./wbapi-toggle.sh start | status | restart | stop     # :1367, auto-restart loop
./api.sh ping                                          # health + confirm it's up

# The common cycle — SEARCH → INSPECT → EDIT (never guess an ID)
./api.sh list quest --q "keyword"        # search
./api.sh get quest quest_courier_release # inspect full fields
./api.sh location LHR                     # composite: node + quests + NPCs + monsters
./api.sh put quest quest_x desc="..."     # edit

# Create
./api.sh post node code=NEW name=city label="New City" act=1
./api.sh post quest id=new_q_01 title="Title" type=side activateNode=LHR

# Dated backups (§DX-02k/§DX-02l) — writes already persist on their own
./api.sh save                          # deliberate dated backup beside the game file
./api.sh snapshots [--sweep] [--force] # list them / delete the patch-archived ones

# Network health — run at the start and end of every session that touches nodes
./api.sh reachability     # target 100% reachable from LHR
./api.sh broken           # target 0 broken edges
./api.sh audit            # integrity scan
```

### API hazards you must internalize (CONTRIBUTING.md, learned the hard way)

1. **Restart the server before any WRITE session.** The server holds the *whole* file text from when it started and re-writes it on every data WRITE. If you hand-edited CSS/JS while the server was up since *before* your edit, the next `./api.sh put/post` **silently reverts your CSS/JS**. Rule: `./wbapi-toggle.sh restart`, verify a fresh PID, and confirm a CSS/JS signature survives the first write (`grep -c _monsterLevel roll2hit-v3.html`). When hand-editing CSS/JS, stop the server first, and commit early.
2. **`./api.sh post monster` works (§DX-01c, 2026-07-30) — the old "hand-edit MONSTER_POOL" exception is gone.** `./api.sh post monster key=dock_rat name="Dock Rat" ac=11 hp=6 atk=2 dmgDie=4 dmgCount=1 dmgFlat=0 tier=trivial`. All nine fields required; `tier` is a **string**, not a number; a bad body is rejected 422 with the field list and **nothing is written**. It used to splice a malformed line into the *trophy-drops* map (`MONSTER_DROPS` is nested inside `MONSTER_POOL`'s anchors) — the standing lesson is that **a write landing in a real-but-wrong object never throws**. (`./api.sh del monster` was the mirror defect and is fixed too — hazard #5.)
3. **Nested UQF quest bodies can't go through flat `post quest`.** `post quest` writes flat fields; a quest with nested `bits`/`completion`/`onComplete`/`gate` is hand-authored as a clean `QUEST_DB` block (a re-parsed data section, so Hazard-#1-safe if the server is restarted first). Use `./api.sh advise <id>` to validate the result.
4. **`./api.sh highway A B --execute` is DEPRECATED and refused (§DX-01d, 2026-07-30).** It never laid road — it dropped sparse `junction:true` waypoint nodes (which violate `check:invariants` I1/I2, and *are* where J14/J15 came from) and zero `ROAD_CELLS`. A contiguous-land node is already walk-reachable without it. Route *planning* still runs free (omit `--execute`); to make a corridor encounter-free road, edit `ROAD_RUNS` + `node scripts/build-roads.js --apply`.
5b. **`PUT /api/terrain` was the same defect with the read path backing it up (§DX-02h, 2026-08-03 — now fixed).** It set the in-memory model, returned `ok:true`, and never called `save()` — and because the mutation survived in the loaded model, **`GET` read the phantom edit back until the next restart.** `editField`'s `sectionMap` had no `terrain` entry, so `WORLD_DB` had no source-level writer at all. Now `./api.sh put terrain <key> monsters=a,b,c` works and round-trips — but **`monsters` replaces the whole roster, it does not append** (read it with `./api.sh get terrain <key>` first), and never hand-edit the array: it holds **code identifiers** (`P.giant_rat`), and a JSON-string array re-parses cleanly while silently driving `_monsterLevel` to 1 for that whole terrain. Full text: CONTRIBUTING Hazard #6.

5. **A write path that reports success without persisting (§DX-01d/i, 2026-07-30 — now fixed).** Every `del` — node, quest, monster, npc — used to drop the entry from the in-memory model only. `save()` writes `_rawSrc`, which nothing patched, and the server's generic `DELETE` never saved at all, so `✓ deleted` was followed by the entry reappearing on the next parse. Deletes now excise at source level through `WBAPI.deleteEntrySource` (verify-or-revert; cascades `NODE_COORDS` / `MONSTER_DROPS`). **The lesson, mirroring hazard #2: whenever you add a write path, the acceptance test is a round trip — save, re-parse, assert the change survived.** Nothing throws when it doesn't.

---

## 4. The inserting pattern (concrete)

New content is **data added to the big collections** in `roll2hit-v3.html`: `NODE_MAP` (places), `QUEST_DB` (missions, UQF-1.0), `MONSTER_POOL` (encounters), `WORLD_DB` (terrains), `NPC_DIALOGUES` (talk). The pattern is always: *search it doesn't exist → author via API (or hand-edit the data block for nested shapes) → wire it into the world → sync the doc → verify.*

### Adding a quest (UQF-1.0 — the format all ~2,850 quests use)

A UQF quest is **pure declarative data** executed by `QuestRuntime` (the host). It never contains game logic — logic lives in the VM's opcode table (`BIT_CONTRACTS`). A live example (`quest_courier_release`):

```js
quest_courier_release: {
  id:'quest_courier_release', type:'skill_check', schema:'UQF-1.0',
  gate:{ _legacyFn:true },                    // when the mission is OFFERED (listing, not movement)
  bits:[{ kind:'skill_check', stat:'CHA', skill:'Persuasion', dc:10,
          onPass:[{ kind:'mission_bit', flag:'courierReleased' },
                  { kind:'reward', xp:100, gold:50 }],
          onFail:[] }],
  title:'The Released',
  hint:"Persuade the city guard to release the courier's belongings.",
  activateNode:'LHR',                         // the cell you must stand on for it to list
  retryable:true, retryGateDays:1,
  vignetteText:"…", passText:"…", failText:"…",
}
```

- **`bits`** are the VM opcodes: `skill_check` (d20 + abilityMod + profBonus ≥ DC), `mission_bit` (grant a kept token/flag), `reward` (xp/gold), `cost` (**pay** a price — §VM-01-G4a), `flag_write`, `narrative`, `favor` (NPC relationship), `combat`, `unlock` (activate a quest from afar), `choice`. Compose behavior from these — **do not write a new single-use bit kind or a `_legacy_fn` closure** (Host/Script Separation Policy).
- **`cost` is `reward`'s inverse, and the reason it exists is that `reward` would "work" without it:** `reward` does `gold += bit.gold`, so `gold:-50` is arithmetically fine — with no affordability test, no refusal, and the word *reward* on a price (Hazard #2's *a write into a real-but-wrong object never throws*). `{ kind:'cost', gold:50, refuse:"💰 You don't have 50gp." }` — or `{ resource:'surgeCharges', count:1 }` — tests **every** currency before spending **any** (a mixed price never part-pays) and, when short, emits `refuse` and **fails the whole chain**, including from inside a `choice` option. The contract is **refuse-at-click** (user design call 2026-08-04): the verb always renders and states its price rather than quietly withholding itself, matching all six hand-written gold sites. So **`cost` never belongs in a `when`/gate.** **hp is not a currency** — the Memory Gate's −15 is narrated damage on a branch that always succeeds, so it is that option's effect, not its price.
- **`choice` now has a host end (§VM-01-G4a).** Inc A built the suspending half; `renderChoiceBlock` — the renderer the comments promised — never existed, so until 2026-08-04 a `choice` bit anywhere could only *throw*. `_uqfRunVerb(verb, mount)` runs a bit chain and renders each `ask` as option buttons in `mount`, resuming with the picked index. A pending choice is **abandoned on the next `storyRender`** (safe: `choice` applies the picked option's bits only *after* the pick), and a stale option button is inert. The scope fence is unchanged — a `choice` inside `skill_check`'s `onPass`/`onFail` still throws.
- **A verb is authored in `NODE_VERBS` (§VM-01-G4b/G4c/G4d).** The third small registry beside
  `NODE_PANELS` (flavour a node *shows*) and `NODE_HOOKS` (an interface a node *owns*):
  `{ id, group, nodes, when?, label?, btnStyle?, bits?, ambient? }` — **`label` + `bits`** is a button
  that runs the chain on click; **`bits` with no `label`** means the chain *is* the surface, so it
  runs at render and its first bit **must** be a suspending `choice` (anything else is refused out
  loud — it would apply its effects on every draw); **`ambient`** alone is a flavour line for a state
  with nothing to do. `bits` may also be `fn(st)` — the same `string|fn` shape `ambient` has — for
  text assembled from state; the VM still receives a plain array. Dispatch is **in place**
  (`_renderNodeVerbs(node, st, group)` is called where each migrated block sat), so DOM order is
  preserved by construction; **`group` names that position**, and every group must have exactly one
  call site or the entry renders nowhere. A `label`-only verb **is** its button (no wrapper, its own
  `btnStyle`) — the anchor's parent is a flex column, so a direct-child button stretches full width
  while a wrapped one shrinks to its text, a difference **a DOM diff cannot see and a screenshot
  can**. Consumers: Kern & Sable at DUS — the first `choice` ever executed in this game — plus the
  four D1 button verbs (S49 Sweelinck/NUE · Ori/STN · Yva/TRD · firewood/TLL). Several entries
  sharing one `group` rendered into a call-site-owned container (the 4th `_renderNodeVerbs`
  argument) is the **concurrent-menu mode** (§VM-01-G4d — CDG's boss confrontations): verbs all
  visible at once are a *menu*, never a `choice`, because `choice` is exclusive by construction. A
  `combat` bit's optional `nodeCode` may be a **synthetic** battle code there (`CQ_TAZ` — a
  `defeatedBattles` key, not a place), fenced by `check:noderegs`' explicit
  `SYNTHETIC_BATTLE_CODES` list. For a price on a
  surface that is *not* a verb, `_uqfRunChain(bits)` runs a chain in place with no re-render (the
  Junction Vignette's `[Help — 10gp]`).
- **`gate`** is a compiled boolean expression: a bare object is implicit `all` (AND); `{any:[…]}` = OR, `{not:…}` = NOT, over leaf terms (`flags`, `flagsAny`, `items`/`itemsAll`, `battles`, `questsComplete`). The gate decides **whether the mission lists** when you arrive — it is *mission gating*, never *movement gating* (§6).
- **"Collect at node" pattern:** put loot on the node (`node.loot`) and complete the quest with `itemsAll`/`atNode` — see `quest_math_*` / §KG for the canonical shape.
- **`onActivate` (§VM-01-G3)** controls the arrival-activation announcement: **absent** → the default `📋 title` strip line; **`null`** → silent; **`{msg, delayMs}`** → a bespoke delayed narration (the cat/WM arcs' staged intros). **`boardExempt:true`** keeps a quest off the Warrant's Board entirely (the NG+ remembrance set). Activation runs at the START of `storyRender` (`_uqfActivateAtNode`) so per-node UI keyed on `'active'` status renders in the same arrival.
- **`activateNode`/`waypointNode` must be a live `NODE_MAP` key.** Look it up in **`docs/maps/node-index.md`** (`npm run nodes` — generated, gate-fenced) or `./api.sh get node <CODE>`; **never** from a hand-maintained table. `maps.md`'s historical legend names 81 codes that do not exist, and `710bb75` copied three of them onto eight quests (§AUDIT-03c/03l). `./api.sh audit` catches a dead `activateNode`; `tests/integration/audit03c-node-refs.test.js` now catches both fields.
- Validate with `./api.sh advise <id>` (errors/warnings, NPC-key resolution), then sync the row in `quest.md` (location-organized register), then add an integration test under `tests/integration/`.

### Adding a node (place)

```bash
./api.sh post node code=NEW name=<terrainKey> label="Display Name" act=1
```
- **`name` must be a terrain key** (e.g. `camelot`, `crypt`), not the display name; **`label`** is the display name. (Node-creation terrain-key rule.)
- A node on land contiguous with the main landmass is **automatically walk-routable** — the mover walks cell-by-cell. `./api.sh reachability` (BFS from LHR) is the authority, not the abandoned legacy edge graph. You do *not* need `highway`/`connect` to make it reachable.
- Give it content: a `battle` (encounter), `loot`, `npc`, `sleep:true` (makes it a respawn checkpoint), or `textVariants:[{flag,text}]` (node text that changes after an event). Sync `world.md`/`maps.md`/`story.md`.

---

## 5. Game mechanics you compose content from

Content is expressed *in the game's own mechanics*, so know the vocabulary (details: `mechanics.md`, `docs/mechanics/`, Design Constants in `index.md`):

- **Skill checks (Ceremonia Roll):** `d20 + abilityMod + profBonus ≥ DC`. Pick a stat (STR/DEX/CON/INT/WIS/CHA) + skill + DC; branch with `onPass`/`onFail`.
- **Combat:** D&D-5e-style. Monsters are `{key,name,ac,hp,atk,dmgDie,dmgCount,dmgFlat,tier}`. `_monsterLevel(m)` normalizes threat to 1–20. **`tier` is one of exactly five** (`trivial|easy|medium|hard|deadly`) and is *not* cosmetic — it drives Void-enrage magnitude, initiative, encounter weight and the threat badge, and **every one of those readers falls back silently on an unknown value** (§DX-02g); the contract is pinned in both directions by `dx02g-monster-tier-contract.test.js`. Encounters fire on `node.battle`, on wilderness steps (`Hunt` mode ~2×), and gate `type:"combat"` quests.
- **XP / leveling:** Fighter Champion, cap L20. **All effort earns XP, you never lose XP** — successes full, misses/failed-checks a small fraction (§XP-01). Battle XP ≈ `AC·maxHP`.
- **Mission bit tokens:** permanent *receipts* granted by `mission_bit` bits (`_grantMissionBit`) — a witnessed-event record with a `day` stamp and a gate-referenceable flag. They are postconditions (kept), the inverse of KEY_EVENTS (preconditions consumed).
- **NPC favorability:** `favor` bits raise a relationship; dialogue has `impartial`/`questActive`/`friendly`/`dearFriend` tiers; the ending notices what you *shared*, not just what you killed.
- **The doom clock:** the world ends Day 49 (7 Codex Shards to seal the Void). Time is a real resource — `Wait`/rest and travel cost days. Some content is day-windowed (e.g. §BOARD-01 Void-tide bounties).
- **Save state:** `S_story` in `localStorage`. New persistent fields are declared once in `_S_DEFAULTS()` (single source of truth — see State Fields quick reference in `index.md`). Randomness that affects game state must come from the **seeded stream** (`S_story.rngState`, mulberry32), never `Math.random()`.

---

## 6. The hard invariants (break these and the build is wrong, not just imperfect)

These are non-negotiable. Full text in CONTRIBUTING.md.

1. **Free movement.** The world is *always* freely traversable. A step is refused for exactly two reasons — off-grid (`oob`) or sea (`impassable`). **No quest, flag, item, or mission bit may ever refuse a step.** There is no locked gate on a road. If a place must feel impassable, change the *terrain* (it genuinely becomes sea), never consult quest state in the mover.
2. **Mission gating ≠ movement gating.** A quest `gate` decides only whether a mission *lists* when you arrive (consulted once, in `storyCheckQuests`). You always reached the node freely.
3. **No jump travel, ever.** `checkpointNode` respawn (set by sleeping at a `sleep:true` node) is the only warp. Click-to-travel is auto-walking the route step by step, not teleporting.
4. **Host/Script separation.** `QUEST_DB` is script (declarative data); `QuestRuntime` is the host (the VM). Widen capability *through the grammar* (new opcode / gate shape), never with a new single-use term or a `_legacy_fn` closure. Control flow belongs to the VM, not to a leaf handler.
5. **Parity fences.** `MOVER:CORE`, `ROOMS:CORE`, `DUEL:CORE`, `QUEST:CORE` are pure, world-injected, and byte-identical to their `js/*.js` twins, asserted by `scripts/check-*-parity.js`. **Never edit an inlined copy** — edit `js/<mod>.js`, re-inline, and re-run the checker.
6. **Seeded RNG for game state.** Encounter/skill/loot/drop rolls draw the seeded stream (client `_seededNext()` ≡ server `seededNext`). Cosmetic randomness is fine.
7. **API-first.** Author through `./api.sh`; add the endpoint before the edit if it's missing.
8. **Narration.** Every `./say.sh` call speaks *what changed*, not a bare status word — full spec in §2 step 8 (say-narration directive).

---

## 7. Verify — tests and the known baseline

```bash
npm run check:walk        # 16 world-invariant CI gates (invariants/dupkeys/parity/behaviour/terrain/roads/rooms/quest/gate/rng/questgraph/nodeindex/noderegs/npcregs/anchors/legacycodes)
npm run nodes             # regenerate docs/maps/node-index.md — the LIVE node-code reference (§AUDIT-03l)
npm run anchors           # audit every doc anchor; `anchors:fix` refreshes drifted line hints (§DX-01e)
npm run legacy            # report 26×16-era node codes still in doc prose; `--annotate <file>` sweeps one (§AUDIT-03m)
npm test                  # Playwright integration suite  (STOP the server first — see below)
npm run test:mud          # MUD server-protocol harness
node --check js/wbapi-server.js   # server-file parse only — the HTML inline <script> is validated by npm test's browser load + the parity fences
```

**Known pre-existing baseline reds: `check:walk` is fully green (16/16; 11/11 since 2026-07-28 §DX-01a, gate #12 added 2026-07-29 §AUDIT-03l, gate #13 added 2026-07-31 §AUDIT-03j, gate #14 added 2026-07-31 §AUDIT-03n, gate #15 added 2026-07-31 §DX-01e, gate #16 added 2026-08-04 §AUDIT-03m) — any red there is a real regression you introduced. The Playwright suite carries FOUR, in ONE file** — a full run is **862 passed / 4 failed** (866 tests), last re-proved **2026-08-05** (§VM-01-G-FU-a, which added the 11-test `uqf-node-verbs-crown.test.js` — **6 of 11 fail on HEAD, and the 5 that pass are exactly the verbatim-move / unchanged-behaviour ones**; the same slice grew three registry pins in place — `uqf-node-hooks` 9→11 crown hooks, `uqf-npc-row-hooks`' npc-row block is contiguous but no longer the registry tail, `uqf-node-verbs-d1`'s label-verb pin excludes the `crown-` groups its own file owns. The prior **851** was §VM-01-G4d's count, which added the 12-test `uqf-node-verbs-d3.test.js` — 6 red on HEAD, the 6 passers exactly the unchanged-behaviour ones. The prior 839 was §VM-01-G4c's count, which added the 13-test `uqf-node-verbs-d1.test.js`; that run reported **838/5** because the known `multiplayer-presence:171` flake did not retry green, and the file passes **12/12** on its own. **7 of the 13 fail on HEAD and the 6 that pass are exactly the ones asserting *unchanged* behaviour.** The run before it also carried a red that was **mine and was correct** — `uqf-quest-activation.test.js:120` pinned that clicking Ori paid *nothing at click time*, which was a timing artifact of the inline handler, not the property the test exists for; the property is *"+300gp exactly once, from the quest chain"*, and it is now asserted against a further render instead. **Pin the property, never the incident.** The prior 826 was §VM-01-G4b's count, which added the 10-test `uqf-node-verbs.test.js` — **all 10 fail on HEAD**, because the migrated surface's DOM identity changed with it, so the before/after equivalence is carried by a separate golden-DOM diff of all four DUS states rather than by the test file. The prior 816 was §VM-01-G4a's count, which added the 12-test `uqf-verb-driver.test.js`; the run that added them reported 815/5, and **the fifth red was mine and was the assertion working as designed** — `quest-runtime-uqf.test.js:28` pins the whole `HANDLERS` key list precisely so a new opcode cannot enter the table unrecorded, so adding `cost` to the pin is part of the fix, not a concession to it. The prior 804 was §VM-01-G2b's count, which added the 8-test `uqf-npc-row-hooks.test.js`; that run reported 804/5 because the known `multiplayer-presence.test.js:171` flake did not retry green, and the file passes 7/7 on its own. The prior 796 was §AUDIT-03q's count, which added 5 tests to `audit03m-legacy-codes.test.js`; that run reported 795/5 because the known `multiplayer-presence.test.js:171` flake did not retry green, and the file passes 7/7 on its own — the earlier 791 was §AUDIT-03m-FU's count and 771 §DX-02l-FU's). **`multiplayer-presence.test.js:171` is a known flake — re-run the file before calling it a fifth red.** This list is the whole red set; **anything beyond these four is yours**:
> - `worldbuilder-crud-arrays.test.js` — **4/6** (CRUD array-field + itemChain widgets; never loads `roll2hit-v3.html`) — §DX-02d
>
> *(The fifth red — `dx02l-save-snapshots-cli.test.js` *"no author-facing doc reaches `/api/save` with raw curl"* — was **retired 2026-08-04 by §DX-02l-FU**. Same class as §DX-02e/§DX-02f: **the test was wrong, not the docs.** The assertion was line-level (`curl` AND `/api/save` anywhere on one line) and went red on the prose recording that very defect — CONTRIBUTING Hazard #7 and this file's own §7 both name `POST /api/save` and raw `curl` in one sentence. It now flags only shapes an author can **copy and run** — a line inside a fenced block, an inline code span holding the whole command, or a line starting with `curl` — and a positive-control test proves the detector still catches all four runnable shapes, so narrowing it is not the same as deleting it. **Lesson: the regex serves the prose, never the reverse** — a doc bent to satisfy a checker is the §AUDIT-03l failure wearing a green badge.)*
>
> *(The two extra reds §DX-01c found — `effort-xp.test.js:67` and `warrants-board.test.js:999` — were **retired 2026-07-30 by §DX-02f**. Both were **stale tests, not mechanic drift**: §XP-01's effort grant and §BOARD-01-FU8's ESCALATED standing both measured correct at HEAD. `effort-xp` stubbed `Math.random` to force a failed check, but §VM-01-B had moved `_rollSkill`'s d20 onto the **seeded** stream (`E.rng()`) — the stub controlled nothing and the test became a coin flip, not the "deterministic" red the row recorded. `warrants-board` hand-set `playerR/C` to a cell that disagreed with its own `currentCode`, so `storyRender`'s §CELL-03 position sync corrected the coords and the test read that correction as a warp. **Both now force the outcome through the engine's own dial — the DC — and derive position from `NODE_COORDS`.** Same lesson as §DX-02e: **pin the property, never a fabricated or generated coordinate** — and a test that stubs an RNG must stub the stream the code actually draws.)* *(The second one — `kg-zones.test.js` *"the corridor is real road"* — was **retired 2026-07-29 by §DX-02e**: the road was fine, the test's six hardcoded sample cells were the §DX-01a re-lay's casualties. It now asserts the promise against the engine's own road-weighted router instead of generated coordinates. **Lesson: never pin generated data by coordinate — pin the property it is generated to satisfy.**)*
- `check:walk` — **all 16 gates green.** The 16th, `check:legacycodes`, added 2026-08-04 §AUDIT-03m — **the prose half of §AUDIT-03l.** That row generated `docs/maps/node-index.md` and quarantined `maps.md`'s tables, but left the running sentences alone: *"north of SL"*, *"(Nodes CI, IN, TV…)"*, *"at the CO node"*. Those codes name nodes that no longer exist under those names, and **`CI` and `BK` are worse than dead** — each resolves to a DIFFERENT live node, so *"does this code exist?"* passes while the sentence is still wrong. The gate fails on a bare legacy code in a **SWEEP** doc and on any doc carrying legacy codes that is in **neither** SWEEP, PENDING nor HISTORY — the #13/#14 explicit-classification style, for the same reason: a percentage heuristic is blind to a doc that is *entirely* legacy-coded. **HISTORY docs (lab reports, `plan-archive.md`, BACKLOG, the quarantined `maps.md` tables) are never rewritten — annotate, don't rewrite** (§DX-02c / §AUDIT-03n precedent), and the tool **refuses** `--annotate` on one. Two deliberate limits, both asserted by `audit03m-legacy-codes.test.js` rather than left to be discovered: an **ambiguous** code (`DC` is a difficulty class 435 times, `EB` abbreviates Epic Battleground) counts only on a line that talks about nodes, and a **fenced block is code** — never annotated, so a dead code inside a runnable example is *not* caught by the gate and must be fixed by hand (one was: `./api.sh get node CY` → `HKG`). **PENDING is reported, not failed** — it was 230 references in 7 live docs; **§AUDIT-03m-FU (2026-08-04) swept all seven and `PENDING` is now empty**, so all **10** live docs are gate-fenced. That follow-up found the first sweep had a blind spot worth remembering: `nodeContextLine` is a **LINE** test, and the commonest way a story doc names a place — *"Write Entry 42 at CI"* — puts no node word on the line, so those hits were invisible. `world.md` and `story.md` sat **gate-green carrying 35 such codes between them**. The fix adds four hand-classified cues (a place preposition before the code, a place-noun after it, a code alone in parentheses, a code column `— EB |`), drops the `/` guard that was eating slash-separated node runs (all 218 corpus hits were node lists, e.g. `at CI/SL/DF/WM/MT` annotated only its first member), and adds three exemptions in the other direction: `CI` is **continuous integration** on any line with build vocabulary, `SW`/`SE` are **compass directions** inside a run of compass tokens (the sweep briefly rewrote *"N, S, E, W, SW, spire"* into a swamp), and a code that is one side of a **stated mapping** (`CQ→CDG`) is the sentence's subject, not its error. **The lesson that outranks all of them: annotation without verification LAUNDERS a wrong claim into a confident-looking live one.** `world.md`'s Act VIII Homecoming table named the wrong node for **four of its six** NPCs, and §AUDIT-03m had already annotated one of them (`Auros (BK)` → a tidy, wrong `` `VBY` ``); the engine's own `birkaNpcs` roster settles it. One reference — *"Tell Pachelbel at SH"* — is invisible to this tool by construction, because `SH` was **never** a `NODE_MAP` key (the §AUDIT-03p born-dead class) and so is absent from the LEGACY CODE MAP the detector is driven by. **Phase 2 (§AUDIT-03q, 2026-08-04) is the instrument for that blind spot:** a two-letter token that resolves in **neither** registry, in a node context, inside a SWEEP doc. It found that the reading pass had missed a second one on the same page — *"Player asks Pachelbel at `LLA` or SH"* — because neither the line test nor a place cue can see a code whose preposition belongs to the code **next to** it; the new signal is that a line which has already put a live code in backticks is talking about places, so the token beside it is one too. Classification is explicit for the third time in this family and for the third time for the same reason (a percentage heuristic is blind to a token that is *always* jargon): **19 tokens fire across the 10 swept docs, `NG` 47 times and never a node**, so each is listed in `NOT_A_NODE_CODE` with a reason or in `BORN_DEAD`. The phase also catches a second shape by the same test — a real historical code the `maps.md` legend never listed, so `npm run nodes` never put it in the map (`FR` = Fishmonger's Row → `AMS`). **Its limit is stated rather than discovered:** it hunts **exactly two letters**, the shape of the retired code space and of all eleven tokens the row was filed to classify; widening to three admits a technical doc's whole acronym vocabulary (`NPC` alone fires 151×) for no measured gain, so **a three-letter code written from memory is not caught** — asserted by a test, not left as silence that reads like coverage.
- `check:walk` — the earlier gates. The 15th, `check:anchors`, added 2026-07-31 §DX-01e — a doc anchor is now `` `symbol@1234` ``, and the gate fails if the **symbol** is not in the HTML (a dead pointer: renamed or removed) while only warning if the **number** drifted (`npm run anchors:fix` refreshes those; failing on drift would just re-create the tax the row retired). It resolves at identifier boundaries, so a rename that merely extends the old name — `XP_BY_TIER` → `XP_BY_TIER_RETIRED` — stays dead rather than matching by prefix. When it opened, **43 of the 50 migrated anchors were stale and 9 of 14 sampled bare numbers pointed at unrelated code**; bare anchors that remain in `plan-archive.md` / the lab reports are history and are deliberately not migrated. The 14th, `check:npcregs`, added 2026-07-31 §AUDIT-03n — the **npc-key mirror** of gate #13, and the same defect class in the other dimension: 13 engine registries are keyed by *NPC* key, and seven of them were keyed to the profiles' **surnames** (`couperin`/`weckmann`/`bruhns`), which the favor ledger never writes. 21 authored entries unreachable, plus six live code references — the victory screen's own `npcOrder` (so the ending showed the **stranger** epilogue for Quill, Weckmann and Bruhns at any favor) and five `_npcFavor('bruhns')` gate sites guarding whole scenes, one of them the only delivery button for an item the player can be carrying. It checks registry keys, `_npcFavor('…')`/`npcFavorability['…']` literals, and `npcOrder` arrays; classification is **explicit** for the same reason gate #13's is. **The tell was two `npcOrder` lists that disagreed** — always suspect the one that isn't corroborated elsewhere. Note the deliberate exclusion: whether an npc-*valued* field RESOLVES is not checked here, because `NODE_MAP`'s inline `npc` is *supposed* to be a display name (§AUDIT-03h). **Phase 5, added 2026-08-04 §AUDIT-03k, checks the other property of those values — that they are CANONICAL.** Slugifying a node's display name mints a rival key for the person standing there, so `_questsByNpc` files one character under two headings: `city_guard_captain` held 5 quests while `yael`, named in LHR's own node text, held 17. `WBAPI.NPC_ALIASES` maps the seven live pairs to their profile key, `npcKeyVocab()` **excludes** the alias slugs, `editField` + the quest-create path collapse an anchor on write, and the gate fails on any authored `npc:` alias — plus, in the #13/#14 house style, on any NEW inline display name that collides with a live profile and is classified in neither `NPC_ALIASES` nor `NOT_AN_ALIAS`. A role collision is not an identity: SEN's `ship_captain` matches `captain_smollett_sen`'s occupation exactly, but Smollett captains the Hispaniola at `HMS`. The 13th, `check:noderegs`, added 2026-07-31 §AUDIT-03j — fails if any node reference in the ENGINE's own JS fails to resolve in `NODE_MAP`: the keys of 10 node-keyed registries, 8 node-valued string fields (`nodeCode`/`node`/`activateNode`/`waypointNode`/…), and `NPC_FAREWELLS`' composite `<from>_to_<to>` route keys. It found **42 dead references across 5 registries**, all written in the retired 26×16 codes and all failing silently (a missed lookup renders nothing). **Its classification is EXPLICIT, and that is the point:** the obvious "flag tables where most keys look like node codes" heuristic is blind to a table that is *entirely* dead — which is exactly what `NODE_NPC_KEYS` (5/26 live) and `JUNCTION_VIGNETTES` (1/8) had become. Every codeish top-level table must be listed in `NODE_KEYED` or in `NOT_NODE_KEYED` with a reason, and an unlisted one fails. **It grew a 5th phase 2026-08-04 (§AUDIT-03p) for the blind spot inside the blind spot:** phases 1–2 read only *top-level* `const` declarations, so a registry declared **inside a function** could neither fail nor be forced into the classification. `_voidFlavorLine`'s local `CLUSTER` had sat that way since `cc562f5` with **11 of its 16 keys dead** — the Void's "first crack" line rendered at 5 of the 16 places it was authored for — and **four of the original keys (`SH`/`PH`/`MH`/`WM`) were never `NODE_MAP` keys at any point in the file's history**: written from memory rather than from the world, so they were born dead, which is why "it used to work" is not a safe assumption about a table this old. Phase 5 applies the same explicit classification (`LOCAL_NODE_KEYED` / `NOT_NODE_KEYED`) to indented object literals whose keys are all codeish; there are 3 such node tables and 2 compass ones. **Phase 6 (§VM-01-G-FU, 2026-08-05) fences the shape none of 1–5 could see: comparison literals and synthetic battle codes.** A `node.code === 'XX'` guard, a `nodeCode ===` overlay guard, a `code:'…'` battle spread, a `defeatedBattles['…']` read or a `battles:[…]` gate member must resolve in `NODE_MAP` **or** be classified in `SYNTHETIC_BATTLE_CODES` (grown 3 → 20 with the engine-region census; a classified code the file stops mentioning fails as a *stale entry*). The scanner is comment-aware — two corpus hits are prose in comments, the §AUDIT-03f class — and its limit is stated: the scan is textual, so an aliased comparison (`const c = node.code`) is not caught. The §VM-01-G-FU triage that added it measured the engine region **fully live** (36 codes, 12 quest IDs, 14 battle keys, every read flag written) — young content, not fenced content, which is exactly when a fence is cheapest. The 12th, `check:nodeindex`, added 2026-07-29 §AUDIT-03l — fails if `docs/maps/node-index.md` drifts from the live `NODE_MAP` (`npm run nodes` regenerates it). **That file, not a table in `maps.md`, is where you look up a node code:** `maps.md`'s hand-maintained legend had 81 of 92 dead codes in a retired 26×16 coordinate space, and is the most likely source of `710bb75`'s `activateNode:"SF"` (§AUDIT-03c). The 11th, `check:dupkeys`, added 2026-07-28 §AUDIT-03a — fails on any duplicate key inside one data-section entry, the last-key-wins rot class; since §AUDIT-03f same day it also asserts parse parity — every entry key in the source text must survive the `wbapi-core` parse, the silent-drop class that hid `quest_sea_01`/`quest_sb_01`). The last two carried reds retired 2026-07-28 (§DX-01a): `check:invariants` I1/I2 (J14/J15 `junction:true` §KG highway-tool leftovers — nodes removed) and `check:roads` R2/R3 (TGS off-component + road cell 10,207 on Gulf-of-Finland sea — `build-roads.js --apply` regen laid the real Tungas–Station 7 road, col 217 rows 8–13, and rerouted TLL→SPB via the 8,20x corridor). Node count is now **416** (418 − the 2 junctions).
- `quest-runtime-uqf.test.js` — **fully green, no known red.** The old *"~17–18-failure env baseline"* was disproved (2026-07-22, §DX-01b) as 17 deterministic **stale tests** — not an env flake — and fixed; the last red was retired 2026-07-23 (§BOARD-01-VOID-GATE). So a failure here is a real regression: the git-stash-diff ceremony is retired. Full history: the §DX-01b + §BOARD-01-VOID-GATE ship records in BACKLOG.md / plan-archive.md.

**Test-run rules (learned §NAV-01h):**
1. **Never trust a piped test run's exit code** — `… | tail` returns the pipe's last stage. Run bare and check `$?`, or redirect to a file and read the `N failed / N passed` summary line.
2. **Stop the WBAPI server before Playwright** (`./wbapi-toggle.sh stop`) — a live `:1367` makes `probeServer()` replace the injected mock world (~46 false failures). Restart after.

---

## 8. Conventions

- **Branch per track.** Each `§`-track gets its own `feat/<slug>` (or `chore/<slug>`) branch; commit there and open a PR to `main` — **never** commit a track straight to `main`. (We're on `feat/board-01-warrants-board` right now.)
- **Section IDs:** work is tracked as `§XXX-NN` (e.g. `§VM-01`, `§BOARD-01-FU3`). New tracks get a new `§` tag + a heading in BACKLOG.md and an anchor other rows link to.
- **§RESUME "Continue Here":** the newest work keeps a reverse-chronological log at the top of BACKLOG.md — a dense paragraph per increment with commit hash, evidence, and the exact next step. Add to it as you go; it is how the next session resumes without re-deriving context.
- **A doc anchor names a symbol, not a line (§DX-01e).** Write it as one token — `` `execBits(bits, ctx)@22204` `` — where the **symbol is the pointer** (any literal substring of the line you mean, optionally file-qualified as `` `js/wbapi-server.js:function seededNext@1147` ``) and the number is a cached hint. `npm run anchors` audits every doc, `npm run anchors:fix` refreshes drifted numbers mechanically, and `node scripts/resolve-anchors.js <symbol>` answers *where does this live now*. `check:anchors` (gate #15) **fails on a dead symbol** — a real stale pointer — and only warns on a drifted number. Bare `` `21722` ``-style anchors survive in `plan-archive.md` and the lab reports: those are **history — annotate, don't rewrite**, and never trust their numbers.
- **Status markers:** `[ ]` open · `[~]` in-progress/recurring · `[x]` closed (kept for context, migrated to plan-archive.md over time). Mark `[x]` only after verified, with evidence.

---

## 9. Cheat sheet

```bash
# Am I set up?
./api.sh ping && ./wbapi-toggle.sh status

# What exists already? (grep before building)
./api.sh list quest --q "TERM";  ./api.sh get node LHR;  grep -n "SYMBOL" roll2hit-v3.html
npm run nodes && open docs/maps/node-index.md   # the LIVE node-code reference (never read a code off a doc table)
node scripts/resolve-anchors.js SYMBOL   # where does this live NOW? (doc anchors are `symbol@line`, §DX-01e)
npm run stats                            # live node/monster/quest/terrain/NPC/line/byte totals (never trust a hardcoded count)

# Author
./api.sh post node code=NEW name=<terrainKey> label="…" act=N
./api.sh post quest id=… title="…" type=side activateNode=…    # flat quests only
#   nested UQF → hand-author a QUEST_DB block (restart server first), then ./api.sh advise <id>

# Wire + validate the world
./api.sh reachability     # 100%?
./api.sh broken           # 0?
./api.sh advise <questId> # errors=[] warnings=[]?
./api.sh snapshots        # anything dated left beside the game file? (gitignored — nothing else reports it)

# Verify + close
git rev-parse --abbrev-ref HEAD          # on the track's feat/<slug> branch, NOT main? (§8)
npm run check:walk;  node --check js/wbapi-server.js
git commit -m "feat(§ID): …" && ./say.sh "feat: <subject>"   # commit on the branch; PR to main
#   → flip the BACKLOG row to [x] with hash + evidence
```

**The one sentence to remember:** *grep before you build, author through the API, sync the doc in the same breath, keep the road free and the RNG seeded, finish the one item — and turn every tangent you notice into a BACKLOG row instead of a detour.*

---

*© 2026 Paul Richeson — MIT License.*
