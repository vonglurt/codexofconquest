// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §SIREN-01-FU — the Littoral Courts can be walked again. Until 2026-10-04 the six surviving
// nodes shared cells behind SEA and CI2, so none could be arrived at and none of the five quests
// could activate, and the three sea crossings had been deleted with the junction nodes. Each node
// now has a cell of its own, and LJ1–LJ3 are ordinary nodes carrying their original battles.
'use strict';
const { test, expect } = require('@playwright/test');
const { SEED_STATE, dismissContinue } = require('./helpers');

const CHAIN = ['LC1', 'LJ1', 'LC2', 'LJ2', 'LC3', 'LJ3', 'LC4', 'LCA'];
const QUESTS = { LC1: 'quest_aurel_tide', LC2: 'quest_calice_bridge', LC3: 'quest_mireille_ami',
  LC4: 'quest_solen_horizon', LSO: 'quest_sea_overseer' };

async function at(page, code) {
  const state = Object.assign({}, SEED_STATE, {
    currentCode: code, checkpointNode: code, visited: { [code]: true }, visitedCells: {},
    rngState: 424242, inventory: [], quests: {},
  });
  await page.addInitScript(s => {
    localStorage.clear();
    localStorage.setItem('coc_autosave', JSON.stringify(s));
  }, state);
  await page.goto('/play.html');
  await dismissContinue(page);
}

test('every Littoral node is the primary of its own cell', async ({ page }) => {
  await at(page, 'LHR');
  const r = await page.evaluate(codes => codes.map(c => {
    const p = NODE_COORDS[c];
    return { c, cell: CELL_GRID[p.r + ',' + p.c] };
  }), [...CHAIN, 'LSO']);
  for (const { c, cell } of r) expect(cell, c).toEqual([c]);
});

test('the three crossings carry the §II-A battles, byte-exact', async ({ page }) => {
  await at(page, 'LHR');
  const b = await page.evaluate(() => ['LJ1', 'LJ2', 'LJ3'].map(c => NODE_MAP[c].battle));
  expect(b).toEqual([
    { label: 'Sea Spawn × 2', key: 'sea_serpent', count: 2 },
    { label: 'Deep One × 3', key: 'deep_one', count: 3 },
    { label: 'The Serpent of the Passage', key: 'sea_serpent', count: 1 },
  ]);
});

test('walking the chain arrives at each node in turn and activates each court\'s quest', async ({ page }) => {
  await at(page, 'LC1');
  const legs = [...CHAIN.slice(1).map((to, i) => [CHAIN[i], to]), ['LJ3', 'LSO']];
  const r = await page.evaluate(legs => {
    const out = [];
    for (const [from, to] of legs) {
      S_story.currentCode = from;
      S_story.playerR = NODE_COORDS[from].r;
      S_story.playerC = NODE_COORDS[from].c;
      let steps = 0;
      while (S_story.currentCode !== to && steps < 40) {
        const dir = _bfsGridDir(_playerPos(), to);
        if (!dir) break;
        cellMove(dir);
        steps++;
      }
      out.push({ to, arrived: S_story.currentCode, steps });
    }
    return { out, quests: JSON.parse(JSON.stringify(S_story.quests)) };
  }, legs);
  for (const leg of r.out) expect(leg.arrived, `walked to ${leg.to} in ${leg.steps} steps`).toBe(leg.to);
  for (const [node, q] of Object.entries(QUESTS)) expect(r.quests[q], `${q} activates on arrival at ${node}`).toBe('active');
});
