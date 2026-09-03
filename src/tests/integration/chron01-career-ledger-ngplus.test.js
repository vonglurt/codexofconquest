// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §CHRON-01 — the career ledger (careerStats) is the Chronicle's cross-life column, and New
// Game+ is the transition it exists for: it must survive storyNewGamePlus() while runStats
// resets, and the character sheet must show the All Lives column on an NG+ run. `sleeps` and
// `daysAdventuring` were written by adjacent unconditional lines and could never differ, so the
// second field is gone from the ledgers and both print surfaces.
'use strict';
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { seedAndLoad, dismissContinue } = require('./helpers');

const HTML = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'play.html'), 'utf8');

const LEDGER = { kills: 7, deaths: 0, dmgDealt: 90, dmgReceived: 40, sleeps: 5, battlesAttempted: 8,
  attacksAttempted: 30, attacksHit: 20, exitsTaken: 12 };

async function ngPlus(page) {
  await seedAndLoad(page, { careerStats: Object.assign({}, LEDGER), runStats: Object.assign({}, LEDGER, { kills: 3 }),
    ngPlusRun: 0, corpsesQuests: [] });
  await dismissContinue(page);
  return page.evaluate(() => {
    storyNewGamePlus();
    return { career: S_story.careerStats.kills, run: S_story.runStats.kills, ng: S_story.ngPlusRun };
  });
}

test.describe('§CHRON-01 — the career ledger survives New Game+', () => {
  test('careerStats carries across storyNewGamePlus(); runStats starts over', async ({ page }) => {
    expect(await ngPlus(page)).toEqual({ career: 7, run: 0, ng: 1 });
  });

  test('the character sheet renders the All Lives column on an NG+ run with no deaths', async ({ page }) => {
    await ngPlus(page);
    const sheet = await page.evaluate(() => {
      storyRenderCharSheet();
      return document.getElementById('char-sheet-body').textContent;
    });
    expect(sheet).toContain('All Lives');
    expect(sheet).toMatch(/Kills\s*0\s*7/);
  });

  test('a first life with no deaths still hides the career column', async ({ page }) => {
    await seedAndLoad(page, { careerStats: Object.assign({}, LEDGER), runStats: Object.assign({}, LEDGER), ngPlusRun: 0 });
    await dismissContinue(page);
    const sheet = await page.evaluate(() => { storyRenderCharSheet(); return document.getElementById('char-sheet-body').textContent; });
    expect(sheet).not.toContain('All Lives');
  });

  test('daysAdventuring is gone from the ledgers, the tally and both print surfaces', () => {
    expect(HTML).not.toMatch(/daysAdventuring/);
    expect(HTML).not.toMatch(/Days [Aa]dventuring/);
    expect(HTML.match(/_statTally\('sleeps', 1\);/g)).toHaveLength(1);
  });
});
