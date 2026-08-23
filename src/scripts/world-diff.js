#!/usr/bin/env node
// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
'use strict';
// world-diff.js — §MESH-01d3 modification-set inspector (§MESH-01-FU 9: deep diff).
//
//   node src/scripts/world-diff.js <mine.html> <theirs.html> [--json]
//   node src/scripts/world-diff.js --selftest
//
// Compares two CodexOfConquest world files the way the mesh does: per data collection
// (the 8 manifest parts) plus ENGINE_VER, then hashes everything OUTSIDE the
// data spans. A downloaded world is someone else's CODE — if this prints the
// CODE DIFFERS block, review every non-data change by hand before opening it.
//
// Per-part reporting is a DEEP DIFF when wbapi-core.js is importable (the
// normal case — this script lives in the repo): each collection is parsed with
// the same extractObj/removeFns/P-proxy pipeline the worldbuilder uses, every
// part is normalized to a keyed object (SEA_LANES cells become keys), and a
// changed entry lists its exact field paths — functions compared by source
// text, so an edited hook body inside a data span is named, not silent.
// Without wbapi-core (script copied standalone) it falls back to the old
// indent-regex key approximation, labelled `mode:'approx'`.
//
// --json prints one machine-readable report object and nothing else.
// --selftest diffs synthetic in-memory worlds and asserts the report
//   (`npm run check:worlddiff`; CI: walk-invariants.yml `invariants` job).
//
// Exit codes: 0 identical · 1 data differs (code identical) · 2 CODE differs
// (--selftest: 0 pass, 1 fail; usage error: 64).
// rawSpan/sha16 mirror wbapi-server.js.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PARTS = ['NODE_MAP', 'NODE_COORDS', 'SEA_RUNS', 'SEA_LANES', 'ROAD_RUNS', 'QUEST_DB', 'MONSTER_POOL', 'WORLD_DB'];
const sha16 = (s) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);

let CORE = null;
try { CORE = require(path.join(__dirname, '..', 'js', 'wbapi-core.js'))._parse || null; } catch { CORE = null; }

function rawSpan(src, name) {
  const m = new RegExp(`(?:const|let|var)\\s+${name}\\s*=\\s*`).exec(src);
  if (!m) return null;
  let i = m.index + m[0].length;
  while (i < src.length && !'{[('.includes(src[i])) {
    if (src[i] === '\n' || src[i] === ';') return null;
    i++;
  }
  if (i >= src.length) return null;
  const open = src[i], close = { '{': '}', '[': ']', '(': ')' }[open];
  let depth = 0, inStr = null, j = i;
  while (j < src.length) {
    const c = src[j];
    if (inStr) {
      if (c === '\\' && inStr !== '`') { j += 2; continue; }
      if (c === inStr) inStr = null;
    } else if (c === '/' && src[j + 1] === '/') { while (j < src.length && src[j] !== '\n') j++; continue; }
    else if (c === '/' && src[j + 1] === '*') { j += 2; while (j < src.length && !(src[j] === '*' && src[j + 1] === '/')) j++; j += 2; continue; }
    else {
      if (c === '"' || c === "'" || c === '`') inStr = c;
      else if (c === open) depth++;
      else if (c === close) { depth--; if (depth === 0) return src.slice(m.index, j + 1); }
    }
    j++;
  }
  return null;
}

