// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
'use strict';
/**
 * §DX-02aj — Layer 50's NG+ Dear-Friend memory line is deferred by one visit.
 *
 * `_renderNpcCard` writes the greeting latch `S_story[key + 'NgGreeted']` and
 * then reads it eleven lines later with no `return` between the two branches,
 * so the latch is always already set by the time the memory branch tests it.
 * The specified escalation — come back a second time and they say more — has
 * never happened: the greeting and the memory line land on the same render.
 *
 * The assertions are the fence: the two tables' key sets are equal (a memory
 * line with no greeting is mute by construction, so it must be a failure and
 * not a silence), visit 1 delivers the greeting and nothing else, visit 2
 * delivers the memory line, and it is delivered exactly once.
 */
const { test, expect } = require('@playwright/test');
const { seedAndLoad, dismissContinue, resetNpcRenderState,
        expectNpcRenderStateClean } = require('./helpers');

// BOO is Yugurt Lake — no Birka NPC is pinned there, so the load renders none of
// the six cards. The harness resets the latch per NPC anyway; this keeps the seed
// honest as well as the harness.
const NG_SEED = {
  currentCode: 'BOO',
  visited: { BOO: true },
  ngPlusRun: 1,
  npcFavorability: {},
  npcVisitCounts: {},
  ngMemoryDelivered: {},
};

// Render one NPC card `times` times, draining the 800 ms setTimeout after each
// render so `perVisit[i]` is what that visit alone spoke. Aggregating across
// visits would not discriminate the defect from the fix: the line is delivered
// exactly once either way — the whole question is WHICH visit delivers it.
const RENDER = `(key, times, fav) => {
  S_story.npcFavorability = S_story.npcFavorability || {};
  if (fav !== null) S_story.npcFavorability[key] = fav;
  // The reset is the harness's job, not this file's: resetNpcRenderState clears every
  // key one card render writes, and expectNpcRenderStateClean fails at the caller's
  // setup line if the seed rendered a card first (§DX-02gj). No backticks in here --
  // this whole block is a template literal.
  const perVisit = [];
  const quotes = [];
  const realMsg = window.storyMsg;
  const drain = () => new Promise(r => setTimeout(r, 900));
  const step = async () => {
    for (let i = 0; i < times; i++) {
      const said = [];
      window.storyMsg = (m) => { said.push(m); };
      const host = document.createElement('div');
      _renderNpcCard(key, host);
      quotes.push(host.textContent || '');
      await drain();
      perVisit.push(said);
    }
    window.storyMsg = realMsg;
    return { perVisit, quotes, latch: !!S_story[key + 'NgGreeted'],
             delivered: Object.assign({}, S_story.ngMemoryDelivered) };
  };
  return step();
}`;

test.describe('§DX-02aj — the NG+ memory line lands on the second visit', () => {

  test('the greeting and memory tables name the same NPCs', async ({ page }) => {
    await seedAndLoad(page, NG_SEED);
    await dismissContinue(page);
    const out = await page.evaluate(() => ({
      greetings: Object.keys(NPC_NG_PLUS_GREETINGS).sort(),
      memories: Object.keys(NPC_NG_MEMORY_LINES).sort(),
    }));
    // A memory line whose key has no greeting can never fire — nothing else in
    // the file writes that latch — so divergence is a defect, not a silence.
    expect(out.memories).toEqual(out.greetings);
    expect(out.memories.length).toBeGreaterThanOrEqual(6);
  });

  test('visit 1 delivers the greeting in the card and speaks nothing', async ({ page }) => {
    await seedAndLoad(page, NG_SEED);
    await dismissContinue(page);
    const keys = await page.evaluate(() => Object.keys(NPC_NG_MEMORY_LINES));
    for (const key of keys) {
      await resetNpcRenderState(page, [key]);
      await expectNpcRenderStateClean(page, [key]);
      const r = await page.evaluate(({ src, key }) =>
        eval(src)(key, 1, 2), { src: RENDER, key });
      expect(r.perVisit[0], `${key} visit 1`).toEqual([]);
      expect(r.latch, `${key} latch after visit 1`).toBe(true);
    }
  });

  test('visit 2 delivers the memory line, for every NPC that has one', async ({ page }) => {
    await seedAndLoad(page, NG_SEED);
    await dismissContinue(page);
    const keys = await page.evaluate(() => Object.keys(NPC_NG_MEMORY_LINES));
    for (const key of keys) {
      await resetNpcRenderState(page, [key]);
      await expectNpcRenderStateClean(page, [key]);
      const r = await page.evaluate(({ src, key }) =>
        eval(src)(key, 2, 2), { src: RENDER, key });
      const line = await page.evaluate(k => NPC_NG_MEMORY_LINES[k], key);
      // The discriminating assertion: nothing on visit 1, the line on visit 2.
      expect(r.perVisit[0], `${key} visit 1`).toEqual([]);
      expect(r.perVisit[1], `${key} visit 2`).toEqual([line]);
      expect(r.delivered[key], `${key} marked delivered`).toBe(true);
    }
  });

  test('a third visit says nothing more — the line is delivered once', async ({ page }) => {
    await seedAndLoad(page, NG_SEED);
    await dismissContinue(page);
    await resetNpcRenderState(page, ['brynn']);
    await expectNpcRenderStateClean(page, ['brynn']);
    const r = await page.evaluate(({ src }) => eval(src)('brynn', 3, 2), { src: RENDER });
    expect(r.perVisit.map(v => v.length)).toEqual([0, 1, 0]);
  });

  test('below Dear Friend the line never fires, however many visits', async ({ page }) => {
    await seedAndLoad(page, NG_SEED);
    await dismissContinue(page);
    await resetNpcRenderState(page, ['brynn']);
    await expectNpcRenderStateClean(page, ['brynn']);
    const r = await page.evaluate(({ src }) => eval(src)('brynn', 3, 1), { src: RENDER });
    expect(r.perVisit.flat()).toEqual([]);
    expect(r.delivered.brynn).toBeUndefined();
  });

  test('outside NG+ neither the greeting nor the memory line fires', async ({ page }) => {
    await seedAndLoad(page, Object.assign({}, NG_SEED, { ngPlusRun: 0 }));
    await dismissContinue(page);
    await resetNpcRenderState(page, ['brynn']);
    await expectNpcRenderStateClean(page, ['brynn']);
    const r = await page.evaluate(({ src }) => eval(src)('brynn', 2, 2), { src: RENDER });
    expect(r.perVisit.flat()).toEqual([]);
    expect(r.latch).toBe(false);
  });

});
