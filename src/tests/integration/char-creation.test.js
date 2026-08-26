// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §CHAR-01-A — one-time point-buy at character creation.
//
// GREP-BEFORE-BUILDING: the BACKLOG spec (promoted from potential.md §POT-C1) framed this as a
// build with a "point-buy vs standard array" design call. Measured live, the feature is ALREADY
// SHIPPED and wired: btn-continue-new / btn-gameover-new → _showCharCreate() → the "⚔ Choose Your
// Origin" modal (27-point D&D point-buy, custom + hard tabs) → btn-charcreate-begin → storyNewGame.
// It just had NO test. This locks the shipped contract so a regression surfaces on sight.
const { test, expect } = require('@playwright/test');

test.describe('§CHAR-01-A — point-buy character creation (already shipped; contract lock)', () => {
  test('point-buy constants are the standard 27-point budget with the canonical cost curve', async ({ page }) => {
    await page.goto('/play.html');
    const r = await page.evaluate(() => ({
      budget: CC_BUDGET,
      cost: _CC_COST,
      cost8: _ccCost(8), cost13: _ccCost(13), cost14: _ccCost(14), cost15: _ccCost(15),
      // a legal all-13/12 style spread stays within budget; a maxed spread does not
      spentDefault: (() => { _cc_scores = { str:10, dex:10, con:10, int:8, wis:8, cha:8 }; return _ccSpent(); })(),
    }));
    expect(r.budget, 'standard point-buy budget').toBe(27);
    expect(r.cost, 'cost curve for scores 8..15').toEqual([0,1,2,3,4,5,7,9]);
    expect(r.cost8).toBe(0);
    expect(r.cost13).toBe(5);
    expect(r.cost14).toBe(7);   // 14/15 cost 2 points each (the premium)
    expect(r.cost15).toBe(9);
    expect(r.spentDefault, 'the default spread is affordable within budget').toBeLessThanOrEqual(27);
  });

  test('the modal exists with custom + hard origins and a begin button', async ({ page }) => {
    await page.goto('/play.html');
    await page.evaluate(() => _showCharCreate());
    await expect(page.locator('#story-charcreate-modal')).toHaveClass(/visible/);
    await expect(page.locator('#charcreate-tabs [data-mode="custom"]')).toHaveCount(1);
    await expect(page.locator('#charcreate-tabs [data-mode="hard"]')).toHaveCount(1);
    await expect(page.locator('#btn-charcreate-begin')).toBeVisible();
  });

  test('custom point-buy: Begin writes the chosen abilityScores into a fresh game and derives ATK/HP', async ({ page }) => {
    await page.goto('/play.html');
    await page.evaluate(() => {
      _showCharCreate();
      _cc_mode = 'custom';
      _cc_scores = { str:14, dex:13, con:14, int:10, wis:12, cha:8 };
    });
    await page.locator('#btn-charcreate-begin').click();
    const r = await page.evaluate(() => ({
      scores: S_story.abilityScores, active: S_story.active,
      hasAtkCache: 'atkBonus' in S_story,
      atk: _statMod(S_story.abilityScores.str), hpMax: S_story.hpMax, hp: S_story.hp,
    }));
    expect(r.scores).toEqual({ str:14, dex:13, con:14, int:10, wis:12, cha:8 });
    expect(r.active).toBe(true);
    // §AUDIT-03ae — the ATK bonus is DERIVED from STR at every reader, not cached on
    // `S_story`. The cache existed, drifted from `_statMod` by a silent `Math.max(0, …)`,
    // and let three surfaces disagree about one number.
    expect(r.hasAtkCache, 'S_story.atkBonus is gone — the STR modifier is derived').toBe(false);
    expect(r.atk, 'ATK bonus = floor((STR-10)/2) = +2').toBe(2);
    expect(r.hpMax, 'L1 fighter HP = 10 + CON mod (+2)').toBe(12);
    expect(r.hp).toBe(r.hpMax);
  });

  test('hard origin: Begin uses the fixed low array, not the point-buy spread', async ({ page }) => {
    await page.goto('/play.html');
    await page.evaluate(() => {
      _showCharCreate();
      _cc_mode = 'hard';
      _cc_scores = { str:15, dex:15, con:15, int:15, wis:15, cha:15 }; // must be IGNORED in hard mode
    });
    await page.locator('#btn-charcreate-begin').click();
    const scores = await page.evaluate(() => S_story.abilityScores);
    expect(scores, 'hard origin ignores _cc_scores and ships the fixed array').toEqual(
      { str:10, dex:8, con:8, int:8, wis:8, cha:8 });
  });
});
