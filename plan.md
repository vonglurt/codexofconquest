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

> **⟶ Current state (2026-07-06):** **§ARCH-01 UQF is CLOSED** (all ~2,700 quests UQF-1.0; QuestRuntime the single execution surface; residuals `quest_math_01–05` activate-only + 30 dead `blq_05–10` stubs, both test-pinned) and the **§MESH-01 gameplay ladder (f–j) is COMPLETE 2026-07-06** — co-presence buffs, hireling guide, sentry bots, no-dupe economy ledger (durable player identity, cross-mesh replication, cross-origin co-signed trades), consensual PvP duels v1. Gates at close: mud-harness **224/224** · mesh Playwright **39/39** · check:walk 6/6 · check:duelparity · quest-runtime-uqf 288/288. Ship records + pre-condense snapshot: **plan-archive.md §"Archived 2026-07-06" + §"Archived 2026-07-06 (ladder-close pass)"**; design shapes: `lab-reports/lab-report-mesh-multiuser.md` §6.
>
> **§MESH-01-FU is now FULLY CLOSED** (FU 11–13 ✅ 2026-07-06 in one pass — ACL template + fail-open warning · tracker cache + bootstrap-fed federation · chat backlog on join; mud-harness **251/251** incl. the new [Q] section, mesh Playwright 42 passed, check:walk 6/6 — see the FU rows below for ship records). **Next on "continue":** §MESH-01-REVIEW refactors (mesh.js extraction · `_mpRepaintMaps` debounce · `_mpBase()` origin fix) · §DATA-01-REVERTED decision · or a planned arc (**§GR / §DESIGN-03 / §DUNGEON-01 / §MATH-01** — each needs its lab report locked before HTML edits; see Game Content below). A plan.md archive pass for the closed §MESH-01-FU rows is also due.
>
> Before running any test gate, re-read **Test-Run Rules** (§I above): piped exit codes lie, and the WBAPI server must be stopped for Playwright.
>
> All earlier shipped work (§WALK, §NAV-01, §MESH-01 core, the UQF waves, §CELL-13 re-removal) is archived in **plan-archive.md** — each block re-verified before the move. **Standing rule from §CELL-13: no jump travel, ever** — `checkpointNode` death-respawn is the only warp.

### §NAV-01-FU — Navigable World follow-ups (parent ✅ CLOSED 2026-07-03 → plan-archive.md + `lab-reports/lab-report-nav01-navigable-world.md`)

- [ ] **Small follow-ups (found during §NAV-01):** (1) `_renderMiniMap`'s "Void's First Sign" special case still targets cell `(4,3)` — a pre-§WALK-1.5 coordinate, now a real band cell in the North Atlantic; re-anchor or retire. (2) `_questNodes()` is built once per session — fine while QUEST_DB is static at runtime; invalidate if quests ever mutate live. (3) Map-tab hover info for road cells could name the road's destinations (reuse `__roadDestination`). (4) Consider GLOBE panel click → jump the map tab / world panel to that region (read-only navigation aid, no teleport). (5) Migrate the older worldbuilder describe blocks to the §NAV-01g hermetic pattern (`page.route` firewall on `:1367` BEFORE `page.goto` — kills ~7 min of retry burn from the `probeServer()` auto-load race; `#panels` boots scrolled off-viewport headless, canvas mouse tests need `scrollIntoViewIfNeeded()` first). Confirmed live 2026-07-03: with a server up, 46 walk tests fail on the clobbered mock ("Yugurt Lake" ≠ 'Alpha'); with it down, `worldbuilder-crud-arrays.test.js` itemChain tests fail instead (welcome-screen never dismissed — they need the auto-load, or better, the same hermetic stub + explicit dismissal).

### Tooling

> *§EDITOR-02-FU (Mission Builder follow-ups) + §EDITOR-03 (worldbuilder UQF export) ✅ COMPLETE — archived to plan-archive.md §"Archived 2026-07-06". The whole authoring pipeline emits UQF-1.0; detail: playbook §1 Wave 8b row.*

### Data / Architecture

> *«§CELL-13-REVERTED» ✅ resolved 2026-07-03 (`b027440`, jump-travel re-removed on user directive) — archived to plan-archive.md §"Archived 2026-07-03 (afternoon pass)". Standing rule: no jump travel, ever.*

