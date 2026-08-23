<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson and Claude -->

# Architectural Cleanup Report: plan.md Compaction — Layers 14 through 17

**Roll2Hit v3 — Engineering Change Documentation**  
**Series:** Implementation Audit and Specification Archive  
**Classification:** Software Engineering · Document Management · Spec Lifecycle  
**Date:** 2026-05-21  
**Author:** Roll2Hit Development Record  
**Status:** Complete — archived content verified against `roll2hit-v3.html` (8,110 lines)

---

## Abstract

This report documents the compaction of `plan.md` following the completion of Layers 14 through 17 of *The Shattered Codex* narrative engine. `plan.md` accumulated 1,358 lines of implementation specification across these four layers. All specified features have been implemented and verified in `roll2hit-v3.html`. This report serves as:

1. A **change record** — what was removed from `plan.md` and why
2. A **specification archive** — a summary of every removed section with key decisions
3. A **verification manifest** — confirmation that each removed spec item is reflected in live code
4. A **bug correction log** — post-implementation fixes applied during code review

The new `plan.md` retains the completed-layer reference table, constants quick reference, state field reference, and a Layer 18+ placeholder.

---

## I. Rationale for Compaction

See `lab-report-plan-cleanup-v13.md` §I for the standing rationale. The same principle applies: once a layer is verified in live code, the detailed pseudo-code in plan.md becomes redundant noise. The correct homes for completed-layer documentation are: the code itself, the lab reports, and the spec family (`mechanics.md`, `spec-*.md`).

---

## II. Removed Sections — Inventory

### Layer 14 — Game Loop Overlay Separation (~120 lines)

| Section | Content |
|---|---|
| Root cause analysis | Why `#main-body` was leaking into story battles; table of correct states per mode |
| L14-A | `_showBattleOverlay()` change: `display:none` for `#main-body` |
| L14-B | Advanced/Refocus symmetric toggle — both touch `#main-body` |
| L14-C | `#practice-badge` HTML + CSS + show/hide in `storyEnter/storyExit/_showBattleOverlay` |
| L14-D | `⚙ Advanced` → `⚙ God Mode` rename |
| Implementation table | L14-A through L14-D status |

### Layer 15 — Story Death Saves & Corpse Quests (~425 lines)

| Section | Content |
|---|---|
| Existing intercept point | Current game-over block in `_storyEnemyTurn()` |
| Design — Death Save Sequence | Mechanic rules (d20, NAT 20 = 2 succ, NAT 1 = 2 fail, outcome at 3) |
| L15-A | `S_story.corpsesQuests` + `storyDeathSaves` field additions |
| L15-B | `STARTER_DAGGER` const definition |
| L15-C | `#sbo-death-save-panel` HTML + CSS |
| L15-D | `_storyEnterDeathSaves()` pseudo-code |
| L15-E | `_storyRollDeathSave()` pseudo-code |
| L15-F | `_storyDeathSaveCrawl()` pseudo-code |
| L15-G | `_storyDeathSaveFall()` pseudo-code — critical item protection |
| L15-H | Corpse chip in `storyRender()` |
| L15-I | `_storyRetrieveCorpse(questId)` pseudo-code |
| L15-J | Corpse quests in `storyRenderQuests()` |
| L15-K | `_storyEnemyTurn()` HP=0 intercept replacement |
| Design notes | Shard/key protection rationale; no-free-attack on crawl; independent corpse quest queuing |
| Implementation table | L15-A through L15-K status |

### Layer 16 — Battle Condition Rounds, DIS Display & Spell Scrolls (~180 lines)

| Section | Content |
|---|---|
| Design | Condition round countdown design; DIS badge rationale; Spell Scroll DC formula; AC−2 rationale |
| L16-A | `conditionRoundsLeft` + `spellAdvantageReady` field additions |
| L16-B | Condition round decrement in `_storyEnemyTurn()` |
| L16-C | `_updateBattleOverlay()` condition + DIS display |
| L16-D | LOOT_TABLE update: 8× Minor + 2× Spell Scroll |
| L16-E | `_storyUseSpellScroll(invIdx)` + `_renderSboSpells()` |
| L16-F | `#sbo-spell-row` HTML + CSS |
| L16-G | `#sbo-init-note` spell ADV indicator |
| Implementation table | L16-A through L16-G status |

### Layer 17 — Full Action Economy, Shield Mechanic & Battle Clarity (~430 lines)

