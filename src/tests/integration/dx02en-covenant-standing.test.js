// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
'use strict';
/**
 * §DX-02en — every rung of the Covenant Standing ladder is reachable, and the
 * ending speaks it.
 *
 * `_curseScore()` scores the 20 Epic Battleground contacts as
 * `(startedNotReturned * 3) + (neverStarted * 1) - (allComplete ? 5 : 0)`, so over
 * all 231 partitions of the 20 codes its reachable set is `{ -5 } union [1, 58] union { 60 }` —
 * 0 is not reachable either. `COVENANT_STANDING_LABELS` shipped with its top rung
 * at `maxScore: -6` and `Warden` at `maxScore: 0`, which made "Covenant Keeper"
 * unreachable and left `Warden` holding the single state -5.
 *
 * Assertion 2 is the one that would have failed on 2026-05-24: it asks the ladder
 * to have no rung that no run can earn. It is the reason `Warden` moved to a
 * positive band rather than being left decorative — a bracket nothing selects is
 * the defect this row closes, not a smaller version of it.
 *
 * Every number here comes from the engine's own `_curseScore` and
 * `_covenantStanding` over planted `S_story` ledgers, never a re-implementation.
 */
const { test, expect } = require('@playwright/test');
const { seedAndLoad, dismissContinue } = require('./helpers');

const SEED = {
  currentCode: 'BOO',
  visited: { BOO: true },
  quests: {},
  defeatedBattles: {},
  ebReturnDone: {},
  npcFavorability: {},
  day: 1,
};

// One page, 231 partitions: `_curseScore` is a pure read of three ledgers, so the
// sweep rewrites them per partition rather than reloading.
const SWEEP = `() => {
  const out = [];
  for (let r = 0; r <= 20; r++) {
    for (let s = 0; s + r <= 20; s++) {
      const returned = _EB_CODES.slice(0, r);
      const started  = _EB_CODES.slice(r, r + s);
      S_story.ebReturnDone = {};
      S_story.defeatedBattles = {};
      S_story.quests = {};
      returned.forEach(c => { S_story.ebReturnDone[c] = true; S_story.defeatedBattles[c] = true; });
      started.forEach(c => { S_story.defeatedBattles[c] = true; });
      out.push({ r: r, s: s, n: 20 - r - s, score: _curseScore(), label: _covenantStanding().label });
    }
  }
  return { out: out, labels: COVENANT_STANDING_LABELS.map(b => b.label) };
}`;

test.describe('§DX-02en — the Covenant Standing ladder', () => {

  test('the reachable score set is { -5 } union [1, 58] union { 60 }, and every label is earned by at least one run', async ({ page }) => {
    await seedAndLoad(page, SEED);
    await dismissContinue(page);
    const { out, labels } = await page.evaluate(src => eval(src)(), SWEEP);

    expect(out.length).toBe(231);

    const scores = [...new Set(out.map(x => x.score))].sort((a, b) => a - b);
    expect(scores[0]).toBe(-5);
    expect(scores[scores.length - 1]).toBe(60);
    expect(scores.includes(0)).toBe(false);
    expect(scores.filter(v => v < 0)).toEqual([-5]);
    // The positive band is 1..58 plus 60, NOT [1, 60]: 59 would need 3s + n = 59
    // with s + n <= 20, and s = 19 leaves only n = 2 for a 21st code. 60 is the
    // all-abandoned run. §DX-02en and the lab report both wrote [1, 60].
    expect(scores.filter(v => v > 0))
      .toEqual(Array.from({ length: 58 }, (_, i) => i + 1).concat([60]));

    // Assertion 2 — no rung of the ladder is unearnable.
    const earned = new Set(out.map(x => x.label));
    expect(labels.filter(l => !earned.has(l))).toEqual([]);
  });

  test('the perfect 20-of-20 run is the Covenant Keeper, and it is the only one', async ({ page }) => {
    await seedAndLoad(page, SEED);
    await dismissContinue(page);
    const { out } = await page.evaluate(src => eval(src)(), SWEEP);

    const keepers = out.filter(x => x.label === 'Covenant Keeper');
    expect(keepers.length).toBe(1);
    expect(keepers[0]).toMatchObject({ r: 20, s: 0, n: 0, score: -5 });
  });

  test('the "Covenant Keeper (True)" ending gate is inside the reachable set', async ({ page }) => {
    await seedAndLoad(page, SEED);
    await dismissContinue(page);
    const threshold = await page.evaluate(() => {
      const m = storyCheckVictory.toString().match(/curse\s*<=\s*(-?\d+)\s*\n?\s*&&\s*\(S_story\.pitTrainingWins/);
      return m ? Number(m[1]) : null;
    });
    expect(threshold).toBe(-5);
  });

  test('all four ending branches close on the standing Sweelinck speaks', async ({ page }) => {
    await seedAndLoad(page, SEED);
    await dismissContinue(page);
    const out = await page.evaluate(() => {
      const src = storyCheckVictory.toString();
      return {
        assignments: (src.match(/endingEl\.textContent = /g) || []).length,
        spoken: (src.match(/\+ standingSpoken;/g) || []).length,
        readsLabel: /const standingSpoken = .*_covenantStanding\(\)\.label/.test(src),
      };
    });
    expect(out.assignments).toBe(4);
    expect(out.spoken).toBe(4);
    expect(out.readsLabel).toBe(true);
  });
});
