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
      effortSum: 0, missionBits: 0, questRewardXp: 0, exploreXp: EXPLORE_XP, enginePays: 0, multiReward: 0,
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
      const rewards = onPass.filter(b => b && b.kind === 'reward');
      if (rewards.length > 1) out.multiReward++;
      if (Math.round(rewards.reduce((n, b) => n + (b.xp || 0), 0) * EFFORT_XP_PCT) > 0) out.enginePays++;
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
    // The grant scales off the whole pass value. Nothing in the corpus carries a second
    // reward bit, so the census and the engine can only agree — this holds them there.
    expect(c.enginePays).toBe(c.canPayEffort);
    expect(c.multiReward).toBe(0);
  });

  test('the grant is a quarter of the whole pass value, not of its first reward bit (§DX-02ip)', async ({ page }) => {
    await seedAndLoad(page);
    const r = await page.evaluate(() => {
      storyNewGame({ str:8, dex:8, con:8, int:8, wis:8, cha:8 });
      const mk = (id, onPass) => {
        QUEST_DB[id] = {
          schema:'UQF-1.0', type:'skill_check', title:id, activateNode:'TLL',
          passText:'p', failText:'f',
          bits:[{ kind:'skill_check', stat:'INT', dc:999, onPass, onFail:[] }],
        };
        const before = S_story.xp;
        _resolveQuestUQF(id);
        return S_story.xp - before;
      };
      return {
        // a gold-only bit standing ahead of the XP one must not hide it
        goldFirst: mk('_ip_gold_first', [{ kind:'reward', gold:50 }, { kind:'reward', xp:200 }]),
        // two XP bits: the pass pays 300, so the effort is a quarter of 300
        twoXp:     mk('_ip_two_xp',     [{ kind:'reward', xp:100 }, { kind:'reward', xp:200 }]),
        // unchanged shape — the whole corpus looks like this
        single:    mk('_ip_single',     [{ kind:'reward', xp:200 }]),
        none:      mk('_ip_none',       [{ kind:'mission_bit', flag:'ipProbeBit' }]),
      };
    });
    expect(r.goldFirst).toBe(50);   // round(200 * 0.25) — was 0
    expect(r.twoXp).toBe(75);       // round(300 * 0.25) — was 25
    expect(r.single).toBe(50);      // round(200 * 0.25) — unchanged
    expect(r.none).toBe(0);         // a token pass is still a token pass
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
