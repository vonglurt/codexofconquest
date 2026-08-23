// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson and Claude
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

  test('the #map-act-filter dims out-of-act dots on the canvas', async ({ page }) => {
    await page.goto('/worldbuilder.html');
    const res = await page.evaluate(() => {
      // Two nodes, different acts, far apart so their discs never overlap.
      WBAPI.loaded = true;
      WBAPI.nodeMap = {
        AAA: { label: 'Act2', name: 'forest', act: 2 },   // ACT_COLORS[2]=#3fb950
        BBB: { label: 'Act5', name: 'desert', act: 5 },   // ACT_COLORS[5]=#bc8cff
      };
      WBAPI.nodeCoords = { AAA: { r: 3, c: 3 }, BBB: { r: 3, c: 9 } };
      const sel = document.getElementById('map-color-mode');
      sel.value = 'act'; sel.dispatchEvent(new Event('change'));
      const ctx = document.getElementById('map-canvas').getContext('2d');
      const S = 18;
      const disc = (r, c) => {
        const img = ctx.getImageData(c * S - 9, r * S - 9, 18, 18).data, s = new Set();
        for (let i = 0; i < img.length; i += 4) s.add(`${img[i]},${img[i + 1]},${img[i + 2]}`);
        return [...s];
      };
      const af = document.getElementById('map-act-filter');
      const at = (act) => { af.value = act; af.dispatchEvent(new Event('change')); return { aaa: disc(3, 3), bbb: disc(3, 9) }; };
      return { none: at(''), act2: at('2') };
    });
    // No filter: both dots carry their own act color.
    expect(res.none.aaa).toContain('63,185,80');     // #3fb950
    expect(res.none.bbb).toContain('188,140,255');   // #bc8cff
    // Filter to Act II: AAA stays act-green, BBB is dimmed to grey (#2d333b=45,51,59).
    expect(res.act2.aaa).toContain('63,185,80');
    expect(res.act2.bbb).not.toContain('188,140,255');
    expect(res.act2.bbb).toContain('45,51,59');
  });

  test('the compass rose is north-up (N above S, E right of W)', async ({ page }) => {
    await page.goto('/worldbuilder.html');
    const r = await page.evaluate(() => {
      const svg = document.getElementById('map-compass');
      const lbl = c => svg.querySelector(`.mc-lbl.mc-${c}`) || [...svg.querySelectorAll('.mc-lbl')].find(t => t.textContent.trim() === c.toUpperCase());
      const at = c => { const t = lbl(c); return { x: +t.getAttribute('x'), y: +t.getAttribute('y'), txt: t.textContent.trim() }; };
      const N = at('n'), S = at('s'), E = at('e'), W = at('w');
      return {
        present: !!svg && svg.querySelectorAll('.mc-lbl').length === 4,
        labels: [N.txt, S.txt, E.txt, W.txt].sort().join(''),
        nAboveS: N.y < S.y,            // smaller y = higher on screen = north
        eRightOfW: E.x > W.x,
        overlay: getComputedStyle(svg).pointerEvents,
      };
    });
    expect(r.present).toBe(true);
    expect(r.labels).toBe('ENSW');    // exactly the four cardinals
    expect(r.nAboveS).toBe(true);
    expect(r.eRightOfW).toBe(true);
    expect(r.overlay).toBe('none');   // never intercepts map clicks
  });
});

// ── §WALK-G — in-context node creation (place mode) ──────────────────────────
//
// The map footer's "📍 Place node" button toggles place mode; the next click on
// an EMPTY map cell creates a node at that cell's (r,c) (real coords, not the
// off-grid virtual cell the "+ Add" button uses), then exits place mode. A
// click on an OCCUPIED cell is rejected.

