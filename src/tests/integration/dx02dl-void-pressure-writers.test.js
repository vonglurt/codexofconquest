// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02dl — the Void pressure meter's last-chance warning, and its writers.
//
// `_addVoidPressure` is the ONLY write path to `S_story.voidPressure`: it clamps at
// 10, latches three narrative milestones and refreshes the HUD. A direct assignment
// gets none of that, so it can seat a player at 9 with the last-chance warning never
// fired, or carry the value past the cap the rest of the engine assumes.
//
// The one remaining `S_story.voidPressure =` in the file is the clamp inside the
// helper itself, and that count is asserted below.

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

  test('the helper is the only writer — the engine and the quest corpus both', async ({ page }) => {
    await seedAndLoad(page);
    const src = await page.evaluate(() => document.documentElement.outerHTML);
    // the sole survivor is the clamp inside _addVoidPressure
    expect((src.match(/S_story\.voidPressure\s*=/g) || []).length).toBe(1);
    expect(src).toContain('_addVoidPressure(3)');
    // no bit body anywhere in QUEST_DB assigns the field
    const direct = await page.evaluate(() => {
      const out = [];
      const walk = (arr, qid) => {
        if (!Array.isArray(arr)) return;
        for (const b of arr) {
          if (!b || typeof b !== 'object') continue;
          if (b.kind === '_legacy_fn' && /voidPressure\s*=/.test(String(b.fn))) out.push(qid);
          for (const k of ['onPass', 'onFail', 'onComplete', 'bits']) walk(b[k], qid);
        }
      };
      for (const q of Object.values(QUEST_DB)) { walk(q.bits, q.id); walk(q.onComplete, q.id); }
      return out.sort();
    });
    expect(direct).toEqual([]);
  });

  test('the two quest failure bits reach the warning and stop at the cap', async ({ page }) => {
    await seedAndLoad(page);
    for (const id of ['quest_d0201_a2', 'quest_d0201_a4']) {
      const r = await page.evaluate(({ id, NEWGAME }) => {
        const fire = (start) => {
          storyNewGame(NEWGAME);
          S_story.voidPressure = start;
          const msgs = [];
          const realMsg = window.storyMsg, realTimeout = window.setTimeout;
          window.storyMsg = (m) => { msgs.push(String(m)); };
          window.setTimeout = (fn) => { try { fn(); } catch (e) { /* probe only */ } return 0; };
          try { QUEST_DB[id].bits[0].onFail[0].fn(S_story, {}); }
          finally { window.storyMsg = realMsg; window.setTimeout = realTimeout; }
          return { pressure: S_story.voidPressure, warned: !!S_story.voidImminentWarned,
                   msg: msgs.find(m => m.includes('THE VOID IS IMMINENT')) || null };
        };
        return { fromEight: fire(8), fromCap: fire(10) };
      }, { id, NEWGAME });
      // a failed retryable check that seats the player at 9 must say so
      expect(r.fromEight.pressure).toBe(9);
      expect(r.fromEight.warned).toBe(true);
      expect(r.fromEight.msg).toContain('9/10');
      // and it can never carry the meter past the threshold the rest of the engine reads
      expect(r.fromCap.pressure).toBe(10);
    }
  });
});
