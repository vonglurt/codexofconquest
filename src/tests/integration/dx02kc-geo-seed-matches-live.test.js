// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02kc — an applied `POST /api/layout/geo-seed` must leave every node where it stands.
// This replays the route's resolver offline (GEO2 from the server source, then the gazetteer's
// realPlaces, anchors, satellites and offEarth) and projects each node the way the route does.

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const core = require('../../js/wbapi-core.js');

function geo2() {
  const src = fs.readFileSync(path.join(ROOT, 'src', 'js', 'wbapi-server.js'), 'utf8');
  const start = src.indexOf('const GEO2 = {');
  const open = src.indexOf('{', start);
  const close = src.indexOf('\n      };', open);
  return Function('return ' + src.slice(open, close + 8))();
}

function project() {
  const GAZ = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'config', 'walk-geo-gazetteer.json'), 'utf8'));
  const latlon = {};
  for (const [k, v] of Object.entries(geo2())) latlon[k] = v;
  for (const [k, v] of Object.entries(GAZ.realPlaces || {})) latlon[k] = v;
  for (const [k, v] of Object.entries(GAZ.anchors || {})) if (v.lat != null) latlon[k] = v;
  const resolve = (code, seen = new Set()) => {
    if (latlon[code]) return latlon[code];
    if (seen.has(code)) return null;
    seen.add(code);
    const parent = (GAZ.satellites || {})[code]
      || ((GAZ.offEarth || {})[code] || {}).anchor
      || ((GAZ.anchors || {})[code] || {}).anchor;
    return parent ? resolve(parent, seen) : null;
  };
  for (const code of [...Object.keys(GAZ.satellites || {}), ...Object.keys(GAZ.offEarth || {})]) {
    const ll = resolve(code);
    if (ll) latlon[code] = ll;
  }
  return latlon;
}

test('§DX-02kc — every node projects onto its live NODE_COORDS cell, so a regeneration moves nothing', () => {
  const { nodeMap, nodeCoords } = core.load(path.join(ROOT, 'play.html'));
  const latlon = project();
  const locked = new Set(JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'config', 'roads-pins.json'), 'utf8')).locked || []);
  const skipped = [], moved = [];
  for (const code of Object.keys(nodeMap)) {
    if (locked.has(code) && nodeCoords[code]) continue;
    const ll = latlon[code];
    if (!ll) { skipped.push(code); continue; }
    const r = Math.max(0, Math.min(89, Math.floor(70 - ll.lat)));
    const c = ((Math.floor(ll.lon + 180) % 360) + 360) % 360;
    const live = nodeCoords[code];
    if (!live || live.r !== r || live.c !== c) moved.push(`${code} ${live ? live.r + ',' + live.c : '—'} → ${r},${c}`);
  }
  expect(skipped).toEqual([]);
  expect(moved).toEqual([]);
});

test('§DX-02kc — the math realm is placed in the pocket beside HKG, where §MATH-01 put it', () => {
  const { anchors, offEarth } = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'config', 'walk-geo-gazetteer.json'), 'utf8'));
  for (const code of ['EHZ', 'MONS', 'ZERO', 'CNTR']) {
    expect(anchors[code].anchor, code).toBe('HKG');
    expect(offEarth[code], code).toBeUndefined();
  }
});