test.describe('In-context node creation (§WALK-G)', () => {
  test('place mode → click an empty cell drops a node at that (r,c)', async ({ page }) => {
    await page.goto('/worldbuilder.html');
    page.on('dialog', d => d.accept(d.type() === 'prompt' ? 'NEWN' : undefined));
    const res = await page.evaluate(async () => {
      WBAPI.loaded = true;
      WBAPI.nodeMap = { AAA: { label: 'A', name: 'forest', act: 1 } };
      WBAPI.nodeCoords = { AAA: { r: 3, c: 3 } };
      DIFF.added = {}; DIFF.modified = {}; DIFF.deleted = new Set();
      const btn = document.getElementById('btn-place-node');
      btn.disabled = false; btn.click();                       // → place mode ON
      const afterToggle = { place: mapPlaceMode, active: btn.classList.contains('active') };
      // Click an empty cell (r=6, c=10). At mapScale=18 the cell center is px (c*S, r*S).
      const cv = document.getElementById('map-canvas');
      const rect = cv.getBoundingClientRect();
      const S = 18, r = 6, c = 10;
      cv.dispatchEvent(new MouseEvent('click', { clientX: rect.left + c * S, clientY: rect.top + r * S, bubbles: true }));
      return {
        afterToggle,
        created: !!DIFF.added.NEWN,
        coord: WBAPI.nodeCoords.NEWN,
        virtual: 'virtual' in (WBAPI.nodeCoords.NEWN || {}),
        selected: mapSelected,
        placeOff: mapPlaceMode,                                // one-shot → off after a drop
      };
    });
    expect(res.afterToggle.place).toBe(true);
    expect(res.afterToggle.active).toBe(true);
    expect(res.created).toBe(true);
    expect(res.coord).toEqual({ r: 6, c: 10 });               // real cell, not off-grid c:64
    expect(res.virtual).toBe(false);
    expect(res.selected).toBe('NEWN');
    expect(res.placeOff).toBe(false);
  });

  test('clicking an existing node in place mode selects it (no node created, exits)', async ({ page }) => {
    await page.goto('/worldbuilder.html');
    let prompted = false;
    page.on('dialog', d => { if (d.type() === 'prompt') prompted = true; d.accept(d.type() === 'prompt' ? 'XXX' : undefined); });
    const res = await page.evaluate(async () => {
      WBAPI.loaded = true;
      WBAPI.nodeMap = { AAA: { label: 'A', name: 'forest', act: 1 } };
      WBAPI.nodeCoords = { AAA: { r: 4, c: 5 } };
      DIFF.added = {}; DIFF.modified = {}; DIFF.deleted = new Set();
      document.getElementById('btn-place-node').click();        // place mode ON
      const cv = document.getElementById('map-canvas');
      const rect = cv.getBoundingClientRect();
      const S = 18;
      cv.dispatchEvent(new MouseEvent('click', { clientX: rect.left + 5 * S, clientY: rect.top + 4 * S, bubbles: true }));
      return { addedCount: Object.keys(DIFF.added).length, stillPlacing: mapPlaceMode, selected: mapSelected };
    });
    expect(prompted).toBe(false);          // a click on a node never asks for a new code
    expect(res.addedCount).toBe(0);        // nothing created
    expect(res.selected).toBe('AAA');      // the clicked node is selected instead
    expect(res.stillPlacing).toBe(false);  // clicking a node exits place mode
  });

  test('__createNodeAt rejects duplicate + invalid codes', async ({ page }) => {
    await page.goto('/worldbuilder.html');
    page.on('dialog', d => d.accept());     // dismiss the alert()s
    const res = await page.evaluate(async () => {
      WBAPI.loaded = true;
      WBAPI.nodeMap = { AAA: { label: 'A', name: 'forest', act: 1 } };
      WBAPI.nodeCoords = { AAA: { r: 1, c: 1 } };
      DIFF.added = {}; DIFF.modified = {}; DIFF.deleted = new Set();
      return {
        dup:     window.__createNodeAt('AAA', { r: 2, c: 2 }),   // already exists
        invalid: window.__createNodeAt('bad code!', { r: 2, c: 2 }),
        ok:      window.__createNodeAt('bbb', { r: 2, c: 2 }),   // lowercased → BBB
        bbbAt:   WBAPI.nodeCoords.BBB,
      };
    });
    expect(res.dup).toBe(false);
    expect(res.invalid).toBe(false);
    expect(res.ok).toBe(true);
    expect(res.bbbAt).toEqual({ r: 2, c: 2 });
  });
});
