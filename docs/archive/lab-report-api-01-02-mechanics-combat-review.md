<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->

# Lab Report — API Review: mechanics.md + combat.md

**Project:** CodexOfConquest.com — *The Shattered Codex*
**Report Designation:** §API-01 (mechanics.md) + §API-02 (combat.md)
**HTML Baseline:** `roll2hit-v3.html` — 17,708 lines at time of review
**Review Date:** 2026-05-25
**Category:** API Surface Verification · Line Number Accuracy · Scope Boundary Audit

---

## Abstract

Two IEEE-format API reviews were conducted against `roll2hit-v3.html` to verify the accuracy of the two primary mechanics documentation files. §API-01 audited `mechanics.md` across 36 comparison points in five categories (Game Design, Combat System, Economy, Progression, Persistence). §API-02 audited `combat.md`'s F6 Function Reference Table, which had drifted +163 to +3,115 lines from the last sync. Both reviews were completed 2026-05-25; `mechanics.md` was subsequently split into `mechanics-combat.md` + `mechanics-economy.md` (FC03) based on §API-01's scope-split recommendation.

---

## §API-02 — combat.md Analysis

**File:** `combat.md` (F6 scope — Battle Mode + Story Battle overlay)
**Category Group:** Combat Engine · Death Saves · Level-Up · Enemy Scaling

### Abstract

`combat.md` is the F6 surface document for roll2hit's combat engine. It covers: pre-battle setup (Pre-Battle Screen → storyCommitBattle), action economy (1.5 AP), weapon/damage formulas, death saves (FL11), level-up chain (FL6), notoriety scaling, the F6 function reference table, and the FL2/FL6/FL11 milepoint flowcharts.

The document was last synced at ~14,377 HTML lines. The HTML had grown to 17,708 lines (+3,331 lines, +23%). This produced systemic line-number drift in the F6 Function Reference Table — all 30 entries were stale.

**Action taken:** F6 Function Reference Table fully re-verified against live HTML. All 30 original entries corrected plus 12 new entries added (`_magicTierAllowed`, `_rollD100Loot`, `_overlayPlayerAttack`, `_storyEnemyTurn`, `storyShortRest`, `storyCharToggle`, `storyRenderCharSheet`, `_lu_applyGiftsAndFinish`, `_notoriety`, `_notorietyWeights`, `_weightedMonsterPick`, `_stalkedMonsterPick`). combat.md header updated to 17,708 / 2026-05-25.

---

### I. Findings Table

| # | Claim in combat.md | HTML evidence | Status |
|---|---|---|---|
| 1 | All F6 function table line numbers (30 entries) | Verified 2026-05-25 | ❌ ALL stale (see below) |
| 2 | `roll(sides)` at line 5319 | Actual: 5482 | ❌ Off by +163 |
| 3 | `rollN` / `rollNExploding` / `abilityMod` / `getProfBonus` group | All off by +163 | ❌ Systemic |
| 4 | `playerRoll()` / `doPlayerAttack()` / `applyCondition()` group | All off by +169 | ❌ Systemic |
| 5 | `rollMainDamage()` / `offhandRoll()` / `bonusRoll()` / `oppRoll()` group | All off by +175 | ❌ Systemic |
| 6 | `_calcPlayerAc()` at 8787 / `_storyRollInit()` at 8800 | Actual: 9536 / 9549 | ❌ Off by +749 |
| 7 | `_overlayFlee()` / `_storyFleeClean()` / `_storyFleeMutual()` group | All off by +796 | ❌ Systemic |
| 8 | `_storyEnterDeathSaves()` / death save group | Off by +796 | ❌ Systemic |
| 9 | `storyShowOutcome()` at 13200 / `storyApplyOutcome(won)` at 13209 | Actual: 16315 / 16324 | ❌ Off by +3115 |
| 10 | Duplicate `_storyRollInit()` row (appeared twice in old table) | Removed | ⚠ Duplicate removed |
| 11 | Action economy (1.5 AP), attack formula, damage formula | All correct — no formula drift | ✓ |
| 12 | Fighter Champion level table (Lv1–20 features, tattoo names) | Matches FIGHTER_FEATURES const | ✓ |
| 13 | Notoriety formula `level × 3 + floor(battlesWon / 2)` | `_notoriety()` at 17043 | ✓ |
| 14 | Notoriety weight table (6 brackets, 5 tiers) | `_notorietyWeights()` at 17048 | ✓ |
| 15 | Death save sequence (FL11 milepoints A–D) | `_storyEnterDeathSaves()` et al. | ✓ |
| 16 | Indomitable: Lv9+, reroll on fail, 1/long rest | `_storyRollDeathSave()` at 10669 | ✓ |
| 17 | ASI cascade (STR → atkBonus, CON → retroactive HP) | `_lu_applyGiftsAndFinish()` at 17489 | ✓ |
| 18 | Final Boss stats: AC22/HP300/ATK+12/3d8+6 | `BOSS_COMMANDER_AUROS` const | ✓ |
| 19 | `CONDITION_ADV` line 5831 (from `## Conditions` header) | Actual: line 5999 (SP4-corrected) | ✓ (SP4 corrected) |

