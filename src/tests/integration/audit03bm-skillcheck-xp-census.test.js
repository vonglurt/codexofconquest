// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §AUDIT-03bm — the reach of the effort-XP grant, re-derived from the shipped QUEST_DB.
//
// §XP-01 pays a failed skill-check `EFFORT_XP_PCT` of the reward the pass would have
// given. Where the pass pays no `reward` bit, 25% of nothing is nothing — and that is
// the overwhelming majority of the corpus: those checks pay a mission-bit token, minted
// by `_grantMissionBit`, which awards no XP on either side of the roll.
//
// §AUDIT-03bm settled that as deliberate (option (b)): XP is the currency of the combat
// and exploration loops; a witnessed moment is denominated in tokens. The alternative —
// a flat grant inside the `mission_bit` opcode — was declined on the size of the move,
// which this file also measures: it would mint more XP than every authored quest reward
// in the game put together.
//
// The point of the file is that none of those numbers is written into a doc and left
// there. Author a reward bit onto a mission-bit check, or strip one off, and the census
// moves here.

const { test, expect } = require('@playwright/test');
const { seedAndLoad } = require('./helpers.js');

async function census(page) {
  return page.evaluate(() => {
    const bitsOf = (q) => Array.isArray(q.bits) ? q.bits : [];
    const out = {
      quests: Object.keys(QUEST_DB).length,
      skillCheck: 0, onFailEmpty: 0, canPayEffort: 0, missionBitOnly: 0,
      effortSum: 0, missionBits: 0, questRewardXp: 0, exploreXp: EXPLORE_XP, enginePays: 0,
    };
    const walk = (o, fn) => {
      if (!o || typeof o !== 'object') return;
      if (Array.isArray(o)) return o.forEach(x => walk(x, fn));
      fn(o);
      Object.values(o).forEach(x => walk(x, fn));
    };
    for (const id of Object.keys(QUEST_DB)) {
      const q = QUEST_DB[id];
      walk(bitsOf(q), (o) => {
        if (o.kind === 'reward' && typeof o.xp === 'number') out.questRewardXp += o.xp;
        if (o.kind === 'mission_bit') out.missionBits++;
      });
      walk(q.onComplete, (o) => {
        if (o.kind === 'reward' && typeof o.xp === 'number') out.questRewardXp += o.xp;
        if (o.kind === 'mission_bit') out.missionBits++;
      });
      const sc = bitsOf(q).find(b => b && b.kind === 'skill_check');
      if (!sc) continue;
      out.skillCheck++;
      if ((sc.onFail || []).length === 0) out.onFailEmpty++;
      const onPass = sc.onPass || [];
      const reward = onPass.find(b => b && b.kind === 'reward' && b.xp > 0);
      // The engine reads the FIRST reward bit, not the first one carrying xp (§DX-02ip).
      if (Math.round(((onPass.find(b => b.kind === 'reward') || {}).xp || 0) * EFFORT_XP_PCT) > 0) out.enginePays++;
      if (reward) { out.canPayEffort++; out.effortSum += Math.round(reward.xp * EFFORT_XP_PCT); }
      else if (onPass.some(b => b && b.kind === 'mission_bit')) out.missionBitOnly++;
    }
    return out;
  });
}

test.describe('§AUDIT-03bm — effort XP reaches the checks that pay a reward, and only those', () => {

  test('the failed-check grant is proportional, so a token-only pass pays nothing on failure', async ({ page }) => {
    await seedAndLoad(page);
    const c = await census(page);
    // The rule is a percentage of the pass value, not a floor. This is the whole call.
    expect(c.canPayEffort + c.missionBitOnly).toBeLessThanOrEqual(c.skillCheck);
    expect(c.canPayEffort).toBeLessThan(c.skillCheck * 0.05);
    expect(c.missionBitOnly).toBeGreaterThan(c.skillCheck * 0.85);
  });

  test('the census the call was made on, re-derived at HEAD', async ({ page }) => {
    await seedAndLoad(page);
    const c = await census(page);
    expect(c.skillCheck).toBe(2635);
    expect(c.onFailEmpty).toBe(2602);
    expect(c.canPayEffort).toBe(92);
    expect(c.missionBitOnly).toBe(2384);
    expect(c.effortSum).toBe(4205);
  });

  test('every check that carries pass XP is one the engine actually pays for (§DX-02ip)', async ({ page }) => {
    await seedAndLoad(page);
    const c = await census(page);
    // _resolveQuestUQF takes the first `reward` bit, so a gold-only bit ahead of the
    // XP one silently zeroes the grant. No quest is shaped that way — this holds it there.
    expect(c.enginePays).toBe(c.canPayEffort);
  });

  test('a flat mission-bit grant would out-mint every authored quest reward in the game', async ({ page }) => {
    await seedAndLoad(page);
    const c = await census(page);
    // The size of the declined move, at the EXPLORE_XP dial the option cited as precedent.
    expect(c.missionBits * c.exploreXp).toBeGreaterThan(c.questRewardXp);
  });

  test('_grantMissionBit awards no XP — the token is the whole payment', async ({ page }) => {
    await seedAndLoad(page);
    const delta = await page.evaluate(() => {
      storyNewGame({ str:10, dex:8, con:8, int:8, wis:8, cha:8 });
      const before = S_story.xp;
      _grantMissionBit('auditBmProbeFlag', 'Audit Bm Probe');
      return { xp: S_story.xp - before, token: S_story.inventory.some(i => i.flagRef === 'auditBmProbeFlag') };
    });
    expect(delta.token).toBe(true);
    expect(delta.xp).toBe(0);
  });
});
