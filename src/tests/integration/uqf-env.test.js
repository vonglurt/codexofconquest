// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §VM-01-C — Pass the state, don't close over it: the _ENV fix.
// The effect handlers no longer name the S_story global; they write/read ctx.state,
// an env threaded in by execBits that DEFAULTS to the live S_story. On the live path
// nothing changes (no-op). Given an explicit { state } the exact same bit chain runs
// against a scratch object and leaves S_story untouched — the seam §VM-01-D/E need
// (run a quest against a state that isn't the live one). Design:
// lab-reports/lab-report-vm01c-env-state-passing.md.
const { test, expect } = require('@playwright/test');

const NEWGAME = { str: 10, dex: 8, con: 8, int: 8, wis: 8, cha: 8 };

test.describe('§VM-01-C — the _ENV (ctx.state) seam', () => {
  // 1. Live-path no-op: a plain ctx (no .state) still mutates the live S_story exactly
  //    as before — execBits defaults ctx.state to S_story.
  test('a chain with a plain ctx mutates the live S_story (default env)', async ({ page }) => {
    await page.goto('/play.html');
    const r = await page.evaluate((NG) => {
      storyNewGame(NG);
      S_story.quests = S_story.quests || {};
      delete S_story.envLiveFlag;
      _uqfRunToCompletion(QuestRuntime.execBits([
        { kind: 'flag_write', set: ['envLiveFlag'] },
        { kind: 'unlock', quests: ['env_live_q'] },
        { kind: 'reward', items: [{ name: 'Env Live Token' }] },
      ], { questId: 't', pushMsg: () => {} }));
      return {
        flag: S_story.envLiveFlag === true,
        quest: (S_story.quests || {}).env_live_q,
        hasItem: (S_story.inventory || []).some(i => i.name === 'Env Live Token'),
      };
    }, NEWGAME);
    expect(r.flag).toBe(true);
    expect(r.quest).toBe('active');
    expect(r.hasItem).toBe(true);
  });

  // 2. THE PAYOFF: the identical chain run with { state: scratch } writes the scratch
  //    object and leaves S_story untouched. This is exactly what D/E require.
  test('an explicit { state } routes every effect to the scratch state; S_story is untouched', async ({ page }) => {
    await page.goto('/play.html');
    const r = await page.evaluate((NG) => {
      storyNewGame(NG);
      delete S_story.envScratchFlag;
      S_story.quests = S_story.quests || {};
      const liveInvBefore = (S_story.inventory || []).length;
      const scratch = { quests: {}, inventory: [] };
      _uqfRunToCompletion(QuestRuntime.execBits([
        { kind: 'flag_write', set: ['envScratchFlag'] },
        { kind: 'reward', xp: 25, items: [{ name: 'Scratch Token' }] },
        { kind: 'unlock', quests: ['env_scratch_q'] },
      ], { questId: 't', state: scratch, pushMsg: () => {} }));
      return {
        // scratch got everything...
        scratchFlag: scratch.envScratchFlag === true,
        scratchXp: scratch.xp,
        scratchQuest: scratch.quests.env_scratch_q,
        scratchItem: scratch.inventory.some(i => i.name === 'Scratch Token'),
        // ...and the live S_story got NONE of it
        liveFlag: 'envScratchFlag' in S_story,
        liveQuest: 'env_scratch_q' in (S_story.quests || {}),
        liveInvGrew: (S_story.inventory || []).length !== liveInvBefore,
      };
    }, NEWGAME);
    expect(r.scratchFlag).toBe(true);
    expect(r.scratchXp).toBe(25);
    expect(r.scratchQuest).toBe('active');
    expect(r.scratchItem).toBe(true);
    // the live state is pristine — the whole point of the seam
    expect(r.liveFlag).toBe(false);
    expect(r.liveQuest).toBe(false);
    expect(r.liveInvGrew).toBe(false);
  });

  // 3. The env threads through the §VM-01-A choice suspend/resume: a picked branch's
  //    flag_write lands in the SAME scratch env the outer execBits was handed.
  test('ctx.state survives a choice suspend/resume (picked branch writes the scratch env)', async ({ page }) => {
    await page.goto('/play.html');
    const r = await page.evaluate((NG) => {
      storyNewGame(NG);
      delete S_story.optA_taken; delete S_story.optB_taken;
      const scratch = {};
      const bit = { kind: 'choice', prompt: 'Which door?', options: [
        { label: 'Left',  bits: [{ kind: 'flag_write', set: ['optA_taken'] }] },
        { label: 'Right', bits: [{ kind: 'flag_write', set: ['optB_taken'] }] },
      ] };
      const gen = QuestRuntime.execBits([bit], { state: scratch });
      const ask = _uqfPump(gen);          // suspends at the choice
      _uqfPump(gen, 0);                    // resume: pick "Left"
      return {
        asked: !!(ask && ask.ask === 'choice'),
        scratchA: scratch.optA_taken === true,
        scratchB: 'optB_taken' in scratch,
        liveA: 'optA_taken' in S_story,     // the pick did NOT touch the live state
      };
    }, NEWGAME);
    expect(r.asked).toBe(true);
    expect(r.scratchA).toBe(true);   // picked branch wrote the scratch env
    expect(r.scratchB).toBe(false);  // unpicked branch never ran
    expect(r.liveA).toBe(false);     // S_story untouched across the suspend/resume
  });

  // 4. item_check reads the env inventory (not the live one): an item present only in
  //    scratch satisfies the check under { state: scratch } and fails under the live env.
  test('item_check reads ctx.state.inventory', async ({ page }) => {
    await page.goto('/play.html');
    const r = await page.evaluate((NG) => {
      storyNewGame(NG);
      S_story.inventory = (S_story.inventory || []).filter(i => i.name !== 'Env Key');  // ensure absent live
      const scratch = { inventory: [{ name: 'Env Key' }] };
      const scratchCtx = { state: scratch };
      _uqfRunToCompletion(QuestRuntime.execBits([{ kind: 'item_check', name: 'Env Key' }], scratchCtx));
      const liveCtx = {};   // defaults to live S_story
      _uqfRunToCompletion(QuestRuntime.execBits([{ kind: 'item_check', name: 'Env Key' }], liveCtx));
      return { scratchHit: scratchCtx._itemCheck, liveHit: liveCtx._itemCheck };
    }, NEWGAME);
    expect(r.scratchHit).toBe(true);   // found it in the scratch inventory
    expect(r.liveHit).toBe(false);     // not in the live inventory
  });

  // 5. _legacy_fn receives the env as its state arg (live path: ctx.state === S_story),
  //    so a legacy fn run under an explicit env touches scratch, not the live state.
  test('_legacy_fn receives ctx.state, not the S_story global', async ({ page }) => {
    await page.goto('/play.html');
    const r = await page.evaluate((NG) => {
      storyNewGame(NG);
      delete S_story.legacyTouched;
      const scratch = {};
      const bit = { kind: '_legacy_fn', fn: (state) => { state.legacyTouched = true; } };
      _uqfRunToCompletion(QuestRuntime.execBits([bit], { state: scratch }));
      return { scratchTouched: scratch.legacyTouched === true, liveTouched: 'legacyTouched' in S_story };
    }, NEWGAME);
    expect(r.scratchTouched).toBe(true);
    expect(r.liveTouched).toBe(false);
  });
});
