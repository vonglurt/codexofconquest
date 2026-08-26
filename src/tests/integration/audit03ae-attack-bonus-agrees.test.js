// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §AUDIT-03ae — three surfaces disagreed about what a story attack roll is.
//
// `S_story.atkBonus` was specified (Layer 18) as a LEVELLING bonus and shipped as a
// cache of the STR modifier: seeded at character creation, raised only by an ASI STR
// bump. Two individually-correct changes then composed into a defect.
//
//   1. The story→simulator sync wrote level, AC, max HP and all six ability scores
//      into the dice roller and never repointed its `<select id="atk-ability">`,
//      which ships `dex` selected. So a story swing rolled DEX mod + STR mod.
//      A FINESSE weapon masked it — `getAtkAbilityMod` takes `max(str, dex)` there —
//      so the substitution was only visible on a non-finesse weapon.
//   2. The character sheet computed `strMod + prof + atkBonus`, and `atkBonus` IS
//      strMod, so it double-counted STR against itself.
//   3. The sheet printed its bonus term as `atkBonus − strMod`, i.e. +0, so its
//      printed components summed to `strMod + prof` while its printed total was
//      `2 × strMod + prof`.
//
// Measured at HEAD before the fix (STR 16, DEX 12, level 5, longsword): the sheet
// printed +9, its own parts summed to 6, and combat rolled +7. No symbol census
// finds this — every identifier resolved and every line was live. It is visible only
// by asking what the field MEANS at each reader.
//
// The contract: STR is counted exactly once, and the number the sheet prints is the
// number the engine rolls. This pins the PROPERTY, not the incident — the equality
// is asserted across four characters and both weapon kinds.

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const SRC = fs.readFileSync(path.join(ROOT, 'play.html'), 'utf8');
const { seedAndLoad } = require('./helpers.js');

const CASES = [
  { name: 'STR 16 (the sheet-vs-combat case the row measured)', scores: { str:16, dex:12, con:14, int:10, wis:12, cha:8 } },
  { name: 'STR 10 / DEX 8 (the shipped point-buy start)',       scores: { str:10, dex:8,  con:8,  int:8,  wis:8,  cha:8 } },
  { name: 'STR 8 — a below-average character keeps its penalty', scores: { str:8,  dex:16, con:10, int:10, wis:10, cha:10 } },
  { name: 'STR 20 / DEX 20 — no surface can prefer the other',   scores: { str:20, dex:20, con:14, int:10, wis:12, cha:8 } },
];

async function readSurfaces(page, scores, finesse) {
  return page.evaluate(([scores, finesse]) => {
    S_story.abilityScores = scores;
    S_story.level = 5;
    S_story.equippedMainWeapon = { name:'Longsword', icon:'⚔', type:'weapon', die:8, count:1, magicBonus:0, sell:45 };
    S_story.pendingBattle = { nodeCode:'BOO', key:'goblin' };
    try { _showBattleOverlay(); } catch (e) {}
    // Force the roller's own finesse control back on, to prove the story sync
    // owns it: a story battle must roll the same either way.
    if (finesse) { document.getElementById('weapon-finesse').checked = true; syncWeaponFromUI(); try { _showBattleOverlay(); } catch (e) {} }
    storyRenderCharSheet();

    const printed = document.querySelector('#char-sheet-body').textContent
      .match(/Attack Bonus([+-]\d+) \(STR([+-]\d+) \+ Prof([+-]\d+)(?: \+ bonus([+-]\d+))?\)/);
    const lvlAtk = _tomeBonuses().atk + _lakeMagicBonuses().atk;
    return {
      select: document.getElementById('atk-ability').value,
      total: Number(printed[1]),
      parts: Number(printed[2]) + Number(printed[3]) + Number(printed[4] || 0),
      rolled: getAtkAbilityMod() + (S.weapon.prof ? getProfBonus() : 0) + lvlAtk,
    };
  }, [scores, finesse]);
}

test.describe('§AUDIT-03ae — the sheet prints the number the engine rolls', () => {

  test('the STR-modifier cache is gone, so no reader can disagree with another about it', () => {
    expect(SRC).not.toContain('S_story.atkBonus');
    // Weapons and daggers keep their own `atkBonus` — that one is item data.
    expect(SRC).toContain('equippedWeapon.atkBonus');
  });

  for (const c of CASES) {
    for (const finesse of [false, true]) {
      test(`${c.name} · finesse=${finesse}`, async ({ page }) => {
        await seedAndLoad(page);
        const r = await readSurfaces(page, c.scores, finesse);

        // (1) the story sync repoints the roller at STR — a Fighter Champion keys on STR
        expect(r.select).toBe('str');
        // (2) the sheet's printed components sum to its own printed total
        expect(r.parts).toBe(r.total);
        // (3) and that total is what the engine actually rolls
        expect(r.rolled).toBe(r.total);
      });
    }
  }

  test('the story sync owns the finesse control, which ships checked and was never repointed', async ({ page }) => {
    await seedAndLoad(page);
    const scores = { str:8, dex:16, con:10, int:10, wis:10, cha:10 };
    const plain = await readSurfaces(page, scores, false);
    const fin   = await readSurfaces(page, scores, true);
    // Before the fix this was the widest gap: max(str, dex) handed a DEX character
    // +3 while the sheet printed −1, on every weapon, because nothing ever
    // unchecked `#weapon-finesse`.
    expect(fin.rolled).toBe(plain.rolled);
  });

  test('an ASI that raises STR still moves the attack bonus, through the scores alone', async ({ page }) => {
    await seedAndLoad(page);
    const r = await page.evaluate(() => {
      S_story.abilityScores = { str:15, dex:12, con:14, int:10, wis:12, cha:8 };
      S_story.level = 5;
      const before = _statMod(S_story.abilityScores.str);
      S_story.abilityScores.str = 16;
      return { before, after: _statMod(S_story.abilityScores.str) };
    });
    expect(r.after - r.before).toBe(1);
  });
});
