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

# Network health — run at the start and end of every session that touches nodes
./api.sh reachability     # target 100% reachable from LHR
./api.sh broken           # target 0 broken edges
./api.sh audit            # integrity scan
```

### API hazards you must internalize (CONTRIBUTING.md, learned the hard way)

1. **Restart the server before any WRITE session.** The server holds the *whole* file text from when it started and re-writes it on every data WRITE. If you hand-edited CSS/JS while the server was up since *before* your edit, the next `./api.sh put/post` **silently reverts your CSS/JS**. Rule: `./wbapi-toggle.sh restart`, verify a fresh PID, and confirm a CSS/JS signature survives the first write (`grep -c _monsterLevel roll2hit-v3.html`). When hand-editing CSS/JS, stop the server first, and commit early.
2. **`./api.sh post monster` is BROKEN — do not use it.** It serializes into the wrong section and drops `dmgDie/dmgCount/dmgFlat`, writing `tier:NaN`. Author new monsters by direct HTML edit inside `MONSTER_POOL`. (`post node` / `post quest` / field PUTs are fine.)
3. **Nested UQF quest bodies can't go through flat `post quest`.** `post quest` writes flat fields; a quest with nested `bits`/`completion`/`onComplete`/`gate` is hand-authored as a clean `QUEST_DB` block (a re-parsed data section, so Hazard-#1-safe if the server is restarted first). Use `./api.sh advise <id>` to validate the result.
4. **`./api.sh highway A B --execute` does NOT lay road.** It drops sparse `junction:true` waypoint nodes (which violate `check:invariants` I1/I2) and zero `ROAD_CELLS`. A contiguous-land node is already walk-reachable without it. To make a corridor encounter-free road, edit `ROAD_RUNS` directly. `./api.sh del node J##` is also buggy for junctions (model/file desync) — remove junction entries by hand.

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

