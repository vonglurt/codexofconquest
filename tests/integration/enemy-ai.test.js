// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson and Claude
// §PLAY-01-B The Conqueror's Hand — low-HP enemy behavior driving the REAL
// _storyEnemyTurn: Void-touched enemies press (one-time enrage), mundane beasts
// flee (earning effort XP). Full-HP enemies behave exactly as before.
const { test, expect } = require('@playwright/test');

test.describe('§PLAY-01-B — enemy AI per tier (press vs flee)', () => {
  test('pure helpers: classification + tier-scaled magnitudes', async ({ page }) => {
    await page.goto('/index.html');
    const r = await page.evaluate(() => {
      storyNewGame({ str:10, dex:8, con:8, int:8, wis:8, cha:8 });   // S_story valid; at LHR (non-void)
      const out = {};
      // classification heuristic (name/terrain)
      S.enemy = Object.assign({}, S.enemy, { name:'Void Wolf', key:'void_wolf' });
      out.voidByName = _isVoidEnemy();
      S.enemy = Object.assign({}, S.enemy, { name:'Skeletal Archer', key:'skel_1' });
      out.voidByUndead = _isVoidEnemy();
      S.enemy = Object.assign({}, S.enemy, { name:'Giant Rat', key:'giant_rat' });
      out.mundane = _isVoidEnemy();                                   // rat at Birka city — not void
      // tier scaling
      out.enrageEasy = _voidEnrage('easy');
      out.enrageDeadly = _voidEnrage('deadly');
      out.fleeEasyGtHard = _fleeChance('easy') > _fleeChance('hard');
      out.fleeDeadlyLow = _fleeChance('deadly');
      out.effortPct = EFFORT_XP_PCT;
      return out;
    });
    expect(r.voidByName).toBe(true);
    expect(r.voidByUndead).toBe(true);
    expect(r.mundane).toBe(false);
    expect(r.enrageEasy).toEqual({ atk:1, dmg:1, die:0 });
    expect(r.enrageDeadly).toEqual({ atk:4, dmg:4, die:1 });
    expect(r.fleeEasyGtHard).toBe(true);
    expect(r.fleeDeadlyLow).toBeLessThanOrEqual(0.1);
    expect(typeof r.effortPct).toBe('number');
  });

  test('Void enemy presses ONCE at low HP (enrage is not per-turn)', async ({ page }) => {
    await page.goto('/index.html');
    const r = await page.evaluate(() => {
      storyNewGame({ str:10, dex:8, con:8, int:8, wis:8, cha:8 });
      _storyRollInit();                                              // resets S.opp.enraged
      Object.assign(S.enemy, { name:'Void Wolf', key:'void_wolf', ac:14, atk:5, dmgDie:8, dmgCount:2, dmgFlat:3, maxHp:100 });
      Object.assign(S.opp, { tier:'hard', hp:20, maxHp:100, enraged:false });   // 20 <= 30% of 100
      Object.assign(S.player, { hp:45, maxHp:45, dmgMod:1 });
      Object.assign(S.char, { ac:16 });
      const _rand = Math.random; Math.random = () => 0.5;            // deterministic d20; no flee path for void
      const atkBefore = S.enemy.atk;
      _storyEnemyTurn();                                            // should enrage: hard = +3 atk
      const atkAfter1 = S.enemy.atk, enraged1 = S.opp.enraged, dmgFlat1 = S.enemy.dmgFlat;
      S.opp.hp = 15;                                                // still low
      _storyEnemyTurn();                                           // must NOT enrage again
      const atkAfter2 = S.enemy.atk;
      Math.random = _rand;
      return { atkBefore, atkAfter1, atkAfter2, enraged1, dmgFlat1 };
    });
    expect(r.atkBefore).toBe(5);
    expect(r.atkAfter1).toBe(8);      // +3 for hard tier, once
    expect(r.enraged1).toBe(true);
    expect(r.dmgFlat1).toBe(6);       // +3 dmg
    expect(r.atkAfter2).toBe(8);      // unchanged on the second turn — one-time
  });

  test('mundane beast flees at low HP, earns effort XP, closes the fight', async ({ page }) => {
    await page.goto('/index.html');
    const r = await page.evaluate(() => {
      storyNewGame({ str:10, dex:8, con:8, int:8, wis:8, cha:8 });
      _storyRollInit();
      Object.assign(S.enemy, { name:'Giant Rat', key:'giant_rat', ac:10, atk:3, dmgDie:4, dmgCount:1, dmgFlat:0, maxHp:20 });
      Object.assign(S.opp, { tier:'easy', hp:5, maxHp:20, enraged:false });   // 5 <= 30% of 20
      Object.assign(S.player, { hp:45, maxHp:45, dmgMod:1 });
      Object.assign(S.char, { ac:16 });
      document.getElementById('story-battle-overlay').classList.add('visible');
      const xpBefore = S_story.xp;
      const _rand = Math.random; Math.random = () => 0;             // 0 < fleeChance → flee
      _storyEnemyTurn();
      Math.random = _rand;
      return {
        xpGain: S_story.xp - xpBefore,
        overlayHidden: !document.getElementById('story-battle-overlay').classList.contains('visible'),
        pendingCleared: S_story.pendingBattle === null,
      };
    });
    expect(r.xpGain).toBe(Math.round(10 * 20 * 0.25));   // AC*maxHp*EFFORT_XP_PCT = 50
    expect(r.overlayHidden).toBe(true);
    expect(r.pendingCleared).toBe(true);
  });

  test('full-HP enemy behaves as before — no enrage, no flee (regression)', async ({ page }) => {
    await page.goto('/index.html');
    const r = await page.evaluate(() => {
      storyNewGame({ str:10, dex:8, con:8, int:8, wis:8, cha:8 });
      _storyRollInit();
      Object.assign(S.enemy, { name:'Void Wolf', key:'void_wolf', ac:14, atk:5, dmgDie:8, dmgCount:2, dmgFlat:3, maxHp:100 });
      Object.assign(S.opp, { tier:'hard', hp:100, maxHp:100, enraged:false });   // full HP
      Object.assign(S.player, { hp:45, maxHp:45, dmgMod:1 });
      Object.assign(S.char, { ac:16 });
      document.getElementById('story-battle-overlay').classList.add('visible');
      const _rand = Math.random; Math.random = () => 0.5;
      const atkBefore = S.enemy.atk;
      _storyEnemyTurn();
      Math.random = _rand;
      return {
        atkUnchanged: S.enemy.atk === atkBefore,
        notEnraged: S.opp.enraged === false,
        stillFighting: !document.getElementById('story-battle-overlay').classList.contains('visible') === false,
      };
    });
    expect(r.atkUnchanged).toBe(true);
    expect(r.notEnraged).toBe(true);
    expect(r.stillFighting).toBe(true);
  });
});
