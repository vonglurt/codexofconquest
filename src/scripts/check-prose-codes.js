#!/usr/bin/env node
// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02jx — a node code printed at the player must name a node.
//
// `quest_depth_01` told the player "the archival from HKG to AC" from the day it was
// written until §DX-02ju, and nothing could see it: `./bin/api audit` checks structure,
// not prose; `check:legacycodes` reads docs, and looks for RETIRED codes. `AC` was never
// a code at all.
//
// The rule is ADJACENCY, because the naive one is unusable: every code-shaped token that
// resolves to nothing is mostly ability scores and abbreviations (WIS, INT, CHA …). A
// token is flagged only when it resolves to neither a live NODE_MAP key nor a LEGACY
// CODE MAP row AND sits within 40 characters of a token that IS a live node code —
// "from HKG to AC" is exactly that shape. The report prints both counts, so the
// false-positive budget the rule declined is visible, not inferred.
//
// Scope is the text a player reads: the quest fields and the bit fields that reach the
// screen (walked through onPass/onFail/choice options), and the node fields the story
// pane and the chips render. The live set is built from NODE_MAP KEYS — `THE` has no
// `code` field, and a set built from `code` would turn its false positives into misses.
//
// Run: node scripts/check-prose-codes.js [--selftest]
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const WBAPI = require(path.join(ROOT, 'src', 'js', 'wbapi-core.js'));
const L = require(path.join(__dirname, 'legacy-codes.js'));

const QUEST_FIELDS = ['title', 'desc', 'hint', 'passText', 'failText', 'vignetteText', 'vignetteTextAlt', 'rumor'];
const BIT_FIELDS = ['msg', 'knowledge', 'refuse', 'prompt', 'label'];
const NODE_FIELDS = ['label', 'text', 'desc', 'npc', 'loot'];
const WINDOW = 40;
const TOKEN = /\b[A-Z][A-Z0-9]{1,3}\b/g;
// An unresolved roman numeral is a numeral: "SEN-01: The Oilcloth Chart (III)" sits beside
// a live code fourteen times over. Live codes that look roman (`CI`) resolve before this.
const ROMAN = /^(?=[MDCLXVI])M*(C[MD]|D?C{0,3})(X[CL]|L?X{0,3})(I[XV]|V?I{0,3})$/;

// Each adjacency hit that is not a code, keyed `<entity>.<field-path>:<token>`.
const ALLOWED = {
  'quest:quest_wis_06.hint:WIS': '"at VS to choose: accept (WIS Insight DC 14)" — VS is Visby Underground; WIS is the ability',
  'node:SPB.text:WORK': '"HONEST WORK IN THE EAST" — THE is a live node (Thessaloniki); WORK is a stencilled word',
  'node:SPB.text:EAST': '"HONEST WORK IN THE EAST" — THE is a live node (Thessaloniki); EAST is a stencilled word',
};

function prose(questDb, nodeMap) {
  const out = [];
  const add = (where, field, s) => { if (typeof s === 'string' && s) out.push({ where, field, text: s }); };
  const walk = (id, bits, p) => (bits || []).forEach((b, i) => {
    if (!b || typeof b !== 'object') return;
    for (const f of BIT_FIELDS) add(`quest:${id}`, `${p}[${i}].${f}`, b[f]);
    walk(id, b.onPass, `${p}[${i}].onPass`);
    walk(id, b.onFail, `${p}[${i}].onFail`);
    (b.options || []).forEach((o, j) => {
      add(`quest:${id}`, `${p}[${i}].options[${j}].label`, o && o.label);
      walk(id, o && o.bits, `${p}[${i}].options[${j}].bits`);
    });
  });
  for (const [id, q] of Object.entries(questDb)) {
    for (const f of QUEST_FIELDS) add(`quest:${id}`, f, q[f]);
    walk(id, q.bits, 'bits');
    walk(id, Array.isArray(q.onComplete) ? q.onComplete : [], 'onComplete');
  }
  for (const [code, n] of Object.entries(nodeMap)) for (const f of NODE_FIELDS) add(`node:${code}`, f, n[f]);
  return out;
}

