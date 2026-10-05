// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02ah — the quest panel is a global mission log: an active quest's roll card renders
// wherever the player stands, not only at its activateNode. A board-accepted bounty and every
// quest at a non-primary node (1,207 rollable quests on 2026-10-04) depend on it; scoping the
// roll to the node is §DX-02ah-FU, behind §AUDIT-03x.
'use strict';
const { test, expect } = require('@playwright/test');
const { SEED_STATE, dismissContinue } = require('./helpers');

test('an active skill-check quest renders its roll card far from its activateNode', async ({ page }) => {
  const state = Object.assign({}, SEED_STATE, {
    currentCode: 'LHR', checkpointNode: 'LHR', visited: { LHR: true }, visitedCells: {},
    rngState: 424242, inventory: [], quests: { quest_areopagus: 'active' },
  });
  await page.addInitScript(s => {
    localStorage.clear();
    localStorage.setItem('coc_autosave', JSON.stringify(s));
  }, state);
  await page.goto('/play.html');
  await dismissContinue(page);
  const r = await page.evaluate(() => ({
    here: S_story.currentCode,
    home: QUEST_DB.quest_areopagus.activateNode,
    card: [...document.querySelectorAll('.story-section-card')]
      .filter(c => c.textContent.includes('To An Unknown One'))
      .map(c => ({ hint: c.textContent.includes('Persuasion'), btn: !!c.querySelector('.story-card-btn') })),
  }));
  expect(r.here).not.toBe(r.home);
  expect(r.card).toEqual([{ hint: true, btn: true }]);
});