### II. Root Cause

The drift has four distinct magnitudes (+163, +169–175, +749–796, +3115) because different layers of the codebase were inserted at different depths between the last sync (≈14,377 lines) and review (17,708 lines). The dice primitives drifted least; the story outcome functions drifted most, indicating the largest content additions landed after line ~13,000.

### III. Fix Applied

F6 Function Reference Table in combat.md: all line numbers corrected to verified values. 12 new entries added for functions listed in the Key Functions table but missing from the F6 table. combat.md header updated. **Status: ✅ 2026-05-25.** F6 table subsequently re-verified during SP4 (2026-05-26) after the annotation pass added 9 additional lines.

---

## §API-01 — mechanics.md Analysis

**File:** `mechanics.md` (1,117 lines — subsequently split into `mechanics-combat.md` + `mechanics-economy.md` per FC03)
**Category Group:** Game Design · Combat System · Economy · Progression · Persistence

### Abstract

`mechanics.md` was the primary API surface document for roll2hit's simulation engine. It documented two behavioral modes (Battle Mode, Story Mode), the action economy (1.5 AP system), the loot pipeline (`_D100_TABLE`), the vendor economy (5 nodes × 3 item categories), the level-up chain (Fighter Champion, 1–20), and the save/load architecture (`localStorage`, two-key). This review records 36 comparison points across five categories evaluating `mechanics.md` against `roll2hit-v3.html` for accuracy, completeness, and sync parity.

**Key outcome:** FC03 (split into `mechanics-combat.md` + `mechanics-economy.md`) was recommended and completed on 2026-05-25.

---

### I. Data Architecture

```
S_story (localStorage)
  ├── Combat state:   hp/hpMax, pendingBattle, battleTurn, battleRound
  ├── Progression:    xp, level, abilityScores, surgeCharges, indomitableCharges
  ├── Economy:        gold, inventory[], equipped{Shield/Weapon/MainWeapon}
  ├── Map state:      currentCode, visited{}, defeatedBattles{}
  ├── Quest state:    quests{}, ebReturnsCompleted{}, ebNegotiatedPayments{}
  └── Narrative:      npcFavorability{}, ngPlusRun, frobergerLastEntryRead, journalEntriesRead[]
```

Two `localStorage` keys:
```
r2h_autosave    ← storyAutoSave()         every move / battle / levelup / purchase
r2h_checkpoint  ← storySaveCheckpoint()   on inn sleep only
```

No versioning field — `Object.assign` merge with `_S_DEFAULTS()` on load provides forward compatibility.

---

### II. Game Design Category (Points 1–10)

