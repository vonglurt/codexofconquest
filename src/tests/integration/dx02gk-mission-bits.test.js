// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
'use strict';
/**
 * §DX-02gk — the ending scorer and the Dear-Friend contract read one table.
 *
 * Six of `_missionBits()`'s twelve bits are the six second personal acts. Five of
 * them are also Dear-Friend steps and their predicate lives once, in
 * `DEAR_FRIEND_BITS`; auros's act is `bruhnsDepthsReported`, which `quest_void_below`
 * writes beside its own absolute `set:2`, so it scores for the ending without ever
 * granting a step (§DX-02gl). The scorer keeps its own labels (`yaelEscortUsed`,
 * `crovPitTrainingWins`, …) because the design docs name them, but it does not spell
 * the five tests out: re-author an act and the ending gate moves with it.
 *
 * The bits are planted here rather than earned — `dx02gb-dear-friend-order.test.js`
 * is the case that drives the real paths. What this file asserts is the wiring.
 */
const { test, expect } = require('@playwright/test');
const { seedAndLoad, dismissContinue } = require('./helpers');

const SEED = {
  currentCode: 'BOO',
  visited: { BOO: true },
  quests: {},
  npcFavorability: {},
  journalEntriesRead: [],
  pitTrainingWins: 0,
  day: 1,
};

// The six bits that are NOT acts, all true — so the tally sits one act short of the
// threshold and a single act decides the ending.
const SIX_NON_ACTS = `() => {
  S_story.ebReturnDone = {}; _EB_CODES.forEach(c => { S_story.ebReturnDone[c] = true; });
  S_story.journalEntriesRead = [1,2,3,4,5,6,8,9,10];
  S_story.defeatedBattles = Object.assign({}, S_story.defeatedBattles, { TLS: true });
  S_story.npcFavorability = { yael: 1, brynn: 1, quill: 1 };
  S_story.visited = Object.assign({}, S_story.visited, { LHR: true });
  S_story.level = 5;
}`;

// Each act's underlying state, at the field its predicate reads.
const PLANT = {
  yael: `() => { S_story.yaelEscortUsed = true; }`,
  brynn: `() => { S_story.journalEntriesRead = (S_story.journalEntriesRead||[]).concat([7]); }`,
  quill: `() => { S_story.couperiSongReceived = true; }`,
  pachelbel: `() => { S_story.quests['quest_pachelbel_shipment'] = 'complete'; }`,
  crov: `() => { S_story.pitTrainingWins = 3; }`,
  auros: `() => { S_story.bruhnsDepthsReported = true; }`,
};

test.describe('§DX-02gk — the six act bits are read, not re-implemented', () => {

  test('the scorer names six acts, the act table names the five that grant a step, and the five are not respelled', async ({ page }) => {
    await seedAndLoad(page, SEED);
    await dismissContinue(page);

    const out = await page.evaluate(() => ({
      actKeys: Object.keys(DEAR_FRIEND_BITS).sort(),
      labelKeys: Object.keys(MISSION_ACT_BITS).sort(),
      labels: Object.values(MISSION_ACT_BITS),
      bitKeys: Object.keys(_missionBits()),
      inlineCopies: (_missionBits.toString()
        .match(/yaelEscortUsed:|couperiSongReceived|pitTrainingWins|quest_pachelbel_shipment/g) || []).length,
      aurosFlagReads: (_missionBits.toString().match(/bruhnsDepthsReported/g) || []).length,
    }));

    expect(out.labelKeys).toEqual(['auros', 'brynn', 'crov', 'pachelbel', 'quill', 'yael']);
    expect(out.actKeys).toEqual(['brynn', 'crov', 'pachelbel', 'quill', 'yael']);
    expect(out.labelKeys.filter(k => !out.actKeys.includes(k))).toEqual(['auros']);
    expect(out.bitKeys.length).toBe(12);
    for (const label of out.labels) expect(out.bitKeys).toContain(label);
    expect(out.inlineCopies).toBe(0);
    expect(out.aurosFlagReads).toBe(1);
  });

  test('every act bit equals its own predicate, before and after the act', async ({ page }) => {
    await seedAndLoad(page, SEED);
    await dismissContinue(page);

    const out = await page.evaluate((plantSrc) => {
      const read = () => {
        const bits = _missionBits();
        const r = {};
        for (const k in MISSION_ACT_BITS) r[k] = { bit: bits[MISSION_ACT_BITS[k]],
          act: !!(DEAR_FRIEND_BITS[k] ? DEAR_FRIEND_BITS[k]() : S_story[MISSION_ACT_BITS[k]]) };
        return r;
      };
      const before = read();
      for (const k in plantSrc) eval(plantSrc[k])();
      return { before, after: read() };
    }, PLANT);

    for (const k of Object.keys(PLANT)) {
      expect({ npc: k, ...out.before[k] }).toEqual({ npc: k, bit: false, act: false });
      expect({ npc: k, ...out.after[k] }).toEqual({ npc: k, bit: true, act: true });
    }
  });

  // The negative control the row asked for: a state one bit short of the ending, where
  // the missing bit is an act. If the scorer kept its own copy of the predicate, the
  // act could move without the ending moving.
  for (const key of Object.keys(PLANT)) {
    const baseline = key === 'yael' ? 'brynn' : 'yael';

    test(`${key}: the eighth bit is that act, and the act's own predicate is what decides it`, async ({ page }) => {
      await seedAndLoad(page, SEED);
      await dismissContinue(page);

      const out = await page.evaluate(([k, nonActs, basePlant, plant]) => {
        eval(nonActs)();
        eval(basePlant)();
        const actOf = () => !!(DEAR_FRIEND_BITS[k] ? DEAR_FRIEND_BITS[k]() : S_story[MISSION_ACT_BITS[k]]);
        const seven = { count: Object.values(_missionBits()).filter(Boolean).length,
                        complete: _missionComplete(), act: actOf() };
        eval(plant)();
        const eight = { count: Object.values(_missionBits()).filter(Boolean).length,
                        complete: _missionComplete(), act: actOf() };
        return { seven, eight };
      }, [key, SIX_NON_ACTS, PLANT[baseline], PLANT[key]]);

      expect(out.seven).toEqual({ count: 7, complete: false, act: false });
      expect(out.eight).toEqual({ count: 8, complete: true, act: true });
    });
  }
});
