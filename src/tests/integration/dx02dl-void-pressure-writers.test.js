// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02dl — the Void pressure meter's last-chance warning, and its writers.
//
// `_addVoidPressure` is the intended write path: it clamps at 10, latches three
// narrative milestones and refreshes the HUD. Its two lower milestones test `>=`;
// the imminent one tested `===` 9 — and this system has a writer that steps by 3.
// A claim at the Ceremonia column took pressure 8 → 11 without the clamp, the
// milestones or the HUD, and landing on 10 skipped the warning entirely.
//
// The `+3` writer is routed through the helper here and the milestone reads `>=`.
// Two writers remain direct — `_legacy_fn` bit bodies inside QUEST_DB, which the
// API has no way to write (§DX-02iv). That is why this row is not closed.

const { test, expect } = require('@playwright/test');
const { seedAndLoad } = require('./helpers.js');

const NEWGAME = { str: 10, dex: 8, con: 8, int: 8, wis: 8, cha: 8 };

// Drive the helper and capture the deferred warning without waiting on the timer.
async function press(page, steps, shards = 0) {
  return page.evaluate(({ steps, shards, NEWGAME }) => {
    storyNewGame(NEWGAME);
    S_story.shards = shards;
    const msgs = [];
    const realMsg = window.storyMsg, realTimeout = window.setTimeout;
    window.storyMsg = (m) => { msgs.push(String(m)); };
    window.setTimeout = (fn) => { try { fn(); } catch (e) { /* probe only */ } return 0; };
    try { for (const n of steps) _addVoidPressure(n); }
    finally { window.storyMsg = realMsg; window.setTimeout = realTimeout; }
    return {
      pressure: S_story.voidPressure,
      warned: !!S_story.voidImminentWarned,
      crack: !!S_story.voidCrackFired,
      fractures: !!S_story.voidFracturesFired,
      msg: msgs.find(m => m.includes('THE VOID IS IMMINENT')) || null,
    };
  }, { steps, shards, NEWGAME });
}

test.describe('§DX-02dl — a milestone a +3 writer cannot step over', () => {

  test('the row\'s own case: 8 then +3 lands on 10, warned', async ({ page }) => {
    await seedAndLoad(page);
    const r = await press(page, [8, 3]);
    expect(r.pressure).toBe(10);                 // clamped, never 11
    expect(r.warned).toBe(true);
    expect(r.msg).toBeTruthy();
    expect(r.msg).toContain('10/10');            // the live value, not a hardcoded 9
    expect(r.msg).toContain('already at the threshold');
  });

  test('landing exactly on 9 still reads the way it always did', async ({ page }) => {
    await seedAndLoad(page);
    const r = await press(page, [9]);
    expect(r.pressure).toBe(9);
    expect(r.warned).toBe(true);
    expect(r.msg).toContain('9/10');
    expect(r.msg).toContain('One more pressure point');
  });

  test('no path into the warning band arrives unwarned, and none passes 10', async ({ page }) => {
    await seedAndLoad(page);
    const bad = [];
    for (let start = 0; start <= 9; start++) {
      for (const step of [1, 2, 3]) {
        const r = await press(page, [start, step].filter(Boolean));
        if (r.pressure > 10) bad.push({ start, step, pressure: r.pressure, why: 'over cap' });
        if (r.pressure >= 9 && !r.warned) bad.push({ start, step, pressure: r.pressure, why: 'unwarned' });
      }
    }
    expect(bad).toEqual([]);
  });

  test('the mercy note still keys on shards, and the milestone fires once', async ({ page }) => {
    await seedAndLoad(page);
    const poor = await press(page, [9], 2);
    const rich = await press(page, [9], 5);
    expect(poor.msg).not.toContain('mercy rest');
    expect(rich.msg).toContain('One mercy rest remains');
    // the latch is what makes >= idempotent — the milestone must not re-fire
    const twice = await press(page, [9, 1]);
    expect(twice.warned).toBe(true);
    expect(twice.pressure).toBe(10);
  });

  test('the Ceremonia claim goes through the helper, and two writers remain', async ({ page }) => {
    await seedAndLoad(page);
    const src = await page.evaluate(() => document.documentElement.outerHTML);
    const direct = (src.match(/S_story\.voidPressure\s*=/g) || []).length;
    // 1 = the clamp inside _addVoidPressure; 2 = the QUEST_DB _legacy_fn bodies (§DX-02iv).
    expect(direct).toBe(3);
    expect(src).toContain('_addVoidPressure(3)');
    // and the two survivors are exactly the quest bit bodies, not new engine writes
    const legacy = await page.evaluate(() => {
      const out = [];
      const walk = (arr, qid) => {
        if (!Array.isArray(arr)) return;
        for (const b of arr) {
          if (!b || typeof b !== 'object') continue;
          if (b.kind === '_legacy_fn' && /voidPressure/.test(String(b.fn))) out.push(qid);
          for (const k of ['onPass', 'onFail', 'onComplete', 'bits']) walk(b[k], qid);
        }
      };
      for (const q of Object.values(QUEST_DB)) { walk(q.bits, q.id); walk(q.onComplete, q.id); }
      return out.sort();
    });
    expect(legacy).toEqual(['quest_d0201_a2', 'quest_d0201_a4']);
  });
});
