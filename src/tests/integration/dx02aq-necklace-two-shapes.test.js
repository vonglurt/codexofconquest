// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02aq — S_story.knowledge holds bead objects from the rest system and bare-string lore
// notes from the arcs and the quest VM. The inventory panel must render both, and render no
// `undefined`.
'use strict';
const { test, expect } = require('@playwright/test');
const { SEED_STATE, dismissContinue } = require('./helpers');

const BEAD = { name: 'Birka — The First Inn', icon: '🏮', node: 'TLL', type: 'knowledge' };
const NOTE = 'Lake Investigation: The hull marks are physical — claw drag at waterline.';

test('a bead renders under the Necklace, a lore note under Field Notes, and nothing renders as undefined', async ({ page }) => {
  const state = Object.assign({}, SEED_STATE, {
    currentCode: 'TLL', checkpointNode: 'TLL', visited: { TLL: true }, visitedCells: {},
    rngState: 424242, inventory: [], quests: {}, knowledge: [BEAD, NOTE],
  });
  await page.addInitScript(s => {
    localStorage.clear();
    localStorage.setItem('coc_autosave', JSON.stringify(s));
  }, state);
  await page.goto('/play.html');
  await dismissContinue(page);
  const r = await page.evaluate(() => {
    storyRenderInventory();
    const list = document.getElementById('inv-list');
    const heads = [...list.querySelectorAll('.inv-section-hd')].map(h => h.textContent);
    const section = title => {
      const hd = [...list.querySelectorAll('.inv-section-hd')].find(h => h.textContent === title);
      const rows = [];
      for (let el = hd && hd.nextElementSibling; el && !el.classList.contains('inv-section-hd'); el = el.nextElementSibling) rows.push(el.textContent);
      return rows;
    };
    return { text: list.textContent, heads, necklace: section('🔮 Necklace of Knowledge'), notes: section('📖 Field Notes') };
  });
  expect(r.text).not.toContain('undefined');
  expect(r.necklace).toHaveLength(1);
  expect(r.necklace[0]).toContain(BEAD.name);
  expect(r.notes).toHaveLength(1);
  expect(r.notes[0]).toContain(NOTE);
});