- [ ] **§DATA-01-REVERTED — entire §DATA-01 quest data/code separation is missing from code** (found 2026-06-26) — index.md L155 records §DATA-01 (2026-06-16) as DONE: `QUEST_EFFECTS` (121 declarative descriptors) + `QUEST_HOOKS` (91 handlers) + `applyQuestEffects()`, `QUEST_DB` purged of 127 `onPass`/`onFail` fns, ZRH duplicate resolved (Dunfall→`DFL`), and `q.title/desc/hint` → `textContent`. **None of it is in the current code** (`QUEST_EFFECTS`/`applyQuestEffects`/`DFL` all grep to 0) — the whole change was reverted/lost, which is why the ZRH duplicate resurfaced (re-fixed above as `DNF`). Likely a snapshot rollback clobbered it. **Decision needed:** restore §DATA-01 from `lab-reports/lab-report-quest-data-code-separation.md` (large) vs fold into §ARCH-01 UQF vs accept the loss + correct index.md. Big — overlaps §ARCH-01.
> *§ARCH-01 Universal Quest Format (UQF v1.0) ✅ CLOSED 2026-07-05 (W8c `647e070`) — all ~2,700 quests UQF-1.0; QuestRuntime the single execution surface; QUEST_DB the single source of truth; quest-runtime-uqf 288 green. Full row + wave history: plan-archive.md (2026-07-06 sections) + `lab-reports/lab-report-uqf-migration-playbook.md`; residuals (`quest_math_01–05` activate-only → §MATH-01; 30 dead `blq_05–10` stubs) test-pinned; latent bugs flagged NOT fixed (lair-clear xp double-count, dead skill_check handlers) → `project_open_gaps`.*

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

- [x] **§MESH-01-FU — ✅ ALL FOLLOW-UPS CLOSED 2026-07-06** (numbering preserved from the archived checkpoint list; 7 publish-bootstrap.sh + 8 ingress rate limiting ✅ 2026-07-06 → archived; 11–13 shipped in one pass, see rows below — gates at close: mud-harness **251/251** (new [Q] section, 12 checks) · mesh Playwright 42 passed · check:walk 6/6):
  9. ~~**world-diff depth**~~ ✅ DONE 2026-07-06 — `scripts/world-diff.js` rewritten around the wbapi-core deep pipeline (new `WBAPI._parse` export: extrSection/extractObj/removeFns/parseSimple/parseArr/parseWithP/parseSanitized): every manifest part normalized to a keyed object (SEA_LANES `new Set` → cell keys; WORLD_DB parsed with the P proxy over the same file's MONSTER_POOL), changed entries report **exact field paths** (`fish_01: hp: 4 → 5`, `completion.items[0]: "rope" → "lantern"`) with functions compared by source text (an edited hook body inside a data span is named, not silent); old indent-regex `keysOf` kept as the labelled `mode:'approx'` fallback (script copied standalone / parse-defeating span); **`--json`** machine-readable report; **`--selftest`** (17 assertions on synthetic worlds incl. P-proxy resolution, Set normalization, fn-body diff, exit codes 0/1/2, approx fallback) wired as **`npm run check:worlddiff`** + a CI step in walk-invariants.yml `invariants`. Verified against the real file: self-diff exit 0 · MONSTER_POOL entry add + field edit both keyed exactly · an ENEMY_DB edit correctly trips CODE-differs (ENEMY_DB is not a manifest part — matches the server's `MANIFEST_PARTS` contract). **Found & fixed while gating — two CI guards stale-broken by §ARCH-01 (red on main since W7c/W8a, unrelated to this FU):** `check-array-patch` crashed hunting the swept `completeItems` field (repointed to `targetMonsterKeys`, 13/13) and `check-ladder-migration`'s `LADDER.size >= 30` baseline inverted to `=== 0` now the W7c ladder deletion is permanent (148/148). Gates: check:worlddiff 17/17 · arraypatch 13/13 · laddermigration 148/148 · itemchain 28/28 · check:walk 6/6. Doc: wbapi-help.md mesh section.
  10. ~~**`./api.sh mesh` commands**~~ ✅ DONE 2026-07-06 — `mesh status` / `mesh peers` / `mesh tracker [url]` in api/wb.js, read-only wrappers over `GET /api/mesh/status` + `GET /api/tracker/peers`: `status` pretty-prints identity · worldTag/hash · ACL+rate · players/peers/tracker-groups + reachability warnings (stderr); `peers` renders the gossip table (live ●/○, last-seen, last error) + remote players; `tracker` is the Mesh-tab server browser on the CLI — queries the configured tracker(s) or an explicit url (a tracker-mode server with no upstream browses itself), dedupes by serverId, flags **≠ different world** on foreign worldHash; all three take `--json` (clean payload on stdout when piped — synopsis/info stay on stderr/TTY). Synopsis + HELP manual (new MULTIPLAYER MESH section) + `--ai` cheatsheet updated. Verified live against :1367 (all subcommands, --json, explicit-url, unreachable-tracker + usage error paths). Gate: mud-harness [F] grew 4 CLI-parity checks (execFile vs the live throwaway tracker mesh) — **239/239**. Docs: wbapi-help.md §Mesh API (CLI now the lead read surface, "planned FU 10" note removed), docs-node-network.md §12, API-README.md quick reference.
  11. ~~**`mesh-acl.json.example`**~~ ✅ DONE 2026-07-06 — committed template beside peers.txt: valid JSON verbatim (`"//"`-keys as comments, mode `open` + all six allow/block lists empty = default behavior), documents every field, all applied surfaces, hot-reload, and the fail-open caveat. **Hardening found while writing it:** an ACL file that exists but fails `JSON.parse` used to silently open the mesh — `getAcl` now warns LOUDLY on console (once per mtime change) and `mesh-acl.json` joined .gitignore (per-deployment config, real IPs). Harness [Q]: template parses + copied-verbatim server reports `acl.mode:'open'` + malformed file fails open with the warning.
  12. ~~**Tracker persistence + tracker bootstrap**~~ ✅ DONE 2026-07-06 — (a) announce table persists to `tracker-cache.json` (`TRACKER_CACHE_FILE` / `TRACKER_PERSIST_MS` default 30 s; dirty-flagged — idle tracker never writes; never creates an empty cache); on load records are **re-aged by the downtime** (`savedAt`) and pushed through `trackerMergeRecords` (same validation + ACL as a live sync), so a quick restart serves peers immediately and a long outage honestly expires them. (b) `tracker <url>` lines from peers.txt/BOOTSTRAP_URLS now feed **federation** in tracker mode (`addTrackerUrl` routes by role; federate heartbeat starts unconditionally in tracker mode so bootstrap-fed peers work; `mesh/status → federationPeers`). Harness [Q]: cache written → tracker killed/restarted → serves the table with the announcer on a 600 s cadence (only possible via cache); a tracker bootstrapped ONLY by a text-file line federates.
  13. ~~**Chat backlog on join**~~ ✅ DONE 2026-07-06 — bounded `CHAT_LOG` ring (200; local `say` + fresh cross-server mesh chat, origin-tagged; replayed history excluded by vv) served as `chat: [{ts,name,msg,r,c,server?}]` on the **shared `buildLook`** (start/move/look/pos — the one-look-surface rule), last `MESH_CHAT_BACKLOG` lines at the cell (default 10, 0 disables, cap 50), oldest→newest. Client: `_mpChatBacklog` prints "🕰 Earlier here:" once per connect (`mpToggle`) and resume (`_mpResume`); live lines still arrive via SSE. Display-only — never consulted by mover/quest code. Harness [Q]: start replays attributed lines in order · look serves the same tail · cell-scoped (BMA vs hub) · cross-server line lands origin-tagged.
