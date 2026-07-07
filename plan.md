<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->
## I. Directive

> You are an expert prompt interpreter with an electrical engineering / computer science background. Follow the sections below: use the suggestions in II, III, IV to implement ideas from the list, or append new ideas to the end of the list when told about them. Work incrementally — present one step at a time and wait for "continue."

### API-First Development Policy

**Preferred workflow for any data addition or edit to `roll2hit-v3.html`:**

1. **Check API first** — before editing HTML, use `./api.sh` to confirm current state: `./api.sh ping`, `./api.sh list <type>`, `./api.sh audit`. Direct HTML edits are a fallback only when the API cannot yet express the operation.
2. **Write the API method first** — if the operation isn't yet supported, add the endpoint to `wbapi-server.js` and restart before touching the HTML.
3. **Create/modify via API, not HTML** — preferred: `./api.sh post <type> [k=v ...]` or `./api.sh put <type> <id> [k=v ...]`. The tool handles nonces automatically and queues all requests with retry.
4. **Restart server after adding endpoints** — `./wbapi-toggle.sh restart` (or `start` if stopped).
5. **When adding items to plan.md** — cross-reference current state with `./api.sh audit` and `./api.sh list <type>` to confirm what actually exists vs. what the plan assumes.

> *«cli-quick-reference» archived to plan-archive.md (2026-07-02). Day-to-day: ./api.sh help. Full reference: wbapi-help.md + API-README.md.*

**Single source of truth:** `roll2hit-v3.html` is the entire game. The API reads its text directly and writes mutations back in-place. `wbapi-server.js` and `worldbuilder.html` are authoring tools — the game requires neither at runtime.

### Cell-First Navigation Policy

**Cell = Location.** All map locations are identified by `(r, c)` cell coordinates. The two-letter node code is a lookup alias for a named cell, not a location pointer. Use `CELL_GRID["r,c"]` to resolve coordinates to node codes. Do not navigate by chasing `N/E/S/W` pointer fields — those were stripped in §CELL-01. When writing new features:

- Positions travel as `{ r, c }` pairs.
- Node codes are resolved from position: `CELL_GRID[\`${r},${c}\`]`.
- "Adjacent" means `(r±1, c)` or `(r, c±1)` — not stored edge links.
- Quest activation checks: `CELL_GRID[\`${s.r},${s.c}\`] === quest.activateNode`.

### Free-Movement / Mission-Gating Policy

**The world is freely traversable. Quests never block movement. "Gating" applies only to the *mission list*, never to a *road*.**

This is a hard invariant, not a preference. Two distinct, non-overlapping mechanisms — keep them separate:

1. **Movement gating = terrain/geometry ONLY.** A step is refused for exactly two reasons (`mover.js` / inlined `moverMove`): `'oob'` (off the grid) and `'sea'` (destination cell is in the `impassable` set — sea + `IMPASSABLE_CELLS`). **No quest, flag, `S_story` field, mission bit, or item may ever cause a step to be refused.** There is no "blocked road," no "locked gate on a path," no "come back when you've done quest X to pass here." Water crossings are carried as **SEA_LANES land bridges** (passable cells), not as conditional barriers. If a future feature needs a place to feel impassable until something happens, it must do so by **changing terrain/`CELL_GRID`/`IMPASSABLE_CELLS` state** (the cell genuinely becomes/stops-being sea), *not* by consulting quest state inside the mover.

2. **Mission gating = quest `gate` ONLY (listing, not traversal).** A quest's `gate` (UQF) / legacy `activateCond` decides **whether a mission is *offered/listed* when you arrive at its `activateNode`** — consulted in exactly one place, `storyCheckQuests` (`if (q.schema==='UQF-1.0' && !QuestRuntime.canActivate(q.id)) return;`). An unsatisfied gate means the quest simply isn't added to your journal yet (e.g. act 2 of an arc lists only after act 1 passes — sequential **mission availability**). You always reached the node freely; only the *listing* was deferred. `gate:{}` = always listed; `gate:{flags:[…]}` = listed once the prior flag is set. **`gate` is mission metadata; it must never be read by the mover or any movement/entry code.**