| Section | Content |
|---|---|
| Action economy design table | Full AP cost table for all actions |
| L17-A | `usedBonusAction` + `equippedShield` state additions; `usedBonusAction` reset in enemy turn |
| L17-B | `_storyAdvanceToBonus()` + `_playerHasBonusOptions()` |
| L17-C | Bonus action conversion: offhand, potion, spell |
| L17-D | Wimper button + `_storyWimper()` |
| L17-E | `_storyFleeClean()` + `_storyFleeMutual()` flee rework |
| L17-F | AP display row `#sbo-ap-row` |
| L17-G | `SHIELD_ITEMS` const + `_calcPlayerAc()` + `S.char.baseAc` snapshot |
| L17-H | `#sbo-shield-row` HTML + `_renderSboShield()` + `_storyUnequipShield()` |
| L17-I | `_disableSboActions()` full rewrite |
| L17-J | `.has-dis` CSS class on enemy block |
| L17-K | Spell ADV expiry in `_storyEnemyTurn()` |
| L17-L | `storyRenderInventory()` rewrite — 6-section ordered display |
| Implementation table | L17-A through L17-L status |

---

## III. Verification Manifest

### Layer 14 Verification

| Plan Item | Live Implementation | Verified |
|---|---|---|
| `#main-body.style.display = 'none'` in `_showBattleOverlay()` | Line ~5972: `document.getElementById('main-body').style.display = 'none'` | ✅ |
| `practice-badge.style.display = 'none'` in `_showBattleOverlay()` | Line ~5973 | ✅ |
| Advanced toggle reveals `#main-body` | `btn-sbo-advanced` click handler: `main-body.style.display = ''` | ✅ |
| Refocus toggle hides `#main-body` | `btn-sbo-refocus` click handler: `main-body.style.display = 'none'` | ✅ |
| `#practice-badge` HTML | Line ~1803: `<span id="practice-badge">⚙ PRACTICE</span>` | ✅ |
| `#practice-badge` CSS | Line ~47 | ✅ |
| `storyEnter()` hides badge | Line ~5868 | ✅ |
| `storyExit()` shows badge | Line ~6731 | ✅ |
| `⚙ God Mode` button label | Line ~2732 | ✅ |

### Layer 15 Verification

| Plan Item | Live Implementation | Verified |
|---|---|---|
| `S_story.corpsesQuests` | Both `S_story` init and `_S_DEFAULTS()` | ✅ |
| `S_story.storyDeathSaves` | Both init locations; `{ successes:0, failures:0, active:false }` | ✅ |
| `STARTER_DAGGER` const | Line ~5922: `{ name:'Rusted Dagger', icon:'🗡', type:'item', sell:0, code:'spawn' }` | ✅ |
| `#sbo-death-save-panel` HTML | Lines ~2818–2830; 6 pip divs, result div, roll button | ✅ |
| `_storyEnterDeathSaves()` | Line ~6577: swaps action row → death save panel; sets badge to `☠ DYING` | ✅ |
| `_storyRollDeathSave()` | Line ~6591: d20, NAT20=2succ, NAT1=2fail, branches to crawl/fall | ✅ |
| `_storyDeathSaveCrawl()` | Line ~6624: hp=1, clear battle, storyEnter(), restore action rows | ✅ |
| `_storyDeathSaveFall()` | Line ~6641: critTypes filter, corpseQuest creation, strip/respawn | ✅ |
| `Object.assign({}, STARTER_DAGGER)` on death | Line ~6662 | ✅ |
| `_storyRetrieveCorpse(questId)` | Line ~6688: splice by id, push items+gold to player | ✅ |
| Corpse chip in `storyRender()` | After SHORT REST chip loop | ✅ |
| `storyRenderQuests()` corpse section | `☠ Fallen Hero — Corpse Retrieval` heading + quest items | ✅ |
| `_storyEnemyTurn()` intercept | HP≤0 → `_storyEnterDeathSaves()` instead of `storyGameOver()` | ✅ |

### Layer 16 Verification

| Plan Item | Live Implementation | Verified |
|---|---|---|
| `S_story.conditionRoundsLeft` | Init + `_S_DEFAULTS()` + `_storyRollInit()` reset | ✅ |
| `S_story.spellAdvantageReady` | Init + `_S_DEFAULTS()` + `_storyRollInit()` reset | ✅ |
| Condition round decrement | `_storyEnemyTurn()` line ~6268: decrement, clear on 0 | ✅ |
| Spell ADV expiry | `_storyEnemyTurn()` line ~6276: clear + append to logMsg | ✅ |
| Condition display: rounds + DIS badge | `_updateBattleOverlay()` line ~5964: innerHTML with round str + `sbo-dis-badge` span | ✅ |
| `.has-dis` on enemy block | `_updateBattleOverlay()` adds/removes class from `.sbo-fighter.enemy` | ✅ |
| LOOT_TABLE: 8 Minor + 2 Spell | Line ~5899: 8 Minor, 2 Spell Scroll, 5 Healing, 3 Greater, 2 Superior | ✅ |
| `_renderSboSpells()` | Line ~6142: renders spell buttons from inventory; hides row when empty | ✅ |
| `_storyUseSpellScroll(invIdx)` | Line ~6158: bonus action guard, consume, d20 vs DC=AC−2, set flag | ✅ |
| `#sbo-spell-row` HTML | Line ~2790 | ✅ |
| `#sbo-init-note` spell indicator | `_updateBattleOverlay()`: appends `· 📜 Spell ADV ready!` | ✅ |
| Spell DC uses `baseAc` | `_renderSboSpells()` + `_storyUseSpellScroll()`: `S.char.baseAc \|\| S.char.ac` | ✅ |

