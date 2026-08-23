// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson and Claude
'use strict';
const { test, expect } = require('@playwright/test');

// ── §MESH-01f — co-presence combat buffs ("traveling with allies") ───────────
//
// Inc (f) of the mesh gameplay ladder: co-located players get +1 to hit per
// ally (cap +2), the wilderness encounter rate halved on shared cells, and a
// party loot/XP-share multiplier on victory (+10% per ally, cap +20%). The buff
// is client-local (reads MP.players — server-filtered to the current cell, self
// excluded) and DISPLAY-ONLY presence: the mover never consults it (Free-
// Movement). These cases pin (a) the pure derivations, (b) the battle-start
// snapshot + reset, and (c) the hard invariant that multiplayer-off is a
// byte-for-byte no-op. No server required — pure page-context evaluation.

test.describe('§MESH-01f co-presence buffs', () => {
  test('_partyHitBonus: +1 per ally, hard cap at +2, floors at 0', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => [0, 1, 2, 3, 5, -1].map(_partyHitBonus));
    expect(r).toEqual([0, 1, 2, 2, 2, 0]);
  });

  test('_partyLootMult: +10% per ally, cap +20%', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => [0, 1, 2, 3, 9].map(_partyLootMult));
    // 0→1.0, 1→1.1, 2→1.2, 3+→1.2 (rides the +2 hit-bonus cap)
    expect(r[0]).toBeCloseTo(1.0, 10);
    expect(r[1]).toBeCloseTo(1.1, 10);
    expect(r[2]).toBeCloseTo(1.2, 10);
    expect(r[3]).toBeCloseTo(1.2, 10);
    expect(r[4]).toBeCloseTo(1.2, 10);
  });

  test('_mpAllyCount reads MP.players only when connected', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const out = {};
      // Off: a stale players array must never count.
      MP.on = false; MP.players = [{ pid: 'a' }, { pid: 'b' }];
      out.off = _mpAllyCount();
      // On with two co-present allies.
      MP.on = true;
      out.two = _mpAllyCount();
      // On but alone.
      MP.players = [];
      out.alone = _mpAllyCount();
      MP.on = false; MP.players = [];   // restore
      return out;
    });
    expect(r.off).toBe(0);
    expect(r.two).toBe(2);
    expect(r.alone).toBe(0);
  });

  test('_partyEncounterRate halves the base rate only with co-present allies', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const out = {};
      MP.on = false; MP.players = [];
      out.solo = _partyEncounterRate(0.30);            // unchanged
      MP.on = true; MP.players = [{ pid: 'x' }];
      out.oneAlly = _partyEncounterRate(0.30);         // halved
      MP.players = [{ pid: 'x' }, { pid: 'y' }];
      out.twoAlly = _partyEncounterRate(0.30);         // still ×0.5 (not ×0.25)
      MP.on = false; MP.players = [];                  // restore
      return out;
    });
    expect(r.solo).toBeCloseTo(0.30, 10);
    expect(r.oneAlly).toBeCloseTo(0.15, 10);
    expect(r.twoAlly).toBeCloseTo(0.15, 10);
  });

  test('battle-start snapshot: _storyRollInit captures the ally count into S, resets when off', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const out = {};
      // Two allies co-present at battle start → snapshot into transient S.
      MP.on = true; MP.players = [{ pid: 'a' }, { pid: 'b' }, { pid: 'c' }];
      _storyRollInit();
      out.alliesA = S.partyAllies;
      out.bonusA  = S.partyHitBonus;   // capped at +2 despite 3 allies
      // Party gone next battle → snapshot resets, no stale buff leaks.
      MP.on = false; MP.players = [];
      _storyRollInit();
      out.alliesB = S.partyAllies;
      out.bonusB  = S.partyHitBonus;
      return out;
    });
    expect(r.alliesA).toBe(3);
    expect(r.bonusA).toBe(2);
    expect(r.alliesB).toBe(0);
    expect(r.bonusB).toBe(0);
  });

  test('INVARIANT: multiplayer-off is a byte-for-byte no-op across every buff', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      MP.on = false; MP.players = [{ pid: 'ghost' }];   // even with a stale roster
      return {
        allies:    _mpAllyCount(),
        loot:      _partyLootMult(_mpAllyCount()),
        rateKept:  _partyEncounterRate(0.25),
        hitBonus:  _partyHitBonus(_mpAllyCount()),
      };
    });
    expect(r.allies).toBe(0);
    expect(r.loot).toBe(1);
    expect(r.rateKept).toBeCloseTo(0.25, 10);
    expect(r.hitBonus).toBe(0);
  });
});
