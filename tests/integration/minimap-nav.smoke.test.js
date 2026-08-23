// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
'use strict';
// §MAP-NAV smoke — click-to-travel on the three story-bottom-bar mini maps:
//   • LOCAL  (#mini-map-grid, 11×17 .mmc divs)   → real DOM click steps the player
//   • WORLD  (#world-map-grid, 41×61 .wmc divs)  → real DOM click steps the player
//   • GLOBE  (#globe-map-canvas, whole world @2px)→ canvas click maps pixel→cell
// Display-only: every path routes through the existing _navClickCell / _mapCanvasClick
// used by the full Map tab, so the mover is never consulted (Free-Movement holds) —
// a click only issues cellMove steps / auto-travel, exactly like the map-tab tiles.
const { test, expect } = require('@playwright/test');

test.describe('§MAP-NAV — click-to-travel on the Local / World / Globe mini maps', () => {
  test('all three mini maps navigate on click', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/index.html');
    await page.locator('#story-panel').waitFor({ state: 'visible' });

    const r = await page.evaluate(() => {
      const out = {};
      out.started = !!(S_story.active && (S_story.playerR || S_story.playerC));

      // first orthogonally-adjacent walkable (non-sea) neighbour of p
      const adjLand = (p) => {
        for (const [dr, dc] of [[-1, 0], [1, 0], [0, 1], [0, -1]]) {
          const nr = p.r + dr, nc = p.c + dc;
          if (!IMPASSABLE_CELLS.has(nr + ',' + nc)) return { r: nr, c: nc, dr, dc };
        }
        return null;
      };

      // ── LOCAL mini map: 11 rows (dr -5..+5) × 17 cols (dc -8..+8) ──
      _renderMiniMap();
      const lgrid = document.getElementById('mini-map-grid');
      out.localCells = lgrid.childElementCount;                       // 11×17 = 187
      const p0 = { r: S_story.playerR, c: S_story.playerC };
      const a1 = adjLand(p0);
      out.a1 = a1;
      if (a1) {
        const cellEl = lgrid.children[(a1.dr + 5) * 17 + (a1.dc + 8)];
        out.localPointer = getComputedStyle(cellEl).cursor === 'pointer';
        cellEl.click();                                               // real DOM click
        out.localMoved = S_story.playerR === a1.r && S_story.playerC === a1.c;
      }

      // ── WORLD mini map: 41×61, window origin (max(1,pr-20), max(1,pc-30)) ──
      _renderWorldMiniMap();
      const wgrid = document.getElementById('world-map-grid');
      out.worldCells = wgrid.childElementCount;                       // 41×61 = 2501
      const p1 = { r: S_story.playerR, c: S_story.playerC };
      const a2 = adjLand(p1);
      out.a2 = a2;
      if (a2) {
        const wr0 = Math.max(1, p1.r - 20), wc0 = Math.max(1, p1.c - 30);
        const cellEl = wgrid.children[(a2.r - wr0) * 61 + (a2.c - wc0)];
        out.worldPointer = !!cellEl && getComputedStyle(cellEl).cursor === 'pointer';
        if (cellEl) cellEl.click();                                   // real DOM click
        out.worldMoved = S_story.playerR === a2.r && S_story.playerC === a2.c;
      }

      // ── GLOBE canvas: whole world @2px/cell (rows 0–89, cols 140–255) ──
      _renderGlobeMap();
      const gc = document.getElementById('globe-map-canvas');
      out.globeWin = gc._win ? { ...gc._win } : null;
      out.globeWired = !!gc._navWired;
      const pG = { r: S_story.playerR, c: S_story.playerC };
      const aG = adjLand(pG);
      out.aG = aG;
      if (aG && gc._win) {
        const rect = gc.getBoundingClientRect();
        out.globeRectOK = rect.width > 0 && rect.height > 0;
        // capture the pixel→cell mapping without actually crossing the world
        let captured = null;
        const real = _navClickCell;
        _navClickCell = (r, c) => { captured = { r, c }; };
        try {
          const cx = (aG.c - 140) * 2 + 1, cy = (aG.r - 0) * 2 + 1;   // centre of the cell
          const sx = rect.width ? rect.width / gc.width : 1;
          const sy = rect.height ? rect.height / gc.height : 1;
          gc.dispatchEvent(new MouseEvent('click', {
            clientX: rect.left + cx * sx, clientY: rect.top + cy * sy, bubbles: true,
          }));
        } finally { _navClickCell = real; }
        out.globeCaptured = captured;
      }
      return out;
    });

    expect(errors, 'no uncaught page errors').toEqual([]);
    expect(r.started, 'story mode auto-started with a placed player').toBe(true);

    // LOCAL
    expect(r.localCells).toBe(187);
    expect(r.a1, 'found an adjacent land cell').not.toBeNull();
    expect(r.localPointer, 'local tile shows a travel cursor').toBe(true);
    expect(r.localMoved, 'clicking the local tile stepped the player onto it').toBe(true);

    // WORLD
    expect(r.worldCells).toBe(2501);
    expect(r.a2).not.toBeNull();
    expect(r.worldPointer, 'world tile shows a travel cursor').toBe(true);
    expect(r.worldMoved, 'clicking the world tile stepped the player onto it').toBe(true);

    // GLOBE
    expect(r.globeWin, 'globe click→cell window set').toEqual({ r0: 0, c0: 140, PX: 2 });
    expect(r.globeWired, 'globe canvas click listener wired once').toBe(true);
    expect(r.aG).not.toBeNull();
    expect(r.globeCaptured, 'globe click routed a world cell into _navClickCell').not.toBeNull();
    if (r.globeRectOK) {
      expect(r.globeCaptured, 'globe pixel→cell mapping resolves to the clicked cell')
        .toEqual({ r: r.aG.r, c: r.aG.c });
    } else {
      // canvas had no layout box in this run — still assert a valid in-world mapping
      expect(r.globeCaptured.r).toBeGreaterThanOrEqual(0);
      expect(r.globeCaptured.r).toBeLessThanOrEqual(89);
      expect(r.globeCaptured.c).toBeGreaterThanOrEqual(140);
      expect(r.globeCaptured.c).toBeLessThanOrEqual(255);
    }
  });
});