| # | Claim in mechanics.md | HTML evidence | Status |
|---|---|---|---|
| 1 | Reward formula: `floor(0.1 × AC × maxHP)` for HP healed and gold dropped | `storyApplyOutcome()` kill path | ✓ |
| 2 | XP formula: `enemy AC × enemy maxHP` | `_checkLevelUp()` trigger | ✓ |
| 3 | Level 20 cap = 195,000 XP; `XP_LEVELS[20]` returns `undefined` (Level 21 open) | `XP_LEVELS` at line 8608 | ✓ |
| 4 | 1.5 AP system: 1.0 main + 0.5 bonus; two Flee paths (⚠ mutual, ✓ clean) | `doPlayerAttack()` / `oppRoll()` button logic | ✓ |
| 5 | `usedRealAttack` gates 🗡 Offhand; wimper → offhand exploit blocked | `S_story.usedRealAttack` state field | ✓ |
| 6 | Auto-Damage ON by default; damage applied before victory overlay | `storyApplyOutcome()` | ✓ |
| 7 | Notoriety formula: `level × 3 + floor(battlesWon / 2)`; 5-bracket tier weight table | `_notoriety()` — no line ref cited in mechanics.md | ⚠ |
| 8 | Corridor encounter: `min(95, 10 + notoriety × 1.5 + activeQuests × 4)` | Corridor encounter logic | ✓ |
| 9 | Stealth roll: d20 vs random DC 5–16 (25–80% pass rate) | `storyCommitBattle()` stealth tab | ✓ |
| 10 | Condition costs: Feint Scroll 1,000gp → Basilisk Eye Flask 5,000gp | `CONDITION_GOLD` const | ✓ |

---

### III. Combat System Category (Points 11–20)

| # | Function | HTML line | Status in mechanics.md |
|---|---|---|---|
| 11 | `roll()` / `rollN()` dice primitives | 5482 / 5486 | ⚠ Not named — underlie all dice results |
| 12 | `abilityMod()` | 5505 | ⚠ Not named |
| 13 | `getProfBonus()` | 5509 | ⚠ Not named — formula says "proficiencyBonus" without naming the function |
| 14 | `getAtkAbilityMod()` | 5514 | ⚠ Not named |
| 15 | `doPlayerAttack()` | 6084 | ⚠ Not named — attack flow documented but function anonymous |
| 16 | `rollInitiative()` | 6152 | ⚠ Not named; HTML refs `_tomeInit = _tomeBonuses().initiative` (undocumented) |
| 17 | `rollDeathSave()` | 6212 | ⚠ Not named; HTML refs `_kingsSealBonus` + `_tomeBonuses()` affecting death saves (undocumented) |
| 18 | `offhandRoll()` | 6374 | ⚠ F6 scope — belongs in combat.md, not mechanics.md F4 |
| 19 | `oppRoll()` | 6596 | ⚠ F6 scope; 1.2s delay IS documented |
| 20 | `newCombat()` | 6682 | ⚠ Not named; pre-battle chain flow is documented |

**Note:** The 7 "function unnamed" results in Points 11–20 are scope-split findings, not errors. `doPlayerAttack()`, `offhandRoll()`, `oppRoll()`, and `newCombat()` belong to F6 (combat.md scope). The dice primitives (`roll()`, `abilityMod()`, `getProfBonus()`) belong to a utility layer not assigned to any current doc.

---

### IV. Economy Category (Points 21–28)

| # | Claim | HTML line | Status |
|---|---|---|---|
| 21 | `VENDOR_NODES`: BA/MQ/SF/IS/BK (5 nodes) | 5393 | ✓ (no line ref cited in mechanics.md) |
| 22 | `_D100_TABLE` total weight = 100; `LOOT_TABLE` is dead code | `_rollD100Loot()` line 8714 | ✓ |
| 23 | `_magicTierAllowed(magic)`: `level >= magic × 5` | line 8683 | ✓ |
| 24 | `_autoSellDuplicates()`: idempotent per node via `lastAutoSellNode` | line 8219 | ✓ Named in F4 table |
| 25 | Potion pricing: ~3× per tier, tied to exponential HP growth | `POTION_TIERS` | ✓ Design intent documented |
| 26 | `_renderPachelbelSpecials()`: S51 act-gated, S46 Dear Friend, friendly rotating | BA vendor section | ✓ Named correctly |
| 27 | `_rollMonsterWeaponDrop(dmgDie)`: filtered by die ≤ dmgDie | line 8762 | ✓ Named in F4 table |
| 28 | `MONSTER_DROPS`: 8 creature categories, sell range 4–150gp | `MONSTER_DROPS` const | ✓ |

