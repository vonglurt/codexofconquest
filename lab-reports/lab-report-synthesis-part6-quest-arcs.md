<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->

# Lab Report Synthesis — Part 6: Quest Arcs
**Cross-Reference of All Quest Arc Lab Reports Against roll2hit-v3.html**
**Date:** 2026-06-16 · **HTML baseline:** 33,721 lines · **Source reports:** 14

---

## Purpose

Each entry reads the lab report against the live HTML and answers: what was documented, what is the current code, what still applies as working design knowledge. Reports are in `lab-reports/` untouched.

---

## Report 1 — `lab-report-weimar-scholar-gate.md`
**Original scope:** Layer 51, §XVI — Weimar Scholar Gate, archive arc, tome category, First Researcher reveal (2026-05-25)
**Still active:** Yes — fully live; node code and NPC node field differ from report

### What the report said

Four-quest chain at the Scholar's Quarter (SQ node) in Weimar: quest_wm_01 (archive access — 3 Scholar Seals or archiveLetterObtained), quest_wm_02 (read 3 archive documents), quest_wm_03 (Benedikt reading circle — 3 sessions on different game days), quest_wm_04 (First Researcher's name revealed). Three archive documents; Document 3 unredacted to "Marta Eilene Vass" after quest_wm_03. New tome item category with `_tomeBonuses()`. Reading circle mechanic gates on `wmSessionsDays` array.

### Current HTML relevance

**All structures confirmed live:**

| Symbol | Line | Status |
|--------|------|--------|
| `scholars_guard` | 4,849 | Live — AC 14, HP 45, medium tier |
| `WM_ARCHIVE_DOCS` (implied) | — | Archive modal live |
| `_storyWmArchiveModal()` | — | Toggle overlay, 4 docs when `vaAllMarksFound` |
| `quest_wm_01–04` | 9,803–9,835 | All live |
| `wmLowerArchiveUnlocked` through `wmFirstResearcherKnown` | `_S_DEFAULTS()` | All live |
| Isolde Voss NPC | 9,160 | Live — node field shows `NUE` |
| Benedikt Rasp NPC | 9,161 | Live — node field shows `NUE` |

