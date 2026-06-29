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

> **Updated 2026-06-29 · branch `main` · last commit `ac9ef23`.** Active work = **§ARCH-01 Phase 3 UQF migration**, **Wave 1**, **one arc per "continue"** per the Directive. Each increment: migrate the next arc → commit → `say` the subject → sync plan.md / index.md / the migration playbook → `npx playwright test quest-runtime-uqf` + `npm run check:walk` + `npx playwright test navigation`.
>
> **Verification (current):** `quest-runtime-uqf` **104 passed** (SIREN ×3-repeat clean); `check:walk` green; `navigation` 14/14. ~105 quests migrated through **Wave 1s** (`§SIREN-01` — the Four Courts of the Littoral Sea). Docs + memory synced; playbook Wave-1 progress current.
>
> **Next (on "continue"):** the **remaining ~9 Wave-1 singletons** to close out **Wave 1**. The sweep found 14 un-migrated onPass/checkFailFlag skill_checks; SIREN (5) now done. Remaining clusters: **biblical singletons** `stoning_lystra` (KYA, onFail hp→1, shared pass/fail flag `stoningEvent`) + `basket_damascus` (DAM, onPass grants `basketRopeComplete` bit); **Atlantean iodine chain** `iodine_01`/`shore_02`/`forge_01`/`sunken_01` (item/gold/knowledge onPass closures → `_legacy_fn`); **Highland trade** `df_02`/`sk_02` (`checkStat`, rich onPass+onFail msg); **folk wisdom** `lxvii67` (HKG jester, `faith_folk++`) + `guide_04` (SSJ, `emmerStage4a`). → then Waves 2–7 (see the §ARCH-01 entry below). Per-wave detail in that entry + `lab-reports/lab-report-uqf-migration-playbook.md`. **All closed / completed work is archived → `plan-archive.md`.**

### Tooling

- [~] **§EDITOR-02-FU** — Mission Builder follow-ups. ✅ branching arcs (`gateAfter` fork field) + drag-reorder (▲/▼ + grip) shipped 2026-06-27. **Remaining: whole-arc UQF export** — gated on §ARCH-01 landing (needs the UQF schema; feeds §EDITOR-03). Pure worldbuilder; no lab report needed.
- [ ] **§EDITOR-03 — Worldbuilder UQF export** — once §ARCH-01 (Mechanics) lands, add "export UQF" to worldbuilder.html. (Canonical migration plan now under Mechanics → §ARCH-01.)

### Data / Architecture

