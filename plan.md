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

### Free-Movement / Mission-Gating Policy

**The world is freely traversable. Quests never block movement. "Gating" applies only to the *mission list*, never to a *road*.**

This is a hard invariant, not a preference. Two distinct, non-overlapping mechanisms — keep them separate:

1. **Movement gating = terrain/geometry ONLY.** A step is refused for exactly two reasons (`mover.js` / inlined `moverMove`): `'oob'` (off the grid) and `'sea'` (destination cell is in the `impassable` set — sea + `IMPASSABLE_CELLS`). **No quest, flag, `S_story` field, mission bit, or item may ever cause a step to be refused.** There is no "blocked road," no "locked gate on a path," no "come back when you've done quest X to pass here." Water crossings are carried as **SEA_LANES land bridges** (passable cells), not as conditional barriers. If a future feature needs a place to feel impassable until something happens, it must do so by **changing terrain/`CELL_GRID`/`IMPASSABLE_CELLS` state** (the cell genuinely becomes/stops-being sea), *not* by consulting quest state inside the mover.

2. **Mission gating = quest `gate` ONLY (listing, not traversal).** A quest's `gate` (UQF) / legacy `activateCond` decides **whether a mission is *offered/listed* when you arrive at its `activateNode`** — consulted in exactly one place, `storyCheckQuests` (`if (q.schema==='UQF-1.0' && !QuestRuntime.canActivate(q.id)) return;`). An unsatisfied gate means the quest simply isn't added to your journal yet (e.g. act 2 of an arc lists only after act 1 passes — sequential **mission availability**). You always reached the node freely; only the *listing* was deferred. `gate:{}` = always listed; `gate:{flags:[…]}` = listed once the prior flag is set. **`gate` is mission metadata; it must never be read by the mover or any movement/entry code.**

