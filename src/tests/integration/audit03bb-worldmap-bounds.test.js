// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §AUDIT-03bb — worldmap.js's region grid, overview and zoom compare each GEO anchor against
// MAP's bounds with no clamp, so an anchor outside them is silently missing from all three.
// PDL (Ponta Delgada, lon −25.7) was, against minLon −25.

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const SRC = fs.readFileSync(path.resolve(__dirname, '..', '..', 'tools', 'worldmap.js'), 'utf8');
const literal = name => {
  const open = SRC.indexOf('{', SRC.indexOf('const ' + name + ' = {'));
  return Function('return ' + SRC.slice(open, SRC.indexOf('\n};', open) + 2))();
};
const GEO = literal('GEO');
const MAP = literal('MAP');

test('§AUDIT-03bb — every GEO anchor lies inside the map bounds', () => {
  const outside = Object.entries(GEO)
    .filter(([, g]) => g.lat < MAP.minLat || g.lat >= MAP.maxLat || g.lon < MAP.minLon || g.lon >= MAP.maxLon)
    .map(([k, g]) => `${k} ${g.lat},${g.lon}`);
  expect(outside).toEqual([]);
});

test('§AUDIT-03bb — every GEO anchor falls in exactly one cell of the 6×6 region grid', () => {
  const n = 6, latStep = (MAP.maxLat - MAP.minLat) / n, lonStep = (MAP.maxLon - MAP.minLon) / n;
  const wrong = [];
  for (const [k, g] of Object.entries(GEO)) {
    let cells = 0;
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      const s = MAP.maxLat - (r + 1) * latStep, no = MAP.maxLat - r * latStep;
      const w = MAP.minLon + c * lonStep, e = MAP.minLon + (c + 1) * lonStep;
      if (g.lat >= s && g.lat < no && g.lon >= w && g.lon < e) cells++;
    }
    if (cells !== 1) wrong.push(`${k} in ${cells}`);
  }
  expect(wrong).toEqual([]);
});
