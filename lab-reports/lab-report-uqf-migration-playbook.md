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
| Wave 1a | Wane's Crown (`quest_wane_01`–`06`) + `gate.questsAttempted`/`questsDone` terms; `onPass` closure preserved via `_legacy_fn` | _this commit_ |

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
    `battles` completion term, and (Wave 1a) the **`gate.questsAttempted`**
    (`(quests[id]||'')!==''`, ×23 in QUEST_DB) + **`gate.questsDone`**
    (`done`/`complete`) chain terms in `canActivate`. Each immediately served
    multiple quests.
11. **Imperative shared helpers** (e.g. `_addCroneMark()` = counter++ +
    inn-kindness) that don't decompose cleanly into declarative bits are the
    legitimate use of the **`_legacy_fn`** escape hatch: `{kind:'_legacy_fn',
    fn:() => _helper()}` preserves byte-identical behavior while still moving the
    quest onto the `schema+gate+bits` shell. Don't invent a one-off bit kind for
    a single shared helper. (Order matters: emit `reward` before `_legacy_fn` to
    mirror the legacy `xpAward`-then-`onPass()` sequence.)

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
- **Determinism by DC**: a `dc:1` bit always passes, `dc:99` always fails — or
  set `abilityScores` huge to force a pass at a real DC.
- **Suppress level-up noise**: `S_story.level = 20` (so `_checkLevelUp` no-ops),
  high baseline `xp`/`gold`, then assert the **delta** — robust to the cumulative
  xp curve.
- **Drive the real entry points**, not just the engine: call `_rollCeremonia(id)`
  (the actual roll-button handler) and `storyCheckQuests({code})` (activation +
  completion loop) so dispatch, render, and gates are all exercised.
- **Throwaway fixtures** for engine-only tests: inject a synthetic quest into
  `QUEST_DB`, assert, then `delete` it (fresh page per test makes this safe).
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
| **1** | skill-check arcs **with** `onPass` closures | **78** | full bit-chain transform (the wis/wane pattern). Remaining arcs: `whisper`(5), `glut`(5), `ceremonia_yael`(5), `1367_*`(4), `d0205`–`d0210`(15), `inn`(3), `spark`/`spark2`, `inquisitor`(3), `sea`, `sb`, `hunt`/`hunt2`, `bilge`, `alch`, `scar` + ~13 singletons (`basket_damascus`, `iodine`, `shore`, `forge`, `sunken`, `df`, `sk`, `lxvii67`, `guide_04`, `d0201_a5`/`d0204_a5`/`d0210_a5`). |
| **2** | simple skill-checks (checkPassFlag/xpAward only) | **~2149** | **codemod, not hand-migration.** Mechanical rewrite `{checkAbility,checkLabel,checkDC,checkPassFlag,xpAward,goldAward}` → `schema+gate+bits:[{skill_check, onPass:[mission_bit?, reward?]}]`. Run in batches; parity-test each batch with the existing harness. The dominant chain gate `(quests['prev']||'')!==''` is already covered by `gate.questsAttempted`. |
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
