// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §AUDIT-03bl — the §KG corridor advertises an L1→~L6 band and its minimum path
// landed at Level 5.
//
// This chain has now had its XP arithmetic done wrong twice by hand: the lab report
// overcounted quest XP by 200 (an addition error over eleven values it printed
// itself) and battle XP by 196 (it assumed `gladiator_bot ×4`, but `monsterKills` is
// cumulative and never resets, so kg_05's one kill counts toward kg_06's ≥3 and the
// true minimum is ×3). Its own contingency lever, +150, was budgeted against the
// wrong total and could not have closed a 199 gap either.
//
// So the fix is not a number written into a doc. It is this file: the whole model is
// re-derived from the shipped QUEST_DB and MONSTER_POOL every run, and the assertion
// is against XP_LEVELS itself. Retune a capstone, change a cull quota, restat a
// droid — the sum moves here and the band is re-checked.
//
// §AUDIT-03bl took option (a): raise the two capstones far enough to clear 5,500 on
// the minimum path, keeping the cull quotas as authored so pacing rather than
// arithmetic drives the level-up.

const { test, expect } = require('@playwright/test');
const { seedAndLoad } = require('./helpers.js');

// The minimum path: what a player must kill, counting the cumulative counter once.
const MIN_KILLS = {
  sparring_droid:    3,   // kg_01
  komsomol_cadet:    4,   // kg_03
  gladiator_bot:     3,   // kg_05 (≥1) and kg_06 (≥3) share one cumulative counter
  zavod_sparbot:     3,   // kg_06
  fabrika_enforcer:  3,   // kg_08
  trainer_bot_prime: 1,   // kg_09
};

const CHAIN = Array.from({ length: 11 }, (_, i) => `quest_kg_${String(i + 1).padStart(2, '0')}`);

async function model(page) {
  return page.evaluate(([CHAIN, MIN_KILLS]) => {
    const rewards = (arr) => (arr || []).filter(o => o.kind === 'reward');
    let questXp = 0, gold = 0;
    const perQuest = {};
    for (const id of CHAIN) {
      const q = QUEST_DB[id];
      let xp = 0, g = 0;
      for (const r of rewards(q.onComplete)) { xp += r.xp || 0; g += r.gold || 0; }
      for (const b of q.bits || []) for (const r of rewards(b.onPass)) { xp += r.xp || 0; g += r.gold || 0; }
      perQuest[id] = xp; questXp += xp; gold += g;
    }
    let battleXp = 0;
    const products = {};
    for (const [key, n] of Object.entries(MIN_KILLS)) {
      const m = MONSTER_POOL[key];
      const p = Math.round((m.ac || 10) * (m.maxHp || m.hp || 10));
      products[key] = p;
      battleXp += p * n;
    }
    return { questXp, gold, battleXp, perQuest, products, l6: XP_LEVELS[5] };
  }, [CHAIN, MIN_KILLS]);
}

test.describe('§AUDIT-03bl — the corridor clears the level it advertises', () => {

  test('the minimum path reaches Level 6, re-derived from the shipped data', async ({ page }) => {
    await seedAndLoad(page);
    const m = await model(page);
    expect(m.l6).toBe(5500);
    expect(m.questXp + m.battleXp).toBeGreaterThanOrEqual(m.l6);
  });

  test('the six per-monster products are the ones the model is built on', async ({ page }) => {
    await seedAndLoad(page);
    const m = await model(page);
    expect(m.products).toEqual({
      sparring_droid: 45, komsomol_cadet: 96, gladiator_bot: 196,
      zavod_sparbot: 130, fabrika_enforcer: 208, trainer_bot_prime: 390,
    });
    expect(m.battleXp).toBe(2511);
  });

  test('the cull quotas were kept as authored — the lever was the capstones', async ({ page }) => {
    await seedAndLoad(page);
    const quotas = await page.evaluate(() => {
      const out = {};
      for (const id of ['quest_kg_01','quest_kg_03','quest_kg_05','quest_kg_06','quest_kg_08','quest_kg_09']) {
        for (const c of QUEST_DB[id].completion?.countMin || []) out[id + ':' + c.path.split('.').pop()] = c.min;
      }
      return out;
    });
    expect(quotas).toEqual({
      'quest_kg_01:sparring_droid': 3,
      'quest_kg_03:komsomol_cadet': 4,
      'quest_kg_05:gladiator_bot': 1,
      'quest_kg_06:gladiator_bot': 3,
      'quest_kg_06:zavod_sparbot': 3,
      'quest_kg_08:fabrika_enforcer': 3,
      'quest_kg_09:trainer_bot_prime': 1,
    });
  });

  test('every quest in the chain still grants XP, so no link pays nothing', async ({ page }) => {
    await seedAndLoad(page);
    const m = await model(page);
    for (const id of CHAIN) expect(m.perQuest[id]).toBeGreaterThan(0);
    expect(m.gold).toBe(450);
  });
});
