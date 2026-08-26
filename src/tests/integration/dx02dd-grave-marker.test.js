// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02dd — the grave marker had two blind spots, and the assertion §DEATH-01's
// own verification plan named ("Local-grid marker present on the grave cell when in
// view") was never written. The one Inc-B surface that touches the map renderer was
// the one surface with no coverage, which is why both blind spots survived 37 days.
//
// The marker sat inside the `else if (code)` → `if (isVis || isTrail)` arm of
// `_renderMapGrid`, so:
//   · the cell the player is STANDING ON painted 0 — the `isCurrent` arm wins there;
//   · an in-window but UNVISITED node painted 0 — a third arm swallows it.
// Neither was a loss (the node card carries the retrieve action underfoot, and the
// chip names the place from anywhere) but the map contradicted the chip beside it.
//
// Both are marked now. Unvisited is a deliberate call: the player demonstrably knows
// where they died — the chip has always said so in words — so withholding it on the
// map is the contradiction, not the disclosure.

const { test, expect } = require('@playwright/test');
const { seedAndLoad } = require('./helpers.js');

// Three geometries against one renderer. `_renderMapGrid` draws a 15×21 window
// centred on the player, so a neighbouring cell is reliably in view.
async function graveCells(page, { standingOn, visited }) {
  return page.evaluate(([standingOn, visited]) => {
    const here = S_story.currentCode;
    // `_renderMapGrid` centres on playerR/playerC, falling back to the current
    // node's own coords — resolve the same way so the window is where we think.
    const nc = NODE_COORDS[here];
    const pr = S_story.playerR || (nc && nc.r) || 0;
    const pc = S_story.playerC || (nc && nc.c) || 0;
    const neighbourKey = Object.keys(CELL_GRID).find(k => {
      const code = cellCode(k);
      if (!code || code === here) return false;
      const [r, c] = k.split(',').map(Number);
      return Math.abs(r - pr) <= 3 && Math.abs(c - pc) <= 3;
    });
    const target = standingOn ? here : cellCode(neighbourKey);
    S_story.visited = visited ? { [target]: true } : {};
    S_story.corpsesQuests = [{ questId:'q', nodeCode:target, nodeName:'Somewhere',
                               goldDropped:120, items:[{ name:'Longsword' }] }];
    _renderMapGrid();
    const marked = [...document.querySelectorAll('.mc-grave')];
    return { target, marked: marked.length, marks: document.querySelectorAll('.mc-grave-mark').length,
             keepsYouAreHere: standingOn ? marked.some(m => m.classList.contains('mc-current')) : null };
  }, [standingOn, visited]);
}

test.describe('§DX-02dd — the grave paints on every cell it is on', () => {

  test('a visited in-window grave paints — the case that already worked', async ({ page }) => {
    await seedAndLoad(page);
    const r = await graveCells(page, { standingOn: false, visited: true });
    expect(r.marked).toBe(1);
    expect(r.marks).toBe(1);
  });

  test('the cell the player is standing on paints, and keeps its you-are-here glyph', async ({ page }) => {
    await seedAndLoad(page);
    const r = await graveCells(page, { standingOn: true, visited: true });
    expect(r.marked).toBe(1);
    expect(r.keepsYouAreHere).toBe(true);
    const glyph = await page.evaluate(() => document.querySelector('.mc-current .mc-icon').textContent);
    expect(glyph).toBe('◉');
  });

  test('an unvisited in-window grave paints — the player knows where they died', async ({ page }) => {
    await seedAndLoad(page);
    const r = await graveCells(page, { standingOn: false, visited: false });
    expect(r.marked).toBe(1);
  });

  test('no corpses, no marks', async ({ page }) => {
    await seedAndLoad(page);
    const n = await page.evaluate(() => {
      S_story.corpsesQuests = [];
      _renderMapGrid();
      return document.querySelectorAll('.mc-grave').length;
    });
    expect(n).toBe(0);
  });

  test('the hover note names items and gold, on all three arms', async ({ page }) => {
    await seedAndLoad(page);
    const notes = await page.evaluate(() => {
      S_story.corpsesQuests = [{ questId:'q', nodeCode:'ZZZ', nodeName:'Somewhere',
                                 goldDropped:120, items:[{ name:'A' }, { name:'B' }] }];
      return { hit: _graveNote('ZZZ'), miss: _graveNote('LHR') };
    });
    expect(notes.hit).toContain('2 item(s)');
    expect(notes.hit).toContain('120 gp');
    expect(notes.miss).toBe('');
  });
});

test.describe('§DX-02dd(b) — corpsesQuests stays unbounded; the title does not', () => {

  // The array is deliberately NOT capped. Every capping strategy either destroys
  // player property or invents a merge semantic nothing else in the game uses, and
  // the record is the only thing standing between a death and the loot it holds.
  // What was actually unbounded in a way the player sees is the chip's `title`,
  // which concatenated every corpse into one attribute.
  test('a large death count still keeps every record', async ({ page }) => {
    await seedAndLoad(page);
    const kept = await page.evaluate(() => {
      S_story.corpsesQuests = Array.from({ length: 50 }, (_, i) => ({
        questId: 'q' + i, nodeCode: 'LHR', nodeName: 'Place ' + i, goldDropped: i, items: [] }));
      _renderCorpseChip();
      return S_story.corpsesQuests.length;
    });
    expect(kept).toBe(50);
  });

  test('the title names at most CORPSE_TITLE_MAX places and counts the rest', async ({ page }) => {
    await seedAndLoad(page);
    const r = await page.evaluate(() => {
      S_story.corpsesQuests = Array.from({ length: 50 }, (_, i) => ({
        questId: 'q' + i, nodeCode: 'LHR', nodeName: 'Place ' + i, goldDropped: i, items: [] }));
      _renderCorpseChip();
      const t = document.getElementById('corpse-chip').title;
      return { max: CORPSE_TITLE_MAX, named: (t.match(/Place \d+/g) || []).length, t };
    });
    expect(r.named).toBe(r.max);
    expect(r.t).toContain('and ' + (50 - r.max) + ' more');
  });

  test('a short list carries no "and N more" tail', async ({ page }) => {
    await seedAndLoad(page);
    const t = await page.evaluate(() => {
      S_story.corpsesQuests = [{ questId:'q', nodeCode:'LHR', nodeName:'Place 0', goldDropped:5, items:[] }];
      _renderCorpseChip();
      return document.getElementById('corpse-chip').title;
    });
    expect(t).not.toContain('more');
  });
});
