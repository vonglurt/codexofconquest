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

**CLI quick reference (`./api.sh`):**
```bash
./api.sh ping                              # health check
./api.sh get node LHR                      # fetch node + connections + _meta
./api.sh list quest --node LHR             # quests at a node
./api.sh list npc --node LHR               # NPCs at a node
./api.sh list monster --terrain city       # monsters by terrain
./api.sh put quest quest_wis_01 passText="..." # update field
./api.sh post quest id=q_foo npc=aldric type=side activateNode=CY title="..." # create
./api.sh del quest quest_old_01            # delete (nonce auto-handled)
./api.sh audit                             # full integrity scan (includes §ARCH-02 bits advisory)
./api.sh chain quest_wis_01               # quest dependency chain
./api.sh advise quest_wis_01              # quest fields + chain + advisory in one call
./api.sh export quest_db --out quests.json # dump collection to file
./api.sh location CY                       # composite node view
./api.sh --ai "how do I link two nodes?"  # ask Claude (ANTHROPIC_API_KEY)
```

**Single source of truth:** `roll2hit-v3.html` is the entire game. The API reads its text directly and writes mutations back in-place. `wbapi-server.js` and `worldbuilder.html` are authoring tools — the game requires neither at runtime.

### Cell-First Navigation Policy

**Cell = Location.** All map locations are identified by `(r, c)` cell coordinates. The two-letter node code is a lookup alias for a named cell, not a location pointer. Use `CELL_GRID["r,c"]` to resolve coordinates to node codes. Do not navigate by chasing `N/E/S/W` pointer fields — those were stripped in §CELL-01. When writing new features:

- Positions travel as `{ r, c }` pairs.
- Node codes are resolved from position: `CELL_GRID[\`${r},${c}\`]`.
- "Adjacent" means `(r±1, c)` or `(r, c±1)` — not stored edge links.
- Quest activation checks: `CELL_GRID[\`${s.r},${s.c}\`] === quest.activateNode`.

### Incremental Recitation Rule

While writing vignette content, speak short segments aloud via `say` as you produce them — every page or every couple of paragraphs. Read the element type first, then its text.

Run `say` blocking (no `&`) so each announcement completes before writing continues. Write to file incrementally — after each act, save and run the next `say` call. After every full vignette, commit and speak the commit subject.

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

