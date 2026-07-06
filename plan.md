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

> **⟶ Current state (2026-07-06):** **§ARCH-01 UQF is CLOSED** (all ~2,700 quests UQF-1.0; QuestRuntime the single execution surface; QUEST_DB the single source of truth; residuals: `quest_math_01–05` activate-only awaiting §MATH-01 + 30 dead `blq_05–10` stubs — both pinned by permanent tests; quest-runtime-uqf 288 green). **§MESH-01 gameplay ladder:** (f) co-presence buffs `a07b281` · (g) hireling guide `26bfed0` · (h) sentry bots `ff413f6` all SHIPPED; (i)/(j) design pass `96de681` locked the data shapes (mesh lab report §6); **(i) slice 1 — single-server mint+trade no-dupe ledger ✅ SHIPPED 2026-07-06 (`5536685`)**; **(i) slice 2a — durable identity + cross-mesh ledger replication ✅ SHIPPED 2026-07-06** — persistent playerKey → durable `ledgerPid` (user call locked, lab report §6.4) + the parallel durable gossip channel (`ledgerVV` piggyback, anti-entropy pull `/api/ledger/sync` + push `/api/ledger/ingest`, no TTL/cap), mud-harness `[I]`+`[I2]` 40 checks; full detail in the §MESH-01 ladder row (i) below. Wave-by-wave UQF history, the f/g/h ship records, and the pre-condense §RESUME snapshot: **plan-archive.md §"Archived 2026-07-06"** + `lab-reports/lab-report-uqf-migration-playbook.md`.
>
> **Next on "continue":** **(i) slice 2b — the client rung** — `S_story.playerKey` generation (32 hex, once) + send on connect, `mintId` stamping at acquisition-while-connected, trade UI reading the SSE `trade_proposed/completed/cancelled` events, mechanics.md §Multiplayer player docs. OR **(j) consensual duels** — independent (reuses the shipped chain/envelope; `DUEL:CORE` shapes ready in lab report §6.3). OR take a planned arc (§GR grief / §DESIGN-03 Ceremonia / §DUNGEON-01 themes / §MATH-01 math world). OR **(j) consensual duels** — independent of slice 2 (reuses the shipped chain/envelope; `DUEL:CORE` shapes ready in lab report §6.3). OR take a planned arc (§GR grief / §DESIGN-03 Ceremonia / §DUNGEON-01 themes / §MATH-01 math world).
>
> Before running any test gate, re-read **Test-Run Rules** (§I above): piped exit codes lie, and the WBAPI server must be stopped for Playwright.
>
> All previously-listed shipped work (§WALK, §NAV-01 **a–h incl. docs close-out + lab report — FULLY CLOSED**, §MESH-01 core, UQF Waves 1+2, §CELL-13 jump-travel re-removal) is archived in **plan-archive.md** §"Archived 2026-07-03" + §"Archived 2026-07-03 (afternoon pass)" + §"Archived 2026-07-06" (UQF W4–W8c/§ARCH-01 close, MESH ladder f/g/h, Tooling) — each block re-verified (or same-day gate-checked) before the move. **Standing rule from §CELL-13: no jump travel, ever** — `checkpointNode` death-respawn is the only warp.

### §NAV-01-FU — Navigable World follow-ups (parent ✅ CLOSED 2026-07-03 → plan-archive.md + `lab-reports/lab-report-nav01-navigable-world.md`)

