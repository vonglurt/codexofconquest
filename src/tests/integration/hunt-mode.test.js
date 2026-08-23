// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
'use strict';
const { test, expect } = require('@playwright/test');
const { seedAndLoad, dismissContinue } = require('./helpers.js');

// ── §KG-01 Hunt Mode — monster-level metric + lower-level bias + toggle ───────
//
// Increment 1 of the low-level (Birka/Russia "kindergarten") feature:
//   • _monsterLevel(m): normalized 1–20 threat from AC + avg damage dice + HP.
//   • Hunt Mode toggle (d-pad center 🎯) → S_story.huntMode, persisted.
//   • _weightedMonsterPick biases 80% toward monsters at/below the player level
//     while Hunt Mode is on; 20% still draws the full pool (hard fights remain).
//
// Birka start (LHR) so S_story loads a real position; huntMode defaults off.
const seedAt = (n, extra = {}) => ({ currentCode: n.code, playerR: n.r, playerC: n.c, visited: { [n.code]: true }, ...extra });
const LHR = { code: 'LHR', r: 10, c: 197 };

test.describe('§KG-01 Hunt Mode', () => {
  test.beforeEach(async ({ page }) => {
    await seedAndLoad(page, seedAt(LHR, { level: 6, xp: 5500 }));
    await dismissContinue(page);
  });

  test('_monsterLevel calibration: low band reads intuitively (1–20 clamped)', async ({ page }) => {
    const r = await page.evaluate(() => {
      const L = k => _monsterLevel(MONSTER_POOL[k]);
      const all = Object.values(MONSTER_POOL).map(_monsterLevel);
      return {
        commoner: L('commoner'), kobold: L('kobold'), giant_rat: L('giant_rat'),
        orc: L('orc'), thug: L('thug'), ogre: L('ogre'), troll: L('troll'),
        min: Math.min(...all), max: Math.max(...all),
      };
    });
    // Calibrated low band — see _monsterLevel comment in play.html.
    expect(r.commoner).toBe(1);
    expect(r.kobold).toBe(2);
    expect(r.giant_rat).toBe(2);
    expect(r.orc).toBe(3);
    expect(r.thug).toBe(4);
    expect(r.ogre).toBe(6);
    expect(r.troll).toBe(7);
    // Whole pool stays inside the 1–20 band.
    expect(r.min).toBeGreaterThanOrEqual(1);
    expect(r.max).toBeLessThanOrEqual(20);
    expect(r.max).toBeGreaterThanOrEqual(12);   // apex monsters really do reach the high band
  });

  test('toggle flips S_story.huntMode + the d-pad button lights up, and it persists', async ({ page }) => {
    const before = await page.evaluate(() => ({
      mode: S_story.huntMode,
      lit: document.getElementById('btn-hunt').classList.contains('hunting'),
    }));
    expect(before.mode).toBeFalsy();
    expect(before.lit).toBe(false);

    const after = await page.evaluate(() => {
      storyToggleHunt();
      return {
        mode: S_story.huntMode,
        lit: document.getElementById('btn-hunt').classList.contains('hunting'),
        saved: JSON.parse(localStorage.getItem('r2h_autosave') || '{}').huntMode,
      };
    });
    expect(after.mode).toBe(true);
    expect(after.lit).toBe(true);
    expect(after.saved).toBe(true);   // storyToggleHunt() autosaves

    const off = await page.evaluate(() => { storyToggleHunt(); return S_story.huntMode; });
    expect(off).toBe(false);
  });

  test('Hunt Mode biases _weightedMonsterPick toward lower-level monsters', async ({ page }) => {
    // Sample the same terrain many times with Hunt Mode off vs on; the mean
    // encountered monster level must drop measurably when hunting. 'forest'
    // spans the whole range (needle blight → treant/erlking), so the bias shows.
    const r = await page.evaluate(() => {
      const N = 600, terr = 'forest';
      const sample = () => {
        let sum = 0, n = 0;
        for (let i = 0; i < N; i++) { const m = _weightedMonsterPick(terr); if (m) { sum += _monsterLevel(m); n++; } }
        return n ? sum / n : 0;
      };
      S_story.huntMode = false; const meanOff = sample();
      S_story.huntMode = true;  const meanOn  = sample();
      return { meanOff, meanOn };
    });
    // A clear, non-flaky margin (player is level 6; the low band is well populated).
    expect(r.meanOn).toBeLessThan(r.meanOff - 0.5);
  });
});
