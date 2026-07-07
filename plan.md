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

> **⟶ Current state (2026-07-06): §MESH-01 is DONE in full** — core mesh, the gameplay ladder (f–j), and **every follow-up (§MESH-01-FU 1–14, last batch ✅ 2026-07-06 + same-day archive pass)**. Likewise closed: **§ARCH-01 UQF** (all ~2,700 quests UQF-1.0; QuestRuntime the single execution surface; residuals `quest_math_01–05` activate-only + 30 dead `blq_05–10` stubs, both test-pinned; quest-runtime-uqf 288 green). Gates at the FU close: mud-harness **251/251** ([A]–[Q]) · mesh Playwright 42 · check:walk 6/6. Ship records: **plan-archive.md** (the three "Archived 2026-07-06" sections, newest = "FU-close pass"); design shapes: `lab-reports/lab-report-mesh-multiuser.md` §6.
>
> **Next on "continue": §MESH-02 increment (b)** — Map-sheet sub-tab shell (Multiplayer section below; design: `lab-reports/lab-report-mesh02-connections-ui.md`; increment (a) server endpoints ✅ shipped + live-verified 2026-07-06). After §MESH-02 closes: pick a planned arc — §GR / §DESIGN-03 / §DUNGEON-01 / §MATH-01 — each needs its lab report locked before any HTML edit (Game Content below). *(§DATA-01-REVERTED ✅ resolved 2026-07-06 — superseded by UQF, journal-renderer textContent residual shipped; also fixed same day: cellMove crash on pre-§CELL-04 saves — loads now layer `_S_DEFAULTS()` under saved data.)* *(The §MESH-01-REVIEW refactor trio — mesh.js extraction, `_mpRepaintMaps` debounce, `_mpBase()` origin fix — ✅ all SHIPPED 2026-07-06; only minor conditional notes remain in the Multiplayer section.)*
>
> Before running any test gate, re-read **Test-Run Rules** (§I above): piped exit codes lie, and the WBAPI server must be stopped for Playwright.
>
> All earlier shipped work (§WALK, §NAV-01, all of §MESH-01, the UQF waves, §CELL-13 re-removal) is archived in **plan-archive.md** — each block re-verified before the move. **Standing rule from §CELL-13: no jump travel, ever** — `checkpointNode` death-respawn is the only warp.

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

> *§MESH-01-FU (follow-ups 1–14) ✅ ALL CLOSED 2026-07-06 — final batch FU 9 world-diff depth (`5ccec4b`) · FU 10 `./api.sh mesh` CLI (`131cee0`) · FU 11–13 ACL template + fail-open warning / tracker cache + bootstrap-fed federation / chat backlog on join (`e13338e`). Gates at close: mud-harness **251/251** ([A]–[Q]) · mesh Playwright 42 · check:walk 6/6. Full ship records (verbatim): plan-archive.md §"Archived 2026-07-06 (FU-close pass)"; operator docs: wbapi-help.md §Mesh API.*