> ⏩ **The canonical, up-to-date resume prompt is the LAST section of this file** — see **[§RESUME — Continue Here (newest)](#resume--continue-here-newest)** at the bottom. This pointer is kept here so the top-of-backlog habit still lands on current state.

**Current state (2026-06-26, last commit `1d6263a`):** Thread **§TIMELESS-01** is **complete** (Inc A–D); **§WALK-3 is now complete too** — Inc 3 just deleted the 3,240-line dead `reweave-all` body in `wbapi-server.js` (12,510→9,270 lines) + the orphaned `reweave` CLI orchestrator in `api/wb.js`, verified live (reweave-all/rip-and-connect→410, reachability 409/409, mover parity + behaviour green, `reweave` CLI gone). **Immediate next: §WALK-4** (CI-gated invariant suite + Playwright rebuild). Also open: **§TIMELESS-01-FU** (low-risk Hunt-residue doc sweep across 7 spec docs). Working tree clean except untracked `1367-sources/pla.md` + incidental `milepoints/api-cli.log` churn (hook-managed; don't stage). wbapi-server restarted (in-memory matches disk). Full status + copy-paste prompt at the bottom of this file.

### Navigation Core Redesign — §WALK series

> Data shapes locked in `lab-reports/lab-report-terrain-field-mover-redesign.md` (2026-06-25). Strictly sequential; each step is a green-CI checkpoint. Decisions: delete junctions (not transparency); **geo-grid** coordinate system (equirectangular 1°, 360×90, band 70°N→20°S, E↔W wrap, sea impassable + ferry edges, hub=LHR/Birka, 1° city collisions held as locale lists); instanced encounters v1.

- [x] **§WALK-1** — Deleted 316 `junction:true` boilerplate stubs (commit efa8f7a); predicate extended to `"Signpost says:"`; audit clean. Folded in the transparency revert.
- [x] **§WALK-1.5** — Geo re-projection (SCOPED — lab report §3.5). **DONE 2026-06-25.** Applied in 3 steps: (1) equirectangular 1° projection written to NODE_COORDS for all 409 nodes (geo-seed dryRun:false; CELL_GRID auto-rebuilds at load); (2) SEA_MASK installed — `SEA_RUNS` RLE from Natural Earth 110m coastline rasterized at 1°, builds `IMPASSABLE_CELLS` (4790 sea cells); node-occupied cells force-landed (0 nodes on sea); (3) ports+ferry model via **sea-lane land bridges** — `SEA_LANES` (59 cells) carve 1-wide walkable channels reconnecting all 26 island nodes (Iceland/Gotland/Sicily/Malta/Azores/Canaries/CapeVerde/Åland/Doha) + 3 hub maritime shortcuts (VEN↔CON, CON↔CAI, MAR↔ROM); lane cells render as `ocean` terrain (ocean encounters apply). Verified: 409/409 reachable from Birka. NEXT: §WALK-2. Ground truth: 409 nodes, ~84 geocoded, ~325 to place; 23 GEO2 cities collide at 1° (11 cells); CELL_GRID is last-write-wins (10 read sites). Decisions: geo-seed → equirectangular 1°; satellites offset to **own** true-coord cell (sub-degree residue co-locates as locale lists); off-Earth nodes (ASG/AEG/EHZ/MONS) → sub-location of entry-quest anchor; SEA_MASK from Natural Earth 1:110m coastline raster + snap-to-land reconciliation. Open: revisit 0.25° for dense regions?
  - Increment 1 ✅ equirectangular projection in geo-seed (wbapi-server.js), dry-run verified (LHR→10,197; London→18,179; 12 collisions/11 cells). NOT applied.
  - Increment 2 ✅ CELL_GRID → locale lists + `cellCode`/`cellCodes` helpers (10 read sites routed, verified no-op: 0 current collisions). Geocode METHOD validated = **invert-and-reproject** (abstract grid is geo-faithful, median 3 cells to GEO2 anchor; inversion exact on GEO2). Label-matching only covers 22/228 — rejected.
  - Increment 3 ❌ invert-and-reproject REJECTED by dry-run: abstract grid is not geo-faithful (409→108 cells, LHR+Damascus+Nuremberg merged; CAI/ATH/ROM/DAM/TBS cluster near Birka). Reverted; nothing applied. Only reliable source = true GEO2 lat/lon.
  - Increment 3 (gazetteer) ✅ `walk-geo-gazetteer.json` built + validated (254/254 non-GEO2 covered, no overlaps, parents/anchors resolve, in-band): 132 realPlaces, 26 satellites, 54 anchors (flagged), 42 offEarth. With 155 GEO2 → 287/409 have true coords. Surfaced: ~42 offEarth are whole fantasy SUB-REALMS (Atlantis DA/DS, Littoral Courts LC, epic peaks/jungle KTM/SJO, oriental BKK, cyberpunk HKG, Camelot BHD) — bigger than the "handful" the sub-location decision assumed. NEEDS DECISION: Earth-anchor sub-location vs off-grid/portal realm.
  - Increment 3 wiring ✅ geo-seed GEO2 synced to full 155; gazetteer loaded + resolver (satellites/anchors/offEarth chain to anchor cell). Full dry-run: all 409 project, 0 skipped, real cities at TRUE cells (CAI/ATH/ROM/DAM/BAG correct). Realm anchors REDISTRIBUTED by entry-quest where they exist (math→JRS confirmed) else by theme/biome: Birka pile 30→2; clusters now coherent (Tuscany, English literary, hag→Danube marsh, math→Jerusalem, Atlantis/Littoral→Athens). Residue: 4 anachronistic realms (HKG/BKK/CTU/SJO)→Samarkand, flagged off-grid candidates; ~19 German/scholarly interiors→Weimar hub. NOT YET APPLIED.
  - Increment 3 remaining (next) = author SEA_MASK (Natural Earth coastline) + snap-to-land reconciliation → coordinated apply (geo-seed dryRun:false writes NODE_COORDS).
- [x] **§WALK-2** — Extract pure shared mover `mover.js` (`move(world,pos,dir)→MoveResult` with wrap/clamp/sea/ferry/locale); rewire `cellMove` + `session/move` to thin callers; inline-and-verify for single-file guarantee. **DONE 2026-06-26.**
  - Inc 1 ✅ **client extraction** — `mover.js` created (pure kernel, geo wrap/clamp per §2.1, ferry kept as inert hook since §WALK-1.5 uses SEA_LANES land-bridges not ferry edges); `MOVER:CORE` block inlined byte-identically into roll2hit-v3.html (after TERRAIN_ENCOUNTER_RATE); `cellMove` rewired as thin caller via `_moverWorld()`. Verifiers added: `scripts/check-mover-parity.js` (structural byte-identity ✓ 2070B) + `scripts/check-mover-behaviour.js` (replays real CELL_GRID/IMPASSABLE: 41515/41760 exact, **0 content mismatches**, 245 empty-ocean edge/wrap fringe tolerated). Inline scripts parse clean; no identifier collisions.
  - Inc 2 ✅ **server extraction** — `require('./mover')` in wbapi-server.js; added `getImpassable()` (parses `SEA_RUNS` from `WBAPI._rawSrc` → 4790 sea cells, **matches client**), `getLocaleGrid()` (first-wins locale lists), `getMoverWorld()`; `POST /api/session/move` rewired as thin `Mover.move()` caller. **Latent bug fixed** (lab report §8): server now blocks sea/oob (S from Birka 10,197→sea = 409) and **unifies empty-cell movement** with the SP client (was 409, now 200 "unmarked crossroads"). Also made `buildCellGrid` **first-wins** so the primary at collided 1° cells (LHR/BK @ 10,197) matches the client's `CELL_GRID[key][0]` everywhere (start/look/move all report LHR). Verified end-to-end over HTTP: sea-block ✓, named move ✓, empty move ✓. Server restarted (in-memory copy matches disk). NEXT: §WALK-3.
- [x] **§WALK-3** ✅ — Recast reweave as read-only `GET /api/graph/reachability`; retire `fill-gap`/`rip-and-connect`/`fix-all-broken`/`fix-bidirectional`/`reweave-all` (410); delete dead reweave body (`wbapi-server.js`). Inc 1 ✅ + Inc 2 ✅ + Inc 3 ✅ — all done.
  - Inc 1 ✅ **reachability recast** — `GET /api/graph/reachability` now does a terrain-field LAND FLOOD (passable cells via `getImpassable()`, 4-conn + E↔W wrap + N/S clamp; lanes passable for free) instead of node-to-node adjacency. Old endpoint reported a bogus **2 reachable / 407 unreachable / 331 clusters** (it couldn't walk through empty land cells post-§WALK-1.5); recast reports the truth: **409/409 reachable, 0 unreachable, 1 component** (matches §WALK-1.5 offline verify; satisfies §WALK-4 I3). Added `components` (distinct land regions w/ ≥1 node) + lab-report `unreachable:[{code,r,c,terrain,label}]`. Scoped to the `reachability` branch only — `connect`/`broken` untouched. **fix-all-broken/fix-bidirectional are NOT separate endpoints** — they're phase labels inside `reweave-all`'s dead body, so they vanish with Inc 3.
  - Inc 2 ✅ **410 the mutators** — `POST /api/graph/fill-gap` + `POST /api/graph/rip-and-connect` now return **410** (`{ok:false, error, see:'GET /api/graph/reachability'}`); their full bodies were deleted (they sit outside the Inc 3 deletion range, so cleaned in place). Dropped both `./api.sh` command handlers and all dependent help/index/example entries; rewired stale suggestion strings (`broken`/`reachability`/`verify`/`connect`/`spawn-junction` now point at re-anchor-lat-lon / sea-lane / `./api.sh reachability` instead of the dead mutators). `reweave` (CLI orchestrator of rip-and-connect) un-advertised from help/command-list since it now hits the 410 — its code + the server `reweave-all` body are deleted in Inc 3. Verified live over HTTP: fill-gap→410, rip-and-connect→410, `GET /api/graph/reachability`=409/409 (1 component), both CLI commands now "Unknown command", mover parity still green. (`reweave-all` already 410s at :5763.)
  - Inc 3 ✅ **delete dead reweave body** — deleted `wbapi-server.js` lines 5759–8998 (3,240 lines: the entire dead body after the `reweave-all` 410 early-return, incl. P1 rip-and-connect / P4 fix-all-broken / P5 fix-bidirectional phases + all streaming/snail/map helpers); file 12,510→9,270 lines, then trimmed the stale doc-comment header + added a `logResponse` to the 410 handler. Fixed the now-stale `buildHighway` comment in `cluster-bridge` (it always used its own inline bridge). **Also deleted the orphaned `reweave` CLI orchestrator** in `api/wb.js` (lines 1201–1304, the `async 'reweave'()` method + comment block; it called the now-410 rip-and-connect) and updated the `streamPost` example comment. **Verified live:** both files `node --check` clean; server restarted; `POST /reweave-all`→410, `POST /rip-and-connect`→410, `GET /api/graph/reachability`=**409/409** (0 unreachable, 0 clusters); `node scripts/check-mover-parity.js` ✓ + `check-mover-behaviour.js` ✓ (0 content mismatches); `./api.sh reweave`→"Unknown command"; `./api.sh help` clean (only the §WALK-3 retirement NOTE mentions the dead endpoints).
- [ ] **§WALK-4** — CI-gated invariant suite: reachability proof (I1/I2/I3) + walk parity (structural inline-identity + behavioural kernel trace).
- [ ] **§WALK-5** — MUD multi-client harness; instanced per-session encounters on `session/move`; assert no cross-session encounter bleed.
- [ ] **§WALK-1.5-FU** — Geo follow-ups left open after the apply: (a) 4 anachronistic realms (HKG cyberpunk / BKK oriental / CTU heavenly / SJO jungle) currently anchored to Samarkand — decide off-grid/portal realm vs Earth-anchor; (b) ~19 German/scholarly + Grimm interiors piled on Weimar hub — revisit distribution; (c) revisit 0.25° resolution for dense regions (Tuscany/London locale lists) if 1° co-location proves too coarse; (d) optional browser smoke-test of the new sea-gated overworld; (e) **Playwright nav tests stale** — `tests/integration/navigation.test.js` (+`worldbuilder-walk.test.js`) hardcode pre-§WALK-1.5 coords/adjacencies (BOO r:47,c:223→now r:2,c:194; BOO→LXF→SEN no longer adjacent) and assume one node per cell (LHR+BK now co-locate at cell 10,197). Already red on `main` independent of §WALK-2. Rebuild belongs in §WALK-4 (invariant suite); until then use the node parity harnesses (`scripts/check-mover-*.js`). See `project_walk_redesign` in memory.

### §TIMELESS-01 — Timeless one-cell movement + Hunt feature removal (active; spec locked 2026-06-26)

> User directive 2026-06-26: movement is pure one-cell N/E/S/W, no "walkable gap distance", no time advancing from travel, no hunting time bonus — the hunt screen/concept is gone. **Spec + data shapes locked in `lab-reports/lab-report-timeless-movement-hunt-removal.md`.** Decisions: (D1) **only movement is timeless** — keep the `⏱ Hours` HUD, fatigue, and Day 1→49 deadline; battles/sleep/fishing/short-rest still cost time; (D2) **remove the entire Hunt/Stalk feature**; (D3) plan + lab report first, then implement B→C ordered. Note: runtime is already one-cell (§CELL-03/§WALK-2) — "gap distance" is only leftover hint wording + the worldbuilder concept already retiring in §WALK-3. `slStalksWon` is mislabeled (counts BMA battle wins, not stalks) so `quest_slums_cleanup` survives hunt removal unchanged. API-First N/A: all changes are engine code (`_S_DEFAULTS`, `cellMove`, `QUEST_DB.completeFn`), not WBAPI data.

- [x] **Inc A — Movement timeless** ✅ — removed the two `hoursElapsed`/`hoursSinceSlept` += 1 lines in `cellMove` (replaced with a §TIMELESS-01 marker comment). Confirmed the remaining 4 time-write sites are all non-movement: short-rest (6449/23413), battle-start `_storyRollInit` (22337), sleep (31909); the hunt `+2` (26726) goes in Inc B. `⏱ Hours` HUD + fatigue + Day-49 all retained.
- [x] **Inc B — Hunt logic + state** ✅ — `cellMove`/`_enterEmptyCell` encounter branch → plain path (always `baseRate` + `_weightedMonsterPick` + "Wild …"); removed all hunt-only fns (`storyToggleHunt`, `_updateHuntBtn`, `storyQuestHunt`, `storyQuickWait`, `_stalkedMonsterPick`, `_getQuestTargetKeys`), the `HUNTING_GROUNDS` constant, both `huntMode` defaults, all `pb.stalk` flags + `!pb.stalk` guards, the storyRender hunt cards + per-quest hunt buttons (`huntBtnHtml` + the quest-card `🎯 Hunt` branch), the `_updateHuntBtn()` render call, the `btn-hunt-toggle` listener, and the stalk-modal JS (direct hide at 27226 + entries in two modal-ID arrays). The STALK section is now a fishing-only `🎣 Fish` section. **Grep-clean** (only §TIMELESS-01 marker comments remain); all inline `<script>` parses (0 syntax errors). Kept the shared `.btn-hunt`/`.hunt-accordion` CSS classes (reused by fish/condition/stealth/tournament UI) and `_notoriety`/`_notorietyWeights` (still used elsewhere) and `slStalksWon` (counts BMA wins).
- [x] **Inc C — Hunt UI/DOM/CSS** ✅ — replaced the 🎯 `#btn-hunt-toggle` with an inert `dpad-center-spacer` (keeps the 3×3 d-pad grid); removed the `#story-stalk-modal` HTML and its light+dark CSS, the hunt-specific CSS (`.hunt-section-hd`, `.hunt-target-*`, `.hunt-on`, `.stalk-chip`, `.stalk-quest-entry`, light+dark), and the now-orphaned `.dpad-center` rules. **Kept** the shared `.btn-hunt` + `.hunt-accordion` classes (still used by fish/condition/stealth/tournament UI). (HUNT cards in `storyRender` were already removed in Inc B.) **Verified in headless Chromium:** page loads with **0 console/page errors**; `#btn-hunt-toggle`/`#story-stalk-modal` absent; `storyToggleHunt`/`storyQuestHunt` undefined; `cellMove`/`storyFishing` intact; **5 cell-moves keep `hoursElapsed` at 0** (movement timeless, Inc A confirmed) while position changes.
- [x] **Inc D — Quest + wording + docs** ✅ — (a) commented the `slStalksWon` increment at `pb.nodeCode === 'BMA'` (`roll2hit-v3.html` :22762) noting it counts plain BMA combat wins, never depended on Hunt Mode; field name kept (no save migration); confirmed `completeFn:() => (S_story.slStalksWon||0) >= 3` is unchanged so `quest_slums_cleanup` still completes via 3 BMA wins. (b) Reworded the map-click hint from "not reachable in one step. Use D-pad to navigate toward it." → "only an adjacent cell can be clicked to move there. Use the D-pad to travel toward it." (adjacency, not gap-distance). (c) Doc sync: retired `mechanics-combat.md` §Stalk/Hunt Mechanic (replaced the full spec with a Retired pointer; reworded the 3 incidental Stalk refs at §How-combat-starts / §XP / §battlesWon to "random movement / corridor"); updated `index.md` — reverse-lookup row marked *retired §TIMELESS-01*, dropped the `HUNTING_GROUNDS` constant row + `huntMode` state-field row, state-field count **194→193** (verified: exactly one `_S_DEFAULTS` key removed vs pre-TIMELESS), `slStalksWon` redocumented as BMA-win counter, doc-health badge HTML-lines + last-sync-pass refreshed; removed the stale `huntMode` field from `tests/integration/helpers.js` SEED_STATE. **Verified in headless Chromium:** 0 console errors, all hunt fns/`HUNTING_GROUNDS`/`#btn-hunt-toggle`/`huntMode` field absent, 5 cell-moves keep `hoursElapsed` at 0. **Follow-up tracked → §TIMELESS-01-FU** (broader doc residue not in Inc D's scope).
- [ ] **§TIMELESS-01-FU — Deep doc residue sweep** — Inc D's doc sync was scoped to `mechanics-combat.md` + `index.md`. Stale Hunt/Stalk/`HUNTING_GROUNDS`/`huntMode`/`storyToggleHunt` references still live in **7 deeper spec/architecture docs**: `monsters.md` (F5 milepoints + function table rows 733–736), `maps.md` (`_storyFindTerrainNode` + `HUNTING_GROUNDS` rows 614/627), `spec-engine.md` (655/792/890/892), `spec-world.md` (556), `mechanics.md` (653), `docs-node-network.md` (277), `cell-resume-prompts.md` (573/581/1154). Retire/rewrite per two-way sync rule. (Many also carry stale `_storyRollInit`/line-number drift from §WALK — fold a line-number re-audit into the same pass.)

### Tooling

- [ ] **§WORLDBUILDER-01** — Visual grid editor with canvas node map, exit bidirectional wiring, collision detection
- [ ] **§EDITOR-02 UI** — Mission Builder tab in worldbuilder.html (form-based arc insertion with Preview Chain + POST All)
- [ ] **§EDITOR-03 — Worldbuilder UQF export** — once §ARCH-01 (Mechanics) lands, add "export UQF" to worldbuilder.html. (Canonical migration plan now under Mechanics → §ARCH-01.)
- [ ] **§WALK-G extensions** — terrain-color dots, act filter, node creation in-context, compass rose (see index.md Planned Features)
- [ ] **§WBAPI-01 phases 3–5** — full-array PATCH, worldbuilder write tab, standalone Node module
- [ ] **§EDITOR-01-D** — Token item manager (visual chain editor for inv.push/splice sequences)
- [ ] **§CELL-14** — Strip dead `N/S/E/W/portal/spire` fields from `NODE_MAP` source. Endpoint + CLI implemented (`POST /api/migrate/strip-exit-fields`, `./api.sh migrate strip-exit-fields`); dry-run reports 404 nodes / 2,095 fields. Fixes silent no-op in pre-§CELL-14 `/api/admin/strip-edges` (in-memory-only). Run `--execute` to apply. See `data-code-migration-into-cells.md` §6.

### Game Content — Major Planned Arcs

> Each is design-complete or scoped in a memory file; **all require a `lab-report-*.md` locking data shapes before any HTML edit.** Restored here 2026-06-25 from memory (dropped from plan.md during the §WALK rewrite).

- [ ] **§GR — Grief Arc / "La Riva"** — design-complete (2026-05-26), deferred to Layer 78+. Corruption→grief causal chain; node AMS (design: FR) Fishmonger's Row unlocks after `catKingDefeated`; NPCs `connie_tuna`/`aldo_sardino`; 3-quest chain (`quest_la_riva_01..03`); French 5-act vignette technique (object-per-act). Prereq: `lab-report-la-riva-grief-arc.md`. See `project_grief_arc` in memory + story.md §GRIEF AND CORRUPTION.
- [ ] **§DESIGN-03 — Ceremonia Roll + Starting City Expansion** — PLANNED. `d20+abilityMod+profBonus≥DC` skill-check mechanic; new `type:'skill_check'` quest fields; fills the Birka L3–6 XP gap (4 new missions); Yael "The Watchpost" 5-act romantic Ceremonia arc. Prereq: `lab-report-ceremonia-roll-skill-checks.md`. See `project_ceremonia_roll`. *(Note: `type:'skill_check'` quests already exist live — confirm what's shipped vs scoped before building.)*
- [ ] **§DUNGEON-01 — 10 Dungeon Themes** — PLANNED. Priority: D01-03 hero-origin canon (player = trapped Scholar King Apprentice; Prior Carrier NPC at NUE) → D01-07 CY first-visit madness WIS DC12 → D01-08 Mimic Meadows (node LIM, `mimic_meadow`, `quest_mimic_colony`, Tribbles) → D01-10 Loop Heart at CO (pre-boss choice). Plus Sacrifice Gates, Shifting Labyrinth, Scholar Workshop (node SW), Arcane Inversion, Inquisitor interview. Many new state fields. Prereq: `lab-report-dungeon-ten-themes.md`. See `project_dungeon_themes`.
- [ ] **§MATH-01 — Mathematical World** — PLANNED (2026-06-02). Group-theory overlay; nodes EHZ (Event Horizon station), MONS (Monster's Manifold 196,883-dim), ZERO, CNTR (Cantor's Attic); 5 quest seeds (MATH-01..05) connecting Roman/Byzantine/Arabic zero, Galois quintic, Monstrous Moonshine. Adventure-Time register for EHZ/MONS only (French-noir elsewhere). See `project_math_world`.
- [ ] **§1367 — Historical 1367 AD integration** — 6 events→quest seeds (Nájera/routiers, Tamerlane, Ottoman Balkans, Hanseatic peak, Wycliffe, Black Death aftermath); **8 clarification questions in §1367-D gate HTML integration**. No anachronisms. See `project_1367_setting`.
- [ ] **§FUTURE-01 — Saul→Paul arc** — unscheduled. Middle East node map; Acts/Pauline fidelity; Damascus-Road conversion reframes toolkit (combat→rhetoric) and rewrites quest availability — a world-first conversion mechanic. Node map/quest IDs/NPC keys drafted. See `project_future_saul_paul`. *(Open design call: does Acts-fidelity register create tonal discontinuity?)*
- [ ] **§GR-D Froberger Entry 42** — blank page filled on second playthrough. Requires NG+ state tracking (currently unsupported).

### §WALK-2-FU — Mover follow-ups (opened 2026-06-26)

- [ ] **Pre-commit hook bug — `cleanup-cruft.sh:136` `PRUNE_LIST[@]: unbound variable`** — `.githooks/pre-commit` → `scripts/cleanup-cruft.sh` errors under `set -u` when the prune list is empty (`"${PRUNE_LIST[@]}"` on an unset array). Tolerated by the hook's `|| true`, so commits still land, but it (a) prints a scary warning and (b) skips re-staging `milepoints/` cleanup that run. One-line fix: initialize `PRUNE_LIST=()` or guard with `${PRUNE_LIST[@]+"${PRUNE_LIST[@]}"}`.
- [ ] **`terrainAt`/`encounterRate` on the server world** — `getMoverWorld()` omits them (server encounters are §WALK-5). When §WALK-5 lands, wire them so `MoveResult.encounter` is populated server-side and the instanced-encounter roll (§7.1) can read it.
- [ ] **Ferry hook is inert** — `mover.js` keeps `world.ferryEdges` support but §WALK-1.5 carries crossings as SEA_LANES land-bridges, so no caller passes ferry edges. Either author real `FERRY_EDGES` (lab report §3.5.5) and feed them in, or delete the hook if land-bridges are the permanent model. Decision deferred.

### Mechanics & Systems

- [ ] **§ARCH-01 — Universal Quest Format (UQF v1.0)** — unify 3 incompatible quest formats. Phase 0 ✅ (anchors + worldbuilder.html). Remaining: Phase 1 add `SCHEMA_VERSION`+`QuestRuntime`+`adaptLegacyQuest` (inert); Phase 2 new arcs in UQF; Phase 3 arc-by-arc migration (§WISDOM-01 first); Phase 4 remove legacy path; Phase 5 QUEST_DB = single source of truth. Prereq: `lab-report-quest-api-architecture.md`. See `project_quest_api`.
- [ ] **§MBIT-02 — Mission Bit Token follow-ups** — §MBIT-01 shipped (`_grantMissionBit`/`_takeMissionBit`, `type:'mission_bit'` items). Remaining: `bitLabel` cleanup for Paul-arc quests, `_takeMissionBit` call sites for consumed tokens, worldbuilder schema update, token timeline in journal. See `project_mission_bit_tokens`.
- [ ] **Global monster drop nerf (−3→0 floor)** — design intent (fishing = exclusive positive-magic-loot vector) never shipped; monster drops still yield 0..+3. Open loot-balance gap. See `project_open_gaps`.
- [ ] **`fishmongerRowRestored` visual rebuild** — flag sets on `quest_la_riva_03` but AMS node has no `partial_market` "after restoration" text variant; Row never visually rebuilds. (Blocks on §GR.)
- [ ] **UI gaps** — `[INVESTIGATE]` buttons don't highlight on node entry (root cause unknown); reading-circle has no progress UI. See `project_open_gaps`.

### Design Decisions (pending)

- [ ] **Arc ID as first-class UQF field** — add `arc: 'quest_wis'` explicitly to quest objects; enables arc sorting without string-splitting heuristics
- [ ] **§MBIT-02-E token/gate unification** — leaning toward keeping KEY_EVENTS items and mission bit tokens separate (different ontology). Decision pending.

---

## §RESUME — Continue Here (newest)

> **Updated 2026-06-26 · branch `main` · last commit `5a54657` (Inc D not yet committed).** This is the canonical handoff — the most current snapshot of where the work stands and everything still outstanding. (The top-of-file §RESUME just points here.)

### Where we are

**§TIMELESS-01 (timeless one-cell movement + Hunt-feature removal)** is **complete** (user directive 2026-06-26; spec: `lab-reports/lab-report-timeless-movement-hunt-removal.md`). Done: **Inc A** (movement no longer advances the clock), **Inc B** (removed all Hunt/Stalk JavaScript — encounter branch → plain `baseRate`+`_weightedMonsterPick`; deleted hunt fns, `HUNTING_GROUNDS`, `huntMode` state, `pb.stalk` flags/guards, hunt cards), **Inc C** (removed the 🎯 button → inert spacer, the stalk modal HTML + hunt-specific CSS), **Inc D** (commented the `slStalksWon` BMA-win counter + confirmed `quest_slums_cleanup` 3-win completion unchanged; reworded the map-click hint to adjacency-not-distance; retired `mechanics-combat.md` §Stalk/Hunt + scoped `index.md` sync — reverse-lookup row, `HUNTING_GROUNDS`/`huntMode` rows dropped, state-field count 194→193, doc-health badge). Verified in headless Chromium after each: 0 console errors; hunt fns/modal/`#btn-hunt-toggle`/`huntMode` field gone; 5 cell-moves keep `hoursElapsed` at 0. **Newly queued: §TIMELESS-01-FU** — deep Hunt-residue doc sweep across 7 spec/architecture docs (monsters.md, maps.md, spec-engine.md, spec-world.md, mechanics.md, docs-node-network.md, cell-resume-prompts.md) that were out of Inc D's scope.

Prior thread — **§WALK navigation-core redesign** (lab report: `lab-reports/lab-report-terrain-field-mover-redesign.md`): **§WALK-1** (junctions deleted), **§WALK-1.5** (geo re-projection + SEA_MASK + sea-lane land-bridges), **§WALK-2** (shared `mover.js`), **§WALK-3** — Inc 1 (reachability = land flood, 409/409) ✅, Inc 2 (410'd `fill-gap`+`rip-and-connect`) ✅, **Inc 3 ✅** (deleted the 3,240-line dead `reweave-all` body in `wbapi-server.js` + the orphaned `reweave` CLI orchestrator in `api/wb.js`; verified 410s + 409/409 reachability + mover parity green) — **§WALK-3 now complete**.

Working tree is clean except untracked `1367-sources/pla.md` and incidental `milepoints/api-cli.log` churn (pre-commit hook manages `milepoints/`; never stage it manually). wbapi-server is restarted — its in-memory copy matches disk. Verify nav-tooling with `./api.sh reachability` (409/409) + `node scripts/check-mover-{parity,behaviour}.js`; smoke-test the game in headless Chromium via a temp Playwright script (the committed Playwright nav tests are stale since §WALK-1.5 — see §WALK-1.5-FU(e)).

### Immediate next step

**§WALK-4** — CI-gated invariant suite (I1/I2/I3 reachability proof + walk-parity) and rebuild the stale Playwright nav tests. (Also open: **§TIMELESS-01-FU**, the deep Hunt-residue doc sweep across 7 spec docs — a low-risk docs-only pass that can be slotted in any time.)

### All outstanding work (index into the sections above)

- **§TIMELESS-01:** Inc A ✅ + Inc B ✅ + Inc C ✅ + Inc D ✅ — **complete**. Spec: `lab-reports/lab-report-timeless-movement-hunt-removal.md`. **Follow-up §TIMELESS-01-FU** (deep Hunt-residue doc sweep across 7 spec docs) is now the open piece of this thread — see the §TIMELESS-01 section above for the file/line list.
- **§WALK series (sequential):** §WALK-3 ✅ complete → **§WALK-4** (CI-gated invariant suite: I1/I2/I3 reachability proof + walk-parity; also rebuilds the stale Playwright nav tests) → **§WALK-5** (MUD multi-client harness; instanced per-session encounters on `session/move`).
- **§WALK-1.5-FU** (geo follow-ups): (a) 4 anachronistic realms HKG/BKK/CTU/SJO anchored to Samarkand — off-grid/portal vs Earth-anchor; (b) ~19 German/scholarly interiors piled on Weimar — redistribute; (c) revisit 0.25° resolution for dense regions; (d) browser smoke-test of the sea-gated overworld; (e) rebuild stale Playwright nav tests (scoped to §WALK-4).
- **§WALK-2-FU** (mover follow-ups): cleanup-cruft.sh `PRUNE_LIST[@]` unbound-var hook bug; wire server `terrainAt`/`encounterRate` for §WALK-5; resolve the inert ferry hook (author `FERRY_EDGES` vs delete).
- **Tooling:** §WORLDBUILDER-01, §EDITOR-02 UI, §EDITOR-03 (UQF export), §WALK-G extensions, §WBAPI-01 ph3–5, §EDITOR-01-D, §CELL-14 (strip dead N/S/E/W fields — endpoint ready, run `--execute`).
- **Game content arcs** (each needs a `lab-report-*.md` before HTML edits): §GR (La Riva grief arc), §DESIGN-03 (Ceremonia Roll), §DUNGEON-01 (10 dungeon themes), §MATH-01 (mathematical world), §1367 (historical integration — 8 gating questions), §FUTURE-01 (Saul→Paul), §GR-D (Froberger Entry 42, needs NG+).
- **Mechanics & systems:** §ARCH-01 (UQF v1.0, phases 1–5), §MBIT-02 (mission-bit follow-ups), global monster drop nerf (−3→0 floor, never shipped), `fishmongerRowRestored` visual rebuild (blocks on §GR), UI gaps ([INVESTIGATE] highlight, reading-circle progress).
- **Design decisions (pending):** Arc ID as first-class UQF field; §MBIT-02-E token/gate ontology unification.

### Copy-paste prompt to resume

> Read plan.md §RESUME (newest, bottom of file). Work **one increment per "continue"** per the Directive; after each, commit + `say` the subject and keep plan.md + index.md in sync (two-way sync rule). Outstanding work, in order:
>
> 1. **§TIMELESS-01-FU** (deep Hunt-residue doc sweep) — retire/rewrite the stale Hunt/Stalk/`HUNTING_GROUNDS`/`huntMode` references still in 7 deeper docs (`monsters.md` F5 milepoints + fn-table rows 733–736, `maps.md` 614/627, `spec-engine.md` 655/792/890/892, `spec-world.md` 556, `mechanics.md` 653, `docs-node-network.md` 277, `cell-resume-prompts.md` 573/581/1154). Fold a §WALK line-number re-audit into the same pass. (Low-risk docs-only; slot in any time.)
> 2. **§WALK-4** — CI-gated invariant suite (I1/I2/I3 reachability proof + walk-parity) and rebuild the stale Playwright nav tests. **§WALK-5** — MUD multi-client harness; instanced per-session encounters on `session/move` (wire server `terrainAt`/`encounterRate` per §WALK-2-FU; resolve the inert ferry hook).
> 3. **Follow-ups & backlog** (see the sections above for full detail): **§WALK-1.5-FU** (a–e: realm anchoring, Weimar redistribution, 0.25° resolution, overworld smoke-test, Playwright rebuild), **§WALK-2-FU** (cleanup-cruft.sh `PRUNE_LIST[@]` hook bug), **Tooling** (§WORLDBUILDER-01, §EDITOR-02/03, §WALK-G, §WBAPI-01 ph3–5, §EDITOR-01-D, §CELL-14 run `--execute`), **Game-content arcs** (each needs a lab report first: §GR, §DESIGN-03, §DUNGEON-01, §MATH-01, §1367, §FUTURE-01, §GR-D), **Mechanics** (§ARCH-01 UQF phases 1–5, §MBIT-02, monster drop nerf, `fishmongerRowRestored`, UI gaps), **Design decisions** (Arc ID as UQF field; §MBIT-02-E ontology).

---

*© 2026 Paul Richeson — MIT License.*
