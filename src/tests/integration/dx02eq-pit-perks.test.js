// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02eq — the pit perk tree was a complete ceremony around five no-ops.
//
// `_applyPitPerks` wrote five booleans onto the live combat state and the duel engine
// consulted none of them, so the player earned a tree, was congratulated in Weckmann's
// voice, saw the badge on their sheet, and nothing changed.
//
// One of the five is wired here: Weckmann's Lesson, "once per rest, cancel disadvantage",
// the only perk §VIII argues for by name. It is spent only when exhaustion is actually
// biting, it covers the whole encounter, and it comes back on a long rest. The other
// four writes are retired — `readTheRoom` because its effect (the pre-combat threat
// tier) already ships to every player at `_renderPreBatt`, and the remaining three
// because flanking, shove and between-rounds regen are combat systems that do not exist.

const { test, expect } = require('@playwright/test');
const { seedAndLoad } = require('./helpers.js');

const RETIRED = ['controlledAggression', 'readTheRoom', 'groundGame', 'cornerWork'];

test.describe('§DX-02eq — the perk tree has one perk that does something', () => {

  test('an exhausted fight with the perk held is not at disadvantage', async ({ page }) => {
    await seedAndLoad(page);
    const r = await page.evaluate(() => {
      storyNewGame({ str: 10, dex: 8, con: 8, int: 8, wis: 8, cha: 8 });
      S_story.pitPerks = ['controlledAggression', 'readTheRoom', 'groundGame', 'cornerWork', 'crovsLesson'];
      S_story.battleDis = 2;
      S.recomposed = false;
      const fired = _applyPitPerks(S);
      return { fired, recomposed: S.recomposed, used: S_story.crovsLessonUsed, exhausted: _isExhausted() };
    });
    expect(r.exhausted).toBe(true);
    expect(r.fired, 'the perk fires and the caller has something to announce').toBe(true);
    expect(r.recomposed).toBe(true);
    expect(r.used).toBe(true);
  });

  test('it is not spent when nothing is biting', async ({ page }) => {
    await seedAndLoad(page);
    const r = await page.evaluate(() => {
      storyNewGame({ str: 10, dex: 8, con: 8, int: 8, wis: 8, cha: 8 });
      S_story.pitPerks = ['crovsLesson'];
      S_story.battleDis = 0;
      S_story.hoursSinceSlept = 0;
      S.recomposed = false;
      const fired = _applyPitPerks(S);
      return { fired, used: S_story.crovsLessonUsed, held: S.crovsLesson };
    });
    expect(r.held, 'the perk is still applied to the combat state').toBe(true);
    expect(r.fired).toBe(false);
    expect(r.used, 'a rested fight does not burn the charge').toBe(false);
  });

  test('once per rest — the second exhausted fight gets no reprieve', async ({ page }) => {
    await seedAndLoad(page);
    const r = await page.evaluate(() => {
      storyNewGame({ str: 10, dex: 8, con: 8, int: 8, wis: 8, cha: 8 });
      S_story.pitPerks = ['crovsLesson'];
      S_story.battleDis = 2;
      S.recomposed = false;
      const first = _applyPitPerks(S);
      S.recomposed = false;            // the next encounter's reset
      const second = _applyPitPerks(S);
      return { first, second, recomposed: S.recomposed };
    });
    expect(r.first).toBe(true);
    expect(r.second).toBe(false);
    expect(r.recomposed).toBe(false);
  });

  test('re-entering the overlay mid-fight does not re-spend or lose it', async ({ page }) => {
    await seedAndLoad(page);
    const r = await page.evaluate(() => {
      storyNewGame({ str: 10, dex: 8, con: 8, int: 8, wis: 8, cha: 8 });
      S_story.pitPerks = ['crovsLesson'];
      S_story.battleDis = 2;
      S.recomposed = false;
      _applyPitPerks(S);
      const again = _applyPitPerks(S);   // same encounter, no _storyRollInit between
      return { again, recomposed: S.recomposed };
    });
    expect(r.again, 'it does not announce twice').toBe(false);
    expect(r.recomposed, 'and the encounter keeps the reprieve it already paid for').toBe(true);
  });

  test('a long rest returns the charge', async ({ page }) => {
    await seedAndLoad(page);
    const r = await page.evaluate(() => {
      storyNewGame({ str: 10, dex: 8, con: 8, int: 8, wis: 8, cha: 8 });
      S_story.crovsLessonUsed = true;
      const before = S_story.crovsLessonUsed;
      const src = storyConfirmSleep.toString();
      return { before, resets: /S_story\.crovsLessonUsed\s*=\s*false/.test(src) };
    });
    expect(r.before).toBe(true);
    expect(r.resets, 'storyConfirmSleep clears it beside the other rest-gated charges').toBe(true);
  });

  test('the four retired perks are named by the ledger and written to nothing', async ({ page }) => {
    await seedAndLoad(page);
    const r = await page.evaluate((retired) => {
      storyNewGame({ str: 10, dex: 8, con: 8, int: 8, wis: 8, cha: 8 });
      S_story.pitPerks = ['controlledAggression', 'readTheRoom', 'groundGame', 'cornerWork', 'crovsLesson'];
      S.recomposed = false;
      _applyPitPerks(S);
      return {
        onState: retired.filter(k => k in S),
        titled: retired.filter(k => PIT_PERK_UNLOCKS[k] && PIT_PERK_UNLOCKS[k].title),
      };
    }, RETIRED);
    expect(r.onState, 'no perk flag is written that nothing reads').toEqual([]);
    expect(r.titled, 'the unlock ceremony still names all four').toEqual(RETIRED);
  });

  test('the threat tier the retired perk would have granted ships to everyone', async ({ page }) => {
    await seedAndLoad(page);
    const r = await page.evaluate(() => {
      const src = _renderPreBatt.toString();
      return { readsPerks: /pitPerks/.test(src.split('prebatt-dis-warning')[0]) };
    });
    expect(r.readsPerks, 'the threat badge is not gated on a perk — which is why readTheRoom cannot grant it').toBe(false);
  });
});
