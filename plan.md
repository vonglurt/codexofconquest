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

### §RESUME — Continue Here (updated 2026-06-25)

**Where we are:** §WALK-1.5 (geo re-projection) is **code-complete and verified but NOT committed.** Branch `main`, last commit `7c93490`. Uncommitted working tree:
- `roll2hit-v3.html` — (a) NODE_COORDS rewritten to equirectangular 1° for all 409 nodes; (b) `SEA_RUNS` + `SEA_LANES` + `IMPASSABLE_CELLS` block (~line 9132); (c) one-liner atop `_inferTerrain` (~line 25709) returning `'ocean'` for lane cells.
- `plan.md` — this backlog consolidation + §WALK-1.5 marked done.
- `1367-sources/pla.md` (untracked), `milepoints/api-cli.log` (incidental log churn — don't stage).
- wbapi-server already restarted so its in-memory copy matches disk.

**Verified:** 409/409 nodes reachable from Birka (LHR cell 10,197); 0 nodes on impassable cells; 4790 sea cells; 59 lane cells. Mask-gen scripts saved at `/tmp/seamask.py` + `/tmp/lanes.py` (regenerate from these if coords change).

**Immediate next steps, in order:**
1. **Commit §WALK-1.5** — stage `roll2hit-v3.html` + `plan.md` only (NOT `api-cli.log`). Suggested subject: `§WALK-1.5: apply equirectangular projection + SEA_MASK + sea-lane ferries`. Then `say` the subject (Commit+Speak rule).
2. *(optional)* Browser smoke-test: walk Birka → hit a coastline ("No path leads that way") → cross a carved lane (renders as Open Terrain — Ocean, may trigger an ocean encounter).
3. **Start §WALK-2** — extract pure `mover.js` (`move(world,pos,dir)→MoveResult` with wrap/clamp/sea/ferry/locale); make `cellMove` (roll2hit-v3.html ~25675) + `POST /api/session/move` (wbapi-server.js ~10866) thin callers. Note: server mover currently lacks the client's IMPASSABLE_CELLS/bounds checks — §WALK-2 unifies that (latent bug). Inline-and-verify for single-file guarantee.
4. Continue down the §WALK series (3→4→5), then the rest of this backlog.

**Copy-paste prompt to resume:**
> Read plan.md §RESUME. Commit the uncommitted §WALK-1.5 geo work (roll2hit-v3.html + plan.md only), then begin §WALK-2: extract the pure shared mover.js and rewire cellMove + session/move as thin callers. Work incrementally per the Directive.

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
- [ ] **§WALK-3** — Recast reweave as read-only `GET /api/graph/reachability`; retire `fill-gap`/`rip-and-connect`/`fix-all-broken`/`fix-bidirectional`/`reweave-all` (410); delete dead reweave body (`wbapi-server.js:5891+`).
- [ ] **§WALK-4** — CI-gated invariant suite: reachability proof (I1/I2/I3) + walk parity (structural inline-identity + behavioural kernel trace).
- [ ] **§WALK-5** — MUD multi-client harness; instanced per-session encounters on `session/move`; assert no cross-session encounter bleed.
- [ ] **§WALK-1.5-FU** — Geo follow-ups left open after the apply: (a) 4 anachronistic realms (HKG cyberpunk / BKK oriental / CTU heavenly / SJO jungle) currently anchored to Samarkand — decide off-grid/portal realm vs Earth-anchor; (b) ~19 German/scholarly + Grimm interiors piled on Weimar hub — revisit distribution; (c) revisit 0.25° resolution for dense regions (Tuscany/London locale lists) if 1° co-location proves too coarse; (d) optional browser smoke-test of the new sea-gated overworld; (e) **Playwright nav tests stale** — `tests/integration/navigation.test.js` (+`worldbuilder-walk.test.js`) hardcode pre-§WALK-1.5 coords/adjacencies (BOO r:47,c:223→now r:2,c:194; BOO→LXF→SEN no longer adjacent) and assume one node per cell (LHR+BK now co-locate at cell 10,197). Already red on `main` independent of §WALK-2. Rebuild belongs in §WALK-4 (invariant suite); until then use the node parity harnesses (`scripts/check-mover-*.js`). See `project_walk_redesign` in memory.

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

### Mechanics & Systems

- [ ] **§ARCH-01 — Universal Quest Format (UQF v1.0)** — unify 3 incompatible quest formats. Phase 0 ✅ (anchors + worldbuilder.html). Remaining: Phase 1 add `SCHEMA_VERSION`+`QuestRuntime`+`adaptLegacyQuest` (inert); Phase 2 new arcs in UQF; Phase 3 arc-by-arc migration (§WISDOM-01 first); Phase 4 remove legacy path; Phase 5 QUEST_DB = single source of truth. Prereq: `lab-report-quest-api-architecture.md`. See `project_quest_api`.
- [ ] **§MBIT-02 — Mission Bit Token follow-ups** — §MBIT-01 shipped (`_grantMissionBit`/`_takeMissionBit`, `type:'mission_bit'` items). Remaining: `bitLabel` cleanup for Paul-arc quests, `_takeMissionBit` call sites for consumed tokens, worldbuilder schema update, token timeline in journal. See `project_mission_bit_tokens`.
- [ ] **Global monster drop nerf (−3→0 floor)** — design intent (fishing = exclusive positive-magic-loot vector) never shipped; monster drops still yield 0..+3. Open loot-balance gap. See `project_open_gaps`.
- [ ] **`fishmongerRowRestored` visual rebuild** — flag sets on `quest_la_riva_03` but AMS node has no `partial_market` "after restoration" text variant; Row never visually rebuilds. (Blocks on §GR.)
- [ ] **UI gaps** — `[INVESTIGATE]` buttons don't highlight on node entry (root cause unknown); reading-circle has no progress UI. See `project_open_gaps`.

### Design Decisions (pending)

- [ ] **Arc ID as first-class UQF field** — add `arc: 'quest_wis'` explicitly to quest objects; enables arc sorting without string-splitting heuristics
- [ ] **§MBIT-02-E token/gate unification** — leaning toward keeping KEY_EVENTS items and mission bit tokens separate (different ontology). Decision pending.

*© 2026 Paul Richeson — MIT License.*