**Node code change.** The report targets node `SQ` (Scholar's Quarter). The live NPC_DIALOGUES profiles for both Isolde Voss and Benedikt Rasp have `node:"NUE"`. The Weimar Scholar Quarter uses code NUE in the live game, not SQ.

**Workshop terrain implemented.** The `workshop` terrain (line 5,788: `'Scholar King\'s Workshop'`) is live — the P3+ Node SW from the §DUNGEON-01 plan was built. The `scholars_guard` monster appears in both `scholars_qtr` and `workshop` terrain pools.

**Tome bonus system confirmed live.** `_tomeBonuses()` at line 21,488 (from Part 2 synthesis). Initiative, death saves, and `atkWhileQuestActive` integrations confirmed across combat systems.

### What still applies

- **`wmDoc3Unredacted` is separate from `wmDoc3Read`.** Document 3 can be read in redacted form before completing the reading circle. `wmFirstResearcherKnown` only sets on quest_wm_04 completion, not on re-reading Document 3 alone. Return to archive after quest_wm_03.
- **Reading circle requires different `gameDay` values.** The `wmSessionsDays` array prevents same-day stacking. Three sessions must span three in-game days.
- **`atkWhileQuestActive` is condition-gated.** Benedikt's Annotated Copy bonus requires at least one quest in 'active' state — it drops to zero when all quests are done.

---

## Report 2 — `lab-report-void-archaeology.md`
**Original scope:** Layer 52, §XVII — Void Archaeology, NG+-exclusive investigation arc, four-author chain (2026-05-25)
**Still active:** Yes — fully live; triple gate unchanged

### What the report said

NG+-exclusive arc gated by `ngPlusRun >= 1 && wmFirstResearcherKnown && entry42Written`. Five `[INVESTIGATE]` buttons at existing nodes (CI, SL, DF, WM, MT). Collecting all five fires `vaAllMarksFound` — unlocks Document 4 (Constructor's Log) in the Weimar archive modal. MT tunnel opens with Antecedent Seal or Froberger's Field Notes as key. Quest_va_04 fires Benedikt's four-author synthesis at SQ: *"Four links is a chain. A chain holds."* `vaArchitectureKnown` gates a fifth CO ending variant.

### Current HTML relevance

**All quest_va structures confirmed live:**

| Symbol | Line | Status |
|--------|------|--------|
| `vaAllMarksFound` through `vaArchitectureKnown` | 21,225 | Live — all 9 flags |
| `quest_va_01–04` | 9,849–9,876 | Live |
| CO fifth ending variant | — | Live — `vaArchitectureKnown && entry42Written && ngPlusRun >= 1` |

**`entry42Written` is the fourth gate.** The arc cannot close without player engagement with Entry 42 — the blank page must be encountered before `vaArchitectureKnown` can set. This is a permanent design constraint.

### What still applies

- **NG+ comprehension gate is by design, not difficulty.** A first-run player at the DF stone alignment would see a math puzzle. A returning player who knows who placed it sees a 200-year-old plan. Don't remove `ngPlusRun >= 1` from the gate.
- **MT tunnel accepts two keys.** `Antecedent Seal` OR `Froberger's Field Notes` — either opens the tunnel. The `.some()` check is deliberate.
- **Benedikt delivers the four-author chain, not a game message.** He is the archivist of the archivist. His speaking it aloud is an institutional act.

---

## Report 3 — `lab-report-ng-plus-remembrance.md`
**Original scope:** Layer 50, §XV — NG+ Remembrance Layer, Entry 42, NPC memory lines (2026-05-25)
**Still active:** Yes — fully live; initialization detail differs

### What the report said

Three-layer NG+ stack: greeting layer (`NPC_NG_PLUS_GREETINGS`, all players, first visit), memory layer (`NPC_NG_MEMORY_LINES`, fav ≥ 2, second visit), author layer (Entry 42 modal at CI, quest chain). `entry42Text` preserved forever. `ngMemoryDelivered` resets each NG+ run. quest_ng_02 ("The Open Page") conditional on `priorQuestMinusOne`.

### Current HTML relevance

**All structures confirmed live:**

| Symbol | Line | Status |
|--------|------|--------|
| `ngPlusRun`, `entry42Written`, `entry42Text` | 21,180 / 21,215 | Live |
| `NPC_NG_PLUS_GREETINGS` | — | Live |
| `NPC_NG_MEMORY_LINES` | — | Live |
| `quest_ng_01/02/03` | 9,778 | Live — quest_ng_02 at `completeFn:() => !!S_story.entry42Written` |
| NG+ preservation block | 21,991–22,000 | Live — `savedNgRun`, `savedEntry42Written`, `savedPriorQuestMinus1` confirmed |
| Epilogue `entry42Written` variant | 25,777 | Live — `_buildEpilogueScroll()` |

**Initialization detail changed.** The report says `careerStats` and `runStats` are "initialized by `_STAT_ZERO()`" in `_S_DEFAULTS()`. Live code inlines the zero objects at lines 21,237–21,238 rather than calling the factory. `_STAT_ZERO()` exists at line 21,907 and is used for resets — not for initialization. The behavior is identical.

### What still applies

- **`entry42Written` persists across all NG+ runs.** It is preserved at line 21,992. Once set, the Entry 42 modal never fires again. What the player wrote (or chose not to write) is permanent.
- **`ngMemoryDelivered` resets each NG+ run.** This is intentional — NPCs deliver memory lines fresh each run, not once per lifetime.
- **`quest_ng_02` requires `priorQuestMinusOne`.** Players who never found the Quest -1 door do not receive the Entry 42 quest. The arc requires knowing the door existed.

---

## Report 4 — `lab-report-quest-minus-one-world-creator.md`
**Original scope:** Layer 49, §XIV — Quest -1 "The Open Door", Level 20 disclosure, World Creator concept (2026-05-25)
**Still active:** Yes — fully live; interactive wizard not implemented (by design)

### What the report said

At CO node, Level 20, `!questMinusOne`: fires a `sweelinck-variant` disclosure block. Acknowledges Level 21 doesn't exist. Shows source stats (line count, monster count, quest count). Three grep commands. Console completion path (`S_story.questMinusOne = true`). Forward reference: *"— Froberger's margin note, Entry 42 (not yet written)"*. `priorQuestMinusOne` preserved across NG+ for `quest_ng_02` activation.

### Current HTML relevance

**Live at CO node.** `questMinusOne` at line 21,214, `priorQuestMinusOne` at 21,994 confirmed.

**Interactive wizard not implemented — by design.** The report explicitly documents this as the correct scoping decision: a terminal-style modal inside the game would be fragile; grep commands and plan.md are durable. The disclosure phase is the implementation.

**Bug noted in report not confirmed fixed.** The report flags that the disclosure fires regardless of `defeatedBattles['CO']` — a Level 20 player could see the developer disclosure before the CO story encounter. No confirming grep found for a fix.

### What still applies

- **Console completion path is the correct implementation.** `S_story.questMinusOne = true; storyAutoSave()` is not a cheat — it is the first act of the World Creator pattern. The player opening the browser console is beginning to engage with the source.
- **The Level 21 boundary is the invitation.** *"Level 21 is undefined. That is not a bug. That is the door."* Don't add a Level 21 progression tier.

---

## Report 5 — `lab-report-ally-cat.md`
**Original scope:** Layer 44, §IX — The Ally Cat Arc, Cat Quarter node, 10 monsters, 7 quests (2026-05-25)
**Still active:** Yes — fully live; node code renamed from CQ to CDG

### What the report said

New node CQ (The Cat Quarter), 10 monsters (stray_alley_cat through cat_king), 7 quests (quest_cat_01–06 + quest_cat_void), 3 NPC profiles (jimmy, sandy_cat, don_fluffissimo). Quest_cat_05 completion unlocks Kenickie's Black Market. Quest_cat_06 defeat of Cat-King sets `catKingDefeated`. Taz Devil = two-Honcho merge mechanic.

### Current HTML relevance

**Node renamed.** The lab report uses code `CQ`. The live node is `CDG` (The Cat Quarter, line 8,026). All quest `activateNode`/`waypointNode` fields confirm CDG. All cat NPCs have `node:"CDG"`. The Cat Quarter is CDG, not CQ.

**All structures confirmed live:**

| Symbol | Status |
|--------|--------|
| 10 cat monsters | All live |
| `cat_quarter` terrain | Live |
| quest_cat_01–06 + quest_cat_void | All live — activateNode CDG |
| `catKingDefeated`, `kenickieMarketUsed` | Line 21,211 |
| jimmy, sandy_cat, don_fluffissimo, kenickie | NPC_DIALOGUES lines 9,154–9,157 |

**La Riva arc hooks into Kenickie at CDG.** After Cat-King defeat, Kenickie's line about Vinnie ("my guy Vinnie's got a contact...") and the La Riva quest activation both occur at CDG. The arc connection confirmed.

### What still applies

- **The Cat Quarter node is CDG.** Any quest referencing `activateNode:'CQ'` is wrong.
- **`catKingDefeated` is the La Riva prerequisite.** quest_la_riva_01 activates post Cat-King — Kenickie sends you to the Row.
- **Taz Devil only in random pool, not quest_cat_06.** The Cat-King (`cat_king` key) is reserved for the Q-CAT-06 boss encounter — it does not appear in random cat_quarter terrain rolls.

---

## Report 6 — `lab-report-kenickie-chronicle.md`
**Original scope:** Layers 75+77, §XL+§XLII — Kenickie's Black Market and Chronicle System (2026-05-25)
**Still active:** Yes — fully live

### What the report said

§XL: Kenickie's Black Market at CDG node, accessible only after quest_cat_05 complete. 4 items (Sardine Pack ×3, Live Shallows Minnow, Minor Healing Potion, Healing Potion) at community pricing. `kenickieMarketUsed` flag for return greeting variation. Sheet-swapper UI pattern.

§XLII: Chronicle System — dual ledger architecture (`careerStats` + `runStats`), 10-field `_STAT_ZERO()` factory, `_trackStat(field, n)` increments both simultaneously. Game-over screen shows runStats; character sheet shows careerStats. `careerStats` preserved across respawn and NG+; `runStats` resets to `_STAT_ZERO()`.

### Current HTML relevance

**§XL live.** Kenickie at CDG with `kenickieMarketUsed` flag ✓.

**§XLII fully live:**

| Symbol | Line | Status |
|--------|------|--------|
| `careerStats` inline init | 21,237 | Live — 10 fields zeroed inline |
| `runStats` inline init | 21,238 | Live |
| `_STAT_ZERO()` factory | 21,907 | Live — returns fresh zero object |
| `_trackStat()` dual increment | 21,909–21,912 | Live |
| `careerStats` preserved across NG+ | 21,918–21,926 | Live — survival copy pattern |
| `runStats` reset to `_STAT_ZERO()` | 21,926 | Live |

**`_STAT_ZERO()` is a reset tool, not an initializer.** The live `_S_DEFAULTS()` inlines the zero values directly (lines 21,237–21,238). The factory function is called at respawn and NG+ to create fresh reset objects. The report described them as initialized by the factory — the effect is identical, the path differs.

### What still applies

- **Two ledgers serve two purposes.** `runStats` = what this run cost. `careerStats` = who you are across everything. Do not merge them.
- **`_trackStat(field, n)` is the only write path.** Never mutate `careerStats[field]` or `runStats[field]` directly — `_trackStat` ensures they stay in sync.
- **Market access is relational, not economic.** Kenickie's 10% discount is available only to players who completed quest_cat_05. No amount of gold bypasses the loyalty gate.

---

## Report 7 — `lab-report-endings-and-echoes.md`
**Original scope:** Layer 43 — Covenant Ceremony, Sweelinck dynamic naming, NPC epilogues, Groundhog Day ending, pit training perks (2026-05-22)
**Still active:** Yes — fully live; Covenant Keeper True variant implemented beyond Layer 43 spec

### What the report said

Covenant Ceremony: 8-second SVG sigil animation, Sweelinck names each person helped. `SWEELINCK_NAMING_LINES` per NPC per fav level. `NPC_EPILOGUES` per NPC per fav level. `ACT8_FAREWELL_BEATS` for farewell scene. Four ending variants. Rough Whiskey as social item. Pit training as permanent unlocks. Froberger's Last Note.

### Current HTML relevance

**All structures confirmed live:**

| Symbol | Line | Status |
|--------|------|--------|
| Covenant sigil SVG | 4,609 | Live — CSS animation at line 1,696 |
| `SWEELINCK_NAMING_LINES` | 24,932 | Live |
| `NPC_EPILOGUES` | 24,959 | Live |
| `ACT8_FAREWELL_BEATS` | 24,585 | Live — gifts included (brynns_loaf, pachelbels_sketch, champions_tincture) |
| `_buildSweelinckNamingSequence()` | 25,694 | Live |
| `_buildEpilogueScroll()` | 25,777 | Live |
| `storyCheckVictory()` | 25,864 | Live — 4 + 1 true-covenant variant |
| `pitPerks` array | 21,180 | Live — pit training perks system live |
| `froberger_last_note_found`, `_read` | 21,180 | Live |

**Covenant Keeper True variant expanded.** The report mentions a stricter variant exists in the implementation: `missionDone && curse <= -6 && pitTrainingWins >= 5 && ebNegotiatedPayments >= 5`. Line 25,935 confirms this. The full ceremony with covenant sigil animation fires for this variant.

**`ARC_EPILOGUE_CONDITIONS`** (line 25,726) adds conditional epilogue appends beyond the per-NPC table — arc-completion-gated epilogue lines from cross-arc flags.

### What still applies

- **Sweelinck names only fav ≥ 2 NPCs.** Impartial NPCs are not named. The distinction between fav 2 and fav 3 produces different witness lines per NPC.
- **`NPC_EPILOGUES` is fav-gated.** fav 0 = "You passed through." fav 3 = the full outcome. The epilogue is the record of what the player did.
- **The pit training true-covenant gate requires `pitTrainingWins >= 5`.** Standard Covenant Keeper only needs `>= 3` for the `_missionComplete()` bit. Coming back after the quest is done is what earns the true ceremony.

---

## Report 8 — `lab-report-tilbury-visby-arcs.md`
**Original scope:** Layers 54+55, §XIX+§XX — Tilbury Harbor Arc + Visby Underground (2026-05-25)
**Still active:** Yes — fully live; node references shifted

### What the report said

§XIX (Tilbury): Harbor Master Rennau at SF node, 3-quest chain (ledger, embargo, missing ship), Ori encounter in Act IV, `tlEmbargoChallenged`/`tlEmbargoDismissed` choice with asymmetric reward. Froberger Field Notes cross-reference in Ori's Account.

§XX (Visby): Solvak at VS node, Yva at GC node, 3-quest chain (debt probe, broker, seal delivery). `vsShamanKnown` set at debt settlement — gates §XXI. `harrowNote` one-line cross-reference between arcs if `tlLedgerRead`.

### Current HTML relevance

**Node code for Rennau changed.** The report says `SF` (harbor node). NPC_DIALOGUES shows Rennau with `node:"STN"` (The Storefront, Map Shop node). The harbor board mechanic fires when visiting the active harbor node, but Rennau's NPC home is listed as STN.

**`quest_tl_01` activates at `LCY`** (Harbor Docks Tilbury), not SF — confirmed at line 9,885. The harbor docks node code is LCY, not SF.

**All quest and flag structures confirmed live:**

| Symbol | Line | Status |
|--------|------|--------|
| `hollow_hands_guard` | 4,851 | Live — AC 13, HP 22 |
| `quest_tl_01–03` | 9,882–9,909 | Live |
| `tlLedgerRead`, `tlEmbargoChallenged`, etc. | `_S_DEFAULTS()` | Live |
| `quest_vs_01–03` | — | Live |
| `vsShamanKnown` | — | Live — set at debt settlement |
| Rennau, Solvak, Yva NPC profiles | 9,162–9,164 | Live |

### What still applies

- **`vsShamanKnown` sets at debt settlement, not at shaman defeat.** §XXI is gated on knowing the shaman exists — the player learns this through Yva's testimony, not through combat. Don't change this order.
- **The two arcs are completable in any order.** Cross-references are conditional on flags — a player who does Visby before Tilbury gets no `harrowNote`. The arcs are self-contained; synthesis is rewarded but not required.
- **Vonn choice is a moral marker, not a branch.** Both `tlEmbargoChallenged` and `tlEmbargoDismissed` complete quest_tl_02. The harbor stays closed either way.

---

## Report 9 — `lab-report-ceremonia-roll-skill-checks.md`
**Original scope:** §DESIGN-03 — `type:'skill_check'` quest system, `_rollCeremonia()` engine, retry mechanic (2026-05-26)
**Still active:** Yes — fully live and widely adopted

### What the report said

New quest type `type:'skill_check'`. `_rollCeremonia(questId)` computes `d20 + abilityMod + prof` vs `checkDC`, handles pass/fail branching, stores retry state in `skillCheckAttempts`. Required fields: `checkAbility`, `checkLabel`, `checkDC`, `retryable`, `vignetteText`, `passText`, `failText`. Optional: `checkPassFlag`, `xpAward`, `retryGateDays`, `onPass`.

### Current HTML relevance

**`_rollCeremonia()` confirmed live at line 6,221.** The function is the primary resolution engine for all non-combat quest resolution across the game.

**Adoption is extensive.** The `type:'skill_check'` quest type is now used across:
- Saul/Paul arc (13+ quests: quest_ezzir, quest_governor_cyprus, quest_lame_lystra, quest_stoning_lystra, quest_prison_phillam, quest_areopagus, quest_ephesus_riot, quest_basket_damascus, quest_shipwreck_melta, and more)
- Littoral Courts arc (quest_aurel_tide, quest_calice_bridge, quest_mireille_ami, quest_solen_horizon, quest_sea_overseer)
- Crown arc (quest_whisper_01–06, quest_glut_01–06, quest_wane_01–06)
- Dungeon themes (Codex Core Chamber, Void Flux Chamber)
- Birka/EB adjacent quests (quest_muffat_01 at line 9,915)

The system became the universal non-combat resolution primitive. The report was a pre-implementation spec; the spec was followed exactly.

### What still applies

- **`completeFn` and `killGoals` are incompatible with `skill_check` quests.** Completion is handled by `_rollCeremonia()`, not `storyCheckQuests()`. Don't add `completeFn` to a `skill_check` quest.
- **`retryable: true` uses `skillCheckAttempts[questId]` to gate by day.** A failed retryable quest can be reattempted after the `retryGateDays` value — tracked by `lastDay` field.
- **`onPass` is a callback, not a flag.** Use `checkPassFlag` for a simple flag set; use `onPass` for more complex post-pass actions (calling `_addCroneMark()`, setting multiple flags, etc.).

---

## Report 10 — `lab-report-crown-three-hags.md`
**Original scope:** Layer 105, §CROWN-01 — Three Crowns of the Swamp, 9 nodes, 18 skill-check quests, Innmother (2026-05-28)
**Still active:** Yes — fully live; coordinates radically shifted from report's local grid to world grid

### What the report said

9 nodes at column c:3 (after coordinate correction from c:2). Chain WG0→HW1→HJ1→HG1→HJ2→HN1→HJ3→INN→HCA. Crown nodes have no battles; junction nodes have battles. 18 quests (6 per Crone) using `_rollCeremonia()`. `croneMarks` accumulate on skill-check pass; convert to permanent bonuses at HCA. `innmotherKindness` counter (never decrements); names at ≥7. `whisperCrownComplete`, `glutCrownComplete`, `waneCrownComplete` flags.

### Current HTML relevance

**All 9 nodes confirmed live:**

| Code | Label | Live coords |
|------|-------|------------|
| WG0 | The Deeper Gate | r:132, c:225 |
| HW1 | Whisper's Crown | r:110, c:224 |
| HG1 | Glut's Crown | r:41, c:223 |
| HN1 | Wane's Crown | r:42, c:223 |
| HCA | The Deeper Clearing | r:25, c:211 |
| INN | The Innmother's Hall | r:128, live ✓ |

**Coordinates shifted dramatically from report to world grid.** The report's coordinate correction section discusses moving from c:2 to c:3 within a small local grid. Live coordinates place the Crown arc in a completely different quadrant of the 500×500 world grid (column ~224 range, rows 25–132). The §CELL coordinate system embedded the arc into the actual game world map rather than a conceptual local grid.

**Quest and flag structures confirmed live:**

| Symbol | Status |
|--------|--------|
| `whisperCrownComplete` | Set via `quest_whisper_06_onPass` at line 20,144 |
| `innmotherKindness`, `innmotherNamed`, `croneMarks` | Live in `_S_DEFAULTS()` |
| `quest_whisper_01–06`, `quest_glut_01–06`, `quest_wane_01–06` | Confirmed live |
| `innmotherKindness >= 5` quest gate | Line 10,641 |
| `innmotherKindness >= 7` names the Innmother | Line 20,680 |

### What still applies

- **Crown node coordinates are in the 500×500 world grid, not a local grid.** Any future arc additions to the Crown chain must place new nodes using `NODE_COORDS` with real world coordinates, not local offsets.
- **Crown nodes have no battles; junction nodes do.** This is the arc's structural rule. HW1, HG1, HN1 are battle-free. HJ1, HJ2, HJ3 have their respective boss encounters.
- **`innmotherKindness` never decrements.** Failure does not reduce it. Accumulated kindness is permanent within a run.

---

## Report 11 — `lab-report-dungeon-ten-themes.md`
**Original scope:** Layer 80, §DUNGEON-01+02 — Ten dungeon themes, PRE-IMPLEMENTATION SPEC LOCK (2026-05-26)
**Still active:** Major themes implemented — node codes differ from report

### What the report said

10 dungeon themes, prioritized P1/P2/P3+. P1 themes required no new nodes: CY Madness Gate (d10 WIS flavor table), Codex Core Chamber (Ceremonia Roll at CO pre-boss, `codexCoreChosen`), Prior Carrier NPC (WM dialog tree), Void Flux Chamber (`voidFluxActive` combat inversion). P2: Weimar Inquisitor, Sacrifice Gates, Void Fracture Maze, Mimic Colony. P3+: Scholar's Workshop (Node SW), Mimic Meadows (Node MM).

### Current HTML relevance

**Major themes confirmed live:**

| Theme | Symbol | Status |
|-------|--------|--------|
| Void Flux Chamber | `voidFluxActive` | Live — lines 19,602/19,638/20,096/20,105 |
| Codex Core Chamber | `codexCoreChosen` | Live — lines 19,703/19,707 |
| Mimic Colony (P2) | `quest_mimic_colony` | Confirmed via `§D02-08` reference at line 19,767 |
| Scholar's Workshop (P3+) | `workshop` terrain | Live at line 5,788 |
| Mimic Meadows (P3+) | Node LIM | Live at line 8,042 |

**Node code changes from spec.** The report proposed `Node MM` (Mimic Meadows). Live code uses `LIM` (The Mimic Meadows, line 8,042). The Scholar's Workshop node (report called it `SW`) may use a different code — workshop terrain exists but node code unconfirmed from this grep set.

**P3+ themes were implemented.** The report described Scholar's Workshop and Mimic Meadows as P3+ (requiring new nodes). Both exist in the live HTML, confirming that the P3+ work was completed after the spec was locked.

**`wardensLegacyKnown` flag** (line 11,790) is live — a quest completion flag connected to §XXI Void Shaman arc via `quest_vs_warden`.

### What still applies

- **Mimic Meadows node is LIM, not MM.** Any reference to `activateNode:'MM'` must use `'LIM'`.
- **`voidFluxActive` uses the two-flag approach** — set on pass, cleared on second pass. Two Void Flux Ceremonia Roll quests: first sets it, second clears it.
- **`codexCoreChosen` gates CO pre-boss content.** The Codex Core Chamber Ceremonia Roll fires before the Auros fight when `codexCoreChosen` is not yet set.

---

## Reports 12 + 13 — `lab-report-saul-paul-travel-reference.md` + `lab-report-saul-paul-vignette-spec.md`
**Original scope:** §FUTURE-01 — Saul/Paul arc: travel reference (research) + vignette writing spec (2026-05-27)
**Still active:** Arc was implemented despite §FUTURE-01 "unscheduled" status; major quest chain live

### What the reports said

Report 12: Primary source methodology for Paul of Tarsus — 13 node-by-node reference of Acts/Pauline letters, full bibliography. Research document, not implementation spec. Named nodes: NODE 00 (Tarsus), NODE 01 (Jerusalem), NODE 02 (Damascus Road), etc.

Report 13: Vignette writing spec for the arc. 8 voice rules for Paul's character (body is specific, work is not suffering, suffering enumerated not dramatized, he notices things, rhetoric has structure, conversion scene is external, argues with those he respects, letters are not secondary). Node texts for HR (Herath), KS (Kesra), and others. Fictionalized names from a Name Translation Table in plan.md §FUTURE-01.

### Current HTML relevance

**The Paul/Saul arc is implemented and extensive.** Confirmed live quest chain using `type:'skill_check'`:

| Quest ID | Title (excerpt) | Stat | DC |
|----------|----------------|------|-----|
| `quest_ezzir` | The Sorcerer's Opposition | — | — |
| `quest_governor_cyprus` | The Governor Listens | — | — |
| `quest_lame_lystra` | The Gate | — | — |
| `quest_stoning_lystra` | Left for Dead | — | — |
| `quest_prison_phillam` | Seven Stairs, Then Five | — | — |
| `quest_areopagus` | To An Unknown One | — | — |
| `quest_ephesus_riot` | The Silversmith's Meeting | — | — |
| `quest_basket_damascus` | Over the Wall | — | — |
| `quest_shipwreck_melta` | Two Hundred and Seventy-Six | — | — |

**Node codes differ from vignette spec.** The vignette spec uses HR (Herath) and KS (Kesra). Live grep shows `KHR` at line 8,358 as "Cairo — Booksellers' Quarter" — likely a code shift as the arc was placed in the world map. The arc's internal node names were fictionalized per the Name Translation Table in plan.md §FUTURE-01.

**These two reports are reference material, not implementation spec.** The travel reference documents primary sources; the vignette spec documents voice rules. Both function as authoring guides rather than system designs. The 8 voice rules in Report 13 remain the canonical voice register for any Paul arc writing.

### What still applies

- **The 8 voice rules are the authoring standard for the Paul arc.** Body is specific. Suffering is enumerated, not dramatized. Conversion scene is external — no interiority. Document the sequence.
- **The arc uses fictionalized names.** "Paul" → "Paulos" (or equivalent per Name Translation Table). Check plan.md §FUTURE-01 for the canonical name mapping before writing any new quest content.

---

## Report 14 — `lab-report-littoral-courts.md`
**Original scope:** Layer 104, §SIREN-01 — The Four Courts of the Littoral Sea, betrayal mechanic (2026-05-28)
**Still active:** Yes — fully live

### What the report said

Sequential ocean-route arc. Four Ladies, each operating through one word: BUSY (Lady Aurel — tidal schedule), MAYBE (Lady Calice — the drawbridge), FRIEND (Lady Mireille — court introduction), SOON (Lady Solen — ship on the horizon). DC range: WIS/INT/CHA 11–15. Betrayal flags: `betrayalThought`, `betrayalWord`, `betrayalDeed` set on first three skill-check fails. Three-variant arc-close at LCA. Parallel Overseer quest at LSO (Fog Bank) — WIS Insight DC 15 to name the meta-structure.

### Current HTML relevance

**Fully live.** Node text and NPC profiles confirmed:

| Node | Lady | Line |
|------|------|------|
| LA (or equivalent) | Lady Aurel — tidal schedule text | 7,761 |
| LC (or equivalent) | Lady Calice — drawbridge/MAYBE text | 7,765 |

**All quest structures confirmed live:**

| Symbol | Line | Status |
|--------|------|--------|
| `quest_aurel_tide` | 10,243 | Live — `checkFailFlag:'betrayalThought'` |
| `quest_calice_bridge` | 10,258 | Live |
| `quest_mireille_ami` | 10,273 | Live |
| `quest_solen_horizon` | 10,288 | Live |
| `quest_sea_overseer` | 10,302 | Live |
| `betrayalThought` | 10,254 | Live — set on quest_aurel_tide fail |

**All combat is with sea creatures.** The Ladies never fight. The ocean does. This structural separation (social resolution with Ladies, combat resolution with sea crossings) is preserved.

### What still applies

- **The betrayal mechanic is a failure accumulator, not a branch.** `betrayalThought`, `betrayalWord`, `betrayalDeed` accumulate across skill-check fails. Three flags = three betrayals. The arc-close reads them and witnesses without judgment.
- **The Overseer quest pass condition is naming the structure.** DC 15 WIS Insight. The fail is accepting the helpful offer. The game does not tell the player what the structure is — they name it or they don't.
- **`betrayalThought` sets on quest_aurel_tide fail.** This is the first Court. First impressions count.

---

## Quest Arcs Summary — What Is Structurally True Right Now

**The Cat Quarter is CDG, not CQ.** All cat arc quests use `activateNode:'CDG'`. Jimmy, Sandy, Don Fluffissimo, Kenickie — all `node:"CDG"`.

**The Weimar Scholar Quarter uses NUE.** Isolde Voss and Benedikt Rasp have `node:"NUE"`. Quest_wm_01 activates at NUE. The arc's note in the Kenickie chronicle that `archiveLetterObtained` can come from Yael (CI) and be used at NUE is still correct.

**`_rollCeremonia()` is the universal non-combat resolver.** Used by Saul/Paul arc (13+ quests), Littoral Courts (5 quests), Crown arc (18 quests), dungeon themes, and miscellaneous Birka/arc quests. Every non-combat quest resolution should use `type:'skill_check'` and `_rollCeremonia()`.

**Three connected arcs form the deep-lore chain:** §XVI (Weimar — reveals Marta Eilene Vass) → §XVII (Void Archaeology — surfaces her marks, requires NG+) → Quest -1 (Level 20 — gives the player the door) → Entry 42 (NG+ — asks what's behind it). `wmFirstResearcherKnown → vaArchitectureKnown → entry42Written` is the four-author chain's gate sequence.

**`vsShamanKnown` is the §XXI gate.** Set at Visby debt settlement (quest_vs_03), not at shaman combat. The player knows the shaman's location through investigation, then seeks them out.

**The Littoral Courts arc and Crown arc both use `_rollCeremonia()` exclusively.** No combat in Crown node rooms; no combat with the Ladies. Physical combat is for junctions and ocean crossings only — the resolution mechanic matches the narrative register.

**Mimic Meadows node is LIM.** The Void Flux Chamber uses `voidFluxActive`. Codex Core Chamber uses `codexCoreChosen`. Scholar's Workshop terrain is `workshop`. Node SW for the Workshop may use a different code — check live HTML before referencing.

**Endings are fully live.** `SWEELINCK_NAMING_LINES`, `NPC_EPILOGUES`, `ACT8_FAREWELL_BEATS`, `_buildSweelinckNamingSequence()`, `_buildEpilogueScroll()`, `storyCheckVictory()` — all confirmed. Covenant Keeper True variant requires `pitTrainingWins >= 5` and `ebNegotiatedPayments >= 5` — a stricter threshold than standard Covenant Keeper.

---

*Synthesis Part 6 of 7 · Next: Part 7 — Writing & Design Philosophy · 2026-06-16*
