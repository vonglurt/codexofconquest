#!/usr/bin/env node
// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02gs — the routing table in `docs/backlog/BACKLOG.md` carries an "Open rows" column
// and the §RESUME header carries an entry count, both maintained by hand inside the file
// they count. Six drifts were recorded before this gate existed, in BOTH directions — a
// row archived without decrementing and a row filed without incrementing are each silent,
// and they do not cancel. Derived here instead of maintained.
//
// A count is only a claim about the RANGE it was taken over: open rows are `^### §`
// headings BETWEEN a phase file's `## §BACKLOG — Open Items` marker and its first
// `## Track records` / `## §RESUME` marker. This row's own first census was wrong because
// it counted the whole file, so the range is the load-bearing part of the rule.
//
// Asserts only, never rewrites — a checker that repairs what it audits makes its own
// verdict depend on run order (§DX-02fx).
// Run: node scripts/check-backlogcounts.js [--selftest]
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const DIR = path.join(ROOT, 'docs', 'backlog');
const INDEX = path.join(DIR, 'BACKLOG.md');

const OPEN_START = /^## §BACKLOG — Open Items/;
const OPEN_END = /^## (Track records|§RESUME)/;

function openRows(text) {
  let inRange = false, n = 0;
  for (const line of text.split('\n')) {
    if (OPEN_START.test(line)) { inRange = true; continue; }
    if (inRange && OPEN_END.test(line)) break;
    if (inRange && /^### §/.test(line)) n++;
  }
  return n;
}

// | **1** | [Playable Truth](BACKLOG-1-playable-truth.md) | 6 | 12 | … |
const TABLE_ROW = /^\|\s*\*\*(\d)\*\*\s*\|\s*\[[^\]]*\]\((BACKLOG-\d-[\w-]+\.md)\)\s*\|\s*(\d+)\s*\|/;
function tableCells(index) {
  const out = [];
  for (const line of index.split('\n')) {
    const m = TABLE_ROW.exec(line);
    if (m) out.push({ phase: Number(m[1]), file: m[2], claimed: Number(m[3]) });
  }
  return out;
}

const RESUME_HEADER = /^> \*\*(\d+) entries, newest first\*\*/m;
const RESUME_ROW = /^\| \d+ \| 2026-/;
function resumeCounts(index) {
  const m = RESUME_HEADER.exec(index);
  const actual = index.split('\n').filter(l => RESUME_ROW.test(l)).length;
  return { claimed: m ? Number(m[1]) : null, actual };
}

function scan(index, read, expectPhases = 6) {
  const findings = [];
  const cells = tableCells(index);
  if (cells.length !== expectPhases) {
    findings.push(`[table] the routing table matched ${cells.length} phase row(s), expected ${expectPhases} — the row pattern has drifted from the table`);
  }
  for (const c of cells) {
    const text = read(c.file);
    if (text === null) { findings.push(`[table] phase ${c.phase} names ${c.file}, which does not exist`); continue; }
    const actual = openRows(text);
    if (actual !== c.claimed) {
      findings.push(`[table] phase ${c.phase} — "Open rows" says ${c.claimed}, ${c.file} has ${actual} `
        + `(${actual > c.claimed ? 'reads LOW by ' + (actual - c.claimed) : 'reads HIGH by ' + (c.claimed - actual)})`);
    }
  }
  const r = resumeCounts(index);
  if (r.claimed === null) findings.push('[resume] the §RESUME header no longer states an entry count in the expected form');
  else if (r.claimed !== r.actual) findings.push(`[resume] the header says ${r.claimed} entries, the table has ${r.actual}`);
  return findings;
}

if (process.argv.includes('--selftest')) {
  let pass = 0, fail = 0;
  const ok = (c, m) => { if (c) pass++; else { fail++; console.log('  ✗ FAIL:', m); } };
  const phaseFile = rows => ['# x', '## §BACKLOG — Open Items (Phase 1)', ...rows, '## Track records', '### §NOT_COUNTED — after the range'].join('\n');
  ok(openRows(phaseFile(['### §A — a', '### §B — b'])) === 2, 'counts §-headings inside the open-items range');
  ok(openRows(phaseFile([])) === 0, 'an empty open-items section counts 0');
  ok(openRows(['### §BEFORE — outside', '## §BACKLOG — Open Items', '### §A'].join('\n')) === 1,
    'a §-heading BEFORE the range is not counted — the range is the rule');
  ok(openRows(['## §BACKLOG — Open Items', '### §A', '## §RESUME', '### §B'].join('\n')) === 1,
    '§RESUME closes the range as well as Track records');

  const idx = n => ['| Phase | Backlog | Open rows | Closed | Scope |', '|---|---|---:|---:|---|',
    `| **1** | [P](BACKLOG-1-a.md) | ${n} | 12 | s |`, '',
    '> **2 entries, newest first** (`grep`)', '',
    '| 1 | 2026-08-25 | x | y | z |', '| 2 | 2026-08-24 | x | y | z |'].join('\n');
  const read = () => phaseFile(['### §A', '### §B']);
  ok(scan(idx(2), read, 1).length === 0, 'a table and header that match the source produce no findings');
  ok(scan(idx(1), read, 1).some(f => f.includes('reads LOW by 1')), 'a cell one too low is caught and named LOW');
  ok(scan(idx(5), read, 1).some(f => f.includes('reads HIGH by 3')), 'a cell too high is caught and named HIGH');
  ok(scan(idx(2).replace('**2 entries', '**9 entries'), read, 1).some(f => f.startsWith('[resume]')),
    'a §RESUME header count that disagrees with its own table is caught');
  ok(scan(idx(2), () => null, 1).some(f => f.includes('does not exist')), 'a table row naming a missing file is caught');
  ok(scan(idx(2), read).some(f => f.includes('expected 6')),
    'a table that has lost a phase row is caught, not silently counted short');
  if (fail) { console.log(`\n✗ check-backlogcounts selftest: ${fail} FAILED, ${pass} passed`); process.exit(1); }
  console.log(`✓ check-backlogcounts selftest: all ${pass} checks pass`);
  process.exit(0);
}

const read = f => { const p = path.join(DIR, f); return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null; };
const findings = scan(fs.readFileSync(INDEX, 'utf8'), read);
if (findings.length) {
  findings.forEach(f => console.log('  ✗ ' + f));
  console.log(`\n✗ check-backlogcounts: ${findings.length} finding(s)`);
  console.log('  These counts are DERIVED, not maintained — correct the number in BACKLOG.md to');
  console.log('  what the phase file actually holds. Six hand corrections drifted again (§DX-02gs).');
  process.exit(1);
}
console.log('✓ §DX-02gs backlog counts: all 6 "Open rows" cells and the §RESUME header match their source');