> *§MESH-01 gameplay ladder (f–j) ✅ COMPLETE 2026-07-06 — (f) buffs · (g) hireling · (h) sentries · (i) no-dupe ledger w/ cross-origin trades · (j) PvP duels v1 (`73f7faf`, final rung). Rows + full ship records: plan-archive.md §"Archived 2026-07-06" + §"…(ladder-close pass)"; design: mesh lab report §6. **Deferred:** cross-origin duels, per-round commit-reveal, server-authoritative shared combat (archived row (j)).*
- [ ] **§MESH-01-REVIEW — remaining audit items:**
  - **`nearby`+`world[]` are pos-only** — the `room` half of the surface asymmetry closed with §NAV-01f (`buildLook` shared on start/move/look/pos); fold presence arrays into a shared builder only if a MUD client ever needs them on `move`/`look`. Minor.
  - **Presence Playwright tests share one server** — sessions from closed contexts linger to the 30-min TTL; one cross-test leak already caused a flake. **Rule: assert by pid, never by count**; consider a `session/end` sweep in test teardown.
  - **Refactors (larger, schedule deliberately):** extract the mesh layer to `mesh.js` (~450 self-contained lines, `mover.js`/`rooms.js` precedent — `wbapi-server.js` is 10k+ lines and mesh is the most separable slice); `_mpRepaintMaps` ~100 ms debounce (every remote `player_moved` rebuilds the minimap DOM + 2 canvases — churns at 10 movers); `_mpBase()` should derive from `location.origin` when the page has an http origin (the `http://localhost:1367` default is wrong for a downloaded world served by a friend); if `MESH.log` pressure ever shows, derive `moved` from `arrived` at fanout instead of a third event per move.

---

> **Archive:** all closed / completed work (§WALK, §TIMELESS-01, §WBAPI-01, §EDITOR-01-D / -02 / -FU, §CELL-14, the full §ARCH-01 wave-by-wave history, **§NAV-01 Inc a–g + diagnosis/layer-stack/data-shapes, §MESH-01 core increments a–e + FU checkpoint + locked design decisions**, and prior §RESUME snapshots) lives in **[plan-archive.md](plan-archive.md)** — the 2026-07-03 sections and the 2026-07-06 §RESUME-condense section each record the verification (commits + greps + green gates) run before their blocks were moved.

---

*© 2026 Paul Richeson — MIT License.*
