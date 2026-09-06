// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02eg — the reward ceiling was correct code with no reach.
//
// `if (rewardXp > tier.rewardCap) continue` removes the Warrant's best work from the
// candidate pool until standing lifts the cap, exactly as §BOARD-01-FU7 specifies. But
// the pool is over a thousand and the player reads at most eight of it, joined by a
// hash that does not know about standing — so the five premium quests sorted past
// position 260 and sixty game days at maximum standing showed a premium bounty on none.
//
// A slate seat is now reserved for work the BASE ceiling would hide, taken in the day's
// own hash order so it rotates. A tier whose ceiling is not lifted has no premium seat:
// nothing is being withheld from it to reveal.

const { test, expect } = require('@playwright/test');
const { seedAndLoad } = require('./helpers.js');

const NEWGAME = { str: 10, dex: 8, con: 8, int: 8, wis: 8, cha: 8 };

async function sweep(page, standing, days) {
  return page.evaluate(({ standing, days, NEWGAME }) => {
    storyNewGame(NEWGAME);
    S_story.currentCode = 'TLL'; S_story.playerR = null; S_story.playerC = null;
    S_story.warrantStanding = standing;
    const base = WARRANT_TIERS[0].rewardCap;
    let premiumDays = 0, best = 0; const distinct = new Set();
    for (let d = 0; d < days; d++) {
      S_story.gameDay = d;
      const slate = _boardBounties(NODE_MAP.TLL).filter(b => !b.void);
      let dayBest = 0;
      for (const b of slate) {
        const xp = _boardRewardXp(QUEST_DB[b.id]);
        dayBest = Math.max(dayBest, xp);
        if (xp > base) distinct.add(b.id);
      }
      if (dayBest > base) premiumDays++;
      best = Math.max(best, dayBest);
    }
    return { premiumDays, best, distinct: [...distinct], cap: _warrantTier(standing).rewardCap, base };
  }, { standing, days, NEWGAME });
}

test.describe('§DX-02eg — a lifted ceiling is something you can see', () => {

  test('tier 0 still shows nothing the ceiling hides', async ({ page }) => {
    await seedAndLoad(page);
    const r = await sweep(page, 0, 60);
    expect(r.cap).toBe(r.base);                 // the base rung is the ceiling itself
    expect(r.premiumDays).toBe(0);
    expect(r.best).toBeLessThanOrEqual(r.base); // §BOARD-01-FU7's promise, still enforced
  });

  test('every rung that lifts the ceiling shows what it unlocked, every day', async ({ page }) => {
    await seedAndLoad(page);
    for (const standing of [3, 7, 12, 20]) {
      const r = await sweep(page, standing, 60);
      expect(r.cap, `standing ${standing} lifts the cap`).toBeGreaterThan(r.base);
      expect(r.premiumDays, `standing ${standing} premium-bearing days`).toBe(60);
      expect(r.best).toBeGreaterThan(r.base);
    }
  });

  test('a higher rung reveals strictly more, and the seat rotates when it can', async ({ page }) => {
    await seedAndLoad(page);
    const marked = await sweep(page, 3, 60);
    const trusted = await sweep(page, 7, 60);
    const sworn = await sweep(page, 12, 60);
    // What each rung can reach is re-derived from the corpus, never restated here.
    const reach = await page.evaluate(({ NEWGAME }) => {
      storyNewGame(NEWGAME);
      S_story.currentCode = 'TLL'; S_story.playerR = null; S_story.playerC = null;
      const base = WARRANT_TIERS[0].rewardCap;
      const inn = NODE_MAP.TLL;
      const premium = Object.values(QUEST_DB)
        .filter(q => _bountyPostable(q, inn) && !VOID_FEATURED_IDS.has(q.id) && _boardRewardXp(q) > base)
        .map(q => _boardRewardXp(q));
      return [3, 7, 12].map(s => premium.filter(xp => xp <= _warrantTier(s).rewardCap).length);
    }, { NEWGAME });
    expect(marked.distinct.length).toBe(reach[0]);
    expect(trusted.distinct.length).toBe(reach[1]);
    expect(sworn.distinct.length).toBe(reach[2]);
    expect(trusted.distinct.length).toBeGreaterThan(marked.distinct.length);
    expect(sworn.best).toBeGreaterThanOrEqual(trusted.best);
    // Where a rung reaches more than one, the seat must not pin a single card.
    expect(sworn.distinct.length).toBeGreaterThan(1);
  });

  test('the premium seat costs the slate no card and no determinism', async ({ page }) => {
    await seedAndLoad(page);
    const r = await page.evaluate(({ NEWGAME }) => {
      storyNewGame(NEWGAME);
      const inn = NODE_MAP.TLL;
      S_story.currentCode = 'TLL'; S_story.playerR = null; S_story.playerC = null;
      S_story.gameDay = 0;
      const sizes = [];
      for (const [standing, slate] of [[0, 4], [3, 5], [7, 6], [12, 7], [20, 8]]) {
        S_story.warrantStanding = standing;
        sizes.push([standing, _boardBounties(inn).filter(b => !b.void).length, slate]);
      }
      S_story.warrantStanding = 20;
      const a = _boardBounties(inn).map(b => b.id), b = _boardBounties(inn).map(b => b.id);
      const ids = _boardBounties(inn).map(b => b.id);
      return { sizes, deterministic: JSON.stringify(a) === JSON.stringify(b),
               unique: new Set(ids).size === ids.length,
               limited: _boardBounties(inn, 4).filter(x => !x.void).length };
    }, { NEWGAME });
    for (const [standing, got, want] of r.sizes) expect(got, `standing ${standing}`).toBe(want);
    expect(r.deterministic).toBe(true);
    expect(r.unique, 'a reserved seat must never duplicate a card').toBe(true);
    expect(r.limited).toBe(4);
  });
});