**Allowed:** gating mission *listing* (sequential arc unlock, prerequisite missions, flag/node/battle-conditioned availability). **Forbidden:** gating *movement* on quest/flag state (a quest that bars a road, an exit that won't open until a mission is done, an NPC who physically blocks a cell).

**Enforcement / audit (run before shipping any movement or quest-availability change):**
- `grep -nE "canActivate|\.gate\b" mover.js` → must stay **0** (the movement kernel never reads quest gates).
- The only `__moverBlocked` reasons may be `'oob'` and `'sea'`; adding a quest/flag-derived block reason is a policy violation.
- `QuestRuntime.canActivate` / `q.gate` may be referenced only by quest-listing/journal code (`storyCheckQuests`), never by `moverMove` / `_enterEmptyCell` / any entry handler.

*(Verified true as of Wave 2g, 2026-06-29: mover has 0 gate refs; `canActivate` is called only in `storyCheckQuests`; the bulk UQF migration moves `activateCond`→`gate` 1:1, so it changes mission-listing logic only and touches movement nowhere.)*

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

> **Updated 2026-06-29 · branch `main` · last commit `_this commit_` (Wave 2h).** Active work = **§ARCH-01 Phase 3 UQF migration**, **Wave 2 (script-assisted bulk)** in progress, **one family/cluster per "continue"** per the Directive. Each increment: migrate the next family via `scripts/uqf-bulk-migrate.js` → commit → `say` the subject → sync plan.md / index.md / the migration playbook → `npx playwright test quest-runtime-uqf` + `npm run check:walk` + `npx playwright test navigation`.
>
> **Verification (current):** `quest-runtime-uqf` **140 passed** (Wave 2 ×3-repeat clean); `check:walk` green; `navigation` 14/14. **Wave 1 COMPLETE** (~115 quests). **Wave 2 in progress:** **`hav_*`** (30) + **`ada*`** (235) + **`ath*`** (113) + **`lis*`** (89) + **`zth*`** (75) + **`flr*`** (71) + **`hft_*`** (50) + **`rkv_*`** (50) families bulk-migrated (hft/rkv = mixed flag/flagless), each parity-verified byte-for-byte vs a pre-migration golden capture. **~713 of ~2350 well-formed legacy skill_checks migrated; ~1635 remain.** Docs synced.
>
> **Wave-2 machinery (`scripts/uqf-bulk-migrate.js`):** deterministic, safe-by-construction — never re-serializes narrative strings; only deletes scalar legacy `check*`/`xpAward`/`goldAward`/`bitLabel`, decomposes the trivial `() => !!S_story.<flag>` activateCond → `gate:{flags:[…]}` (other activateConds kept verbatim behind `gate:{_legacyFn:true}`), inserts `schema/gate/bits` after `type:"skill_check",`. **Hardened in Wave 2c:** (a) trivial-gate match handles activateCond as the LAST field (no trailing comma); (b) it strips BOTH the function form AND any dead **string-copy duplicate** `activateCond:"() => …"` (a data-gen bug in ~36 quests whose last-key-wins STRING value made the legacy `q.activateCond()` THROW — migration removes both & decomposes, fixing the crash); (c) a hard post-condition errors if any `activateCond` survives a decompose. Run `--dry` to preview, `--prefix <fam>` or an id-list to apply; idempotent (skips already-UQF). **Per-family parity protocol:** capture golden (legacy resolution + verbatim display fields) **before** migrating → apply → re-run identical sim → assert byte-for-byte **+ gate behavior** (`canActivate` true iff gate flag set) + no-residual-`activateCond`.
>
> **Next (on "continue"):** migrate the **next Wave-2 family** (~1970 well-formed legacy skill_checks remain). **Key scoping finding:** across ALL top families, **0 have a "complex" activateCond** — every gate is either absent (→`gate:{}`) or the trivial `()=>!!S_story.<flag>` (→`gate:{flags:[…]}`); no xp/gold/bitLabel/retry/fail-flag anywhere. So the migrator handles every remaining family with **no `_legacyFn` fallbacks**. **Queue by size** (all `checkPassFlag`, mixed none/trivial gates) — take the top one each increment: ~~`lis`~~ ✅ (89) → ~~`zth`~~ ✅ (75) → ~~`flr`~~ ✅ (71) → ~~`hft_`~~ ✅ (50, **first mixed flag/flagless** — 35 carry `checkPassFlag`, 15 don't → `onPass:[]`) → ~~`rkv_`~~ ✅ (50, twin of hft_ — same 35/15 mixed split) → **`ist` (48)** → `rix_` (47) → `ost_` (46) → `arn_` (43) → `clj`/`nwi`/`vby_` (42) → … (re-scope sizes after a few; ids beyond the head are approximate). **Two recurring gotchas, both handled:** (1) **UPPERCASE-`checkStat` families** (lis/zth/flr/hft all were — likely the norm): legacy reads `abilityScores[checkStat]` raw-case ⇒ silent +0 mod, UQF lowercases ⇒ real mod — seed the golden under BOTH cases (`seed()` helper). (2) **Mixed flag/flagless** (hft was first): some acts have no `checkPassFlag` → migrator emits `onPass:[]` (legacy granted nothing — pure parity); golden/verify/permanent specs branch on `g.flag` (see the `hft_*` row + the Wave-2g test block). **NB:** (a) `--prefix` matches by `startsWith` — eyeball the dry-run id list for **bleed** (a short prefix can catch a neighbouring arc, as `ath` caught both `ath_c1a*` and `ath_NN_act*`); tighten to an explicit id-list if needed. (b) `type:"hybrid"` quests are correctly skipped (skill_check-only). (c) 30 degenerate `blq_*` book-stubs are out of scope. → then Waves 3–7 (see §ARCH-01 entry). **Archive → `plan-archive.md`.**
>
> #### ▶ TODO — exact runbook for the next increment (next family = **`ist`**, ~48 quests)
> A fresh session can run this verbatim. Replace `ist` with the queue's current head if it is already done. **NB `--prefix ist` may bleed into `istanbul…`/`ist_c1a*` — eyeball the dry-run id list and tighten to an explicit id-list if needed.** **Before applying, check (a) `checkStat` case** (`grep -oE 'id:"ist[^"]*"[^}]*checkStat:"[^"]*"'`): if UPPERCASE (the norm so far — lis/zth/flr/hft/rkv all were), the specs must seed `abilityScores` under BOTH the raw and lowercased key (`seed(k,v)=>({[k]:v,[k.toLowerCase()]:v})`); **and (b) whether any acts lack `checkPassFlag`** (mixed flag/flagless, as `hft_`/`rkv_` were) — if so the golden/verify/permanent specs must branch on `g.flag` (flagless ⇒ `onPass:[]`, pass→done with no token), per the Wave-2g/2h `hft_*`/`rkv_*` blocks.
> 1. **Pick & sanity-dry-run:** `node scripts/uqf-bulk-migrate.js --prefix ist --dry` → confirm `migrated == targets`, `skipped 0`, no `legacyGate`, no unexpected `xp`/`gold`/`skill`, and every id is genuinely in the family (no prefix bleed — e.g. `--prefix ist` would also match `istanbul…`; eyeball the id list, tighten to an explicit comma id-list if needed). **Also grep the family's `checkStat` case** — if uppercase, use the both-case `seed()` helper in steps 2/4/5 (see the `lis`/`zth` Wave-2d/2e specs).
> 2. **Capture golden (BEFORE migrating):** create a temp spec `tests/integration/_bulk-golden.spec.js` (env-driven; the body is preserved in the Wave-2d/2e history — it records, per quest in the prefix: verbatim display fields {title,desc,hint,passText,failText,npc,activateNode,waypointNode,retryable} + a forced-PASS sim (abilityScores `seed(stat,40)`, level 20) + a forced-FAIL sim (`seed(stat,-100)`, level 1, day 5), where `seed(k,v)=>({[k]:v,[k.toLowerCase()]:v})` so BOTH the raw-case legacy resolver and the lowercasing UQF resolver read the extreme). Run: `UQF_PREFIX=ist UQF_GOLDEN=/tmp/ist-golden.json npx playwright test _bulk-golden`, then `rm` the temp spec.
> 3. **Apply:** `node scripts/uqf-bulk-migrate.js --prefix ist`.
> 4. **Verify byte-for-byte:** temp spec `_bulk-verify.spec.js` (reads `process.env.UQF_GOLDEN`) asserting, per id: `struct` (schema UQF-1.0, validateQuest true, onPass `['mission_bit']` (+`reward` only if golden had xp/gold), onFailLen 0, mbFlag === passFlag, mbHasLabel false), `disp` deep-equals golden (narrative untouched), `pass`/`fail` deep-equal golden (same `seed()` helper), AND `page.on('pageerror')` is empty (file still boots). Run `UQF_GOLDEN=/tmp/ist-golden.json npx playwright test _bulk-verify`, then `rm` it.
> 5. **Add a permanent self-contained test block** to `tests/integration/quest-runtime-uqf.test.js` (model on the `§ARCH-01 Wave 2b — ada*` describe): enumerate the family from `QUEST_DB`, assert structure + full pass/fail parity (it must not depend on `/tmp`). For families with trivial gates also assert the gate→prior-flag chaining (model on the `hav_*` gate test).
> 6. **Gates:** `npx playwright test quest-runtime-uqf` (expect +N), then `... --grep "Wave 2" --repeat-each=3` (roll-outcome stability), `npm run check:walk`, `npx playwright test navigation` (14/14).
> 7. **Commit** (stage only `roll2hit-v3.html` + the test file + `plan.md` + the playbook — NOT `playwright-report/`/`salvage/`), with the `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>` trailer. **`say`** the subject. **Sync docs:** backfill the prior wave's `_this commit_` → its real hash in the playbook, add the new wave's row (Section-1 + Section-4 tables), bump counts/last-commit in this §RESUME + the §ARCH-01 entry.
> **Latent decision deferred to W6/W7:** Wave 2 leaves `gate:{}`/`gate:{flags:[…]}` driving activation but the legacy `activateCond` was *deleted* only when trivial — there are none kept here (0 complex), so nothing is dual-gated. The `mission_bit` token-on-pass is now the single grant path; no consumer reads these passFlags as anything but `S_story.<flag>` booleans (re-confirm with a grep if a family's flags look load-bearing).

### Tooling

- [~] **§EDITOR-02-FU** — Mission Builder follow-ups. ✅ branching arcs (`gateAfter` fork field) + drag-reorder (▲/▼ + grip) shipped 2026-06-27. **Remaining: whole-arc UQF export** — gated on §ARCH-01 landing (needs the UQF schema; feeds §EDITOR-03). Pure worldbuilder; no lab report needed.
- [ ] **§EDITOR-03 — Worldbuilder UQF export** — once §ARCH-01 (Mechanics) lands, add "export UQF" to worldbuilder.html. (Canonical migration plan now under Mechanics → §ARCH-01.)

### Data / Architecture

- [ ] **§DATA-01-REVERTED — entire §DATA-01 quest data/code separation is missing from code** (found 2026-06-26) — index.md L155 records §DATA-01 (2026-06-16) as DONE: `QUEST_EFFECTS` (121 declarative descriptors) + `QUEST_HOOKS` (91 handlers) + `applyQuestEffects()`, `QUEST_DB` purged of 127 `onPass`/`onFail` fns, ZRH duplicate resolved (Dunfall→`DFL`), and `q.title/desc/hint` → `textContent`. **None of it is in the current code** (`QUEST_EFFECTS`/`applyQuestEffects`/`DFL` all grep to 0) — the whole change was reverted/lost, which is why the ZRH duplicate resurfaced (re-fixed above as `DNF`). Likely a snapshot rollback clobbered it. **Decision needed:** restore §DATA-01 from `lab-reports/lab-report-quest-data-code-separation.md` (large) vs fold into §ARCH-01 UQF vs accept the loss + correct index.md. Big — overlaps §ARCH-01.
- [~] **§ARCH-01 — Universal Quest Format (UQF v1.0)** — unify the 3 incompatible quest formats into `schema:'UQF-1.0'` declarative quests (`gate` activation + `bits` chain + `completion` gate). **Phases 0–2 ✅ (2026-06-28)** — inert `QuestRuntime` (`validateQuest`/`adaptLegacyQuest`/`canActivate`/`canComplete`/`execBits`/real-fn `HANDLERS`) + **dual-path dispatch** (`_rollCeremonia`→`_resolveQuestUQF` for `schema:'UQF-1.0'` quests; **every legacy quest stays byte-for-byte on the closure path**). **Phase 3 (arc-by-arc migration) IN PROGRESS.** Landscape: ~2515 quests / ~2227 skill_check. **Wave 1 = the 78 `onPass`-closure skill-checks**, migrated whole-arc, one increment per "continue". **Wave 1 COMPLETE (2026-06-29):** §WISDOM-01 (8) · Wane/Whisper/Glut Crowns (18) · Ceremonia Yael (5) · §1367 skill (4) · **d02xx family 40/40** · inn (3) · spark (5) · spark2 (5) · inquisitor (3) · sea (3) · sb (4) · hunt+hunt2 (8) · bilge (4) · alch (7) · scar (4) · §SIREN-01 Littoral Courts (5) · biblical singletons (2: `stoning_lystra`/`basket_damascus`) · Atlantean iodine chain (4: `iodine_01`/`shore_02`/`forge_01`/`sunken_01`) · Highland trade (2: `df_02`/`sk_02`) · folk wisdom (2: `lxvii67`/`guide_04`) = **~115 quests.** **Wave 2 (bulk) in progress:** `hav_*` (30) + `ada*` (235) + `ath*` (113) + `lis*` (89) + `zth*` (75) + `flr*` (71) + `hft_*` (50) + `rkv_*` (50) families via `scripts/uqf-bulk-migrate.js`, each parity-verified vs pre-migration golden (Wave 2c also hardened the migrator + fixed a latent string-`activateCond` TypeError crash in ~3 duplicate-key quests; Waves 2d–2h were the first five UPPERCASE-`checkStat` families — legacy read them raw-case ⇒ silent +0 mod, migration realizes the §SKILLFIX-01 fix, golden seeded under both stat cases; 2g/2h were MIXED flag/flagless families — 15 of 50 acts have no `checkPassFlag` → `onPass:[]`, pure parity; 2e–2h also confirmed the transform is type-gated, skipping a hybrid + combat + deliveries the prefix matched) → **~825 quests on UQF; ~1635 well-formed legacy skill_checks remain; `quest-runtime-uqf` 140 tests green.** Plus **§SKILLFIX-01** (game-wide `checkStat`/`checkSkill` resolver bug-fix — makes every `checkStat`→UQF migration pure-parity). Migration pattern: `activateCond`→`gate`, `checkPassFlag`→`mission_bit`, `xpAward`→`reward`, rich `onPass`/`onFail` closures preserved verbatim behind `_legacy_fn`, side quests' `onComplete` kept (engine fires it on the UQF completion path). Engine grew **reusable** gate/bit terms as each gap appeared: gates `questsAttempted`/`questsDone`/`favorMin`/`battles`/`notBattles`/`shardsMin`/`restedAtMin`/`sleptAt`/`flagEquals`; completion `atNode`/`questsComplete`; bits `mission_bit`/`reward`/`_legacy_fn`/`narrative`. **Next op:** **Wave 1 done; Wave 2 (bulk) in progress.** W2 machinery = `scripts/uqf-bulk-migrate.js` (deterministic per-family transform; trivial `()=>!!S_story.X` activateCond → `gate:{flags:[X]}`, else kept behind `gate:{_legacyFn:true}`; scalar `check*` fields deleted, `schema/gate/bits` inserted — narrative strings never re-serialized) + a pre-migration **golden capture** parity protocol. **W2a–2h done:** `hav_*` (30) + `ada*` (235) + `ath*` (113, which hardened the migrator + fixed a duplicate-key string-`activateCond` crash) + `lis*` (89) + `zth*` (75) + `flr*` (71) + `hft_*` (50) + `rkv_*` (50) (2d–2h = the first five uppercase-`checkStat` families — both-case golden seed; 2g/2h = mixed flag/flagless, 15/50 acts → `onPass:[]`; 2e–2h type-gated past a hybrid + combat + deliveries). Scoping shows **0 remaining families have a "complex" activateCond** → migrator needs no `_legacyFn` fallback anywhere; **~1635 well-formed legacy skill_checks remain** (0 with closures); 30 degenerate `blq_*`-style book-stubs out of scope. Continue family-by-family (next: `ist` ~48) · W3 side quests → declarative completion · W4 combat (needs a UQF combat resolver) · W5 epics (design pass first) · W6 retire the legacy `_rollCeremonia`/completeFn path · W7 QUEST_DB = single source of truth. **Latent bugs flagged & parity-preserved** (NOT fixed): the `onComplete`+`xpAward` **double-count** on lair-clear side quests (sb_fight +800xp, hunt_04 +1000xp, hunt2_04 +1200xp, bilge_04 +1200xp — systematic across "clear-the-lair" side quests); §DUNGEON-01 dead `==='complete'` skill_check handlers — both in `project_open_gaps`. **Full wave-by-wave history → `plan-archive.md` + `lab-reports/lab-report-uqf-migration-playbook.md`.** Prereq lab report: `lab-report-quest-api-architecture.md`. See `project_quest_api`.

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
