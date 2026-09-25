#!/usr/bin/env node
// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02hz — the Doc Health Badge in `docs/design/index.md` carries two cells that are a
// command's output: *HTML line count* (`wc -l play.html`), *Lab reports on disk*
// (`ls docs/lab-reports/*.md | wc -l`) and *Lab reports in index* (distinct reports the
// Lab Report Index cites). Each is derived here and the cell held to it.
// Asserts only, never rewrites (§DX-02fx).
// Run: node scripts/check-badge.js [--selftest]
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const INDEX = path.join(ROOT, 'docs', 'design', 'index.md');

const DERIVED = {
  'HTML line count': (root) => (fs.readFileSync(path.join(root, 'play.html'), 'utf8').match(/\n/g) || []).length,
  'Lab reports on disk': (root) => fs.readdirSync(path.join(root, 'docs', 'lab-reports'))
    .filter((f) => f.endsWith('.md') && fs.statSync(path.join(root, 'docs', 'lab-reports', f)).isFile()).length,
  'Lab reports in index': (root) => {
    const md = fs.readFileSync(path.join(root, 'docs', 'design', 'index.md'), 'utf8');
    const sec = md.slice(md.search(/^## Lab Report Index\b/m)).split(/\n## /)[0];
    return new Set([...sec.matchAll(/docs\/lab-reports\/([A-Za-z0-9._-]+\.md)/g)].map((m) => m[1])).size;
  },
};

function badgeCells(text) {
  const cells = {};
  let inBadge = false;
  for (const line of text.split('\n')) {
    if (/^### Doc Health Badge\b/.test(line)) { inBadge = true; continue; }
    if (inBadge && /^#{1,3} /.test(line)) break;
    if (!inBadge) continue;
    const m = /^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|/.exec(line);
    if (m) cells[m[1]] = m[2];
  }
  return cells;
}

function scan(text, derive) {
  const cells = badgeCells(text);
  const findings = [];
  for (const [name, fn] of Object.entries(derive)) {
    if (!(name in cells)) { findings.push(`the badge has no "${name}" row`); continue; }
    const claimed = Number(cells[name].replace(/[,*]/g, ''));
    const actual = fn();
    if (!Number.isInteger(claimed)) findings.push(`"${name}" reads "${cells[name]}", not a number`);
    else if (claimed !== actual) {
      findings.push(`"${name}" says ${claimed.toLocaleString('en-US')}, the tree has ${actual.toLocaleString('en-US')} `
        + `(${actual > claimed ? 'reads LOW by ' + (actual - claimed) : 'reads HIGH by ' + (claimed - actual)})`);
    }
  }
  return findings;
}

if (process.argv.includes('--selftest')) {
  let pass = 0, fail = 0;
  const ok = (c, m) => { if (c) pass++; else { fail++; console.log('  ✗ FAIL:', m); } };
  const doc = (lines, reports) => ['# x', '### Doc Health Badge', '', '| Metric | Value | Status |', '|---|---|---|',
    `| HTML line count | ${lines} | ✅ note |`, `| Lab reports on disk | ${reports} | ✅ |`, '',
    '### Next', '| HTML line count | 1 | outside the badge |'].join('\n');
  const derive = { 'HTML line count': () => 39053, 'Lab reports on disk': () => 116 };
  ok(Number.isInteger(DERIVED['Lab reports in index'](ROOT)), 'the index count reads the real Lab Report Index');
  ok(scan(doc('39,053', '116'), derive).length === 0, 'cells that match the tree are clean, thousands separator and all');
  ok(scan(doc('39,006', '116'), derive).some((f) => f.includes('reads LOW by 47')), 'a line count behind the file is caught and named LOW');
  ok(scan(doc('39,053', '117'), derive).some((f) => f.includes('reads HIGH by 1')), 'a report count ahead of the disk is caught and named HIGH');
  ok(scan(doc('**39,053**', '116'), derive).length === 0, 'a bolded value is read as its number');
  ok(scan(doc('39,053', '116').replace('| Lab reports on disk', '| Lab reports'), derive).some((f) => f.includes('no "Lab reports on disk" row')),
    'a renamed row is named, not skipped');
  ok(scan(doc('about 39k', '116'), derive).some((f) => f.includes('not a number')), 'a value that is not a number is a finding');
  ok(badgeCells(doc('5', '6'))['HTML line count'] === '5', 'a same-named row after the badge section is not read');
  ok(DERIVED['HTML line count'](ROOT) > 0 && DERIVED['Lab reports on disk'](ROOT) > 0, 'both derivations read the real tree');
  if (fail) { console.log(`\n✗ check-badge selftest: ${fail} FAILED, ${pass} passed`); process.exit(1); }
  console.log(`✓ check-badge selftest: all ${pass} checks pass`);
  return;
}

const findings = scan(fs.readFileSync(INDEX, 'utf8'), Object.fromEntries(
  Object.entries(DERIVED).map(([k, fn]) => [k, () => fn(ROOT)])));
if (findings.length) {
  findings.forEach((f) => console.log('  ✗ ' + f));
  console.log(`\n✗ check-badge: ${findings.length} finding(s)`);
  console.log('  Correct the cell in docs/design/index.md\'s Doc Health Badge in the increment that moved it,');
  console.log('  and name that increment in the Status cell (§2.3a).');
  process.exit(1);
}
console.log(`✓ §DX-02hz Doc Health Badge: ${Object.keys(DERIVED).map((k) => `"${k}"`).join(' and ')} match the tree`);
