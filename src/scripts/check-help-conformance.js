#!/usr/bin/env node
// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02jg — `GET /api/help[/{topic}]` is the WBAPI's only self-documenting surface, and
// every value it quotes also exists as a constant a few thousand lines away in the same
// file. Prose and constant drift apart silently: the help is never executed, so a wrong
// TTL, a retired enum member or a missing collection reads exactly like a right one.
//
// Three tables have a single source each, and only those are asserted here:
//   NONCE_TTL           ↔ the `nonce` topic's "Nonces expire N minutes after issue"
//   validTypes          ↔ the `nonce` topic's "type: a | b | c" line
//   Object.keys(exportMap) ↔ the `export` topic's COLLECTIONS block
// A documented value whose "source" is three constants that disagree with each other is
// not a conformance failure but a design question, and is not asserted here.
//
// Both sides are read out of the source text: the help object is built inside the request
// handler, so it is lifted by brace-matching and evaluated with the two interpolations it
// uses. Every extractor reports when it matches nothing — a gate that cannot find its own
// table must go red, not green, or it asserts nothing while looking identical.
//
// Asserts only, never rewrites (§DX-02fx).
// Run: node scripts/check-help-conformance.js [--selftest]
'use strict';
const fs = require('fs');
const path = require('path');
const SERVER = path.join(__dirname, '..', 'js', 'wbapi-server.js');

// The `{…}` literal that follows a marker, brace-matched so nested objects survive.
function braceSpan(src, marker) {
  const i = src.indexOf(marker);
  if (i < 0) return null;
  let depth = 0;
  for (let k = src.indexOf('{', i); k < src.length; k++) {
    if (src[k] === '{') depth++;
    else if (src[k] === '}' && --depth === 0) return src.slice(src.indexOf('{', i), k + 1);
  }
  return null;
}

const evalLiteral = (literal, args = {}) => {
  const keys = Object.keys(args);
  return new Function(...keys, `return (${literal});`)(...keys.map(k => args[k]));
};

function lift(src) {
  const out = { problems: [] };
  const need = (name, value) => {
    if (value === null || value === undefined) out.problems.push(`[source] ${name} not found in wbapi-server.js — the gate cannot read the table it asserts`);
    return value;
  };

  const ttl = /^const NONCE_TTL = (.+);$/m.exec(src);
  out.nonceTtlMs = need('const NONCE_TTL', ttl && evalLiteral(ttl[1]));

  const vt = /^\s*const validTypes = (\[[^\]]*\]);$/m.exec(src);
  out.nonceTypes = need('const validTypes', vt && evalLiteral(vt[1]));

  const map = need('const exportMap', braceSpan(src, 'const exportMap = {'));
  out.exportKeys = map ? Object.keys(evalLiteral(map)) : null;

  const help = need('const HELP', braceSpan(src, 'const HELP = {'));
  out.help = help ? evalLiteral(help, { b: 'http://localhost:1367', PORT: 1367 }) : null;
  return out;
}

// A topic's body is written as an array of lines and `.join('\n')`ed at the definition
// site, so it arrives here already a string; both shapes are accepted.
function topicLines(help, topic) {
  const body = help && help[topic] && help[topic].body;
  if (Array.isArray(body)) return body.join('\n').split('\n');
  if (typeof body === 'string') return body.split('\n');
  return null;
}

// "  Nonces expire 5 minutes after issue."
function docTtlMinutes(lines) {
  for (const l of lines) {
    const m = /Nonces expire (\d+) minutes? after issue/.exec(l);
    if (m) return Number(m[1]);
  }
  return null;
}

// "  type: node | quest | monster | npc | snapshot"
function docPipeList(lines, label) {
  for (const l of lines) {
    const m = new RegExp(`^\\s*${label}:\\s*([a-z_-]+(?:\\s*\\|\\s*[a-z_-]+)+)\\s*$`).exec(l);
    if (m) return m[1].split('|').map(s => s.trim());
  }
  return null;
}

