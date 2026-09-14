#!/usr/bin/env node
// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-01k — line count is not a proxy for size in `docs/backlog/`, so every tool bounded
// in lines is unbounded in fact: `head`, `tail`, `sed -n 'A,Bp'`, an editor page-down.
// One glance bullet reached 234,636 bytes — an estimated 59,000 tokens on a single line,
// more than a session's whole core read set.
//
// Two limits, because two kinds of line exist. A prose line — bullet, blockquote,
// paragraph — can always carry a soft break: Markdown renders a newline inside a
// paragraph as a space, so wrapping one is free and it is held to MAX_PROSE. A Markdown
// table row cannot: a newline ends the row and the table with it. Table rows are held to
// MAX_TABLE_ROW instead, which is a ceiling against growth, not a licence.
//
// Lines inside fenced code blocks are exempt — a break there changes the code.
// Asserts only, never rewrites (§DX-02fx).
// Run: node scripts/check-linewidth.js [--selftest]
'use strict';
const fs = require('fs');
const path = require('path');
const DIR = path.join(__dirname, '..', '..', 'docs', 'backlog');

const MAX_PROSE = 4000;
const MAX_TABLE_ROW = 20000;

function scan(text, file) {
  const findings = [];
  let fence = false;
  text.split('\n').forEach((line, i) => {
    if (/^\s*```/.test(line)) { fence = !fence; return; }
    if (fence) return;
    const bytes = Buffer.byteLength(line);
    const isRow = line.startsWith('|');
    const limit = isRow ? MAX_TABLE_ROW : MAX_PROSE;
    if (bytes <= limit) return;
    findings.push(`${file}:${i + 1} is ${bytes.toLocaleString()} bytes` +
      (isRow ? ` — a table row over the ${MAX_TABLE_ROW.toLocaleString()}-byte ceiling; split the table, the row cannot be wrapped`
             : ` — prose over the ${MAX_PROSE.toLocaleString()}-byte limit; wrap it at a space outside any \`code span\``));
  });
  return findings;
}

if (process.argv.includes('--selftest')) {
  let pass = 0, fail = 0;
  const ok = (c, m) => { if (c) pass++; else { fail++; console.log('  ✗ FAIL:', m); } };
  const prose = n => 'x'.repeat(n);
  ok(scan(prose(MAX_PROSE), 'f').length === 0, 'a prose line exactly at the limit passes');
  ok(scan(prose(MAX_PROSE + 1), 'f').length === 1, 'a prose line one byte over is caught');
  ok(scan(prose(MAX_PROSE + 1), 'f')[0].startsWith('f:1 is '), 'a finding names the file and the 1-based line');
  ok(scan('| ' + prose(MAX_PROSE), 'f').length === 0, 'a table row is NOT held to the prose limit');
  ok(scan('| ' + prose(MAX_TABLE_ROW), 'f').length === 1, 'a table row over its own ceiling is caught');
  ok(scan('| ' + prose(MAX_TABLE_ROW), 'f')[0].includes('cannot be wrapped'),
    'a table-row finding says why it is not simply wrapped');
  ok(scan(['```', prose(MAX_PROSE + 500), '```'].join('\n'), 'f').length === 0,
    'a long line inside a fence is exempt — a break there changes the code');
  ok(scan(['```', prose(10), '```', prose(MAX_PROSE + 1)].join('\n'), 'f').length === 1,
    'the fence closes, so a long line after it is still caught');
  ok(scan(['  ```', prose(MAX_PROSE + 1), '  ```'].join('\n'), 'f').length === 0,
    'an indented fence opens a fence too');
  ok(scan(prose(1000) + '€', 'f').length === 0, 'the limit is bytes, and a 1,003-byte line passes');
  ok(scan('é'.repeat(MAX_PROSE), 'f').length === 1, 'a line under the limit in CHARACTERS but over it in BYTES is caught');
  if (fail) { console.log(`\n✗ check-linewidth selftest: ${fail} FAILED, ${pass} passed`); process.exit(1); }
  console.log(`✓ check-linewidth selftest: all ${pass} checks pass`);
  return;
}

const files = fs.readdirSync(DIR).filter(f => f.endsWith('.md')).sort();
const findings = files.flatMap(f => scan(fs.readFileSync(path.join(DIR, f), 'utf8'), 'docs/backlog/' + f));
if (findings.length) {
  findings.forEach(f => console.log('  ✗ ' + f));
  console.log(`\n✗ check-linewidth: ${findings.length} finding(s)`);
  console.log('  A line-bounded read of this corpus must be a bounded read. Wrap the line —');
  console.log('  a newline inside a Markdown paragraph renders as a space, so nothing is lost.');
  process.exit(1);
}
let max = 0, maxAt = '';
for (const f of files) {
  fs.readFileSync(path.join(DIR, f), 'utf8').split('\n').forEach((l, i) => {
    const b = Buffer.byteLength(l);
    if (b > max) { max = b; maxAt = `docs/backlog/${f}:${i + 1}`; }
  });
}
console.log(`✓ §DX-01k line width: ${files.length} backlog files under ${MAX_PROSE.toLocaleString()} B prose / ${MAX_TABLE_ROW.toLocaleString()} B table row · longest ${max.toLocaleString()} B at ${maxAt}`);