### Layer 17 Verification

| Plan Item | Live Implementation | Verified |
|---|---|---|
| `S_story.usedBonusAction` | Init + `_S_DEFAULTS()` + `_storyRollInit()` + `_storyEnemyTurn()` reset | ✅ |
| `S_story.equippedShield` | Init + `_S_DEFAULTS()`; `null` default | ✅ |
| `_playerHasBonusOptions()` | Line ~6181: checks shield/offhand/spell/potion; always returns true (wimper) | ✅ |
| `_storyAdvanceToBonus()` | Line ~6193: calls `_updateBattleOverlay()`, logs bonus hint | ✅ |
| `_overlayPlayerAttack()` guard | `if (S_story.usedMainAttack) return;` at top | ✅ |
| Spell ADV applied before roll | `advState` resolved from stealth > spell > condition; `spellAdvantageReady` cleared at resolve | ✅ |
| `_overlayPlayerAttack()` → bonus phase | Routes to `_storyAdvanceToBonus()` instead of `setTimeout(_storyEnemyTurn)` | ✅ |
| `_overlayOffhandAttack()` bonus guard | `if (!S_story.usedMainAttack \|\| S_story.usedBonusAction) return;` | ✅ |
| `_overlayOffhandAttack()` sets `usedBonusAction` | `S_story.usedBonusAction = true` before enemy turn | ✅ |
| `_storyDrinkPotion()` bonus guard | `if (!S_story.usedMainAttack \|\| S_story.usedBonusAction) return;` | ✅ |
| `_storyDrinkPotion()` bonus trigger | Sets `usedBonusAction = true`, fires enemy turn | ✅ |
| Wimper button HTML | `#btn-sbo-wimper` in `#sbo-action-row` | ✅ |
| `_storyWimper()` | Line ~6472: logs, sets both flags, fires enemy turn at 700ms | ✅ |
| Wimper event listener | `btn-sbo-wimper` → `_storyWimper` | ✅ |
| `#sbo-ap-row` HTML | Line ~2778: ⚡ label + value + hint | ✅ |
| AP display in `_updateBattleOverlay()` | Updates `sbo-ap-value` (1.5/0.5/0) and `sbo-ap-hint` | ✅ |
| `_overlayFlee()` rework | Dispatches to `_storyFleeClean()` or `_storyFleeMutual()` based on `usedMainAttack` | ✅ |
| `_storyFleeClean()` | Line ~6420: sets `usedBonusAction`, clears battle, exits | ✅ |
| `_storyFleeMutual()` | Line ~6430: mutual free attacks, handles death/victory, exits | ✅ |
| Flee button label ⚠/✓ | `_disableSboActions()`: updates `textContent` and `title` | ✅ |
| `SHIELD_ITEMS` const | Line ~5932: Buckler (+1, cost:100, sell:60) + Heater Shield (+2, cost:250, sell:150) | ✅ |
| `_calcPlayerAc()` | Line ~5937: `baseAc + equippedShield.acBonus` | ✅ |
| `S.char.baseAc` snapshot in `_showBattleOverlay()` | Restores then snapshots; prevents AC stacking on re-entry | ✅ |
| `#sbo-shield-row` HTML | Line ~2791: hidden by default; shows equipped shield name + unequip button | ✅ |
| `_renderSboShield()` | Line ~6483: shows/hides row; disables unequip when not bonus phase | ✅ |
| `_storyUnequipShield()` | Line ~6494: bonus action guard; push to inventory; recalc AC; fire enemy turn | ✅ |
| Unequip event listener | `btn-sbo-unequip-shield` → `_storyUnequipShield` | ✅ |
| `_disableSboActions()` rewrite | Granular per-button gating: main/bonus/shield/forceDisable | ✅ |
| `.sbo-fighter.enemy.has-dis` CSS | Red border, gradient background, glow | ✅ |
| `storyRenderInventory()` 6-section rewrite | Equipped / Consumables / Quest Items / Shields / Trophies / Knowledge | ✅ |
| Shield vendor buy buttons | `#vendor-buy-section` + `.btn-buy-shield` data-tier attrs | ✅ |
| `storyBuyShield()` | Uses `s.cost` for purchase, `s.sell` for sell-back | ✅ |
| Shield event listeners | `.btn-buy-shield` → `storyBuyShield(tier)` | ✅ |
| `storyBuyPotion()` type fix | Potions get `type:'potion'`; Transmort keeps `type:'item'` | ✅ |