> *§MESH-01 gameplay ladder (f–j) ✅ COMPLETE 2026-07-06 — (f) buffs · (g) hireling · (h) sentries · (i) no-dupe ledger w/ cross-origin trades · (j) PvP duels v1 (`73f7faf`, final rung). Rows + full ship records: plan-archive.md §"Archived 2026-07-06" + §"…(ladder-close pass)"; design: mesh lab report §6. **Deferred:** cross-origin duels, per-round commit-reveal, server-authoritative shared combat (archived row (j)).*
- [ ] **§MESH-02 — Map-Tab Connection Center** (user directive 2026-07-06; design locked: `lab-reports/lab-report-mesh02-connections-ui.md`). All multiplayer menus move into the **Map sheet** as sub-tabs; discovery, list-sources, and ACL become first-class UI. **Locked decisions:** D2 blocklists are share-OUT only, never auto-imported (fetch → preview → explicit merge); D3 sharing is opt-in (`shareBlocklist:true` in mesh-acl.json, else 403); D4 auto-fetch of server-list sources only for hosts on the client whitelist; D6 local discovery = parallel `/api/manifest` probes of localhost:1360–1380 (a browser can't listen, only probe — the Node server stays the only listener); D7 everything is connection/display layer — the mover never reads any of it (Free-Movement), presence stays single-writer. The 🌐 strip + Shift+🌐 modal remain as shortcuts.
  - [x] **(a) Server endpoints** ✅ 2026-07-06 — `GET/PUT /api/mesh/acl` (validated merge-write to `ACL_FILE`, comment keys preserved, hot-reload via mtime; unknown field/bad mode/bad list → 400) + `GET /api/mesh/blocklist` (403 `not-shared` unless opted in; publishes the three block* lists + serverId/engineVer). Tracker-mode exemption extended (a tracker has an ACL too); `mesh-acl.json.example` documents `shareBlocklist`. **Verified live:** PUT dedupes + trims, share flips 403→200, bad mode 400, file delete restores defaults.
  - [ ] **(b) Map-sheet sub-tab shell** — `#map-subtab-bar` (🗺 Map · 🌐 Connect · 🔭 Discover · 🛡 Lists) inside `#sheet-map`; existing map content wraps in `#msub-map` untouched; CSS matches `.sheet-tab` idiom.
  - [ ] **(c) Connect pane** — status card (server `MP.base`, session/name/pid, world tag + engine ver from `/api/manifest`, build-mismatch ⚠); server-or-magnet input + Connect/Disconnect/Join reusing `mpToggle`/`mpJoin`/`mpResolveMagnet` (renderer parameterized by container, not duplicated).
  - [ ] **(d) Discover pane** — 🖥 local port scan (D6) listing every WBAPI server on this machine with Join buttons; tracker/magnet resolve; **server-list sources**: `mpListSources` `[{url,auto}]` in localStorage, loader accepts http(s) txt (one `host:port` / URL / `r2h:?…` magnet per line, `#` comments) or JSON array via `mpParseServerList()`; auto-load on pane open only for whitelisted hosts (D4).
  - [ ] **(e) Lists pane** — client quick-lists `mpBlacklist`/`mpWhitelist` (localStorage) enforced at row-render AND in `mpJoin`; server ACL editor over GET/PUT `/api/mesh/acl` (mode select, six lists, share toggle; offline → hint, not an error); peer-blocklist fetch → count preview → explicit "merge into my blocklist" (D2).
  - [ ] **(f) Tests** — mud-harness **[R]**: dedicated server on a scratch `MESH_ACL_FILE` (GET defaults · PUT roundtrip echoes + file written · blocklist 403→200 across the share flip · validation 400s). Playwright `mesh-connections-ui.test.js` (hermetic, `:1367` route-blocked): sub-tab switching, `mpParseServerList` txt/JSON/garbage, blacklist row-filter + Join refusal, D4 auto-flag gating — via `window.__mesh02` server-free hooks.
  - [ ] **(g) Docs + CLI parity** — wbapi-help.md §Mesh API (now 5 endpoints: acl GET/PUT · blocklist · connect · session/chat); mechanics.md §Multiplayer (connection center + chat history + "two local clients = one server, two browser windows" quick-start); docs-node-network.md §12 pointer; `./api.sh mesh acl|blocklist|connect`; index.md file + lab-report tables.
  - [x] **(h) Multi-user chat history** ✅ 2026-07-06 (user directive) — server: `GET /api/session/chat[?limit=&r=&c=]` serves the whole CHAT_LOG ring (global, oldest→newest, optional cell filter; display-only, no session needed). Client: `MP.chat` accumulating log (cap 200, localStorage `mpChatLog` — persists across reloads) fed by every source under one 2-min dedupe (live SSE, per-cell join backlog, global history fetch once per connect/resume); 💬 toggle + unread badge in the mp-bar opens `#mp-chat-panel` (timestamps, cross-server `@origin8` tags, XSS-escaped). **Verified:** two-server + two-user live run (both speakers accumulate in order, cell filter works) + hermetic Playwright (dedupe 3→2, badge set/clear, server tag, escape, survives reload); mud-harness 251/251 · mesh Playwright 36/36.
  - [x] **(i) Runtime mesh connect** ✅ 2026-07-06 (user directive) — server: `POST /api/mesh/connect` `{addr:'host:port'}` (seeds a gossip peer) or `{tracker:'http(s)://…'}` (adds an announce target), same shapes as the boot flags (`--peer`/`TRACKER_URL`), dials in the SAME request (immediate gossip/announce round) so the result is instant; outbound still ACL-gated; tracker-mode serves it too. worldbuilder Mesh tab: 🔌 Connect box (auto-detects peer vs tracker from input shape, live result note, status poll refresh). Connect-added peers persist via the standing peers-cache mechanism — connect once, remembered. **Verified live:** second server dialed → `peer.live:true` + serverId in the same response. *(Harness hardening found during verify: the MAIN mud-harness server now pid-scopes `PEERS_CACHE_FILE` too — a live dev server's repo-root peers-cache.json poisoned the [H] solo-reachability check, same class as the [E]/[G] 2026-07-06 note.)*
- [ ] **§MESH-01-REVIEW — remaining audit items:**
  - **`nearby`+`world[]` are pos-only** — the `room` half of the surface asymmetry closed with §NAV-01f (`buildLook` shared on start/move/look/pos); fold presence arrays into a shared builder only if a MUD client ever needs them on `move`/`look`. Minor.
  - **Presence Playwright tests share one server** — sessions from closed contexts linger to the 30-min TTL; one cross-test leak already caused a flake. **Rule: assert by pid, never by count**; consider a `session/end` sweep in test teardown.
  - **Refactors:** if `MESH.log` pressure ever shows, derive `moved` from `arrived` at fanout instead of a third event per move. *(✅ 2026-07-06 client pair SHIPPED: `_mpRepaintMaps` 100 ms trailing debounce — SSE bursts coalesce into one repaint, MP.on re-checked at fire time; `_mpBase()` defaults to `location.origin` on http(s) pages so a world served by a friend connects back to that server, `file://` keeps the localhost:1367 dev default, explicit `localStorage.mpServer` still wins.)* *(✅ 2026-07-06 `mesh.js` extraction SHIPPED: the 434-line §MESH-01 kernel — ACL · rate limit · gossip · tracker/federation/bootstrap, the block between the old §MESH sentinels — moved verbatim to `mesh.js` as a factory `require('./mesh')(deps)`; the server passes live surfaces (SESSIONS, SSE fanout, chat ring, manifest/serverId, ledger hooks) and destructures the same names back so all endpoint call sites are unchanged; the one outside write to the internal `_trackerDirty` flag became `trackerMarkDirty()`. `wbapi-server.js` 11,726→11,314 lines. Gates: mud-harness 251/251 · mesh Playwright 43/43 · check:walk 6/6 · live boot + `./api.sh mesh status` verified. Docs synced: index.md file table + docs-node-network.md §12.)*

---

> **Archive:** all closed / completed work (§WALK, §TIMELESS-01, §WBAPI-01, §EDITOR-01-D / -02 / -FU, §CELL-14, the full §ARCH-01 wave-by-wave history, **§NAV-01 Inc a–g + diagnosis/layer-stack/data-shapes, §MESH-01 in full — core increments a–e, gameplay ladder f–j, follow-ups 1–14, locked design decisions**, and prior §RESUME snapshots) lives in **[plan-archive.md](plan-archive.md)** — the 2026-07-03 sections and the three 2026-07-06 sections (§RESUME-condense · ladder-close · FU-close) each record the verification (commits + greps + green gates) run before their blocks were moved.

---

*© 2026 Paul Richeson — MIT License.*