// The COLLECTIONS block: "  node_map        — NODE_MAP object", to the first blank line.
function docCollections(lines) {
  const start = lines.findIndex(l => /^COLLECTIONS\s*$/.test(l));
  if (start < 0) return null;
  const out = [];
  for (const l of lines.slice(start + 1)) {
    if (!l.trim()) break;
    const m = /^ {2}([a-z_]+)\s+—/.exec(l);
    if (m) out.push(m[1]);
  }
  return out.length ? out : null;
}

const setDiff = (a, b) => a.filter(x => !b.includes(x));

function scan(src) {
  const lifted = lift(src);
  const findings = lifted.problems.slice();
  if (findings.length) return findings;

  const nonce = topicLines(lifted.help, 'nonce');
  const exp = topicLines(lifted.help, 'export');
  if (!nonce) findings.push('[source] the help has no `nonce` topic — the gate cannot read the table it asserts');
  if (!exp) findings.push('[source] the help has no `export` topic — the gate cannot read the table it asserts');
  if (findings.length) return findings;

  const mins = docTtlMinutes(nonce);
  if (mins === null) {
    findings.push('[nonce/ttl] the `nonce` topic no longer states an expiry in the expected form');
  } else if (mins * 60 * 1000 !== lifted.nonceTtlMs) {
    findings.push(`[nonce/ttl] the help says nonces expire after ${mins} minute(s); NONCE_TTL is ${lifted.nonceTtlMs}ms (${lifted.nonceTtlMs / 60000} minute(s))`);
  }

  const types = docPipeList(nonce, 'type');
  if (types === null) {
    findings.push('[nonce/types] the `nonce` topic no longer lists its `type` values in the expected form');
  } else {
    const extra = setDiff(types, lifted.nonceTypes);
    const missing = setDiff(lifted.nonceTypes, types);
    if (extra.length) findings.push(`[nonce/types] the help offers ${extra.map(t => `"${t}"`).join(', ')}, which validTypes rejects with 400`);
    if (missing.length) findings.push(`[nonce/types] validTypes accepts ${missing.map(t => `"${t}"`).join(', ')}, which the help does not offer`);
  }

  const cols = docCollections(exp);
  if (cols === null) {
    findings.push('[export/collections] the `export` topic no longer carries a COLLECTIONS block in the expected form');
  } else {
    const extra = setDiff(cols, lifted.exportKeys);
    const missing = setDiff(lifted.exportKeys, cols);
    if (extra.length) findings.push(`[export/collections] the help documents ${extra.map(c => `"${c}"`).join(', ')}, which exportMap answers 404 for`);
    if (missing.length) findings.push(`[export/collections] exportMap exports ${missing.map(c => `"${c}"`).join(', ')}, which the help does not list`);
  }
  return findings;
}

