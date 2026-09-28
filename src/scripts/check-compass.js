#!/usr/bin/env node
// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02ky-FU3 — no WBAPI route reads a node's N/S/E/W link fields. §CELL-01 stripped them
// from every node, so a read is always `undefined`: a check that cannot fire, a report that
// is always empty, or a solver that treats the whole map as orphans. Movement is by cell
// (`CELL_GRID`, `cellNeighbours`, `landFloodCells`).
//
// A ratchet, not a ban. The reads that remain belong to open rows or are not link reads at
// all, and each is budgeted by the section marker (`// ── … ─`) above it. A hit under an
// unbudgeted marker fails, and so does a budget that no longer matches its count, so a
// fixed owner row lowers its line here in the same commit.
// Run: node scripts/check-compass.js [--selftest]
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');

const FILES = ['src/js/wbapi-server.js', 'src/api/wb.js'];

const BUDGET = {
  'src/js/wbapi-server.js': {
    'Load': [2, '`cellNeighbours` keys its cell answer N/S/E/W; `linkFieldCount` measures the absence (§DX-02bq)'],
    'GET /api/graph/connect': [1, '`DIR_DELTA[dir]` is cell arithmetic'],
    'Classify all J#### junctions': [4, 'nuke-junctions, owned by §DX-02bk'],
    'Phase 4: dangling direction cleanup': [1, 'nuke-junctions, owned by §DX-02bk'],
    'POST /api/graph/cluster-bridge': [2, 'cluster-bridge, the track-records finding beside §DX-02bk'],
    'inline cluster bridge': [3, 'cluster-bridge, the track-records finding beside §DX-02bk'],
    'PUT': [2, 'the auto-junction rule on PUT, owned by §DX-02bn'],
  },
  'src/api/wb.js': {
    "validate: one node's cell — arrivable or hidden, and its occupied neighbours":
      [1, 'prints the cell answer `GET /api/graph/validate` returns'],
  },
};

const READ = /\.(?:N|S|E|W|NE|NW|SE|SW)\b|\[\s*(?:d|dir)\s*\]/;
const READ_KEY = /\[\s*'(?:N|S|E|W|NE|NW|SE|SW)'\s*\]/;
const MARKER = /\/\/ ──+ (.+?) ─/;

function strip(line) {
  return line
    .replace(/'(?:\\.|[^'\\])*'/g, "''")
    .replace(/"(?:\\.|[^"\\])*"/g, '""')
    .replace(/\/\/.*$/, '');
}

function census(text) {
  const hits = {};
  let marker = '(top)';
  text.split('\n').forEach((line, i) => {
    const m = line.match(MARKER);
    if (m) marker = m[1].trim();
    if (!READ.test(strip(line)) && !READ_KEY.test(line.replace(/\/\/.*$/, ''))) return;
    (hits[marker] = hits[marker] || []).push(i + 1);
  });
  return hits;
}

function judge(hits, budget, file) {
  const out = [];
  for (const [marker, lines] of Object.entries(hits)) {
    const b = budget[marker];
    if (!b) out.push(`${file}:${lines.join(',')} — ${lines.length} N/S/E/W read(s) under "${marker}", which has no budget. ` +
      'No node carries a link field (§CELL-01); read CELL_GRID, cellNeighbours or landFloodCells instead.');
    else if (lines.length !== b[0]) out.push(`${file}:${lines.join(',')} — "${marker}" has ${lines.length} read(s) against a budget of ${b[0]} (${b[1]}). ` +
      (lines.length > b[0] ? 'A new read: move it to cells.' : 'One was fixed: lower the budget in scripts/check-compass.js.'));
  }
  for (const [marker, [n, why]] of Object.entries(budget))
    if (n > 0 && !hits[marker]) out.push(`${file} — "${marker}" is budgeted ${n} (${why}) and has none. Drop its line from scripts/check-compass.js.`);
  return out;
}

if (process.argv.includes('--selftest')) {
  let pass = 0, fail = 0;
  const ok = (c, m) => { if (c) pass++; else { fail++; console.log('  ✗ FAIL:', m); } };
  const src = (...l) => l.join('\n');
  const B = { 'Owned': [1, 'test'] };
  ok(judge(census(src('// ── Owned ──', 'x = node[d];')), B, 'f').length === 0, 'a read inside its budget passes');
  ok(judge(census(src('// ── Owned ──', 'x = node[d];', '// ── Fresh ──', 'if (node.N) go();')), B, 'f').length === 1,
    'a planted node.N under an unbudgeted marker fails');
  ok(judge(census(src('// ── Owned ──', 'x = node[d];', 'y = n[dir];')), B, 'f')[0].includes('A new read'),
    'a second read in a budgeted section fails as new');
  ok(judge(census(src('// ── Owned ──', 'x = 1;')), B, 'f')[0].includes('Drop its line'),
    'a budget with no reads left fails, so the ratchet tightens');
  ok(judge(census(src('// ── Owned ──', 'x = node[d];', '// node.N in a comment')), B, 'f').length === 0, 'a comment is not a read');
  ok(judge(census(src('// ── Owned ──', 'x = node[d];', "msg('it read node.N/S/E/W');")), B, 'f').length === 0, 'a quoted string is not a read');
  ok(judge(census(src('// ── Owned ──', 'x = node[d];', 'const r = nm[c]?.[\'W\'];')), B, 'f').length === 1, "a quoted-key read ['W'] is caught");
  ok(Object.keys(census('if (x.NEW) y();')).length === 0, 'a longer identifier (.NEW) is not a read');
  if (fail) { console.log(`\n✗ check-compass selftest: ${fail} FAILED, ${pass} passed`); process.exit(1); }
  console.log(`✓ check-compass selftest: all ${pass} checks pass`);
  return;
}

const findings = FILES.flatMap(f =>
  judge(census(fs.readFileSync(path.join(ROOT, f), 'utf8')), BUDGET[f] || {}, f));
if (findings.length) {
  findings.forEach(f => console.log('  ✗ ' + f));
  console.log(`\n✗ check-compass: ${findings.length} finding(s)`);
  process.exit(1);
}
const total = Object.values(BUDGET).flatMap(b => Object.values(b)).reduce((n, [k]) => n + k, 0);
console.log(`✓ §DX-02ky-FU3 compass reads: ${FILES.length} files, ${total} budgeted reads, none new`);
