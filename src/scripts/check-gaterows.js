#!/usr/bin/env node
// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02jl — every `check:walk` gate has a row in docs/design/index.md, and no gate row
// restates a count its script prints.
//
// The index is the file every session reads first, and its gate rows had drifted from
// the gates: ten gates had no row at all (gate #1 among them), and four of sixteen quoted
// selftest counts no longer matched what the selftest printed. A count copied into prose
// is only true on the day it was copied; the script prints it on every run. So a row
// names the script and the command, and this gate holds both halves:
//
//   rows    — each gate in run-gates.js's GATES has a row whose first cell is
//             `src/scripts/<one of the scripts its npm command runs>`
//   counts  — no `src/scripts/` row says "N checks|plants|cases" or "selftest N"
//
// Run: node scripts/check-gaterows.js [--selftest]
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const COUNT = /\b\d+\*{0,2}\s+(?:checks|plants|cases)\b|[Ss]elftest\*{0,2}\s+\*{0,2}\d+\b/g;

function gates(runGatesSrc) {
  const a = runGatesSrc.indexOf('const GATES = [');
  if (a < 0) return null;
  return [...runGatesSrc.slice(a, runGatesSrc.indexOf('];', a)).matchAll(/'(check:[\w-]+)'/g)].map(m => m[1]);
}

function scriptsOf(cmd) {
  return [...new Set([...String(cmd || '').matchAll(/scripts\/([\w.-]+\.(?:js|mjs|sh))/g)].map(m => m[1]))];
}

function audit({ runGatesSrc, pkgScripts, indexText }) {
  const findings = [];
  const list = gates(runGatesSrc);
  if (!list || !list.length) return ['[rows] GATES could not be read out of run-gates.js — this gate cannot check what it cannot see'];
  const rows = indexText.split('\n').map((l, i) => ({ l, n: i + 1 })).filter(r => r.l.startsWith('| `src/scripts/'));
  list.forEach((g, i) => {
    const scripts = scriptsOf(pkgScripts[g]);
    if (!scripts.length) { findings.push(`[rows] gate #${i + 1} ${g} runs no src/scripts file — its npm command is "${pkgScripts[g] || '(missing)'}"`); return; }
    if (!rows.some(r => scripts.some(s => r.l.startsWith('| `src/scripts/' + s + '`'))))
      findings.push(`[rows] gate #${i + 1} ${g} has no row in docs/design/index.md — add \`| \`src/scripts/${scripts[0]}\` | …\``);
  });
  for (const r of rows) for (const m of r.l.matchAll(COUNT))
    findings.push(`[counts] index.md:${r.n} ${r.l.slice(2, r.l.indexOf('`', 3) + 1)} quotes "${m[0]}" — name the command instead; the script prints the count on every run`);
  return findings;
}

function world() {
  return {
    runGatesSrc: fs.readFileSync(path.join(ROOT, 'src', 'scripts', 'run-gates.js'), 'utf8'),
    pkgScripts: JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'package.json'), 'utf8')).scripts,
    indexText: fs.readFileSync(path.join(ROOT, 'docs', 'design', 'index.md'), 'utf8'),
  };
}

if (process.argv.includes('--selftest')) {
  let pass = 0, fail = 0;
  const ok = (c, m) => { if (c) pass++; else { fail++; console.log('  ✗ FAIL:', m); } };
  const w = {
    runGatesSrc: "const GATES = [\n  'check:a', 'check:b',\n];",
    pkgScripts: { 'check:a': 'node scripts/a.js --selftest && node scripts/a.js', 'check:b': 'node scripts/b.js' },
    indexText: '| `src/scripts/a.js` | gate #1 — `node src/scripts/a.js --selftest` | ✅ |\n| `src/scripts/b.js` | gate #2 | ✅ |',
  };
  ok(audit(w).length === 0, 'a table with a row per gate and no counts is clean');
  ok(audit({ ...w, indexText: w.indexText.split('\n')[0] }).some(f => f.startsWith('[rows] gate #2 check:b')), 'a gate with no row is named');
  ok(audit({ ...w, indexText: w.indexText.replace('--selftest`', '--selftest` (9 checks)') }).some(f => f.includes('"9 checks"')), 'a quoted "(9 checks)" is caught');
  ok(audit({ ...w, indexText: w.indexText.replace('gate #2', 'gate #2 — selftest **19** plants') }).length === 1, '"selftest **19** plants" is one count, caught once');
  ok(audit({ ...w, indexText: w.indexText.replace('gate #2', 'Selftest 14 checks.') }).some(f => f.startsWith('[counts]')), '"Selftest 14 checks" is caught');
  ok(audit({ ...w, indexText: w.indexText.replace('gate #2', 'gate #2 (§DX-02jl), the 22 migrated quests') }).length === 0, 'a § tag and a data count are not selftest counts');
  ok(audit({ ...w, runGatesSrc: 'nothing here' })[0].includes('could not be read'), 'an unreadable GATES list fails rather than passing empty');
  ok(audit({ ...w, pkgScripts: { ...w.pkgScripts, 'check:b': 'eslint .' } }).some(f => f.includes('runs no src/scripts file')), 'a gate that runs no script is named');
  if (fail) { console.log(`\n✗ check-gaterows selftest: ${fail} FAILED, ${pass} passed`); process.exit(1); }
  console.log(`✓ check-gaterows selftest: all ${pass} checks pass`);
  return;
}

const w = world();
const findings = audit(w);
if (findings.length) {
  console.error(`✗ check:gaterows — ${findings.length} finding(s) in docs/design/index.md's gate rows:\n`);
  findings.forEach(f => console.error('  ' + f));
  process.exit(1);
}
console.log(`✓ check:gaterows — all ${gates(w.runGatesSrc).length} check:walk gates have an index row, and no gate row restates a count its script prints`);
