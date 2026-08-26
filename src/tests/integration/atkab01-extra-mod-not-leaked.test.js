// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §ATKAB-01 — the dice roller's extra-modifier field is read by every story swing.
//
// `getAtkAbilityMod()` ends with `parseInt(#atk-extra-mod.value) || 0` and is called
// by seven sites: three roller paths, `_overlayPlayerAttack`, `_overlayOffhandAttack`,
// `_storyFleeMutual`'s free attack, and the mod readout. The two story→simulator syncs
// write level, AC, max HP, all six ability scores, the finesse checkbox and the
// ability select — and neither has ever written `#atk-extra-mod`.
//
// So a value typed into the standalone simulator is added to every subsequent story
// attack roll, and no story surface shows it: `storyRenderCharSheet` derives its
// printed bonus from `_storyAtkAbility()`, which does not read the DOM at all. That
// is the §AUDIT-03ae shape again — two surfaces, each individually defensible,
// disagreeing because one of them reads a control the other cannot see.
//
// The contract this pins: entering a story battle, or opening the story character
// sheet, resets the roller's extra modifier to zero, and the sheet's printed total
// is what the engine rolls REGARDLESS of what the roller was left at.

const { test, expect } = require('@playwright/test');
const { seedAndLoad } = require('./helpers.js');

const SCORES = { str:16, dex:12, con:14, int:10, wis:12, cha:8 };

async function withExtraMod(page, extra, open) {
  return page.evaluate(([scores, extra, open]) => {
    S_story.abilityScores = scores;
    S_story.level = 5;
    S_story.equippedMainWeapon =
      { name:'Longsword', icon:'⚔', type:'weapon', die:8, count:1, magicBonus:0, sell:45 };
    S_story.pendingBattle = { nodeCode:'BOO', key:'goblin' };
    S_story.active = true;

    document.getElementById('atk-extra-mod').value = String(extra);
    syncCharFromUI();

    if (open === 'battle') { try { _showBattleOverlay(); } catch (e) {} }
    else { try { switchSheet('sheet-story'); storyCharToggle(); } catch (e) {} }

    storyRenderCharSheet();
    const printed = document.querySelector('#char-sheet-body').textContent
      .match(/Attack Bonus([+-]\d+) \(/);
    const lvlAtk = _tomeBonuses().atk + _lakeMagicBonuses().atk;
    return {
      field:   document.getElementById('atk-extra-mod').value,
      printed: Number(printed[1]),
      rolled:  getAtkAbilityMod() + (S.weapon.prof ? getProfBonus() : 0) + lvlAtk,
    };
  }, [SCORES, extra, open]);
}

test.describe('§ATKAB-01 — a roller-only control cannot reach a story roll', () => {

  for (const open of ['battle', 'sheet']) {
    test(`entering via ${open} zeroes the extra modifier the roller was left at`, async ({ page }) => {
      await seedAndLoad(page);
      const r = await withExtraMod(page, 7, open);
      expect(r.field).toBe('0');
      expect(r.rolled).toBe(r.printed);
    });
  }

  test('a negative value cannot survive either, and the sheet still agrees', async ({ page }) => {
    await seedAndLoad(page);
    const r = await withExtraMod(page, -5, 'battle');
    expect(r.field).toBe('0');
    expect(r.rolled).toBe(r.printed);
  });

  test('the two syncs reach the same roll, so neither entry point is the privileged one', async ({ page }) => {
    await seedAndLoad(page);
    const viaBattle = await withExtraMod(page, 9, 'battle');
    const viaSheet  = await withExtraMod(page, 9, 'sheet');
    expect(viaBattle.rolled).toBe(viaSheet.rolled);
  });
});