- **`bits`** are the VM opcodes: `skill_check` (d20 + abilityMod + profBonus ≥ DC), `mission_bit` (grant a kept token/flag), `reward` (xp/gold), `flag_write`, `narrative`, `favor` (NPC relationship), `combat`, `unlock` (activate a quest from afar), `choice`. Compose behavior from these — **do not write a new single-use bit kind or a `_legacy_fn` closure** (Host/Script Separation Policy).
- **`gate`** is a compiled boolean expression: a bare object is implicit `all` (AND); `{any:[…]}` = OR, `{not:…}` = NOT, over leaf terms (`flags`, `flagsAny`, `items`/`itemsAll`, `battles`, `questsComplete`). The gate decides **whether the mission lists** when you arrive — it is *mission gating*, never *movement gating* (§6).
- **"Collect at node" pattern:** put loot on the node (`node.loot`) and complete the quest with `itemsAll`/`atNode` — see `quest_math_*` / §KG for the canonical shape.
- **`onActivate` (§VM-01-G3)** controls the arrival-activation announcement: **absent** → the default `📋 title` strip line; **`null`** → silent; **`{msg, delayMs}`** → a bespoke delayed narration (the cat/WM arcs' staged intros). **`boardExempt:true`** keeps a quest off the Warrant's Board entirely (the NG+ remembrance set). Activation runs at the START of `storyRender` (`_uqfActivateAtNode`) so per-node UI keyed on `'active'` status renders in the same arrival.
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
- **Combat:** D&D-5e-style. Monsters are `{key,name,ac,hp,atk,dmgDie,dmgCount,dmgFlat,tier}`. `_monsterLevel(m)` normalizes threat to 1–20. Encounters fire on `node.battle`, on wilderness steps (`Hunt` mode ~2×), and gate `type:"combat"` quests.
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
npm run check:walk        # 11 world-invariant CI gates (invariants/dupkeys/parity/behaviour/terrain/roads/rooms/quest/gate/rng/questgraph)
npm test                  # Playwright integration suite  (STOP the server first — see below)
npm run test:mud          # MUD server-protocol harness
node --check js/wbapi-server.js   # server-file parse only — the HTML inline <script> is validated by npm test's browser load + the parity fences
```

**Known pre-existing baseline reds: NONE — everything below is fully green (since 2026-07-28, §DX-01a). Any red is a real regression you (or a concurrent edit) introduced.**
- `check:walk` — **all 11 gates green** (the 11th, `check:dupkeys`, added 2026-07-28 §AUDIT-03a — fails on any duplicate key inside one data-section entry, the last-key-wins rot class; since §AUDIT-03f same day it also asserts parse parity — every entry key in the source text must survive the `wbapi-core` parse, the silent-drop class that hid `quest_sea_01`/`quest_sb_01`). The last two carried reds retired 2026-07-28 (§DX-01a): `check:invariants` I1/I2 (J14/J15 `junction:true` §KG highway-tool leftovers — nodes removed) and `check:roads` R2/R3 (TGS off-component + road cell 10,207 on Gulf-of-Finland sea — `build-roads.js --apply` regen laid the real Tungas–Station 7 road, col 217 rows 8–13, and rerouted TLL→SPB via the 8,20x corridor). Node count is now **416** (418 − the 2 junctions).
- `quest-runtime-uqf.test.js` — **fully green, no known red.** The old *"~17–18-failure env baseline"* was disproved (2026-07-22, §DX-01b) as 17 deterministic **stale tests** — not an env flake — and fixed; the last red was retired 2026-07-23 (§BOARD-01-VOID-GATE). So a failure here is a real regression: the git-stash-diff ceremony is retired. Full history: the §DX-01b + §BOARD-01-VOID-GATE ship records in BACKLOG.md / plan-archive.md.

**Test-run rules (learned §NAV-01h):**
1. **Never trust a piped test run's exit code** — `… | tail` returns the pipe's last stage. Run bare and check `$?`, or redirect to a file and read the `N failed / N passed` summary line.
2. **Stop the WBAPI server before Playwright** (`./wbapi-toggle.sh stop`) — a live `:1367` makes `probeServer()` replace the injected mock world (~46 false failures). Restart after.

---

## 8. Conventions

- **Branch per track.** Each `§`-track gets its own `feat/<slug>` (or `chore/<slug>`) branch; commit there and open a PR to `main` — **never** commit a track straight to `main`. (We're on `feat/board-01-warrants-board` right now.)
- **Section IDs:** work is tracked as `§XXX-NN` (e.g. `§VM-01`, `§BOARD-01-FU3`). New tracks get a new `§` tag + a heading in BACKLOG.md and an anchor other rows link to.
- **§RESUME "Continue Here":** the newest work keeps a reverse-chronological log at the top of BACKLOG.md — a dense paragraph per increment with commit hash, evidence, and the exact next step. Add to it as you go; it is how the next session resumes without re-deriving context.
- **Line anchors drift.** BACKLOG/notes cite bare line numbers (`21722`, `36102`) as *hints* — **re-grep the symbol before editing**, never trust the number. (This drift is itself logged as a refactor candidate — see §DX-01 in BACKLOG.md.)
- **Status markers:** `[ ]` open · `[~]` in-progress/recurring · `[x]` closed (kept for context, migrated to plan-archive.md over time). Mark `[x]` only after verified, with evidence.

---

## 9. Cheat sheet

```bash
# Am I set up?
./api.sh ping && ./wbapi-toggle.sh status

# What exists already? (grep before building)
./api.sh list quest --q "TERM";  ./api.sh get node LHR;  grep -n "SYMBOL" roll2hit-v3.html
npm run stats                            # live node/monster/quest/terrain/NPC/line/byte totals (never trust a hardcoded count)

# Author
./api.sh post node code=NEW name=<terrainKey> label="…" act=N
./api.sh post quest id=… title="…" type=side activateNode=…    # flat quests only
#   nested UQF → hand-author a QUEST_DB block (restart server first), then ./api.sh advise <id>

# Wire + validate the world
./api.sh reachability     # 100%?
./api.sh broken           # 0?
./api.sh advise <questId> # errors=[] warnings=[]?

# Verify + close
git rev-parse --abbrev-ref HEAD          # on the track's feat/<slug> branch, NOT main? (§8)
npm run check:walk;  node --check js/wbapi-server.js
git commit -m "feat(§ID): …" && ./say.sh "feat: <subject>"   # commit on the branch; PR to main
#   → flip the BACKLOG row to [x] with hash + evidence
```

**The one sentence to remember:** *grep before you build, author through the API, sync the doc in the same breath, keep the road free and the RNG seeded, finish the one item — and turn every tangent you notice into a BACKLOG row instead of a detour.*

---

*© 2026 Paul Richeson — MIT License.*