- [ ] **§DATA-01-REVERTED — entire §DATA-01 quest data/code separation is missing from code** (found 2026-06-26) — index.md L155 records §DATA-01 (2026-06-16) as DONE: `QUEST_EFFECTS` (121 declarative descriptors) + `QUEST_HOOKS` (91 handlers) + `applyQuestEffects()`, `QUEST_DB` purged of 127 `onPass`/`onFail` fns, ZRH duplicate resolved (Dunfall→`DFL`), and `q.title/desc/hint` → `textContent`. **None of it is in the current code** (`QUEST_EFFECTS`/`applyQuestEffects`/`DFL` all grep to 0) — the whole change was reverted/lost, which is why the ZRH duplicate resurfaced (re-fixed above as `DNF`). Likely a snapshot rollback clobbered it. **Decision needed:** restore §DATA-01 from `lab-reports/lab-report-quest-data-code-separation.md` (large) vs fold into §ARCH-01 UQF vs accept the loss + correct index.md. Big — overlaps §ARCH-01.
- [~] **§ARCH-01 — Universal Quest Format (UQF v1.0)** — unify the 3 incompatible quest formats into `schema:'UQF-1.0'` declarative quests (`gate` activation + `bits` chain + `completion` gate). **Phases 0–2 ✅ (2026-06-28)** — inert `QuestRuntime` (`validateQuest`/`adaptLegacyQuest`/`canActivate`/`canComplete`/`execBits`/real-fn `HANDLERS`) + **dual-path dispatch** (`_rollCeremonia`→`_resolveQuestUQF` for `schema:'UQF-1.0'` quests; **every legacy quest stays byte-for-byte on the closure path**). **Phase 3 (arc-by-arc migration) IN PROGRESS.** Landscape: ~2515 quests / ~2227 skill_check. **Wave 1 = the 78 `onPass`-closure skill-checks**, migrated whole-arc, one increment per "continue". **Done through Wave 1q (2026-06-28):** §WISDOM-01 (8) · Wane/Whisper/Glut Crowns (18) · Ceremonia Yael (5) · §1367 skill (4) · **d02xx family 40/40** · inn (3) · spark (5) · spark2 (5) · inquisitor (3) · sea (3) · sb (4) · hunt+hunt2 (8) · bilge (4) · alch (7) · scar (4) · §SIREN-01 Littoral Courts (5) = **~105 quests; `quest-runtime-uqf` 104 tests green.** Plus **§SKILLFIX-01** (game-wide `checkStat`/`checkSkill` resolver bug-fix — makes every `checkStat`→UQF migration pure-parity). Migration pattern: `activateCond`→`gate`, `checkPassFlag`→`mission_bit`, `xpAward`→`reward`, rich `onPass`/`onFail` closures preserved verbatim behind `_legacy_fn`, side quests' `onComplete` kept (engine fires it on the UQF completion path). Engine grew **reusable** gate/bit terms as each gap appeared: gates `questsAttempted`/`questsDone`/`favorMin`/`battles`/`notBattles`/`shardsMin`/`restedAtMin`/`sleptAt`/`flagEquals`; completion `atNode`/`questsComplete`; bits `mission_bit`/`reward`/`_legacy_fn`/`narrative`. **Next op:** the remaining ~9 Wave-1 singletons to finish Wave 1 (§SIREN-01 Littoral Courts ×5 done in Wave 1s; remaining: `stoning_lystra`/`basket_damascus`, the Atlantean iodine chain `iodine_01`/`shore_02`/`forge_01`/`sunken_01`, Highland trade `df_02`/`sk_02`, folk `lxvii67`/`guide_04`). **Then:** W2 (~2149 simple `checkStat` skill-checks → script-assisted bulk) · W3 side quests → declarative completion · W4 combat (needs a UQF combat resolver) · W5 epics (design pass first) · W6 retire the legacy `_rollCeremonia`/completeFn path · W7 QUEST_DB = single source of truth. **Latent bugs flagged & parity-preserved** (NOT fixed): the `onComplete`+`xpAward` **double-count** on lair-clear side quests (sb_fight +800xp, hunt_04 +1000xp, hunt2_04 +1200xp, bilge_04 +1200xp — systematic across "clear-the-lair" side quests); §DUNGEON-01 dead `==='complete'` skill_check handlers — both in `project_open_gaps`. **Full wave-by-wave history → `plan-archive.md` + `lab-reports/lab-report-uqf-migration-playbook.md`.** Prereq lab report: `lab-report-quest-api-architecture.md`. See `project_quest_api`.

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

- [ ] **§MBIT-02 — Mission Bit Token follow-ups** — §MBIT-01 shipped (`_grantMissionBit`/`_takeMissionBit`, `type:'mission_bit'` items). Remaining: `bitLabel` cleanup for Paul-arc quests, `_takeMissionBit` call sites for consumed tokens, worldbuilder schema update, token timeline in journal. See `project_mission_bit_tokens`.
- [ ] **Global monster drop nerf (−3→0 floor)** — design intent (fishing = exclusive positive-magic-loot vector) never shipped; monster drops still yield 0..+3. Open loot-balance gap. See `project_open_gaps`.
- [ ] **`fishmongerRowRestored` visual rebuild** — flag sets on `quest_la_riva_03` but AMS node has no `partial_market` "after restoration" text variant; Row never visually rebuilds. (Blocks on §GR.)
- [ ] **UI gaps** — `[INVESTIGATE]` buttons don't highlight on node entry (root cause unknown); reading-circle has no progress UI. See `project_open_gaps`.

### Design Decisions (pending)

- [ ] **Arc ID as first-class UQF field** — add `arc: 'quest_wis'` explicitly to quest objects; enables arc sorting without string-splitting heuristics
- [ ] **§MBIT-02-E token/gate unification** — leaning toward keeping KEY_EVENTS items and mission bit tokens separate (different ontology). Decision pending.

---

> **Archive:** all closed / completed work (§WALK, §TIMELESS-01, §WBAPI-01, §EDITOR-01-D / -02 / -FU, §CELL-14, the full §ARCH-01 wave-by-wave history, and prior §RESUME snapshots) lives in **[plan-archive.md](plan-archive.md)**.

---

*© 2026 Paul Richeson — MIT License.*