function scan(questDb, nodeMap, legacy) {
  const live = new Set(Object.keys(nodeMap));
  // legacy-codes.js's AMBIGUOUS / NOT_A_NODE_CODE lists are the DOC scanner's, and they
  // classify `AC` as armor class — so they thin the naive count and never the adjacency
  // rule, or the gate would be blind to the one instance it was written for.
  const unresolved = t => !live.has(t) && !legacy.has(t) && !ROMAN.test(t);
  const docNoise = t => L.AMBIGUOUS.has(t) || L.NOT_A_NODE_CODE.has(t);
  const naive = new Set(); let naiveOcc = 0;
  const hits = [];
  for (const { where, field, text } of prose(questDb, nodeMap)) {
    const toks = [...text.matchAll(TOKEN)];
    for (const m of toks) {
      if (!unresolved(m[0])) continue;
      if (!docNoise(m[0])) { naive.add(m[0]); naiveOcc++; }
      const near = toks.find(o => o !== m && live.has(o[0]) && Math.abs(o.index - m.index) <= WINDOW);
      if (near) hits.push({ key: `${where}.${field}:${m[0]}`, where, field, token: m[0], near: near[0],
        context: text.slice(Math.max(0, m.index - 50), m.index + 20).replace(/\s+/g, ' ') });
    }
  }
  return { hits, naive: naive.size, naiveOcc };
}

function legacyCodes() {
  return new Set(L.loadLegacyMap(fs.readFileSync(path.join(ROOT, 'docs', 'maps', 'node-index.md'), 'utf8')).keys());
}

function verdict(r) {
  const findings = r.hits.filter(h => !ALLOWED[h.key]).map(h =>
    `${h.where} ${h.field} — "${h.token}" sits beside live code ${h.near} and names no node: …${h.context}…`);
  const seen = new Set(r.hits.map(h => h.key));
  for (const k of Object.keys(ALLOWED)) if (!seen.has(k)) findings.push(`[stale-allow] ${k} is allowlisted and no longer occurs — drop it`);
  return findings;
}

WBAPI.load(path.join(ROOT, 'play.html'));
const legacy = legacyCodes();

if (process.argv.includes('--selftest')) {
  let pass = 0, fail = 0;
  const ok = (c, m) => { if (c) { pass++; } else { fail++; console.log('  ✗ FAIL:', m); } };
  const base = verdict(scan(WBAPI.questDb, WBAPI.nodeMap, legacy));
  ok(base.length === 0, `the live world is clean (${base.join(' | ')})`);
  // §DX-02ju's own negative control — the knowledge line as it shipped before the fix.
  const planted = { ...WBAPI.questDb, quest_depth_01: { ...WBAPI.questDb.quest_depth_01,
    bits: [{ kind: 'reward', knowledge: "Both the Antecedent's archival installation (HKG→AC) and the tidal installation were built on one foundation." }] } };
  const f = verdict(scan(planted, WBAPI.nodeMap, legacy));
  ok(f.length === 1 && f[0].includes('quest:quest_depth_01') && f[0].includes('bits[0].knowledge') && f[0].includes('"AC"'),
    `HKG→AC is named by quest, field and token (${f.join(' | ')})`);
  const own = q => scan({ Q: q }, WBAPI.nodeMap, legacy).hits.filter(h => h.where === 'quest:Q').length;
  ok(own({ title: 'The HKG road is long, and at its end is a place the maps never recorded, AC' }) === 0, 'a token outside the window is not flagged');
  ok(own({ title: 'SEN-01: The Oilcloth Chart (III)' }) === 0, 'a roman numeral beside a code is not flagged');
  ok(own({ title: 'from HKG to CI' }) === 0, 'a live code that looks roman resolves');
  ok(own({ title: 'from HKG to AC' }) === 1, 'a token the doc scanner calls armor class is still flagged beside a node code');
  ok(own({ bits: [{ kind: 'choice', prompt: 'p', options: [{ label: 'go HKG then QZX', bits: [] }] }] }) === 1, 'a choice option label is read');
  if (fail) { console.log(`\n✗ check-prose-codes selftest: ${fail} FAILED, ${pass} passed`); process.exit(1); }
  console.log(`✓ check-prose-codes selftest: all ${pass} checks pass`);
  return;
}

const r = scan(WBAPI.questDb, WBAPI.nodeMap, legacy);
const findings = verdict(r);
const texts = prose(WBAPI.questDb, WBAPI.nodeMap).length;
if (findings.length) {
  console.error(`✗ check:prosecodes — ${findings.length} code-shaped token(s) printed beside a node code name no node:\n`);
  findings.forEach(f => console.error('  ' + f));
  console.error('\n  Fix the prose, or — if the token is not meant as a place — allowlist it in ALLOWED with the reason.');
  process.exit(1);
}
console.log(`✓ check:prosecodes — ${texts} player-facing strings: ${r.hits.length} adjacency hit(s), all ${Object.keys(ALLOWED).length} allowlisted by name `
  + `(the naive rule would flag ${r.naive} distinct tokens over ${r.naiveOcc} occurrences)`);