---

### V. Progression Category (Points 29–33)

| # | Claim | HTML line | Status |
|---|---|---|---|
| 29 | `_checkLevelUp()` recurses for multi-level gains | 9655 | ✓ Named, flow documented |
| 30 | `_lu_applyGiftsAndFinish()` at line 14233 | 14233 | ✓ Correct line reference |
| 31 | ASI levels {4,6,8,12,14,16,19}; d6 on `_ASI_TABLE`; CON delta → retroactive HP | `_ASI_LEVELS` Set | ✓ |
| 32 | Bonus HP on milestone levels 7/10/13/18; feature names match FIGHTER_FEATURES | `FIGHTER_FEATURES` | ✓ |
| 33 | Tattoo schema inline: `{type, lvl, name, icon, hpRoll, bonusHpRoll}` | `S_story.tattoos` | ⚠ Partial — F4 table at doc bottom adds `asiChanges`, `goldGift` |

---

### VI. Persistence Category (Points 34–36)

| # | Claim | Status |
|---|---|---|
| 34 | Two-key localStorage: autosave (every move) + checkpoint (inn sleep only) | ✓ |
| 35 | No versioning field; `Object.assign` merge for forward compatibility | ✓ Design decision documented |
| 36 | NG+ preserves `npcFavorability`, `pitPerks`, `ngPlusRun`; all other state reset | ✓ Matches `storyNewGamePlus()` |

---

### VII. Summary Assessment

| Category | Points | ✓ Accurate | ⚠ Gap |
|---|---|---|---|
| Game Design | 10 | 9 | 1 (notoriety line ref) |
| Combat System | 10 | 3 | 7 (dice primitives unnamed; scope-split) |
| Economy | 8 | 7 | 1 (VENDOR_NODES line ref) |
| Progression | 5 | 4 | 1 (tattoo schema partial) |
| Persistence | 3 | 3 | 0 |
| **Total** | **36** | **26** | **10** |

**Structural finding:** mechanics.md's F4 table was comprehensive for economy/vendor functions but explicitly excluded combat.md scope (F6). The 7 "function unnamed" gaps in Combat were scope-split findings — those functions live in combat.md's API surface. True gaps: notoriety line ref, VENDOR_NODES line ref, tattoo schema inconsistency.

**FC03 recommendation confirmed:** The mechanics.md split into `mechanics-combat.md` + `mechanics-economy.md` is natural — F4 (economy) and F6 (combat) were already separated in the document. Splitting makes the scope boundary explicit and eliminates scope-split confusion. **Completed 2026-05-25.**

**Undocumented mechanic noted:** `_tomeBonuses().initiative` at line 6152 and `_kingsSealBonus` at line 6212 affect initiative and death saves respectively. Neither appeared in mechanics.md. These belong in the combat doc surface (combat.md or mechanics-combat.md).

---

### VIII. Flowchart — Battle Resolution Pipeline

```
PRE-BATTLE                         BATTLE FOCUS                   POST-BATTLE
==========                         ============                   ===========
storyPreBattle(node)               Round start (1.5 AP)          storyApplyOutcome(won)
  ├─ CONDITION_ITEMS panel         ├─ ⚔ Attack (1.0 AP)            ├─ Won:
  ├─ stealth tab (d20 vs DC 5-16) │    doPlayerAttack()            │    defeatedBattles[code]=true
  └─ Retreat (safe) available      │    ├─ hit → auto-damage        │    XP += AC × maxHP
                                   │    └─ bonus phase opens         │    _checkLevelUp()
storyCommitBattle()                ├─ 😬 Wimper (1.0 AP)           │    _rollD100Loot()
  ├─ gold deducted                 │    bonus phase opens           ├─ Lost:
  ├─ pendingBattle written         ├─ Bonus phase (0.5 AP)         │    pendingBattle retained
  └─ CONDITION_ADV applied         │    ├─ 🗡 Offhand (usedRealAtk) │    respawn from checkpoint
                                   │    ├─ 🧪 Potion
newCombat()                        │    ├─ 📜 Spell Scroll (ADV)
  └─ Battle Focus overlay renders  │    ├─ 💥 Flashbang (ADV)
                                   │    ├─ 🛡 Shield (equip)
                                   │    ├─ 🏃 Flee ✓ (clean)
                                   │    └─ 😬 Pass bonus
                                   └─ Enemy turn (1.2s delay)
                                        oppRoll()
```

