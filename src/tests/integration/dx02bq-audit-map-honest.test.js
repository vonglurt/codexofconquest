// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02bq — GET /api/audit/map counts the N/S/E/W link fields left on nodes, and carries
// one cell grid, not two.
//
// Nine of its checks walked node.N/S/E/W or the diagonal slots, which §CELL-01 stripped
// from all 416 nodes, so their silence read as a clean map. §DX-02bq reported them as
// unmeasured; §DX-02ky-FU3 deleted them. The link count stays in the summary.
//
// Pure-node: the helper is lifted out of the server source text and evaluated against
// the parsed world, so no server is started.

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const SERVER = fs.readFileSync(path.join(ROOT, 'src', 'js', 'wbapi-server.js'), 'utf8');

function loadHelper() {
  const fn = SERVER.indexOf('function linkFieldCount(nm) {');
  expect(fn, 'linkFieldCount must exist in wbapi-server.js').toBeGreaterThan(-1);
  const end = SERVER.indexOf('\n}\n', fn) + 3;
  // eslint-disable-next-line no-new-func
  return new Function(SERVER.slice(fn, end) + '\nreturn { linkFieldCount };')();
}

function world() {
  const W = require(path.join(ROOT, 'src', 'js', 'wbapi-core.js'));
  W.load(path.join(ROOT, 'play.html'));
  return W;
}

test('§DX-02bq — the live map carries no link field', () => {
  const { linkFieldCount } = loadHelper();
  const W = world();
  expect(Object.keys(W.nodeMap).length).toBeGreaterThan(400);
  expect(linkFieldCount(W.nodeMap)).toBe(0);
});

test('§DX-02bq — a single link field is counted', () => {
  const { linkFieldCount } = loadHelper();
  expect(linkFieldCount({ A: { N: 'B' }, B: { SE: 'A', label: 'x' }, C: {} })).toBe(2);
  expect(linkFieldCount({ A: { N: null } })).toBe(0);
});

test('§DX-02ky-FU3 — no link check is left for the handler to emit, and the summary keeps the count', () => {
  for (const c of ['diagonal_exit', 'max_connections', 'bidirectional', 'dangling_link',
    'direction_sign', 'long_link', 'alignment', 'axis_distance', 'corner_misalign'])
    expect(SERVER, c).not.toContain(`check:'${c}'`);
  expect(SERVER).toContain('totalNodes: allNodeCodes.length, linkFields };');
});

test('§DX-02bq — one buildCellGrid, the first-wins module copy', () => {
  expect(SERVER.split('function buildCellGrid(').length - 1).toBe(1);
  const at = SERVER.indexOf('function buildCellGrid(');
  expect(SERVER.slice(at, at + 600)).toContain('first-wins');
});
