// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02eo — a field the spec named and nothing read, and the best line in a
// four-state table that could never be selected.
//
// (a) `S_story.ebReturnsCompleted` was declared in `_S_DEFAULTS`, written on every
// Epic Battleground return, and read by nothing. Every consumer in the file — nine
// sites, including `_buildEpilogueScroll`, `_missionComplete` and the victory
// `vic-returns` stat — reads the sibling `ebReturnDone`. The Layer 43 spec gated its
// EB epilogue block on `ebReturnsCompleted >= 10`; the implementer built the field the
// spec named and then wired everything to the other one. Write-only, and a doc had
// since rationalised it as "legacy write; kept for save forwards-compat" — which only
// means anything if something reads it.
//
// (b) `FROBERGER_EPILOGUE` authors FOUR states and `_buildEpilogueScroll` selected
// three. `.cursed` was written for `!missionComplete && curse >= 15` — and that is
// exactly the state in which the function returns the Groundhog Day block EARLY,
// before the Froberger append is reached. The line is the strongest in the set and had
// never rendered. It is appended to the Groundhog block's tail, which is the state it
// was written for.

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const SRC = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'play.html'), 'utf8');

test.describe('§DX-02eo — the write-only twin is gone', () => {

  test('the field is named nowhere: no declaration, no writer, no reader', () => {
    expect(SRC).not.toContain('ebReturnsCompleted');
  });

  test('the surviving twin still guards the return beat and still counts for the epilogue', async ({ page }) => {
    await page.goto('/play.html');
    const r = await page.evaluate(() => {
      S_story.active = true;
      S_story.ebReturnDone = {};
      S_story.gold = 0;
      const code = Object.keys(EB_NPC_DIALOGUE)[0];
      _storyEbReturnBeat(code);
      const goldAfterFirst = S_story.gold;
      _storyEbReturnBeat(code);                       // idempotent: the guard is ebReturnDone
      return { marked: !!S_story.ebReturnDone[code], goldAfterFirst, goldAfterSecond: S_story.gold };
    });
    expect(r.marked).toBe(true);
    expect(r.goldAfterSecond).toBe(r.goldAfterFirst);
  });

  test('the EB epilogue line still fires off ebReturnDone at ten returns', async ({ page }) => {
    await page.goto('/play.html');
    const r = await page.evaluate(() => {
      S_story.npcFavorability = {};
      S_story.ebReturnDone = {};
      const nine = _buildEpilogueScroll().some(l => l.includes('EB contracts fulfilled'));
      Object.keys(EB_NPC_DIALOGUE).slice(0, 10).forEach(c => { S_story.ebReturnDone[c] = true; });
      const ten = _buildEpilogueScroll().find(l => l.includes('EB contracts fulfilled'));
      return { nine, ten };
    });
    expect(r.nine).toBe(false);
    expect(r.ten).toContain('10 of 20 EB contracts fulfilled');
  });
});

test.describe('§DX-02eo(b) — all four Froberger epilogue states are reachable', () => {

  test('the cursed line closes the Groundhog block, the state it was written for', async ({ page }) => {
    await page.goto('/play.html');
    const r = await page.evaluate(() => {
      // !missionComplete && curseScore >= 15 — the Groundhog branch.
      S_story.shards = 0; S_story.level = 1; S_story.ebReturnDone = {};
      S_story.missedSleeps = 99; S_story.dropsCollected = 0;
      const cs = _curseScore(), mc = _missionComplete();
      const lines = _buildEpilogueScroll();
      return { cs, mc, last: lines[lines.length - 1], cursed: FROBERGER_EPILOGUE.cursed,
               groundhog: lines.some(l => l.includes('seventeen times')) };
    });
    expect(r.mc).toBe(false);
    expect(r.cs).toBeGreaterThanOrEqual(15);
    expect(r.groundhog).toBe(true);
    expect(r.last).toBe(r.cursed);
  });

  // The selector, not the score. `_curseScore`'s reachable set is §DX-02en's territory
  // and is pinned there; what this asserts is that `_buildEpilogueScroll` can reach all
  // four authored lines, which is exactly what it could not do before.
  test('every FROBERGER_EPILOGUE key is selected by some (mc, curse) pair', async ({ page }) => {
    await page.goto('/play.html');
    const reached = await page.evaluate(() => {
      const keys = Object.keys(FROBERGER_EPILOGUE);
      const _mc = _missionComplete, _cs = _curseScore;
      const seen = new Set();
      S_story.npcFavorability = {}; S_story.ebReturnDone = {};
      const pairs = [[false, 15], [false, 0], [true, 0], [true, 5]];
      try {
        for (const [mc, cs] of pairs) {
          _missionComplete = () => mc;
          _curseScore = () => cs;
          const lines = _buildEpilogueScroll();
          for (const k of keys) if (lines.includes(FROBERGER_EPILOGUE[k])) seen.add(k);
        }
      } finally { _missionComplete = _mc; _curseScore = _cs; }
      return { keys, seen: [...seen] };
    });
    expect(reached.seen.sort()).toEqual(reached.keys.sort());
  });
});
