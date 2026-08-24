// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
'use strict';
/**
 * §DX-02gb + §DX-02fc — the Dear-Friend step is order-independent.
 *
 * Every Birka NPC earns Dear Friend from two things: a first favor (a quest's
 * `set:1`, or three deliberate Talk actions on distinct game-days) and a second
 * personal act. `DEAR_FRIEND_BITS` names the act; `_checkDearFriendUpgrade` grants
 * the step. Because the step is a one-time +1 rather than an absolute write, and
 * because it is checked both when favor rises and where each act is recorded, the
 * two orderings converge — including brynn, whose `add:1` firewood bit stacks on
 * top of the step to open Room 6 at favor 3 either way round.
 *
 * Every case drives the real path: `_talkToNpc`, `_yaelEscortAction`,
 * `storyCheckJournal`, `_storyBattleVictory`, `storyCheckQuests`, `storyRender`
 * and `QuestRuntime.execBits`. No case plants a favor value.
 */
const { test, expect } = require('@playwright/test');
const { seedAndLoad, dismissContinue } = require('./helpers');

// The seed node must not be TLL: the load renders it, and TLL is journal entry 7's
// node — so seeding there hands every ordering brynn's act before step one.
const BIRKA_SEED = {
  currentCode: 'BOO',
  visited: { BOO: true },
  quests: {},
  npcFavorability: {},
  npcVisitCounts: {},
  journalEntriesRead: [],
  pitTrainingWins: 0,
  actNumber: 1,
  day: 1,
};

// Three deliberate Talk actions on distinct game-days — the real route to favor 1,
// and the one a player who explores before questing takes without being told.
const TALK_TO_ONE = `(key) => {
  for (let d = 0; d < 3; d++) { S_story.day = 100 + d; _talkToNpc(key); }
}`;

// The second personal act for each NPC, at the site the engine records it.
const ACTS = {
  yael: `() => { _yaelEscortAction(); }`,
  brynn: `() => { storyCheckJournal(NODE_MAP.TLL); }`,
  quill: `() => {
    S_story.quests['quest_couperin_lute'] = 'complete';
    S_story.currentCode = 'MHQ';
    storyRender(NODE_MAP.MHQ);
  }`,
  pachelbel: `() => {
    S_story.quests['quest_pachelbel_shipment'] = 'active';
    S_story.inventory = (S_story.inventory || []).concat([{ name:'Sealed Scholar Box', icon:'📦', type:'quest_item', sell:0 }]);
    S_story.currentCode = 'LLA';
    storyCheckQuests(NODE_MAP.LLA);
  }`,
  crov: `() => {
    S_story.quests['quest_pit_training'] = 'active';
    S_story.pendingBattle = { nodeCode:'HKG' };
    S.enemy = { ac: 10 }; S.opp = { maxHp: 10 }; S.player = { hp: S_story.hp };
    for (let i = 0; i < 3; i++) { S_story.pendingBattle = { nodeCode:'HKG' }; _storyBattleVictory(); }
  }`,
  auros: `() => {
    S_story.defeatedBattles = Object.assign({}, S_story.defeatedBattles, { CY_VOID: true });
    S_story.quests['quest_void_below'] = 'active';
    S_story.currentCode = 'HKG';
    storyCheckQuests(NODE_MAP.HKG);
  }`,
};

const NPCS = Object.keys(ACTS);

// Each ordering gets a page that has never run the other: the favor ledger, the act
// flags and the talk counters all persist, so a shared page reports the second
// ordering's result from the first ordering's state.
async function runOrder(page, key, first) {
  await seedAndLoad(page, BIRKA_SEED);
  await dismissContinue(page);
  const out = await page.evaluate(([k, talkSrc, actSrc, actFirst]) => {
    const before = { fav: _npcFavor(k), talks: ((S_story.npcTalk || {})[k] || {}).count || 0,
                     entry7: (S_story.journalEntriesRead || []).includes(7) };
    const talk = eval(talkSrc);
    const act = eval(actSrc);
    if (actFirst) { act(); talk(k); } else { talk(k); act(); }
    return { before, fav: _npcFavor(k), granted: !!(S_story.dearFriendGranted || {})[k] };
  }, [key, TALK_TO_ONE, ACTS[key], first === 'act']);

  expect(out.before).toEqual({ fav: 0, talks: 0, entry7: false });
  return out;
}

