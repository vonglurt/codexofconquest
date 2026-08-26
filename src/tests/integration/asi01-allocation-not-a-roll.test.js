// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §ASI-01 — the ability score improvement is chosen, not rolled, and six docs said
// otherwise because a table with zero readers stood in the file describing a d6.
//
// `_ASI_TABLE` — six entries, Might / Endurance / Agility / Power / Speed / Guard —
// was declared and never read. Its own comment called it a "d6 ASI roll table", and
// mechanics-combat.md, design/mechanics.md, mechanics-economy.md, design/index.md
// and spec-engine.md all documented the roll as the live mechanic. What ships is a
// player allocation: six `.lu-asi-btn` buttons, `_lu_pending.asiRemaining` starting
// at 2, and a hard ceiling of 20 per ability.
//
// The premise mattered beyond the docs: §WEAP-FIN cited "the table is rolled, so a
// player need not even choose it" as corroboration that DEX rises without player
// intent. That corroboration was false. (Its load-bearing half — a DEX 15 / STR 8
// character is purchasable under the 27-point buy — is unaffected and still stands.)
//
// This pins BOTH halves: the dead table stays deleted, and the ASI stays a choice.

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const SRC = fs.readFileSync(path.join(ROOT, 'play.html'), 'utf8');
const { seedAndLoad } = require('./helpers.js');

test.describe('§ASI-01 — the ASI is an allocation', () => {

  test('the d6 table is gone and nothing reintroduces it', () => {
    expect(SRC).not.toContain('_ASI_TABLE');
    expect(SRC).not.toContain('d6 ASI roll table');
    // The levels themselves are read by _showLevelUpModal and stay.
    expect(SRC).toContain('const _ASI_LEVELS');
  });

  test('an ASI level opens with two points to spend across six abilities', async ({ page }) => {
    await seedAndLoad(page);
    const r = await page.evaluate(() => {
      S_story.abilityScores = { str:16, dex:12, con:14, int:10, wis:12, cha:8 };
      S_story.level = 4;
      S_story.hpMax = 40; S_story.hp = 40;
      _showLevelUpModal(4);
      return {
        isASI: _lu_pending.isASI,
        remaining: _lu_pending.asiRemaining,
        buttons: [...document.querySelectorAll('.lu-asi-btn')].map(b => b.dataset.stat),
      };
    });
    expect(r.isASI).toBe(true);
    expect(r.remaining).toBe(2);
    expect(r.buttons).toEqual(['str','dex','con','int','wis','cha']);
  });

  test('a non-ASI level grants no points at all', async ({ page }) => {
    await seedAndLoad(page);
    const r = await page.evaluate(() => {
      S_story.abilityScores = { str:16, dex:12, con:14, int:10, wis:12, cha:8 };
      S_story.level = 5; S_story.hpMax = 40; S_story.hp = 40;
      _showLevelUpModal(5);
      return { isASI: _lu_pending.isASI, remaining: _lu_pending.asiRemaining };
    });
    expect(r).toEqual({ isASI: false, remaining: 0 });
  });

  test('the ceiling is 20 per ability, so a maxed stat cannot take a point', async ({ page }) => {
    await seedAndLoad(page);
    const r = await page.evaluate(() => {
      S_story.abilityScores = { str:20, dex:12, con:14, int:10, wis:12, cha:8 };
      S_story.level = 6; S_story.hpMax = 40; S_story.hp = 40;
      _showLevelUpModal(6);
      const byStat = {};
      document.querySelectorAll('.lu-asi-btn').forEach(b => { byStat[b.dataset.stat] = b.disabled; });
      return byStat;
    });
    expect(r.str).toBe(true);
    expect(r.dex).toBe(false);
  });

  test('the seven ASI levels are exactly the documented set', async ({ page }) => {
    await seedAndLoad(page);
    const levels = await page.evaluate(() => [..._ASI_LEVELS].sort((a, b) => a - b));
    expect(levels).toEqual([4, 6, 8, 12, 14, 16, 19]);
  });
});
