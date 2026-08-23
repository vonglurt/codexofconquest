// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson and Claude
'use strict';
const { test, expect } = require('@playwright/test');

// ── §MESH-01g — hireling guide bot ───────────────────────────────────────────
//
// Inc (g) of the mesh gameplay ladder. SINGLE-PLAYER-FIRST: a hired-hand NPC
// that (1) costs an upfront wage plus a daily fee ticked on the day advance,
// (2) joins battles as one extra attacker die (strikes at the top of the enemy
// turn), and (3) as a quest guide drives the §NAV-01d auto-travel loop toward
// the active quest ("follow me"). Because it is single-player the record lives
// in S_story (persists in the save) — unlike the transient §MESH-01f buffs.
//
// These cases pin: the economy (hire/dismiss + day-tick wage), the pure to-hit
// resolver, the extra-die strike (no-op guards + a forced hit), and the guide's
// active-quest target resolution. Pure page-context evaluation, no server.

test.describe('§MESH-01g hireling guide bot', () => {

  test('_hirelingHire: pays upfront wage, stamps the record; refuses double-hire and when broke', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const out = {};
      S_story.hireling = null; S_story.gold = 100; S_story.day = 3;
      const rec = _hirelingHire();
      out.hired = !!rec;
      out.name = rec && rec.name;
      out.goldAfter = S_story.gold;            // 100 - 60 = 40
      out.hiredDay = rec && rec.hiredDay;      // stamped to S_story.day
      out.active = _hirelingActive();
      // Second hire refused while one is in service (no double charge).
      const g = S_story.gold;
      out.doubleHire = _hirelingHire();
      out.goldUnchanged = S_story.gold === g;
      // Broke: dismiss, drop below wage, hire refused, gold untouched.
      _hirelingDismiss();
      S_story.gold = 10;
      out.brokeHire = _hirelingHire();
      out.brokeGold = S_story.gold;
      S_story.hireling = null;                 // restore
      return out;
    });
    expect(r.hired).toBe(true);
    expect(r.name).toBe('Bram the Trailhand');
    expect(r.goldAfter).toBe(40);
    expect(r.hiredDay).toBe(3);
    expect(r.active).toBe(true);
    expect(r.doubleHire).toBeNull();
    expect(r.goldUnchanged).toBe(true);
    expect(r.brokeHire).toBeNull();
    expect(r.brokeGold).toBe(10);
  });

  test('_hirelingDayTick: pays the daily wage when affordable, auto-dismisses when broke', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const out = {};
      S_story.hireling = null; S_story.gold = 100; S_story.day = 1;
      _hirelingHire();                          // gold 100 → 40, fee 12
      // Affordable tick: fee deducted, still in service.
      const t1 = _hirelingDayTick();
      out.paid = t1.paid; out.fee = t1.fee;
      out.goldAfterPay = S_story.gold;          // 40 - 12 = 28
      out.stillActive = _hirelingActive();
      // Drop below the wage → next tick dismisses the hand, no negative gold.
      S_story.gold = 5;
      const t2 = _hirelingDayTick();
      out.dismissed = !!t2.dismissed;
      out.goldFloor = S_story.gold;             // untouched (5), never negative
      out.goneActive = _hirelingActive();
      // Tick with no hireling is a clean no-op.
      out.noopTick = _hirelingDayTick();
      S_story.hireling = null;                  // restore
      return out;
    });
    expect(r.paid).toBe(true);
    expect(r.fee).toBe(12);
    expect(r.goldAfterPay).toBe(28);
    expect(r.stillActive).toBe(true);
    expect(r.dismissed).toBe(true);
    expect(r.goldFloor).toBe(5);
    expect(r.goneActive).toBe(false);
    expect(r.noopTick).toEqual({ active: false, paid: false });
  });

  test('_hirelingResolve: nat1 auto-miss, nat20 auto-crit, else total vs AC', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const h = { atkBonus: 4 };
      return {
        nat1:   _hirelingResolve(h, 1, 5),    // auto-miss even though 1+4=5 >= 5
        nat20:  _hirelingResolve(h, 20, 99),  // auto-crit even vs AC 99
        hit:    _hirelingResolve(h, 10, 12),  // 14 >= 12 → hit, not crit
        miss:   _hirelingResolve(h, 5, 12),   // 9 < 12 → miss
      };
    });
    expect(r.nat1).toMatchObject({ nat1: true, hit: false });
    expect(r.nat20).toMatchObject({ crit: true, hit: true });
    expect(r.hit).toMatchObject({ hit: true, crit: false, total: 14 });
    expect(r.miss).toMatchObject({ hit: false, total: 9 });
  });

  test('_hirelingStrike: no-op unhired / enemy-dead; damages a live enemy on a forced hit', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const out = {};
      // Minimal battle state.
      S.round = 1;
      S.enemy = { ac: 1, atk: 0 };
      S.opp = { hp: 100, maxHp: 100, dmgMod: 0 };
      // Unhired → no-op, enemy untouched.
      S_story.hireling = null;
      out.unhired = _hirelingStrike();
      out.hpAfterUnhired = S.opp.hp;
      // Hired but enemy already dead → no-op.
      S_story.gold = 100; _hirelingHire();
      S.opp.hp = 0;
      out.deadEnemy = _hirelingStrike();
      // Live enemy + forced max roll (d20 = 20 crit) → real damage.
      S.opp.hp = 100;
      const orig = Math.random;
      Math.random = () => 0.999;               // ceil(0.999*20)=20 → crit hit, max dmg
      out.dmg = _hirelingStrike();
      Math.random = orig;
      out.hpDropped = S.opp.hp < 100;
      S_story.hireling = null;                  // restore
      return out;
    });
    expect(r.unhired).toBe(0);
    expect(r.hpAfterUnhired).toBe(100);
    expect(r.deadEnemy).toBe(0);
    expect(r.dmg).toBeGreaterThan(0);
    expect(r.hpDropped).toBe(true);
  });

  test('_hirelingQuestTarget: resolves the active quest node, null when none', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const out = {};
      // Find a real UQF quest that carries a resolvable node.
      const withNode = Object.values(QUEST_DB).find(q =>
        q && (q.waypointNode || (q.completion && q.completion.atNode) || q.activateNode) &&
        NODE_MAP[q.waypointNode || (q.completion && q.completion.atNode) || q.activateNode]);
      const expectNode = withNode.waypointNode || (withNode.completion && withNode.completion.atNode) || withNode.activateNode;
      // No active quests → null.
      S_story.quests = {};
      out.none = _hirelingQuestTarget();
      // One active quest → its node.
      S_story.quests = { [withNode.id]: 'active' };
      out.target = _hirelingQuestTarget();
      out.expected = expectNode;
      // Only completed quests → still null (not a follow target).
      S_story.quests = { [withNode.id]: 'complete' };
      out.completedOnly = _hirelingQuestTarget();
      S_story.quests = {};                      // restore
      return out;
    });
    expect(r.none).toBeNull();
    expect(r.target).toBe(r.expected);
    expect(r.completedOnly).toBeNull();
  });

  test('_hirelingGuide: sets the waypoint to the active quest (Free-Movement: same waypoint the player could set)', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const out = {};
      S_story.active = false;                    // keeps _travelStart a no-op (no real walking in-test)
      S_story.gold = 100; S_story.hireling = null; _hirelingHire();
      const withNode = Object.values(QUEST_DB).find(q =>
        q && (q.waypointNode || (q.completion && q.completion.atNode) || q.activateNode) &&
        NODE_MAP[q.waypointNode || (q.completion && q.completion.atNode) || q.activateNode]);
      const target = withNode.waypointNode || (withNode.completion && withNode.completion.atNode) || withNode.activateNode;
      S_story.quests = { [withNode.id]: 'active' };
      S_story.currentCode = target === 'LHR' ? 'INN' : 'LHR';  // ensure not already there
      S_story.waypoint = null;
      _hirelingGuide();
      out.waypoint = S_story.waypoint;
      out.expected = target;
      // No hireling → guide refuses, no waypoint set.
      S_story.hireling = null; S_story.waypoint = null;
      _hirelingGuide();
      out.noHireWp = S_story.waypoint;
      S_story.quests = {};                       // restore
      return out;
    });
    expect(r.waypoint).toBe(r.expected);
    expect(r.noHireWp).toBeNull();
  });

});
