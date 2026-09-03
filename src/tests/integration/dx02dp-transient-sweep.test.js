// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02dp — the range after #story-text-box is transient, and exactly one function sweeps it.
// Both render paths (a named node through storyRender, an empty cell through _enterEmptyCell)
// must remove anything mounted after the text box; the source must carry the loop once.
'use strict';
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { seedAndLoad, dismissContinue } = require('./helpers');

const HTML = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'play.html'), 'utf8');

const plant = page => page.evaluate(() => {
  const m = document.createElement('div');
  m.id = 'dx02dp-marker';
  document.getElementById('story-text-box').insertAdjacentElement('afterend', m);
  return document.getElementById('story-text-box').nextElementSibling.id;
});

const tail = page => page.evaluate(() => {
  const box = document.getElementById('story-text-box');
  return {
    marker: !!document.getElementById('dx02dp-marker'),
    boxIsLast: box.parentElement.lastElementChild === box,
    infoRowIsSibling: box.parentElement === document.getElementById('story-info-row').parentElement,
  };
});

test.describe('§DX-02dp — one sweep owns the transient range after #story-text-box', () => {
  test('a named-node render removes everything mounted after the text box', async ({ page }) => {
    await seedAndLoad(page);
    await dismissContinue(page);
    expect(await plant(page)).toBe('dx02dp-marker');
    await page.evaluate(() => storyRender(NODE_MAP[S_story.currentCode]));
    expect((await tail(page)).marker).toBe(false);
  });

  test('an empty-cell render removes everything mounted after the text box and leaves it last', async ({ page }) => {
    await seedAndLoad(page);
    await dismissContinue(page);
    expect(await plant(page)).toBe('dx02dp-marker');
    const moved = await page.evaluate(() => {
      for (let d = 1; d < 6; d++) {
        for (const [dr, dc] of [[d, 0], [-d, 0], [0, d], [0, -d]]) {
          const r = S_story.playerR + dr, c = S_story.playerC + dc;
          if (!CELL_GRID[r + ',' + c]) { _enterEmptyCell(r, c); return { r, c }; }
        }
      }
      return null;
    });
    expect(moved).not.toBeNull();
    const t = await tail(page);
    expect(t.marker).toBe(false);
    expect(t.boxIsLast).toBe(true);
  });

  test('#story-info-row is not a sibling of the text box, so the sweep cannot stop on it', async ({ page }) => {
    await seedAndLoad(page);
    await dismissContinue(page);
    expect((await tail(page)).infoRowIsSibling).toBe(false);
  });

  test('the source carries the sweep once and calls it from both render paths', () => {
    expect(HTML.match(/^function _clearStoryTransient\(\)/gm)).toHaveLength(1);
    expect(HTML.match(/^\s*_clearStoryTransient\(\);$/gm)).toHaveLength(2);
    expect(HTML).not.toMatch(/nextElementSibling; _el\.remove\(\)/);
  });
});
