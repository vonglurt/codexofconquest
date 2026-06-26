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

### Navigation Core Redesign — §WALK series

> Data shapes locked in `lab-reports/lab-report-terrain-field-mover-redesign.md` (2026-06-25). Strictly sequential; each step is a green-CI checkpoint. Decisions: delete junctions (not transparency); **geo-grid** coordinate system (equirectangular 1°, 360×90, band 70°N→20°S, E↔W wrap, sea impassable + ferry edges, hub=LHR/Birka, 1° city collisions held as locale lists); instanced encounters v1.

- [x] **§WALK-1** — Deleted 316 `junction:true` boilerplate stubs (commit efa8f7a); predicate extended to `"Signpost says:"`; audit clean. Folded in the transparency revert.
- [ ] **§WALK-1.5** — Geo re-projection (SCOPED — lab report §3.5). Ground truth: 409 nodes, ~84 geocoded, ~325 to place; 23 GEO2 cities collide at 1° (11 cells); CELL_GRID is last-write-wins (10 read sites). Decisions: geo-seed → equirectangular 1°; satellites offset to **own** true-coord cell (sub-degree residue co-locates as locale lists); off-Earth nodes (ASG/AEG/EHZ/MONS) → sub-location of entry-quest anchor; SEA_MASK from Natural Earth 1:110m coastline raster + snap-to-land reconciliation. Open: revisit 0.25° for dense regions?
  - Increment 1 ✅ equirectangular projection in geo-seed (wbapi-server.js), dry-run verified (LHR→10,197; London→18,179; 12 collisions/11 cells). NOT applied.
  - Increment 2 ✅ CELL_GRID → locale lists + `cellCode`/`cellCodes` helpers (10 read sites routed, verified no-op: 0 current collisions). Geocode METHOD validated = **invert-and-reproject** (abstract grid is geo-faithful, median 3 cells to GEO2 anchor; inversion exact on GEO2). Label-matching only covers 22/228 — rejected.
  - Increment 3 (next, BREAKING) = implement invert-and-reproject geocode for all 325 + add missing real cities (Genoa/Lübeck/Danzig/Riga/Bruges/Naples) → dry-run → coordinated apply with SEA_MASK.
- [ ] **§WALK-2** — Extract pure shared mover `mover.js` (`move(world,pos,dir)→MoveResult` with wrap/clamp/sea/ferry/locale); rewire `cellMove` + `session/move` to thin callers; inline-and-verify for single-file guarantee.
- [ ] **§WALK-3** — Recast reweave as read-only `GET /api/graph/reachability`; retire `fill-gap`/`rip-and-connect`/`fix-all-broken`/`fix-bidirectional`/`reweave-all` (410); delete dead reweave body (`wbapi-server.js:5891+`).
- [ ] **§WALK-4** — CI-gated invariant suite: reachability proof (I1/I2/I3) + walk parity (structural inline-identity + behavioural kernel trace).
- [ ] **§WALK-5** — MUD multi-client harness; instanced per-session encounters on `session/move`; assert no cross-session encounter bleed.

### Tooling

- [ ] **§WORLDBUILDER-01** — Visual grid editor with canvas node map, exit bidirectional wiring, collision detection
- [ ] **§EDITOR-02 UI** — Mission Builder tab in worldbuilder.html (form-based arc insertion with Preview Chain + POST All)
- [ ] **§ARCH-01 Phases 2–5** — UQF migration arc-by-arc; remove closure pattern; export UQF from worldbuilder
- [ ] **§WALK-G extensions** — terrain-color dots, act filter, node creation in-context, compass rose (see index.md Planned Features)
- [ ] **§WBAPI-01 phases 3–5** — full-array PATCH, worldbuilder write tab, standalone Node module
- [ ] **§EDITOR-01-D** — Token item manager (visual chain editor for inv.push/splice sequences)
- [ ] **§CELL-14** — Strip dead `N/S/E/W/portal/spire` fields from `NODE_MAP` source. Endpoint + CLI implemented (`POST /api/migrate/strip-exit-fields`, `./api.sh migrate strip-exit-fields`); dry-run reports 404 nodes / 2,095 fields. Fixes silent no-op in pre-§CELL-14 `/api/admin/strip-edges` (in-memory-only). Run `--execute` to apply. See `data-code-migration-into-cells.md` §6.

### Game Content

- [ ] **§1367** — Historical 1367 AD integration; 6 events→quest seeds, 8 clarification questions gate scope. See `project_1367_setting.md` in memory.
- [ ] **§GR-D Froberger Entry 42** — blank page filled on second playthrough. Requires NG+ state tracking (currently unsupported).

### Design Decisions

- [ ] **Arc ID as first-class UQF field** — add `arc: 'quest_wis'` explicitly to quest objects; enables arc sorting without string-splitting heuristics
- [ ] **§FUTURE-01 Saul/Paul arc** — canonical placement decision: does Acts-fidelity register create tonal discontinuity? See thematic audit in git history.
- [ ] **§MBIT-02-E token/gate unification** — leaning toward keeping KEY_EVENTS items and mission bit tokens separate (different ontology). Decision pending.

*© 2026 Paul Richeson — MIT License.*