test.describe('§DX-02gb — both orderings reach Dear Friend, for all six NPCs', () => {

  for (const key of NPCS) {
    test(`${key}: act-then-favor and favor-then-act converge at Dear Friend`, async ({ page }) => {
      const actFirst = await runOrder(page, key, 'act');
      const favFirst = await runOrder(page, key, 'favor');

      expect(actFirst.fav).toBeGreaterThanOrEqual(2);
      expect(favFirst.fav).toBeGreaterThanOrEqual(2);
      expect(favFirst.fav).toBe(actFirst.fav);
    });
  }

  test('the act table is declared once and both readers share it', async ({ page }) => {
    await seedAndLoad(page, BIRKA_SEED);
    await dismissContinue(page);

    const out = await page.evaluate(() => ({
      keys: Object.keys(DEAR_FRIEND_BITS),
      inlineCopies: (_setNpcFavor.toString().match(/yaelEscortUsed/g) || []).length,
    }));

    expect(out.keys.sort()).toEqual(['auros', 'brynn', 'crov', 'pachelbel', 'quill', 'yael']);
    expect(out.inlineCopies).toBe(0);
  });

  test('New Game+ carries the granted record with the favor ledger it latches', async ({ page }) => {
    await seedAndLoad(page, BIRKA_SEED);
    await dismissContinue(page);

    const out = await page.evaluate(() => {
      for (let d = 0; d < 3; d++) { S_story.day = 100 + d; _talkToNpc('yael'); }
      _yaelEscortAction();
      const before = { fav: _npcFavor('yael'), granted: !!(S_story.dearFriendGranted || {}).yael };

      // NG+ keeps the favor ledger and clears every act flag, so a record that does
      // not survive it pays the step twice. Empty `corpsesQuests` skips the confirm().
      S_story.corpsesQuests = [];
      storyNewGamePlus();

      _yaelEscortAction();
      return { before, ngPlusRun: S_story.ngPlusRun,
               after: { fav: _npcFavor('yael'), escort: !!S_story.yaelEscortUsed } };
    });

    expect(out.before).toEqual({ fav: 2, granted: true });
    expect(out.ngPlusRun).toBe(1);
    expect(out.after).toEqual({ fav: 2, escort: true });
  });

  test('the step is granted once, so a repeated act cannot inflate favor', async ({ page }) => {
    await seedAndLoad(page, BIRKA_SEED);
    await dismissContinue(page);

    const out = await page.evaluate(() => {
      for (let d = 0; d < 3; d++) { S_story.day = 100 + d; _talkToNpc('yael'); }
      _yaelEscortAction();
      const afterFirst = _npcFavor('yael');
      for (let i = 0; i < 5; i++) _checkDearFriendUpgrade('yael');
      return { afterFirst, afterRepeats: _npcFavor('yael') };
    });

    expect(out.afterFirst).toBe(2);
    expect(out.afterRepeats).toBe(2);
  });
});

test.describe('§DX-02fc — Room 6 opens on either ordering of ledger, firewood and entry 7', () => {

  // Drive the two brynn quests through the engine's own bit executor — the same
  // call `storyCheckQuests` makes — so the `set:1` and the capped `add:1` are
  // applied by the real favor handler.
  const RUN_BITS = `(id) => {
    _uqfRunToCompletion(QuestRuntime.execBits(QUEST_DB[id].onComplete, { questId: id, pushMsg: () => {} }));
  }`;

  const ORDERINGS = {
    'entry 7 before firewood': ['ledger', 'entry7', 'firewood'],
    'firewood before entry 7': ['ledger', 'firewood', 'entry7'],
    'entry 7 before either quest': ['entry7', 'ledger', 'firewood'],
  };

  for (const [name, steps] of Object.entries(ORDERINGS)) {
    test(`${name} → brynn 3, Room 6 rendered`, async ({ page }) => {
      await seedAndLoad(page, BIRKA_SEED);
      await dismissContinue(page);

      const out = await page.evaluate(([runSrc, order]) => {
        const baseline = { fav: _npcFavor('brynn'), entry7: (S_story.journalEntriesRead || []).includes(7) };
        const runBits = eval(runSrc);
        const step = {
          ledger: () => runBits('quest_brynn_ledger'),
          firewood: () => runBits('quest_brynn_firewood'),
          entry7: () => storyCheckJournal(NODE_MAP.TLL),
        };
        for (const s of order) step[s]();

        const npcRowDiv = document.createElement('div');
        _nodeHookBirkaRoom6(NODE_MAP.TLL, { npcRowDiv });
        return { baseline, fav: _npcFavor('brynn'), room6: npcRowDiv.textContent.includes('Room 6') };
      }, [RUN_BITS, steps]);

      expect(out.baseline).toEqual({ fav: 0, entry7: false });
      expect(out.fav).toBe(3);
      expect(out.room6).toBe(true);
    });
  }
});
