// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §AUDIT-03p — the Void's "first crack" line renders at every place it was authored for.
//
// `_voidFlavorLine(nodeCode)` (Layer 59) appends a cluster-keyed flavor line to
// `#story-text-box` once `S_story.voidPressure >= 3`. Its lookup table is a FUNCTION-LOCAL
// `CLUSTER` literal, which is why the rot was invisible: `check:noderegs` (gate #13) read
// only TOP-LEVEL registries, so nothing ever asked whether those keys were nodes. Eleven of
// the sixteen were not — the table was written in the retired 26×16 codes, and four of those
// (`SH`/`PH`/`MH`/`WM`) were never `NODE_MAP` keys at any point in the file's history, so
// they were born dead in cc562f5. The line rendered at 5 of 16 authored places.
//
// These tests pin the two properties the row is about: every key resolves (source-level, the
// mirror of the gate's phase 5), and the line actually reaches the DOM at a node from each of
// the four clusters — including ones that were dead until this row (BMA, LCY, GVA).
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { seedAndLoad, dismissContinue } = require('./helpers');

const HTML = path.join(__dirname, '..', '..', 'play.html');

const CRACK = {
  birka:   'The cobblestones are colder than they should be.',
  tilbury: 'The harbor lights flicker without wind.',
  weimar:  'The scholars\' candles are burning down fast today.',
  wild:    'Something is bleeding through the rock.',
};
// One node per cluster that was DEAD before this row, plus LHR (the one birka node that
// already worked) as the control that the fix did not break what was already rendering.
const SAMPLE = [
  ['LHR', 'birka'],   // live before §AUDIT-03p
  ['BMA', 'birka'],   // was `SL`
  ['LCY', 'tilbury'], // was `DK`
  ['WM',  'weimar'],  // live before (by coincidence — `WM` was invented, then minted later)
  ['GVA', 'wild'],    // was `MT`
];

function clusterTable() {
  const src = fs.readFileSync(HTML, 'utf8');
  const start = src.indexOf('  const CLUSTER = {');
  expect(start, 'the _voidFlavorLine CLUSTER literal must still be findable').toBeGreaterThan(-1);
  const body = src.slice(start, src.indexOf('};', start));
  const out = {};
  for (const m of body.matchAll(/([A-Z][A-Z0-9]{0,5})\s*:\s*'([a-z]+)'/g)) out[m[1]] = m[2];
  return out;
}

function nodeMapKeys() {
  const WBAPI = require(path.join(__dirname, '..', '..', 'js', 'wbapi-core.js'));
  WBAPI.load(HTML);
  return new Set(Object.keys(WBAPI.nodeMap));
}

test.describe('§AUDIT-03p — the void-pressure flavor line reaches every node it names', () => {
  test('source: every CLUSTER key is a live NODE_MAP key, and every value is a real CRACK cluster', () => {
    const table = clusterTable();
    const live = nodeMapKeys();
    const dead = Object.keys(table).filter(k => !live.has(k));
    expect(dead, 'dead node codes in _voidFlavorLine CLUSTER').toEqual([]);
    const badCluster = Object.entries(table).filter(([, v]) => !CRACK[v]).map(([k, v]) => `${k}:${v}`);
    expect(badCluster, 'CLUSTER values must name a CRACK bucket').toEqual([]);
    // The pre-fix table had 16 keys and reached 5 nodes. Guard the coverage, not the exact
    // membership — adding a node to a cluster is authoring and must stay free.
    expect(Object.keys(table).length).toBeGreaterThanOrEqual(13);
  });

  test('source: the four never-existed codes are gone', () => {
    const table = clusterTable();
    for (const phantom of ['SH', 'PH', 'MH']) {
      expect(table[phantom], `${phantom} was never a NODE_MAP key — it must not be in CLUSTER`).toBeUndefined();
    }
  });

  for (const [code, cluster] of SAMPLE) {
    test(`voidPressure 3 at ${code} appends the ${cluster} crack line`, async ({ page }) => {
      const pageErrors = [];
      page.on('pageerror', e => pageErrors.push(String(e)));
      await seedAndLoad(page, { currentCode: code, checkpointNode: code, visited: { [code]: true }, voidPressure: 3 });
      await dismissContinue(page);
      await expect(page.locator('#story-text-box')).toContainText(CRACK[cluster]);
      expect(pageErrors).toEqual([]);
    });
  }

  test('below the threshold (voidPressure 2) no crack line renders — the gate is pressure, not presence', async ({ page }) => {
    const code = 'BMA';
    await seedAndLoad(page, { currentCode: code, checkpointNode: code, visited: { [code]: true }, voidPressure: 2 });
    await dismissContinue(page);
    await expect(page.locator('#story-text-box')).not.toContainText(CRACK.birka);
  });

  test('a node outside every cluster stays silent at voidPressure 6', async ({ page }) => {
    const table = clusterTable();
    const code = 'CDG';
    expect(table[code], 'CDG must not be in CLUSTER for this control to mean anything').toBeUndefined();
    await seedAndLoad(page, { currentCode: code, checkpointNode: code, visited: { [code]: true }, voidPressure: 6 });
    await dismissContinue(page);
    const box = page.locator('#story-text-box');
    for (const line of Object.values(CRACK)) await expect(box).not.toContainText(line);
  });

  test('threshold 2 (voidPressure 6) adds the named-place line at a node that was dead before', async ({ page }) => {
    const code = 'LCY';
    await seedAndLoad(page, { currentCode: code, checkpointNode: code, visited: { [code]: true }, voidPressure: 6 });
    await dismissContinue(page);
    const box = page.locator('#story-text-box');
    await expect(box).toContainText(CRACK.tilbury);
    await expect(box).toContainText('the air here has a quality you can\'t name');
  });
});
