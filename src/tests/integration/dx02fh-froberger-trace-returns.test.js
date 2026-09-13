// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02fh — a delivered Froberger trace rejoins the NPC's pool.
//
// Layer 45 §II: "After delivery, the trace text is added to the NPC's permanent
// Friendly/Dear Friend pool so it can resurface naturally." The pool is chosen per
// visit and indexed by the visit count, so the trace is derived from the saved
// `frobergerTrace_<key>_delivered` flag rather than pushed into a table, and survives
// a reload for that reason.

const { test, expect } = require('@playwright/test');
const { seedAndLoad } = require('./helpers.js');

const NEWGAME = { str: 10, dex: 8, con: 8, int: 8, wis: 8, cha: 8 };

test.describe('§DX-02fh — a delivered Froberger trace comes back', () => {

  test('after delivery the trace resurfaces in the Dear Friend cycle', async ({ page }) => {
    await seedAndLoad(page);
    const r = await page.evaluate((ng) => {
      storyNewGame(ng);
      _setNpcFavor('yael', 2);
      const text = FROBERGER_TRACES.yael.text;
      let shown = 0;
      for (let i = 0; i < 40; i++) if (_getNPCDialogue('yael').quote === text) shown++;
      return { shown, delivered: !!S_story.frobergerTrace_yael_delivered, poolUntouched: !NPC_DIALOGUES.yael.dearFriend.includes(text) };
    }, NEWGAME);
    expect(r.delivered).toBe(true);
    expect(r.shown, 'delivered once, then part of the cycle').toBeGreaterThan(1);
    expect(r.poolUntouched, 'the authored table is not mutated').toBe(true);
  });

  test('a saved delivery flag alone puts the trace back in the pool', async ({ page }) => {
    await seedAndLoad(page);
    const r = await page.evaluate((ng) => {
      storyNewGame(ng);
      _setNpcFavor('auros', 2);
      S_story.frobergerTrace_auros_delivered = true;
      const text = FROBERGER_TRACES.auros.text;
      const seen = [];
      for (let i = 0; i < 40; i++) seen.push(_getNPCDialogue('auros').quote);
      return { hits: seen.filter(q => q === text).length };
    }, NEWGAME);
    expect(r.hits).toBeGreaterThan(0);
  });

  test('a trace whose favor gate is not met never enters the pool', async ({ page }) => {
    await seedAndLoad(page);
    const r = await page.evaluate((ng) => {
      storyNewGame(ng);
      _setNpcFavor('brynn', 2);
      S_story.frobergerTrace_brynn_delivered = true;
      const text = FROBERGER_TRACES.brynn.text;
      let shown = 0;
      for (let i = 0; i < 40; i++) if (_getNPCDialogue('brynn').quote === text) shown++;
      return { minFav: FROBERGER_TRACES.brynn.minFav, fav: _npcFavor('brynn'), shown };
    }, NEWGAME);
    expect(r.minFav).toBeGreaterThan(r.fav);
    expect(r.shown).toBe(0);
  });
});
