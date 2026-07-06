'use strict';
const { test, expect } = require('@playwright/test');

// ── §MESH-01h — sentry bots (client half) ────────────────────────────────────
//
// Inc (h) of the mesh gameplay ladder. A sentry is a SERVER-owned bot session
// (wbapi-server.js — presence-visible for free) stationed at a junction. The
// CLIENT reads that presence to (1) suppress wilderness encounters in the
// sentry's cell and (2) auto-assist any battle there with one extra attacker
// die. Separately, the player bankrolls the sentries THEY deploy: an upfront
// cost + a daily upkeep drawn on rest (records in S_story.sentries, persisted).
//
// These cases pin: the presence read (_sentryHere excludes/identifies bots),
// encounter suppression, the auto-assist strike, the deploy/day-tick economy,
// and the hard invariant that a disconnected client sees no sentries at all
// (so single-player is untouched). Pure page-context evaluation, no server —
// the SERVER lifecycle (deploy/recall/suppress/presence) is gated by the
// mud-harness (tests/mud-harness.mjs §H).

test.describe('§MESH-01h sentry bots (client)', () => {

  test('_sentryHere: true only when a sentry bot is co-present and connected', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const out = {};
      // Off: a stale roster with a sentry must never register.
      MP.on = false; MP.players = [{ pid: 'a', kind: 'sentry' }];
      out.off = _sentryHere();
      // On but only players present → no sentry.
      MP.on = true; MP.players = [{ pid: 'p', kind: 'player' }, { pid: 'q' }];
      out.playersOnly = _sentryHere();
      // On with a sentry co-present.
      MP.players = [{ pid: 'p', kind: 'player' }, { pid: 's', kind: 'sentry' }];
      out.withSentry = _sentryHere();
      MP.on = false; MP.players = [];   // restore
      return out;
    });
    expect(r.off).toBe(false);
    expect(r.playersOnly).toBe(false);
    expect(r.withSentry).toBe(true);
  });

  test('_mpAllyCount excludes sentries (a garrison is not a party ally)', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      MP.on = true;
      MP.players = [{ pid: 'a', kind: 'player' }, { pid: 'b' }, { pid: 's', kind: 'sentry' }];
      const allies = _mpAllyCount();     // 2 players, sentry not counted
      const hit = _partyHitBonus(allies);
      MP.on = false; MP.players = [];
      return { allies, hit };
    });
    expect(r.allies).toBe(2);
    expect(r.hit).toBe(2);
  });

  test('_partyEncounterRate: sentry suppresses to 0; else ally-halved; else base', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const out = {};
      MP.on = false; MP.players = [];
      out.solo = _partyEncounterRate(0.30);                                  // unchanged
      MP.on = true; MP.players = [{ pid: 'x', kind: 'player' }];
      out.ally = _partyEncounterRate(0.30);                                  // halved
      MP.players = [{ pid: 'x', kind: 'player' }, { pid: 's', kind: 'sentry' }];
      out.sentry = _partyEncounterRate(0.30);                               // suppressed to 0
      MP.on = false; MP.players = [];
      return out;
    });
    expect(r.solo).toBeCloseTo(0.30, 10);
    expect(r.ally).toBeCloseTo(0.15, 10);
    expect(r.sentry).toBe(0);
  });

  test('_sentryStrike: no-op with no sentry / dead enemy; damages a live enemy on a forced hit', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const out = {};
      S.round = 1;
      S.enemy = { ac: 1, atk: 0 };
      S.opp = { hp: 100, maxHp: 100, dmgMod: 0 };
      // No sentry present → no-op.
      MP.on = false; MP.players = [];
      out.noSentry = _sentryStrike();
      out.hpAfterNoSentry = S.opp.hp;
      // Sentry present but enemy already dead → no-op.
      MP.on = true; MP.players = [{ pid: 's', kind: 'sentry' }];
      S.opp.hp = 0;
      out.deadEnemy = _sentryStrike();
      // Live enemy + forced max roll → real damage.
      S.opp.hp = 100;
      const orig = Math.random;
      Math.random = () => 0.999;               // ceil(0.999*20)=20 → crit, max dmg
      out.dmg = _sentryStrike();
      Math.random = orig;
      out.hpDropped = S.opp.hp < 100;
      MP.on = false; MP.players = [];
      return out;
    });
    expect(r.noSentry).toBe(0);
    expect(r.hpAfterNoSentry).toBe(100);
    expect(r.deadEnemy).toBe(0);
    expect(r.dmg).toBeGreaterThan(0);
    expect(r.hpDropped).toBe(true);
  });

  test('_sentryDeployCharge: pays the upfront cost, stamps the record; refuses dup + when broke', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const out = {};
      S_story.sentries = []; S_story.gold = 300;
      const rec = _sentryDeployCharge('id1', 'LHR', 20);
      out.deployed = !!rec;
      out.goldAfter = S_story.gold;            // 300 - 120 = 180
      out.node = rec && rec.node;
      out.count = _sentryOwned().length;
      // Duplicate id refused, gold untouched.
      const g = S_story.gold;
      out.dup = _sentryDeployCharge('id1', 'LHR', 20);
      out.dupGold = S_story.gold === g;
      // Broke: drop below cost, refuse, gold untouched.
      S_story.gold = 50;
      out.broke = _sentryDeployCharge('id2', 'INN', 20);
      out.brokeGold = S_story.gold;
      S_story.sentries = [];                   // restore
      return out;
    });
    expect(r.deployed).toBe(true);
    expect(r.goldAfter).toBe(180);
    expect(r.node).toBe('LHR');
    expect(r.count).toBe(1);
    expect(r.dup).toBeNull();
    expect(r.dupGold).toBe(true);
    expect(r.broke).toBeNull();
    expect(r.brokeGold).toBe(50);
  });

  test('_sentryDayTick: charges upkeep when affordable; drops the newest posts when broke; never negative', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const out = {};
      // Two posts at 20g/day each. Affordable tick pays 40.
      S_story.sentries = [{ id: 'a', node: 'LHR', dailyFee: 20 }, { id: 'b', node: 'INN', dailyFee: 20 }];
      S_story.gold = 100;
      const t1 = _sentryDayTick();
      out.paid1 = t1.paid; out.fee1 = t1.fee; out.dropped1 = t1.dropped.length;
      out.gold1 = S_story.gold;                // 100 - 40 = 60
      // Can only afford one → the newest (b) is dropped, 20 paid for (a).
      S_story.gold = 25;
      const t2 = _sentryDayTick();
      out.fee2 = t2.fee; out.dropped2 = t2.dropped;
      out.gold2 = S_story.gold;                // 25 - 20 = 5, never negative
      out.remaining = _sentryOwned().map(s => s.id);
      // Empty list → clean no-op.
      S_story.sentries = [];
      out.noop = _sentryDayTick();
      return out;
    });
    expect(r.paid1).toBe(true);
    expect(r.fee1).toBe(40);
    expect(r.dropped1).toBe(0);
    expect(r.gold1).toBe(60);
    expect(r.fee2).toBe(20);
    expect(r.dropped2).toEqual(['b']);
    expect(r.gold2).toBe(5);
    expect(r.remaining).toEqual(['a']);
    expect(r.noop).toEqual({ active: false, paid: false, fee: 0, dropped: [] });
  });

  test('INVARIANT: a disconnected client sees no sentries — suppression + assist are inert', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      MP.on = false; MP.players = [{ pid: 'ghost', kind: 'sentry' }];   // stale roster
      S.enemy = { ac: 1 }; S.opp = { hp: 100, maxHp: 100, dmgMod: 0 }; S.round = 1;
      return {
        here:    _sentryHere(),
        rate:    _partyEncounterRate(0.25),
        strike:  _sentryStrike(),
        hp:      S.opp.hp,
      };
    });
    expect(r.here).toBe(false);
    expect(r.rate).toBeCloseTo(0.25, 10);
    expect(r.strike).toBe(0);
    expect(r.hp).toBe(100);
  });
});