---

## IV. Post-Implementation Bug Corrections

The following issues were found and fixed during code review after Layer 16 and 17 implementation:

### Spell ADV Not Applied to Dice Roll (L16-E → L17-B correction)

**Problem:** `_overlayPlayerAttack()` computed `advState` before checking `spellAdvantageReady`, then only attempted to clear the flag after the roll. The spell scroll's advantage was never actually passed to `rollD20()`.

**Fix:** Resolved `advState` in priority order before the roll:
```js
if (S_story.surpriseAdvantage) {
  advState = 'adv'; S_story.surpriseAdvantage = false;
} else if (S_story.spellAdvantageReady) {
  advState = 'adv'; S_story.spellAdvantageReady = false;
} else {
  advState = resolveAdv(S.player.adv, S.opp.adv);
}
```

### Shield AC Stacking on Battle Re-Entry (L17-G correction)

**Problem:** `_showBattleOverlay()` ran `S.char.baseAc = S.char.ac` then `S.char.ac = _calcPlayerAc()`. On subsequent battle entries, `S.char.ac` already contained the shield bonus from the previous battle, causing `_calcPlayerAc()` to add it again (+2 becoming +4, etc.).

**Fix:** Restore from `baseAc` before snapshotting:
```js
if (S.char.baseAc) S.char.ac = S.char.baseAc;  // restore first
S.char.baseAc = S.char.ac;                       // then snapshot
S.char.ac = _calcPlayerAc();                     // then apply shield
```

### Purchased Potions in Two Inventory Sections

**Problem:** `storyBuyPotion()` used `type:'item'` for all purchases. The inventory renderer's quest items section matched `type === 'item'`, while consumables also matched by potion name. Potions appeared in both sections.

**Fix:** `storyBuyPotion()` now uses `type:'potion'` for healing potions, `type:'item'` for Transmort Scroll only.

### Empty Spell Row Shows Dashed Separator

**Problem:** `#sbo-spell-row` has a `border-top: 1px dashed #3a3a5a` CSS rule. When no spell scrolls are in inventory, `_renderSboSpells()` cleared the row but left it visible — showing a floating line with nothing under it.

**Fix:** `_renderSboSpells()` now sets `row.style.display = row.children.length ? '' : 'none'`.

### Shield `sell` Field Used as Purchase Price

**Problem:** `SHIELD_ITEMS` used `sell: 100/250`, and `storyBuyShield()` compared `S_story.gold < s.sell`. This created zero-cost arbitrage (buy and sell for the same price).

**Fix:** Added `cost` field (100/250 gp) for purchase; `sell` field (60/150 gp) for sell-back. `storyBuyShield()` uses `s.cost`.

### Spell Scroll DC Used Shield-Inflated AC

**Problem:** `_storyUseSpellScroll()` and `_renderSboSpells()` computed DC from `S.char.ac`, which includes the shield bonus. A warrior in plate + Heater Shield (AC 20) would face DC 18 instead of DC 16 (base).

**Fix:** Both functions now read `S.char.baseAc || S.char.ac` for the DC calculation.

---

## V. Files Modified by This Cleanup

| File | Change | Reason |
|---|---|---|
| `plan.md` | Reduced from 1,358 lines to ~90 lines | Compact reference; detailed specs archived here |
| `index.md` | Row 22 added (this report) | Index currency |
| `index.md` | Footer updated to reflect 8,110 lines, Layers 0–17 | Line count currency |

---

## VI. Notes for Future Development

When starting Layer 18, add a new `## Layer 18 — [Name]` section to `plan.md`. Follow the pattern from prior layers. When complete, run this compaction process again:

1. Verify each step against live code
2. Archive removed specs to the next cleanup report (`lab-report-plan-cleanup-v21.md` or similar)
3. Update `plan.md` with a completed-layer summary row
4. Update `index.md` footer

---

*Report written 2026-05-21*  
*Codebase: roll2hit-v3.html — 8,110 lines, Layers 0–17 complete*  
*plan.md: compacted from 1,358 → ~90 lines*  
*All removed specs verified as implemented before archival*  
*6 post-implementation bug corrections documented*


---

MIT License — roll2hit.com — Copyright (c) 2026 — Free to use, modify, and share.

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](LICENSE) for full text.*
