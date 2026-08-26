#!/usr/bin/env node
// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02gu — the clean-tree invariant: a full `npm test` leaves the working tree naming
// only the increment's own edits. Three rows restored it by hand (§DX-02gm's 2,883-hint
// doc sweep, §DX-02gn's screenshot on a tracked path) and each was found by accident.
//
// It cannot be guarded from inside the suite: a Playwright test cannot snapshot the tree
// around the run that contains it. So it lives one level up, as npm's pretest/posttest —
// `--snapshot` before, `--check` after, WARN only. A warning at the moment of the run is
// what would have caught both rows on the day they landed.
//
// Known limit, stated rather than hidden: npm skips `posttest` when the suite FAILS, so a
// red run is not checked. That is the cheap half of the fix; CI is the other half and is
// blocked until a workflow actually runs the Playwright suite (§DX-02ht: none does).
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..', '..');
const SNAP = path.join(ROOT, 'build', 'cleantree-before.txt');

// Porcelain already omits gitignored paths, so `build/` writes never show up here.
function status() {
  return execFileSync('git', ['status', '--porcelain'], { cwd: ROOT, encoding: 'utf8' })
    .split('\n').filter(Boolean);
}

// Lines the run ADDED. A path already dirty going in is the increment's own work.
function added(before, after) {
  const seen = new Set(before.map(l => l.slice(3)));
  return after.filter(l => !seen.has(l.slice(3)));
}

if (process.argv.includes('--selftest')) {
  let pass = 0, fail = 0;
  const ok = (c, m) => { if (c) pass++; else { fail++; console.log('  ✗ FAIL:', m); } };
  ok(added([' M a.js'], [' M a.js']).length === 0, 'an unchanged tree adds nothing');
  ok(added([' M a.js'], [' M a.js', '?? shot.png'])[0] === '?? shot.png',
    'a file the run created is reported');
  ok(added([' M a.js'], ['MM a.js']).length === 0,
    'a path already dirty going in is the increment, not the run — matched on PATH, not status code');
  ok(added([], [' M docs/x.md', ' M docs/y.md']).length === 2, 'a doc sweep is reported in full');
  ok(added([' M a.js', '?? b'], []).length === 0, 'a path that went away is not an addition');
  if (fail) { console.log(`\n✗ cleantree selftest: ${fail} FAILED, ${pass} passed`); process.exit(1); }
  console.log(`✓ cleantree selftest: all ${pass} checks pass`);
  process.exit(0);
}

if (process.argv.includes('--snapshot')) {
  fs.mkdirSync(path.dirname(SNAP), { recursive: true });
  fs.writeFileSync(SNAP, status().join('\n'));
  process.exit(0);
}

if (!fs.existsSync(SNAP)) process.exit(0);
const dirtied = added(fs.readFileSync(SNAP, 'utf8').split('\n').filter(Boolean), status());
fs.rmSync(SNAP, { force: true });
if (!dirtied.length) process.exit(0);

console.warn(`\n⚠ §DX-02gu — the suite dirtied ${dirtied.length} path(s) that were clean before it ran:\n`);
for (const l of dirtied.slice(0, 20)) console.warn('    ' + l);
if (dirtied.length > 20) console.warn(`    … and ${dirtied.length - 20} more`);
console.warn('\n  A test run must leave the tree naming only the increment\'s own edits. Find the');
console.warn('  test that writes there and give it a path under `build/`, which is gitignored.');
console.warn('  This is a WARNING — it does not fail the run.\n');
