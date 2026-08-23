// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson and Claude
'use strict';
// §MP-MAPTABS smoke — the map sheet's Local/World/Full sub-tabs: tab bar wiring,
// responsive Local grid fit, World/Full canvas render + click→cell mapping, the
// cell-target pathfinder, and click-to-travel (adjacent = one step). Display-only:
// nothing here gates the mover (Free-Movement) — it only issues cellMove steps.
const { test, expect } = require('@playwright/test');

test.describe('§MP-MAPTABS — Local/World/Full map sub-tabs + click-to-travel', () => {
  test('tabs + panes + responsive fit + painters + pathfinder + click-to-travel', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/index.html');
    await page.locator('#story-panel').waitFor({ state: 'visible' });

    const r = await page.evaluate(() => {
      const out = {};
      // 1 — tab bar order + labels
      const tabs = [...document.querySelectorAll('#map-subtab-bar .map-subtab')]
        .map(t => ({ id: t.dataset.msub, txt: t.textContent.trim() }));
      out.tabIds = tabs.map(t => t.id);
      out.labels = tabs.map(t => t.txt);

      switchSheet('sheet-map');   // panes need a laid-out size to fit canvases

      // 2 — Local: responsive --mcpx within clamp + full 15×21 grid
      msubSwitch('msub-map');
      out.localActive = document.getElementById('msub-map').classList.contains('msub-active');
      out.mcpxPx = parseFloat(getComputedStyle(document.getElementById('map-grid')).getPropertyValue('--mcpx'));
      out.gridCells = document.getElementById('map-grid').childElementCount;

      // 3 — Full tab: canvas sized to pane + click-mapping window set
      msubSwitch('msub-full');
      const fc = document.getElementById('full-map-canvas');
      out.fullActive = document.getElementById('msub-full').classList.contains('msub-active');
      out.fullW = fc.width;
      out.fullWin = fc._win ? { ...fc._win } : null;

      // 4 — World tab: player-centered crop sized + window set
      msubSwitch('msub-world');
      const wc = document.getElementById('world-tab-canvas');
      out.worldActive = document.getElementById('msub-world').classList.contains('msub-active');
      out.worldW = wc.width;
      out.worldWin = wc._win ? { ...wc._win } : null;

      // 5 — pathfinder: node route (regression) + cell route + first-step dir
      const pos = { r: S_story.playerR, c: S_story.playerC };
      out.nodeRouteType = Array.isArray(_roadGridPath(pos, S_story.currentCode));
      let adj = null;
      for (const [dr, dc] of [[-1, 0], [1, 0], [0, 1], [0, -1]]) {
        const nr = pos.r + dr, nc = pos.c + dc;
        if (!IMPASSABLE_CELLS.has(nr + ',' + nc)) { adj = { r: nr, c: nc }; break; }
      }
      out.adj = adj;
      out.cellRouteLen = adj ? _cellRoute(pos, adj).length : -1;
      out.cellDir = adj ? _cellGridDir(pos, adj) : null;

      // 6 — click-to-travel: adjacent tile → exactly one step onto it
      if (adj) _navClickCell(adj.r, adj.c);
      out.moved = !!adj && S_story.playerR === adj.r && S_story.playerC === adj.c;

      // 7 — canvas click window is usable (integer px/cell)
      out.worldWinOK = !!(wc._win && wc._win.PX >= 1 && typeof wc._win.r0 === 'number');
      return out;
    });

    expect(errors, 'no uncaught page errors').toEqual([]);
    expect(r.tabIds).toEqual(['msub-map', 'msub-world', 'msub-full', 'msub-connect', 'msub-discover', 'msub-lists']);
    expect(r.labels[0]).toContain('Local');
    expect(r.labels[1]).toContain('World');
    expect(r.labels[2]).toContain('Full');
    expect(r.localActive).toBe(true);
    expect(r.gridCells).toBe(315);                 // 15 rows × 21 cols
    if (r.mcpxPx) { expect(r.mcpxPx).toBeGreaterThanOrEqual(16); expect(r.mcpxPx).toBeLessThanOrEqual(88); }
    expect(r.fullActive).toBe(true);
    expect(r.fullW).toBeGreaterThan(0);
    expect(r.fullWin).not.toBeNull();
    expect(r.worldActive).toBe(true);
    expect(r.worldW).toBeGreaterThan(0);
    expect(r.worldWin).not.toBeNull();
    expect(r.nodeRouteType).toBe(true);            // _roadGridPath still returns an array
    expect(r.adj).not.toBeNull();
    expect(r.cellRouteLen).toBeGreaterThanOrEqual(1);
    expect(['N', 'S', 'E', 'W']).toContain(r.cellDir);
    expect(r.moved).toBe(true);                    // adjacent click stepped exactly onto the tile
    expect(r.worldWinOK).toBe(true);
  });
});
