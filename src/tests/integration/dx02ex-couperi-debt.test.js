// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02ex — `couperiDebtDegraded` recorded two opposite states under one name.
//
// Layer 44's `quill_debt` event sets it when the quest was never taken and the debt got
// worse; Layer 69's Beat 3 set the same field when the quest was finished and the debt
// was released. The two epilogue lines are gated on `quillQuestComplete` and stayed
// coherent; the dialogue injection is not, so a player who reached Act IV without ever
// speaking to Quill was philosophised at about releasing a debt they had left alone.
//
// The neglect line is authored — S30, "The Bard's Debt as Living System": "by Act V the
// counter is so large that Quill's impartial dialogue changes."

const { test, expect } = require('@playwright/test');
const { seedAndLoad } = require('./helpers.js');

const RELEASED_LINE = 'A debt that has done its work becomes just a number';
const NEGLECT_LINE = "The number is a number now. I don't look at it anymore.";

test.describe('§DX-02ex — the debt left alone and the debt released are two states', () => {

  test('Act IV with the quest never started speaks the neglect line, not absolution', async ({ page }) => {
    await seedAndLoad(page);
    const r = await page.evaluate(() => {
      storyNewGame({ str: 10, dex: 8, con: 8, int: 8, wis: 8, cha: 8 });
      S_story.actNumber = 4;
      S_story.quillQuestComplete = false;
      _checkWorldProgressionEvents();
      // the injection lands at the tail of a cycling array — read a whole cycle
      const seen = [];
      for (let i = 0; i < 40; i++) seen.push(_getNPCDialogue('quill').quote);
      return {
        degraded: S_story.couperiDebtDegraded,
        released: S_story.couperiDebtReleased,
        sample: seen.join(' '),
      };
    });
    expect(r.degraded, "Layer 44's writer still records the neglect").toBe(true);
    expect(r.released, 'nothing was released — the quest was never taken').toBe(false);
    expect(r.sample).toContain(NEGLECT_LINE);
    expect(r.sample).not.toContain(RELEASED_LINE);
  });

  test('a released debt is the only state that speaks the lesson', async ({ page }) => {
    await seedAndLoad(page);
    const r = await page.evaluate(() => {
      storyNewGame({ str: 10, dex: 8, con: 8, int: 8, wis: 8, cha: 8 });
      S_story.quillQuestComplete = true;
      S_story.couperiDebtReleased = true;
      const seen = [];
      for (let i = 0; i < 40; i++) seen.push(_getNPCDialogue('quill').quote);
      return { sample: seen.join(' ') };
    });
    expect(r.sample).toContain(RELEASED_LINE);
    expect(r.sample).not.toContain(NEGLECT_LINE);
  });

  test('an untouched arc injects neither line', async ({ page }) => {
    await seedAndLoad(page);
    const r = await page.evaluate(() => {
      storyNewGame({ str: 10, dex: 8, con: 8, int: 8, wis: 8, cha: 8 });
      const seen = [];
      for (let i = 0; i < 40; i++) seen.push(_getNPCDialogue('quill').quote);
      return { sample: seen.join(' ') };
    });
    expect(r.sample).not.toContain(RELEASED_LINE);
    expect(r.sample).not.toContain(NEGLECT_LINE);
  });

  test('a run that let the debt degrade can still reach Beat 3', async ({ page }) => {
    await seedAndLoad(page);
    const r = await page.evaluate(() => {
      storyNewGame({ str: 10, dex: 8, con: 8, int: 8, wis: 8, cha: 8 });
      S_story.actNumber = 4;
      _checkWorldProgressionEvents();
      S_story.quillQuestComplete = true;
      return {
        degraded: S_story.couperiDebtDegraded,
        beat3Ready: !!(S_story.quillQuestComplete && !S_story.couperiDebtReleased),
      };
    });
    expect(r.degraded).toBe(true);
    expect(r.beat3Ready, "Beat 3's guard no longer reads the neglect writer's flag").toBe(true);
  });

  test('the two epilogue lines are keyed on the release, and stay one apart', async ({ page }) => {
    await seedAndLoad(page);
    const r = await page.evaluate(() => {
      storyNewGame({ str: 10, dex: 8, con: 8, int: 8, wis: 8, cha: 8 });
      const pick = () => ARC_EPILOGUE_CONDITIONS
        .filter(e => e.cond())
        .map(e => e.line)
        .filter(l => l.indexOf('Quill') === 0);
      S_story.quillQuestComplete = true;
      S_story.couperiDebtDegraded = true;
      S_story.couperiDebtReleased = false;
      const degradedOnly = pick();
      S_story.couperiDebtReleased = true;
      const released = pick();
      return { degradedOnly, released };
    });
    expect(r.degradedOnly).toEqual([
      "Quill has the lute. He knows what a number means. He hasn't found the words for the last part yet.",
    ]);
    expect(r.released).toEqual([
      "Quill plays the family theme on request. He calls it 'the one that came back.' The lute is still in tune.",
    ]);
  });

  test('a save that predates the split is read by the writer that could have set it', async ({ page }) => {
    await seedAndLoad(page);
    const r = await page.evaluate(() => {
      storyNewGame({ str: 10, dex: 8, con: 8, int: 8, wis: 8, cha: 8 });
      // the arc was finished: only Layer 69 could have set the merged flag
      S_story.couperiDebtDegraded = true;
      S_story.couperiDebtReleased = false;
      S_story.quillQuestComplete = true;
      _splitCouperiDebtMeaning();
      const finished = { degraded: S_story.couperiDebtDegraded, released: S_story.couperiDebtReleased };
      // the arc was never finished: only Layer 44 could have set it
      S_story.couperiDebtDegraded = true;
      S_story.couperiDebtReleased = false;
      S_story.quillQuestComplete = false;
      _splitCouperiDebtMeaning();
      const abandoned = { degraded: S_story.couperiDebtDegraded, released: S_story.couperiDebtReleased };
      return { finished, abandoned };
    });
    expect(r.finished).toEqual({ degraded: false, released: true });
    expect(r.abandoned).toEqual({ degraded: true, released: false });
  });

  test('the migration is idempotent and leaves a released save alone', async ({ page }) => {
    await seedAndLoad(page);
    const r = await page.evaluate(() => {
      storyNewGame({ str: 10, dex: 8, con: 8, int: 8, wis: 8, cha: 8 });
      S_story.couperiDebtDegraded = true;
      S_story.couperiDebtReleased = true;
      S_story.quillQuestComplete = true;
      _splitCouperiDebtMeaning();
      _splitCouperiDebtMeaning();
      return { degraded: S_story.couperiDebtDegraded, released: S_story.couperiDebtReleased };
    });
    expect(r).toEqual({ degraded: true, released: true });
  });
});
