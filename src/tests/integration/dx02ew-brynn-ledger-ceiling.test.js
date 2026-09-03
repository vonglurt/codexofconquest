// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02ew — the inn ledger's ceiling is a balanced book, never a surplus.
//
// Two design documents say the same thing: §VII of lab-report-living-world.md — "the deficit
// can be brought to zero but not into surplus — Brynn keeps prices fair" — and world.md's
// "all three together bring the balance to exactly 0". The engine reached +1, and rendered
// that copper in green through a branch that exists to print `0 copper (balanced)`.
//
// The model is re-derived from BRYNN_MAINTENANCE_TASKS' own action() closures rather than
// from the three numbers written here, and every ordering is exercised, because the task
// offered is `gameDay % 3` — any of the three can be the one that closes the book.

const { test, expect } = require('@playwright/test');
const { seedAndLoad, dismissContinue } = require('./helpers.js');

const permutations = (xs) => xs.length <= 1 ? [xs]
  : xs.flatMap((x, i) => permutations([...xs.slice(0, i), ...xs.slice(i + 1)]).map(p => [x, ...p]));

test.describe('§DX-02ew — Brynn keeps prices fair', () => {

  test('every order of the three tasks lands on exactly 0, and none passes through surplus', async ({ page }) => {
    await seedAndLoad(page);
    const r = await page.evaluate((orders) => {
      const out = [];
      for (const order of orders) {
        S_story.brynLedgerBalance = -8;
        for (const f of ['brynThirdStepFixed', 'brynFirewoodBrought', 'brynPantryRestocked']) S_story[f] = false;
        const trail = [];
        for (const i of order) { BRYNN_MAINTENANCE_TASKS[i].action(); trail.push(S_story.brynLedgerBalance); }
        out.push(trail);
      }
      return { out, start: -8, shifts: BRYNN_MAINTENANCE_TASKS.map(t => t.label) };
    }, permutations([0, 1, 2]));

    expect(r.out).toHaveLength(6);
    for (const trail of r.out) {
      expect(trail[trail.length - 1], 'the book closes at zero').toBe(0);
      expect(Math.max(...trail), 'no partial state overshoots').toBeLessThanOrEqual(0);
    }
  });

  test('the shifts sum to the opening deficit — re-derived, not restated', async ({ page }) => {
    await seedAndLoad(page);
    const sum = await page.evaluate(() => {
      let bal = -8;
      S_story.brynLedgerBalance = -8;
      for (const t of BRYNN_MAINTENANCE_TASKS) t.action();
      return { reached: S_story.brynLedgerBalance, start: bal, tasks: BRYNN_MAINTENANCE_TASKS.length };
    });
    expect(sum.tasks).toBe(3);
    expect(sum.reached).toBe(0);
  });

  test('the panel prints "0 copper (balanced)" and Brynn says her line once', async ({ page }) => {
    await seedAndLoad(page, { currentCode: 'TLL', checkpointNode: 'TLL', visited: { TLL: true },
      npcFavorability: { brynn: 2 }, brynLedgerBalance: -8 });
    await dismissContinue(page);
    await page.evaluate(() => {
      for (const t of BRYNN_MAINTENANCE_TASKS) t.action();
      delete S_story._brynLedgerZeroShown;
      storyRender(NODE_MAP.TLL);
      document.querySelector('#story-npc-cards-row button.inv-use-btn').click();
    });
    await expect(page.locator('#brynn-ledger-sub')).toContainText('0 copper (balanced)');
    await expect(page.locator('#brynn-ledger-sub')).not.toContainText('+1 copper');
    await expect(page.locator('#story-move-msg')).toContainText("first time in three years", { timeout: 2000 });
  });

  test('no task narration asserts a sign the balance may not have', async ({ page }) => {
    await seedAndLoad(page);
    const claims = await page.evaluate(() => BRYNN_MAINTENANCE_TASKS
      .filter(t => /in the red|surplus|in the black/i.test(t.narration + ' ' + t.brynn_after))
      .map(t => t.label));
    // Any of the three can be the task that closes the book, so none of them may say
    // where the balance stands afterwards.
    expect(claims).toEqual([]);
  });
});