- [ ] **Small follow-ups (found during §NAV-01):** (1) `_renderMiniMap`'s "Void's First Sign" special case still targets cell `(4,3)` — a pre-§WALK-1.5 coordinate, now a real band cell in the North Atlantic; re-anchor or retire. (2) `_questNodes()` is built once per session — fine while QUEST_DB is static at runtime; invalidate if quests ever mutate live. (3) Map-tab hover info for road cells could name the road's destinations (reuse `__roadDestination`). (4) Consider GLOBE panel click → jump the map tab / world panel to that region (read-only navigation aid, no teleport). (5) Migrate the older worldbuilder describe blocks to the §NAV-01g hermetic pattern (`page.route` firewall on `:1367` BEFORE `page.goto` — kills ~7 min of retry burn from the `probeServer()` auto-load race; `#panels` boots scrolled off-viewport headless, canvas mouse tests need `scrollIntoViewIfNeeded()` first). Confirmed live 2026-07-03: with a server up, 46 walk tests fail on the clobbered mock ("Yugurt Lake" ≠ 'Alpha'); with it down, `worldbuilder-crud-arrays.test.js` itemChain tests fail instead (welcome-screen never dismissed — they need the auto-load, or better, the same hermetic stub + explicit dismissal).

### Tooling

> *§EDITOR-02-FU (Mission Builder follow-ups) + §EDITOR-03 (worldbuilder UQF export) ✅ COMPLETE — archived to plan-archive.md §"Archived 2026-07-06". The whole authoring pipeline emits UQF-1.0; detail: playbook §1 Wave 8b row.*

### Data / Architecture

> *«§CELL-13-REVERTED» ✅ resolved 2026-07-03 (`b027440`, jump-travel re-removed on user directive) — archived to plan-archive.md §"Archived 2026-07-03 (afternoon pass)". Standing rule: no jump travel, ever.*

- [ ] **§DATA-01-REVERTED — entire §DATA-01 quest data/code separation is missing from code** (found 2026-06-26) — index.md L155 records §DATA-01 (2026-06-16) as DONE: `QUEST_EFFECTS` (121 declarative descriptors) + `QUEST_HOOKS` (91 handlers) + `applyQuestEffects()`, `QUEST_DB` purged of 127 `onPass`/`onFail` fns, ZRH duplicate resolved (Dunfall→`DFL`), and `q.title/desc/hint` → `textContent`. **None of it is in the current code** (`QUEST_EFFECTS`/`applyQuestEffects`/`DFL` all grep to 0) — the whole change was reverted/lost, which is why the ZRH duplicate resurfaced (re-fixed above as `DNF`). Likely a snapshot rollback clobbered it. **Decision needed:** restore §DATA-01 from `lab-reports/lab-report-quest-data-code-separation.md` (large) vs fold into §ARCH-01 UQF vs accept the loss + correct index.md. Big — overlaps §ARCH-01.
- [x] **§ARCH-01 — Universal Quest Format (UQF v1.0)** ✅ **CLOSED 2026-07-05** (W8c `647e070`) — all ~2,700 quests are UQF-1.0; QuestRuntime is the single execution surface; QUEST_DB is the single source of truth; quest-runtime-uqf 288 green. Full wave-by-wave row (verbatim) + history: plan-archive.md §"Archived 2026-07-06" (+ the earlier §ARCH-01 archive blocks) + `lab-reports/lab-report-uqf-migration-playbook.md`. **Latent bugs flagged & parity-preserved, NOT fixed:** the `onComplete`+`xpAward` double-count on lair-clear sides (sb_fight/hunt_04/hunt2_04/bilge_04) and §DUNGEON-01's dead `==='complete'` skill_check handlers — both in `project_open_gaps`. Residuals: `quest_math_01–05` (activate-only, §MATH-01) + 30 dead `blq_05–10` stubs (permanent stay-legacy test). Prereq lab report: `lab-report-quest-api-architecture.md`. See `project_quest_api`.

### Game Content — Major Planned Arcs

> Each is design-complete or scoped in a memory file; **all require a `lab-report-*.md` locking data shapes before any HTML edit.** Restored here 2026-06-25 from memory (dropped from plan.md during the §WALK rewrite).