if (process.argv.includes('--selftest')) {
  let pass = 0, fail = 0;
  const ok = (c, m) => { if (c) pass++; else { fail++; console.log('  ✗ FAIL:', m); } };

  const stub = (over = {}) => {
    const o = {
      ttl: '5 * 60 * 1000',
      types: "['node','quest','monster','npc','snapshot']",
      cols: ['node_map', 'quest_db', 'condition_items'],
      docTtl: 'Nonces expire 5 minutes after issue. Read expiresAt.',
      docTypes: '  type: node | quest | monster | npc | snapshot',
      docCols: ['node_map', 'quest_db', 'condition_items'],
      ...over,
    };
    return [
      `const NONCE_TTL = ${o.ttl};`,
      '  const exportMap = {',
      ...o.cols.map(c => `    ${c}: () => WBAPI.x,`),
      '  };',
      "      const validTypes = " + o.types + ";",
      '    const HELP = {',
      '      nonce: { title: "n", body: [',
      `        ${JSON.stringify(o.docTypes)},`,
      `        ${JSON.stringify('  ' + o.docTtl)},`,
      '      ] },',
      '      export: { title: "e", body: [',
      '        "COLLECTIONS",',
      ...o.docCols.map(c => `        ${JSON.stringify(`  ${c}        — ${c.toUpperCase()} object`)},`),
      '        "",',
      '        "FORMATS",',
      '      ] },',
      '    };',
    ].join('\n');
  };

  ok(scan(stub()).length === 0, 'a help that agrees with all three constants produces no findings');

  ok(scan(stub({ ttl: '60 * 1000' })).some(f => f.startsWith('[nonce/ttl]')),
    'a TTL constant five times shorter than the prose is caught');
  ok(scan(stub({ docTtl: 'Nonces expire 60 minutes after issue.' })).some(f => f.includes('60 minute')),
    'the finding names the number the help states, not only the constant');

  ok(scan(stub({ docTypes: '  type: node | quest | monster | npc | terrain' })).some(f => f.includes('rejects with 400')),
    'a documented enum value the validator rejects is caught and named');
  ok(scan(stub({ docTypes: '  type: node | quest | monster | npc' })).some(f => f.includes('does not offer')),
    'a validator value the help omits is caught — the check runs in both directions');

  ok(scan(stub({ docCols: ['node_map', 'quest_db'] })).some(f => f.includes('"condition_items"') && f.includes('does not list')),
    'a collection exportMap serves and the help omits is caught');
  ok(scan(stub({ cols: ['node_map', 'quest_db'] })).some(f => f.includes('404')),
    'a collection the help documents and exportMap has dropped is caught');

  ok(scan(stub({ docTtl: 'Nonces go stale eventually.' })).some(f => f.includes('no longer states an expiry')),
    'prose that no longer states an expiry goes RED, not silently green');
  ok(scan(stub({ docTypes: '  kind: node | quest' })).some(f => f.includes('no longer lists its `type` values')),
    'a `type` line the extractor cannot match goes RED, not silently green');
  ok(scan(stub().replace('"COLLECTIONS",', '"COLLECTION LIST",')).some(f => f.includes('no longer carries a COLLECTIONS block')),
    'a COLLECTIONS block the extractor cannot find goes RED, not silently green');
  ok(scan('const x = 1;').some(f => f.startsWith('[source]')),
    'a source with none of the three tables goes RED — the gate cannot pass by failing to look');

  ok(braceSpan('const q = { a: { b: 1 }, c: 2 };', 'const q =') === '{ a: { b: 1 }, c: 2 }',
    'brace-matching survives a nested object');

  // The live topics `.join('\n')` at the definition site, so the real run reads a string
  // body while the stubs above read an array. Both paths are exercised.
  const joined = stub().replace(/body: \[([\s\S]*?)\n(\s*)\] \}/g, 'body: [$1\n$2].join("\\n") }');
  ok(joined !== stub() && scan(joined).length === 0, 'a topic whose body is joined to a string is read the same as one left as an array');
  ok(scan(joined.replace('5 * 60 * 1000', '60 * 1000')).some(f => f.startsWith('[nonce/ttl]')),
    'the string-body path catches a wrong TTL too — the real run is not the untested one');

  if (fail) { console.log(`\n✗ check-help-conformance selftest: ${fail} FAILED, ${pass} passed`); process.exit(1); }
  console.log(`✓ check-help-conformance selftest: all ${pass} checks pass`);
  return;
}

const findings = scan(fs.readFileSync(SERVER, 'utf8'));
if (findings.length) {
  findings.forEach(f => console.log('  ✗ ' + f));
  console.log(`\n✗ check-help-conformance: ${findings.length} finding(s)`);
  console.log('  `GET /api/help` is documentation the server never executes. Correct the prose');
  console.log('  in wbapi-server.js\'s HELP object, or the constant, so the two agree (§DX-02jg).');
  process.exit(1);
}
console.log('✓ §DX-02jg help conformance: NONCE_TTL, the nonce `type` list and every exportMap collection match the help that documents them');