**Allowed:** gating mission *listing* (sequential arc unlock, prerequisite missions, flag/node/battle-conditioned availability). **Forbidden:** gating *movement* on quest/flag state (a quest that bars a road, an exit that won't open until a mission is done, an NPC who physically blocks a cell).

> *«free-movement-enforcement-audit» archived to plan-archive.md (2026-07-02). Re-run the mover-gate greps (archived) before shipping any movement or quest-availability change.*

> *«incremental-recitation-rule» archived to plan-archive.md (2026-07-02). Applies only when writing vignette content: say each segment aloud, write incrementally, commit + speak per vignette.*

### Loop vs. Ask Rule

Before starting any task:

- **Loop tasks** (no user input needed — clear next step): begin immediately, state what you are doing in one sentence.
- **Ask tasks** (user decision required): present a yes/no or choice prompt. Then run:
  ```bash
  say "If you say yes: <one sentence describing the intention and outcome of yes>"
  ```

### Commit + Speak Rule

After every `git commit`, immediately run:

```bash
say "<commit subject line>"
```

Read the **subject line only** aloud via macOS `say`. This confirms the commit completed and anchors the session.

### Test-Run Rules (learned 2026-07-03, §NAV-01h session)

1. **Never trust a piped test run's exit code.** `npx playwright test … | tail -N` (or `| grep`, `| tee` without `pipefail`) returns the LAST pipe stage's exit code — a suite with 46 failures reported `exit 0` twice this way and the failure list scrolled past the tail window. Either run the suite bare and check `$?`, or redirect to a file (`> run.txt 2>&1; echo exit=$?`) and read the summary line (`N failed / N passed`) from the file. The pass/fail verdict comes from the summary counts, never from a truncated tail.
2. **Stop the WBAPI server before running Playwright suites** (`./wbapi-toggle.sh stop`). A live server on :1367 lets the boot-time `probeServer()` auto-load replace the injected mock world in every non-hermetic describe — 46 false failures + ~8 min retry burn; the same walk suite is 89/89 in 22 s with the server stopped. (Known inverse: 2–3 `worldbuilder-crud-arrays.test.js` itemChain tests currently *need* the server to dismiss the welcome screen — §NAV-01 follow-up 5 migrates them to the hermetic pattern.) Restart the server after the run.

### Lab Report Policy

Write a new `lab-report-<title>.md` when any of the following is true:

| Trigger | Examples |
|---------|---------|
| Major collection added or redesigned | New monster group, terrain cluster, NPC faction, item economy |
| Large redesign touching multiple systems | Weapon drop overhaul, Luck Stat, fishing bait sub-system |
| New narrative theme or arc | New quest chain spanning 3+ nodes, new named faction, new NPC arc |
| Design review before implementation | IEEE-format spec locking data shapes and flow before any HTML edit |
| Session postmortem with non-obvious decisions | Choices that won't be recoverable from code or core docs alone |

Do **not** write a lab report for: a single monster/quest addition, a value correction, or small additions that fit in an existing doc section.

---

## II + III. Design Constants & State Fields

> **Moved to `index.md`** — see "Design Constants Quick Reference" and "State Fields Quick Reference (S_story)" sections there.

---

## §BACKLOG — Open Items

### §RESUME — Continue Here

> **⟶ Current state (2026-07-07): the multiplayer track AND the Game Content sweep are both fully closed and archived.** §MESH-01 (core + gameplay ladder + FU 1–14) and **§MESH-02 (a)–(j)** shipped — gates at the §MESH-02 close: mud-harness **270/270** ([A]–[R]) · nav+autosave+mesh Playwright 86 · worldbuilder-mesh 4/4. **Five Game Content arcs closed 2026-07-07** — §GR (+ `fishmongerRowRestored` payoff via the new `node.textVariants` mechanism, `85faf9b`) · §DESIGN-03 · §DUNGEON-01 · §MATH-01 (completions, `32d7bb0`) · §FUTURE-01 (18-quest Saul→Paul, `8aef96c`) — four were stale-PLANNED closes (audit + hermetic smoke each; **grep before building**). The §FUTURE-01 follow-up trio is done: cloak-with-Carpus line ✅ `6375dcd` · §MBIT-02 bitLabel cleanup ✅ `ce8dbc9` (game-wide `_flagToLabel` rewrite, 2,420 fallbacks, quest-runtime-uqf **296/296**) · this archive pass. Ship records (verbatim): **plan-archive.md §"Archived 2026-07-07"**.
>
> **Next on "continue": an ASK task — every remaining backlog item needs a user decision.** Options: **§1367** (8 clarification questions gate it, `project_1367_setting`) · **§GR-D** Froberger Entry 42 (needs NG+ tracking, unsupported) · the flagged latent quest bugs awaiting approval (`project_open_gaps` items 3/4/6: skill_check 'done'-vs-'complete' dead handlers, onComplete+xpAward double-counts, guide_02/03/06 dead gates) · `[INVESTIGATE]`/reading-circle UI gaps · §NAV-01-FU small items · the two pending Design Decisions (arc-ID field, §MBIT-02-E — both already resolved *do-not-build*). *(The monster-drop nerf ✅ SHIPPED 2026-07-07 as §FC06 — see Mechanics & Systems below.)* New arcs need their `lab-report-*.md` locked before any HTML edit.
>
> **Operational notes:** `./wbapi-toggle.sh start` hangs from a non-interactive shell — start detached: `(nohup node --max-old-space-size=4096 wbapi-server.js >> milepoints/wbapi-server.log 2>&1 &)`. Two servers in one repo dir need `SERVER_ID_FILE`/`PEERS_CACHE_FILE` env overrides. **WBAPI string-field PUT hazard (2026-07-07):** a value carrying real newlines is written raw into the double-quoted JS literal — it breaks the game file AND makes the entity unparseable by the server; always pass literal `\n` two-character escapes, never the JSON-string-literal form `text='"…\n…"'` (parseKV decodes it). Object-field PUT (gate/completion) persists correctly since the §MATH-01 `editStructuredField` fix.
>
> Before running any test gate, re-read **Test-Run Rules** (§I above): piped exit codes lie, and the WBAPI server must be stopped for Playwright.
>
> All earlier shipped work (§WALK, §NAV-01, all of §MESH-01 **and §MESH-02**, the UQF waves, §CELL-13 re-removal, the five 2026-07-07 arc closes) is archived in **plan-archive.md** — each block re-verified before the move. **Standing rule from §CELL-13: no jump travel, ever** — `checkpointNode` death-respawn is the only warp.

### §NAV-01-FU — Navigable World follow-ups (parent ✅ CLOSED 2026-07-03 → plan-archive.md + `lab-reports/lab-report-nav01-navigable-world.md`)

- [ ] **Small follow-ups (found during §NAV-01):** (1) `_renderMiniMap`'s "Void's First Sign" special case still targets cell `(4,3)` — a pre-§WALK-1.5 coordinate, now a real band cell in the North Atlantic; re-anchor or retire. (2) `_questNodes()` is built once per session — fine while QUEST_DB is static at runtime; invalidate if quests ever mutate live. (3) Map-tab hover info for road cells could name the road's destinations (reuse `__roadDestination`). (4) Consider GLOBE panel click → jump the map tab / world panel to that region (read-only navigation aid, no teleport). (5) Migrate the older worldbuilder describe blocks to the §NAV-01g hermetic pattern (`page.route` firewall on `:1367` BEFORE `page.goto` — kills ~7 min of retry burn from the `probeServer()` auto-load race; `#panels` boots scrolled off-viewport headless, canvas mouse tests need `scrollIntoViewIfNeeded()` first). Confirmed live 2026-07-03: with a server up, 46 walk tests fail on the clobbered mock ("Yugurt Lake" ≠ 'Alpha'); with it down, `worldbuilder-crud-arrays.test.js` itemChain tests fail instead (welcome-screen never dismissed — they need the auto-load, or better, the same hermetic stub + explicit dismissal).

### Tooling

> *§EDITOR-02-FU (Mission Builder follow-ups) + §EDITOR-03 (worldbuilder UQF export) ✅ COMPLETE — archived to plan-archive.md §"Archived 2026-07-06". The whole authoring pipeline emits UQF-1.0; detail: playbook §1 Wave 8b row.*

### Data / Architecture

> *«§CELL-13-REVERTED» ✅ resolved 2026-07-03 (`b027440`, jump-travel re-removed on user directive) — archived to plan-archive.md §"Archived 2026-07-03 (afternoon pass)". Standing rule: no jump travel, ever.*

> *«§DATA-01-REVERTED» ✅ RESOLVED 2026-07-06 (user decision: **superseded by §ARCH-01 UQF + residual fixed**). Evidence: all ~2,700 quests are declarative UQF-1.0 — `onPass`/`onFail` grep to 2,650+ occurrences but **zero functions** (all `[{kind:…}]` descriptor arrays); QuestRuntime is the sole execution surface; ZRH duplicate already re-fixed as `DNF`. Restoring `QUEST_EFFECTS`/`QUEST_HOOKS` would have built a second, competing effects system — rejected. The one real unshipped residual — the quest-journal renderer concatenating `q.title/desc/hint` into `innerHTML` — SHIPPED as textContent DOM building (`storyRenderQuests`, ~L28626). The lab report `lab-reports/lab-report-quest-data-code-separation.md` stays as historical design record (no longer a restore spec). One state-conditional `passText:()` remains by design (Codex finale, Prior Carrier variant, ~L20858).*
> *§ARCH-01 Universal Quest Format (UQF v1.0) ✅ CLOSED 2026-07-05 (W8c `647e070`) — all ~2,700 quests UQF-1.0; QuestRuntime the single execution surface; QUEST_DB the single source of truth; quest-runtime-uqf 288 green. Full row + wave history: plan-archive.md (2026-07-06 sections) + `lab-reports/lab-report-uqf-migration-playbook.md`; residuals (`quest_math_01–05` activate-only → §MATH-01; 30 dead `blq_05–10` stubs) test-pinned; latent bugs flagged NOT fixed (lair-clear xp double-count, dead skill_check handlers) → `project_open_gaps`.*

### Game Content — Major Planned Arcs

> Each is design-complete or scoped in a memory file; **all require a `lab-report-*.md` locking data shapes before any HTML edit.** Restored here 2026-06-25 from memory (dropped from plan.md during the §WALK rewrite).

> *Five arcs ✅ CLOSED 2026-07-07 and archived — **§GR** "La Riva" (already shipped at Layer 78; + the fishmongerRowRestored payoff, Mechanics note below) · **§DESIGN-03** Ceremonia Roll (already shipped; 104 live skill_check quests) · **§DUNGEON-01** 10 Dungeon Themes (already shipped) · **§MATH-01** Mathematical World (completions shipped `32d7bb0`; nodes moved to the walkable HKG pocket) · **§FUTURE-01** Saul→Paul (already shipped, 18 quests §LIX–§LXIX/§PAUL-01; cloak-with-Carpus residual `6375dcd`; §MBIT-02 bitLabel residual `ce8dbc9`). Four of the five were stale-PLANNED closes — the lesson stands: **grep before building** (`project_data01_reverted`). Full ship records (verbatim, incl. smoke matrices and the WBAPI newline/object-PUT hazards): plan-archive.md §"Archived 2026-07-07".*
- [ ] **§1367 — Historical 1367 AD integration** — 6 events→quest seeds (Nájera/routiers, Tamerlane, Ottoman Balkans, Hanseatic peak, Wycliffe, Black Death aftermath); **8 clarification questions in §1367-D gate HTML integration**. No anachronisms. See `project_1367_setting`.
- [ ] **§GR-D Froberger Entry 42** — blank page filled on second playthrough. Requires NG+ state tracking (currently unsupported).
- [~] **§IDEA-01 — Idea Generator: found-text → quest-theme seeds** — repeatable process: paste any found-text list (affirmation loops, song lyrics, transcripts) → dedupe repeats + ASR garbles → **every substantive line** becomes a categorized quest-theme one-liner in `brainstorm-one-liners.md`, with a per-line coverage table proving 100% coverage (artifacts like [Music]/timestamps discarded, garbles reconstructed + noted). Seeds are backlog fodder, NOT scoped work — promoting a seed = its own § entry here (+ lab report per policy if it grows to a chain/faction/system). **Processed so far:** S1 "Quiet Power" (AFF-01..24) · S2 "That Girl" (AFF2-01..34) · S3 "Queen of Luxury" (AFF3-01..11) — per-source detail + cross-links to live systems archived 2026-07-03 (plan-archive.md). New sources append as S4+.

### Mechanics & Systems

- [x] **§MBIT-02 — Mission Bit Token follow-ups ✅ FULLY CLOSED 2026-07-07** — §MBIT-01 shipped (`_grantMissionBit`/`_takeMissionBit`, `type:'mission_bit'` items). **`bitLabel` cleanup ✅ SHIPPED 2026-07-07** (`ce8dbc9` — Paul arc was already 11/11 explicitly labeled, source-checked vs spec + Acts; real fix = chain/act-aware `_flagToLabel` rewrite covering all 2,420 label-less mission_bits, residual-ugly 2,301→0, 3 permanent tests, quest-runtime-uqf 296/296; full record: plan-archive.md §"Archived 2026-07-07"). **`_takeMissionBit` consumed-token safety ✅ SHIPPED 2026-07-07** — finding: **no hardcoded call sites by design** (bits are permanent receipts per §MBIT-02-E, not spent goods); the sole author path is the declarative `takeBit` itemChain action, which no quest uses. Real gap was that `_takeMissionBit` cleared the flag unconditionally while mission-bit flags are **gate-load-bearing** (`ezzirConfronted`/`lyraConverted` gate downstream arcs) → spending a token could silently un-gate an arc. Fix: new lazy `_gateFlagSet()` (collects `gate.flags`/`flagsAny`/`notFlags`); `_takeMissionBit` now always removes the physical token but clears the flag **only** when no gate reads it (else keeps the witnessed event + `console.warn`). 4 new tests (guard set, non-gating full-revoke, gate-referenced preserve+warn, `takeBit` author path); quest-runtime-uqf **300/300**. **Worldbuilder schema ✅ AUDIT-CLOSED 2026-07-07** — audit found the WB already schema-complete (`mission_bit` bit kind + full `itemChain` grant/take/grantBit/`takeBit` widget & codec, all round-trip-tested); the only gap was authoring safety, so the three author-facing `takeBit` notes (CRUD field note, editor Item-Chain hint, mission-row placeholder) + the codec doc comment now state the consumed-token semantics (spends token; gate-referenced flag preserved, non-gating cleared); chain-editor 10/10, no logic touched. **Journal token timeline ✅ SHIPPED 2026-07-07** (`c488562`) — the last §MBIT-02 piece: `token.day` was stamped at grant but unread; `storyRenderInventory` now groups the Mission Tokens section by `token.day` (a "Day N" divider + per-day count per group, days ascending, grant order within a day; legacy tokens w/o a stamp → Day 1). Display-only, reuses the chip style; 2 new tests drive the real render into `#inv-list`, quest-runtime-uqf **302/302**. **§MBIT-02 is now fully closed** (bitLabel + `_takeMissionBit` safety + WB schema audit + timeline all shipped). See `project_mission_bit_tokens`.
- [x] **Global monster drop nerf ✅ SHIPPED 2026-07-07 (§FC06)** — fishing is now the exclusive positive-magic-loot vector. **Part A (via `PUT /api/loot`):** stripped all 9 weapon/dagger rows from `_D100_TABLE` — the d100 monster-kill table is now **consumables-only** at the documented weights (35/18/14/6/11/6/10 = 100). The `_rollD100Loot` dagger/mainweapon branches are left inert (so a re-added row via the API still resolves). **Part B (user-chosen, adopted the richer doc spec):** `_rollMonsterWeaponDrop` now rolls **1d6 → −4..0** (`Math.min(0, d6-5)`; prefixes Wrecked/Rusted/Chipped/Worn/base×2; 0-quality 33%), replacing the old d4/−3..0. **Consequence (design-approved, exclusivity ratified twice):** the generic `WEAPON_ITEMS` +1..+4 and `DAGGER_ITEMS` pools no longer drop from any monster kill and had no other random vector — positive-magic gear reaches the player only via fishing `LAKE_MAGIC_DB` trinkets + hand-authored quest/EB rewards (Sea Element +2, Rod of Self-Discovery +1, …, untouched). Base-tier (magic 0) weapons still drop every battle. **Verified:** whole inline script parses clean; a real-game drive at Lv20 (4000 d100 rolls + 4000 weapon rolls) confirmed **0** +magic weapons/daggers and base-tier-only −4..0 with all five tiers present. Docs synced: mechanics-combat.md §Main Hand Weapons/§Dagger Drops (retired phantom `_rollMainWeaponDrop`/`_rollWeaponDrop` 15%/12% claims; corrected 42→70 WEAPON_ITEMS count), mechanics-economy.md (DAGGER_ITEMS row + MILEPOINT C/E inert-branch notes). See `project_open_gaps` item 1.
> *`fishmongerRowRestored` visual rebuild ✅ SHIPPED 2026-07-07 (`85faf9b`) — the §GR payoff via the new data-driven `node.textVariants:[{flag,text}]` mechanism in `storyRender` (display-only, API-authored; reusable for any "node changes after an event"). Ship record: plan-archive.md §"Archived 2026-07-07".*
- [ ] **UI gaps** — `[INVESTIGATE]` buttons don't highlight on node entry (root cause unknown); reading-circle has no progress UI. See `project_open_gaps`.

### Design Decisions

> *Both pending decisions RESOLVED 2026-07-07 (user-ratified after code audit) — **do not build, per YAGNI + ontology.***

- [x] **Arc ID as first-class UQF field — DEFERRED (decided 2026-07-07).** Code audit: **zero** quests carry `arc:` today and there is **no arc-grouping/sort consumer anywhere** (journal doesn't group by arc; the only `id.split('_')` in the file is `_flagToLabel`, mission-bit display, not arc detection). The field's stated benefit ("arc sorting without string-splitting") describes a reader that doesn't exist. Ship the field **together with** an arc-grouped journal view whenever that's actually built — not ahead of it. Not backlog work until then.
- [x] **§MBIT-02-E token/gate unification — CLOSED: keep separate (decided 2026-07-07).** KEY_EVENTS (`ke_*`, 8 events) and mission bit tokens (`_grantMissionBit`, 2,441 sites) are **inverse data flows**: a KEY_EVENT item is a *precondition consumed* (`consumeItem` + ability check + DC → world change at a gate); a mission bit is a *postcondition granted* (a kept receipt with `flagRef`/`bitLabel` handed over after a witnessed event). Different ontology → no unification. Decision ratified.

### Multiplayer

> **§MESH-01 core is SHIPPED** (client presence, gossip mesh, tracker + federation, world download + world-diff, Mesh tab UI, FU 1–6/14, partition-heal harness, hygiene B1–B3) — re-verified + archived 2026-07-03 → plan-archive.md. Full design + shapes: `lab-reports/lab-report-mesh-multiuser.md` + `lab-reports/lab-report-mesh-sync-architecture.md`; player/operator docs: mechanics.md §Multiplayer · docs-node-network.md §12 · maps.md · wbapi-help.md. **Load-bearing invariant (rule): every presence record is SINGLE-WRITER** — only the origin server mutates its own sessions; event id = `(originServerId, per-origin seq)`, player id = `(originServerId, sessionId)`, version-vector dedup; anti-entropy pulls missing ranges. Presence is display-only — the mover never consults it (Free-Movement). Cross-mesh WORLD mutations stay the deferred multi-writer problem; the economy ledger (i) is the only multi-writer slice that gets integrity machinery.

> *§MESH-01-FU (follow-ups 1–14) ✅ ALL CLOSED 2026-07-06 — final batch FU 9 world-diff depth (`5ccec4b`) · FU 10 `./api.sh mesh` CLI (`131cee0`) · FU 11–13 ACL template + fail-open warning / tracker cache + bootstrap-fed federation / chat backlog on join (`e13338e`). Gates at close: mud-harness **251/251** ([A]–[Q]) · mesh Playwright 42 · check:walk 6/6. Full ship records (verbatim): plan-archive.md §"Archived 2026-07-06 (FU-close pass)"; operator docs: wbapi-help.md §Mesh API.*

> *§MESH-01 gameplay ladder (f–j) ✅ COMPLETE 2026-07-06 — (f) buffs · (g) hireling · (h) sentries · (i) no-dupe ledger w/ cross-origin trades · (j) PvP duels v1 (`73f7faf`, final rung). Rows + full ship records: plan-archive.md §"Archived 2026-07-06" + §"…(ladder-close pass)"; design: mesh lab report §6. **Deferred:** cross-origin duels, per-round commit-reveal, server-authoritative shared combat (archived row (j)).*
> *§MESH-02 — Map-Tab Connection Center ✅ COMPLETE 2026-07-07 (all increments a–j: ACL/blocklist endpoints · map-sheet sub-tab shell · Connect/Discover/Lists panes · committed tests (mud-harness [R] + mesh-connections-ui.test.js 8) · docs + `./api.sh mesh acl|blocklist|connect` CLI · chat history · footprints · runtime mesh connect). Gates at close: mud-harness **270/270** ([A]–[R]) · nav+autosave+mesh Playwright 86 · worldbuilder-mesh 4/4. Full ship records (verbatim): plan-archive.md §"Archived 2026-07-07"; design: `lab-reports/lab-report-mesh02-connections-ui.md` (a–j increment table).*
- [ ] **§MESH-01-REVIEW — remaining audit items:**
  - **`nearby`+`world[]` are pos-only** — the `room` half of the surface asymmetry closed with §NAV-01f (`buildLook` shared on start/move/look/pos); fold presence arrays into a shared builder only if a MUD client ever needs them on `move`/`look`. Minor.
  - **Presence Playwright tests share one server** — sessions from closed contexts linger to the 30-min TTL; one cross-test leak already caused a flake. **Rule: assert by pid, never by count**; consider a `session/end` sweep in test teardown.
  - **Refactors:** if `MESH.log` pressure ever shows, derive `moved` from `arrived` at fanout instead of a third event per move. *(✅ 2026-07-06 client pair SHIPPED: `_mpRepaintMaps` 100 ms trailing debounce — SSE bursts coalesce into one repaint, MP.on re-checked at fire time; `_mpBase()` defaults to `location.origin` on http(s) pages so a world served by a friend connects back to that server, `file://` keeps the localhost:1367 dev default, explicit `localStorage.mpServer` still wins.)* *(✅ 2026-07-06 `mesh.js` extraction SHIPPED: the 434-line §MESH-01 kernel — ACL · rate limit · gossip · tracker/federation/bootstrap, the block between the old §MESH sentinels — moved verbatim to `mesh.js` as a factory `require('./mesh')(deps)`; the server passes live surfaces (SESSIONS, SSE fanout, chat ring, manifest/serverId, ledger hooks) and destructures the same names back so all endpoint call sites are unchanged; the one outside write to the internal `_trackerDirty` flag became `trackerMarkDirty()`. `wbapi-server.js` 11,726→11,314 lines. Gates: mud-harness 251/251 · mesh Playwright 43/43 · check:walk 6/6 · live boot + `./api.sh mesh status` verified. Docs synced: index.md file table + docs-node-network.md §12.)*

---

> **Archive:** all closed / completed work (§WALK, §TIMELESS-01, §WBAPI-01, §EDITOR-01-D / -02 / -FU, §CELL-14, the full §ARCH-01 wave-by-wave history, **§NAV-01 Inc a–g + diagnosis/layer-stack/data-shapes, §MESH-01 in full, §MESH-02 (a)–(j), the five 2026-07-07 Game Content closes (§GR · §DESIGN-03 · §DUNGEON-01 · §MATH-01 · §FUTURE-01) + the fishmongerRowRestored payoff + the §MBIT-02 bitLabel record**, and prior §RESUME snapshots) lives in **[plan-archive.md](plan-archive.md)** — the 2026-07-03 sections, the three 2026-07-06 sections, and the **2026-07-07 section** (§MESH-02 + Game Content close pass) each record the verification (commits + greps + green gates) run before their blocks were moved.

---

*© 2026 Paul Richeson — MIT License.*
