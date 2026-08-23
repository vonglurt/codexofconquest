// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson and Claude
// §XP-02-A — first-arrival exploration XP (completes §XP-01 "all action earns XP").
//
// §XP-01 shipped three effort-XP grant sites (fled enemy, missed attack, failed check) but
// exploration — the thing the game is built around — granted nothing. §XP-02-A adds the fourth:
// a flat EXPLORE_XP awarded once when a node's `visited` boolean flips false→true, inside
// storyCollectLoot (the sole visited-setting site). Guarded so backtracking pays nothing, and
// bounded (EXPLORE_XP ≤ a real enemy's flee value) so exploring can never out-earn combat.
const { test, expect } = require('@playwright/test');
const { seedAndLoad, dismissContinue, readStory } = require('./helpers');

test.describe('§XP-02-A — first-arrival exploration XP', () => {
  test('grants EXPLORE_XP once on first arrival, nothing on re-visit, and is bounded below a real fight', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', e => pageErrors.push(String(e)));
    await page.goto('/roll2hit-v3.html');

    const r = await page.evaluate(() => {
      // a real, non-junction node with no loot — isolates the XP grant from inventory side effects
      const code = Object.keys(NODE_MAP).find(c => !NODE_MAP[c].loot && !NODE_MAP[c].junction);
      const node = NODE_MAP[code];

      S_story.visited = {};                 // node is unvisited
      S_story.xp = 0; S_story.level = 1;
      S_story.explorationXp = 0;

      const before = S_story.xp;
      storyCollectLoot(node);               // FIRST arrival
      const afterFirst = S_story.xp;
      const visitedAfter = !!S_story.visited[code];

      storyCollectLoot(node);               // RE-VISIT (visited already true)
      const afterSecond = S_story.xp;

      // bound: one exploration must be ≤ fleeing the weakest starter combat enemy
      const pf = MONSTER_POOL['protofleder'];
      const fleeVal = Math.max(1, Math.round(pf.ac * pf.hp * EFFORT_XP_PCT));

      return { EXPLORE_XP, before, afterFirst, afterSecond, visitedAfter, fleeVal,
               telemetry: S_story.explorationXp, code };
    });

    expect(r.EXPLORE_XP, 'EXPLORE_XP is a positive dial').toBeGreaterThan(0);
    expect(r.afterFirst - r.before, 'first arrival grants exactly EXPLORE_XP').toBe(r.EXPLORE_XP);
    expect(r.visitedAfter, 'the node is marked visited after first arrival').toBe(true);
    expect(r.afterSecond, 'a re-visit grants nothing (backtracking pays 0)').toBe(r.afterFirst);
    expect(r.telemetry, 'explorationXp telemetry accrues exactly one grant').toBe(r.EXPLORE_XP);
    expect(r.EXPLORE_XP, `bounded ≤ protofleder flee value (${r.fleeVal}) — cannot out-earn a fight`).toBeLessThanOrEqual(r.fleeVal);
    expect(pageErrors).toEqual([]);
  });

  test('end-to-end: arriving at an unvisited node via the real render path accrues one grant', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', e => pageErrors.push(String(e)));
    // SZG (Scholar King's Workshop) — a quiet sleep node, no NPC/auto-active quest to add other XP.
    const node = 'SZG';
    await seedAndLoad(page, { currentCode: node, checkpointNode: node, visited: {}, xp: 0, level: 1, explorationXp: 0 });
    await dismissContinue(page);
    // explorationXp is isolated telemetry — proves the render path fired the grant exactly once,
    // independent of any other XP source, even if storyRender runs more than once on load.
    const tele = await readStory(page, 'explorationXp');
    const explXp = await page.evaluate(() => EXPLORE_XP);
    expect(tele, 'first arrival at SZG accrued exactly one exploration grant through storyRender').toBe(explXp);
    expect(pageErrors).toEqual([]);
  });
});
