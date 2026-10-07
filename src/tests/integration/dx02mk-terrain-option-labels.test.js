// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
'use strict';
const { test, expect } = require('@playwright/test');

// ── §DX-02mk — the terrain pickers show WORLD_DB's labels ──
//
// #terrain-select (the Opponent config's terrain cascade) and #quest-terrain-select (Create
// Custom Quest) list curated terrain keys in the HTML. The text a player reads comes from
// WORLD_DB at load, so a terrain label written through the API reaches both lists.

test('every terrain option reads its WORLD_DB icon and label', async ({ page }) => {
  await page.goto('/play.html');
  const r = await page.evaluate(() => {
    const out = {};
    for (const id of ['terrain-select', 'quest-terrain-select']) {
      const opts = [...document.querySelectorAll('#' + id + ' option')].filter(o => o.value);
      out[id] = {
        n: opts.length,
        unknown: opts.filter(o => !WORLD_DB[o.value]).map(o => o.value),
        wrong: opts.filter(o => WORLD_DB[o.value]
          && o.textContent !== WORLD_DB[o.value].icon + ' ' + WORLD_DB[o.value].label)
          .map(o => o.value + ': ' + o.textContent),
      };
    }
    return out;
  });
  for (const id of ['terrain-select', 'quest-terrain-select']) {
    expect(r[id].n).toBeGreaterThan(40);
    expect(r[id].unknown).toEqual([]);
    expect(r[id].wrong).toEqual([]);
  }
});
