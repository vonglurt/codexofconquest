// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02ae — an Act VIII farewell beat's text() is a render accessor and must not write
// progression state; the write belongs to the delivery site, beside the latch.
'use strict';
const { test, expect } = require('@playwright/test');
const { SEED_STATE, dismissContinue } = require('./helpers');

async function atBirkaInn(page) {
  const state = Object.assign({}, SEED_STATE, {
    currentCode: 'TLL', checkpointNode: 'TLL', visited: { TLL: true }, visitedCells: {},
    rngState: 424242, inventory: [], quests: {},
    npcFavorability: { brynn: 1 },
    brynnKeeperStoryTold: false, brynnLightChoiceMade: false, brynnLightKept: false,
    act8FarewellBrynn: false,
  });
  await page.addInitScript(s => {
    localStorage.clear();
    localStorage.setItem('coc_autosave', JSON.stringify(s));
  }, state);
  await page.goto('/play.html');
  await dismissContinue(page);
}

test.describe('§DX-02ae — the farewell accessor is pure, the delivery site writes the flag', () => {
  test('reading Brynn\'s farewell text twice returns the same branch and moves no flag', async ({ page }) => {
    await atBirkaInn(page);
    const r = await page.evaluate(() => {
      S_story.actNumber = 8;
      const first = ACT8_FAREWELL_BEATS.brynn.text();
      const second = ACT8_FAREWELL_BEATS.brynn.text();
      const lamp = BRYNN_KEEPER_STORY.farewellNoStory;
      return { first: first.includes(lamp), second: second.includes(lamp), told: S_story.brynnKeeperStoryTold };
    });
    expect(r.first, 'the first read is the catch-up delivery').toBe(true);
    expect(r.second, 'a second read is the same branch').toBe(true);
    expect(r.told, 'reading text wrote nothing').toBe(false);
  });

  test('delivering the beat sets the latch and the story flag once, and a second render is silent', async ({ page }) => {
    await atBirkaInn(page);
    const r = await page.evaluate(() => {
      S_story.actNumber = 8;
      const loaves = () => S_story.inventory.filter(i => i.name === "Brynn's Loaf").length;
      const div = document.createElement('div');
      _renderNpcCard('brynn', div);
      const afterFirst = { latch: S_story.act8FarewellBrynn, told: S_story.brynnKeeperStoryTold, loaves: loaves() };
      _renderNpcCard('brynn', div);
      return { afterFirst, loavesAfterSecond: loaves() };
    });
    expect(r.afterFirst.latch).toBe(true);
    expect(r.afterFirst.told, 'the delivery site records that the lamp story was told').toBe(true);
    expect(r.afterFirst.loaves).toBe(1);
    expect(r.loavesAfterSecond, 'the latch holds').toBe(1);
  });
});
