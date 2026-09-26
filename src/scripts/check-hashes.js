#!/usr/bin/env node
// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02lo — every backticked commit hash in a tracked `*.md` must name a commit reachable
// from a ref in this clone, unless it is listed in `historical-hashes.txt`.
//
// History was rewritten on 2026-08-23, during §RELEASE-01. The rewrite remapped hashes
// inside commit messages and left file contents alone, so every hash a doc stamped before
// that afternoon names a commit this repository no longer has. Those are listed, and the
// list only shrinks: a listed hash that no doc cites any more is a finding too. A new
// unresolvable hash is a doc pointing `git show` at nothing: a typo, an amended or rebased
// commit, or a stamp copied from another clone before it was pushed.
//
// A token is 7–10 lowercase hex characters holding at least one letter and one digit, alone
// between backticks. It resolves when exactly one commit in `git rev-list --all` starts
// with it, so an ambiguous prefix fails as surely as a missing one. A shallow clone cannot
// answer and is refused rather than passed; CI checks out with `fetch-depth: 0`.
// Run: node scripts/check-hashes.js [--selftest]
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..', '..');
const LIST = path.join(__dirname, 'historical-hashes.txt');

const TOKEN = /`([0-9a-f]{7,10})`/g;
const isHash = (t) => /[a-f]/.test(t) && /[0-9]/.test(t);

function tokens(files) {
  const where = new Map();
  for (const [rel, text] of files) {
    for (const m of text.matchAll(TOKEN)) {
      if (!isHash(m[1])) continue;
      if (!where.has(m[1])) where.set(m[1], new Set());
      where.get(m[1]).add(rel);
    }
  }
  return where;
}

function resolves(token, sorted) {
  let lo = 0, hi = sorted.length;
  while (lo < hi) { const mid = (lo + hi) >> 1; if (sorted[mid] < token) lo = mid + 1; else hi = mid; }
  return lo < sorted.length && sorted[lo].startsWith(token)
    && !(lo + 1 < sorted.length && sorted[lo + 1].startsWith(token));
}

function scan({ files, commits, historical }) {
  const findings = [];
  const where = tokens(files);
  if (where.size === 0) return { findings: ['no commit hash found in any tracked *.md — the scan read nothing'], where, dead: 0 };
  const sorted = [...commits].sort();
  let dead = 0;
  for (const [t, rels] of [...where].sort()) {
    if (resolves(t, sorted)) {
      if (historical.has(t)) findings.push(`[listed, resolves] \`${t}\` is in historical-hashes.txt and names a commit here — delete the line`);
      continue;
    }
    dead++;
    if (!historical.has(t)) findings.push(`[dead] \`${t}\` names no commit in this clone — cited in ${[...rels].sort().join(', ')}`);
  }
  for (const t of [...historical].sort()) {
    if (!where.has(t)) findings.push(`[listed, uncited] \`${t}\` is in historical-hashes.txt and no doc cites it — delete the line`);
  }
  return { findings, where, dead };
}

const readList = (text) => new Set(text.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#')));

if (process.argv.includes('--selftest')) {
  let pass = 0, fail = 0;
  const ok = (cond, m) => { if (cond) pass++; else { fail++; console.log('  ✗ FAIL:', m); } };
  const commits = ['a1b2c3d4e5f60718293a4b5c6d7e8f9012345678', 'a1b2c3d9999999999999999999999999999999ff', 'fcebbd3000000000000000000000000000000000'];
  const run = (text, hist = []) => scan({ files: [['doc.md', text]], commits, historical: new Set(hist) });
  ok(run('shipped `fcebbd3`').findings.length === 0, 'a hash naming one commit is clean');
  ok(run('shipped `3c86055`').findings.some((f) => f.startsWith('[dead] `3c86055`') && f.includes('doc.md')), 'an unknown hash is named with the file citing it');
  ok(run('shipped `3c86055`', ['3c86055']).findings.length === 0, 'a listed historical hash is allowed');
  ok(run('shipped `a1b2c3d`').findings.some((f) => f.startsWith('[dead] `a1b2c3d`')), 'an ambiguous prefix fails');
  ok(run('shipped `a1b2c3d4`').findings.length === 0, 'a longer prefix that is unique resolves');
  ok(run('`fcebbd3`', ['3c86055']).findings.some((f) => f.startsWith('[listed, uncited]')), 'a listed hash no doc cites is a finding, so the list only shrinks');
  ok(run('`fcebbd3`', ['fcebbd3']).findings.some((f) => f.startsWith('[listed, resolves]')), 'a listed hash that resolves is a finding');
  ok(run('`fcebbd3` `1234567` `abcdefa` `ABC1234` `a1b2c3d4e5f6` `#a1b2c3d`').findings.length === 0, 'all-digit, all-letter, uppercase, 12-character and colour tokens are not hashes');
  ok(run('fcebbd3 and 3c86055 in prose').findings[0].includes('the scan read nothing'), 'a load with no hashes is a finding, not a pass');
  ok(run('`3c86055` `3c86055`').dead === 1, 'a hash cited twice counts once');
  ok(readList('# c\n\n3c86055\n  c03cdc5  \n').size === 2, 'the list skips comments and blanks and trims');
  if (fail) { console.log(`\n✗ check-hashes selftest: ${fail} FAILED, ${pass} passed`); process.exit(1); }
  console.log(`✓ check-hashes selftest: all ${pass} checks pass`);
  return;
}

const git = (...a) => execFileSync('git', a, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 << 20 });
if (git('rev-parse', '--is-shallow-repository').trim() === 'true') {
  console.log('✗ check-hashes: this clone is shallow, so a dead hash and a hash beyond the depth look the same.');
  console.log('  Fetch the full history (git fetch --unshallow), or check out with fetch-depth: 0.');
  process.exit(1);
}
const files = git('ls-files', '-z', '*.md').split('\0').filter(Boolean)
  .map((rel) => [rel, fs.readFileSync(path.join(ROOT, rel), 'utf8')]);
const historical = readList(fs.readFileSync(LIST, 'utf8'));
const { findings, where, dead } = scan({ files, commits: git('rev-list', '--all').split('\n').filter(Boolean), historical });
if (findings.length) {
  findings.forEach((f) => console.log('  ✗ ' + f));
  console.log(`\n✗ check-hashes: ${findings.length} finding(s)`);
  console.log('  Cite a commit that is pushed, by the hash `git log` prints for it here.');
  process.exit(1);
}
console.log(`✓ §DX-02lo commit hashes: ${where.size - dead} of ${where.size} cited in tracked *.md resolve, `
  + `and the other ${dead} are the pre-rewrite hashes historical-hashes.txt lists`);
