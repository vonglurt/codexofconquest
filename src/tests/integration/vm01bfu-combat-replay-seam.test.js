// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §VM-01-B-FU — whether "a save fully determines the future" includes the fight.
//
// §VM-01-B seeded four pipelines — encounter fire, the skill-check d20, loot/drop
// and the monster draw — and deliberately fenced combat out. §VM-01-E then built a
// soft-lock prover on that seam (`uqf-softlock.test.js`: same rngState → identical
// outcome across two runs), so replay-from-save became a working diagnostic that
// goes blind the moment a battle starts. A player who loses a run inside combat
// still could not hand anyone a reproducible artifact.
//
// The row offered three options. (a) leave it, (b) seed combat behind an
// off-by-default debug flag, (c) seed it outright. (b) shipped: combat entropy is
// unchanged in normal play, and `S_story.replaySeeded` moves the fight onto the
// persisted stream when someone needs a repro.
//
// What this pins is the property, not the flag: OFF, the fight does not touch
// rngState and two runs from one save differ; ON, two runs from one save are
// byte-identical. Both halves matter — a debug mode that leaked into normal play
// would be option (c) by accident.

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const SRC = fs.readFileSync(path.join(ROOT, 'play.html'), 'utf8');
const { seedAndLoad } = require('./helpers.js');

// The sequence a fight draws: d20s through the shared helper, a raw flee check,
// and a damage die — the three shapes the 13 converted sites use.
const DRAW = `(() => {
  const out = [];
  for (let i = 0; i < 12; i++) out.push(roll(20));
  for (let i = 0; i < 6;  i++) out.push(Math.ceil(_combatRng() * 20));
  for (let i = 0; i < 6;  i++) out.push(_combatRng() < 0.6);
  return out;
})()`;

async function twoRuns(page, replaySeeded) {
  return page.evaluate(([replaySeeded, DRAW]) => {
    const run = () => {
      S_story.rngState = 123456789;
      S_story.replaySeeded = replaySeeded;
      const seq = eval(DRAW);
      return { seq, after: S_story.rngState };
    };
    return { a: run(), b: run() };
  }, [replaySeeded, DRAW]);
}

test.describe('§VM-01-B-FU — the fight is replayable on request, not by default', () => {

  test('the flag ships off, and it is persisted state so a save carries it', () => {
    expect(SRC).toContain('replaySeeded: false,');
    expect(SRC).toContain('S_story.replaySeeded ? _seededNext() : Math.random()');
  });

  test('OFF — the fight does not touch rngState, and two runs from one save differ', async ({ page }) => {
    await seedAndLoad(page);
    const r = await twoRuns(page, false);
    expect(r.a.after).toBe(123456789);
    expect(r.b.after).toBe(123456789);
    expect(r.a.seq).not.toEqual(r.b.seq);
  });

  test('ON — two runs from the same rngState are byte-identical', async ({ page }) => {
    await seedAndLoad(page);
    const r = await twoRuns(page, true);
    expect(r.a.seq).toEqual(r.b.seq);
    expect(r.a.after).toBe(r.b.after);
    expect(r.a.after).not.toBe(123456789);
  });

  test('ON — a different save is a different fight, so the stream is the seed and not a constant', async ({ page }) => {
    await seedAndLoad(page);
    const r = await page.evaluate((DRAW) => {
      const run = (seed) => {
        S_story.rngState = seed;
        S_story.replaySeeded = true;
        return eval(DRAW);
      };
      return { one: run(123456789), two: run(987654321) };
    }, DRAW);
    expect(r.one).not.toEqual(r.two);
  });

  test('the level-up HP roll is NOT in the fight and was left to §DX-02m', () => {
    expect(SRC).toContain('const die    = Math.ceil(Math.random() * 10);');
  });
});
