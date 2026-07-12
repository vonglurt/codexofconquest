<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->
# Lab Report — §XP-01 *Universal Effort XP*: misses + failed skill-checks

**Parent:** `lab-reports/lab-report-play-review.md` §PLAY-01 · spun off from §PLAY-01-B · **Track:** BACKLOG.md §XP-01 (Mechanics & Systems)
**Date:** 2026-07-12 · **Class:** enactment (carries design weight) · **Status:** ✅ SHIPPED 2026-07-12 — user decisions signed off: **(1) fractional (2%) + per-encounter cap at the flee value for combat misses · (2) failed skill-checks grant 25% of quest reward XP, once per quest.** New `EFFORT_MISS_PCT=0.02` dial; `effort-xp.test.js` 3/3 + enemy-ai 4/4 / courier-map 1/1 / hunt-mode 3/3 regression green; parse clean; DUEL:CORE git-diff-verified untouched; mechanics docs synced.

## 0. The directive

User rule (verbatim intent): **"all action earns XP; you never lose XP."** §PLAY-01-B shipped the first instance — a fled mundane beast grants `EFFORT_XP_PCT` (0.25) of the kill's XP via `_storyEnemyFlees()` (`24401`). §XP-01 extends the same dial to the two remaining "effort without success" surfaces: **a missed attack** and **a failed skill-check**. Nothing in the game ever subtracts XP today, and nothing here changes that — this is purely additive partial-credit.

## 1. The say/do gap (verified in code)

- **Missed attacks earn nothing.** `_overlayPlayerAttack()` (`24253`) rolls `n = _extraAttackCount()` attacks; the two miss branches — NAT 1 (`24295`) and ordinary miss (`24297`) — set `logMsg` and append a card, but grant **no XP**. `_statTally('attacksAttempted', 1)` (`24290`) already fires per swing, so the miss is *counted* but never *rewarded*. A whole fight of near-misses against a Deadly enemy that you then flee/die to yields 0 XP for the effort.
- **Failed skill-checks earn nothing.** `_resolveQuestUQF()` (`6782`) resolves every UQF skill-check. On pass it runs `sc.onPass` (which typically carries `{kind:'reward', xp:N}`); on fail (`6807`) it runs `sc.onFail` — which is **`[]` on the overwhelming majority** of quests (grep: nearly every `onFail:[]`). So a failed insight/persuasion/athletics check is pure loss of the attempt, contradicting the directive.

Baselines to scale against (both already in the file):
- **Full kill XP** = `round(AC × maxHp × partyMult)` — `_storyBattleVictory()` `24524`.
- **Flee / existing effort grant** = `round(AC × maxHp × EFFORT_XP_PCT)`, `EFFORT_XP_PCT = 0.25` — `_storyEnemyFlees()` `24402`, dial at `23686`.

## 2. Proposed design — locked shapes

### 2a. Combat misses — fractional + per-encounter cap *(user chose: fractional)*

- **New dial:** `const EFFORT_MISS_PCT = 0.02;` sits next to `EFFORT_XP_PCT` (`23686`) with a one-line comment. It is deliberately tiny because a single encounter fires many attack rolls (`n` extra attacks × many rounds).
- **Per-miss grant:** `xp = Math.max(1, Math.round((S.enemy.ac || 10) * (S.opp.maxHp || 10) * EFFORT_MISS_PCT))`. Scales with enemy strength — a Deadly boss's miss is worth more than a rat's — so effort tracks difficulty, matching the kill/flee formula.
- **Per-encounter cap (anti-farm):** cumulative miss-XP in one encounter is capped at the **flee value** — `round(AC × maxHp × EFFORT_XP_PCT)` (25% of the kill). Once the cap is hit, further misses grant 0 (still logged as effort, just no more XP). Guarantees: (i) grinding misses on a weak enemy is never worth more than fighting a real one; (ii) a drawn-out fight can never out-earn its own kill; (iii) worst-case a *won* fight yields ≤125% of the kill XP (cap + kill), which reads as a fair "hard-fought" bonus.
- **Accumulator:** `S.effortXpEarned` (transient battle state on `S`, never saved — per the §MESH-01f "Transient battle state (S, never S_story)" convention), reset to `0` in `_storyRollInit()` (`23890`, right beside the existing `S.opp.enraged = false`).
- **No mid-fight level-up modal.** The miss branch banks XP into `S_story.xp` immediately and appends a compact log note (`+N XP (effort)`); it does **not** call `_showLevelUpModal`. Any level earned surfaces at battle resolution — `_storyBattleVictory` / `_storyEnemyFlees` / death-save flow all already call `_checkLevelUp()`. XP is banked instantly (never lost); only the *celebration* waits for a natural break, avoiding a modal interrupting the attack loop.