---

### IX. Flowchart — Loot Pipeline

```
_rollD100Loot()
  │
  ├─ [roll d100, up to 3 attempts]
  │
  └─ _d100Result(roll)   ← walks _D100_TABLE by cumulative weight (total=100)
       ├─ potion_*   → push to inventory
       ├─ scroll     → Spell Scroll (sell:50)
       ├─ flashbang  → Flashbang (sell:75)
       ├─ gold       → 50–249gp added directly to S_story.gold
       ├─ dagger     → _magicTierAllowed() + not owned → push
       └─ mainweapon → _magicTierAllowed() + not owned → push
             └─ [pool empty or tier blocked → retry; after 3 fails → Minor Potion fallback]

[Next node entry]
  └─ _autoSellDuplicates()  (idempotent: skips if lastAutoSellNode === currentCode)
       ├─ main weapons: keep equipped + best magicBonus per base key; sell rest
       ├─ daggers:      keep equipped + best atkBonus; sell rest
       └─ shields:      keep equipped + best acBonus; sell rest
```

---

### X. File References

| File | Location | Content |
|------|----------|---------|
| `roll2hit-v3.html` | 5393 | `VENDOR_NODES` Set (BA/MQ/SF/IS/BK) |
| `roll2hit-v3.html` | 5482–5486 | `roll()` / `rollN()` dice primitives |
| `roll2hit-v3.html` | 5505–5533 | `abilityMod()` / `getProfBonus()` / `getAtkAbilityMod()` / `getDmgMod()` |
| `roll2hit-v3.html` | 5999 | `CONDITION_ADV` (SP4-corrected) |
| `roll2hit-v3.html` | 6084 | `doPlayerAttack()` |
| `roll2hit-v3.html` | 6152 | `rollInitiative()` — includes `_tomeInit = _tomeBonuses().initiative` |
| `roll2hit-v3.html` | 6212 | `rollDeathSave()` — includes `_kingsSealBonus` modifier |
| `roll2hit-v3.html` | 6374 / 6464 / 6596 | `offhandRoll()` / `bonusRoll()` / `oppRoll()` |
| `roll2hit-v3.html` | 6682 | `newCombat()` |
| `roll2hit-v3.html` | 8219 | `_autoSellDuplicates()` |
| `roll2hit-v3.html` | 8608 | `XP_LEVELS` (20-entry array; max 195,000 at L20) |
| `roll2hit-v3.html` | 8683 / 8708 / 8714 / 8762 | `_magicTierAllowed()` / `_d100Result()` / `_rollD100Loot()` / `_rollMonsterWeaponDrop()` |
| `roll2hit-v3.html` | 9599 / 9655 | `_showLevelUpModal()` / `_checkLevelUp()` |
| `roll2hit-v3.html` | 13007 | `storyPreBattle()` |
| `roll2hit-v3.html` | 14233 | `_lu_applyGiftsAndFinish()` |
| `mechanics-combat.md` | §Battle Mode | 1.5 AP system, XP formula, loot table, flee chain |
| `mechanics-economy.md` | §Story Mode | Vendor, save system, items |
| `mechanics-economy.md` | §F4 Function Reference | Economy + pre-battle functions |
| `combat.md` | F6 scope | `doPlayerAttack()`, `offhandRoll()`, `oppRoll()`, `newCombat()` — F6 scope |

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](../LICENSE) for full text.*
