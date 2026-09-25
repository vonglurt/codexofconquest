// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02bq — GET /api/audit/map says which of its checks cannot fire, and carries one
// cell grid, not two.
//
// Nine of its checks walk node.N/S/E/W or the diagonal slots, which §CELL-01 stripped
// from all 416 nodes. Their silence read as a clean map. The payload now reports them
// as structurallySatisfied whenever the map carries no link field.
//
// Pure-node: the helper is lifted out of the server source text and evaluated against
// the parsed world, so no server is started.

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const SERVER = fs.readFileSync(path.join(ROOT, 'src', 'js', 'wbapi-server.js'), 'utf8');

function loadHelper() {
  const start = SERVER.indexOf('const LINK_FIELD_CHECKS = [');
  expect(start, 'LINK_FIELD_CHECKS must exist in wbapi-server.js').toBeGreaterThan(-1);
  const fn = SERVER.indexOf('function linkFieldCount(nm) {', start);
  const end = SERVER.indexOf('\n}\n', fn) + 3;
  // eslint-disable-next-line no-new-func
  return new Function(SERVER.slice(start, end) + '\nreturn { LINK_FIELD_CHECKS, linkFieldCount };')();
}

function world() {
  const W = require(path.join(ROOT, 'src', 'js', 'wbapi-core.js'));
  W.load(path.join(ROOT, 'play.html'));
  return W;
}

test('§DX-02bq — the live map carries no link field, so all nine link checks are reported unmeasured', () => {
  const { LINK_FIELD_CHECKS, linkFieldCount } = loadHelper();
  const W = world();
  expect(Object.keys(W.nodeMap).length).toBeGreaterThan(400);
  expect(linkFieldCount(W.nodeMap)).toBe(0);
  expect(LINK_FIELD_CHECKS).toHaveLength(9);
});

test('§DX-02bq — a single link field is counted, so the report stops calling the checks unmeasured', () => {
  const { linkFieldCount } = loadHelper();
  expect(linkFieldCount({ A: { N: 'B' }, B: { SE: 'A', label: 'x' }, C: {} })).toBe(2);
  expect(linkFieldCount({ A: { N: null } })).toBe(0);
});

test('§DX-02bq — every named link check is a check the handler emits, and the payload carries the list', () => {
  const { LINK_FIELD_CHECKS } = loadHelper();
  for (const c of LINK_FIELD_CHECKS) expect(SERVER, c).toContain(`check:'${c}'`);
  expect(SERVER).toContain('blockedEdges: blockedEdges.length, linkFields, structurallySatisfied };');
});

test('§DX-02bq — one buildCellGrid, the first-wins module copy', () => {
  expect(SERVER.split('function buildCellGrid(').length - 1).toBe(1);
  const at = SERVER.indexOf('function buildCellGrid(');
  expect(SERVER.slice(at, at + 600)).toContain('first-wins');
});
