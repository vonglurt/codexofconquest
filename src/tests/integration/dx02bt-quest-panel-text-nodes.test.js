// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02bt — the custom-waypoint and corpse cards take their strings from the save file and
// the world tables; those strings must land in the panel as text, whatever they contain.
'use strict';
const { test, expect } = require('@playwright/test');
const { SEED_STATE, dismissContinue } = require('./helpers');

async function at(page, overrides) {
  const state = Object.assign({}, SEED_STATE, {
    currentCode: 'TLL', checkpointNode: 'TLL', visited: { TLL: true }, visitedCells: {},
    rngState: 424242, inventory: [], quests: {},
  }, overrides);
  await page.addInitScript(s => {
    localStorage.clear();
    localStorage.setItem('coc_autosave', JSON.stringify(s));
  }, state);
  await page.goto('/play.html');
  await dismissContinue(page);
}

test.describe('§DX-02bt — data-originated strings reach the quest panel as text', () => {
  test('a corpse record and a custom waypoint render their labels as text, and the card buttons still work', async ({ page }) => {
    await at(page, {
      corpsesQuests: [{ id: 'corpse_1', nodeCode: 'TLL', nodeName: '<b>Bog</b> & fen', items: [], goldDropped: 5 }],
      customQuestTerrain: '<i>marsh</i>', waypoint: 'TLL',
    });
    const r = await page.evaluate(() => {
      storyRenderQuests();
      const corpse = document.querySelector('#quest-list .quest-corpse');
      const hunt = document.querySelector('#quest-list .side-quest');
      const out = {
        corpseBold: corpse.querySelector('b') !== null,
        corpseTitle: corpse.querySelector('.quest-title span').textContent,
        corpseHint: corpse.querySelector('.quest-hint').textContent,
        huntItalic: hunt.querySelector('i') !== null,
        huntTitle: hunt.querySelector('.quest-title span').textContent,
        huntBadge: hunt.querySelector('.quest-badge').textContent,
        huntButtons: hunt.querySelectorAll('button').length,
      };
      [...hunt.querySelectorAll('button')].find(b => b.textContent.includes('Clear')).click();
      out.clearedTerrain = S_story.customQuestTerrain;
      out.clearedWp = S_story.waypoint;
      return out;
    });
    expect(r.corpseBold).toBe(false);
    expect(r.corpseTitle).toBe('🦴 Your body at <b>Bog</b> & fen');
    expect(r.corpseHint).toContain('<b>Bog</b> & fen');
    expect(r.huntItalic).toBe(false);
    expect(r.huntTitle).toBe('Hunt: <i>marsh</i>');
    expect(r.huntBadge).toBe('CUSTOM');
    expect(r.huntButtons).toBe(2);
    expect(r.clearedTerrain).toBeNull();
    expect(r.clearedWp).toBeNull();
  });
});
