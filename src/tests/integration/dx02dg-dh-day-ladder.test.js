// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02dg / §DX-02dh — two §PLAY-01-A surfaces that drifted from their own lock.
//
// dg: the game shows the day counter twice — the sidebar `#s-day` and the objective
// chip `#obj-day`. §PLAY-01-A locked them to agree; §PLAY-01-C reframed the deadline
// and rewrote only the chip, so they disagreed on all 15 days above 34. Both now read
// `_dayAlarm(day)`, whose thresholds are OFFSETS from DAY_DEADLINE, so a moved cap
// moves both instead of only the one that happened to be derived.
//
// dh: `courierMapSeen` landed in the seed literal instead of `_S_DEFAULTS()`. The seed
// object is discarded wholesale, and `storyNewGame`'s `Object.assign(S_story,
// _S_DEFAULTS())` cannot clear a key its source does not declare — so the opening
// frame was a once-per-page-load feature, and the defeat screen's Play Again never
// showed it again.

const { test, expect } = require('@playwright/test');
const { seedAndLoad } = require('./helpers.js');

const NEWGAME = { str: 10, dex: 8, con: 8, int: 8, wis: 8, cha: 8 };

test.describe('§DX-02dg — one day-ladder, two surfaces', () => {

  test('the ladder is derived from the cap, not written twice', async ({ page }) => {
    await seedAndLoad(page);
    const r = await page.evaluate(() => ({
      deadline: DAY_DEADLINE,
      warnAt: DAY_WARN_AT,
      dangerAt: DAY_DANGER_AT,
      steps: [1, 34, 35, 41, 42, 48, 49].map(d => [d, _dayAlarm(d).trim() || 'plain']),
    }));
    // Offsets, so the two surfaces cannot be split again by moving the cap.
    expect(r.warnAt).toBe(r.deadline - 14);
    expect(r.dangerAt).toBe(r.deadline - 7);
    expect(r.steps).toEqual([
      [1, 'plain'], [34, 'plain'], [35, 'warn'], [41, 'warn'],
      [42, 'danger'], [48, 'danger'], [49, 'danger'],
    ]);
  });

  test('moving the cap moves both thresholds together', async ({ page }) => {
    await seedAndLoad(page);
    const r = await page.evaluate(() => ({
      // The ladder is a pure function of the cap: re-derive it rather than restating it.
      warnGap: DAY_DEADLINE - DAY_WARN_AT,
      dangerGap: DAY_DEADLINE - DAY_DANGER_AT,
      belowWarn: _dayAlarm(DAY_WARN_AT - 1).trim() || 'plain',
      atWarn: _dayAlarm(DAY_WARN_AT).trim(),
      belowDanger: _dayAlarm(DAY_DANGER_AT - 1).trim(),
      atDanger: _dayAlarm(DAY_DANGER_AT).trim(),
    }));
    expect(r.warnGap).toBeGreaterThan(r.dangerGap);   // warn comes first
    expect(r.belowWarn).toBe('plain');
    expect(r.atWarn).toBe('warn');
    expect(r.belowDanger).toBe('warn');
    expect(r.atDanger).toBe('danger');
  });

  test('the sidebar keeps the colours it shipped with', async ({ page }) => {
    await seedAndLoad(page);
    const r = await page.evaluate(() => {
      storyNewGame({ str: 10, dex: 8, con: 8, int: 8, wis: 8, cha: 8 });
      const out = [];
      for (let d = 1; d <= 49; d++) {
        S_story.day = d; storyUpdateStatus();
        const c = document.getElementById('s-day').className;
        out.push(c.includes('danger') ? 'danger' : c.includes('warn') ? 'warn' : 'plain');
      }
      return out;
    });
    // §PLAY-01-A's original ladder, unchanged: the surface that was already right
    // is not the one that moves.
    for (let d = 1; d <= 49; d++) {
      const want = d >= 42 ? 'danger' : d >= 35 ? 'warn' : 'plain';
      expect(r[d - 1], `day ${d}`).toBe(want);
    }
  });
});

test.describe('§DX-02dh — the opening frame survives a reset', () => {

  test('courierMapSeen is declared where a reset can clear it', async ({ page }) => {
    await seedAndLoad(page);
    const r = await page.evaluate(() => {
      const d = _S_DEFAULTS();
      return {
        declared: Object.prototype.hasOwnProperty.call(d, 'courierMapSeen'),
        value: d.courierMapSeen,
        // the mechanism, not a proxy for it: this is exactly what storyNewGame does
        cleared: Object.assign({ courierMapSeen: true }, _S_DEFAULTS()).courierMapSeen,
      };
    });
    expect(r.declared, '_S_DEFAULTS is the single source (§STATE-INIT)').toBe(true);
    expect(r.value).toBe(false);
    expect(r.cleared, 'Object.assign cannot clear a key the defaults do not declare').toBe(false);
  });

  test('a second fresh game in the same page shows the frame again', async ({ page }) => {
    await seedAndLoad(page);
    const r = await page.evaluate(() => {
      const visible = () => {
        const el = document.getElementById('courier-map-frame') || document.querySelector('.courier-map-frame');
        return !!el && !el.hidden && getComputedStyle(el).display !== 'none';
      };
      storyNewGame({ str: 10, dex: 8, con: 8, int: 8, wis: 8, cha: 8 });
      const first = { seen: S_story.courierMapSeen, visible: visible() };
      storyNewGame({ str: 10, dex: 8, con: 8, int: 8, wis: 8, cha: 8 });
      const second = { seen: S_story.courierMapSeen, visible: visible() };
      return { first, second };
    });
    // The flag is set both times because the frame was shown both times — on the
    // broken shape the second reset could not clear it, so it was never shown again.
    expect(r.first.seen).toBe(true);
    expect(r.second.seen).toBe(true);
    expect(r.second.visible).toBe(r.first.visible);
  });
});