- [ ] **§GR — Grief Arc / "La Riva"** — design-complete (2026-05-26), deferred to Layer 78+. Corruption→grief causal chain; node AMS (design: FR) Fishmonger's Row unlocks after `catKingDefeated`; NPCs `connie_tuna`/`aldo_sardino`; 3-quest chain (`quest_la_riva_01..03`); French 5-act vignette technique (object-per-act). Prereq: `lab-report-la-riva-grief-arc.md`. See `project_grief_arc` in memory + story.md §GRIEF AND CORRUPTION.
- [ ] **§DESIGN-03 — Ceremonia Roll + Starting City Expansion** — PLANNED. `d20+abilityMod+profBonus≥DC` skill-check mechanic; new `type:'skill_check'` quest fields; fills the Birka L3–6 XP gap (4 new missions); Yael "The Watchpost" 5-act romantic Ceremonia arc. Prereq: `lab-report-ceremonia-roll-skill-checks.md`. See `project_ceremonia_roll`. *(Note: `type:'skill_check'` quests already exist live — confirm what's shipped vs scoped before building.)*
- [ ] **§DUNGEON-01 — 10 Dungeon Themes** — PLANNED. Priority: D01-03 hero-origin canon (player = trapped Scholar King Apprentice; Prior Carrier NPC at NUE) → D01-07 CY first-visit madness WIS DC12 → D01-08 Mimic Meadows (node LIM, `mimic_meadow`, `quest_mimic_colony`, Tribbles) → D01-10 Loop Heart at CO (pre-boss choice). Plus Sacrifice Gates, Shifting Labyrinth, Scholar Workshop (node SW), Arcane Inversion, Inquisitor interview. Many new state fields. Prereq: `lab-report-dungeon-ten-themes.md`. See `project_dungeon_themes`.
- [ ] **§MATH-01 — Mathematical World** — PLANNED (2026-06-02). Group-theory overlay; nodes EHZ (Event Horizon station), MONS (Monster's Manifold 196,883-dim), ZERO, CNTR (Cantor's Attic); 5 quest seeds (MATH-01..05) connecting Roman/Byzantine/Arabic zero, Galois quintic, Monstrous Moonshine. Adventure-Time register for EHZ/MONS only (French-noir elsewhere). See `project_math_world`. *(Found 2026-07-03, UQF W3a recon: the live `quest_math_01–05` side quests have NO completion mechanism — no completeFn, no completeItems — so they can activate but never complete. Needs a completion design here before their UQF migration; they were skipped in W3a/W3b.)*
- [ ] **§1367 — Historical 1367 AD integration** — 6 events→quest seeds (Nájera/routiers, Tamerlane, Ottoman Balkans, Hanseatic peak, Wycliffe, Black Death aftermath); **8 clarification questions in §1367-D gate HTML integration**. No anachronisms. See `project_1367_setting`.
- [ ] **§FUTURE-01 — Saul→Paul arc** — unscheduled. Middle East node map; Acts/Pauline fidelity; Damascus-Road conversion reframes toolkit (combat→rhetoric) and rewrites quest availability — a world-first conversion mechanic. Node map/quest IDs/NPC keys drafted. See `project_future_saul_paul`. *(Open design call: does Acts-fidelity register create tonal discontinuity?)*
- [ ] **§GR-D Froberger Entry 42** — blank page filled on second playthrough. Requires NG+ state tracking (currently unsupported).
- [~] **§IDEA-01 — Idea Generator: found-text → quest-theme seeds** — repeatable process: paste any found-text list (affirmation loops, song lyrics, transcripts) → dedupe repeats + ASR garbles → **every substantive line** becomes a categorized quest-theme one-liner in `brainstorm-one-liners.md`, with a per-line coverage table proving 100% coverage (artifacts like [Music]/timestamps discarded, garbles reconstructed + noted). Seeds are backlog fodder, NOT scoped work — promoting a seed = its own § entry here (+ lab report per policy if it grows to a chain/faction/system). **Processed so far:** S1 "Quiet Power" (AFF-01..24) · S2 "That Girl" (AFF2-01..34) · S3 "Queen of Luxury" (AFF3-01..11) — per-source detail + cross-links to live systems archived 2026-07-03 (plan-archive.md). New sources append as S4+.

### Mechanics & Systems

- [ ] **§MBIT-02 — Mission Bit Token follow-ups** — §MBIT-01 shipped (`_grantMissionBit`/`_takeMissionBit`, `type:'mission_bit'` items). Remaining: `bitLabel` cleanup for Paul-arc quests, `_takeMissionBit` call sites for consumed tokens, worldbuilder schema update, token timeline in journal. See `project_mission_bit_tokens`.
- [ ] **Global monster drop nerf (−3→0 floor)** — design intent (fishing = exclusive positive-magic-loot vector) never shipped; monster drops still yield 0..+3. Open loot-balance gap. See `project_open_gaps`.
- [ ] **`fishmongerRowRestored` visual rebuild** — flag sets on `quest_la_riva_03` but AMS node has no `partial_market` "after restoration" text variant; Row never visually rebuilds. (Blocks on §GR.)
- [ ] **UI gaps** — `[INVESTIGATE]` buttons don't highlight on node entry (root cause unknown); reading-circle has no progress UI. See `project_open_gaps`.

### Design Decisions (pending)

- [ ] **Arc ID as first-class UQF field** — add `arc: 'quest_wis'` explicitly to quest objects; enables arc sorting without string-splitting heuristics
- [ ] **§MBIT-02-E token/gate unification** — leaning toward keeping KEY_EVENTS items and mission bit tokens separate (different ontology). Decision pending.

### Multiplayer

> **§MESH-01 core is SHIPPED** (client presence, gossip mesh, tracker + federation, world download + world-diff, Mesh tab UI, FU 1–6/14, partition-heal harness, hygiene B1–B3) — re-verified + archived 2026-07-03 → plan-archive.md. Full design + shapes: `lab-reports/lab-report-mesh-multiuser.md` + `lab-reports/lab-report-mesh-sync-architecture.md`; player/operator docs: mechanics.md §Multiplayer · docs-node-network.md §12 · maps.md · wbapi-help.md. **Load-bearing invariant (rule): every presence record is SINGLE-WRITER** — only the origin server mutates its own sessions; event id = `(originServerId, per-origin seq)`, player id = `(originServerId, sessionId)`, version-vector dedup; anti-entropy pulls missing ranges. Presence is display-only — the mover never consults it (Free-Movement). Cross-mesh WORLD mutations stay the deferred multi-writer problem; the economy ledger (i) is the only multi-writer slice that gets integrity machinery.

- [ ] **§MESH-01-FU — remaining follow-ups** (small; numbering preserved from the archived checkpoint list):
  7. **`scripts/publish-bootstrap.sh`** — one-liner helper: curl the tracker's `/api/tracker/peers?format=txt` → print/scp/gist-paste instructions (the designed manual publish path — not yet scripted).
  8. **Ingress rate limiting** — gossip/announce/sync accept unauthenticated POSTs; ACL + 500-record cap exist, but a per-IP token bucket would blunt floods before JSON parse.
  9. **world-diff depth** — `keysOf` is an indent-regex approximation; deep-parse via wbapi-core `extractObj` for exact per-entry field diffs + a `--json` mode for tooling; optionally wire a `check:worlddiff --selftest` into CI.
  10. **`./api.sh mesh` commands** — `mesh status` / `mesh peers` / `mesh tracker <url>` CLI wrappers over the new endpoints (API-first parity with the Mesh tab).
  11. **`mesh-acl.json.example`** — commented template beside peers.txt (mode/allow/block shapes are only documented in the lab report today).
  12. **Tracker persistence + tracker bootstrap** — the announce table is in-memory (fine: servers re-announce ≤30 s; a restarted tracker heals fast) and a tracker can't yet BOOTSTRAP_URLS its *federation* peers; both are small.
  13. **Chat backlog on join** — fresh-event fanout is capped at 10 s, so a joining player gets no chat history; an optional "last N chat lines at this cell" on `session/start`/`look`.
- [~] **§MESH-01 gameplay ladder (f–j)** — design locked (shapes in the mesh lab report + the archived Extended-design items 6/7/14):
  - [x] **(f) co-presence buffs + party loot share** ✅ SHIPPED 2026-07-05 (`a07b281`) — +1 to-hit/ally (cap +2), halved shared-cell encounters, +10%/ally loot-XP share (cap +20%); `MP.on`-guarded, SP byte-identical. Ship record → plan-archive.md §"Archived 2026-07-06"; permanent suite `mesh-copresence-buff.test.js` (6).
  - [x] **(g) hireling guide bot** ✅ SHIPPED 2026-07-05 (`26bfed0`) — 60g + 12g/day single-player hireling (persists in `S_story`): extra battle die + "follow me" quest-guide driving §NAV-01d auto-travel (mover never reads it — Free-Movement held). Ship record → plan-archive.md §"Archived 2026-07-06"; permanent suite `mesh-hireling-guide.test.js` (6).
  - [x] **(h) sentry bots** ✅ SHIPPED 2026-07-06 (`ff413f6`) — server-owned bot SESSIONS (`bot:true`, `kind:'sentry'`) at junctions: ride every presence surface free, deterministic encounter suppression (RNG advances, result voided), 120g + 20g/day (`S_story.sentries`), prune-immune, recall-only removal. Ship record → plan-archive.md §"Archived 2026-07-06"; mud-harness `[H]`/`[H6]` (22) + `mesh-sentry.test.js` (7).
  - [~] **(i) no-dupe economy ledger** — mint id `(originServerId, seq)` per item, hash-chained per-player event log, trade = one event signed into BOTH chains referencing mint id + prior ownership, deterministic fork-choice (lowest event-hash) voids double-spends on merge. Protects TRADES, not stats (client-authoritative single-file game; friends-mesh trust is social). Data shapes: mesh lab report §6.1–6.2. **Slice 1 ✅ SHIPPED 2026-07-06 — single-server mint+trade:** durable per-origin chains persisted to `ledger/<originServerId>.jsonl` (one JSON line per event, fsync on append, lazy load, `LEDGER_DIR` env for tests, gitignored), §6.1 envelope verbatim (`{kind,id:[origin,seq],ts,chain:{pid:{height,prevHash}},body,sig,hash}`, canonical sorted-key JSON; hash preimage excludes `hash` only, HMAC sig excludes `sig`+`hash`), endpoints `POST /api/ledger/mint` (session-bound, `mintId===event.id`) · `GET ledger/owner|chain|status` · `POST /api/trade/propose|accept|cancel` (two-phase, 60s TTL — propose/cancel ephemeral, accept re-validates ownership then appends ONE co-signed dual-chain event; SSE `trade_proposed/completed/cancelled` to both parties) · `POST /api/ledger/ingest` (validated foreign-event receive path: shape + hash recompute + per-origin HMAC self-consistency + vv dedup + own-origin forgery reject — already the receive half of slice 2's gossip). Ownership + dupe-void are ONE pure fixpoint fn (`ledgerResolve`): longest valid transfer path from the mint, conflicts → lowest event-hash wins, losers + transitive descendants voided — byte-identical verdict on any server, any arrival order. New mud-harness `[I]` (26 checks: chain genesis/linkage, provenance-reject, counterparty-only accept, cancel + TTL expiry, bad-sig/forged-origin ingest rejects, dupe-void determinism incl. an independent second server on a different arrival order, restart durability + monotonic-seq continuation). **Durable player identity ✅ LOCKED 2026-07-06 (user call): persistent player key** — client generates `S_story.playerKey` once (32 hex, `crypto.getRandomValues`), persisted in the save; server derives **ledger/duel pid = `(origin8, sha256(playerKey).slice(0,8))`**; full note: mesh lab report §6.4. **Slice 2a ✅ SHIPPED 2026-07-06 — server half (identity + cross-mesh replication):** `session/start` takes optional `playerKey` (32 hex, validated; raw key never stored — `ledger/players.json` keeps the full sha256, player8 collision refused 409 first-writer-wins) → `s.player8` + `ledgerPid` in the response; mint/trade/notify all key on `ledgerPidOf` (keyless sessions fall back to session-scoped pids); **parallel durable gossip channel:** every presence gossip payload advertises `ledgerVV` (per-origin frontier), mismatch triggers anti-entropy BOTH ways — pull via new `POST /api/ledger/sync` (compat+ACL gated like presence gossip, per-origin seq order, 500-event cap per response with continuation) + push via existing `/api/ledger/ingest` — so replication converges regardless of which side is dialable (NAT'd server pushes out, joiner pulls history); no TTL/age cap: a late joiner back-fills everything. Mud-harness `[I2]` 14 checks (identity survives session death + resumed chain trades; mint AND trade replicate over real 3-server gossip; late-joining C back-fills history it never witnessed; doctored double-spend propagates mesh-wide and A/B/C void the identical branch); full run 182/182, mesh Playwright suites 19/19. **Remaining (slice 2b, the client rung):** `S_story.playerKey` generation + send on connect, `mintId` stamping at acquisition-while-connected, trade UI reading the SSE `trade_*` events, mechanics.md §Multiplayer player docs. Cross-ORIGIN co-signed trades (parties on different servers) stay the rung after.
  - **(j) consensual PvP duels** — challenge→accept handshake (~30 s TTL, global PvP-off toggle), origin-server stat commitment validated against derivable bounds from shared world data, commit-reveal seed (`duelSeed = sha256(nonceA‖nonceB‖duelId)`), **DUEL:CORE** pure deterministic resolver (byte-identical client/server, parity-checked like MOVER:CORE), outcome into both hash chains; walking off-cell = flee/forfeit — never a movement gate. v1 = auto-resolve transcript playback; v1.5 = per-round commit-reveal; v2 = server-authoritative shared combat (deferred, own design pass). **Prereq DONE: DUEL:CORE data shapes ✅ SPECIFIED 2026-07-06 — mesh-multiuser lab report §6.1, §6.3** (`duel/challenge|accept|reveal` endpoints; `statBlock` bounds-check; `DUEL:CORE(statA,statB,duelSeed)→transcript` contract + new `duel.js` shared kernel + `check:duelparity` gate; harness cases). Ready for code.
- [ ] **§MESH-01-REVIEW — remaining audit items:**
  - **`nearby`+`world[]` are pos-only** — the `room` half of the surface asymmetry closed with §NAV-01f (`buildLook` shared on start/move/look/pos); fold presence arrays into a shared builder only if a MUD client ever needs them on `move`/`look`. Minor.
  - **Presence Playwright tests share one server** — sessions from closed contexts linger to the 30-min TTL; one cross-test leak already caused a flake. **Rule: assert by pid, never by count**; consider a `session/end` sweep in test teardown.
  - **Refactors (larger, schedule deliberately):** extract the mesh layer to `mesh.js` (~450 self-contained lines, `mover.js`/`rooms.js` precedent — `wbapi-server.js` is 10k+ lines and mesh is the most separable slice); `_mpRepaintMaps` ~100 ms debounce (every remote `player_moved` rebuilds the minimap DOM + 2 canvases — churns at 10 movers); `_mpBase()` should derive from `location.origin` when the page has an http origin (the `http://localhost:1367` default is wrong for a downloaded world served by a friend); if `MESH.log` pressure ever shows, derive `moved` from `arrived` at fanout instead of a third event per move.

---

> **Archive:** all closed / completed work (§WALK, §TIMELESS-01, §WBAPI-01, §EDITOR-01-D / -02 / -FU, §CELL-14, the full §ARCH-01 wave-by-wave history, **§NAV-01 Inc a–g + diagnosis/layer-stack/data-shapes, §MESH-01 core increments a–e + FU checkpoint + locked design decisions**, and prior §RESUME snapshots) lives in **[plan-archive.md](plan-archive.md)** — the 2026-07-03 sections and the 2026-07-06 §RESUME-condense section each record the verification (commits + greps + green gates) run before their blocks were moved.

---

*© 2026 Paul Richeson — MIT License.*
