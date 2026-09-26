#!/usr/bin/env node
// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §AUDIT-03ba — a comment in `play.html`'s script that names a place by an uppercase code
// must name a live NODE_MAP key. Documentation authors read the world from these comments,
// and every other node-code scanner here is comment-blind on purpose (§AUDIT-03f), so this
// one reads comments only.
//
// A token counts only in a place context: `at XX`, `XX node(s)`, `Node XX`, `(XX —`,
// `(XX)`, `visit(s) XX`, `XX and YY nodes`. A token that resolves in no NODE_MAP key must be
// in NOT_A_NODE (a word or class, with the reason) or in PENDING (a dead code not yet
// rewritten, with its exact count and the row that owns it). Both tables are
// ratchets: an entry whose count no longer matches the file fails, so it is lowered as the
// comments are fixed and cannot outlive them.
// Asserts only, never rewrites (§DX-02fx).
// Run: node scripts/check-comment-codes.js [--selftest]
'use strict';
const fs = require('fs');
const path = require('path');
const HTML = path.join(__dirname, '..', '..', 'play.html');

const NOT_A_NODE = {
  EB: 'Epic Battleground, a node class (`EB node`)',
  NG: 'New Game+ (`NG+`)',
  NPC: 'non-player character',
  UI: 'user interface',
  WIS: 'the Wisdom save',
  AND: 'the boolean operator',
  LXX: 'a section number (§LXX)',
  KEY: 'English, "the node KEY"',
  CSS: 'stylesheet',
};

const PENDING = {
  CO: { n: 1, row: '§AUDIT-03ba-FU', note: '→ TLS, QUEST_DB §D02-10 banner; needs ./bin/api sub' },
  MM: { n: 1, row: '§AUDIT-03ba-FU', note: '→ LIM, QUEST_DB §D02-08 banner; needs ./bin/api sub' },
  AT: { n: 1, row: '§AUDIT-03ba-FU', note: '→ RAI, QUEST_DB §D02-01 banner; needs ./bin/api sub' },
  WK: { n: 1, row: '§AUDIT-03ba-FU', note: '→ SZG, QUEST_DB §D02-06 banner; needs ./bin/api sub' },
  YC: { n: 1, row: '§AUDIT-03ba-FU', note: '→ SSJ, QUEST_DB §XLV comment; needs ./bin/api sub' },
  LT: { n: 1, row: '§AUDIT-03ba-FU', note: '→ KYA, QUEST_DB quest_stoning_lystra comment; needs ./bin/api sub' },
};

