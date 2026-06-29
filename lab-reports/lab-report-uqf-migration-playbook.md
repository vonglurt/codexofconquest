<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->

# Lab Report: UQF Migration Playbook & Full-Migration Plan
**Document ID:** §ARCH-01 (Phase 3 companion)
**Status:** Active — pilot arc complete, full plan set
**Date:** 2026-06-28
**Scope:** roll2hit-v3.html — migrating all 284 QUEST_DB entries from legacy
formats to Universal Quest Format (UQF v1.0)

---

## 1. Success report — what is done

§ARCH-01 Phases 1–3 are live and the **first arc (§WISDOM-01) is 100 % UQF**:

| Phase | Result | Commit |
|-------|--------|--------|
| Phase 1 | Inert UQF runtime (`SCHEMA_VERSION`, `BIT_CONTRACTS`, `validateQuest`, `adaptLegacyQuest`, `QuestRuntime`) | `80bc1f4` |
| Phase 2 | Dual-path dispatch — `_rollCeremonia` → `QuestRuntime` for `schema:'UQF-1.0'`; panel/sheet render UQF; gate-gated activation | `f5117ca` |
| Phase 3a | First quest migrated (`quest_wis_01`) + `mission_bit` bit kind + `passText` parity | `d7505ff` |
| Phase 3b | `quest_wis_02`–`05` migrated (rest of the skill-checks) | `014fd00` |
| Phase 3c | Declarative completion path (`canComplete`) + `wis_00/06/07` migrated → arc 100 % UQF | `fcd1e37` |
| Wave 1a | Wane's Crown (`quest_wane_01`–`06`) + `gate.questsAttempted`/`questsDone` terms; `onPass` closure preserved via `_legacy_fn` | `24becb6` |
| Wave 1b | Whisper's Crown (`quest_whisper_01`–`06`); first Wave-1 `side` quest (`whisper_05`: `completeFn`→`completion` gate, `onComplete` kept as live hook); flaky-FAIL-test fix | `7b69ce7` |
| Wave 1c | Glut's Crown (`quest_glut_01`–`06`); `side` quest with a **flag** activation gate + multi-effect `onComplete` (inventory splice + crown flag). All 3 crone Crowns now 100% UQF. | `ee58181` |
| Wave 1d | Ceremonia: Yael arc (`quest_ceremonia_yael_01`–`05`); + `gate.favorMin` term, `checkFailFlag`→`onFail:[mission_bit]`, vignetteTextAlt render parity fix | `c164fe2` |
| Wave 1e | §1367 skill-checks (4 of 6: `e_wycliffe`/`b_tamerlane`/`c_ottoman`/`d_hansa`); clamped faction/faith track counters via `_legacy_fn`; first real `onFail` track effect (`d_hansa`) | `e98feb7` |
| Wave 1f | Ceremonia d0207 arc (5 acts, first full d02xx arc); + `gate.battles` term, `notFlags`/flag/battle completion patterns | `e8f7d59` |
| Wave 1g | d0201+d0205+d0209 (3 full d02xx arcs, 15 quests) via **codemod**; onFail closures, reward.gold, side onComplete; zero engine changes | `7583772` |
| Wave 1h | d0204+d0206+d0208+d0210 (final 4 d02xx arcs, 20 quests) via codemod #2 → **d02xx 40/40**; + `gate.shardsMin`/`notBattles`/`restedAtMin` + `completion.questsComplete`; **deliberate bug-fix** (dead completeItems → reward.items) | `58e598f` |
| Wave 1i | Innmother skill-checks (`quest_inn_02`/`03`/`04`) — first **non-d02** Wave-1 arc; + `gate.sleptAt` term; `onPass:()=>_innKindness(1)` via `_legacy_fn`; side quests stay legacy | `527692c` |
| §SKILLFIX-01 | **Game-wide bug-fix** (user-approved): `_rollCeremonia` read only `checkAbility`/`checkLabel`, but **2443** skill_checks use `checkStat`/`checkSkill` → rolled with **+0 ability mod** + "undefined" label. Aliased `checkAbility\|\|checkStat` / `checkLabel\|\|checkSkill` at all 4 read sites. Makes every `checkStat`→UQF migration **pure-parity**. | `662ee99` |
| Wave 1j | Spark: the Harmony Chain (`quest_spark_01–05`) — first arc on the §SKILLFIX-01 pure-parity footing. 3 skill_checks (01 CHA Persuasion DC10 retryable, 03 WIS Medicine DC13, 04 INT Investigation DC14) + 2 side (02/05). `checkPassFlag`→`mission_bit` (03/04 no `bitLabel` → `_flagToLabel` fallback); rich onPass closures (gold/xp/items/knowledge/msg) kept whole via `_legacy_fn`; spark_01 onFail (hp−1) via `_legacy_fn`. Side 02/05: gate←activateCond (05 = 2-flag AND), completion←completeFn, onComplete kept verbatim. **Zero engine changes.** | `a06772d` |
| Wave 1k | Spark2: the Dunfall Harmony Chain (`quest_spark2_01–05`) — Bram/Oat/Fehn arc at DNF. 2 skill_checks (02 WIS Animal Handling DC11 retryable, 04 INT Nature DC12 **non-retryable**) + 3 side (01/03/05). `checkPassFlag`→`mission_bit{flag}` (no label); onPass closures via `_legacy_fn` (04 splices Oat's Harbor Bead → Dunfall Drift Spore); both keep onFail msg, 04's non-retryable FAIL runs msg then locks. Side 01/03/05 are **pure hook/waypoint gates, NO onComplete** → structural gate/completion only. **Zero engine changes.** | `d9f2d1e` |
| Wave 1l | Codex Inquisitor gauntlet (`quest_inquisitor_handshake`/`questions`/`final`) at NUE — `checkAbility`/`checkLabel` quests (the ~30 that worked pre-§SKILLFIX-01) → pure parity. **Fully decomposed** (no onPass `_legacy_fn`): `checkPassFlag`→`mission_bit{flag}` (no label), `xpAward`→`reward{xp}` (50/75/200), final's item-push → `reward{items:[Archive Key]}`. Only `questions` keeps `onFail:[_legacy_fn]` (hp−10 psychic). Chained flag gates; `retryGateDays` 0/0/1 top-level. The §D01-02 NUE handshake button dispatches transparently. **Zero engine changes.** | `255060c` |
| Wave 1m | Sea: The Warmth Calm (`quest_sea_01/02/03`) — Deep Warmth Eel arc (SEN→NWI). 2 skill_checks (02 INT Investigation DC13, 03 WIS Nature DC14) pure-parity via `mission_bit{flag}`+`_legacy_fn` (03 grants `pirateCrew_allied` + Joint Pirate Debt Note). **New engine term `completion.atNode`** (`S_story.currentCode === code`) ← `completeFn:()=>currentCode==='NWI'`, for waypoint-arrival side quests. sea_01 `onComplete` kept verbatim. | `1c636ab` |
| Wave 1n | Naval Intercept branch (`quest_sb_01`/`fight`/`parley`/`examine`) — Captain Keel's role-choice intercept at GCI. **New engine term `gate.flagEquals`** (`{field:value}` strict equality) ← `sbChosenRole === 'fight'/'parley'/'examine'`. parley/examine `retryable:false` skill_checks; onFail `_legacy_fn` flips `sbChosenRole`→'fight' (branch fallthrough → sb_fight activates). ⚠ **Latent +800xp double-count in sb_fight** (onComplete +400 ∧ xpAward:400) preserved verbatim, flagged for later fix. | `869dc09` |
| Wave 1o | Lake/Relay Monster Hunt (`quest_hunt_01–04` + `quest_hunt2_01–04`, 8 quests) — 2 identical investigate→clear arcs (hunt2 Night Hag WRO→BNX; hunt drowners HFT→VAW). Hook side (gate:{}) + 2 `retryable:false` checkStat skill_checks (`mission_bit{flag}` no-label + onPass/onFail `_legacy_fn`) + lair-clear side (battle completion + verbatim onComplete). Zero engine changes. ⚠ hunt_04/hunt2_04 share the sb_fight double-count (+1000/+1200xp), preserved. | `df36c93` |
| Wave 1p | Bilge Mystery (§WHODUNIT-01, `quest_bilge_01–04`) — same investigate→clear shape as the hunt arcs (SEN). Hook side (flag gate) + 2 `retryable:false` checkStat skill_checks (02 INT Investigation DC12, 03 WIS Insight DC13; `mission_bit{flag}` no-label + onPass/onFail `_legacy_fn`) + lair-clear side (battle completion `MS_BILGE` + verbatim onComplete). Zero engine changes. ⚠ bilge_04 shares the double-count (+1200xp), preserved. | `54e0130` |
| Wave 1q | The Personal Legend (§ALCHEMY-01, `quest_alch_01–07`) — Roen's pilgrimage (Coelho's Alchemist retold). **5 structural waypoint side quests** (01/02/03/06/07 — flag-chained gate + completion, NO onComplete) + 2 retryable checkStat skill_checks (04 CHA Persuasion DC11, 05 WIS Insight DC12; `mission_bit{flag}` no-label + onPass/onFail `_legacy_fn`). Arc's terminal `personalLegendComplete` gates the wis arc. Zero engine changes. | `23ba7b5` |
| Wave 1r | The Scar (§SCAR-01 Gret Orrens, `quest_scar_01–04`) — **checkAbility** quests (pure parity), **no checkPassFlag** (closures set flags → `_legacy_fn`; `xpAward`→`reward{xp}`). scar_03 is a moral **branch** (onPass `gretChoice='help'`, onFail `gretChoice='refuse'`; `retryable:false` → locks 'failed' but both paths progress, since scar_04 gates on `gretChoice` truthy). scar_04 (side) keeps its `itemChain` (Scar's Light + Orrens Manuscript) + `xpAward:350` + the per-id WIS handler (all schema-agnostic); completion = `flags:['gretChoice']` ∧ `atNode:'NUE'` (reuses the Wave-1m atNode term). `reward:500` dead/display-only, kept. Zero engine changes. | `ac9ef23` |
| Wave 1s | The Four Courts of the Littoral Sea (§SIREN-01, `quest_aurel_tide`/`calice_bridge`/`mireille_ami`/`solen_horizon`/`sea_overseer`) — first **Wave-1 singleton cluster** (the four-courts sea-betrayal chain that `sea_overseer` culminates, LC1–LC4 + LSO). 5 `checkAbility` skill_checks, all `retryable:false`, **pure parity, fully decomposed** (no onPass closures existed): `checkPassFlag`→onPass `mission_bit{flag,label}` + `xpAward`→`reward`; **`checkFailFlag`→onFail `mission_bit` with the SAME `bitLabel`** (mirrors legacy `_grantMissionBit(failFlag, q.bitLabel)`; safe ∵ non-retryable ⇒ fail flag grants once). `solen_horizon` had no `checkFailFlag` → `onFail:[]` (a simple skill_check mid-arc, folded in for whole-arc coherence). Pass/fail flags read directly by the LC1–LC4/LSO NPC quoteFns + the LJ3/betrayalCount blocks → `mission_bit` sets flag + token identically. Zero engine changes. +4 tests. | `a1b67db` |
| Wave 1t | Biblical singletons (`quest_stoning_lystra` KYA, `quest_basket_damascus` DAM) — closes the Acts/Pauline Wave-1 cluster. Both **checkAbility** STR Athletics. **stoning** (`retryable:false`): **SHARED pass/fail flag** `stoningEvent` (bitLabel 'Lystra Stoning') — the same `mission_bit` grants on BOTH onPass and onFail; the legacy `onFail` hp→1 closure rides as a `_legacy_fn` ordered **before** the bit (mirrors legacy `onFail()`-then-`_grantMissionBit`); gate `{questsDone:['quest_lame_lystra']}`. **basket** (`retryable:true`, `retryGateDays:1` kept): onPass **fully decomposed** into TWO `mission_bit`s (`escapedDamascus` 'Damascus Escape' + the `_grantMissionBit('basketRopeComplete','Basket Rope')` closure → a second mission_bit, same order) + `reward{xp:150}`; `onFail:[]` (retryable ⇒ no terminal fail flag); gate `{flags:['anathSightRestored']}`. Both quests' flags read directly by the LT render block + the KYA HP cap — token-grant identical. Zero engine changes. +6 tests. | `2c0359b` |
| Wave 1u | Atlantean iodine chain (`quest_iodine_01` INN, `quest_shore_02` DS1, `quest_forge_01` DSF, `quest_sunken_01` DA1) — the four §CROWN-01 iodine-reduction skill_checks. All **retryable:true**, **no checkPassFlag/checkFailFlag**. Each has a rich onPass closure (item push / gold / `S_story.knowledge` / `storyMsg` + flag set — `kelpBedsCharted`/`forgeActivated`/`inscriptionRead`) that resists clean decomposition → **kept verbatim as a single `_legacy_fn`**, ordered **after** `reward{xp}` (mirrors legacy `xpAward`-then-`onPass()`; the `reward` handler does `xp+=…; _checkLevelUp()` byte-for-byte). No onFail closures → `onFail:[]`. `activateCond` → gate: iodine_01 `{questsAttempted:['quest_inn_01']}`, forge_01 `{flags:['atlanteanProcessKnown']}`, shore_02/sunken_01 `() => true` → `{}`. The side acts (iodine_02/03, shore_01, forge_02, sunken_02) stay legacy on the onComplete path — only the skill_checks migrate. Zero engine changes. +4 tests. | `d84c87b` |
| Wave 1v | **Closes Wave 1.** Final singletons — Highland trade (`quest_df_02` DNF, `quest_sk_02` MME) + folk wisdom (`quest_lxvii67` HKG, `quest_guide_04` SSJ). **Highland** (both `retryable:true`, **checkStat**): `checkPassFlag` → onPass `mission_bit` with **NO explicit label** (so `_grantMissionBit(flag, undefined)` falls through to `_flagToLabel` — byte-for-byte with legacy `q.bitLabel===undefined`), ordered **before** the rich gold/xp/item/storyMsg closure kept as a single `_legacy_fn` (xpAward was 0 — all reward lives in the closure); fail storyMsg → `onFail:[_legacy_fn]`; gates `{flags:['dunfallAccessed']}` / `{flags:['saltwickAccessed']}`. **Folk** (both `retryable:true`, **checkAbility**): no checkPassFlag ⇒ legacy granted no token, so the simple onPass flag-set (`faith_folk` Math.min++ / `emmerStage4a=true`) rides as a `_legacy_fn` (NOT a mission_bit) after `reward{xp}`; `onFail:[]`. `guide_04` gate → `{questsDone:['quest_guide_03']}`; **`lxvii67`'s `faith_folk>=1` gate is inexpressible in canActivate's term set** ⇒ `gate:{_legacyFn:true}` (canActivate returns permissive) **keeps `activateCond` load-bearing** at the activation site. Zero engine changes. +8 tests. | `cdc788f` |
| **Wave 2 begins** | Script-assisted bulk migration via **`scripts/uqf-bulk-migrate.js`** (deterministic, safe-by-construction: never re-serializes narrative strings — only deletes the scalar legacy `check*`/`xpAward`/`goldAward`/`bitLabel` fields, decomposes the trivial `() => !!S_story.<flag>` activateCond → `gate:{flags:[…]}` (any other activateCond kept verbatim behind `gate:{_legacyFn:true}`), and inserts `schema/gate/bits` after the `type:"skill_check",` token). **Landscape:** 2350 well-formed legacy skill_checks remain (post-Wave-1) — **0 still carry onPass/onFail closures** (Wave 1 cleared them all); dominant shape = `checkPassFlag` (2242, of which 2234 have NO bitLabel → `_flagToLabel` parity), only 11 xpAward / 3 goldAward / **0 fail-flags**. Migration verified per-family against a **pre-migration golden capture** (legacy resolution + verbatim display fields) re-run post-migration for byte-for-byte parity. | — |
| Wave 2a | First family: **`hav_*`** (The Articles corsair-papers arcs — 30 acts, nodes CHI/RHD/…). Perfectly uniform: all `checkStat`, all `checkPassFlag` (no bitLabel, no xp/gold), non-retryable; **every activateCond is `() => !!S_story.<flag>`** → all gates decomposed to `gate:{flags:[priorActPassFlag]}` (6 act1 openers → `gate:{}`), giving clean sequential-chain activation. `onPass:[mission_bit{flag}]`, `onFail:[]`. Display fields byte-identical vs golden; pass→done+flag+`_flagToLabel` token, fail→failed (non-retryable). Zero engine changes. +4 tests (self-contained: enumerates the family from QUEST_DB). | `ae4f6de` |
| Wave 2b | Largest single family: **`ada*`** (235 acts — the biggest legacy skill_check family, nodes WM/TBZ/TRB/…). Maximally uniform: all `checkStat` (5 distinct stats), all `checkPassFlag` (no bitLabel/xp/gold), non-retryable, and **no activateCond on any act** → all `gate:{}` (independently activatable, matching legacy). Confirms the migrator scales to a large family in one pass: 235/235 verified byte-for-byte vs golden (structure + verbatim display fields + pass/fail resolution). `onPass:[mission_bit{flag}]`, `onFail:[]`. Zero engine changes. +2 tests (one asserts structure+gate:{} across all 235; one runs full pass/fail parity across all 235). | `8cf47e9` |
| Wave 2c | **`ath*`** (113 acts — Trojan-cycle `ath_c1a*` chapters + `ath_NN_act*` arcs). Mixed gates: 72 `gate:{}` + 41 trivial `()=>!!S_story.<priorFlag>` → `gate:{flags:[…]}`. **Surfaced + fixed a latent crash + hardened the migrator:** (1) `trivialGateFlag` required a trailing comma → missed trivial gates that are the literal's LAST field (no comma, `}`-terminated); widened lookahead to `(?=[,}])`. (2) ~3 acts (`ath_c1a2/c1a4/c1a5`) carried a **duplicate `activateCond`** — the real function form PLUS a dead string copy `activateCond:"() => …"`; JS last-key-wins made the parsed value a STRING, so the legacy activation site `q.activateCond()` **threw a TypeError at runtime** (live crash on those nodes). Migrator now strips BOTH forms (`/g` + optional `"?`) and decomposes the intended gate, with a hard post-condition (`throw` if any `activateCond` survives a decompose) → the migration **fixes** the crash, faithful to the function form's intent. `type:"hybrid"` members (e.g. `ath_c1a3`) are correctly skipped (skill_check-only scope; their duplicate-key bug is pre-existing, untouched — ~33 string-form activateConds remain file-wide in not-yet-migrated families + hybrids). Verified vs golden (display + pass/fail) **plus** gate behavior (`canActivate` true iff flag set) + a no-residual-`activateCond` invariant. +2 tests. | `10a0d05` |
| Wave 2d | **`lis*`** (89 acts — Lisbon Camões water-stained-quire authentication arcs; two naming conventions: `lis_NN_actN` 6 arcs × 4 + `lisNN_actN` 13 arcs × 5). Mixed gates: 71 `gate:{}` + 18 trivial `()=>!!S_story.<priorFlag>` → `gate:{flags:[…]}` (the 6 `lis_NN` arcs' act2–4 chains; the 13 `lisNN` arcs carry no activateCond). All `checkStat`, all `checkPassFlag` (no bitLabel/xp/gold), non-retryable, no `_legacyFn`. **First explicitly-documented UPPERCASE-checkStat family** (CHA/INT/STR/WIS): the legacy resolver reads `abilityScores[q.checkStat]` **raw-case** while `abilityScores` keys are lowercase ⇒ legacy silently applied a **+0** ability modifier (the §SKILLFIX-01 latent bug). The UQF `_rollSkill` lowercases ⇒ applies the **real** modifier. So migration realizes the §SKILLFIX-01 fix for this family (the intended baseline; same situation as the already-migrated uppercase `hav_*`). Parity verified vs a golden seeded under **both** stat cases (drives a deterministic extreme through either resolver) — structure + verbatim display + pass/fail resolution + gate behavior, no residual `activateCond`, no `pageerror`. `onPass:[mission_bit{flag}]`, `onFail:[]`. Zero engine changes. +2 tests. | `2529bb0` |
| Wave 2e | **`zth*`** (75 acts — Zürich arcs: `zthNN_actN` 11 arcs × 5 + `zth_NN_actN` 4 arcs × 4 + 4 `zth_c1a*` singletons). Mixed gates: 60 `gate:{}` + 15 trivial `()=>!!S_story.<priorFlag>` → `gate:{flags:[…]}`. All `checkStat`, all `checkPassFlag` (no bitLabel/xp/gold), non-retryable, no `_legacyFn`. **Second UPPERCASE-checkStat family** (CHA/CON/INT/STR/WIS — same §SKILLFIX-01 raw-case-read situation as `lis`, handled identically: golden seeded under both stat cases). The migrator correctly **skips the non-skill_check members** — `zth_c1a3` (`type:"hybrid"`) and the `zth_08/09/10/11_act5` (`type:"delivery"`) — confirming `--prefix` scopes by id but the transform is type-gated. Verified vs golden (structure + verbatim display + pass/fail + gate behavior), no residual `activateCond`, no `pageerror`. `onPass:[mission_bit{flag}]`, `onFail:[]`. Zero engine changes. +2 tests. | `32b92b8` |
| Wave 2f | **`flr*`** (71 acts — Florence arcs: `flrNN_actN` 11 arcs × 5 + `flr_NN_actN` 4 arcs × 4; no c1a singletons / no hybrid this family). Mixed gates: 59 `gate:{}` + 12 trivial `()=>!!S_story.<priorFlag>` → `gate:{flags:[…]}`. All `checkStat`, all `checkPassFlag` (no bitLabel/xp/gold), non-retryable, no `_legacyFn`. **Third UPPERCASE-checkStat family** (CHA/INT/STR/WIS — same §SKILLFIX-01 raw-case-read situation as `lis`/`zth`, handled identically: golden seeded under both stat cases). The 4 `flr_NN_act5` (`type:"delivery"`) are type-gated out by the transform. Verified vs golden (structure + verbatim display + pass/fail + gate behavior), no residual `activateCond`, no `pageerror`. `onPass:[mission_bit{flag}]`, `onFail:[]`. Zero engine changes. +2 tests. | `795cf2a` |
| Wave 2g | **`hft_*`** (50 acts — Hanseatic-trade arcs). **First MIXED-shape bulk family:** 35 acts (hft_01–07) carry a `checkPassFlag` → `onPass:[mission_bit{flag}]`; **15 acts (hft_08–11) have NO `checkPassFlag`** → `onPass:[]` (legacy pass→done granted nothing — the migrator's `passFlag ? mission_bit : null` + `filter(Boolean)` reproduces that byte-for-byte). Mixed gates: 22 `gate:{}` + 28 trivial `()=>!!S_story.<priorFlag>` → `gate:{flags:[…]}`. **Fourth UPPERCASE-checkStat family** (CHA/CON/INT/STR/WIS — same §SKILLFIX-01 raw-case-read situation, golden seeded under both stat cases). The transform type-gates out the non-skill_check members: `hft_10_act3` (`type:"combat"`) + 4 `*_act5` (`type:"delivery"`). Verified vs golden (structure handles both onPass shapes + verbatim display + pass/fail + gate behavior), no residual `activateCond`, no `pageerror`. Zero engine changes. +2 tests (assert the 35/15 mission_bit/empty split + 28/22 gate split). | `b689956` |
| Wave 2h | **`rkv_*`** (50 acts — Reykjavík/northern arcs). **Structural twin of `hft_`:** same mixed shape (35 flag-bearing → `onPass:[mission_bit{flag}]`, 15 flagless rkv_08–11 → `onPass:[]`), same gate split (22 `gate:{}` + 28 `gate:{flags:[…]}`), same type-skips (rkv_10_act3 combat + 4 deliveries). **Fifth UPPERCASE-checkStat family** (CHA/CON/DEX/INT/STR/WIS — first to include DEX; golden seeded under both stat cases). Verified vs golden (struct handles both onPass shapes + verbatim display + pass/fail + gate behavior), no residual `activateCond`, no `pageerror`. Zero engine changes. +2 tests. | `fdf3e0f` |
| §SKILLFIX-02 | **Migrator enhancement + game-wide bug-fix (user-approved 2026-06-29).** ~176 legacy skill_checks put a D&D **skill name** (Persuasion ×60, History ×26, Insight ×24, Deception, Stealth, Investigation, Perception, Athletics, Nature, Survival, Religion…) or a full ability word (Strength, Wisdom) in `checkStat` instead of an ability abbrev. Legacy read `abilityScores[checkStat]` → undefined → **+0 ability mod** (a latent bug §SKILLFIX-01 didn't reach; the UQF contract also **requires** `stat∈{STR,DEX,CON,INT,WIS,CHA}` → these would migrate to **invalid** quests). Fix: the bulk migrator now maps the skill → its governing ability (D&D 5e standard; homebrew **Courage/Presence → CHA**) into `stat`, keeping the skill name in `skill` (display + proficiency). Deliberate **behavior change** — the check now rolls the mapped ability mod + proficiency (intended D&D behavior). Parity protocol for these families shifts: assert **display untouched + structure + correct mapping**, NOT vs the buggy +0 legacy roll. | (with Wave 2i) |
| Wave 2i | **`ist_*`** (48 acts — Constantinople `ist_cNaM` chapters; **first §SKILLFIX-02 family**). 32 of 48 carry a mapped skill name (Persuasion→CHA, History→INT, Insight→WIS, Deception→CHA, Investigation→INT, Religion→INT) + Strength→STR (ability word); 16 already ability-abbrev. All flag-bearing → `onPass:[mission_bit{flag}]`. Gates: 38 `gate:{}` + 10 `gate:{flags:[…]}`. Type-skips: ist_c9a4/ist_c10a4 (`type:"combat"`). All 48 now `validateQuest`-valid (were invalid pre-fix). Verified: display deep-equal golden + mapping correct vs legacy checkStat + NEW behavior deterministic (mapped-ability extreme → pass/fail) + gate behavior, no `pageerror`. +2 tests. | `fc040cd` |
| Wave 2j | **`rix_*`** (47 acts — Egil's Saga: the York court + Iceland/Althing cycles, nodes YRK/ISL). **Structural twin of `rkv_`/`hft_`** (mixed flag/flagless): 33 acts carry a `checkPassFlag` → `onPass:[mission_bit{flag}]`; **14 acts (notably the `rix_11` Sonatorrek cycle) have NO `checkPassFlag`** → `onPass:[]` (legacy pass→done granted nothing — reproduced byte-for-byte). Mixed gates: 21 `gate:{}` + 26 trivial `()=>!!S_story.<priorFlag>` → `gate:{flags:[…]}`. **Sixth UPPERCASE-checkStat family** (CHA/CON/DEX/INT/STR/WIS; golden seeded under both stat cases). **NO §SKILLFIX-02** (0 skill-name checkStats — `skill→ability mapped 0`). The transform type-gates out the 8 non-skill_check members (combat `rix_01/03_act3` + the delivery acts incl. `rix_11_act5`). Verified vs golden (struct handles both onPass shapes + verbatim display + pass/fail + gate behavior), no residual `activateCond`, no `pageerror`. Zero engine changes. +2 tests. | `_this commit_` |

**Proven properties:**
- **Behavior parity** — every migrated quest produces byte-identical state
  (status, flags, mission-bit tokens, xp/gold, knowledge entries) to the
  legacy closures, verified by 22 Playwright tests.
- **Zero legacy regression** — every UQF branch is guarded by
  `schema === 'UQF-1.0'`; the legacy `_rollCeremonia` / `completeFn` path is
  byte-for-byte unchanged for the other 276 quests. `check:walk` +
  navigation/debug/autosave/worldbuilder-quest-editor (28) stay green
  throughout.
- **Engine generality** — each migration that hit a gap produced a *reusable*
  primitive, never a one-off: the `mission_bit` bit kind, the `battles` gate
  term, the compound completion gate (which resolved lab Open-Q #5 — compound
  AND/OR — **without** a boolean-expression language).

### Quest landscape (measured 2026-06-28 — **CORRECTED**)

> ⚠ The first pass of this report cited "284 quests / 113 skill_check." That came
> from a survey that under-counted by ~9×. A reproducible **brace-walker** scan
> (walk top-level `^  key: {` entries, balance braces to the matching close)
> gives the true figures below. Treat the originals as void.

```
TOTAL 2515  |  UQF 14 (§WISDOM-01 ×8 + Wane ×6)  |  remaining ~2501
By type:  skill_check 2192   side 129   combat 71   epic 40
          delivery 38   escort 22   hybrid 9   main 7   dialogue 7
skill_check breakdown:
  ├─ with an onPass closure ...............    78   (Wave 1 — full bit-chain transform)
  └─ simple (checkPassFlag/xpAward only) ... ~2114  (Wave 2 — codemod bulk)
with a completeFn closure .................   163   (→ declarative completion)
```

**Implication for the plan:** Wave 2 is not ~61 hand-migrations — it is **~2149
near-identical** simple skill_checks. One-by-one is infeasible; Wave 2 must be a
**programmatic transform** (a codemod that rewrites `checkAbility/checkLabel/
checkDC/checkPassFlag/xpAward/goldAward/onPass` into a `schema+gate+bits` shell)
applied in batches, each batch parity-tested by the same harness. Wave 1 (78
closures) stays hand-migrated arc-by-arc because the closures are bespoke.

**Codemod recipe (validated in Wave 1g — d0201/d0205/d0209, 15 quests):** the safe
shape is a one-shot script with an explicit per-quest spec of `[oldStructural,
newStructural]` pairs, applied **within each quest's brace-delimited block** (so
each old-string need only be unique inside its own block, not the whole file).
Touch **only structural fragments** (`activateNode`/`activateCond`/`check*`/
`xpAward`/`goldAward`/`checkPassFlag`/`completeItems`/`onPass`/`onFail`/
`completeFn`) — **never the narrative prose** (desc/vignetteText/passText/failText),
which carries apostrophes and quotes that make escaping brittle. Recompute the
`QUEST_DB:END` bound each block (it shifts as you splice). After running:
vm-parse the file, structurally assert every target (schema set, no leftover
legacy fields, bit/completion present), run the suites, then **delete the
one-shot script** (the transform lives in git + this report).

---

## 2. The migration playbook (common activities)

Every quest migration is the same repeatable sequence. This is the checklist
to run per quest (and per arc):

### A. Recon (per arc, once)
1. `grep -n "quest_<arc>_" roll2hit-v3.html` — list the arc's quests.
2. **Read each quest's full legacy object** — capture the exact fields and the
   verbatim long strings (narratives, knowledge entries).
3. **Grep for external consumers** of the legacy fields you're about to drop:
   `grep -nE "\.checkStat|\.checkPassFlag|\.onPass|\.completeFn" …` — confirm
   they only appear inside `_rollCeremonia` / the `storyCheckQuests` loop
   (both already schema-guarded). If a storyRender block or other code reads a
   field directly, plan to leave that field in place.

### B. Transform (per quest)
4. **`activateCond` → `gate`**: `()=>!!A` → `{flags:['A']}`; `A && B` →
   `{flags:['A','B']}`; `A || B` → `{flagsAny:['A','B']}`; negations →
   `notFlags`; visited-node checks → `nodes`.
5. **Pick the primary mechanic:**
   - skill check → a `skill_check` bit (`stat` UPPERCASE, `skill`, `dc`).
   - passive/side → a declarative `completion` gate (same vocabulary as
     `gate`, plus `battles:[code]` for defeated-combat conditions); `bits:[]`.
6. **`onPass` closure → ordered bit chain**, mapping each statement:
   - `_grantMissionBit(flag)` / `checkPassFlag` → `{kind:'mission_bit', flag}`
     (grants the inventory token **and** sets the flag — do not use a bare
     `flag_write`, which drops the token).
   - extra `S_story.x = true` → `{kind:'flag_write', set:['x']}`.
   - `S_story.gold += n` / `S_story.xp += n` / knowledge push / item push →
     one `{kind:'reward', gold, xp, knowledge, items}`.
   - `storyMsg(text)` → `{kind:'narrative', msg:text}` (paste **verbatim**).
7. **`onFail` closure → `[{kind:'narrative', msg}]`**.
8. **`completeFn` → `completion` gate** (flags AND-group; flagsAny+battles
   OR-group; notFlags). `completeItems:[…]` → an `item_check`-style condition
   (future) or keep as a legacy field until that bit lands.
9. **Preserve display/side fields verbatim**: `title, desc, hint, disposition,
   passText, failText, waypointNode, npc, retryable`. Keep `type` for the
   badge. Transcribe long strings byte-for-byte from the legacy literal.

### C. Engine gaps — generalize, never special-case
10. If a quest needs a mechanic the registry lacks, add a **reusable** bit
    kind or gate term (with a `BIT_CONTRACTS` entry + handler), not a
    quest-specific branch. So far this produced: `mission_bit` bit kind, the
    `battles` completion term, (Wave 1a) the **`gate.questsAttempted`**
    (`(quests[id]||'')!==''`, ×23 in QUEST_DB) + **`gate.questsDone`**
    (`done`/`complete`) chain terms, (Wave 1d) **`gate.favorMin`**
    (`{npc:n}` ← `(npcFavorability||{}).x >= n`), (Wave 1f) **`gate.battles`**
    (`['CODE']` ← `!!defeatedBattles[code]`; ALL required), and (Wave 1h)
    **`gate.notBattles`** (`!defeatedBattles[code]`), **`gate.shardsMin`**
    (`(shards||0)>=n`), **`gate.restedAtMin`** (`{node:n}` ←
    `shortRestedAtNodes[node]>=n`) in `canActivate` + **`completion.questsComplete`**
    (strict `==='complete'` OR-term, for chaining off a *side* quest) in
    `canComplete`, and (Wave 1i) **`gate.sleptAt`** (`['CODE']` ←
    `!!(sleptAtNodes||{})[code]`; ALL required) in `canActivate`, and
    (Wave 1m) **`completion.atNode`** (`S_story.currentCode === code` ←
    `completeFn:()=>currentCode==='NWI'`; waypoint-arrival side-quest completion)
    in `canComplete`, and (Wave 1n) **`gate.flagEquals`** (`{field:value}` strict
    equality, ALL required ← `S_story.sbChosenRole === 'fight'`; enum/branch-state
    gates for role choices) in `canActivate`. Each immediately served multiple quests.

> **§C note — fail flags & the onFail chain.** The legacy non-retryable fail
> path grants `checkFailFlag` via `_grantMissionBit(checkFailFlag, bitLabel)`
> (`_rollCeremonia`, ~L6308) — but `_resolveQuestUQF` does NOT replicate that.
> So a quest with a `checkFailFlag` must carry an explicit
> `onFail:[{kind:'mission_bit', flag:<checkFailFlag>}]`. (Safe because such
> quests are non-retryable: every fail is terminal, so the onFail chain runs
> exactly once — matching the legacy `else` branch.) Likewise `checkPassFlag`
> ⇒ an `onPass` `mission_bit` (the engine applies neither check*Flag itself).
> `retryGateDays` needs no migration: the retry helpers read `q.retryGateDays`
> directly (schema-agnostic), and `_resolveQuestUQF` records `skillCheckAttempts`
> identically to legacy.
11. **Imperative shared helpers** (e.g. `_addCroneMark()` = counter++ +
    inn-kindness) that don't decompose cleanly into declarative bits are the
    legitimate use of the **`_legacy_fn`** escape hatch: `{kind:'_legacy_fn',
    fn:() => _helper()}` preserves byte-identical behavior while still moving the
    quest onto the `schema+gate+bits` shell. Don't invent a one-off bit kind for
    a single shared helper. (Order matters: emit `reward` before `_legacy_fn` to
    mirror the legacy `xpAward`-then-`onPass()` sequence.)

> **§C note — `side`-quest `onComplete` stays a live hook (for now).**
> `storyCheckQuests` calls `q.onComplete()` on completion for **every** schema
> (it is not behind a `schema` guard), so a migrated `side` quest keeps its
> `onComplete` verbatim — convert only `completeFn`→`completion` gate and
> `activateCond`→`gate`. Folding `onComplete` effects into a *completion bit
> chain* needs a UQF completion-bit execution point that doesn't exist yet
> (a Wave 3 engine task). Until then, `onComplete` is the legitimate hook, same
> status as the per-id hardcoded completion effects in `storyCheckQuests`.

### D. Verify & land (per quest/arc)
12. **Syntax-check** the inline script (vm parse) after each edit.
13. **Write parity tests** (section 3).
14. Run `npx playwright test quest-runtime-uqf` + `npm run check:walk` +
    `navigation debug autosave worldbuilder-quest-editor`.
15. Update `plan.md`, commit, `say` the subject.

---

## 3. The test-suite playbook

All tests live in `tests/integration/quest-runtime-uqf.test.js`, load the real
game (`page.goto('/roll2hit-v3.html')`), and read **bare top-level globals**
(`QUEST_DB`, `S_story`, `QuestRuntime`, `validateQuest`, `_rollCeremonia`,
`storyCheckQuests`) inside `page.evaluate`.

**Recurring techniques:**
- **Determinism by DC / ability**: a `dc:1` bit always passes, `dc:99` always
  fails. When the DC is fixed by the quest (you can't lower it), force the
  outcome via the ability score instead: a **huge** score (`{wis:40}`) guarantees
  a pass; a **deeply negative** score (`{wis:-100}` ⇒ mod −55) guarantees a fail
  even on a natural 20. **Do not** use a merely-low score like `1` (mod −5) for a
  "fail" test against a low DC — a d20 of 16–20 can still clear it, and the test
  flakes ~25 %. (Wave 1a shipped exactly this bug; caught + fixed in 1b. Verify
  any roll-outcome test with `--repeat-each=3`.)
- **Suppress level-up noise**: `S_story.level = 20` (so `_checkLevelUp` no-ops),
  high baseline `xp`/`gold`, then assert the **delta** — robust to the cumulative
  xp curve.
- **Drive the real entry points**, not just the engine: call `_rollCeremonia(id)`
  (the actual roll-button handler) and `storyCheckQuests({code})` (activation +
  completion loop) so dispatch, render, and gates are all exercised.
- **Throwaway fixtures** for engine-only tests: inject a synthetic quest into
  `QUEST_DB`, assert, then `delete` it (fresh page per test makes this safe).
- **Assert on the rendered container, NOT `document.body`.** When a test checks
  rendered panel text, read `document.getElementById('story-info-row').innerHTML`
  (the quest-panel container), not `document.body.innerHTML` — the latter
  includes the inline `<script>` source, so every quest's literal strings (e.g.
  both `vignetteText` AND `vignetteTextAlt`) always "match" and the assertion is
  meaningless. (Wave 1d's render test hit exactly this.)
- **Assert byte-level parity** against the legacy source values: status `done`,
  the page flag `true`, the **mission-bit token** present
  (`inventory.find(i => i.flagRef === flag && i.type === 'mission_bit')`), exact
  xp/gold deltas, and the knowledge entry (`some(k => k.startsWith('Ardley …'))`).

**The five test shapes per migrated quest/arc:**
1. *validates as UQF* — `validateQuest(q).valid` with the right `schema`/bit.
2. *activation gate* — unmet gate ⇒ no activate; met ⇒ `'active'`.
3. *PASS parity* — every reward/flag/token/knowledge matches legacy.
4. *FAIL behavior* — non-retryable ⇒ `'failed'` and grants nothing; retryable
   ⇒ stays `'active'` + logs an attempt.
5. *completion* (side quests) — `canComplete` truth-table incl. OR-branches;
   `storyCheckQuests` flips `'active'` → `'complete'`.

---

## 4. Full-migration plan (waves)

~2501 quests remain. Migrate in waves of rising complexity. A wave is "done" when
every quest in it is `schema:'UQF-1.0'`, parity-tested, and all suites green.
**Wave 1 stays hand-migrated arc-by-arc** (bespoke closures); **Wave 2 must be a
codemod** (the simple skill_checks are too numerous — ~2149 — to hand-edit).

| Wave | Target | Count | Mechanic / new engine work |
|------|--------|-------|----------------------------|
| **0 ✅** | §WISDOM-01 pilot | 8 | proves skill_check + completion paths |
| **1a ✅** | Wane's Crown (`quest_wane_01`–`06`) | 6 | full bit-chain transform; added `gate.questsAttempted`/`questsDone` chain terms; `onPass:()=>_addCroneMark()` preserved via `_legacy_fn`; `xpAward`→`reward`. |
| **1b ✅** | Whisper's Crown (`quest_whisper_01`–`06`) | 6 | same pattern ×5 skill_checks; **first Wave-1 `side` quest** (`whisper_05`): `completeFn`→`completion:{flags}`, `onComplete` **kept verbatim** (fires from `storyCheckQuests` for any schema — see §C.note). |
| **1c ✅** | Glut's Crown (`quest_glut_01`–`06`) | 6 | ×5 skill_checks; `side` quest (`glut_06`) with a **flag** activation gate (`gate:{flags:['glut_gift_held']}`) + a multi-effect `onComplete` (inventory splice of "Glut's Gift" + crown flag), kept verbatim. Confirms the side-quest pattern generalizes across flag-gated and chain-gated activation. |
| **1d ✅** | Ceremonia: Yael romance arc (`quest_ceremonia_yael_01`–`05`) | 5 | richest arc yet — real `checkPassFlag`→`mission_bit`, `checkFailFlag`→`onFail:[mission_bit]` (the legacy non-retryable fail path grants the fail flag; `_resolveQuestUQF` does not, so make it an explicit onFail bit), numeric `onPass` counter + favor/item closure via `_legacy_fn`. **New `gate.favorMin`** term; **vignetteTextAlt render parity fix** (UQF path now honors it). |
| **1e ✅** | §1367 historical skill-checks (4 of 6) | 4 | `e_wycliffe`/`b_tamerlane`/`c_ottoman`/`d_hansa`. No `checkPassFlag` (no mission_bit); `gate:{}` (independent); `onPass`/`onFail` adjust **clamped faction/faith track counters** via `_legacy_fn`; `d_hansa` first real `onFail` track effect. The 2 combat quests (`a_najera`, `f_plague`) deferred to Wave 4. |
| **1f ✅** | Ceremonia **d0207** arc (5 acts) | 5 | first FULL d02xx arc (3 skill_check + 2 side), migrated end-to-end like §WISDOM-01. New: **`gate.battles`** activation term (a4 needs `defeatedBattles['HKG']`); `notFlags` activation (a1); flag completion (a2); **battle completion** (a3 → `completion:{battles}`). a5 onPass pushes a flavor item via `_legacy_fn`. **Template for the other 8 d02xx arcs (40 quests total).** |
| **1g ✅** | d0201 + d0205 + d0209 (3 full arcs) | 15 | **first script-assisted batch** — a one-shot within-block codemod (structural fragments only, never narrative), verified by syntax+structure+tests. Zero engine changes (only already-supported terms). Handled onFail closures (`voidPressure+1`), `reward.gold` finales, and a side-quest `onComplete`. d02xx now **20/40**. |
| **1h ✅** | d0204 + d0206 + d0208 + d0210 (final 4 arcs) | 20 | codemod #2 → **d02xx 40/40 COMPLETE**. + 4 engine terms: `gate.shardsMin`/`gate.notBattles`/`gate.restedAtMin` (canActivate), `completion.questsComplete` (strict `==='complete'` OR-term). **Deliberate bug-fix (not pure parity):** dead `completeItems` on skill_checks (never granted in legacy) → `onPass reward.items`, so 4 items are now granted. §DUNGEON-01 follow-up logged (per-id `==='complete'` handlers for skill_checks remain dead). |
| **1i ✅** | Innmother skill-checks (`quest_inn_02`/`03`/`04`) | 3 | first **non-d02** Wave-1 arc. No `checkPassFlag` (no mission_bit); new **`gate.sleptAt`** term (`['INN']` ← `!!(sleptAtNodes||{})['INN']`); `xpAward`→`reward`; `onPass:()=>_innKindness(1)` kept verbatim via `_legacy_fn`. Side quests `inn_01`/`05`/`06` (+`inn_eel`) stay legacy. +4 tests. |
| **1j ✅** | Spark: the Harmony Chain (`quest_spark_01–05`) | 5 | first arc on the §SKILLFIX-01 pure-parity footing. 3 skill_checks (01 CHA Persuasion DC10 **retryable**, 03 WIS Medicine DC13, 04 INT Investigation DC14) + 2 side (02/05). `checkPassFlag`→`mission_bit` (03/04 no `bitLabel` → `_flagToLabel` fallback); rich onPass closures (gold/xp/items/knowledge/msg) kept whole via `_legacy_fn`; spark_01 onFail (hp−1) via `_legacy_fn`. Side 02/05: gate←activateCond (05 = 2-flag AND), completion←completeFn, onComplete kept verbatim. **Zero engine changes.** +5 tests. |
| **1k ✅** | Spark2: the Dunfall Harmony Chain (`quest_spark2_01–05`) | 5 | Bram/Oat/Fehn arc at DNF. 2 skill_checks (02 WIS Animal Handling DC11 **retryable**, 04 INT Nature DC12 **non-retryable**) + 3 side (01/03/05). `checkPassFlag`→`mission_bit{flag}` (no label); onPass via `_legacy_fn` (04 splices Oat's Harbor Bead → Dunfall Drift Spore); both keep onFail msg, 04's non-retryable FAIL runs msg then locks. Side 01/03/05 are **pure hook/waypoint gates, NO onComplete** → structural gate/completion only. **Zero engine changes.** +5 tests. |
| **1l ✅** | Codex Inquisitor gauntlet (`quest_inquisitor_handshake`/`questions`/`final`) | 3 | 3-question construct at NUE. `checkAbility`/`checkLabel` quests (the ~30 that worked pre-§SKILLFIX-01) → pure parity. **Fully decomposed** (no onPass `_legacy_fn`): `checkPassFlag`→`mission_bit{flag}` (no label), `xpAward`→`reward{xp}` (50/75/200), final's item-push → `reward{items:[Archive Key]}`. Only `questions` keeps `onFail:[_legacy_fn]` (hp−10 psychic). Chained flag gates; `retryGateDays` 0/0/1 top-level. §D01-02 NUE handshake button dispatches transparently. **Zero engine changes.** +4 tests. |
| **1m ✅** | Sea: The Warmth Calm (`quest_sea_01/02/03`) | 3 | Deep Warmth Eel arc (SEN→NWI). 2 skill_checks (02 INT Investigation DC13, 03 WIS Nature DC14) pure-parity via `mission_bit{flag}` (no label) + `_legacy_fn` (03 grants `pirateCrew_allied` + Joint Pirate Debt Note). sea_01 side quest needed a **new `completion.atNode:'NWI'`** term (← `completeFn:()=>currentCode==='NWI'`, waypoint-arrival); `onComplete` kept verbatim. +3 tests. |
| **1n ✅** | Naval Intercept branch (`quest_sb_01`/`fight`/`parley`/`examine`) | 4 | Captain Keel's role-choice intercept (GCI). **New `gate.flagEquals`** term (`{sbChosenRole:'…'}` strict eq) for the 3 branches. parley (CHA Persuasion DC12) + examine (INT Investigation DC11) `retryable:false`; `mission_bit{flag}` (no label) + onPass `_legacy_fn`; **onFail `_legacy_fn` flips `sbChosenRole`→'fight'** (branch fallthrough → sb_fight activates). sb_fight `completion:{battles:['SB_PRIVATEER']}` + onComplete verbatim. ⚠ **Latent +800xp double-count** (onComplete+400 ∧ xpAward:400) preserved, flagged. +5 tests. |
| **1o ✅** | Lake/Relay Monster Hunt (`quest_hunt_01–04` + `quest_hunt2_01–04`) | 8 | 2 identical investigate→clear arcs (hunt2 Night Hag WRO→BNX; hunt drowners HFT→VAW). Hook side (gate:{}) + 2 `retryable:false` checkStat skill_checks (`mission_bit{flag}` no-label + onPass/onFail `_legacy_fn` w/ knowledge/xp) + lair-clear side (`completion:{battles}` + verbatim onComplete). Zero engine changes. ⚠ hunt_04 (+1000xp)/hunt2_04 (+1200xp) share the sb_fight double-count, preserved. +3 tests. |
| **1p ✅** | Bilge Mystery (§WHODUNIT-01, `quest_bilge_01–04`) | 4 | Same investigate→clear shape as hunt (SEN). Hook side (flag gate) + 2 `retryable:false` checkStat skill_checks (02 INT Investigation DC12, 03 WIS Insight DC13; `mission_bit{flag}` no-label + onPass/onFail `_legacy_fn`) + lair-clear side (`completion:{battles:['MS_BILGE']}` + verbatim onComplete). Zero engine changes. ⚠ bilge_04 (+1200xp) shares the double-count, preserved. +3 tests. |
| **1q ✅** | The Personal Legend (§ALCHEMY-01, `quest_alch_01–07`) | 7 | Roen's pilgrimage (Coelho's Alchemist). **5 structural waypoint side quests** (01/02/03/06/07 — flag-chained gate+completion, NO onComplete) + 2 retryable checkStat skill_checks (04 CHA Persuasion DC11, 05 WIS Insight DC12; `mission_bit{flag}` no-label + onPass/onFail `_legacy_fn`). Terminal `personalLegendComplete` gates the wis arc. Zero engine changes. +3 tests. |
| **1r ✅** | The Scar (§SCAR-01 Gret Orrens, `quest_scar_01–04`) | 4 | **checkAbility** quests, **no checkPassFlag** (closures→`_legacy_fn`; `xpAward`→`reward{xp}`). scar_03 moral **branch** (onPass help / onFail refuse; `retryable:false` locks 'failed' but both progress). scar_04 (side) keeps `itemChain`/`xpAward:350`/per-id WIS handler (schema-agnostic); completion `flags:['gretChoice']` ∧ `atNode:'NUE'`. `reward:500` dead/display-only. Zero engine changes. +4 tests. |
| **1s ✅** | The Four Courts of the Littoral Sea (§SIREN-01, `aurel_tide`/`calice_bridge`/`mireille_ami`/`solen_horizon`/`sea_overseer`) | 5 | first **Wave-1 singleton cluster** — LC1–LC4 + LSO sea-betrayal chain. `checkAbility` skill_checks, all `retryable:false`, pure parity, fully decomposed (no onPass closures). `checkPassFlag`→onPass `mission_bit{flag,label}`; `xpAward`→`reward`; **`checkFailFlag`→onFail `mission_bit` (same `bitLabel`)** — non-retryable so it grants once. `solen_horizon` (no fail flag) → `onFail:[]`. Pass/fail flags consumed by the LC/LSO NPC quoteFns + LJ3/betrayalCount. Zero engine changes. +4 tests. |
| **1t ✅** | Biblical singletons (`stoning_lystra` KYA, `basket_damascus` DAM) | 2 | both STR Athletics `checkAbility`. **stoning** (`retryable:false`): SHARED pass/fail flag `stoningEvent` ('Lystra Stoning') — same `mission_bit` on BOTH outcomes; onFail hp→1 closure → `_legacy_fn` ordered before the bit; gate `{questsDone:['quest_lame_lystra']}`. **basket** (`retryable:true`): onPass fully decomposed into TWO `mission_bit`s (`escapedDamascus` + `basketRopeComplete`) + `reward`; `onFail:[]`; gate `{flags:['anathSightRestored']}`. Flags read by LT render + KYA HP cap. Zero engine changes. +6 tests. |
| **1u ✅** | Atlantean iodine chain (`iodine_01` INN, `shore_02` DS1, `forge_01` DSF, `sunken_01` DA1) | 4 | the four §CROWN-01 iodine-reduction skill_checks. All `retryable:true`, no checkPassFlag/checkFailFlag. Rich onPass closure (item/gold/knowledge/storyMsg + flag) → single `_legacy_fn` ordered after `reward{xp}`; `onFail:[]`. Gates: iodine_01 `{questsAttempted:['quest_inn_01']}`, forge_01 `{flags:['atlanteanProcessKnown']}`, shore_02/sunken_01 `{}`. Side acts stay legacy. Zero engine changes. +4 tests. |
| **1v ✅** | **Wave-1 closeout** — Highland trade (`df_02` DNF, `sk_02` MME) + folk wisdom (`lxvii67` HKG, `guide_04` SSJ) | 4 | **Highland** (`checkStat`, `retryable:true`): `checkPassFlag` → onPass label-less `mission_bit` (→ `_flagToLabel` parity) before the gold/xp/item/storyMsg `_legacy_fn`; fail storyMsg → `onFail:[_legacy_fn]`; gates `{flags:['dunfallAccessed']}`/`{flags:['saltwickAccessed']}`. **Folk** (`checkAbility`, `retryable:true`): no token, simple onPass flag-set (`faith_folk++`/`emmerStage4a`) → `_legacy_fn` after `reward{xp}`; `onFail:[]`. `guide_04`→`{questsDone:['quest_guide_03']}`; `lxvii67`'s `faith_folk>=1` inexpressible → `gate:{_legacyFn:true}` keeps `activateCond` load-bearing. Zero engine changes. +8 tests. |
| **1 ✅** | skill-check arcs **with** `onPass` closures (whole arcs incl. their `side` acts) + Wave-1 singletons | **78** onPass-closures + singleton cluster (done: wane 6, whisper 5, glut 5, ceremonia_yael 5, 1367 skill 4, d02xx 40, inn 3, spark 5, spark2 5, inquisitor 3, sea 3, sb 4, hunt+hunt2 8, bilge 4, alch 7, scar 4, §SIREN-01 5, biblical 2, iodine chain 4, Highland 2, folk 2 = **~115 quests**) | full bit-chain transform (the wis/wane pattern). **d02xx family** (9 arcs × 5 = 40 quests) **✅ 40/40 COMPLETE**. **Wave 1 COMPLETE** — all skill-check arcs with closures + all Wave-1 singletons migrated. Next: **Wave 2** (~2149 simple `checkStat` skill_checks, script-assisted bulk). |
| **2** | simple skill-checks (checkPassFlag/xpAward only) | **~2149** | **codemod, not hand-migration.** Mechanical rewrite `{checkStat\|checkAbility, checkSkill\|checkLabel, checkDC, checkPassFlag, xpAward, goldAward}` → `schema+gate+bits:[{skill_check stat/skill/dc, onPass:[mission_bit?, reward?]}]`. **NB the dominant convention is `checkStat`/`checkSkill`** (2443 vs 30 `checkAbility`) → bit `stat=checkStat.toUpperCase()`, `skill=checkSkill`. Pure-parity since **§SKILLFIX-01** (legacy now applies the `checkStat` mod too). Run in batches; parity-test each batch with the harness. The dominant chain gate `(quests['prev']||'')!==''` is already covered by `gate.questsAttempted`. |
| **3** | `side` quests (completeFn) | 129 | declarative `completion` gates. Needs `item_check` gate term finalized; per-id hardcoded completion side-effects in `storyCheckQuests` move into completion bit chains. |
| **4** | `combat` quests | 71 | needs a UQF combat-quest resolver (the `combat` bit kind exists; wire resolution mirroring legacy combat-quest completion). Largest non-skill bucket — was mis-counted as 2 in the first survey. |
| **5** | other types: `delivery` 38 · `escort` 22 · `hybrid` 9 · `main` 7 · `dialogue` 7 | 83 | each is its own resolution/completion shape; needs a per-type design pass (delivery/escort likely fold into `item_check`/waypoint completion; `main`/`dialogue` may need new terms). Investigate before transform. |
| **6** | `epic` quests | 40 | **Different lifecycle** — excluded from the activation loop (`if (q.type==='epic') return;`), activated explicitly via modal/defeat. Needs an epic-specific design before transform; investigate first. |
| **7 (Phase 4)** | retire legacy paths | — | once waves 1–6 land: remove the legacy branches of `_rollCeremonia` and the `completeFn`/per-id side-effects in `storyCheckQuests`; `adaptLegacyQuest` becomes a no-op. Full suite gate before removal. |
| **8 (Phase 5)** | canonicalize | — | QUEST_DB is the single source of truth; storyRender holds pure display only; worldbuilder exports a fully functional UQF arc. |

### Sequencing rules
- **Arc-sized commits.** One arc per commit, parity-tested, suites green, `say`.
- **Test-first per arc.** Author the five test shapes before/with the transform.
- **Generalize gaps once.** Each new mechanic becomes a registry primitive
  (next likely additions: `item_check` gate term for Wave 3; a combat-quest
  resolver for Wave 4).
- **Keep `plan.md` + this report in sync** after each wave (two-way doc rule).
- **Defer epics** (Wave 5) until their lifecycle is designed — they are the one
  group not yet covered by the proven engine.

### Estimated engine work still required
- Wave 3: finalize `item_check` as a completion term (small).
- Wave 4: UQF combat-quest resolver (~the size of `_resolveQuestUQF`).
- Wave 5: epic lifecycle design (a lab-report-sized question).
Everything else is the **already-proven** skill_check + completion transform
applied repeatedly.

---

## 5. Risks & mitigations

| Risk | Mitigation |
|------|-----------|
| Long-string transcription drift | Copy literals verbatim within the same Edit; vm-parse after each; narrative text is cosmetic (structured fields are short and asserted). |
| Hidden external consumer of a legacy field | The section-2-A grep is mandatory before dropping any field. |
| Per-id hardcoded completion effects (storyCheckQuests) | Inventory them during Wave 3; move into completion bit chains so Phase 4 can delete the id-keyed block. |
| Epic lifecycle surprises | Wave 5 is gated on a design pass, not transformed blindly. |
| Silent reward/level-up timing change | Reward handler calls `_checkLevelUp` immediately (legacy sometimes deferred); benign (cumulative xp), documented, tested by delta. |

---

*§ARCH-01 — UQF Migration Playbook. Companion to
`lab-report-quest-api-architecture.md`. Author: World Builder — roll2hit.com.*

*© 2026 Paul Richeson — MIT License. See [LICENSE](LICENSE) for full text.*
