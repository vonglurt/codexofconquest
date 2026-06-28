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

### Quest landscape (measured 2026-06-28)

```
TOTAL 284   |   UQF 8 (§WISDOM-01)   |   remaining 276
By type:  side 129   skill_check 113   epic 40   combat 2
skill_check with an onPass closure ........... 52   (full bit-chain transform)
skill_check without onPass (checkPassFlag) ... 61   (simple transform)
quests with a completeFn closure ............ 158   (→ declarative completion)
```

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
    quest-specific branch. So far this produced `mission_bit` and the `battles`
    completion term; both immediately served multiple quests.

### D. Verify & land (per quest/arc)
11. **Syntax-check** the inline script (vm parse) after each edit.
12. **Write parity tests** (section 3).
13. Run `npx playwright test quest-runtime-uqf` + `npm run check:walk` +
    `navigation debug autosave worldbuilder-quest-editor`.
14. Update `plan.md`, commit, `say` the subject.

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

276 quests remain. Migrate in waves of rising complexity, each wave a series of
arc-sized commits using the section-2 playbook. A wave is "done" when every
quest in it is `schema:'UQF-1.0'`, parity-tested, and all suites green.

| Wave | Target | Count | Mechanic / new engine work |
|------|--------|-------|----------------------------|
| **0 ✅** | §WISDOM-01 pilot | 8 | proves skill_check + completion paths |
| **1** | skill-check arcs **with** `onPass` closures | ~52 | full bit-chain transform (the wis_01–05 pattern). Arcs: `wane`, `whisper`, `glut`, `ceremonia_yael`, `spark`/`spark2`, `scar`, `d0201_a`–`d0210_a` (Ceremonia), `hunt`/`hunt2`, `bilge`, `sea`, `forge`, `sunken`, `alch`, the Acts skill-checks (`areopagus`, `ephesus_riot`, `prison_phillam`, `governor_cyprus`, `lame_lystra`, `stoning_lystra`, `ezzir`, `basket_damascus`, `shipwreck_melta`, `aurel_tide`/`calice_bridge`/`mireille_ami`/`solen_horizon`/`sea_overseer`, `1367_*` skill-checks, `inquisitor_*`, `sir_jullean`, `courier_release`, `crypt_survey`, `lxvii`, `sb_parley`/`sb_examine`, `df`, `sk`, `shore`, `muffat`, `iodine`, `guide`) |
| **2** | skill-checks **without** `onPass` (checkPassFlag/xpAward only) | ~61 | simple transform: `checkPassFlag`→`mission_bit`, `xpAward`→`reward.xp`, `goldAward`→`reward.gold`, `passText` already carried in the card. No narrative bit unless one existed. |
| **3** | `side` quests (completeFn) | ~129 | declarative `completion` gates. Needs **one new bit/term**: `completeItems` (inventory-required) → finalize the `item_check` gate term. Per-id hardcoded completion side-effects in `storyCheckQuests` (e.g. `quest_slums_cleanup` gold+favor) move into completion bit chains. Arcs: `cat`, `tour`, `wm`, `math`, `va`, `ng`, `tl`, `la_riva`, `vs`, `inn`, fishing (`fish`/`horned_shark`/`shale_drop`/`night_eel`/`fishing_guide`/…), the Acts `side` beats, and singletons. |
| **4** | `combat` quests | 2 | `1367_a_najera`, `1367_f_plague` — needs a `combat`-resolution path (the `combat` bit kind exists; wire a UQF combat-quest resolver mirroring the legacy combat-quest completion). |
| **5** | `epic` quests | 40 | `e*_primary` / `e*_return` (Monster/element epics). **Different lifecycle** — excluded from the activation loop (`if (q.type==='epic') return;`), activated explicitly via modal/defeat. Needs an epic-specific gate/resolution design before transform; investigate first. |
| **6 (Phase 4)** | retire legacy paths | — | once waves 1–5 land: remove the legacy branches of `_rollCeremonia` and the `completeFn`/per-id side-effects in `storyCheckQuests`; `adaptLegacyQuest` becomes a no-op. Full suite gate before removal. |
| **7 (Phase 5)** | canonicalize | — | QUEST_DB is the single source of truth; storyRender holds pure display only; worldbuilder exports a fully functional UQF arc. |

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