const CONTEXTS = [
  /\bat ([A-Z]{2,3})\b/g, /\b([A-Z]{2,3}) nodes?\b/g, /\b[Nn]ode ([A-Z]{2,3})\b/g,
  /\(([A-Z]{2,3}) —/g, /\(([A-Z]{2,3})\)/g, /\bvisits? ([A-Z]{2,3})\b/g,
  /\b([A-Z]{2,3}) and [A-Z]{2,3} nodes\b/g,
];

function nodeKeys(src) {
  const a = src.indexOf('const NODE_MAP = {');
  const b = src.indexOf('WORLDBUILDER:NODE_MAP:END');
  if (a < 0 || b < 0) return null;
  return new Set([...src.slice(a, b).matchAll(/^\s{2}([A-Z][A-Z0-9_]*)\s*:\s*\{/gm)].map((m) => m[1]));
}

// Every `//` and `/* */` comment in the text, with its line; strings are skipped whole so a
// URL's `//` is not a comment.
function comments(s, firstLine = 1) {
  const out = [];
  let i = 0, line = firstLine;
  const n = s.length;
  const count = (a, b) => { for (let k = a; k < b; k++) if (s[k] === '\n') line++; };
  while (i < n) {
    const c = s[i];
    if (c === '/' && s[i + 1] === '/') {
      let j = s.indexOf('\n', i); if (j < 0) j = n;
      out.push({ line, text: s.slice(i + 2, j) }); i = j; continue;
    }
    if (c === '/' && s[i + 1] === '*') {
      let j = s.indexOf('*/', i); j = j < 0 ? n : j + 2;
      s.slice(i + 2, j - 2).split('\n').forEach((t, k) => out.push({ line: line + k, text: t }));
      count(i, j); i = j; continue;
    }
    if (c === "'" || c === '"' || c === '`') {
      let j = i + 1;
      while (j < n && s[j] !== c) { if (s[j] === '\\') j++; j++; }
      j++; count(i, j); i = j; continue;
    }
    if (c === '\n') line++;
    i++;
  }
  return out;
}

function scan(src, notANode = NOT_A_NODE, pending = PENDING) {
  const keys = nodeKeys(src);
  if (!keys || keys.size === 0) return { findings: ['NODE_MAP not found — the section markers have moved'], hits: 0 };
  const at = src.indexOf('<script>');
  const script = at < 0 ? src : src.slice(at);
  const first = at < 0 ? 1 : src.slice(0, at).split('\n').length;
  const seen = {};
  const findings = [];
  let hits = 0;
  for (const c of comments(script, first)) {
    for (const re of CONTEXTS) {
      for (const m of c.text.matchAll(re)) {
        const t = m[1];
        if (keys.has(t)) continue;
        hits++;
        seen[t] = (seen[t] || 0) + 1;
        if (!(t in notANode) && !(t in pending)) {
          findings.push(`line ${c.line}: "${t}" names a place and is no NODE_MAP key — ${c.text.trim().slice(0, 100)}`);
        }
      }
    }
  }
  for (const t of Object.keys(notANode)) {
    if (keys.has(t)) findings.push(`NOT_A_NODE lists "${t}", which is now a NODE_MAP key — remove the entry`);
    else if (!seen[t]) findings.push(`NOT_A_NODE lists "${t}", which no comment uses in a place context any more — remove the entry`);
  }
  for (const [t, e] of Object.entries(pending)) {
    const got = seen[t] || 0;
    if (got !== e.n) findings.push(`PENDING says ${e.n} × "${t}" (${e.row}), the file has ${got} — set it to ${got}${got ? '' : ' by removing the entry'}`);
  }
  return { findings, hits };
}

if (process.argv.includes('--selftest')) {
  let pass = 0, fail = 0;
  const ok = (c, m) => { if (c) pass++; else { fail++; console.log('  ✗ FAIL:', m); } };
  const file = (body) => ['// ◆◆◆ WORLDBUILDER:NODE_MAP:START ◆◆◆', 'const NODE_MAP = {', '  LLA:{ num:1 },', '  TLS:{ num:2 },', '};',
    '// ◆◆◆ WORLDBUILDER:NODE_MAP:END ◆◆◆', '<script>', ...body].join('\n');
  const none = {};
  ok(scan(file(['// ── Gigault stall at LLA ──']), none, none).findings.length === 0, 'a comment naming a live node is clean');
  const dead = scan(file(['x();', '// ── Gigault stall at BA ──']), none, none).findings;
  ok(dead.length === 1 && dead[0].startsWith('line 9: "BA"'), 'a dead code in a place context is named with its line');
  ok(scan(file(['// ── Codex Core (CO — Loop Heart) ──']), none, none).findings.some((f) => f.includes('"CO"')), 'the `(XX —` context is read');
  ok(scan(file(['// ── Node MM — Mimic Meadows ──']), none, none).findings.some((f) => f.includes('"MM"')), 'the `Node XX` context is read');
  ok(scan(file(['// ── SF and TL nodes ──']), none, none).findings.length === 2, 'both codes in `XX and YY nodes` are read');
  ok(scan(file(['// Dispatch is IN PLACE; see CO-001']), none, none).findings.length === 0, 'an uppercase word outside a place context is not a hit');
  ok(scan(file(["const u = 'https://x.org/at BA';"]), none, none).findings.length === 0, 'a `//` inside a string is not a comment');
  ok(scan(file(['s = 1; /* fires', '   at BA */']), none, none).findings.some((f) => f.startsWith('line 9:')), 'a block comment is read line by line');
  ok(scan(file(['// seed it in a random EB node']), { EB: 'class' }, none).findings.length === 0, 'a NOT_A_NODE word is allowed');
  ok(scan(file(['// nothing']), { EB: 'class' }, none).findings.some((f) => f.includes('no comment uses')), 'a NOT_A_NODE entry nothing uses is stale');
  ok(scan(file(['// at BA']), none, { BA: { n: 1, row: '§X' } }).findings.length === 0, 'a PENDING code at its exact count is allowed');
  ok(scan(file(['// at BA', '// at BA']), none, { BA: { n: 1, row: '§X' } }).findings.some((f) => f.includes('the file has 2')), 'a PENDING count that grew fails');
  ok(scan(file(['// at LLA']), none, { BA: { n: 1, row: '§X' } }).findings.some((f) => f.includes('by removing the entry')), 'a PENDING entry fixed to zero must be removed');
  ok(scan(file(['// at BA']).replace('const NODE_MAP', 'const NM'), none, none).findings[0].includes('NODE_MAP not found'), 'a moved NODE_MAP is a finding, not a pass');
  if (fail) { console.log(`\n✗ check-comment-codes selftest: ${fail} FAILED, ${pass} passed`); process.exit(1); }
  console.log(`✓ check-comment-codes selftest: all ${pass} checks pass`);
  return;
}

const { findings, hits } = scan(fs.readFileSync(HTML, 'utf8'));
if (findings.length) {
  findings.forEach((f) => console.log('  ✗ ' + f));
  console.log(`\n✗ check-comment-codes: ${findings.length} finding(s)`);
  console.log('  Name the live NODE_MAP key the code under the comment runs at, after checking its guard.');
  process.exit(1);
}
const pend = Object.values(PENDING).reduce((s, e) => s + e.n, 0);
console.log(`✓ §AUDIT-03ba comment node codes: every place-context code in play.html's comments is a live node, `
  + `apart from ${hits - pend} word(s) in NOT_A_NODE and ${pend} pending in ${Object.keys(PENDING).length} code(s) owned by §AUDIT-03ba-FU`);
