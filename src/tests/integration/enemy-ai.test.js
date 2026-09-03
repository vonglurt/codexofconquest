// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §PLAY-01-B The Conqueror's Hand — low-HP enemy behavior driving the REAL
// _storyEnemyTurn: Void-touched enemies press (one-time enrage), mundane beasts
// flee (earning effort XP). Full-HP enemies behave exactly as before.
const { test, expect } = require('@playwright/test');

test.describe('§PLAY-01-B — enemy AI per tier (press vs flee)', () => {
  test('pure helpers: classification + tier-scaled magnitudes', async ({ page }) => {
    await page.goto('/play.html');
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
    await page.goto('/play.html');
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
    await page.goto('/play.html');
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
    await page.goto('/play.html');
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

// §AUDIT-03bn — the classifier's vocabulary, pinned as a census.
//
// §PLAY-01-B chose a name heuristic over a data pass with the hazard written down
// ("fuzzy and can mis-tag", lab-report-play-01b-conquerors-hand.md §3 option (b)), and a
// regex's membership drifts silently unless something counts it. Three things decide the
// verdict, in order: the monster's explicit `voidTainted` boolean (§DX-02dj), the structural
// rule that the fish_*/night_* lake ladder is beasts, and the undead vocabulary in
// _VOID_ENEMY_RE. Each is pinned below, and the total is pinned so the set cannot drift.
test.describe('§AUDIT-03bn — Void classification is a census, not a vibe', () => {

  test('census: the tagged set is exactly the monsters the vocabulary means to tag', async ({ page }) => {
    await page.goto('/play.html');
    const r = await page.evaluate(() => {
      const tag = (key) => {
        S.enemy = Object.assign({}, S.enemy, { key, name: (MONSTER_POOL[key] || {}).name || key });
        return _isVoidEnemy();
      };
      const keys = Object.keys(MONSTER_POOL);
      const tagged = keys.filter(tag);
      const byTier = {};
      tagged.forEach(k => { const t = (MONSTER_POOL[k] || {}).tier || 'easy'; byTier[t] = (byTier[t] || 0) + 1; });
      return { total: keys.length, tagged: tagged.length, byTier,
               fishTagged: keys.filter(k => /^(fish|night)_/.test(k)).filter(tag) };
    });
    expect(r.tagged).toBe(52);
    expect(r.byTier.deadly).toBe(7);
    expect(r.fishTagged).toEqual([]);   // the lake ladder is beasts, all twenty ranks of it
  });

  test('deny list: the four the name regex used to catch by accident', async ({ page }) => {
    await page.goto('/play.html');
    const r = await page.evaluate(() => {
      const out = {};
      for (const k of ['fish_19', 'fish_20', 'night_04', 'fiend_beast']) {
        S.enemy = Object.assign({}, S.enemy, { key: k, name: MONSTER_POOL[k].name });
        out[k] = _isVoidEnemy();
      }
      return out;
    });
    expect(r).toEqual({ fish_19: false, fish_20: false, night_04: false, fiend_beast: false });
  });

  test('allow list: the undead the name regex used to miss', async ({ page }) => {
    await page.goto('/play.html');
    const r = await page.evaluate(() => {
      const out = {};
      for (const k of ['death_knight', 'vampire', 'mummy_lord', 'bruxa_corvo_bianco',
                       'zombie', 'ghost', 'banshee', 'hym', 'bone_naga', 'draug',
                       'protofleder', 'graveir', 'grave_hag', 'cyber_vampire']) {
        S.enemy = Object.assign({}, S.enemy, { key: k, name: MONSTER_POOL[k].name });
        out[k] = _isVoidEnemy();
      }
      return out;
    });
    for (const [k, v] of Object.entries(r)) expect(v, `${k} should classify Void`).toBe(true);
  });

  test('§DX-02dj: the voidTainted field beats the name vocabulary in both directions', async ({ page }) => {
    await page.goto('/play.html');
    const r = await page.evaluate(() => {
      // fiend_beast carries voidTainted:false and a name the regex matches on "fiend".
      const nameSaysVoid = /fiend/i.test(MONSTER_POOL['fiend_beast'].name);
      S.enemy = Object.assign({}, S.enemy, { key:'fiend_beast', name: MONSTER_POOL['fiend_beast'].name });
      const fieldWins = _isVoidEnemy() === false;
      // void_wolf carries voidTainted:true; the field decides before the regex is consulted.
      const wolfField = MONSTER_POOL['void_wolf'].voidTainted;
      S.enemy = Object.assign({}, S.enemy, { key:'void_wolf', name:'Placid Herbivore' });
      const fieldOverridesBlandName = _isVoidEnemy();
      return { nameSaysVoid, fieldWins, wolfField, fieldOverridesBlandName };
    });
    expect(r.nameSaysVoid).toBe(true);
    expect(r.fieldWins).toBe(true);
    expect(r.wolfField).toBe(true);
    expect(r.fieldOverridesBlandName).toBe(true);
  });
});