// Fallback approximate entry keys (pre-FU-9 behavior) — used only when the
// wbapi-core pipeline is unavailable or a span defeats the deep parse.
function keysOfApprox(name, span) {
  if (!span) return new Set();
  if (name === 'QUEST_DB' || name === 'MONSTER_POOL')
    return new Set([...span.matchAll(/\b(?:id|key)\s*:\s*['"]([^'"]+)['"]/g)].map((m) => m[1]));
  return new Set([...span.matchAll(/^\s{1,6}(['"]?)([A-Za-z0-9_ ]+)\1\s*:\s*[{[]/gm)].map((m) => m[2]));
}
const engineVerOf = (src) => (src.match(/const\s+ENGINE_VER\s*=\s*['"]([^'"]+)['"]/) || [])[1] || 'unversioned';

// ── deep parse: one keyed object per part, via the worldbuilder pipeline ─────
function parsePart(src, name) {
  if (!CORE) return null;
  const sect = (n) => CORE.extrSection(src, n) || src;  // markerless files (selftest) search the whole source
  try {
    switch (name) {
      case 'NODE_MAP':     return CORE.parseSimple(sect('NODE_MAP'), 'NODE_MAP');
      case 'NODE_COORDS':  return CORE.parseSimple(sect('NODE_COORDS'), 'NODE_COORDS');
      case 'QUEST_DB':     return CORE.parseSanitized(sect('QUEST_DB'), 'QUEST_DB');
      case 'MONSTER_POOL': return CORE.parseSimple(sect('MONSTER_POOL').split('◆◆◆ WORLDBUILDER:MONSTER_DROPS')[0], 'MONSTER_POOL');
      case 'WORLD_DB': {   // WORLD_DB monster lists reference P.<key> — same proxy wbapi-core.load uses
        const pool = CORE.parseSimple(sect('MONSTER_POOL').split('◆◆◆ WORLDBUILDER:MONSTER_DROPS')[0], 'MONSTER_POOL') || {};
        return CORE.parseWithP(sect('WORLD_DB'), 'WORLD_DB', pool);
      }
      case 'SEA_RUNS':
      case 'ROAD_RUNS':    return CORE.parseSimple(src, name);
      case 'SEA_LANES': {  // `new Set([...])` — normalize to {cell: true} so the keyed differ applies
        const span = rawSpan(src, 'SEA_LANES');
        if (!span) return null;
        const set = new Function('return (' + span.slice(span.indexOf('new')) + ')')();
        const o = {}; for (const cell of set) o[cell] = true;
        return o;
      }
    }
  } catch { return null; }
  return null;
}

// ── canonical compare: sorted keys; functions by source text ────────────────
function canon(v) {
  if (typeof v === 'function') return JSON.stringify(String(v));
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return '[' + v.map(canon).join(',') + ']';
  return '{' + Object.keys(v).sort().map((k) => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}';
}
function short(v) {
  const s = typeof v === 'function' ? String(v) : JSON.stringify(v);
  if (s === undefined) return '(absent)';
  return s.length > 60 ? s.slice(0, 57) + '…' : s;
}

// Exact field paths that differ between two entry values (capped).
function fieldDiffs(a, b, p = '', out = []) {
  if (out.length >= 40) return out;
  const leaf = (x) => x === null || typeof x !== 'object';
  if (leaf(a) || leaf(b) || Array.isArray(a) !== Array.isArray(b)) {
    if (canon(a) !== canon(b)) out.push({ path: p || '(value)', a: short(a), b: short(b) });
    return out;
  }
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
    if (out.length >= 40) break;
    const kp = Array.isArray(a) ? `${p}[${k}]` : p ? `${p}.${k}` : k;
    if (!(k in a)) out.push({ path: kp, a: '(absent)', b: short(b[k]) });
    else if (!(k in b)) out.push({ path: kp, a: short(a[k]), b: '(absent)' });
    else if (canon(a[k]) !== canon(b[k])) fieldDiffs(a[k], b[k], kp, out);
  }
  return out;
}

function keyedDiff(va, vb) {
  const added = Object.keys(vb).filter((k) => !(k in va));
  const removed = Object.keys(va).filter((k) => !(k in vb));
  const changed = [];
  for (const k of Object.keys(va)) {
    if (!(k in vb) || changed.length >= 200) continue;
    if (canon(va[k]) !== canon(vb[k])) changed.push({ key: k, fields: fieldDiffs(va[k], vb[k]) });
  }
  return { added, removed, changed };
}

// ── the diff engine (shared by CLI + selftest) ───────────────────────────────
function diffWorlds(A, B) {
  const report = {
    engineVer: { a: engineVerOf(A), b: engineVerOf(B) },
    mode: CORE ? 'deep' : 'approx', parts: {}, dataDiffers: false, codeDiffers: false,
  };
  let codeA = A, codeB = B;
  for (const name of PARTS) {
    const sa = rawSpan(A, name), sb = rawSpan(B, name);
    if (sa) codeA = codeA.replace(sa, `[DATA:${name}]`);
    if (sb) codeB = codeB.replace(sb, `[DATA:${name}]`);
    if (!sa || !sb) { report.parts[name] = { status: 'missing', missingIn: !sa ? 'A' : 'B' }; report.dataDiffers = true; continue; }
    if (sha16(sa) === sha16(sb)) { report.parts[name] = { status: 'identical', sha: sha16(sa) }; continue; }
    report.dataDiffers = true;
    const va = parsePart(A, name), vb = parsePart(B, name);
    // {} from the pipeline is indistinguishable from a failed parse — a real
    // collection is never empty, so 0 keys on both sides ⇒ fall back to approx.
    if (va && vb && (Object.keys(va).length || Object.keys(vb).length)) {
      report.parts[name] = { status: 'differs', mode: 'deep', sha: { a: sha16(sa), b: sha16(sb) }, ...keyedDiff(va, vb) };
    } else {
      const ka = keysOfApprox(name, sa), kb = keysOfApprox(name, sb);
      report.parts[name] = { status: 'differs', mode: 'approx', sha: { a: sha16(sa), b: sha16(sb) },
        added: [...kb].filter((k) => !ka.has(k)), removed: [...ka].filter((k) => !kb.has(k)), changed: [] };
    }
  }
  if (report.engineVer.a !== report.engineVer.b) report.dataDiffers = true;
  report.codeDiffers = sha16(codeA) !== sha16(codeB);
  report.exit = report.codeDiffers ? 2 : report.dataDiffers ? 1 : 0;
  return report;
}

// ── human printer ────────────────────────────────────────────────────────────
function printHuman(report, fileA, fileB, sizeA, sizeB) {
  console.log(`\nworld-diff — §MESH-01d3 modification-set inspector`);
  console.log(`  A (yours):  ${fileA}  (${sizeA.toLocaleString()} B, ${report.engineVer.a})`);
  console.log(`  B (theirs): ${fileB}  (${sizeB.toLocaleString()} B, ${report.engineVer.b})\n`);
  for (const name of PARTS) {
    const p = report.parts[name];
    if (p.status === 'missing') { console.log(`  ⛔ ${name.padEnd(13)} MISSING in ${p.missingIn}`); continue; }
    if (p.status === 'identical') { console.log(`  ✅ ${name.padEnd(13)} identical (${p.sha})`); continue; }
    const approx = p.mode === 'approx' ? ' (approx — deep parse unavailable)' : '';
    console.log(`  🔶 ${name.padEnd(13)} DIFFERS — ${p.added.length} added, ${p.removed.length} removed, ${p.changed.length} changed` +
      `${!p.added.length && !p.removed.length && !p.changed.length ? ' (same entries, contents edited)' : ''}${approx}`);
    if (p.added.length) console.log(`       + ${p.added.slice(0, 12).join(', ')}${p.added.length > 12 ? ` … +${p.added.length - 12} more` : ''}`);
    if (p.removed.length) console.log(`       - ${p.removed.slice(0, 12).join(', ')}${p.removed.length > 12 ? ` … +${p.removed.length - 12} more` : ''}`);
    for (const ch of p.changed.slice(0, 8)) {
      const fields = ch.fields.slice(0, 3).map((f) => `${f.path}: ${f.a} → ${f.b}`).join('  ·  ');
      console.log(`       ~ ${ch.key}: ${fields}${ch.fields.length > 3 ? `  … +${ch.fields.length - 3} more field(s)` : ''}`);
    }
    if (p.changed.length > 8) console.log(`       ~ … +${p.changed.length - 8} more changed entr${p.changed.length - 8 === 1 ? 'y' : 'ies'}`);
  }
  if (report.engineVer.a !== report.engineVer.b)
    console.log(`  🔶 ENGINE_VER differs: ${report.engineVer.a} vs ${report.engineVer.b}`);
  if (report.codeDiffers) {
    console.log(`\n  ${'⚠'.repeat(30)}`);
    console.log('  ⚠  CODE DIFFERS OUTSIDE THE DATA COLLECTIONS.');
    console.log('  ⚠  This file is not just a mod — its JAVASCRIPT is different from yours.');
    console.log('  ⚠  Do NOT open it in a browser until you have reviewed every change:');
    console.log(`  ⚠     git diff --no-index "${fileA}" "${fileB}" | less`);
    console.log('  ⚠  It is MIT-licensed; attribution carries. Inspect. Be responsible.');
    console.log(`  ${'⚠'.repeat(30)}\n`);
  } else {
    console.log(`\n  ✅ engine code identical outside the data collections${report.dataDiffers ? ' — this is a pure data/content mod' : ''}.\n`);
  }
}

// ── selftest: synthetic worlds, asserted report ──────────────────────────────
function selftest() {
  const fails = [];
  const ok = (cond, msg) => { console.log(`  ${cond ? '✓' : '✗'} ${msg}`); if (!cond) fails.push(msg); };
  const mk = (o = {}) => `<html><script>
const ENGINE_VER = '${o.ev || 'coc-test.1'}';
${o.NODE_MAP || `const NODE_MAP = {
  AA: { name: 'alpha', label: 'Alpha', hook: (s) => { return 1; } },
  BB: { name: 'beta' },
};`}
const NODE_COORDS = { AA: { r: 1, c: 2 }, BB: { r: 3, c: 4 } };
const SEA_RUNS = {0:[[1,4]],1:[[2,3]]};
${o.SEA_LANES || `const SEA_LANES = new Set(["1,2","3,4"]);`}
${o.ROAD_RUNS || `const ROAD_RUNS = {5:[[7,9]]};`}
${o.QUEST_DB || `const QUEST_DB = { q_one: { title: 'One', gate: {}, completion: { items: ['rope'] } }, q_two: { title: 'Two' } };`}
${o.MONSTER_POOL || `const MONSTER_POOL = { goblin: { name: 'Goblin', hp: 7, atk: 2 } };`}
${o.WORLD_DB || `const WORLD_DB = { forest: { label: 'Forest', monsters: [P.goblin] } };`}
${o.CODE || `function engineTick() { return 42; }`}
</${'script'}></html>`;

  console.log('\nworld-diff --selftest (§MESH-01-FU 9)');
  if (!CORE) { console.error('  ✗ wbapi-core.js not importable — the selftest requires the deep pipeline'); process.exit(1); }

  const A = mk();
  // identical
  const same = diffWorlds(A, A);
  ok(same.exit === 0 && !same.dataDiffers && !same.codeDiffers, 'identical worlds → exit 0, nothing differs');
  ok(PARTS.every((n) => same.parts[n].status === 'identical'), 'all 8 parts report identical');

  // data-only mod: adds/removes/field edits across the part shapes
  const B = mk({
    NODE_MAP: `const NODE_MAP = {
  AA: { name: 'alpha', label: 'Alpha', hook: (s) => { return 2; } },
  BB: { name: 'beta' },
  CC: { name: 'gamma' },
};`,
    QUEST_DB: `const QUEST_DB = { q_one: { title: 'One', gate: {}, completion: { items: ['lantern'] } } };`,
    MONSTER_POOL: `const MONSTER_POOL = { goblin: { name: 'Goblin', hp: 9, atk: 2 } };`,
    WORLD_DB: `const WORLD_DB = { forest: { label: 'Forest', monsters: [P.goblin, P.orc] } };`,
    SEA_LANES: `const SEA_LANES = new Set(["1,2","3,4","5,6"]);`,
    ROAD_RUNS: `const ROAD_RUNS = {5:[[7,10]]};`,
  });
  const r = diffWorlds(A, B);
  ok(r.exit === 1 && r.dataDiffers && !r.codeDiffers, 'data-only mod → exit 1 (code identical)');
  ok(r.mode === 'deep' && PARTS.filter((n) => r.parts[n].status === 'differs').every((n) => r.parts[n].mode === 'deep'),
    'every differing part used the deep wbapi-core parse');
  ok(r.parts.NODE_COORDS.status === 'identical' && r.parts.SEA_RUNS.status === 'identical', 'untouched parts stay identical');
  ok(JSON.stringify(r.parts.NODE_MAP.added) === '["CC"]' && !r.parts.NODE_MAP.removed.length, 'NODE_MAP: added entry keyed exactly');
  const hook = (r.parts.NODE_MAP.changed.find((c) => c.key === 'AA') || { fields: [] }).fields.find((f) => f.path === 'hook');
  ok(!!hook && /return 1/.test(hook.a) && /return 2/.test(hook.b), 'NODE_MAP: an edited function BODY inside a data span is named (hook)');
  ok(JSON.stringify(r.parts.QUEST_DB.removed) === '["q_two"]', 'QUEST_DB: removed quest keyed exactly');
  const qf = (r.parts.QUEST_DB.changed.find((c) => c.key === 'q_one') || { fields: [] }).fields[0] || {};
  ok(qf.path === 'completion.items[0]' && qf.a === '"rope"' && qf.b === '"lantern"', 'QUEST_DB: exact nested field path (completion.items[0]: "rope" → "lantern")');
  const mf = (r.parts.MONSTER_POOL.changed.find((c) => c.key === 'goblin') || { fields: [] }).fields[0] || {};
  ok(mf.path === 'hp' && mf.a === '7' && mf.b === '9', 'MONSTER_POOL: exact field diff (hp: 7 → 9)');
  const wfs = (r.parts.WORLD_DB.changed.find((c) => c.key === 'forest') || { fields: [] }).fields;
  const wf = wfs.find((f) => f.path === 'monsters[1]') || {};
  ok(wf.a === '(absent)' && /orc/.test(wf.b), 'WORLD_DB: P-proxy references parse; appended monster shows as monsters[1]');
  ok(wfs.some((f) => f.path === 'monsters[0].hp'), 'WORLD_DB: the P-resolved goblin (hp 7→9) surfaces through the embedded reference too');
  ok(JSON.stringify(r.parts.SEA_LANES.added) === '["5,6"]', 'SEA_LANES: Set normalized to keys — added cell listed');
  const rf = (r.parts.ROAD_RUNS.changed.find((c) => c.key === '5') || { fields: [] }).fields[0] || {};
  ok(rf.path === '[0][1]' && rf.a === '9' && rf.b === '10', 'ROAD_RUNS: run-range edit pinpointed ([0][1]: 9 → 10)');

  // code mod → exit 2 even with identical data
  const C = mk({ CODE: `function engineTick() { return 43; }` });
  const rc = diffWorlds(A, C);
  ok(rc.exit === 2 && rc.codeDiffers && PARTS.every((n) => rc.parts[n].status === 'identical'),
    'code edit outside the data spans → exit 2, all parts identical');

  // an ENGINE_VER bump lives OUTSIDE the data spans — it is a code change
  const rv = diffWorlds(A, mk({ ev: 'coc-test.2' }));
  ok(rv.exit === 2 && rv.codeDiffers && rv.engineVer.a !== rv.engineVer.b,
    'ENGINE_VER bump is flagged by name AND trips the code-differs gate (exit 2)');

  // approx fallback still functions with the pipeline gone
  const saved = CORE; CORE = null;
  const ra = diffWorlds(A, B);
  ok(ra.mode === 'approx' && ra.exit === 1 && ra.parts.NODE_MAP.mode === 'approx' && ra.parts.NODE_MAP.added.includes('CC'),
    'without wbapi-core the approx fallback still reports added/removed keys');
  CORE = saved;

  console.log(fails.length ? `\n✗ world-diff selftest: ${fails.length} failed` : '\n✓ world-diff selftest: all assertions hold');
  process.exit(fails.length ? 1 : 0);
}

// ── CLI ──────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
if (argv.includes('--selftest')) selftest();
else {
  const jsonMode = argv.includes('--json');
  const [fileA, fileB] = argv.filter((a) => !a.startsWith('--'));
  if (!fileA || !fileB) {
    console.error('usage: node src/scripts/world-diff.js <mine.html> <theirs.html> [--json]   |   --selftest');
    process.exit(64);
  }
  const A = fs.readFileSync(fileA, 'utf8');
  const B = fs.readFileSync(fileB, 'utf8');
  const report = diffWorlds(A, B);
  if (jsonMode) console.log(JSON.stringify({ a: fileA, b: fileB, ...report }, null, 2));
  else printHuman(report, fileA, fileB, A.length, B.length);
  process.exit(report.exit);
}