### 2b. Failed skill-checks — 25% of the quest's own reward, once per quest

- **Grant:** in the fail branch of `_resolveQuestUQF` (`6807`), compute the check's intended reward from its own `onPass` — `rewardXp = (sc.onPass || []).find(b => b.kind === 'reward')?.xp || 0` — and grant `Math.round(rewardXp * EFFORT_XP_PCT)` (reusing the 0.25 dial; a failed check is "effort," same class as a flee). If the check carries no reward bit, effort XP = 0 (nothing to scale off — many narrative "you miss the meaning" checks have no reward and shouldn't invent one).
- **Once per quest (anti-farm):** guard on a new `S_story.effortXpQuests` set-map so a *retryable* check (which re-gates by `retryGateDays`) grants effort XP only on its **first** failure, never on each retry. Non-retryable checks go to `'failed'` and can't recur anyway; the guard is belt-and-suspenders for the retryable ones.
- **Level-up here is fine** (non-combat context): after granting, call `_checkLevelUp()` and pop the modal if a level was earned — consistent with how skill-check resolution already updates status/render.
- **Presentation:** the existing fail hcard is unchanged; a short `storyMsg('… +N XP for the attempt.')` (only when N > 0) makes the partial credit legible.

## 3. Implementation surface (locked anchors)

| # | File / fn | Line | Change |
|---|---|---|---|
| 1 | `roll2hit-v3.html` — dial | `23686` | Add `EFFORT_MISS_PCT = 0.02` const + comment beside `EFFORT_XP_PCT`. |
| 2 | `_storyRollInit` | `23890` | `S.effortXpEarned = 0;` (per-encounter reset, beside `S.opp.enraged = false`). |
| 3 | `_overlayPlayerAttack` miss branches | `24295`, `24297` | Helper `_grantMissEffortXp()` called in both; banks capped XP into `S_story.xp` + `S.effortXpEarned`, appends `+N XP` to `logMsg`. No modal. |
| 4 | `_resolveQuestUQF` fail branch | `6807` | Grant `round(rewardXp × 0.25)` once per quest (guarded by `S_story.effortXpQuests`); `_checkLevelUp()` + modal. |
| 5 | `_S_DEFAULTS()` (per §STATE-INIT) | — | Add `effortXpQuests: {}` so a fresh/loaded save always has the guard map. |
| 6 | `mechanics.md` + `docs/mechanics/mechanics-combat.md` | — | §XP / §Character Levels & XP: document effort XP (flee 25%, miss 2% capped at 25%, failed check 25% of reward), one dial table. (§PLAY-01-G honesty — keep the doc in sync as we ship.) |

**Hard constraints:** the miss helper touches only `_overlayPlayerAttack`'s two miss branches — **DUEL:CORE kernel (`10025`–`10177`) and the mesh replay path stay byte-identical** (PvP determinism). Effort XP is single-player story only (`S_story`), so it can never enter the synced duel. No monster-data pass. No change to kill XP, gold, heal, or loot.

## 4. Verification plan
1. **Inline-script parse** — extract the `<script>` block, `node --check`, 0 errors.
2. **New `tests/integration/effort-xp.test.js`** driving the real functions:
   - (a) `_overlayPlayerAttack` forced-miss (stub RNG so every swing misses) → `S_story.xp` rises by `round(AC·maxHp·0.02)` per miss; the **cap** holds (bank many misses → total = `round(AC·maxHp·0.25)`, no more); no level-up modal appears mid-loop.
   - (b) A **won** fight after some misses → final XP = banked-miss (≤cap) + full kill XP; level-up surfaces at victory.
   - (c) `_resolveQuestUQF` on a quest with `onPass` reward `xp:200` forced to FAIL → `S_story.xp += 50`; a **second** failure of the same (retryable) quest grants **0** (once-per-quest guard); a quest with no reward bit grants 0.
   - (d) Regression: `enemy-ai.test.js` 4/4, `courier-map.smoke.test.js` 1/1, `hunt-mode` 3/3 still green (shared combat/quest surface).
3. **DUEL:CORE git-diff check** — confirm `10025`–`10177` untouched.
4. **Live screenshot** — a miss shows `+N XP (effort)` in the combat log; a failed check shows the attempt-XP line.

## 5. Open decisions
**None** — both design calls signed off (2026-07-12): combat misses = fractional (2%) + per-encounter cap at the flee value; failed skill-checks = 25% of the quest's own reward, once per quest. Ready to implement.
