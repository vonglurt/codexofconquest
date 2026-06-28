'use strict';
const { test, expect } = require('@playwright/test');

// ── §WALK-G — Map "color by" mode: Act vs Terrain ─────────────────────────────
//
// renderMap() fills each node dot with ACT_COLORS[node.act] by default, or a
// deterministic per-terrain hash color (terrainColor(node.name)) when the
// #map-color-mode select is set to "terrain". We prove the wiring by sampling
// the canvas pixel at a node's center under each mode, plus unit-test the pure
// terrainColor() hash (stable, distinct, fallback).

test.describe('Map color-by mode (§WALK-G)', () => {
  test('terrainColor() is a stable, distinct, fallback-safe hash', async ({ page }) => {
    await page.goto('/worldbuilder.html');
    const r = await page.evaluate(() => ({
      stable:   window.terrainColor('coastal_market') === window.terrainColor('coastal_market'),
      distinct: window.terrainColor('forest') !== window.terrainColor('desert'),
      empty:    window.terrainColor(''),
      shape:    /^hsl\(\d+, \d+%, \d+%\)$/.test(window.terrainColor('tundra')),
    }));
    expect(r.stable).toBe(true);
    expect(r.distinct).toBe(true);
    expect(r.empty).toBe('#8b949e');   // muted fallback for terrain-less nodes
    expect(r.shape).toBe(true);
  });

  test('the canvas dot is painted from the active color mode', async ({ page }) => {
    await page.goto('/worldbuilder.html');
    const res = await page.evaluate(() => {
      // Minimal loaded world: one act-2 node with a known terrain at cell (3,3).
      WBAPI.loaded = true;
      WBAPI.nodeMap = { AAA: { label: 'Test', name: 'coastal_market', act: 2 } };
      WBAPI.nodeCoords = { AAA: { r: 3, c: 3 } };
      // Collect the distinct fill colors over the dot region (the node center
      // carries a dark code label, so scan the disc rather than one pixel).
      const scan = mode => {
        const sel = document.getElementById('map-color-mode');
        sel.value = mode; sel.dispatchEvent(new Event('change'));
        const ctx = document.getElementById('map-canvas').getContext('2d');
        const S = 18, cx = 3 * S, cy = 3 * S;     // mapScale default
        const img = ctx.getImageData(cx - 9, cy - 9, 18, 18).data, s = new Set();
        for (let i = 0; i < img.length; i += 4) s.add(`${img[i]},${img[i + 1]},${img[i + 2]}`);
        return [...s];
      };
      return { act: scan('act'), terrain: scan('terrain') };
    });
    // Act mode fills the dot with ACT_COLORS[2] = #3fb950 = rgb(63,185,80).
    expect(res.act).toContain('63,185,80');
    // Terrain mode repaints the dot a terrain-hash color → the act green is gone.
    expect(res.terrain).not.toContain('63,185,80');
  });
});
