#!/usr/bin/env node
// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02jl — every `check:walk` gate has a row in docs/design/index.md, and no gate row
// restates a count its script prints. §DX-02jb — the chain position a row cites is real.
//
// The index is the file every session reads first, and its gate rows had drifted from
// the gates: ten gates had no row at all (gate #1 among them), and four of sixteen quoted
// selftest counts no longer matched what the selftest printed. A count copied into prose
// is only true on the day it was copied; the script prints it on every run. So a row
// names the script and the command, and this gate holds three things:
//
//   rows    — each gate in run-gates.js's GATES has a row whose first cell is
//             `src/scripts/<one of the scripts its npm command runs>`
//   counts  — no `src/scripts/` row says "N checks|plants|cases" or "selftest N"
//   numbers — a row's `check:walk` gate #N is the GATES position of a gate that runs its
//             script; an insert into the chain renumbers every row after it
//
// Run: node scripts/check-gaterows.js [--selftest]
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const COUNT = /\b\d+\*{0,2}\s+(?:checks|plants|cases)\b|[Ss]elftest\*{0,2}\s+\*{0,2}\d+\b/g;
const ROW = /^\| `src\/scripts\/([^`]+)`/;
const NUMBER = /`check:walk` gate #(\d+)/;

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
  const rows = indexText.split('\n').map((l, i) => ({ l, n: i + 1 })).filter(r => ROW.test(r.l));
  list.forEach((g, i) => {
    const scripts = scriptsOf(pkgScripts[g]);
    if (!scripts.length) { findings.push(`[rows] gate #${i + 1} ${g} runs no src/scripts file — its npm command is "${pkgScripts[g] || '(missing)'}"`); return; }
    if (!rows.some(r => scripts.some(s => r.l.startsWith('| `src/scripts/' + s + '`'))))
      findings.push(`[rows] gate #${i + 1} ${g} has no row in docs/design/index.md — add \`| \`src/scripts/${scripts[0]}\` | …\``);
  });
  for (const r of rows) for (const m of r.l.matchAll(COUNT))
    findings.push(`[counts] index.md:${r.n} ${r.l.slice(2, r.l.indexOf('`', 3) + 1)} quotes "${m[0]}" — name the command instead; the script prints the count on every run`);
  for (const r of rows) {
    const m = r.l.match(NUMBER);
    if (!m) continue;
    const s = r.l.match(ROW)[1];
    const at = list.map((g, i) => scriptsOf(pkgScripts[g]).includes(s) ? i + 1 : 0).filter(Boolean);
    if (!at.length) findings.push(`[numbers] index.md:${r.n} \`${s}\` says it is check:walk gate #${m[1]} — no gate in GATES runs it`);
    else if (!at.includes(+m[1])) findings.push(`[numbers] index.md:${r.n} \`${s}\` says gate #${m[1]} — ${list[at[0] - 1]} runs it at #${at.join('/#')}`);
  }
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
    indexText: '| `src/scripts/a.js` | **`check:walk` gate #1** — `node src/scripts/a.js --selftest` | ✅ |\n| `src/scripts/b.js` | **`check:walk` gate #2** | ✅ |',
  };
  ok(audit(w).length === 0, 'a table with a row per gate, true numbers and no counts is clean');
  ok(audit({ ...w, indexText: w.indexText.split('\n')[0] }).some(f => f.startsWith('[rows] gate #2 check:b')), 'a gate with no row is named');
  ok(audit({ ...w, indexText: w.indexText.replace('--selftest`', '--selftest` (9 checks)') }).some(f => f.includes('"9 checks"')), 'a quoted "(9 checks)" is caught');
  ok(audit({ ...w, indexText: w.indexText.replace('gate #2**', 'gate #2** — selftest **19** plants') }).length === 1, '"selftest **19** plants" is one count, caught once');
  ok(audit({ ...w, indexText: w.indexText.replace('gate #2**', 'gate #2**. Selftest 14 checks.') }).some(f => f.startsWith('[counts]')), '"Selftest 14 checks" is caught');
  ok(audit({ ...w, indexText: w.indexText.replace('gate #2**', 'gate #2 (§DX-02jl)**, the 22 migrated quests') }).length === 0, 'a § tag and a data count are not selftest counts');
  ok(audit({ ...w, runGatesSrc: 'nothing here' })[0].includes('could not be read'), 'an unreadable GATES list fails rather than passing empty');
  ok(audit({ ...w, pkgScripts: { ...w.pkgScripts, 'check:b': 'eslint .' } }).some(f => f.includes('runs no src/scripts file')), 'a gate that runs no script is named');
  const swapped = audit({ ...w, runGatesSrc: "const GATES = [\n  'check:b', 'check:a',\n];" }).filter(f => f.startsWith('[numbers]'));
  ok(swapped.length === 2 && swapped[0].includes('`a.js` says gate #1 — check:a runs it at #2'), 'a reordered GATES renumbers every row it moves, and each is named');
  ok(audit({ ...w, indexText: w.indexText.replace('gate #2**', 'gate #1**') }).some(f => f.startsWith('[numbers] index.md:2 `b.js` says gate #1 — check:b runs it at #2')), 'a row citing another gate\'s position is caught');
  ok(audit({ ...w, indexText: w.indexText + '\n| `src/scripts/c.js` | **`check:walk` gate #3** | ✅ |' }).some(f => f.includes('`c.js` says it is check:walk gate #3 — no gate in GATES runs it')), 'a row claiming a position no gate holds is caught');
  ok(audit({ ...w, indexText: w.indexText + '\n| `src/scripts/c.js` | NOT a gate — the mirror of gate #1 | ✅ |' }).length === 0, 'a non-gate row may mention a gate number in prose');
  ok(audit({ ...w, pkgScripts: { ...w.pkgScripts, 'check:b': 'node scripts/a.js --other' }, indexText: w.indexText.split('\n')[0] }).length === 0, 'a script two gates run is right at either position');
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
console.log(`✓ check:gaterows — all ${gates(w.runGatesSrc).length} check:walk gates have an index row, every cited gate #N is its GATES position, and no gate row restates a count its script prints`);
