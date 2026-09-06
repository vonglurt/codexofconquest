// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02ei — the Warrant's Board had never posted a job you could walk to.
//
// `_boardBounties` sorted the whole legal world on a hash that has never heard of
// geography and showed the first few, so a slate was a uniform sample of the world:
// measured over 30 game days at TLL it posted 120 bounties whose nearest was 13 legs
// away and whose median was 23, and not one card in the sweep was within 10.
//
// One seat is now reserved for work from the BOARD_LOCAL_PLACES nearest destinations
// that have any, taken in the day's own hash order so the near seat still rotates and
// the slate stays deterministic. The rest of the slate is the whole world, unchanged.

const { test, expect } = require('@playwright/test');
const { seedAndLoad } = require('./helpers.js');

const NEWGAME = { str: 10, dex: 8, con: 8, int: 8, wis: 8, cha: 8 };

// Re-derive the sweep from the live selector rather than restating its numbers:
// a figure typed into a test rots, a figure the test recomputes cannot (resume.md §2.6).
async function sweep(page, code, days) {
  return page.evaluate(({ code, days, NEWGAME }) => {
    storyNewGame(NEWGAME);
    S_story.currentCode = code; S_story.playerR = null; S_story.playerC = null;
    S_story.warrantStanding = 0;
    const perDay = [];
    for (let d = 0; d < days; d++) {
      S_story.gameDay = d;
      perDay.push(_boardBounties(NODE_MAP[code]).filter(b => !b.void).map(b => b.legs));
    }
    return perDay;
  }, { code, days, NEWGAME });
}

test.describe("§DX-02ei — the board posts work you can walk to", () => {

  test('every day of a 30-day sweep at TLL offers a card from a near place', async ({ page }) => {
    await seedAndLoad(page);
    const perDay = await sweep(page, 'TLL', 30);
    expect(perDay).toHaveLength(30);
    const nearest = perDay.map(d => Math.min(...d));
    // The guarantee is relative — the board posts the nearest work it HAS, and cannot
    // invent a job the world does not carry. At TLL the five nearest places with any
    // eligible work sit at 5..12 legs, so that is the bound the slate inherits.
    expect(Math.max(...nearest), 'no day may be worse than the nearest place with work').toBeLessThanOrEqual(12);
    // The pre-fix sweep's own floor: its BEST day was 25 legs and its best card 13.
    expect(Math.max(...nearest)).toBeLessThan(25);
    expect(Math.min(...nearest)).toBeLessThanOrEqual(10);
  });

  test('every board host in the world gains the same floor', async ({ page }) => {
    await seedAndLoad(page);
    const r = await page.evaluate(({ NEWGAME }) => {
      storyNewGame(NEWGAME);
      const hosts = Object.values(NODE_MAP).filter(n => _boardHost(n)).map(n => n.code);
      const worst = [];
      for (const code of hosts) {
        S_story.currentCode = code; S_story.playerR = null; S_story.playerC = null;
        S_story.warrantStanding = 0;
        let w = 0, any = false;
        for (let d = 0; d < 30; d++) {
          S_story.gameDay = d;
          const legs = _boardBounties(NODE_MAP[code]).filter(b => !b.void).map(b => b.legs);
          if (!legs.length) continue;
          any = true; w = Math.max(w, Math.min(...legs));
        }
        if (any) worst.push({ code, w });
      }
      return { hosts: hosts.length, worst };
    }, { NEWGAME });
    expect(r.hosts).toBe(39);
    expect(r.worst.length).toBe(39);
    // Before the reserved seat this figure ran to 65 legs, with a median of 34.
    const over = r.worst.filter(x => x.w > 15);
    expect(over, 'no host may leave its best card further than the nearest place with work').toEqual([]);
  });

  test('the reserved seat rotates, and does not cost the slate a card', async ({ page }) => {
    await seedAndLoad(page);
    const r = await page.evaluate(({ NEWGAME }) => {
      storyNewGame(NEWGAME);
      const inn = NODE_MAP.TLL;
      S_story.currentCode = 'TLL'; S_story.playerR = null; S_story.playerC = null;
      const sizes = [], firsts = new Set();
      for (const [standing, slate] of [[0, 4], [3, 5], [7, 6], [12, 7], [20, 8]]) {
        S_story.warrantStanding = standing; S_story.gameDay = 0;
        sizes.push([standing, _boardBounties(inn).filter(b => !b.void).length, slate]);
      }
      S_story.warrantStanding = 0;
      for (let d = 0; d < 30; d++) { S_story.gameDay = d; firsts.add(_boardBounties(inn)[0].id); }
      S_story.gameDay = 0;
      const a = _boardBounties(inn).map(b => b.id), b = _boardBounties(inn).map(b => b.id);
      return { sizes, distinctLocal: firsts.size, deterministic: JSON.stringify(a) === JSON.stringify(b),
               limited: _boardBounties(inn, 4).filter(x => !x.void).length };
    }, { NEWGAME });
    for (const [standing, got, want] of r.sizes) expect(got, `standing ${standing}`).toBe(want);
    expect(r.deterministic).toBe(true);
    expect(r.limited).toBe(4);
    // A fixed card in slot 0 would be a board that stopped rotating.
    expect(r.distinctLocal).toBeGreaterThan(1);
  });

  test('_roadGridNearest agrees with the route walk it saves', async ({ page }) => {
    await seedAndLoad(page);
    const r = await page.evaluate(({ NEWGAME }) => {
      storyNewGame(NEWGAME);
      S_story.currentCode = 'TLL'; S_story.playerR = null; S_story.playerC = null;
      const targets = new Set(Object.keys(NODE_COORDS).map(c => NODE_COORDS[c].r + ',' + NODE_COORDS[c].c));
      const near = _roadGridNearest(_playerPos(), targets, 20);
      const bad = [];
      for (const [key, legs] of near) {
        const [r2, c2] = key.split(',').map(Number);
        const truth = window.__maptabs._roadGridPathCore(_playerPos(), { r: r2, c: c2 }).length;
        if (truth !== legs) bad.push({ key, legs, truth });
      }
      return { size: near.size, bad, empty: _roadGridNearest(_playerPos(), new Set(), 5).size };
    }, { NEWGAME });
    expect(r.size).toBe(20);
    expect(r.bad, 'the bounded search and the route walk must report the same legs').toEqual([]);
    expect(r.empty).toBe(0);
  });
});
