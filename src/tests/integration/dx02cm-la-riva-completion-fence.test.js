// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
'use strict';
/**
 * §DX-02cm — `quest_la_riva_02` pays through the grammar, and only at AMS.
 *
 * `storyCheckQuests` walks every active quest on every render, so a completion
 * gate with no `atNode` term completes wherever the player happens to stand —
 * and a quest completes exactly once. Both of this quest's preconditions
 * (`frCatKillCount >= 5` and Vincenzo's Net) are granted in the same AMS battle
 * resolution, so `atNode:'AMS'` is what keeps the completion and the scene it
 * pays for in the same place. The `onComplete` chain is the payment; the favor
 * bit is an `add` because `_setNpcFavor` is monotonic.
 */
const { test, expect } = require('@playwright/test');
const { seedAndLoad, dismissContinue } = require('./helpers');

// Both preconditions met, the quest active, the arc's next rung not yet started.
const ROW_SEED = {
  currentCode: 'AMS',
  visited: { AMS: true },
  quests: { quest_la_riva_02: 'active' },
  frCatKillCount: 5,
  inventory: [{ name: "Vincenzo's Net", icon: '🎣', type: 'key_item', sell: 0 }],
  npcFavorability: {},
  gold: 0,
};

test.describe('§DX-02cm — the completion fence and the payment chain', () => {

  test('the completion gate carries atNode and the six effects are one bit chain', async ({ page }) => {
    await seedAndLoad(page, ROW_SEED);
    await dismissContinue(page);

    const q = await page.evaluate(() => {
      const q = QUEST_DB.quest_la_riva_02;
      return {
        atNode: q.completion.atNode,
        countMin: q.completion.countMin,
        itemsAll: q.completion.itemsAll,
        kinds: (q.onComplete || []).map(b => b.kind),
        gold: q.onComplete[0].gold,
        item: q.onComplete[0].items[0].name,
        favor: q.onComplete[1],
        unlock: q.onComplete[2].quests,
        msgBytes: new TextEncoder().encode(q.onComplete[3].msg).length,
        valid: validateQuest(q).valid,
      };
    });

    expect(q.atNode).toBe('AMS');
    expect(q.countMin).toEqual([{ path: 'frCatKillCount', min: 5 }]);
    expect(q.itemsAll).toEqual(["Vincenzo's Net"]);
    expect(q.kinds).toEqual(['reward', 'favor', 'unlock', 'narrative']);
    expect(q.gold).toBe(500);
    expect(q.item).toBe('Old Tuna Account Book');
    expect(q.favor).toEqual({ kind: 'favor', npc: 'aldo_sardino', add: 1 });
    expect(q.unlock).toEqual(['quest_la_riva_03']);
    expect(q.msgBytes).toBe(754);
    expect(q.valid).toBe(true);
  });

  test('storyCheckQuests at a node that is not AMS leaves the quest active and pays nothing', async ({ page }) => {
    await seedAndLoad(page, ROW_SEED);
    await dismissContinue(page);

    const r = await page.evaluate(() => {
      const out = {};
      for (const code of ['CDG', 'TLS', 'SSJ', 'LHR']) {
        S_story.currentCode = code;
        S_story.quests = { quest_la_riva_02: 'active' };
        S_story.gold = 0;
        S_story.inventory = [{ name: "Vincenzo's Net", icon: '🎣', type: 'key_item', sell: 0 }];
        S_story.npcFavorability = {};
        storyCheckQuests(NODE_MAP[code]);
        out[code] = {
          status: S_story.quests.quest_la_riva_02,
          next: S_story.quests.quest_la_riva_03 || null,
          gold: S_story.gold,
          book: S_story.inventory.some(i => i.name === 'Old Tuna Account Book'),
          aldo: (S_story.npcFavorability || {}).aldo_sardino || 0,
        };
      }
      return out;
    });

    for (const code of ['CDG', 'TLS', 'SSJ', 'LHR']) {
      expect(r[code], code).toEqual({ status: 'active', next: null, gold: 0, book: false, aldo: 0 });
    }
  });

  test('storyCheckQuests at AMS completes it and pays all six effects once', async ({ page }) => {
    await seedAndLoad(page, ROW_SEED);
    await dismissContinue(page);

    const r = await page.evaluate(() => {
      // Arriving at AMS with both preconditions met is itself a render, and that
      // render is what completes the quest — capture it before re-driving.
      const onArrival = {
        status: S_story.quests.quest_la_riva_02,
        next: S_story.quests.quest_la_riva_03,
        gold: S_story.gold,
        book: S_story.inventory.some(i => i.name === 'Old Tuna Account Book'),
      };
      S_story.currentCode = 'AMS';
      S_story.quests = { quest_la_riva_02: 'active' };
      S_story.gold = 0;
      S_story.inventory = [{ name: "Vincenzo's Net", icon: '🎣', type: 'key_item', sell: 0 }];
      S_story.npcFavorability = {};
      const msgs = storyCheckQuests(NODE_MAP.AMS);
      const after = {
        onArrival,
        status: S_story.quests.quest_la_riva_02,
        next: S_story.quests.quest_la_riva_03,
        gold: S_story.gold,
        books: S_story.inventory.filter(i => i.name === 'Old Tuna Account Book').length,
        aldo: (S_story.npcFavorability || {}).aldo_sardino || 0,
        narrated: msgs.some(m => m.startsWith('💰 +500gp. The rubble is quieter now.')),
        titled: msgs.includes('✓ Connie: The Weight of a Net'),
      };
      // A second render must not pay twice — the quest is no longer 'active'.
      storyCheckQuests(NODE_MAP.AMS);
      after.goldAfterSecondRender = S_story.gold;
      after.booksAfterSecondRender = S_story.inventory.filter(i => i.name === 'Old Tuna Account Book').length;
      return after;
    });

    expect(r.onArrival).toEqual({ status: 'complete', next: 'active', gold: 500, book: true });
    expect(r.status).toBe('complete');
    expect(r.next).toBe('active');
    expect(r.gold).toBe(500);
    expect(r.books).toBe(1);
    expect(r.aldo).toBe(1);
    expect(r.narrated).toBe(true);
    expect(r.titled).toBe(true);
    expect(r.goldAfterSecondRender).toBe(500);
    expect(r.booksAfterSecondRender).toBe(1);
  });

  test('the AMS render hook no longer completes or pays anything', async ({ page }) => {
    await seedAndLoad(page, ROW_SEED);
    await dismissContinue(page);

    const r = await page.evaluate(() => {
      S_story.currentCode = 'AMS';
      S_story.quests = { quest_la_riva_02: 'active' };
      S_story.gold = 0;
      _nodeHookLaRivaRow(NODE_MAP.AMS);
      return {
        status: S_story.quests.quest_la_riva_02,
        gold: S_story.gold,
        next: S_story.quests.quest_la_riva_03 || null,
      };
    });

    expect(r.status).toBe('active');
    expect(r.gold).toBe(0);
    expect(r.next).toBe(null);
  });
});
