#!/usr/bin/env node
// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02lq — every live NODE_MAP code must be named in some maintained doc, unless it is
// listed in `undocumented-nodes.txt`.
//
// `docs/maps/node-index.md` is generated from NODE_MAP and names every node, so it proves
// nothing and is not read. Neither are the backlog and archive records (`docs/backlog/`,
// `docs/archive/`): a node a backlog row once mentioned has still never been described.
// Every other tracked `*.md` counts as a home. A code is found when it appears as a whole
// token (no letter, digit or underscore either side), case-sensitive.
//
// The list is a ratchet. It held the 123 nodes with no home when the gate opened, and it
// only shrinks: a listed code that is now documented, or that NODE_MAP no longer has, is a
// finding too. A new node needs a line in a doc, not a line in the list.
// Run: node scripts/check-node-homes.js [--selftest]
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..', '..');
const LIST = path.join(__dirname, 'undocumented-nodes.txt');

const isHome = (rel) => rel !== 'docs/maps/node-index.md'
  && !rel.startsWith('docs/backlog/') && !rel.startsWith('docs/archive/');

function tokens(texts) {
  const seen = new Set();
  for (const text of texts) for (const m of text.matchAll(/[A-Za-z0-9_]+/g)) seen.add(m[0]);
  return seen;
}

function scan({ codes, files, listed }) {
  const findings = [];
  const homes = files.filter(([rel]) => isHome(rel));
  if (homes.length === 0) return { findings: ['no maintained doc was read — the scan read nothing'], absent: 0 };
  const seen = tokens(homes.map(([, text]) => text));
  const live = new Set(codes);
  let absent = 0;
  for (const c of [...codes].sort()) {
    if (seen.has(c)) {
      if (listed.has(c)) findings.push(`[listed, documented] ${c} is in undocumented-nodes.txt and a doc now names it — delete the line`);
      continue;
    }
    absent++;
    if (!listed.has(c)) findings.push(`[no home] ${c} (${codes.label(c)}) is named in no maintained doc — describe it where its region or story lives`);
  }
  for (const c of [...listed].sort()) {
    if (!live.has(c)) findings.push(`[listed, gone] ${c} is in undocumented-nodes.txt and NODE_MAP has no such node — delete the line`);
  }
  return { findings, absent };
}

const readList = (text) => new Set(text.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#')));
const codeList = (map) => Object.assign(Object.keys(map), { label: (c) => (map[c] && map[c].label) || '?' });

if (process.argv.includes('--selftest')) {
  let pass = 0, fail = 0;
  const ok = (cond, m) => { if (cond) pass++; else { fail++; console.log('  ✗ FAIL:', m); } };
  const codes = codeList({ LHR: { label: 'Leeds' }, BRT: { label: 'Bratsk' }, HAM: { label: 'Hamar' } });
  const run = (files, listed = []) => scan({ codes, files, listed: new Set(listed) });
  const doc = (text) => [['docs/world/world.md', text]];
  ok(run(doc('LHR, BRT and HAM')).findings.length === 0, 'three named codes are clean');
  ok(run(doc('LHR and BRT')).findings.some((f) => f.startsWith('[no home] HAM (Hamar)')), 'an absent code is named with its label');
  ok(run(doc('LHR and BRT'), ['HAM']).findings.length === 0, 'a listed absent code is allowed');
  ok(run(doc('LHR BRT HAM'), ['HAM']).findings.some((f) => f.startsWith('[listed, documented] HAM')), 'a listed code a doc now names is a finding, so the list only shrinks');
  ok(run(doc('LHR BRT HAM'), ['ZZZ']).findings.some((f) => f.startsWith('[listed, gone] ZZZ')), 'a listed code NODE_MAP lost is a finding');
  ok(run(doc('LHR BRT HAMBURG HAM_X xHAM ham')).findings.some((f) => f.startsWith('[no home] HAM')), 'a longer word, an identifier or lower case is not the code');
  ok(run(doc('LHR BRT `HAM`/x (HAM)')).findings.length === 0, 'backticks, slashes and parentheses bound a token');
  ok(run([['docs/maps/node-index.md', 'LHR BRT HAM'], ['docs/backlog/BACKLOG-6-verification-docs.md', 'HAM'], ['docs/archive/x.md', 'HAM'], ['README.md', 'LHR BRT']])
    .findings.some((f) => f.startsWith('[no home] HAM')), 'the generated index and the backlog/archive records are not homes');
  ok(run([['docs/maps/node-index.md', 'LHR BRT HAM']]).findings[0].includes('the scan read nothing'), 'a load with no maintained doc is a finding, not a pass');
  ok(readList('# c\n\nHAM\n  BRT  \n').size === 2, 'the list skips comments and blanks and trims');
  if (fail) { console.log(`\n✗ check-node-homes selftest: ${fail} FAILED, ${pass} passed`); process.exit(1); }
  console.log(`✓ check-node-homes selftest: all ${pass} checks pass`);
  return;
}

const WBAPI = require(path.join(ROOT, 'src', 'js', 'wbapi-core.js'));
WBAPI.load(path.join(ROOT, 'play.html'));
const codes = codeList(WBAPI.nodeMap);
const files = execFileSync('git', ['ls-files', '-z', '*.md'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 << 20 })
  .split('\0').filter(Boolean).map((rel) => [rel, fs.readFileSync(path.join(ROOT, rel), 'utf8')]);
const { findings, absent } = scan({ codes, files, listed: readList(fs.readFileSync(LIST, 'utf8')) });
if (findings.length) {
  findings.forEach((f) => console.log('  ✗ ' + f));
  console.log(`\n✗ check-node-homes: ${findings.length} finding(s)`);
  process.exit(1);
}
console.log(`✓ §DX-02lq node homes: ${codes.length - absent} of ${codes.length} live nodes are named in a maintained doc, `
  + `and the other ${absent} are the ones undocumented-nodes.txt lists`);
