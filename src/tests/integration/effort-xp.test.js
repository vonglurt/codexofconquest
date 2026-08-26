// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §XP-01 Universal Effort XP — a missed attack and a failed skill-check still earn XP
// (all action earns XP; you never lose XP). Combat misses = 2% of the kill value, capped
// per encounter at the flee value (25% of the kill). Failed skill-checks = 25% of the
// quest's own reward XP, once per quest. Drives the REAL _overlayPlayerAttack /
// _resolveQuestUQF. DUEL:CORE kernel is never touched (single-player S_story only).
const { test, expect } = require('@playwright/test');

test.describe('§XP-01 — universal effort XP (misses + failed checks)', () => {
  test('missed attack grants fractional effort XP; per-encounter cap holds', async ({ page }) => {
    await page.goto('/play.html');
    const r = await page.evaluate(() => {
      storyNewGame({ str:10, dex:8, con:8, int:8, wis:8, cha:8 });
      _storyRollInit();                                   // resets S.effortXpEarned = 0
      // Enemy AC absurdly high → every swing misses deterministically; kill = ac*maxHp.
      Object.assign(S.enemy, { ac:100, atk:0, dmgDie:4, dmgCount:1, dmgFlat:0, maxHp:10 });
      Object.assign(S.opp,   { tier:'easy', hp:10, maxHp:10, enraged:false, adv:'norm' });
      Object.assign(S.player,{ hp:45, maxHp:45, dmgMod:0, adv:'norm' });
      Object.assign(S.char,  { ac:16 });
      const kill = 100 * 10;                              // 1000
      const perMiss = Math.round(kill * EFFORT_MISS_PCT); // round(1000*0.02) = 20
      const cap     = Math.round(kill * EFFORT_XP_PCT);   // round(1000*0.25) = 250
      const _rand = Math.random; Math.random = () => 0.5; // d20 = 10 → not nat1, not crit, 10 < 100 = miss
      const xp0 = S_story.xp;
      // one miss
      S_story.battleTurn = 'player'; S_story.usedMainAttack = false;
      _overlayPlayerAttack();
      const afterOne = S_story.xp - xp0;
      // grind misses well past the cap
      for (let i = 0; i < 30; i++) {
        S_story.battleTurn = 'player'; S_story.usedMainAttack = false;
        _overlayPlayerAttack();
      }
      const total = S_story.xp - xp0;
      Math.random = _rand;
      return { perMiss, cap, afterOne, total, banked: S.effortXpEarned };
    });
    expect(r.afterOne).toBe(r.perMiss);   // first miss = 2% of kill
    expect(r.total).toBe(r.cap);          // never exceeds the flee value (25% of kill)
    expect(r.banked).toBe(r.cap);         // accumulator tracks the same cap
  });

  test('misses bank XP silently — no mid-combat level-up modal', async ({ page }) => {
    await page.goto('/play.html');
    const r = await page.evaluate(() => {
      storyNewGame({ str:10, dex:8, con:8, int:8, wis:8, cha:8 });
      _storyRollInit();
      // Big enemy so a couple misses cross the Lv2 threshold (400 XP) — the modal must stay hidden.
      Object.assign(S.enemy, { ac:1000, atk:0, dmgDie:4, dmgCount:1, dmgFlat:0, maxHp:100 });
      Object.assign(S.opp,   { tier:'easy', hp:100, maxHp:100, enraged:false, adv:'norm' });
      Object.assign(S.player,{ hp:45, maxHp:45, dmgMod:0, adv:'norm' });
      Object.assign(S.char,  { ac:16 });
      const _rand = Math.random; Math.random = () => 0.5;
      const xp0 = S_story.xp;
      for (let i = 0; i < 3; i++) {
        S_story.battleTurn = 'player'; S_story.usedMainAttack = false;
        _overlayPlayerAttack();
      }
      Math.random = _rand;
      const modalVisible = document.getElementById('story-levelup-modal').classList.contains('visible');
      return { gained: S_story.xp - xp0, crossedLevel: (S_story.xp - xp0) >= 400, modalVisible };
    });
    expect(r.gained).toBeGreaterThan(0);
    expect(r.crossedLevel).toBe(true);    // enough XP to level...
    expect(r.modalVisible).toBe(false);   // ...but no modal interrupts the attack loop
  });

  test('failed skill-check grants 25% of reward XP, once per quest', async ({ page }) => {
    await page.goto('/play.html');
    const r = await page.evaluate(() => {
      storyNewGame({ str:8, dex:8, con:8, int:8, wis:8, cha:8 });
      // §DX-02f: force the FAIL by raising the DC out of reach, not by stubbing
      // Math.random — §VM-01-B moved _rollSkill's d20 onto the seeded stream
      // (QuestRuntime._rollSkill → E.rng()), so a Math.random stub controls nothing
      // and the check became a coin flip. Same idiom warrants-board.test.js uses to
      // force a deterministic PASS (sc.dc = -100). Restored after each call.
      const forceFail = (id, fn) => {
        const sc = QUEST_DB[id].bits.find(b => b.kind === 'skill_check');
        const savedDc = sc.dc; sc.dc = 999;      // unreachable: max total is d20(20)+mod+prof
        try { return fn(); } finally { sc.dc = savedDc; }
      };

      // quest_muffat_01: onPass reward xp:150 → effort = round(150 * 0.25) = 38
      const xpA0 = S_story.xp;
      forceFail('quest_muffat_01', () => _resolveQuestUQF('quest_muffat_01'));
      const firstFail = S_story.xp - xpA0;
      // a SECOND failure of the same quest must grant 0 (once-per-quest guard)
      S_story.quests['quest_muffat_01'] = 'active';                 // pretend it's live again
      const xpA1 = S_story.xp;
      forceFail('quest_muffat_01', () => _resolveQuestUQF('quest_muffat_01'));
      const secondFail = S_story.xp - xpA1;

      // rix_09_act1: onPass:[] (no reward bit) → effort 0
      const xpB0 = S_story.xp;
      forceFail('rix_09_act1', () => _resolveQuestUQF('rix_09_act1'));
      const noRewardFail = S_story.xp - xpB0;

      return { firstFail, secondFail, noRewardFail, guarded: !!S_story.effortXpQuests['quest_muffat_01'] };
    });
    expect(r.firstFail).toBe(38);        // round(150 * 0.25)
    expect(r.secondFail).toBe(0);        // guard blocks the retry
    expect(r.noRewardFail).toBe(0);      // nothing to scale off
    expect(r.guarded).toBe(true);
  });

  // §DX-02de — the fail branch WROTE the notice and `storyRender`'s unconditional tail
  // `storyMsg(parts.join(…))` destroyed it in the same synchronous tick, so it never
  // painted a frame in 37 days. The pass branch had already been repaired for exactly
  // this hazard (§BOARD-01-FU6's `_passMsgs` buffer, under a comment naming the failure
  // mode verbatim) and the repair stopped nineteen lines short. The fail branch now
  // uses the same buffered-prefix idiom.
  test('§DX-02de — the effort notice survives the render that used to erase it', async ({ page }) => {
    await page.goto('/play.html');
    const r = await page.evaluate(() => {
      storyNewGame({ str:8, dex:8, con:8, int:8, wis:8, cha:8 });
      const sc = QUEST_DB['quest_muffat_01'].bits.find(b => b.kind === 'skill_check');
      const savedDc = sc.dc; sc.dc = 999;
      const xp0 = S_story.xp;
      try { _resolveQuestUQF('quest_muffat_01'); } finally { sc.dc = savedDc; }
      return { msg: document.getElementById('story-move-msg').textContent, gained: S_story.xp - xp0 };
    });
    // The XP always arrived; it is the telling that was deleted. §XP-01's whole job is
    // to teach that failure is not a dead end, in this one sentence.
    expect(r.gained).toBe(38);
    expect(r.msg).toContain('The attempt was not wasted');
    expect(r.msg).toContain('+38 XP');
  });

  // §DX-02df — story mode tallies exactly two attack surfaces and paid for one. The
  // off-hand bonus-action swing calls `_statTally('attacksAttempted', 1)` and its miss
  // branch returned without granting: the one swing the engine counts and refuses to
  // pay for, left to the dual-wielding player alone.
  test('§DX-02df — an off-hand miss earns effort XP, under the same shared cap', async ({ page }) => {
    await page.goto('/play.html');
    const r = await page.evaluate(() => {
      storyNewGame({ str:10, dex:8, con:8, int:8, wis:8, cha:8 });
      _storyRollInit();
      Object.assign(S.enemy, { ac:100, atk:0, dmgDie:4, dmgCount:1, dmgFlat:0, maxHp:10 });
      Object.assign(S.opp,   { tier:'easy', hp:10, maxHp:10, enraged:false, adv:'norm' });
      Object.assign(S.player,{ hp:45, maxHp:45, dmgMod:0, adv:'norm' });
      Object.assign(S.char,  { ac:16 });
      S.offhand = { die:4, count:1 };
      S_story.equippedShield = null;
      const kill = 100 * 10;
      const perMiss = Math.round(kill * EFFORT_MISS_PCT);
      const cap     = Math.round(kill * EFFORT_XP_PCT);
      const _rand = Math.random; Math.random = () => 0.5;

      // one off-hand miss on its own — the case that paid nothing before
      const xp0 = S_story.xp;
      S_story.battleTurn = 'player'; S_story.usedMainAttack = true; S_story.usedBonusAction = false;
      _overlayOffhandAttack();
      const offhandOnly = S_story.xp - xp0;

      // the cap is per ENCOUNTER and shared, not per surface: grind both past it
      for (let i = 0; i < 30; i++) {
        S_story.battleTurn = 'player'; S_story.usedMainAttack = false; S_story.usedBonusAction = false;
        _overlayPlayerAttack();
        S_story.battleTurn = 'player'; S_story.usedMainAttack = true; S_story.usedBonusAction = false;
        _overlayOffhandAttack();
      }
      const total = S_story.xp - xp0;
      Math.random = _rand;
      return { perMiss, cap, offhandOnly, total, banked: S.effortXpEarned };
    });
    expect(r.offhandOnly).toBe(r.perMiss);
    expect(r.total).toBe(r.cap);
    expect(r.banked).toBe(r.cap);
  });

  // §XP-FLEE — the parting swing inside `_storyFleeMutual` was neither counted nor paid:
  // invisible to `attacksAttempted` as well as to the XP. The call taken was (b) of the
  // row's three — pay it without tallying it — because the *all action earns XP*
  // directive is explicit while the meaning of `attacksAttempted` (deliberate attacks)
  // is not, and tallying would retroactively change the hit-rate every save prints.
  test('§XP-FLEE — the mutual-flee swing pays effort XP on a miss and is still not tallied', async ({ page }) => {
    await page.goto('/play.html');
    const r = await page.evaluate(() => {
      storyNewGame({ str:10, dex:8, con:8, int:8, wis:8, cha:8 });
      _storyRollInit();
      Object.assign(S.enemy, { ac:100, atk:0, dmgDie:4, dmgCount:1, dmgFlat:0, maxHp:10 });
      Object.assign(S.opp,   { tier:'easy', hp:10, maxHp:10, enraged:false, adv:'norm' });
      Object.assign(S.player,{ hp:45, maxHp:45, dmgMod:0, adv:'norm' });
      Object.assign(S.char,  { ac:16 });
      S.offhand = { die:4, count:1 };
      S_story.equippedShield = null;
      const kill = 100 * 10;
      const perMiss = Math.round(kill * EFFORT_MISS_PCT);
      const cap     = Math.round(kill * EFFORT_XP_PCT);
      const _rand = Math.random; Math.random = () => 0.5;   // both rolls 10: player misses AC 100, enemy misses AC 16

      const xp0 = S_story.xp;
      const tally0 = S_story.runStats.attacksAttempted;
      S_story.battleTurn = 'player'; S_story.usedMainAttack = false; S_story.usedBonusAction = false;
      _storyFleeMutual();
      const fleeOnly = S_story.xp - xp0;
      const tallyDelta = S_story.runStats.attacksAttempted - tally0;
      const logged = document.getElementById('sbo-log').textContent;

      // the cap is per ENCOUNTER and shared across ALL THREE surfaces
      for (let i = 0; i < 30; i++) {
        S_story.battleTurn = 'player'; S_story.usedMainAttack = false; S_story.usedBonusAction = false;
        _overlayPlayerAttack();
        S_story.battleTurn = 'player'; S_story.usedMainAttack = true; S_story.usedBonusAction = false;
        _overlayOffhandAttack();
        S_story.battleTurn = 'player'; S_story.usedMainAttack = false; S_story.usedBonusAction = false;
        _storyFleeMutual();
      }
      const total = S_story.xp - xp0;
      Math.random = _rand;
      return { perMiss, cap, fleeOnly, tallyDelta, total, banked: S.effortXpEarned, logged };
    });
    expect(r.fleeOnly).toBe(r.perMiss);      // the swing pays one miss
    expect(r.tallyDelta).toBe(0);            // (b): it is still not a deliberate attack
    expect(r.logged).toContain('XP effort'); // and the player is told
    expect(r.total).toBe(r.cap);             // three surfaces, one cap
    expect(r.banked).toBe(r.cap);
  });
});
