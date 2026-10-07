// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02it — how much of the Warrant's Board's work lies within a short walk of each board.
//
// §DX-02ei reserved one slate seat for the nearest work a board has, which makes the board
// exactly as local as its pool and no more. This census measures the pool: per board host,
// on a fresh game at standing 0, how many postable bounties sit within NEAR legs. It is
// measured with the game's own predicate (_bountyPostable, the void exclusion, the base
// reward ceiling) and the game's own road walk: on a fresh game at TLL, 1,690 of the 2,758
// board-type quests are closed by gates, and a Node copy of that predicate would drift.
//
// The floor is the one the row asked for: no host may have NOTHING within reach. A quest
// whose destination shares the host's own cell is 0 legs away and counts.

const { test, expect } = require('@playwright/test');
const { seedAndLoad } = require('./helpers.js');

const NEWGAME = { str: 10, dex: 8, con: 8, int: 8, wis: 8, cha: 8 };
const NEAR = 10;

test("§DX-02it — every board host has postable work within a short walk", async ({ page }) => {
  await seedAndLoad(page);
  const rows = await page.evaluate(({ NEWGAME, NEAR }) => {
    storyNewGame(NEWGAME);
    S_story.warrantStanding = 0; S_story.gameDay = 0;
    const cap = _warrantTier(0).rewardCap;
    const out = [];
    for (const node of Object.values(NODE_MAP).filter(n => _boardHost(n))) {
      S_story.currentCode = node.code; S_story.playerR = null; S_story.playerC = null;
      const start = _playerPos(), here = start.r + ',' + start.c;
      const perCell = new Map();
      for (const q of Object.values(QUEST_DB)) {
        if (!_bountyPostable(q, node) || VOID_FEATURED_IDS.has(q.id) || _boardRewardXp(q) > cap) continue;
        const co = NODE_COORDS[q.activateNode];
        if (!co) continue;
        const k = co.r + ',' + co.c;
        perCell.set(k, (perCell.get(k) || 0) + 1);
      }
      const legs = _roadGridNearest(start, new Set(perCell.keys()), Infinity);
      legs.set(here, 0);
      let near = 0, places = 0, pool = 0;
      for (const [k, n] of perCell) {
        pool += n;
        if ((legs.get(k) ?? Infinity) <= NEAR) { near += n; places++; }
      }
      out.push({ code: node.code, pool, near, places });
    }
    return out.sort((a, b) => a.near - b.near);
  }, { NEWGAME, NEAR });

  expect(rows).toHaveLength(39);
  for (const r of rows) expect(r.pool, `${r.code} posts nothing at all`).toBeGreaterThan(0);
  console.log(`§DX-02it thinnest hosts (postable within ${NEAR} legs): ` +
    rows.slice(0, 6).map(r => `${r.code} ${r.near}/${r.pool} @${r.places}`).join(' · '));
  const empty = rows.filter(r => r.near === 0).map(r => r.code);
  expect(empty, `board hosts with no postable work within ${NEAR} legs`).toEqual([]);
});
